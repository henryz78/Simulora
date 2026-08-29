import { describe, expect, it } from "vitest";
import { FakeClock } from "./index.js";

describe("testkit", () => {
  it("advances deterministic time without mutating returned dates", () => {
    const clock = new FakeClock();
    const first = clock.now();
    clock.advance(1000);
    expect(clock.now().getTime() - first.getTime()).toBe(1000);
  });
});
