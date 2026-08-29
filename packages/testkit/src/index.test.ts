import { describe, expect, it } from "vitest";
import { FakeClock, FaultInjector } from "./index.js";

describe("testkit", () => {
  it("advances deterministic time without mutating returned dates", () => {
    const clock = new FakeClock();
    const first = clock.now();
    clock.advance(1000);
    expect(clock.now().getTime() - first.getTime()).toBe(1000);
  });

  it("injects one deterministic failure and then recovers", () => {
    const faults = new FaultInjector();
    faults.arm("commit");
    expect(() => faults.consume("commit")).toThrow("Injected failure at commit");
    expect(() => faults.consume("commit")).not.toThrow();
  });
});
