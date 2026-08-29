import { randomUUID } from "node:crypto";
import { describeFoundation } from "@simulora/application";
import { foundationResponseSchema, healthStatusSchema } from "@simulora/contracts";
import { createLogger } from "@simulora/observability";
import Fastify, { type FastifyInstance } from "fastify";

export type ApiAppOptions = {
  logLevel?: "debug" | "info" | "warn" | "error";
};

export function createApiApp(options: ApiAppOptions = {}): FastifyInstance {
  const logger = createLogger("api", options.logLevel ?? "info");
  const app = Fastify({
    genReqId: () => randomUUID(),
    logger: false,
  });

  app.addHook("onRequest", async (request, reply) => {
    const incomingCorrelation = request.headers["x-correlation-id"];
    const correlationId =
      typeof incomingCorrelation === "string" &&
      /^[A-Za-z0-9._:-]{1,128}$/.test(incomingCorrelation)
        ? incomingCorrelation
        : request.id;
    reply.header("x-request-id", request.id);
    reply.header("x-correlation-id", correlationId);
  });

  app.addHook("onResponse", async (request, reply) => {
    logger.info("request.complete", {
      request_id: request.id,
      correlation_id: reply.getHeader("x-correlation-id"),
      method: request.method,
      route: request.routeOptions.url,
      status_code: reply.statusCode,
    });
  });

  app.get("/health", () =>
    healthStatusSchema.parse({ service: "api", status: "ok", version: "0.0.0" }),
  );

  app.get("/v1/foundation", () =>
    foundationResponseSchema.parse(
      describeFoundation([
        { name: "database", configured: Boolean(process.env.SIMULORA_DATABASE_URL) },
        { name: "object-storage", configured: Boolean(process.env.SIMULORA_OBJECT_ENDPOINT) },
        { name: "model-gateway", configured: true },
        { name: "auth", configured: true },
      ]),
    ),
  );

  return app;
}
