import { describe, expect, it } from "vitest";
import { foundationResponseSchema, healthStatusSchema, workEnvelopeSchema } from "./index.js";

describe("foundation contracts", () => {
  it("accepts the honest IP-2 implementation phase", () => {
    expect(
      foundationResponseSchema.parse({
        productImplementationPhase: "IP-2",
        productSemanticsStarted: true,
        capabilities: [],
      }).productImplementationPhase,
    ).toBe("IP-2");
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
