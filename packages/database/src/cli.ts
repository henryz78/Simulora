import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMigrations } from "./migrations.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
const result = await runMigrations(connectionString, migrationsDirectory);

for (const file of result.applied) console.log(`Applied ${file}`);
for (const file of result.alreadyApplied) console.log(`Already applied ${file}`);
