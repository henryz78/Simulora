import { describe, expect, it } from "vitest";
import {
  actionResponseSchema,
  correctionRequestSchema,
  foundationResponseSchema,
  healthStatusSchema,
  workEnvelopeSchema,
} from "./index.js";

describe("foundation contracts", () => {
  it("continues to accept the prior IP-2 implementation phase for compatibility", () => {
    expect(
      foundationResponseSchema.parse({
        productImplementationPhase: "IP-2",
        productSemanticsStarted: true,
        capabilities: [],
      }).productImplementationPhase,
    ).toBe("IP-2");
  });

  it("distinguishes durable Action acknowledgement from a Commit", () => {
    const response = actionResponseSchema.parse({
      id: "10000000-0000-4000-8000-000000000010",
      continuityId: "10000000-0000-4000-8000-000000000011",
      branchId: "10000000-0000-4000-8000-000000000012",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000013",
      status: "ACKNOWLEDGED",
      intent: "Relight the western signal.",
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
      acknowledgedAt: new Date().toISOString(),
      terminalAt: null,
      recoverableWait: false,
      statusReason: null,
      progressUrl: "/v1/actions/10/progress",
      eventsUrl: "/v1/actions/10/events",
      proposal: null,
      commit: null,
    });
    expect(response.status).toBe("ACKNOWLEDGED");
    expect(response.commit).toBeNull();
    expect(response.operationType).toBe("PARTICIPATE");
  });

  it("represents a completed response without implying a World Commit", () => {
    const response = actionResponseSchema.parse({
      id: "10000000-0000-4000-8000-000000000010",
      continuityId: "10000000-0000-4000-8000-000000000011",
      branchId: "10000000-0000-4000-8000-000000000012",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000013",
      status: "COMPLETED_NO_EFFECT",
      intent: "Ask Iora for advice.",
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
      acknowledgedAt: new Date().toISOString(),
      terminalAt: new Date().toISOString(),
      recoverableWait: false,
      statusReason: "NO_WORLD_EFFECT",
      progressUrl: "/v1/actions/10/progress",
      eventsUrl: "/v1/actions/10/events",
      proposal: null,
      commit: null,
      dialogue: {
        id: "10000000-0000-4000-8000-000000000010",
        narrative: "Iora leaves the unsafe signal dark.",
        responseSource: { type: "CHARACTER", characterId: "character.iora" },
        sourceHeadCommitId: "10000000-0000-4000-8000-000000000013",
        sourceStateRevisionId: "10000000-0000-4000-8000-000000000014",
        provenance: "Generated Action 10000000-0000-4000-8000-000000000010",
        visibilityScope: "CONTINUITY_PRIVATE",
        recordedAt: new Date().toISOString(),
      },
    });
    expect(response.status).toBe("COMPLETED_NO_EFFECT");
    expect(response.commit).toBeNull();
    expect(response.dialogue?.visibilityScope).toBe("CONTINUITY_PRIVATE");
    expect(() => actionResponseSchema.parse({ ...response, dialogue: undefined })).toThrow(
      "Completed response-only Actions require dialogue evidence",
    );
  });

  it("keeps correction scope bound to before and rejects client-supplied after scope", () => {
    const request = {
      schemaVersion: 1,
      idempotencyKey: "correction-contract-1",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000013",
      target: { type: "fact", id: "fact.western-signal-dim" },
      operation: "CORRECT_CONTINUITY",
      before: { statement: "The western signal is dim.", scope: "SHARED" },
      after: { statement: "The western signal is steady." },
      reason: "The keeper checked the instrument log.",
    };
    expect(correctionRequestSchema.parse(request).after).toEqual(request.after);
    expect(() =>
      correctionRequestSchema.parse({ ...request, after: { ...request.after, scope: "SHARED" } }),
    ).toThrow();
  });

  it("accepts the API health contract", () => {
    expect(healthStatusSchema.parse({ service: "api", status: "ok", version: "0.0.0" })).toEqual({
      service: "api",
      status: "ok",
      version: "0.0.0",
    });
  });

  it("preserves a generic correlation carrier for future API-to-worker work", () => {
    const envelope = workEnvelopeSchema.parse({
      jobId: "job-1",
      correlation: { requestId: "request-1", traceId: "trace-1" },
      payload: { kind: "foundation-check" },
    });
    expect(envelope.correlation.requestId).toBe("request-1");
  });
});
