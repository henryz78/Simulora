import { expect, it } from "vitest";
import { summarize } from "../../scripts/profile-acknowledgement.js";

it("reports nearest-rank percentiles for the PERF-ACK profile", () => {
  const samples = Array.from({ length: 100 }, (_, index) => index + 1);
  expect(summarize(samples)).toEqual({ count: 100, p50: 50, p95: 95, p99: 99, max: 100 });
  expect(summarize([])).toEqual({ count: 0, p50: 0, p95: 0, p99: 0, max: 0 });
  expect(summarize([7])).toMatchObject({ p50: 7, p95: 7, p99: 7 });
});
