import { describe, expect, it } from "vitest";
import { DevelopmentAuthAdapter } from "./index.js";

describe("development auth adapter", () => {
  it("returns a synthetic adult account only in the development adapter", async () => {
    await expect(new DevelopmentAuthAdapter().authenticate({})).resolves.toEqual({
      accountId: "development-account",
      eligibility: "adult",
    });
  });
});
