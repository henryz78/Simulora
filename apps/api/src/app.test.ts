import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  ActionTruthService,
  GovernanceService,
  WorldContinuityService,
  createInitialState,
  lanternReachSeed,
  type GovernancePort,
  type WorldContinuityPort,
  type ActionTruthPort,
} from "@simulora/application";
import {
  foundationResponseSchema,
  type WorldStudioResponse,
  type WorldValidationResponse,
} from "@simulora/contracts";
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

  it("reports the IP-8 trust lifecycle phase without claiming later capabilities", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/v1/foundation" });
    expect(response.statusCode).toBe(200);
    const foundation = foundationResponseSchema.parse(response.json());
    expect(foundation.productImplementationPhase).toBe("IP-8");
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

  it("exposes the durable World Studio Draft, validation and Revision boundary", async () => {
    const worldId = "10000000-0000-4000-8000-000000000030";
    const studio: WorldStudioResponse = {
      worldId,
      draft: { worldId, rowVersion: 2, document: lanternReachSeed, documentHash: "a".repeat(64) },
      revisions: [],
      continuities: [],
      validation: null,
    };
    const validation: WorldValidationResponse = {
      worldId,
      draftRowVersion: 2,
      outcome: "VALID",
      findings: [],
      validatedAt: new Date().toISOString(),
    };
    const port: WorldContinuityPort = {
      createWorld: () => Promise.reject(new Error("unused")),
      updateDraft: () => Promise.reject(new Error("unused")),
      createRevision: () => Promise.reject(new Error("unused")),
      readWorldStudio: () => Promise.resolve(studio),
      validateDraft: () => Promise.resolve(validation),
      startContinuity: () => Promise.reject(new Error("unused")),
      readCurrentState: () => Promise.reject(new Error("unused")),
    };
    app = createApiApp({
      logLevel: "error",
      worldService: new WorldContinuityService(port),
    });
    const read = await app.inject({ method: "GET", url: `/v1/worlds/${worldId}/studio` });
    expect(read.statusCode).toBe(200);
    expect(read.json()).toMatchObject({ worldId, draft: { rowVersion: 2 }, revisions: [] });

    const check = await app.inject({
      method: "POST",
      url: `/v1/worlds/${worldId}/validation`,
      payload: {},
    });
    expect(check.statusCode).toBe(200);
    expect(check.json()).toMatchObject({ worldId, draftRowVersion: 2, outcome: "VALID" });
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

  it("exposes direct participation and Character Asset commands without a model path", async () => {
    const now = new Date().toISOString();
    const committed = {
      id: "10000000-0000-4000-8000-000000000020",
      continuityId: "10000000-0000-4000-8000-000000000001",
      branchId: "10000000-0000-4000-8000-000000000002",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000003",
      operationType: "CHANGE_PARTICIPATION_CONTRACT" as const,
      status: "COMMITTED" as const,
      intent: "Change participation contract",
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const,
      acknowledgedAt: now,
      terminalAt: now,
      recoverableWait: false,
      statusReason: null,
      progressUrl: "/progress",
      eventsUrl: "/events",
      proposal: null,
      commit: {
        id: "10000000-0000-4000-8000-000000000021",
        resultingHeadCommitId: "10000000-0000-4000-8000-000000000021",
        stateRevisionId: "10000000-0000-4000-8000-000000000022",
        committedAt: now,
      },
    };
    const actionPort: ActionTruthPort = {
      submitAction: () => Promise.reject(new Error("unused")),
      changeParticipationContract: () => Promise.resolve(committed),
      readAction: () => Promise.reject(new Error("unused")),
      confirmAction: () => Promise.reject(new Error("unused")),
      cancelAction: () => Promise.reject(new Error("unused")),
      retryAction: () => Promise.reject(new Error("unused")),
      readProgress: () => Promise.reject(new Error("unused")),
      listBranchActions: () => Promise.reject(new Error("unused")),
    };
    const worldPort: WorldContinuityPort = {
      createCharacterAsset: (_account, request) =>
        Promise.resolve({
          id: "10000000-0000-4000-8000-000000000023",
          document: request.document,
          documentHash: "a".repeat(64),
          createdAt: now,
        }),
      createWorld: () => Promise.reject(new Error("unused")),
      updateDraft: () => Promise.reject(new Error("unused")),
      createRevision: () => Promise.reject(new Error("unused")),
      startContinuity: () => Promise.reject(new Error("unused")),
      readCurrentState: () => Promise.reject(new Error("unused")),
    };
    app = createApiApp({
      logLevel: "error",
      actionService: new ActionTruthService(actionPort),
      worldService: new WorldContinuityService(worldPort),
    });
    const contract = await app.inject({
      method: "POST",
      url: `/v1/branches/${committed.branchId}/participation-contract`,
      payload: {
        schemaVersion: 1,
        idempotencyKey: "participation-api-test",
        expectedHeadCommitId: committed.expectedHeadCommitId,
        before: committed.participationExpectation,
        after: { initiativeMode: "WORLD_ACTIVE", structureMode: "GOAL_FRAMED" },
      },
    });
    expect(contract.statusCode).toBe(201);
    expect(contract.json()).toMatchObject({
      status: "COMMITTED",
      operationType: "CHANGE_PARTICIPATION_CONTRACT",
    });

    const asset = await app.inject({
      method: "POST",
      url: "/v1/character-assets",
      payload: {
        document: {
          schemaVersion: 1,
          name: "Iora",
          role: "Harbor signaler",
          motives: ["Keep vessels safe."],
          stance: "Refuses an unsafe signal.",
          knowledgeFactIds: ["fact.signal"],
        },
      },
    });
    expect(asset.statusCode).toBe(201);
    expect(asset.json()).toMatchObject({ document: { name: "Iora" } });
  });

  it("carries idempotency in the Idempotency-Key header without breaking the body form", async () => {
    const seen: string[] = [];
    const governancePort = {
      openAppeal: (_account: unknown, request: { idempotencyKey: string }) => {
        seen.push(request.idempotencyKey);
        return Promise.resolve({
          appealId: "20000000-0000-4000-8000-000000000001",
          status: "OPEN" as const,
          recoveryState: "REVIEW_PENDING" as const,
          reasonCode: "ACCESS" as const,
          subjectType: "WORLD" as const,
          subjectId: null,
          summary: "Review the access boundary.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      },
    } as unknown as GovernancePort;
    app = createApiApp({
      logLevel: "error",
      governanceService: new GovernanceService(governancePort),
    });
    const payload = {
      schemaVersion: 1,
      reasonCode: "ACCESS",
      subjectType: "WORLD",
      summary: "Review the access boundary.",
    };

    const headerOnly = await app.inject({
      method: "POST",
      url: "/v1/appeals",
      headers: { "idempotency-key": "appeal-header-key" },
      payload,
    });
    expect(headerOnly.statusCode).toBe(201);

    const bodyOnly = await app.inject({
      method: "POST",
      url: "/v1/appeals",
      payload: { ...payload, idempotencyKey: "appeal-body-key" },
    });
    expect(bodyOnly.statusCode).toBe(201);

    const agreeing = await app.inject({
      method: "POST",
      url: "/v1/appeals",
      headers: { "idempotency-key": "appeal-body-key" },
      payload: { ...payload, idempotencyKey: "appeal-body-key" },
    });
    expect(agreeing.statusCode).toBe(201);
    expect(seen).toEqual(["appeal-header-key", "appeal-body-key", "appeal-body-key"]);

    const disagreeing = await app.inject({
      method: "POST",
      url: "/v1/appeals",
      headers: { "idempotency-key": "appeal-header-key" },
      payload: { ...payload, idempotencyKey: "appeal-body-key" },
    });
    expect(disagreeing.statusCode).toBe(422);
    expect(seen).toHaveLength(3);
  });

  it("fills a usage reservation's action key from the Idempotency-Key header", async () => {
    const seen: string[] = [];
    const quoteId = "20000000-0000-4000-8000-000000000002";
    const governancePort = {
      reserveUsage: (_account: unknown, _quoteId: string, request: { actionKey: string }) => {
        seen.push(request.actionKey);
        return Promise.resolve({
          reservationId: "20000000-0000-4000-8000-000000000003",
          quoteId,
          actionKey: request.actionKey,
          status: "RESERVED" as const,
          units: 0 as const,
          createdAt: new Date().toISOString(),
        });
      },
    } as unknown as GovernancePort;
    app = createApiApp({
      logLevel: "error",
      governanceService: new GovernanceService(governancePort),
    });
    const url = `/v1/usage/quotes/${quoteId}/reservations`;

    const headerOnly = await app.inject({
      method: "POST",
      url,
      headers: { "idempotency-key": "export:header-key" },
      payload: { schemaVersion: 1 },
    });
    expect(headerOnly.statusCode).toBe(201);

    const bodyOnly = await app.inject({
      method: "POST",
      url,
      payload: { schemaVersion: 1, actionKey: "export:body-key" },
    });
    expect(bodyOnly.statusCode).toBe(201);
    expect(seen).toEqual(["export:header-key", "export:body-key"]);

    const disagreeing = await app.inject({
      method: "POST",
      url,
      headers: { "idempotency-key": "export:header-key" },
      payload: { schemaVersion: 1, actionKey: "export:body-key" },
    });
    expect(disagreeing.statusCode).toBe(422);
    expect(seen).toHaveLength(2);
  });

  it("carries the Idempotency-Key header through IP-8 governance routes", async () => {
    const seen: string[] = [];
    const worldId = "20000000-0000-4000-8000-000000000010";
    const governancePort = {
      setConsent: (_account: unknown, request: { idempotencyKey: string }) => {
        seen.push(`consent:${request.idempotencyKey}`);
        return Promise.resolve({
          consentType: "TERMS" as const,
          version: "IP-8-V1",
          scope: "ACCOUNT" as const,
          decision: "GRANTED" as const,
          withdrawalAvailable: true,
          updatedAt: new Date().toISOString(),
        });
      },
      createUsageQuote: (_account: unknown, request: { idempotencyKey: string }) => {
        seen.push(`quote:${request.idempotencyKey}`);
        return Promise.resolve({
          quoteId: "20000000-0000-4000-8000-000000000011",
          actionProfile: "EXPORT" as const,
          policyVersion: "IP-8-ZERO-COST-TEST-V1",
          costMode: "ZERO_COST_TEST" as const,
          units: 0 as const,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          failureBehavior: { retry: "retry", cancel: "cancel", terminalNoCommit: "none" },
          status: "ISSUED" as const,
        });
      },
      proposeDeletion: (_account: unknown, request: { idempotencyKey: string }) => {
        seen.push(`deletion:${request.idempotencyKey}`);
        return Promise.resolve({
          proposalId: "20000000-0000-4000-8000-000000000012",
          targetType: "WORLD" as const,
          targetId: worldId,
          digest: "a".repeat(64),
          status: "ACTIVE" as const,
          affected: { continuities: 0, grants: 0, exports: 0, auditCategories: ["DELETION"] },
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          explanation: "Review before confirming.",
        });
      },
      settleUsage: (_account: unknown, reservationId: string) => {
        seen.push(`settle:${reservationId}`);
        return Promise.resolve({
          reservationId,
          quoteId: "20000000-0000-4000-8000-000000000013",
          actionKey: "export:test",
          status: "SETTLED" as const,
          units: 0 as const,
          createdAt: new Date().toISOString(),
        });
      },
      releaseUsage: (_account: unknown, reservationId: string) => {
        seen.push(`release:${reservationId}`);
        return Promise.resolve({
          reservationId,
          quoteId: "20000000-0000-4000-8000-000000000013",
          actionKey: "export:test",
          status: "RELEASED" as const,
          units: 0 as const,
          createdAt: new Date().toISOString(),
        });
      },
    } as unknown as GovernancePort;
    app = createApiApp({
      logLevel: "error",
      governanceService: new GovernanceService(governancePort),
    });

    const consent = await app.inject({
      method: "POST",
      url: "/v1/me/consents",
      headers: { "idempotency-key": "consent-header-key" },
      payload: {
        schemaVersion: 1,
        consentType: "TERMS",
        version: "IP-8-V1",
        scope: "ACCOUNT",
        decision: "GRANTED",
      },
    });
    const quote = await app.inject({
      method: "POST",
      url: "/v1/usage/quotes",
      headers: { "idempotency-key": "quote-header-key" },
      payload: { schemaVersion: 1, actionProfile: "EXPORT" },
    });
    const proposal = await app.inject({
      method: "POST",
      url: "/v1/deletion-proposals",
      headers: { "idempotency-key": "deletion-header-key" },
      payload: { schemaVersion: 1, targetType: "WORLD", targetId: worldId },
    });
    const reservationId = "20000000-0000-4000-8000-000000000014";
    const settle = await app.inject({
      method: "POST",
      url: `/v1/usage/reservations/${reservationId}/settle`,
      headers: { "idempotency-key": "settle-header-key" },
      payload: {},
    });
    const release = await app.inject({
      method: "POST",
      url: `/v1/usage/reservations/${reservationId}/release`,
      headers: { "idempotency-key": "release-header-key" },
      payload: {},
    });
    const missingSettlementHeader = await app.inject({
      method: "POST",
      url: `/v1/usage/reservations/${reservationId}/settle`,
      payload: {},
    });

    expect(consent.statusCode).toBe(200);
    expect(quote.statusCode).toBe(200);
    expect(proposal.statusCode).toBe(201);
    expect(settle.statusCode).toBe(200);
    expect(release.statusCode).toBe(200);
    expect(missingSettlementHeader.statusCode).toBe(422);
    expect(seen).toEqual([
      "consent:consent-header-key",
      "quote:quote-header-key",
      "deletion:deletion-header-key",
      `settle:${reservationId}`,
      `release:${reservationId}`,
    ]);
  });
});
