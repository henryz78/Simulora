import { WorldContinuityService } from "@simulora/application";
import { loadLocalEnvironment, loadServerConfig, redactConfig } from "@simulora/config";
import { AuthoritativeWorldRepository, createDatabasePool } from "@simulora/database";
import { createLogger } from "@simulora/observability";
import { createApiApp } from "./app.js";

loadLocalEnvironment();
const config = loadServerConfig();
const logger = createLogger("api", config.SIMULORA_LOG_LEVEL);
const pool = createDatabasePool(config.SIMULORA_DATABASE_URL);
const app = createApiApp({
  logLevel: config.SIMULORA_LOG_LEVEL,
  worldService: new WorldContinuityService(new AuthoritativeWorldRepository(pool)),
});
app.addHook("onClose", async () => pool.end());

try {
  await app.listen({ host: config.SIMULORA_API_HOST, port: config.SIMULORA_API_PORT });
  logger.info("service.started", { config: redactConfig(config) });
} catch (error) {
  logger.error("service.start_failed", {
    error_name: error instanceof Error ? error.name : "unknown",
  });
  process.exitCode = 1;
}
