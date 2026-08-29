import { describe, expect, it } from "vitest";
import { loadServerConfig, redactConfig } from "./index.js";

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
});
