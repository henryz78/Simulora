import {
  loadLocalEnvironment,
  loadServerConfig,
  redactConfig,
  selectModelRouting,
  selectObjectStorage,
} from "@simulora/config";
import { onTransactionRetryConflict } from "@simulora/database";
import { createModelGateway } from "@simulora/model-gateway";
import { createLogger } from "@simulora/observability";
import { createObjectStorage } from "@simulora/storage";
import { createWorkerComposition } from "./worker.js";

loadLocalEnvironment();
const config = loadServerConfig();
const logger = createLogger("worker", config.SIMULORA_LOG_LEVEL);
// The database package cannot import the logger, so the composition root fills
// its seam. Without this, deadlock and serialization aborts leave no trace.
onTransactionRetryConflict((detail) => logger.warn("transaction.retry_conflict", detail));
const composition = createWorkerComposition(config.SIMULORA_DATABASE_URL, {
  objectStorage: createObjectStorage(selectObjectStorage(config)),
  modelGateway: createModelGateway(selectModelRouting(config)),
});

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
  void composition
    .processNextExportStorage()
    .then((result) => {
      if (!result) return;
      // A delay is an expected outage signal, recorded at warn so alerts can key on it.
      logger[result.outcome === "DELAYED" ? "warn" : "info"]("export.storage", {
        export_id: result.exportId,
        operation: result.operation,
        outcome: result.outcome,
      });
    })
    .catch((error: unknown) => {
      logger.error("export.storage_failed", {
        error_name: error instanceof Error ? error.name : "unknown",
      });
    });
}, config.SIMULORA_WORKER_POLL_MS);

if (composition.actionRepository) {
  logger.info("action.worker_ready", {
    poll_ms: config.SIMULORA_WORKER_POLL_MS,
    model_profile: `${composition.modelGateway.profile.id}@${composition.modelGateway.profile.version}`,
  });
  // A failure here must not stop Action processing; it is logged and retried at
  // the next start, and the attempt rows still carry the routed profile.
  void composition
    .recordModelProfile()
    .then((activation) => {
      if (activation?.changed) {
        logger.info("model.profile_activated", {
          profile: `${activation.profileId}@${activation.profileVersion}`,
          material: activation.material,
        });
      }
    })
    .catch((error: unknown) => {
      logger.error("model.profile_activation_failed", {
        error_name: error instanceof Error ? error.name : "unknown",
      });
    });
}

function shutdown(signal: string): void {
  clearInterval(interval);
  logger.info("service.stopped", { signal });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
