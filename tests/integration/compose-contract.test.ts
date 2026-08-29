import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

type ComposeDocument = {
  services?: Record<string, { image?: string; ports?: string[] }>;
};

describe("local dependency composition", () => {
  it("declares isolated PostgreSQL and S3-compatible MinIO services", async () => {
    const document = parse(await readFile("deploy/local/compose.yaml", "utf8")) as ComposeDocument;
    expect(document.services?.postgres?.image).toMatch(/^postgres:17/);
    expect(document.services?.minio?.image).toContain("minio");
    expect(document.services?.postgres?.ports).toContain("127.0.0.1:5432:5432");
    expect(document.services?.minio?.ports).toContain("127.0.0.1:9000:9000");
  });
});
