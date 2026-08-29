import { loadServerConfig, redactConfig } from "@simulora/config";
import { createLogger } from "@simulora/observability";
import { createApiApp } from "./app.js";

const config = loadServerConfig();
const logger = createLogger("api", config.SIMULORA_LOG_LEVEL);
const app = createApiApp({ logLevel: config.SIMULORA_LOG_LEVEL });

try {
  await app.listen({ host: config.SIMULORA_API_HOST, port: config.SIMULORA_API_PORT });
  logger.info("service.started", { config: redactConfig(config) });
} catch (error) {
  logger.error("service.start_failed", {
    error_name: error instanceof Error ? error.name : "unknown",
  });
  process.exitCode = 1;
}
