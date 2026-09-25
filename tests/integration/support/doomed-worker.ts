import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../../packages/database/src/index.js";

// A worker process that claims one Action with a short lease and then never
// finishes, so the parent can kill it the way a crashed process dies.
const [actionId] = process.argv.slice(2);
const connectionString = process.env.SIMULORA_DATABASE_URL;
if (!actionId || !connectionString) throw new Error("usage: doomed-worker <actionId>");
const repository = new AuthoritativeWorldRepository(
  createDatabasePool(connectionString, { max: 2 }),
  {
    durationMs: 1_500,
    heartbeatMs: 300,
  },
);
await repository.processAction(actionId, () => new Promise<never>(() => {}), "doomed-worker");
