import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadLocalEnvironment, loadServerConfig, redactConfig } from "./index.js";

describe("server config", () => {
  it("loads safe local defaults", () => {
    const config = loadServerConfig({});
    expect(config.SIMULORA_ENV).toBe("local");
    expect(config.SIMULORA_MODEL_ADAPTER).toBe("deterministic");
  });

  it("redacts secrets and connection strings", () => {
    const config = loadServerConfig({
      SIMULORA_DATABASE_URL: "postgres://user:secret@localhost:5432/simulora",
      SIMULORA_OBJECT_ACCESS_KEY: "access",
      SIMULORA_OBJECT_SECRET_KEY: "secret",
    });
    const redacted = redactConfig(config);
    expect(JSON.stringify(redacted)).not.toContain("secret");
    expect(redacted.SIMULORA_DATABASE_URL).toBe("[configured]");
  });

  it("loads .env.local from a parent without replacing explicit environment values", async () => {
    const root = path.join(tmpdir(), `simulora-config-${randomUUID()}`);
    const nested = path.join(root, "packages", "database");
    await mkdir(nested, { recursive: true });
    await writeFile(
      path.join(root, ".env.local"),
      "SIMULORA_DATABASE_URL=postgres://file:file@127.0.0.1:5432/file\nSIMULORA_API_PORT=4100\n",
    );
    await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages: []\n");
    const environment: NodeJS.ProcessEnv = { SIMULORA_API_PORT: "4200" };

    expect(loadLocalEnvironment({ environment, startDirectory: nested })).toBe(
      path.join(root, ".env.local"),
    );
    expect(environment.SIMULORA_DATABASE_URL).toBe("postgres://file:file@127.0.0.1:5432/file");
    expect(environment.SIMULORA_API_PORT).toBe("4200");
  });

  it("fails closed when an unapproved shared or production environment is requested", () => {
    for (const environment of ["preview", "staging", "production"]) {
      expect(() => loadServerConfig({ SIMULORA_ENV: environment })).toThrow(/must fail closed/);
    }
  });

  it("fails closed when a production-shaped runtime omits its Simulora environment", () => {
    expect(() => loadServerConfig({ NODE_ENV: "production" })).toThrow(
      /SIMULORA_ENV must be explicitly set/,
    );
    expect(loadServerConfig({ NODE_ENV: "production", SIMULORA_ENV: "test" }).SIMULORA_ENV).toBe(
      "test",
    );
  });
});
