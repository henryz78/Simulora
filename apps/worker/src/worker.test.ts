import { describe, expect, it } from "vitest";
import { workEnvelopeSchema } from "@simulora/contracts";
import { createWorkerComposition } from "./worker.js";

describe("worker composition", () => {
  it("uses a deterministic gateway for Action Truth", async () => {
    const worker = createWorkerComposition();
    expect(worker.productSemanticsStarted).toBe(true);
    await expect(worker.modelGateway.status()).resolves.toEqual({
      adapter: "deterministic",
      liveProviderConfigured: false,
    });
    await expect(worker.jobs.claimNext("test-worker")).resolves.toBeNull();
  });

  it("accepts a correlation envelope without defining product semantics", () => {
    const envelope = workEnvelopeSchema.parse({
      jobId: "job-1",
      correlation: { requestId: "request-1" },
      payload: { task: "noop" },
    });
    expect(envelope.correlation.requestId).toBe("request-1");
  });
});
