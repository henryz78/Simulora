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
      profile: { id: "deterministic", version: "1" },
      fallback: null,
    });
    // Without a database there is nothing to record and nothing to generate.
    await expect(worker.recordModelProfile()).resolves.toBeNull();
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
