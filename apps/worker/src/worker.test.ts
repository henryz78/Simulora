import { describe, expect, it } from "vitest";
import { createWorkerComposition } from "./worker.js";

describe("worker composition", () => {
  it("uses a deterministic gateway and no product semantics", async () => {
    const worker = createWorkerComposition();
    expect(worker.productSemanticsStarted).toBe(false);
    await expect(worker.modelGateway.status()).resolves.toEqual({
      adapter: "deterministic",
      liveProviderConfigured: false,
    });
    await expect(worker.jobs.claimNext("test-worker")).resolves.toBeNull();
  });
});
