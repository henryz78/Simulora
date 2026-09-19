import { describe, expect, it } from "vitest";
import { describeFoundation } from "./index.js";

describe("describeFoundation", () => {
  it("reports the IP-7 World Studio phase honestly", () => {
    const response = describeFoundation([{ name: "database", configured: true }]);
    expect(response.productImplementationPhase).toBe("IP-7");
    expect(response.productSemanticsStarted).toBe(true);
    expect(response.capabilities).toEqual([{ name: "database", status: "configured" }]);
  });
});
