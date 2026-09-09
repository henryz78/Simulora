import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PoolClient } from "pg";
import {
  contentHash,
  lanternReachSeed,
  participationCombinations,
  type ParticipationContract,
} from "../../packages/domain/src/index.js";
import {
  AccessDeniedError,
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const account = {
  accountId: "60000000-0000-4000-8000-000000000001",
  eligibility: "adult" as const,
};
const otherAccount = {
  accountId: "60000000-0000-4000-8000-000000000002",
  eligibility: "adult" as const,
};

suite("IP-6 participation and character authority against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterAll(async () => pool?.end());

  async function createContinuity(
    initial: ParticipationContract = {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    },
  ) {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    return repository.startContinuity(account, revision.revisionId, initial);
  }

  async function prepareOrdinaryAction(continuity: Awaited<ReturnType<typeof createContinuity>>) {
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `g6-authority-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora to inspect the western signal.",
    });
    const proposed = await repository.processAction(action.id, (request) =>
      new DeterministicModelGateway().generateWorldTurn(request),
    );
    if (!proposed?.proposal) throw new Error("Expected a confirmed-review Action proposal");
    return proposed;
  }

  it("commits all six independent contracts through direct user Actions only", async () => {
    const continuity = await createContinuity();
    let current = await repository.readCurrentState(account, continuity.continuityId);
    const initialWithoutParticipation = structuredClone(current.state);
    initialWithoutParticipation.participation = {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    };

    for (const after of participationCombinations) {
      const before = current.state.participation;
      const key = `participation-${randomUUID()}`;
      const changed = await repository.changeParticipationContract(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: key,
        expectedHeadCommitId: current.headCommitId,
        before,
        after,
      });
      expect(changed).toMatchObject({
        status: "COMMITTED",
        operationType: "CHANGE_PARTICIPATION_CONTRACT",
      });
      expect(changed.commit).not.toBeNull();
      const retry = await repository.changeParticipationContract(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: key,
        expectedHeadCommitId: current.headCommitId,
        before,
        after,
      });
      expect(retry.id).toBe(changed.id);

      current = await repository.readCurrentState(account, continuity.continuityId);
      expect(current.state.participation).toEqual(after);
      const comparable = structuredClone(current.state);
      comparable.participation = initialWithoutParticipation.participation;
      expect(comparable).toEqual(initialWithoutParticipation);
    }

    const events = await pool.query<{
      event_type: string;
      payload: { before: ParticipationContract; after: ParticipationContract };
    }>(
      `select event_type, payload
       from simulora.domain_events
       where branch_id = $1 and event_type = 'PARTICIPATION_CONTRACT_CHANGED'
       order by created_at`,
      [continuity.branchId],
    );
    expect(events.rows).toHaveLength(6);
    expect(events.rows.map((row) => row.payload.after)).toEqual(participationCombinations);
    expect(
      await pool.query(
        `select 1 from simulora.generation_attempts g
         join simulora.actions a on a.id = g.action_id
         where a.branch_id = $1 and a.operation_type = 'CHANGE_PARTICIPATION_CONTRACT'`,
        [continuity.branchId],
      ),
    ).toHaveProperty("rowCount", 0);
  });

  it("rejects stale/mismatched expectations before generation or World mutation", async () => {
    const continuity = await createContinuity();
    const beforeCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    await expect(
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `ordinary-mismatch-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
        intent: "Ask Iora about the signal.",
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-mismatch-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
        after: { initiativeMode: "GUIDED", structureMode: "GOAL_FRAMED" },
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      repository.changeParticipationContract(otherAccount, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `foreign-contract-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      }),
    ).rejects.toThrow(/Branch not found/);
    const afterCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    expect(afterCount.rows[0]?.count).toBe(beforeCount.rows[0]?.count);
  });

  it("allows at most one concurrent direct change against one Branch head", async () => {
    const continuity = await createContinuity();
    const attempts = await Promise.allSettled([
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-race-a-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      }),
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-race-b-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "WORLD_ACTIVE", structureMode: "GOAL_FRAMED" },
      }),
    ]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((result) => result.status === "rejected")).toHaveLength(1);
    const committed = await pool.query<{ count: number }>(
      `select count(*)::int as count from simulora.actions
       where branch_id = $1 and operation_type = 'CHANGE_PARTICIPATION_CONTRACT'
         and status = 'COMMITTED'`,
      [continuity.branchId],
    );
    expect(committed.rows[0]?.count).toBe(1);
  });

  it("rejects forged Action ownership and false terminal insertion at the database boundary", async () => {
    const continuity = await createContinuity();
    await pool.query(
      `insert into simulora.accounts (id, eligibility) values ($1, 'ADULT')
       on conflict (id) do nothing`,
      [otherAccount.accountId],
    );
    const values = [
      randomUUID(),
      account.accountId,
      continuity.continuityId,
      continuity.branchId,
      `false-terminal-${randomUUID()}`,
      continuity.headCommitId,
      JSON.stringify(continuity.state.participation),
      "Forge a terminal receipt",
    ];
    await expect(
      pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status, terminal_at)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'COMMITTED', now())`,
        values,
      ),
    ).rejects.toThrow(/must begin as ACKNOWLEDGED/);
    values[0] = randomUUID();
    values[1] = otherAccount.accountId;
    values[4] = `foreign-action-${randomUUID()}`;
    await expect(
      pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'ACKNOWLEDGED')`,
        values,
      ),
    ).rejects.toThrow(/Continuity owner and current active Branch head/);
  });

  it("keeps proposal and confirmation authority evidence immutable", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    await expect(
      pool.query(
        `update simulora.action_proposals
         set display_effect = jsonb_set(display_effect, '{after}', '"misleading"'::jsonb)
         where id = $1`,
        [proposal.id],
      ),
    ).rejects.toThrow(/proposal evidence is immutable/);
    const committed = await repository.confirmAction(account, proposed.id, {
      proposalId: proposal.id,
      proposalDigest: proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    await expect(
      pool.query(
        `update simulora.action_confirmations set proposal_digest = repeat('0', 64)
         where action_id = $1`,
        [proposed.id],
      ),
    ).rejects.toThrow(/action_confirmations is immutable/);
  });

  it("rejects wrong-source and arbitrary-state raw Action materialization", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    const prepareConfirmation = async (client: PoolClient) => {
      await client.query(
        `insert into simulora.action_confirmations
         (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          proposed.id,
          proposal.id,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
        ],
      );
      await client.query(
        "update simulora.action_proposals set status = 'CONFIRMED' where id = $1",
        [proposal.id],
      );
      await client.query("update simulora.actions set status = 'COMMITTING' where id = $1", [
        proposed.id,
      ]);
    };

    const wrongSource = await pool.connect();
    await wrongSource.query("begin");
    try {
      await prepareConfirmation(wrongSource);
      await expect(
        wrongSource.query(
          `insert into simulora.world_commits
           (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
            action_id, source_type, reason)
           values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'WORLD', null)`,
          [
            randomUUID(),
            continuity.branchId,
            continuity.headCommitId,
            account.accountId,
            randomUUID(),
            proposed.id,
          ],
        ),
      ).rejects.toThrow(/exact user authority/);
    } finally {
      await wrongSource.query("rollback");
      wrongSource.release();
    }

    const forged = await pool.connect();
    await forged.query("begin");
    try {
      await prepareConfirmation(forged);
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      const forgedState = structuredClone(continuity.state);
      forgedState.customState = { forgedOutsideCandidate: true };
      await forged.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          action_id, source_type, reason)
         values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'USER', null)`,
        [
          commitId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          stateRevisionId,
          proposed.id,
        ],
      );
      await forged.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          continuity.branchId,
          commitId,
          JSON.stringify(forgedState),
          contentHash(forgedState),
        ],
      );
      await forged.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope,
          cause_action_id)
         values ($1, $2, $3, 'ACTION_RECORDED', $4::jsonb, 'USER', $5, $6)`,
        [
          randomUUID(),
          continuity.branchId,
          commitId,
          JSON.stringify({ actionId: proposed.id, target: proposal.displayEffect.target }),
          proposal.displayEffect.scope,
          proposed.id,
        ],
      );
      await forged.query(
        `update simulora.branches set head_commit_id = $2, head_state_revision_id = $3
         where id = $1`,
        [continuity.branchId, commitId, stateRevisionId],
      );
      await forged.query(
        `update simulora.actions set status = 'COMMITTED', terminal_at = now() where id = $1`,
        [proposed.id],
      );
      await expect(forged.query("set constraints all immediate")).rejects.toThrow(
        /exact state, typed Event, terminal Action/,
      );
    } finally {
      await forged.query("rollback");
      forged.release();
    }
  });

  it("rejects any non-direct Commit that changes participation", async () => {
    const continuity = await createContinuity();
    const branchId = randomUUID();
    const commitId = randomUUID();
    const stateRevisionId = randomUUID();
    const changedState = structuredClone(continuity.state);
    changedState.participation = {
      initiativeMode: "WORLD_ACTIVE",
      structureMode: "GOAL_FRAMED",
    };

    const client = await pool.connect();
    await client.query("begin");
    try {
      await client.query(
        `insert into simulora.branches
         (id, continuity_id, name, status, parent_branch_id, fork_source_commit_id,
          created_by_account_id, idempotency_key)
         values ($1, $2, 'Rogue fork', 'INITIALIZING', $3, $4, $5, $6)`,
        [
          branchId,
          continuity.continuityId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          `rogue-fork-${randomUUID()}`,
        ],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason)
         values ($1, $2, $3, 'BRANCH_FORK', $4, $5, 'USER', 'rogue participation mutation')`,
        [commitId, branchId, continuity.headCommitId, account.accountId, stateRevisionId],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          branchId,
          commitId,
          JSON.stringify(changedState),
          contentHash(changedState),
        ],
      );
      await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3, status = 'ACTIVE'
         where id = $1`,
        [branchId, commitId, stateRevisionId],
      );
      await expect(client.query("set constraints all immediate")).rejects.toThrow(
        /exact source state|Only a direct participation command/,
      );
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("snapshots only an owned Character Asset and preserves that spec at runtime", async () => {
    const asset = await repository.createCharacterAsset(account, {
      document: {
        schemaVersion: 1,
        name: "Iora",
        role: "Harbor signaler responsible for reading the outer markers.",
        motives: ["Keep arriving vessels and the harbor settlement safe in the fog."],
        stance: "Iora refuses to light an unsafe signal merely to seem welcoming.",
        knowledgeFactIds: ["fact.western-signal-dim"],
      },
    });
    await expect(
      pool.query(
        `update simulora.character_assets
         set document = jsonb_set(document, '{stance}', '"tampered"'::jsonb)
         where id = $1`,
        [asset.id],
      ),
    ).rejects.toThrow(/character_assets_document_hash_matches/);
    const world = structuredClone(lanternReachSeed);
    world.characters[0] = {
      ...world.characters[0]!,
      ...asset.document,
      sourceAssetId: asset.id,
    };
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const snapshot = await pool.query<{
      source_asset_id: string;
      spec: (typeof world.characters)[0];
    }>(
      `select source_asset_id, spec from simulora.world_revision_characters
       where world_revision_id = $1`,
      [revision.revisionId],
    );
    expect(snapshot.rows[0]).toMatchObject({ source_asset_id: asset.id });

    const foreignWorld = structuredClone(world);
    const foreignDraft = await repository.createWorld(otherAccount, foreignWorld);
    await expect(
      repository.createRevision(otherAccount, foreignDraft.worldId, foreignDraft.rowVersion),
    ).rejects.toThrow(AccessDeniedError);

    await pool.query("update simulora.character_assets set status = 'DELETED' where id = $1", [
      asset.id,
    ]);
    await expect(
      repository.createRevision(account, draft.worldId, draft.rowVersion),
    ).rejects.toThrow(AccessDeniedError);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect(continuity.world.characters[0]).toMatchObject({
      id: "character.iora",
      stance: asset.document.stance,
      sourceAssetId: asset.id,
    });
    expect(continuity.state.characters[0]).toMatchObject({
      id: "character.iora",
      knownFactIds: ["fact.western-signal-dim"],
    });
  });

  it("filters character knowledge before the generator and records the scoped manifest", async () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.keeper-private",
      statement: "The keeper privately doubts the harbor council.",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Direct user note",
      lifecycle: "ACTIVE",
    });
    world.facts.push({
      id: "fact.iora-context",
      statement: "Iora inspected the western lens this morning.",
      scope: "CONTINUITY_PRIVATE",
      provenance: "Character observation",
      lifecycle: "ACTIVE",
    });
    world.characters[0]!.knowledgeFactIds.push("fact.keeper-private", "fact.iora-context");
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `knowledge-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora whether the signal is safe.",
    });
    const gateway = new DeterministicModelGateway();
    let knownFactIds: string[] = [];
    const proposed = await repository.processAction(action.id, async (request) => {
      knownFactIds = request.character?.knownFacts.map((fact) => fact.id) ?? [];
      return gateway.generateWorldTurn(request);
    });
    expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
    expect(knownFactIds).toEqual(["fact.western-signal-dim", "fact.iora-context"]);
    const attempt = await pool.query<{
      context_manifest: { includedFactIds: string[]; includedCharacterIds: string[] };
    }>("select context_manifest from simulora.generation_attempts where action_id = $1", [
      action.id,
    ]);
    expect(attempt.rows[0]?.context_manifest).toMatchObject({
      includedFactIds: ["fact.western-signal-dim", "fact.iora-context"],
      includedCharacterIds: ["character.iora"],
    });
  });
});
