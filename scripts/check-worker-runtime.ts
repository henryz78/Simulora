import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workerEntry = new URL("../apps/worker/dist/index.js", import.meta.url);
const result = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "--eval",
    `await import(${JSON.stringify(workerEntry.href)}); process.emit("SIGTERM", "SIGTERM");`,
  ],
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: {
      ...process.env,
      SIMULORA_ENV: "test",
      SIMULORA_LOG_LEVEL: "info",
      SIMULORA_AUTH_ADAPTER: "development",
      SIMULORA_MODEL_ADAPTER: "deterministic",
      // This is a bundle startup check, not database verification. Stop before
      // the first poll and never inherit access to a developer's real database.
      SIMULORA_DATABASE_URL: "postgres://smoke:smoke@127.0.0.1:1/smoke",
      SIMULORA_WORKER_POLL_MS: "60000",
    },
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Worker bundle failed to start: ${result.stderr}`);
}
if (
  !result.stdout.includes('"message":"service.started"') ||
  !result.stdout.includes('"message":"action.worker_ready"') ||
  !result.stdout.includes('"message":"service.stopped"')
) {
  throw new Error("Worker bundle did not complete the startup/shutdown smoke check");
}
console.log("Worker runtime bundle startup/shutdown passed");
