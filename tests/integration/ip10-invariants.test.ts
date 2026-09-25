import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ActionTruthService,
  GovernanceService,
  WorldContinuityService,
} from "../../packages/application/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import {
  DeterministicModelGateway,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";
import { InMemoryObjectStorage } from "../../packages/storage/src/index.js";
import {
  evaluationPrivateSentinel,
  modelEvaluationWorld,
} from "../../packages/testkit/src/model-evaluation.js";
import { createApiApp } from "../../apps/api/src/app.js";
import type { AuthPort } from "../../packages/auth/src/index.js";

/**
 * IP-10.1 closes the invariant-proof gaps recorded in the IP-10 Requirement →
 * Evidence Matrix §4. Each test adds only the missing part of one invariant's
 * proof; the rest of each invariant is proven by the earlier suites the matrix
 * cites. No product behavior is added.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const gateway = new DeterministicModelGateway();

suite("IP-10.1 invariant gaps against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterAll(async () => pool?.end());

  const newAccount = () => ({ accountId: randomUUID(), eligibility: "adult" as const });

  async function startContinuity(owner: ReturnType<typeof newAccount>, world = lanternReachSeed) {
    const draft = await repository.createWorld(owner, world);
    await repository.validateDraft(owner, draft.worldId);
    const revision = await repository.createRevision(owner, draft.worldId, 1);
    const continuity = await repository.startContinuity(owner, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    return { worldId: draft.worldId, continuity };
  }

  async function commitAction(
    owner: ReturnType<typeof newAccount>,
    branchId: string,
    expectedHeadCommitId: string,
    intent: string,
    generate: (request: WorldTurnRequest) => ReturnType<typeof gateway.generateWorldTurn> = (
      request,
    ) => gateway.generateWorldTurn(request),
    options: Parameters<AuthoritativeWorldRepository["processAction"]>[3] = {},
  ) {
    const submitted = await repository.submitAction(owner, branchId, {
      schemaVersion: 1,
      idempotencyKey: `ip10-${randomUUID()}`,
      expectedHeadCommitId,
      // Every Continuity here starts and stays GUIDED + OPEN_ENDED.
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
      intent,
    });
    const proposed = await repository.processAction(submitted.id, generate, "ip10-worker", options);
    if (!proposed?.proposal) throw new Error("Expected a proposal");
    const committed = await repository.confirmAction(owner, submitted.id, {
      proposalId: proposed.proposal.id,
      proposalDigest: proposed.proposal.digest,
      expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
    });
    if (!committed.commit) throw new Error("Expected a Commit");
    return { actionId: submitted.id, headCommitId: committed.commit.resultingHeadCommitId };
  }

  it("INV-07: keeps private facts and user text out of every API log line", async () => {
    const owner = newAccount();
    const intruder = newAccount();
    const { continuity } = await startContinuity(owner, modelEvaluationWorld);
    const intentMarker = `INTENT_MARKER_${randomUUID().slice(0, 8)}`;
    const privateStatement = continuity.state.facts.find((fact) =>
      fact.statement.includes(evaluationPrivateSentinel),
    )?.statement;
    expect(privateStatement).toBeDefined();

    const lines: string[] = [];
    const capture = (...parts: unknown[]) => {
      lines.push(parts.map(String).join(" "));
    };
    const spies = [
      vi.spyOn(console, "log").mockImplementation(capture),
      vi.spyOn(console, "warn").mockImplementation(capture),
      vi.spyOn(console, "error").mockImplementation(capture),
    ];
    let authenticated = owner;
    const auth: AuthPort = { authenticate: () => Promise.resolve(authenticated) };
    const app = createApiApp({
      logLevel: "debug",
      auth,
      worldService: new WorldContinuityService(repository),
      actionService: new ActionTruthService(repository),
    });
    try {
      const submitted = await app.inject({
        method: "POST",
        url: `/v1/branches/${continuity.branchId}/actions`,
        payload: {
          schemaVersion: 1,
          idempotencyKey: `ip10-log-${randomUUID()}`,
          expectedHeadCommitId: continuity.headCommitId,
          participationExpectation: continuity.state.participation,
          intent: `Ask about the ledger. ${intentMarker}`,
        },
      });
      expect(submitted.statusCode).toBe(201);
      await repository.processAction(
        submitted.json<{ id: string }>().id,
        (request) => gateway.generateWorldTurn(request),
        "ip10-log-worker",
      );
      for (const url of [
        `/v1/continuities/${continuity.continuityId}/orientation`,
        `/v1/branches/${continuity.branchId}/state`,
        `/v1/branches/${continuity.branchId}/commits?limit=5`,
        `/v1/actions/${submitted.json<{ id: string }>().id}`,
      ]) {
        expect((await app.inject({ method: "GET", url })).statusCode).toBe(200);
      }
      // Error paths log too: a malformed body and another account's Branch.
      await app.inject({
        method: "POST",
        url: `/v1/branches/${continuity.branchId}/actions`,
        payload: { intent: `${intentMarker} ${privateStatement}` },
      });
      authenticated = intruder;
      await app.inject({ method: "GET", url: `/v1/branches/${continuity.branchId}/state` });
    } finally {
      await app.close();
      for (const spy of spies) spy.mockRestore();
    }

    expect(lines.length).toBeGreaterThan(5);
    const joined = lines.join("\n");
    expect(joined).not.toContain(intentMarker);
    expect(joined).not.toContain(evaluationPrivateSentinel);
    for (const fact of continuity.state.facts) expect(joined).not.toContain(fact.statement);
  });

  it("INV-08: a correction still governs the next context after a model-profile change", async () => {
    const owner = newAccount();
    const { continuity } = await startContinuity(owner);
    const fact = continuity.state.facts[0]!;
    const corrected = `The western signal was rebuilt. CORRECTED_${randomUUID().slice(0, 8)}`;
    const correction = await repository.submitCorrection(owner, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `ip10-correct-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: corrected },
      reason: "IP-10 INV-08 correction before a profile change.",
    });
    const correctionCommit = await repository.confirmAction(owner, correction.id, {
      proposalId: correction.proposal!.id,
      proposalDigest: correction.proposal!.digest,
      expectedHeadCommitId: correction.proposal!.expectedHeadCommitId,
    });

    // A new deterministic profile version, recorded like a worker start would.
    const profile = {
      id: "deterministic-inv08",
      version: randomUUID().slice(0, 8),
      adapter: "deterministic" as const,
    };
    const activation = await repository.recordModelProfileActivation({
      profileId: profile.id,
      profileVersion: profile.version,
      adapter: profile.adapter,
      model: null,
      provider: null,
      promptVersion: 1,
      profileDigest: randomUUID().replaceAll("-", "").padEnd(64, "0"),
      fallbackProfile: null,
      isMaterialChange: () => true,
    });
    expect(activation.changed).toBe(true);

    const seen: WorldTurnRequest[] = [];
    const next = await commitAction(
      owner,
      continuity.branchId,
      correctionCommit.commit!.resultingHeadCommitId,
      "Check the signal again.",
      (request) => {
        seen.push(request);
        return gateway.generateWorldTurn(request);
      },
      { profile },
    );
    expect(seen).toHaveLength(1);
    const compiled = JSON.stringify(seen[0]);
    expect(compiled).toContain(corrected);
    expect(compiled).not.toContain(fact.statement);
    const attempt = await pool.query<{ profile_id: string; profile_version: string }>(
      `select profile_id, profile_version from simulora.generation_attempts where action_id = $1`,
      [next.actionId],
    );
    expect(attempt.rows).toEqual([{ profile_id: profile.id, profile_version: profile.version }]);
  });

  it("INV-09: Restore leaves consent, usage ledger, exports and grants unchanged", async () => {
    const owner = newAccount();
    const participant = newAccount();
    const storage = new InMemoryObjectStorage();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const { worldId, continuity } = await startContinuity(owner);
    const point = await repository.createRecoveryPoint(owner, continuity.branchId, {
      idempotencyKey: `ip10-point-${randomUUID()}`,
      label: "Before account activity",
    });
    const changed = await commitAction(
      owner,
      continuity.branchId,
      continuity.headCommitId,
      "Steady the western signal.",
    );

    // Account-level activity after the Recovery Point.
    await repository.setConsent(owner, {
      schemaVersion: 1,
      idempotencyKey: `ip10-consent-${randomUUID()}`,
      consentType: "TERMS",
      version: "IP-10-V1",
      scope: "ACCOUNT",
      decision: "GRANTED",
    });
    await repository.ensureAccount(participant);
    await pool.query(
      `insert into simulora.world_access_grants (world_id, account_id, role, status)
       values ($1, $2, 'PARTICIPANT', 'ACTIVE')`,
      [worldId, participant.accountId],
    );
    const quote = await repository.createUsageQuote(owner, {
      schemaVersion: 1,
      idempotencyKey: `ip10-quote-${randomUUID()}`,
      actionProfile: "EXPORT",
    });
    const exportKey = `ip10-export-${worldId}`;
    const reservation = await repository.reserveUsage(owner, quote.quoteId, {
      schemaVersion: 1,
      actionKey: `export:${exportKey}`,
    });
    const exported = await governance.createExport(owner, {
      schemaVersion: 1,
      idempotencyKey: exportKey,
      reservationId: reservation.reservationId,
      worldId,
      include: { world: true, characters: true, continuity: true, history: true },
    });
    await repository.settleUsage(owner, reservation.reservationId);

    const snapshot = async () => ({
      consents: await repository.listConsents(owner),
      ledger: await repository.listUsageLedger(owner),
      exported: await repository.readExport(owner, exported.exportId),
      grants: (
        await pool.query(
          `select account_id, role, status from simulora.world_access_grants
            where world_id = $1 order by account_id`,
          [worldId],
        )
      ).rows,
    });
    const before = await snapshot();
    expect(before.ledger.entries).toHaveLength(1);
    expect(before.exported.status).toBe("READY");

    const proposal = await repository.prepareRestore(owner, continuity.branchId, point.commitId);
    expect(proposal.expectedHeadCommitId).toBe(changed.headCommitId);
    const restored = await repository.confirmRestore(owner, continuity.branchId, {
      proposalId: proposal.id,
      digest: proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    });
    expect(restored).toBeTruthy();
    const after = await repository.readCurrentState(owner, continuity.continuityId);
    expect(after.headCommitId).not.toBe(changed.headCommitId);
    expect(after.state.facts).toEqual(continuity.state.facts);

    expect(await snapshot()).toEqual(before);
    expect(
      Buffer.from(await governance.readExportArtifact(owner, exported.exportId)).length,
    ).toBeGreaterThan(0);
  });

  it("INV-12: an export carries no provider data and nothing from other accounts", async () => {
    const owner = newAccount();
    const other = newAccount();
    const storage = new InMemoryObjectStorage();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const { worldId, continuity } = await startContinuity(owner);
    await commitAction(
      owner,
      continuity.branchId,
      continuity.headCommitId,
      "Steady the western signal.",
    );

    // Another account plays the same World privately.
    const revision = await pool.query<{ id: string }>(
      `select id from simulora.world_revisions where world_id = $1`,
      [worldId],
    );
    await repository.ensureAccount(other);
    await pool.query(
      `insert into simulora.world_access_grants (world_id, account_id, role, status)
       values ($1, $2, 'PARTICIPANT', 'ACTIVE')`,
      [worldId, other.accountId],
    );
    const otherContinuity = await repository.startContinuity(other, revision.rows[0]!.id, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const otherMarker = `OTHER_ACCOUNT_${randomUUID().slice(0, 8)}`;
    await commitAction(
      other,
      otherContinuity.branchId,
      otherContinuity.headCommitId,
      `Mark the relay. ${otherMarker}`,
    );

    const attempts = await pool.query<{ id: string; context_manifest: unknown }>(
      `select g.id, g.context_manifest from simulora.generation_attempts g
         join simulora.actions a on a.id = g.action_id
        where a.actor_account_id = $1`,
      [owner.accountId],
    );
    expect(attempts.rows.length).toBeGreaterThan(0);

    const exportFor = async (include: {
      world: boolean;
      characters: boolean;
      continuity: boolean;
      history: boolean;
    }) => {
      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        idempotencyKey: `ip10-quote-${randomUUID()}`,
        actionProfile: "EXPORT",
      });
      const exportKey = `ip10-export-${randomUUID()}`;
      const reservation = await repository.reserveUsage(owner, quote.quoteId, {
        schemaVersion: 1,
        actionKey: `export:${exportKey}`,
      });
      const exported = await governance.createExport(owner, {
        schemaVersion: 1,
        idempotencyKey: exportKey,
        reservationId: reservation.reservationId,
        worldId,
        include,
      });
      return Buffer.from(await governance.readExportArtifact(owner, exported.exportId)).toString(
        "utf8",
      );
    };

    const full = await exportFor({
      world: true,
      characters: true,
      continuity: true,
      history: true,
    });
    expect(full).toContain(`continuity/${continuity.continuityId}/state.json`);
    // Other accounts' private play is absent.
    expect(full).not.toContain(otherContinuity.continuityId);
    expect(full).not.toContain(otherMarker);
    expect(full).not.toContain(other.accountId);
    // Provider data is absent: attempts, compiled context, prompts and profiles.
    for (const attempt of attempts.rows) expect(full).not.toContain(attempt.id);
    for (const marker of [
      "compilerVersion",
      "includedFactIds",
      "excludedScopeCounts",
      "contextManifest",
      "context_manifest",
      "compiledGenerationRequest",
      "You simulate an original synthetic world",
      "profile_id",
      "profileDigest",
    ]) {
      expect(full).not.toContain(marker);
    }

    // Only the selected scope is present.
    const worldOnly = await exportFor({
      world: true,
      characters: false,
      continuity: false,
      history: false,
    });
    expect(worldOnly).toContain("world/world.json");
    expect(worldOnly).not.toContain("state.json");
    expect(worldOnly).not.toContain("history/events.ndjson");
    expect(worldOnly).not.toContain("characters/character.iora.json");
  });
});
