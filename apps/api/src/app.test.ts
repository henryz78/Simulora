import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  ActionTruthService,
  WorldContinuityService,
  createInitialState,
  lanternReachSeed,
  type WorldContinuityPort,
  type ActionTruthPort,
} from "@simulora/application";
import { foundationResponseSchema } from "@simulora/contracts";
import { createApiApp } from "./app.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("API composition root", () => {
  it("returns a correlated health response", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.headers["x-correlation-id"]).toBe(response.headers["x-request-id"]);
    expect(response.json()).toEqual({ service: "api", status: "ok", version: "0.0.0" });
  });

  it("preserves an incoming correlation id for future worker envelopes", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-correlation-id": "correlation-1" },
    });
    expect(response.headers["x-correlation-id"]).toBe("correlation-1");
  });

  it("rejects an unsafe correlation header and generates a safe replacement", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-correlation-id": "unsafe value" },
    });
    expect(response.headers["x-correlation-id"]).not.toBe("unsafe value");
    expect(response.headers["x-correlation-id"]).toBe(response.headers["x-request-id"]);
  });

  it("reports the IP-5 Recovery phase without claiming later capabilities", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/v1/foundation" });
    expect(response.statusCode).toBe(200);
    const foundation = foundationResponseSchema.parse(response.json());
    expect(foundation.productImplementationPhase).toBe("IP-5");
    expect(foundation.productSemanticsStarted).toBe(true);
  });

  it("returns an authoritative Continuity read contract", async () => {
    const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;
    const state = createInitialState(lanternReachSeed, participation);
    const port: WorldContinuityPort = {
      createWorld: () => Promise.reject(new Error("unused")),
      updateDraft: () => Promise.reject(new Error("unused")),
      createRevision: () => Promise.reject(new Error("unused")),
      startContinuity: () => Promise.reject(new Error("unused")),
      readCurrentState: () =>
        Promise.resolve({
          continuityId: "10000000-0000-4000-8000-000000000001",
          branchId: "10000000-0000-4000-8000-000000000002",
          headCommitId: "10000000-0000-4000-8000-000000000003",
          stateRevisionId: "10000000-0000-4000-8000-000000000004",
          worldRevisionId: "10000000-0000-4000-8000-000000000005",
          worldRevisionNumber: 1,
          world: lanternReachSeed,
          state,
          stateHash: "a".repeat(64),
        }),
    };
    app = createApiApp({ logLevel: "error", worldService: new WorldContinuityService(port) });
    const response = await app.inject({
      method: "GET",
      url: "/v1/continuities/10000000-0000-4000-8000-000000000001/state",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      world: { title: "Lantern Reach" },
      state: { participation },
      continuity: { worldRevisionNumber: 1 },
    });
  });

  it("exposes durable acknowledgement and resumable Action progress without claiming a Commit", async () => {
    let observedAfterSequence = -1;
    const action = {
      id: "10000000-0000-4000-8000-000000000010",
      continuityId: "10000000-0000-4000-8000-000000000001",
      branchId: "10000000-0000-4000-8000-000000000002",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000003",
      operationType: "PARTICIPATE" as const,
      status: "ACKNOWLEDGED" as const,
      intent: "Relight the western signal.",
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const,
      acknowledgedAt: new Date().toISOString(),
      terminalAt: null,
      recoverableWait: false,
      statusReason: null,
      progressUrl: "/v1/actions/10000000-0000-4000-8000-000000000010/progress",
      eventsUrl: "/v1/actions/10000000-0000-4000-8000-000000000010/events",
      proposal: null,
      commit: null,
    };
    const port: ActionTruthPort = {
      submitAction: () => Promise.resolve(action),
      readAction: () => Promise.resolve(action),
      confirmAction: () => Promise.resolve(action),
      cancelAction: () =>
        Promise.resolve({ ...action, status: "CANCELLED", terminalAt: new Date().toISOString() }),
      retryAction: () => Promise.resolve(action),
      readProgress: (_account, _actionId, afterSequence) => {
        observedAfterSequence = afterSequence;
        return Promise.resolve({
          actionId: action.id,
          frames:
            afterSequence < 1
              ? [
                  {
                    sequence: 1,
                    type: "action.status" as const,
                    payload: { status: "ACKNOWLEDGED" },
                    createdAt: new Date().toISOString(),
                  },
                ]
              : [],
          nextCursor: Math.max(afterSequence, 1),
          terminal: false,
        });
      },
      listBranchActions: () => Promise.resolve({ branchId: action.branchId, actions: [] }),
    };
    app = createApiApp({ logLevel: "error", actionService: new ActionTruthService(port) });
    const response = await app.inject({
      method: "POST",
      url: `/v1/branches/${action.branchId}/actions`,
      payload: {
        schemaVersion: 1,
        idempotencyKey: "action-test-key",
        expectedHeadCommitId: action.expectedHeadCommitId,
        participationExpectation: action.participationExpectation,
        intent: action.intent,
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: "ACKNOWLEDGED", commit: null });

    const progress = await app.inject({
      method: "GET",
      url: `/v1/actions/${action.id}/progress?after=0`,
    });
    expect(progress.statusCode).toBe(200);
    expect(progress.json()).toMatchObject({ nextCursor: 1, terminal: false });

    const events = await app.inject({
      method: "GET",
      url: `/v1/actions/${action.id}/events`,
      headers: { "last-event-id": "1" },
    });
    expect(events.statusCode).toBe(200);
    expect(events.headers["content-type"]).toContain("text/event-stream");
    expect(observedAfterSequence).toBe(1);
    expect(events.body).not.toContain("id: 1");
  });
});
