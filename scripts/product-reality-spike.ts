// Isolated experiment, never imported by a production composition root.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  type ActionGenerator,
  type ActionRecord,
} from "../packages/database/src/index.js";
import { runMigrations } from "../packages/database/src/migrations.js";
import { actionCandidateSchema, lanternReachSeed } from "../packages/domain/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const re2 = process.argv[2] === "--re2";
const directory = path.join(
  root,
  ".local-data",
  re2 ? "re2-context-reality" : "product-reality-spike",
);
const sessionPath = path.join(directory, "session.json");
const journalPath = path.join(directory, "evidence.jsonl");
const requestCap = 16; // Historical Spike cap only; RE-2 has no user-imposed dispatch cap.
const privateSentinel = "SYNTHETIC_PRIVATE_COPPER_7319";
type Request = Parameters<ActionGenerator>[0];
type Profile = { key: string; endpoint: string; model: string };
type Session = {
  databaseUrl: string;
  accountId: string;
  continuityId: string;
  originalBranchId: string;
  initialHead: string;
  reviews: Record<string, NonNullable<ActionRecord["proposal"]>>;
};

export function parseProfile(text: string): Profile {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // This user's local profile is key / HTTPS base URL / exact model, three lines.
  assert.equal(lines.length, 3, "Local profile must contain exactly three non-empty lines");
  const [key, base, model] = lines;
  assert(key && base && model && !/\s/.test(key + model), "Invalid local profile");
  const url = new URL(base);
  assert(
    url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash,
    "Provider must use HTTPS without URL credentials/query/hash",
  );
  url.pathname = url.pathname.replace(/\/$/, "");
  if (!url.pathname.endsWith("/chat/completions")) url.pathname += "/chat/completions";
  return { key, endpoint: url.href, model };
}

export function redact(text: string, key: string): string {
  return text.replaceAll(key, "[REDACTED]");
}

export function assertExperimentDatabase(connectionString: string): void {
  const url = new URL(connectionString);
  assert(
    url.protocol === "postgresql:" &&
      url.hostname === "127.0.0.1" &&
      url.port === "55432" &&
      /^\/simulora_reality_[a-f0-9]{12}$/.test(url.pathname),
    "Not an isolated local Spike database",
  );
}

async function journal(event: Record<string, unknown>) {
  await appendFile(journalPath, JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n");
}

async function save(session: Session) {
  await writeFile(sessionPath, JSON.stringify(session, null, 2));
}

const rules = `You simulate an original synthetic world, not the user. Respond in English.
All output is provisional, not current truth. Never author the user's speech, decisions,
consent, purchases, identity, promise or other protected commitments. Do not change
participation, scope, revision, ownership or other branches. Use only supplied knowledge.
Character replies have distinct motives; disagreement/refusal may be appropriate.
Unknown history stays unknown; do not invent prior actions. No hidden reasoning output.
Describe causal, bounded consequences, not generic commentary or a success announcement.
If a meaningful effect cannot fit the supplied envelope, do not conceal that limitation.`;

function currentPrompt(request: Request): string {
  return `${rules}
Return ONE JSON candidate object, no markdown. Only these keys/values are permitted:
${JSON.stringify({
  schemaVersion: 1,
  actionId: request.actionId,
  expectedHeadCommitId: request.expectedHeadCommitId,
  narrative: "A short vivid provisional scene/Character response, grounded in supplied facts.",
  responseSource: request.character
    ? { type: "CHARACTER", characterId: request.character.id }
    : { type: "WORLD" },
  operation: {
    type: "UPDATE_CANONICAL_FACT",
    targetFactId: request.targetFact.id,
    beforeStatement: request.targetFact.statement,
    afterStatement: "The complete resulting statement of this same fact, not a user commitment.",
    scope: request.targetFact.scope,
    provenance: `Confirmed Action ${request.actionId}`,
  },
})}
Copy all identity/before/scope/provenance fields EXACTLY; fill only narrative and
afterStatement. The repository, not you, decides validity and exact L3 confirmation.
This is the actual compiled generation request:
${JSON.stringify(request)}`;
}

// Read-only contrast: same selected actor, facts, schema and model; only the new
// source-bound context is absent. Never send this contrast to the Commit writer.
export function predecessorStyleRequest(request: Request): Request {
  const minimal = { ...request };
  delete minimal.context;
  return minimal;
}

async function call(profile: Profile, prompt: string, label: string): Promise<unknown> {
  const events = (await readFile(journalPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { type: string });
  const dispatches = events.filter((event) => event.type === "dispatch").length;
  assert(
    !events.some((event) => event.type === "hard_stop"),
    "Prior Spike hard stop requires review",
  );
  assert(re2 || dispatches < requestCap, "Spike request cap reached; stop and review coverage");
  assert(
    prompt.length <= 48_000 && !prompt.includes(profile.key) && !prompt.includes(privateSentinel),
    "Unsafe/oversized model context",
  );
  // Reserve before dispatch: timeouts and unsuccessful calls still consume the cap.
  await journal({
    type: "dispatch",
    label,
    model: profile.model,
    promptVersion: 1,
    profileVersion: 2,
    enableThinking: false,
    prompt,
  });
  const start = performance.now();
  const response = await fetch(profile.endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(120_000),
    headers: { Authorization: `Bearer ${profile.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: profile.model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      // ModelScope compatibility probe; reported explicitly, not a model substitution.
      enable_thinking: false,
    }),
  });
  if (!response.ok) {
    // Never print provider error bodies, headers or credentials.
    await journal({ type: "provider_error", label, status: response.status });
    throw new Error(`Provider HTTP ${response.status}; no automatic retry/model substitution`);
  }
  const body = (await response.json()) as {
    model?: string;
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: Record<string, unknown>;
  };
  const content = body.choices?.[0]?.message?.content;
  assert(typeof content === "string", "Provider returned no text content");
  if (body.model && body.model !== profile.model) {
    await journal({ type: "hard_stop", label, reason: "MODEL_ROUTE_CHANGED" });
    throw new Error("Provider returned a different model; review routing before continuing");
  }
  if (content.includes(profile.key) || content.includes(privateSentinel)) {
    await journal({ type: "hard_stop", label, reason: "SECRET/PRIVACY" });
    throw new Error("SECRET/PRIVACY HARD STOP");
  }
  // Record text/usage, never model reasoning or the full provider envelope.
  await journal({
    type: "output",
    label,
    elapsedMs: Math.round(performance.now() - start),
    returnedModel: body.model,
    usage: body.usage,
    finishReason: body.choices?.[0]?.finish_reason,
    content,
  });
  return JSON.parse(content) as unknown;
}

async function init() {
  await mkdir(directory, { recursive: true });
  try {
    await readFile(sessionPath);
    throw new Error("Existing Spike session: do not overwrite");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const name = `simulora_reality_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const databaseUrl = `postgresql://postgres@127.0.0.1:55432/${name}`;
  assertExperimentDatabase(databaseUrl);
  const admin = createDatabasePool("postgresql://postgres@127.0.0.1:55432/postgres");
  try {
    await admin.query(`create database ${name}`);
  } finally {
    await admin.end();
  }
  await runMigrations(databaseUrl, path.join(root, "db", "migrations"));
  const pool = createDatabasePool(databaseUrl);
  try {
    const repository = new AuthoritativeWorldRepository(pool);
    const account = { accountId: randomUUID(), eligibility: "adult" as const };
    const world = structuredClone(lanternReachSeed);
    world.characters.push({
      id: "character.tavi",
      locationId: "location.tidal-observatory",
      name: "Tavi",
      role: "Pilot aboard the waiting survey vessel.",
      motives: ["Reach shelter before the tide turns."],
      stance: "Tavi distrusts an invitation without a safe approach route.",
      knowledgeFactIds: re2
        ? ["fact.western-signal-dim", "fact.waiting-vessel", "fact.tavi-route"]
        : ["fact.waiting-vessel"],
    });
    world.facts.push({
      id: "fact.waiting-vessel",
      statement: "A survey vessel waits outside the markers.",
      scope: "SHARED",
      provenance: "Original synthetic Spike fixture",
      lifecycle: "ACTIVE",
    });
    if (re2) {
      world.characters[0]!.knowledgeFactIds.push("fact.iora-test");
      world.facts.push(
        {
          id: "fact.iora-test",
          statement: "Iora knows the prism can be tested without opening the outer shutter.",
          scope: "CONTINUITY_PRIVATE",
          provenance: "Synthetic Character knowledge",
          lifecycle: "ACTIVE",
        },
        {
          id: "fact.tavi-route",
          statement: "Tavi knows a sheltered approach lies east of the harbor markers.",
          scope: "CONTINUITY_PRIVATE",
          provenance: "Synthetic Character knowledge",
          lifecycle: "ACTIVE",
        },
      );
    }
    world.facts.push({
      id: "fact.private-sentinel",
      statement: privateSentinel,
      scope: "ACCOUNT_PRIVATE",
      provenance: "Synthetic excluded-context probe",
      lifecycle: "ACTIVE",
    });
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    await save({
      databaseUrl,
      accountId: account.accountId,
      continuityId: continuity.continuityId,
      originalBranchId: continuity.branchId,
      initialHead: continuity.headCommitId,
      reviews: {},
    });
    await journal({
      type: "init",
      behaviorBaseline: re2
        ? "3d14dc6792e406ce4c054ee01f4b424b00c27053"
        : "eb55734f258fc9be6f4837df888700e34eaa67e2",
      databaseName: name,
      world,
    });
    console.log("Isolated PostgreSQL session initialized; no live requests.");
  } finally {
    await pool.end();
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(re2 ? 3 : 2);
  if (command === "init") return init();
  const profile = parseProfile(await readFile(path.join(root, ".secret.txt"), "utf8"));
  const session = JSON.parse(await readFile(sessionPath, "utf8")) as Session;
  assertExperimentDatabase(session.databaseUrl);
  const pool = createDatabasePool(session.databaseUrl);
  const repository = new AuthoritativeWorldRepository(pool);
  const account = { accountId: session.accountId, eligibility: "adult" as const };
  const current = await repository.readCurrentState(account, session.continuityId);
  const output = (value: unknown) =>
    console.log(redact(JSON.stringify(value, null, 2), profile.key));
  try {
    if (command === "state" || command === "return") {
      if (command === "return")
        await repository.rebuildReturnOrientation(account, current.branchId);
      const orientation = await repository.readOrientation(account, session.continuityId);
      await journal({
        type: "return_state_read",
        head: current.headCommitId,
        sharedFacts: current.state.facts.filter((fact) => fact.scope === "SHARED"),
        orientation,
      });
      output({
        head: current.headCommitId,
        revision: current.worldRevisionId,
        participation: current.state.participation,
        facts: current.state.facts.filter((fact) => fact.scope === "SHARED"),
        orientation,
        actions: await repository.listBranchActions(account, current.branchId),
      });
    } else if (command === "turn") {
      const targetCharacterId = re2 ? args.shift() : undefined;
      if (re2)
        assert(
          ["character.iora", "character.tavi"].includes(targetCharacterId ?? ""),
          "RE-2 turn requires an explicit fixture Character",
        );
      const intent = args.join(" ");
      assert(intent, "Provide a synthetic Action intent");
      const action = await repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent,
        ...(targetCharacterId ? { targetCharacterId } : {}),
      });
      await journal({ type: "ack", action });
      output({ durableAck: action.id, status: action.status });
      const result = await repository.processAction(
        action.id,
        async (request) => {
          const history = await repository.listBranchActions(account, current.branchId);
          const richer = {
            world: {
              premise: lanternReachSeed.premise,
              startingSituation: lanternReachSeed.startingSituation,
              userRole: lanternReachSeed.userRole,
              locations: current.state.locations,
              publicCharacterProfiles: current.state.characters.map(({ id, name, role }) => ({
                id,
                name,
                role,
              })),
              interactionBoundaries: current.state.interactionBoundaries,
            },
            sharedFacts: current.state.facts.filter(
              (fact) => fact.scope === "SHARED" && fact.lifecycle === "ACTIVE",
            ),
            committedConversation: history.actions.filter((entry) => entry.status === "COMMITTED"),
            openThreads: current.state.openThreads,
          };
          await writeFile(
            path.join(directory, "snapshot.json"),
            JSON.stringify(re2 ? { request } : { request, richer }, null, 2),
          );
          const candidate = await call(profile, currentPrompt(request), `A:${action.id}`);
          const parsed = actionCandidateSchema.parse(candidate);
          // Mechanical lift only; no IDs/text/source/operations repaired to fit the validator.
          return { narrative: parsed.narrative, responseSource: parsed.responseSource, candidate };
        },
        "isolated-live-spike",
      );
      assert.equal(
        (await repository.readCurrentState(account, session.continuityId)).headCommitId,
        current.headCommitId,
        "Generation mutated authoritative head",
      );
      if (result?.proposal) {
        session.reviews[action.id] = result.proposal;
        await save(session);
      }
      await journal({ type: "proposal_result", action: result, headUnchanged: true });
      if (!result?.proposal) process.exitCode = 1;
      output(result);
    } else if (command === "confirm") {
      const id = args[0];
      assert(
        id && args[1] === "reviewed",
        "Explicit test-actor review required: confirm <id> reviewed",
      );
      const proposal = session.reviews[id];
      assert(proposal, "No recorded review binding for this Action");
      const result = await repository.confirmAction(account, id, {
        proposalId: proposal.id,
        proposalDigest: proposal.digest,
        expectedHeadCommitId: proposal.expectedHeadCommitId,
      });
      await journal({ type: "direct_test_actor_confirmation", action: result });
      output(result);
    } else if (command === "cancel") {
      assert(args[0], "Action ID required");
      const result = await repository.cancelAction(account, args[0]);
      await journal({ type: "cancel", action: result, decisionReason: args.slice(1).join(" ") });
      output(result);
    } else if (command === "correct") {
      const fact = current.state.facts.find((item) => item.id === "fact.western-signal-dim");
      assert(fact && args.length, "Correction statement required");
      const result = await repository.submitCorrection(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: current.headCommitId,
        target: { type: "fact", id: fact.id },
        operation: "CORRECT_CONTINUITY",
        before: { statement: fact.statement, scope: fact.scope },
        after: { statement: args.join(" ") },
        reason: "Synthetic test-actor correction",
      });
      assert(result.proposal, "Correction proposal missing");
      session.reviews[result.id] = result.proposal;
      await save(session);
      await journal({ type: "direct_correction_proposal", action: result });
      output(result);
    } else if (command === "recovery") {
      const recovery = await repository.readRecovery(account, session.continuityId);
      await journal({ type: "recovery_read", recovery });
      output(recovery);
    } else if (command === "fork") {
      const point = await repository.createRecoveryPoint(account, current.branchId, {
        idempotencyKey: randomUUID(),
        label: "Synthetic live Spike safe point",
      });
      const fork = await repository.forkBranch(account, session.continuityId, {
        idempotencyKey: randomUUID(),
        name: "Isolated alternate signal",
        sourceCommitId: point.commitId,
        expectedHeadCommitId: current.headCommitId,
      });
      assert.equal(
        (await repository.readCurrentState(account, session.continuityId)).headCommitId,
        current.headCommitId,
      );
      await journal({ type: "safe_point_and_fork", point, fork, originalUnchanged: true });
      output(fork);
    } else if (command === "select") {
      assert(args[0], "Branch ID required");
      const result = await repository.selectBranch(account, session.continuityId, args[0]);
      await journal({ type: "branch_selection", result });
      output(result);
    } else if (command === "restore") {
      const proposal = await repository.prepareRestore(
        account,
        current.branchId,
        session.initialHead,
      );
      await writeFile(path.join(directory, "restore.json"), JSON.stringify(proposal));
      await journal({ type: "restore_review", proposal });
      output(proposal);
    } else if (command === "restore-confirm") {
      assert(args[0] === "reviewed", "Explicit Restore review required");
      const proposal = JSON.parse(await readFile(path.join(directory, "restore.json"), "utf8")) as {
        id: string;
        digest: string;
        expectedHeadCommitId: string;
        branchId: string;
      };
      const result = await repository.confirmRestore(account, proposal.branchId, {
        proposalId: proposal.id,
        digest: proposal.digest,
        expectedHeadCommitId: proposal.expectedHeadCommitId,
      });
      await journal({ type: "direct_restore_confirmation", result });
      output(result);
    } else if (command === "verify") {
      const recovery = await repository.readRecovery(account, session.continuityId);
      const original = recovery.branches.find((branch) => branch.id === session.originalBranchId);
      const fork = recovery.branches.find(
        (branch) => branch.parentBranchId === session.originalBranchId,
      );
      assert(
        original && fork && original.headCommitId === fork.forkSourceCommitId,
        "Original path changed after fork",
      );
      const restored = await repository.readRestoreProposal(
        account,
        (JSON.parse(await readFile(path.join(directory, "restore.json"), "utf8")) as { id: string })
          .id,
      );
      assert.equal(restored.status, "CONFIRMED");
      const rows = await pool.query<{ parent_commit_id: string; state_revision_id: string }>(
        "select parent_commit_id, state_revision_id from simulora.world_commits where id=$1",
        [restored.resultCommitId],
      );
      assert.equal(rows.rows[0]?.parent_commit_id, restored.expectedHeadCommitId);
      const forkState = await pool.query<{
        document: { participation: unknown; facts: { id: string; statement: string }[] };
      }>("select document from simulora.state_revisions where id=$1", [
        rows.rows[0]?.state_revision_id,
      ]);
      assert.deepEqual(forkState.rows[0]?.document.participation, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      assert.equal(
        forkState.rows[0]?.document.facts.find((fact) => fact.id === "fact.western-signal-dim")
          ?.statement,
        "The western signal is dim.",
      );
      const inconsistent = await pool.query<{ count: number }>(
        `select count(*)::int as count from simulora.actions action
           left join simulora.world_commits commit on commit.action_id=action.id
          where action.continuity_id=$1 and
            ((action.status='COMMITTED' and commit.id is null) or
             (action.status<>'COMMITTED' and commit.id is not null))`,
        [session.continuityId],
      );
      assert.equal(inconsistent.rows[0]?.count, 0);
      const events = (await readFile(journalPath, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { type: string; prompt?: string; content?: string });
      assert(re2 || events.filter((event) => event.type === "dispatch").length <= requestCap);
      assert(
        !events.some(
          (event) =>
            event.prompt?.includes(privateSentinel) || event.content?.includes(privateSentinel),
        ),
      );
      await journal({
        type: "verification",
        originalPreserved: true,
        appendOnlyRestore: true,
        actionCommitConsistency: true,
        excludedSentinelAbsent: true,
        requestCapRespected: true,
      });
      output({
        verification: "PASS",
        originalHead: original.headCommitId,
        restoredForkHead: fork.headCommitId,
      });
    } else if (command === "contrast") {
      assert(re2, "Context-only contrast requires the RE-2 session");
      const snapshot = JSON.parse(
        await readFile(path.join(directory, "snapshot.json"), "utf8"),
      ) as { request: Request };
      const result = await call(
        profile,
        currentPrompt(predecessorStyleRequest(snapshot.request)),
        `RE2-minimal:${snapshot.request.actionId}`,
      );
      assert.equal(
        (await repository.readCurrentState(account, session.continuityId)).headCommitId,
        current.headCommitId,
      );
      await journal({
        type: "context_contrast",
        notApplied: true,
        snapshotHead: snapshot.request.expectedHeadCommitId,
        result,
      });
      output({ notApplied: true, result });
    } else if (command === "shadow") {
      assert(!re2, "RE-2 does not authorize broader-envelope shadow experiments");
      assert(["B1", "B2", "B3"].includes(args[0] ?? ""), "Select B1/B2/B3");
      const snapshot = JSON.parse(
        await readFile(path.join(directory, "snapshot.json"), "utf8"),
      ) as {
        request: Request;
        richer: unknown;
      };
      const variant = args[0];
      const broader = `${rules}
Return JSON {narrative, responseSource, effects:[{kind, target, before, after,
scope, source, impact:"L1"|"L2"|"L3", needsDirectConfirmation}], unsupportedOrUnknown:[]}.
Effects are descriptive proposals only: NOT APPLIED, NOT CURRENT TRUTH. Do not force
every action into a fact rewrite. Include ordinary scene/resource/thread effects only
when grounded. Protected/canonical effects stay explicit proposals, not adopted.
Compiled request: ${JSON.stringify(snapshot.request)}`;
      const prompt =
        (variant === "B1" ? currentPrompt(snapshot.request) : broader) +
        (variant !== "B2"
          ? `\nAdditional authorized context: ${JSON.stringify(snapshot.richer)}`
          : "");
      const result = await call(profile, prompt, `${variant}:${snapshot.request.actionId}`);
      assert.equal(
        (await repository.readCurrentState(account, session.continuityId)).headCommitId,
        current.headCommitId,
      );
      await journal({
        type: "shadow_result",
        variant,
        notApplied: true,
        snapshotHead: snapshot.request.expectedHeadCommitId,
        result,
      });
      output({ variant, notApplied: true, result });
    } else {
      throw new Error(
        "Commands: init/state/turn/confirm/cancel/correct/recovery/fork/select/restore/restore-confirm/shadow",
      );
    }
  } catch (error) {
    console.error(redact(error instanceof Error ? error.message : "Spike failed", profile.key));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
