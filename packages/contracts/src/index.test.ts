import { describe, expect, it } from "vitest";
import { foundationResponseSchema, healthStatusSchema } from "./index.js";

describe("foundation contracts", () => {
  it("rejects a foundation response that claims product semantics started", () => {
    expect(() =>
      foundationResponseSchema.parse({
        productImplementationPhase: "IP-1",
        productSemanticsStarted: true,
        capabilities: [],
      }),
    ).toThrow();
  });

  it("accepts the API health contract", () => {
    expect(healthStatusSchema.parse({ service: "api", status: "ok", version: "0.0.0" })).toEqual({
      service: "api",
      status: "ok",
      version: "0.0.0",
    });
  });
});
