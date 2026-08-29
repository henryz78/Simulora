import { loadLocalEnvironment, loadServerConfig, redactConfig } from "@simulora/config";
import { createLogger } from "@simulora/observability";
import { createWorkerComposition } from "./worker.js";

loadLocalEnvironment();
const config = loadServerConfig();
const logger = createLogger("worker", config.SIMULORA_LOG_LEVEL);
const composition = createWorkerComposition();

logger.info("service.started", {
  config: redactConfig(config),
  product_semantics_started: composition.productSemanticsStarted,
});

const interval = setInterval(() => {
  logger.debug("worker.idle", { poll_ms: config.SIMULORA_WORKER_POLL_MS });
}, config.SIMULORA_WORKER_POLL_MS);

function shutdown(signal: string): void {
  clearInterval(interval);
  logger.info("service.stopped", { signal });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
