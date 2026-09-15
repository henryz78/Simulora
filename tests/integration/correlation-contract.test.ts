import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createApiApp } from "../../apps/api/src/app.js";
import { correlationFor } from "../../apps/worker/src/worker.js";
import { ActionTruthService } from "../../packages/application/src/index.js";
import type { AuthPort } from "../../packages/auth/src/index.js";
import { workEnvelopeSchema } from "../../packages/contracts/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  type SyntheticAccount,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

const connectionString = process.env.SIMULORA_DATABASE_URL;
const postgresSuite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const account: SyntheticAccount = {
  accountId: "71000000-0000-4000-8000-000000000001",
  eligibility: "adult",
};

postgresSuite("production Action correlation against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString);
  });

  afterAll(async () => pool?.end());

  it("carries the HTTP correlation through the durable job and real worker attempt", async () => {
    const repository = new AuthoritativeWorldRepository(pool);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const auth: AuthPort = { authenticate: () => Promise.resolve(account) };
    const app = createApiApp({
      logLevel: "error",
      auth,
      actionService: new ActionTruthService(repository),
    });
    try {
      const correlationId = `action-correlation-${randomUUID()}`;
      const response = await app.inject({
        method: "POST",
        url: `/v1/branches/${continuity.branchId}/actions`,
        headers: { "x-correlation-id": correlationId },
        payload: {
          schemaVersion: 1,
          idempotencyKey: `correlation-${randomUUID()}`,
          expectedHeadCommitId: continuity.headCommitId,
          participationExpectation: continuity.state.participation,
          intent: "Check the lantern signal with Iora.",
        },
      });
      expect(response.statusCode).toBe(201);
      const actionId = response.json().id as string;
      await repository.processAction(
        actionId,
        (request) => new DeterministicModelGateway().generateWorldTurn(request),
        "correlation-contract-worker",
      );
      const lineage = await pool.query<{
        action_correlation: string;
        job_correlation: string;
        attempt_correlation: string;
      }>(
        `select action.correlation_id as action_correlation,
                job.correlation_id as job_correlation,
                attempt.correlation_id as attempt_correlation
           from simulora.actions action
           join simulora.durable_jobs job on job.action_id = action.id
           join simulora.generation_attempts attempt on attempt.action_id = action.id
          where action.id = $1`,
        [actionId],
      );
      expect(lineage.rows).toEqual([
        {
          action_correlation: correlationId,
          job_correlation: correlationId,
          attempt_correlation: correlationId,
        },
      ]);
    } finally {
      await app.close();
    }
  });
});
