import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  WorldContinuityService,
  createInitialState,
  lanternReachSeed,
  type WorldContinuityPort,
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

  it("reports the authoritative IP-2 spine without claiming later capabilities", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/v1/foundation" });
    expect(response.statusCode).toBe(200);
    const foundation = foundationResponseSchema.parse(response.json());
    expect(foundation.productImplementationPhase).toBe("IP-2");
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
});
