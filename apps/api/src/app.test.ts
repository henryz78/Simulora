import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { foundationResponseSchema } from "@simulora/contracts";
import { createApiApp } from "./app.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("API composition root", () => {
  it("returns a correlated health response", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.json()).toEqual({ service: "api", status: "ok", version: "0.0.0" });
  });

  it("states that product semantics have not started", async () => {
    app = createApiApp({ logLevel: "error" });
    const response = await app.inject({ method: "GET", url: "/v1/foundation" });
    expect(response.statusCode).toBe(200);
    expect(foundationResponseSchema.parse(response.json()).productSemanticsStarted).toBe(false);
  });
});
