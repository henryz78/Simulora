import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  worldDocumentSchema,
  type RequestedEffect,
  type WorldDocument,
} from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { mgcClosureWorld } from "../../packages/testkit/src/mgc-closure.js";

/**
 * SA-2 / ADR-SA2 against real PostgreSQL: the World owner's movement grant in
 * the Revision document derives the one immutable RE-3 policy, and the
 * unchanged enforcement path moves only the named Characters.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const gateway = new DeterministicModelGateway();
const observatory = "location.tidal-observatory";
const harbor = "location.harbor";

// Tavi may walk observatory → harbor; the way back is drawn but not open.
const grantedWorld: WorldDocument = worldDocumentSchema.parse({
  ...mgcClosureWorld,
  routineRoutes: [
    {
      fromLocationId: observatory,
      toLocationId: harbor,
      label: "the harbor steps",
      permitsRoutineMovement: true,
    },
    { fromLocationId: harbor, toLocationId: observatory, label: "the flooded causeway" },
  ],
  routineMovers: ["character.tavi"],
});

suite("SA-2 creator movement grant against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  async function publish(world: WorldDocument) {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    return { revision, continuityId: continuity.continuityId };
  }

  async function propose(
    continuityId: string,
    requestedEffect: RequestedEffect,
    character: string,
  ) {
    const current = await repository.readCurrentState(account, continuityId);
    const submitted = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Carry word toward the harbor.",
      requestedEffect,
      targetCharacterId: character,
    });
    const processed = await repository.processAction(
      submitted.id,
      (request) => gateway.generateWorldTurn(request),
      "sa2-worker",
    );
    return processed ?? repository.readAction(account, submitted.id);
  }

  async function sqlValid(document: unknown): Promise<boolean> {
    const result = await pool.query<{ valid: boolean }>(
      "select simulora.valid_world_revision_document($1::jsonb) as valid",
      [JSON.stringify(document)],
    );
    return result.rows[0]!.valid;
  }

  it("the application and SQL accept and refuse the same movement grants", async () => {
    const cases: Array<[string, unknown, boolean]> = [
      ["granted", grantedWorld, true],
      ["no grant at all", mgcClosureWorld, true],
      ["unknown mover", { ...grantedWorld, routineMovers: ["character.nobody"] }, false],
      [
        "duplicate mover",
        { ...grantedWorld, routineMovers: ["character.tavi", "character.tavi"] },
        false,
      ],
      [
        "movers without an open route",
        {
          ...grantedWorld,
          routineRoutes: grantedWorld.routineRoutes!.map(
            ({ permitsRoutineMovement: _, ...route }) => route,
          ),
        },
        false,
      ],
      ["an open route without movers", { ...grantedWorld, routineMovers: [] }, false],
      [
        "a non-boolean flag",
        {
          ...grantedWorld,
          routineRoutes: [{ ...grantedWorld.routineRoutes![0]!, permitsRoutineMovement: "yes" }],
        },
        false,
      ],
    ];
    for (const [name, document, valid] of cases) {
      expect(worldDocumentSchema.safeParse(document).success, name).toBe(valid);
      expect(await sqlValid(document), name).toBe(valid);
    }
  });

  it("a Revision with movers derives exactly one immutable policy; one without movers gets none", async () => {
    const { revision, continuityId } = await publish(grantedWorld);
    const policy = await pool.query<{ document: unknown; digest: string }>(
      "select document, digest from simulora.re3_routine_policies where world_revision_id = $1",
      [revision.revisionId],
    );
    expect(policy.rows).toHaveLength(1);
    expect(policy.rows[0]!.document).toEqual({
      version: "re3-routine-v1",
      npcIds: ["character.tavi"],
      publicLocationIds: [harbor, observatory].sort(),
      routes: [{ fromLocationId: observatory, toLocationId: harbor, label: "the harbor steps" }],
    });
    expect(policy.rows[0]!.digest).toMatch(/^[0-9a-f]{64}$/);
    await expect(
      pool.query("delete from simulora.re3_routine_policies where world_revision_id = $1", [
        revision.revisionId,
      ]),
    ).rejects.toThrow();
    expect((await repository.readCurrentState(account, continuityId)).routineMoverIds).toEqual([
      "character.tavi",
    ]);

    const plain = await publish(mgcClosureWorld);
    const none = await pool.query(
      "select 1 from simulora.re3_routine_policies where world_revision_id = $1",
      [plain.revision.revisionId],
    );
    expect(none.rows).toHaveLength(0);
    expect(
      (await repository.readCurrentState(account, plain.continuityId)).routineMoverIds,
    ).toEqual([]);
  });

  it("a mover moves along an open route; a non-mover is refused; a closed way back meets the rule", async () => {
    const { continuityId } = await publish(grantedWorld);

    const refused = await propose(continuityId, "ROUTINE_EFFECT", "character.iora");
    expect(refused.proposal).toBeNull();
    expect(refused.commit).toBeNull();
    await repository.cancelAction(account, refused.id);

    const move = await propose(continuityId, "ROUTINE_EFFECT", "character.tavi");
    expect(move.proposal?.impact).toBe("L2");
    const moved = await repository.confirmAction(account, move.id, {
      proposalId: move.proposal!.id,
      proposalDigest: move.proposal!.digest,
      expectedHeadCommitId: move.proposal!.expectedHeadCommitId,
    });
    expect(moved.status).toBe("COMMITTED");
    const after = await repository.readCurrentState(account, continuityId);
    const tavi = after.state.characters.find((character) => character.id === "character.tavi");
    expect(tavi?.locationId).toBe(harbor);

    // From the harbor the only drawn route is not open, so the flood rule applies.
    const back = await propose(continuityId, "ROUTINE_EFFECT", "character.tavi");
    const proposal = await pool.query<{
      candidate_transition: { operation: { type: string; constraintId: string } };
    }>("select candidate_transition from simulora.action_proposals where id = $1", [
      back.proposal!.id,
    ]);
    expect(proposal.rows[0]!.candidate_transition.operation).toMatchObject({
      type: "TRANSFORM_FAILURE",
      constraintId: "constraint.flood",
    });
    await repository.cancelAction(account, back.id);
  });

  it("the playability check warns about a Character who knows nothing addressable", async () => {
    const uninformed = worldDocumentSchema.parse({
      ...mgcClosureWorld,
      characters: [
        ...mgcClosureWorld.characters,
        {
          id: "character.maren",
          name: "Maren",
          role: "Pilot",
          locationId: observatory,
          motives: ["Keep the pilots safe."],
          stance: "Maren speaks plainly.",
          knowledgeFactIds: [],
        },
      ],
    });
    const draft = await repository.createWorld(account, uninformed);
    const validation = await repository.validateDraft(account, draft.worldId);
    expect(validation.outcome).toBe("VALID");
    const warnings = validation.findings.filter((finding) =>
      finding.path.endsWith("knowledgeFactIds"),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      path: `characters.${uninformed.characters.length - 1}.knowledgeFactIds`,
      severity: "WARNING",
    });
    expect(warnings[0]!.message).toContain("Maren does not know anything a player can ask about");
  });
});
