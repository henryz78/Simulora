import { describe, expect, it } from "vitest";
import {
  actionResponseSchema,
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
