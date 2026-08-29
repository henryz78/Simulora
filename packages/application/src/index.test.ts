import { describe, expect, it } from "vitest";
import { describeFoundation } from "./index.js";

describe("describeFoundation", () => {
  it("keeps product semantics explicitly unstarted", () => {
    const response = describeFoundation([{ name: "database", configured: true }]);
    expect(response.productSemanticsStarted).toBe(false);
    expect(response.capabilities).toEqual([{ name: "database", status: "configured" }]);
  });
});
