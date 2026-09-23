// IP-9.4 acknowledgement and queue profiling (PERF-ACK). Continuities are seeded
// directly, then Actions are submitted over HTTP to a running API while a real
// worker drains the queue. Acknowledgement is measured from client dispatch to
// the durable 201 response; provider generation is excluded from that target,
// as the frozen Validation Strategy defines it, and reported separately.
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../packages/database/src/index.js";
import { lanternReachSeed } from "../packages/domain/src/index.js";

export type LatencySummary = { count: number; p50: number; p95: number; p99: number; max: number };

export type AcknowledgementProfile = {
  profile: {
    actions: number;
    concurrency: number;
    apiBaseUrl: string;
    network: string;
    generation: string;
  };
  acknowledgementMs: LatencySummary;
  /** Queue plus deterministic generation; reported, not gated. */
  acknowledgedToProposalMs: LatencySummary | null;
  /** Acknowledged Actions the worker had not resolved when the profile ended. */
  undrained: number;
  errors: number;
  targets: { acknowledgementP95Ms: number };
  passed: boolean;
};

export function summarize(samples: readonly number[]): LatencySummary {
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (quantile: number) =>
    sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1)]!
      : 0;
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    count: sorted.length,
    p50: round(at(0.5)),
    p95: round(at(0.95)),
    p99: round(at(0.99)),
    max: round(sorted.at(-1) ?? 0),
  };
}

export async function profileAcknowledgement(options: {
  databaseUrl: string;
  apiBaseUrl: string;
  /** The development identity every HTTP request authenticates as. */
  accountId: string;
  actions: number;
  concurrency: number;
  waitForWorker: boolean;
}): Promise<AcknowledgementProfile> {
  const pool = createDatabasePool(options.databaseUrl);
  const repository = new AuthoritativeWorldRepository(pool);
  const owner = { accountId: options.accountId, eligibility: "adult" as const };
  try {
    // One Continuity per Action: a Branch head admits one unresolved Action.
    const world = await repository.createWorld(owner, lanternReachSeed);
    await repository.validateDraft(owner, world.worldId);
    const revision = await repository.createRevision(owner, world.worldId, 1);
    const continuities: Array<Awaited<ReturnType<typeof repository.startContinuity>>> = [];
    for (let index = 0; index < options.actions; index += 1) {
      continuities.push(
        await repository.startContinuity(owner, revision.revisionId, {
          initiativeMode: "GUIDED",
          structureMode: "OPEN_ENDED",
        }),
      );
    }
    const acknowledgements: number[] = [];
    const acknowledged: Array<{ id: string; at: number }> = [];
    let errors = 0;
    let next = 0;
    const client = async () => {
      while (next < continuities.length) {
        const continuity = continuities[next++]!;
        const started = performance.now();
        const response = await fetch(
          `${options.apiBaseUrl}/v1/branches/${continuity.branchId}/actions`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              schemaVersion: 1,
              idempotencyKey: `perf-${randomUUID()}`,
              expectedHeadCommitId: continuity.headCommitId,
              participationExpectation: continuity.state.participation,
              intent: "Profile the durable acknowledgement path.",
            }),
          },
        );
        const elapsed = performance.now() - started;
        if (response.status !== 201) {
          errors += 1;
          continue;
        }
        const body = (await response.json()) as { id: string };
        acknowledgements.push(elapsed);
        acknowledged.push({ id: body.id, at: Date.now() });
      }
    };
    await Promise.all(Array.from({ length: options.concurrency }, client));

    let generation: LatencySummary | null = null;
    let undrained = 0;
    if (options.waitForWorker) {
      const deadline = Date.now() + 180_000;
      const done = new Map<string, number>();
      while (done.size < acknowledged.length && Date.now() < deadline) {
        const pending = acknowledged
          .filter((entry) => !done.has(entry.id))
          .map((entry) => entry.id);
        const rows = await pool.query<{ id: string; updated_at: Date }>(
          `select id, updated_at from simulora.actions
           where id = any($1::uuid[]) and status in ('AWAITING_CONFIRMATION', 'FAILED_RECOVERABLE')`,
          [pending],
        );
        for (const row of rows.rows) done.set(row.id, row.updated_at.getTime());
        if (done.size < acknowledged.length)
          await new Promise((resolve) => setTimeout(resolve, 250));
      }
      generation = summarize(
        acknowledged
          .filter((entry) => done.has(entry.id))
          .map((entry) => Math.max(0, done.get(entry.id)! - entry.at)),
      );
      undrained = acknowledged.length - done.size;
    }
    const acknowledgementMs = summarize(acknowledgements);
    return {
      profile: {
        actions: options.actions,
        concurrency: options.concurrency,
        apiBaseUrl: options.apiBaseUrl,
        network: "loopback to a containerized API; PostgreSQL 17 on the same host",
        generation: "deterministic adapter in a containerized worker",
      },
      acknowledgementMs,
      acknowledgedToProposalMs: generation,
      undrained,
      errors,
      targets: { acknowledgementP95Ms: 1000 },
      // The drain is not a latency target, but a worker that resolves nothing is
      // a broken runtime, so every acknowledged Action must reach a proposal.
      passed: errors === 0 && undrained === 0 && acknowledgementMs.p95 <= 1000,
    };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const databaseUrl = process.env.SIMULORA_DATABASE_URL;
  if (!databaseUrl) throw new Error("SIMULORA_DATABASE_URL is required");
  const report = await profileAcknowledgement({
    databaseUrl,
    apiBaseUrl: process.env.SIMULORA_PROFILE_API_URL ?? "http://127.0.0.1:4000",
    accountId: process.env.SIMULORA_PROFILE_ACCOUNT_ID ?? "00000000-0000-4000-8000-000000000001",
    actions: Number(process.env.SIMULORA_PROFILE_ACTIONS ?? 200),
    concurrency: Number(process.env.SIMULORA_PROFILE_CONCURRENCY ?? 10),
    waitForWorker: process.env.SIMULORA_PROFILE_WAIT_FOR_WORKER !== "0",
  });
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
