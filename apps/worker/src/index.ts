import { loadLocalEnvironment, loadServerConfig, redactConfig } from "@simulora/config";
import { onTransactionRetryConflict } from "@simulora/database";
import { createLogger } from "@simulora/observability";
import { createWorkerComposition } from "./worker.js";

loadLocalEnvironment();
const config = loadServerConfig();
const logger = createLogger("worker", config.SIMULORA_LOG_LEVEL);
// The database package cannot import the logger, so the composition root fills
// its seam. Without this, deadlock and serialization aborts leave no trace.
onTransactionRetryConflict((detail) => logger.warn("transaction.retry_conflict", detail));
const composition = createWorkerComposition(config.SIMULORA_DATABASE_URL);

logger.info("service.started", {
  config: redactConfig(config),
  product_semantics_started: composition.productSemanticsStarted,
});

const interval = setInterval(() => {
  logger.debug("worker.idle", { poll_ms: config.SIMULORA_WORKER_POLL_MS });
  void composition
    .processNextAction()
    .then((action) => {
      if (action)
        logger.info("action.processed", {
          action_id: action.id,
          status: action.status,
          correlation_id: action.correlationId ?? undefined,
        });
    })
    .catch((error: unknown) => {
      logger.error("action.process_failed", {
        error_name: error instanceof Error ? error.name : "unknown",
      });
    });
  void composition
    .processNextProjection()
    .then((projection) => {
      if (projection) {
        logger.info("projection.rebuilt", {
          branch_id: projection.continuity.branchId,
          head_commit_id: projection.freshness.currentHeadCommitId,
        });
      }
    })
    .catch((error: unknown) => {
      logger.error("projection.rebuild_failed", {
        error_name: error instanceof Error ? error.name : "unknown",
      });
    });
}, config.SIMULORA_WORKER_POLL_MS);

if (composition.actionRepository) {
  logger.info("action.worker_ready", { poll_ms: config.SIMULORA_WORKER_POLL_MS });
}

function shutdown(signal: string): void {
  clearInterval(interval);
  logger.info("service.stopped", { signal });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
