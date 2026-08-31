import { randomUUID } from "node:crypto";
import { describeFoundation, type WorldContinuityService } from "@simulora/application";
import { DevelopmentAuthAdapter, type AuthPort } from "@simulora/auth";
import {
  authoritativeStateResponseSchema,
  createWorldRequestSchema,
  createWorldRevisionRequestSchema,
  foundationResponseSchema,
  healthStatusSchema,
  startContinuityRequestSchema,
  updateWorldDraftRequestSchema,
} from "@simulora/contracts";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@simulora/database";
import { createLogger } from "@simulora/observability";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { ZodError } from "zod";

export type ApiAppOptions = {
  logLevel?: "debug" | "info" | "warn" | "error";
  worldService?: WorldContinuityService;
  auth?: AuthPort;
};

async function authenticatedAccount(request: FastifyRequest, auth: AuthPort) {
  const account = await auth.authenticate(request.headers);
  if (!account) throw new AccessDeniedError("Authentication required");
  return account;
}

function stateResponse(result: Awaited<ReturnType<WorldContinuityService["readCurrentState"]>>) {
  return authoritativeStateResponseSchema.parse({
    continuity: {
      id: result.continuityId,
      branchId: result.branchId,
      headCommitId: result.headCommitId,
      stateRevisionId: result.stateRevisionId,
      worldRevisionId: result.worldRevisionId,
      worldRevisionNumber: result.worldRevisionNumber,
    },
    world: result.world,
    state: result.state,
    source: { stateHash: result.stateHash },
  });
}

export function createApiApp(options: ApiAppOptions = {}): FastifyInstance {
  const logger = createLogger("api", options.logLevel ?? "info");
  const auth = options.auth ?? new DevelopmentAuthAdapter();
  const app = Fastify({ genReqId: () => randomUUID(), logger: false });

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

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      void reply
        .status(400)
        .send({ code: "INVALID_REQUEST", message: "Request validation failed" });
      return;
    }
    if (error instanceof AccessDeniedError) {
      void reply.status(403).send({ code: "ACCESS_DENIED", message: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      void reply.status(404).send({ code: "NOT_FOUND", message: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      void reply.status(409).send({ code: "STALE_DRAFT", message: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      void reply.status(422).send({ code: "WORLD_NOT_PLAYABLE", message: error.message });
      return;
    }
    logger.error("request.failed", { error });
    void reply
      .status(500)
      .send({ code: "INTERNAL_ERROR", message: "Request could not be completed" });
  });

  app.get("/health", () =>
    healthStatusSchema.parse({ service: "api", status: "ok", version: "0.0.0" }),
  );

  app.get("/v1/foundation", () =>
    foundationResponseSchema.parse(
      describeFoundation([
        { name: "database", configured: Boolean(options.worldService) },
        { name: "object-storage", configured: Boolean(process.env.SIMULORA_OBJECT_ENDPOINT) },
        { name: "model-gateway", configured: true },
        { name: "auth", configured: true },
      ]),
    ),
  );

  if (options.worldService) {
    const service = options.worldService;

    app.post("/v1/worlds", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const body = createWorldRequestSchema.parse(request.body);
      const created = await service.createWorld(account, body.document);
      return reply.status(201).send(created);
    });

    app.put("/v1/worlds/:worldId/draft", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { worldId } = request.params as { worldId: string };
      const body = updateWorldDraftRequestSchema.parse(request.body);
      return service.updateDraft(account, worldId, body.expectedVersion, body.document);
    });

    app.post("/v1/worlds/:worldId/revisions", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { worldId } = request.params as { worldId: string };
      const body = createWorldRevisionRequestSchema.parse(request.body);
      const revision = await service.createRevision(account, worldId, body.expectedDraftVersion);
      return reply.status(201).send(revision);
    });

    app.post("/v1/world-revisions/:worldRevisionId/continuities", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { worldRevisionId } = request.params as { worldRevisionId: string };
      const body = startContinuityRequestSchema.parse(request.body);
      const continuity = await service.startContinuity(
        account,
        worldRevisionId,
        body.participation,
      );
      return reply.status(201).send(stateResponse(continuity));
    });

    app.get("/v1/continuities/:continuityId/state", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { continuityId } = request.params as { continuityId: string };
      return stateResponse(await service.readCurrentState(account, continuityId));
    });
  }

  return app;
}
