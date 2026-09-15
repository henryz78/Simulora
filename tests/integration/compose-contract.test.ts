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

  it("uses pnpm deploy artifacts for runnable API and worker images", async () => {
    const [apiDockerfile, workerDockerfile] = await Promise.all([
      readFile("deploy/containers/api.Dockerfile", "utf8"),
      readFile("deploy/containers/worker.Dockerfile", "utf8"),
    ]);
    expect(apiDockerfile).toContain("pnpm deploy --filter @simulora/api --prod --legacy /out");
    expect(workerDockerfile).toContain(
      "pnpm deploy --filter @simulora/worker --prod --legacy /out",
    );
    for (const dockerfile of [apiDockerfile, workerDockerfile]) {
      expect(dockerfile).toContain("COPY --from=build /out ./");
      expect(dockerfile).toContain(
        "RUN rm -rf node_modules/@simulora node_modules/.pnpm/node_modules/@simulora",
      );
    }
  });
});
