import {
  ActionTruthService,
  GovernanceService,
  WorldContinuityService,
} from "@simulora/application";
import {
  loadLocalEnvironment,
  loadServerConfig,
  redactConfig,
  selectObjectStorage,
} from "@simulora/config";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  onTransactionRetryConflict,
} from "@simulora/database";
import { createLogger } from "@simulora/observability";
import { createObjectStorage } from "@simulora/storage";
import { createApiApp } from "./app.js";

loadLocalEnvironment();
const config = loadServerConfig();
const logger = createLogger("api", config.SIMULORA_LOG_LEVEL);
// The database package cannot import the logger, so the composition root fills
// its seam. Without this, deadlock and serialization aborts reach the client as
// a 409 with no server-side trace at all.
onTransactionRetryConflict((detail) => logger.warn("transaction.retry_conflict", detail));
const pool = createDatabasePool(config.SIMULORA_DATABASE_URL);
const repository = new AuthoritativeWorldRepository(pool);
const app = createApiApp({
  logLevel: config.SIMULORA_LOG_LEVEL,
  worldService: new WorldContinuityService(repository),
  actionService: new ActionTruthService(repository),
  governanceService: new GovernanceService(repository, {
    artifacts: createObjectStorage(selectObjectStorage(config)),
    ...(config.SIMULORA_DOWNLOAD_SIGNING_KEY
      ? { downloadSigningKey: config.SIMULORA_DOWNLOAD_SIGNING_KEY }
      : {}),
  }),
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
