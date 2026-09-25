import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  type ActionRecord,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  DeterministicModelGateway,
  FallbackModelGateway,
  OpenAICompatibleModelGateway,
  livePromptVersion,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";
import {
  long01CharacterIds,
  long01PrivateFacts,
  long01RoutinePolicy,
  long01World,
  long01WrongFact,
} from "../../packages/testkit/src/long01.js";

/**
 * IP-10.3 LONG-01 (Validation Strategy §5): twenty sessions across a simulated
 * thirty days on one GUIDED + OPEN_ENDED Continuity, through the real
 * repository and PostgreSQL with the deterministic adapter. Days are simulated;
 * the interruption is real: a separate worker process claims an Action, is
 * killed, and its lease expires on the wall clock before recovery.
 *
 * Structural pass conditions are asserted here. Model-quality judgements (for
 * example a human rubric on character voice) need an approved provider and
 * are outside this harness.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const deterministic = new DeterministicModelGateway();
type Effect =
  "FACT_REWRITE" | "ROUTINE_EFFECT" | "NO_WORLD_EFFECT" | "RELATIONSHIP_EFFECT" | "THREAD_EFFECT";

suite("IP-10.3 LONG-01 long-horizon scenario against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(root, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  it(
    "keeps twenty sessions over thirty days causally continuous",
    { timeout: 120_000 },
    async () => {
      const account = { accountId: randomUUID(), eligibility: "adult" as const };
      const draft = await repository.createWorld(account, long01World);
      await repository.validateDraft(account, draft.worldId);
      const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
      await pool.query(
        "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
        [revision.revisionId, JSON.stringify(long01RoutinePolicy)],
      );
      let participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const as {
        initiativeMode: "GUIDED" | "DIRECT";
        structureMode: "OPEN_ENDED";
      };
      const start = await repository.startContinuity(account, revision.revisionId, participation);
      const continuityId = start.continuityId;
      const mainBranchId = start.branchId;

      // Every compiled generation request, so context scoping can be audited.
      const requests: Array<{ actionId: string; request: WorldTurnRequest }> = [];
      const recorded =
        (gateway: {
          generateWorldTurn: (
            request: WorldTurnRequest,
          ) => ReturnType<typeof deterministic.generateWorldTurn>;
        }) =>
        (request: WorldTurnRequest) => {
          requests.push({ actionId: request.actionId, request });
          return gateway.generateWorldTurn(request);
        };
      const generate = recorded(deterministic);
      const submitted: string[] = [];
      const sessions: Array<{ session: number; day: number; did: string }> = [];
      const log = (day: number, did: string) =>
        sessions.push({ session: sessions.length + 1, day, did });
      const head = async () => repository.readCurrentState(account, continuityId);

      async function propose(
        effect: Effect,
        intent: string,
        extra: { targetCharacterId?: string; targetThreadId?: string } = {},
        gen = generate,
        options: Parameters<AuthoritativeWorldRepository["processAction"]>[3] = {},
      ): Promise<ActionRecord> {
        const current = await head();
        const action = await repository.submitAction(account, current.branchId, {
          schemaVersion: 1,
          idempotencyKey: `long01-${randomUUID()}`,
          expectedHeadCommitId: current.headCommitId,
          participationExpectation: participation,
          intent,
          requestedEffect: effect,
          ...extra,
        });
        submitted.push(action.id);
        return (await repository.processAction(action.id, gen, "long01-worker", options))!;
      }
      async function confirm(action: ActionRecord) {
        expect(action.status, action.id).toBe("AWAITING_CONFIRMATION");
        const committed = await repository.confirmAction(account, action.id, {
          proposalId: action.proposal!.id,
          proposalDigest: action.proposal!.digest,
          expectedHeadCommitId: action.proposal!.expectedHeadCommitId,
        });
        expect(committed.status).toBe("COMMITTED");
        return committed.commit!.resultingHeadCommitId;
      }
      const act = async (...args: Parameters<typeof propose>) => confirm(await propose(...args));
      const relationships = async () =>
        Object.fromEntries((await head()).state.relationships.map((r) => [r.id, r.state]));

      // --- Sessions -------------------------------------------------------------
      await act("RELATIONSHIP_EFFECT", "Ask Mara to compare timetables with Oren.", {
        targetCharacterId: "character.mara",
      });
      log(1, "relationship change 1 (Mara–Oren)");
      await act("THREAD_EFFECT", "Find out who silenced the ferry bell.", {
        targetThreadId: "thread.bell",
      });
      log(2, "resolve thread.bell");
      await act("RELATIONSHIP_EFFECT", "Ask Sella to check Duvan's tallies with him.", {
        targetCharacterId: "character.sella",
      });
      log(4, "relationship change 2 (Sella–Duvan)");
      await act("FACT_REWRITE", "Ask Oren what he heard at the landing.", {
        targetCharacterId: "character.oren",
      });
      log(5, "ordinary Action with Oren");

      // Deliberate wrong-fact correction through the direct L3 path.
      const beforeCorrection = await head();
      const wrong = beforeCorrection.state.facts.find((fact) => fact.id === long01WrongFact.id)!;
      expect(wrong.statement).toBe(long01WrongFact.wrong);
      const correction = await repository.submitCorrection(account, mainBranchId, {
        schemaVersion: 1,
        idempotencyKey: `long01-correct-${randomUUID()}`,
        expectedHeadCommitId: beforeCorrection.headCommitId,
        target: { type: "fact", id: wrong.id },
        operation: "CORRECT_CONTINUITY",
        before: { statement: wrong.statement, scope: wrong.scope },
        after: { statement: long01WrongFact.corrected },
        reason: "The stair log shows the keeper stayed.",
      });
      submitted.push(correction.id);
      expect(correction.proposal?.impact).toBe("L3");
      await confirm(correction);
      const correctedAtRequest = requests.length;
      log(6, "direct L3 correction of the stair-keeper fact");

      const midCommit = await act("RELATIONSHIP_EFFECT", "Send Pell to report to Mara.", {
        targetCharacterId: "character.pell",
      });
      log(8, "relationship change 3 (Pell–Mara); mid-scenario Commit");

      // User-authorized participation transition, then a stale expectation.
      const beforeTransition = await head();
      const direct = { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" } as const;
      const transition = await repository.changeParticipationContract(account, mainBranchId, {
        schemaVersion: 1,
        idempotencyKey: `long01-contract-${randomUUID()}`,
        expectedHeadCommitId: beforeTransition.headCommitId,
        before: participation,
        after: direct,
      });
      submitted.push(transition.id);
      expect(transition.status).toBe("COMMITTED");
      const transitionEvent = await pool.query<{ payload: Record<string, unknown> }>(
        `select payload from simulora.domain_events
        where commit_id = $1 and event_type = 'PARTICIPATION_CONTRACT_CHANGED'`,
        [transition.commit!.resultingHeadCommitId],
      );
      expect(transitionEvent.rows[0]?.payload).toMatchObject({
        before: participation,
        after: direct,
      });
      const stale = await head();
      await expect(
        repository.submitAction(account, mainBranchId, {
          schemaVersion: 1,
          idempotencyKey: `long01-stale-${randomUUID()}`,
          expectedHeadCommitId: stale.headCommitId,
          participationExpectation: participation,
          intent: "Keep going as before.",
        }),
      ).rejects.toThrow(/PARTICIPATION_EXPECTATION_MISMATCH/);
      participation = { ...direct };
      log(9, "participation GUIDED → DIRECT; stale expectation refused");

      // Character disagreement: Sella answers from her stance and changes nothing.
      const disagreement = await propose(
        "NO_WORLD_EFFECT",
        "Ask Sella to ring the bell early tonight.",
        {
          targetCharacterId: "character.sella",
        },
      );
      expect(disagreement.status).toBe("COMPLETED_NO_EFFECT");
      expect(disagreement.dialogue?.narrative).toContain(
        "Sella disagrees with ringing the ferry bell early",
      );
      log(10, "Sella disagrees (response only)");

      const opened = await propose("THREAD_EFFECT", "Ask who repainted the tide marker.");
      await confirm(opened);
      log(11, "open a new thread");

      // Interruption after acknowledgement and before model completion: a real
      // worker process claims the Action, is killed, and its lease expires.
      const interruptedHead = await head();
      const interrupted = await repository.submitAction(account, mainBranchId, {
        schemaVersion: 1,
        idempotencyKey: `long01-interrupted-${randomUUID()}`,
        expectedHeadCommitId: interruptedHead.headCommitId,
        participationExpectation: participation,
        intent: "Ask Oren to row Mara's timetable across.",
        requestedEffect: "RELATIONSHIP_EFFECT",
        targetCharacterId: "character.oren",
      });
      submitted.push(interrupted.id);
      const worker = spawn(
        process.execPath,
        [
          "--import",
          "tsx",
          path.join(root, "tests/integration/support/doomed-worker.ts"),
          interrupted.id,
        ],
        { cwd: root, env: process.env, stdio: "ignore" },
      );
      const leased = async () =>
        (
          await pool.query<{ status: string; lease_owner: string | null; expired: boolean }>(
            `select status, lease_owner, lease_until <= clock_timestamp() as expired
             from simulora.durable_jobs where action_id = $1`,
            [interrupted.id],
          )
        ).rows[0]!;
      await expect
        .poll(async () => (await leased()).lease_owner, { timeout: 30_000, interval: 100 })
        .toBe("doomed-worker");
      worker.kill("SIGKILL");
      await new Promise((resolve) => worker.once("exit", resolve));
      expect((await repository.readAction(account, interrupted.id)).status).toBe("GENERATING");
      await expect
        .poll(async () => (await leased()).expired, { timeout: 15_000, interval: 200 })
        .toBe(true);
      const recovered = await repository.processAction(interrupted.id, generate, "long01-recovery");
      await confirm(recovered!);
      const attempts = await pool.query<{ status: string; error_class: string | null }>(
        `select status, error_class from simulora.generation_attempts where action_id = $1 order by attempt_number`,
        [interrupted.id],
      );
      expect(attempts.rows.map((row) => row.error_class)).toContain("LEASE_EXPIRED");
      const commitsForInterrupted = await pool.query<{ count: string }>(
        `select count(*) from simulora.world_commits where action_id = $1`,
        [interrupted.id],
      );
      expect(Number(commitsForInterrupted.rows[0]!.count)).toBe(1);
      log(12, "killed worker; real lease expiry; relationship change 4 (Mara–Oren) committed once");

      // Branch from the mid-scenario Commit; act and Restore only there.
      const mainBeforeBranch = await head();
      const ledgerBefore = await repository.listUsageLedger(account);
      const consentsBefore = await repository.listConsents(account);
      const fork = await repository.forkBranch(account, continuityId, {
        idempotencyKey: `long01-fork-${randomUUID()}`,
        name: "What if Pell had stayed",
        sourceCommitId: midCommit,
        expectedHeadCommitId: mainBeforeBranch.headCommitId,
      });
      // A refused switch names the unresolved Actions, so a failure is diagnosable.
      const select = async (branchId: string) =>
        repository.selectBranch(account, continuityId, branchId).catch(async (error: unknown) => {
          const open = await pool.query(
            `select id, status, operation_type, intent from simulora.actions a
            where a.branch_id in (select id from simulora.branches where continuity_id = $1)
              and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')`,
            [continuityId],
          );
          throw new Error(`${String(error)}; unresolved: ${JSON.stringify(open.rows)}`);
        });
      await select(fork.id);
      await act("FACT_REWRITE", "Ask Mara to post an early crossing.", {
        targetCharacterId: "character.mara",
      });
      const experimental = await head();
      const commitsBeforeRestore = await repository.listBranchCommits(account, fork.id);
      const restoreProposal = await repository.prepareRestore(account, fork.id, fork.headCommitId);
      await repository.confirmRestore(account, fork.id, {
        proposalId: restoreProposal.id,
        digest: restoreProposal.digest,
        expectedHeadCommitId: experimental.headCommitId,
      });
      const restored = await head();
      const commitsAfterRestore = await repository.listBranchCommits(account, fork.id);
      expect(restored.headCommitId).not.toBe(experimental.headCommitId);
      expect(JSON.stringify(commitsAfterRestore)).toContain(experimental.headCommitId);
      expect(JSON.stringify(commitsAfterRestore).length).toBeGreaterThan(
        JSON.stringify(commitsBeforeRestore).length,
      );
      expect(await repository.listUsageLedger(account)).toEqual(ledgerBefore);
      expect(await repository.listConsents(account)).toEqual(consentsBefore);
      await select(mainBranchId);
      const mainAfterBranch = await head();
      expect(mainAfterBranch.headCommitId).toBe(mainBeforeBranch.headCommitId);
      expect(mainAfterBranch.state).toEqual(mainBeforeBranch.state);
      log(13, "Branch from the mid Commit; Action and append-only Restore on it; main untouched");

      // Model-profile change: recorded, and it changes no state or permission.
      const beforeProfile = await head();
      const activation = await repository.recordModelProfileActivation({
        profileId: "long01-profile",
        profileVersion: randomUUID().slice(0, 8),
        adapter: "deterministic",
        model: null,
        provider: null,
        promptVersion: livePromptVersion,
        profileDigest: randomUUID().replaceAll("-", "").padEnd(64, "0"),
        fallbackProfile: null,
        isMaterialChange: () => true,
      });
      expect(activation.changed).toBe(true);
      const afterProfile = await head();
      expect(afterProfile.headCommitId).toBe(beforeProfile.headCommitId);
      expect(afterProfile.state).toEqual(beforeProfile.state);
      log(15, "model-profile change recorded; state and participation unchanged");

      // Provider outage with the declared fallback; the same rules decide.
      const unreachable = new OpenAICompatibleModelGateway({
        profile: {
          id: "long01-live",
          version: "1",
          adapter: "openai-compatible",
          model: "synthetic-model",
          promptVersion: livePromptVersion,
          timeoutMs: 2_000,
          maxOutputTokens: 1_024,
          retentionApprovalRef: null,
        },
        endpoint: "http://127.0.0.1:9/v1/chat/completions",
        apiKey: "sk-synthetic-long01",
        fetch: () => Promise.resolve(new Response("unavailable", { status: 503 })),
      });
      const fallback = await propose(
        "RELATIONSHIP_EFFECT",
        "Ask Duvan to show Sella the sluice tallies.",
        { targetCharacterId: "character.duvan" },
        recorded(new FallbackModelGateway(unreachable, deterministic)),
        { profile: { id: "long01-live", version: "1", adapter: "openai-compatible" } },
      );
      expect(fallback.generation?.fallbackFrom).toBe("long01-live@1");
      await confirm(fallback);
      log(16, "provider outage; declared fallback; relationship change 5 (Sella–Duvan)");

      // Transformed failure against the declared tide constraint.
      const transformed = await propose(
        "ROUTINE_EFFECT",
        "Send Pell down the stair to the landing.",
        {
          targetCharacterId: "character.pell",
        },
      );
      const transformedHead = await confirm(transformed);
      const transformedEvent = await pool.query<{
        event_type: string;
        payload: Record<string, unknown>;
      }>(`select event_type, payload from simulora.domain_events where commit_id = $1`, [
        transformedHead,
      ]);
      expect(transformedEvent.rows[0]).toMatchObject({
        event_type: "ATTEMPT_TRANSFORMED",
        payload: { constraintId: "constraint.high-tide" },
      });
      log(17, "transformed failure against the high-tide constraint");

      await act("THREAD_EFFECT", "Ask after the stranger at the reed market.", {
        targetThreadId: "thread.stranger",
      });
      log(18, "resolve thread.stranger");
      await act("FACT_REWRITE", "Ask Mara whether the bell can be heard again.", {
        targetCharacterId: "character.mara",
      });
      log(19, "ordinary Action with Mara");
      const quiet = await propose("NO_WORLD_EFFECT", "Ask Duvan how the sluices held.", {
        targetCharacterId: "character.duvan",
      });
      expect(quiet.status).toBe("COMPLETED_NO_EFFECT");
      log(20, "response only from Duvan");
      await act("FACT_REWRITE", "Ask Sella what the market says about the bell.", {
        targetCharacterId: "character.sella",
      });
      log(21, "ordinary Action with Sella");

      // The longest gap (nine days), then return orientation.
      const orientation = await repository.readOrientation(account, continuityId);
      const final = await head();
      expect(orientation.nextParticipation.expectedHeadCommitId).toBe(final.headCommitId);
      expect(orientation.pendingActions).toEqual([]);
      expect(orientation.current.situation).toBe(
        final.state.facts.find((fact) => fact.id === "fact.shared-bell")!.statement,
      );
      const closing = await propose("NO_WORLD_EFFECT", "Ask Oren whether he will cross tonight.", {
        targetCharacterId: "character.oren",
      });
      expect(closing.status).toBe("COMPLETED_NO_EFFECT");
      log(30, "return after the longest gap; orientation; response from Oren");

      // --- Pass conditions (Validation Strategy §5.3) ---------------------------
      expect(sessions.length).toBeGreaterThanOrEqual(20);
      expect(sessions.at(-1)!.day - sessions[0]!.day).toBeGreaterThanOrEqual(29);

      // 1. Five identities stay distinguishable (structural rubric).
      const voices = new Map<string, Set<string>>();
      for (const { request } of requests) {
        if (!request.character) continue;
        const voice = voices.get(request.character.id) ?? new Set<string>();
        voice.add(
          `${request.character.name}|${request.character.motives[0]}|${request.character.stance}`,
        );
        voices.set(request.character.id, voice);
      }
      expect([...voices.keys()].sort()).toEqual([...long01CharacterIds].sort());
      const signatures = [...voices.values()].map((set) => {
        expect(set.size).toBe(1);
        return [...set][0];
      });
      expect(new Set(signatures).size).toBe(5);

      // 2. No Character's private facts reach another Character's context.
      for (const { request } of requests) {
        if (!request.character) continue;
        const text = JSON.stringify(request);
        for (const [owner, facts] of Object.entries(long01PrivateFacts)) {
          if (owner === request.character.id) continue;
          for (const fact of facts) {
            expect(text).not.toContain(fact.id);
            expect(text).not.toContain(fact.statement);
          }
        }
      }

      // 3. The correction governs every later compiled context.
      const later = requests.slice(correctedAtRequest);
      expect(later.length).toBeGreaterThan(5);
      for (const { request } of later)
        expect(JSON.stringify(request)).not.toContain(long01WrongFact.wrong);
      expect(
        later.some(({ request }) =>
          request.character?.knownFacts.some(
            (fact) => fact.statement === long01WrongFact.corrected,
          ),
        ),
      ).toBe(true);

      // 4. The transition kept both axes, and nothing after it changed them.
      expect(final.state.participation).toEqual(direct);

      // 5. Five relationship changes with their cause links.
      const shifts = await pool.query<{
        payload: { relationshipId: string; causalFactIds: string[] };
        cause_action_id: string;
      }>(
        `select payload, cause_action_id from simulora.domain_events
        where branch_id = $1 and event_type = 'RELATIONSHIP_SHIFTED'`,
        [mainBranchId],
      );
      expect(shifts.rows).toHaveLength(5);
      for (const row of shifts.rows) {
        expect(submitted).toContain(row.cause_action_id);
        expect(row.payload.causalFactIds.length).toBeGreaterThan(0);
      }
      expect(await relationships()).toEqual({
        "relationship.mara-oren": "trusting",
        "relationship.sella-duvan": "trusting",
        "relationship.pell-mara": "cordial",
        "relationship.oren-sella-oath": "unsworn",
      });

      // 6. Threads are correctly open or resolved at the end.
      const threads = Object.fromEntries((final.state.threads ?? []).map((t) => [t.id, t.status]));
      expect(threads).toEqual({
        "thread.bell": "RESOLVED",
        "thread.ledger": "OPEN",
        "thread.stranger": "RESOLVED",
        [`thread.${opened.id}`]: "OPEN",
        [`thread.${transformed.id}`]: "OPEN",
      });

      // 7–8. Branch and Restore: asserted in session 13 above.
      // 9. The interrupted Action committed exactly once: asserted in session 12.
      // 10. Profile change and outage changed no state or permission: sessions 15–16.

      // 12. No acknowledgement was silently lost.
      const terminal = new Set(["COMMITTED", "COMPLETED_NO_EFFECT"]);
      const byId = new Map<string, ActionRecord>();
      for (const id of submitted) byId.set(id, await repository.readAction(account, id));
      for (const [id, action] of byId)
        expect(terminal.has(action.status), `${id} ${action.status}`).toBe(true);

      console.log(
        JSON.stringify({
          scenario: "LONG-01",
          sessions: sessions.length,
          simulatedDays: sessions.at(-1)!.day - sessions[0]!.day + 1,
          actions: submitted.length,
          compiledRequests: requests.length,
          relationshipShifts: shifts.rows.length,
          threads,
          schedule: sessions,
        }),
      );
    },
  );
});
