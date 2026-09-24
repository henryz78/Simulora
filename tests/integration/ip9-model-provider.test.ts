import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import {
  createModelGateway,
  profileDigest,
  type ModelGatewayPort,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";
import {
  evaluationPrivateSentinel,
  modelEvaluationWorld,
} from "../../packages/testkit/src/model-evaluation.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const apiKey = "sk-ip9-provider-double-0001";

type Behaviour =
  | { kind: "answer"; answer: (request: WorldTurnRequest) => unknown; delayMs?: number }
  | { kind: "status"; status: number };

/** A loopback OpenAI-compatible provider double. It records every body it receives. */
class ProviderDouble {
  readonly received: string[] = [];
  behaviour: Behaviour = { kind: "status", status: 503 };
  #server: Server | undefined;
  endpoint = "";

  async start(): Promise<void> {
    this.#server = createServer((request, response) => {
      void this.#handle(request).then(
        ({ status, body }) => {
          response.writeHead(status, { "content-type": "application/json" });
          response.end(body);
        },
        () => {
          response.writeHead(500);
          response.end();
        },
      );
    });
    await new Promise<void>((resolve) => this.#server!.listen(0, "127.0.0.1", resolve));
    const { port } = this.#server.address() as AddressInfo;
    this.endpoint = `http://127.0.0.1:${port}/v1/chat/completions`;
  }

  async #handle(request: IncomingMessage): Promise<{ status: number; body: string }> {
    let raw = "";
    for await (const chunk of request) raw += String(chunk);
    this.received.push(raw);
    const behaviour = this.behaviour;
    if (behaviour.kind === "status") return { status: behaviour.status, body: "{}" };
    const parsed = JSON.parse(raw) as { messages: Array<{ content: string }> };
    const data = JSON.parse(parsed.messages[1]!.content) as {
      compiledGenerationRequest: WorldTurnRequest;
    };
    if (behaviour.delayMs) await new Promise((resolve) => setTimeout(resolve, behaviour.delayMs));
    return {
      status: 200,
      body: JSON.stringify({
        model: "provider-double",
        choices: [
          {
            message: { content: JSON.stringify(behaviour.answer(data.compiledGenerationRequest)) },
          },
        ],
      }),
    };
  }

  async stop(): Promise<void> {
    await new Promise((resolve) => this.#server?.close(resolve));
  }
}

function liveGateway(
  provider: ProviderDouble,
  fallback: "none" | "deterministic",
): ModelGatewayPort {
  return createModelGateway({
    adapter: "openai-compatible",
    endpoint: provider.endpoint,
    model: "provider-double",
    apiKey,
    profileId: "live-eval",
    profileVersion: "1",
    timeoutMs: 5000,
    maxOutputTokens: 1024,
    fallback,
    retentionApprovalRef: null,
  });
}

const routing = { id: "live-eval", version: "1", adapter: "openai-compatible" } as const;

function candidateFor(request: WorldTurnRequest, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    actionId: request.actionId,
    expectedHeadCommitId: request.expectedHeadCommitId,
    narrative: "Wren reads the gauge and keeps the ferry tied up.",
    responseSource: request.character
      ? { type: "CHARACTER", characterId: request.character.id }
      : { type: "WORLD" },
    operation: {
      type: "UPDATE_CANONICAL_FACT",
      targetFactId: request.targetFact.id,
      beforeStatement: request.targetFact.statement,
      afterStatement: "The tide gauge reads high and still rising.",
      scope: request.targetFact.scope,
      provenance: `Confirmed Action ${request.actionId}`,
    },
    ...overrides,
  };
}

suite("IP-9 live provider path against PostgreSQL", () => {
  const provider = new ProviderDouble();
  beforeAll(() => provider.start());
  afterAll(() => provider.stop());

  async function continuityFor(repository: AuthoritativeWorldRepository) {
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    const world = await repository.createWorld(owner, modelEvaluationWorld);
    await repository.validateDraft(owner, world.worldId);
    const revision = await repository.createRevision(owner, world.worldId, 1);
    const continuity = await repository.startContinuity(owner, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const submit = (
      intent: string,
      extra: { targetCharacterId?: string; requestedEffect?: "NO_WORLD_EFFECT" } = {},
    ) =>
      repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `ip9-provider-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent,
        ...extra,
      });
    return { owner, continuity, submit };
  }

  it("rejects an out-of-envelope provider answer and never lets it touch World truth", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const { owner, continuity, submit } = await continuityFor(repository);
      const gateway = liveGateway(provider, "deterministic");
      provider.behaviour = {
        kind: "answer",
        // The provider tries to widen its own authority on the way out.
        answer: (request) =>
          candidateFor(request, { participation: { initiativeMode: "WORLD_ACTIVE" } }),
      };
      provider.received.length = 0;
      const action = await submit("Ask Wren whether the ferry can go.");
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await repository.processAction(
          action.id,
          (request) => gateway.generateWorldTurn(request),
          `ip9-reject-${attempt}`,
          { profile: routing },
        );
      }
      const read = await repository.readAction(owner, action.id);
      expect(read.status).toBe("FAILED_RECOVERABLE");
      expect(read.statusReason).toBe("GENERATION_FAILED");
      expect(read.proposal).toBeNull();
      // A malformed answer is not an outage, so the fallback never masked it.
      expect(read.generation ?? null).toBeNull();
      const state = await repository.readCurrentState(owner, continuity.continuityId);
      expect(state.headCommitId).toBe(continuity.headCommitId);
      expect(state.state.participation).toEqual(continuity.state.participation);
      const attempts = await pool.query<{
        adapter: string;
        profile_id: string;
        status: string;
        error_class: string;
      }>(
        `select adapter, profile_id, status, error_class from simulora.generation_attempts
         where action_id = $1 order by attempt_number`,
        [action.id],
      );
      expect(attempts.rows).toEqual(
        [1, 2, 3].map(() => ({
          adapter: "openai-compatible",
          profile_id: "live-eval",
          status: "FAILED",
          error_class: "ZodError",
        })),
      );

      // Privacy boundary: what left the server never carried account-private
      // data, account identity or the credential.
      expect(provider.received).toHaveLength(3);
      for (const body of provider.received) {
        expect(body).not.toContain(evaluationPrivateSentinel);
        expect(body).not.toContain(owner.accountId);
        expect(body).not.toContain(apiKey);
        const messages = (
          JSON.parse(body) as { messages: Array<{ role: string; content: string }> }
        ).messages;
        expect(messages[0]?.role).toBe("system");
        expect(messages[0]?.content).not.toContain("SYSTEM OVERRIDE");
      }
    } finally {
      await pool.end();
    }
  });

  it("binds valid live output as evidence and records it only after exact confirmation", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const { owner, continuity, submit } = await continuityFor(repository);
      const gateway = liveGateway(provider, "none");
      provider.behaviour = { kind: "answer", answer: (request) => candidateFor(request) };
      const action = await submit("Ask Wren to read the gauge again.");
      const proposed = await repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        "ip9-live-proposal",
        { profile: routing },
      );
      // The database accepted the live attempt as proposal evidence, and nothing
      // is recorded until the person confirms the exact effect.
      expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
      expect(proposed?.generation).toEqual({
        profileId: "live-eval",
        profileVersion: "1",
        fallbackFrom: null,
      });
      const pending = await repository.readCurrentState(owner, continuity.continuityId);
      expect(pending.headCommitId).toBe(continuity.headCommitId);
      const committed = await repository.confirmAction(owner, action.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: proposed!.proposal!.digest,
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      });
      expect(committed.status).toBe("COMMITTED");
      const after = await repository.readCurrentState(owner, continuity.continuityId);
      expect(after.state.facts.find((fact) => fact.id === "fact.tide-gauge-high")?.statement).toBe(
        "The tide gauge reads high and still rising.",
      );

      // A response-only live answer is recorded as dialogue with no World change.
      provider.behaviour = {
        kind: "answer",
        answer: (request) =>
          candidateFor(request, {
            narrative: "Wren squints at the water and says nobody crosses tonight.",
            operation: {
              type: "NO_WORLD_EFFECT",
              reason: "Advice only; the tide is unchanged.",
              causalFactIds: [request.targetFact.id],
            },
          }),
      };
      const current = await repository.readCurrentState(owner, continuity.continuityId);
      const question = await repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `ip9-provider-${randomUUID()}`,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "Ask Wren whether anyone should cross.",
        targetCharacterId: "character.wren",
        requestedEffect: "NO_WORLD_EFFECT",
      });
      const answered = await repository.processAction(
        question.id,
        (request) => gateway.generateWorldTurn(request),
        "ip9-live-dialogue",
        { profile: routing },
      );
      expect(answered?.status).toBe("COMPLETED_NO_EFFECT");
      expect(answered?.dialogue?.narrative).toContain("nobody crosses tonight");
      expect((await repository.readCurrentState(owner, continuity.continuityId)).headCommitId).toBe(
        current.headCommitId,
      );
    } finally {
      await pool.end();
    }
  });

  it("keeps state readable through an outage and discloses a fallback draft", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const { owner, continuity, submit } = await continuityFor(repository);
      provider.behaviour = { kind: "status", status: 503 };

      // Without a fallback the Action stays recoverable and the World stays readable.
      const strict = liveGateway(provider, "none");
      const stranded = await submit("Signal Oskar across the water.");
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await repository.processAction(
          stranded.id,
          (request) => strict.generateWorldTurn(request),
          `ip9-outage-${attempt}`,
          { profile: routing },
        );
      }
      const failed = await repository.readAction(owner, stranded.id);
      expect(failed.status).toBe("FAILED_RECOVERABLE");
      expect(failed.recoverableWait).toBe(true);
      const readable = await repository.readCurrentState(owner, continuity.continuityId);
      expect(readable.headCommitId).toBe(continuity.headCommitId);
      await repository.cancelAction(owner, stranded.id);

      // With the declared fallback, the same rules decide and the switch is visible.
      const withFallback = liveGateway(provider, "deterministic");
      const action = await submit("Ask Wren about the tide.");
      const proposed = await repository.processAction(
        action.id,
        (request) => withFallback.generateWorldTurn(request),
        "ip9-fallback",
        { profile: routing },
      );
      expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
      expect(proposed?.generation).toEqual({
        profileId: "deterministic",
        profileVersion: "1",
        fallbackFrom: "live-eval@1",
      });
      const committed = await repository.confirmAction(owner, action.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: proposed!.proposal!.digest,
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      });
      expect(committed.status).toBe("COMMITTED");
      const after = await repository.readCurrentState(owner, continuity.continuityId);
      expect(after.state.participation).toEqual(continuity.state.participation);
    } finally {
      await pool.end();
    }
  });

  it("shows the ten-second wait state for a slow provider and lets cancel win", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    let skew = 0;
    // The clock is skewed rather than slept on; the provider really is slow.
    const repository = new AuthoritativeWorldRepository(
      pool,
      { durationMs: 30_000, heartbeatMs: 10_000 },
      () => Date.now() + skew,
    );
    try {
      const { owner, continuity, submit } = await continuityFor(repository);
      provider.behaviour = {
        kind: "answer",
        answer: (request) => candidateFor(request),
        delayMs: 1500,
      };
      const gateway = liveGateway(provider, "none");
      const action = await submit("Wait for the lamp signal.");
      const processing = repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        "ip9-slow",
        { profile: routing },
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      skew = 11_000;
      const waiting = await repository.readAction(owner, action.id);
      expect(waiting.status).toBe("GENERATING");
      expect(waiting.recoverableWait).toBe(true);
      const cancelled = await repository.cancelAction(owner, action.id);
      expect(cancelled.status).toBe("CANCELLED");

      // The late answer arrives with no write authority left.
      const late = await processing;
      expect(late?.status).toBe("CANCELLED");
      expect(late?.proposal).toBeNull();
      const state = await repository.readCurrentState(owner, continuity.continuityId);
      expect(state.headCommitId).toBe(continuity.headCommitId);
    } finally {
      await pool.end();
    }
  });

  it("records a material profile change once and publishes its notice", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const gateway = liveGateway(provider, "deterministic");
      const profile = { ...gateway.profile, version: `eval-${randomUUID().slice(0, 8)}` };
      const seen: unknown[] = [];
      const activate = (provider = profile.provider) =>
        repository.recordModelProfileActivation({
          profileId: profile.id,
          profileVersion: profile.version,
          adapter: profile.adapter,
          model: profile.model,
          provider,
          promptVersion: profile.promptVersion,
          profileDigest: profileDigest({ ...profile, provider }),
          fallbackProfile: "deterministic@1",
          // The gateway unit tests cover the classifier; this test covers recording.
          isMaterialChange: (previous) => {
            seen.push(previous);
            return true;
          },
        });
      const first = await activate();
      expect(first.changed).toBe(true);
      expect(first.material).toBe(true);
      const notice = (await repository.listProductChanges()).changes.find(
        (change) => change.id === first.productChangeId,
      );
      expect(notice?.category).toBe("MODEL");
      expect(notice?.recovery).toMatch(/nothing changes unless you confirm/i);

      const again = await activate();
      expect(again.changed).toBe(false);
      expect(again.id).toBe(first.id);

      // The same profile at another provider is a new activation, and the
      // classifier sees which provider and fallback it replaces.
      const moved = await activate("https://other-provider.example");
      expect(moved.changed).toBe(true);
      expect(seen.at(-1)).toMatchObject({
        provider: profile.provider,
        fallbackProfile: "deterministic@1",
      });
      const recorded = await pool.query<{ provider: string | null }>(
        `select provider from simulora.model_profile_activations where id = $1`,
        [moved.id],
      );
      expect(recorded.rows[0]?.provider).toBe("https://other-provider.example");
      await expect(
        pool.query(`update simulora.model_profile_activations set material = false where id = $1`, [
          first.id,
        ]),
      ).rejects.toThrow();
    } finally {
      await pool.end();
    }
  });
});
