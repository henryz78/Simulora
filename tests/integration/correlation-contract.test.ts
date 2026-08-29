import { createApiApp } from "../../apps/api/src/app.js";
import { correlationFor } from "../../apps/worker/src/worker.js";
import { workEnvelopeSchema } from "../../packages/contracts/src/index.js";
import { describe, expect, it } from "vitest";

describe("API to worker correlation contract", () => {
  it("carries correlation across the HTTP and generic work-envelope boundary", async () => {
    const app = createApiApp({ logLevel: "error" });
    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
        headers: { "x-correlation-id": "correlation-1" },
      });
      const correlationId = response.headers["x-correlation-id"];
      expect(typeof correlationId).toBe("string");
      const envelope = workEnvelopeSchema.parse({
        jobId: "foundation-job",
        correlation: { requestId: correlationId as string },
        payload: { task: "noop" },
      });
      expect(correlationFor(envelope)).toEqual({ requestId: "correlation-1" });
    } finally {
      await app.close();
    }
  });
});
