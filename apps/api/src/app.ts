import { randomUUID } from "node:crypto";
import {
  describeFoundation,
  type ActionTruthService,
  type WorldContinuityService,
} from "@simulora/application";
import { DevelopmentAuthAdapter, type AuthPort } from "@simulora/auth";
import {
  authoritativeStateResponseSchema,
  createWorldRequestSchema,
  createWorldRevisionRequestSchema,
  foundationResponseSchema,
  healthStatusSchema,
  startContinuityRequestSchema,
  updateWorldDraftRequestSchema,
  actionResponseSchema,
  submitActionRequestSchema,
  confirmActionRequestSchema,
  actionProgressResponseSchema,
  branchActionHistorySchema,
  branchTraceResponseSchema,
  changeParticipationContractRequestSchema,
  characterAssetResponseSchema,
  correctionRequestSchema,
  explanationResponseSchema,
  orientationResponseSchema,
  confirmRestoreRequestSchema,
  createCharacterAssetRequestSchema,
  createRecoveryPointRequestSchema,
  createRestoreProposalRequestSchema,
  forkBranchRequestSchema,
  recoveryBranchSchema,
  recoveryPointSchema,
  recoveryResponseSchema,
  restoreCommitSchema,
  restoreProposalSchema,
  selectBranchRequestSchema,
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
  actionService?: ActionTruthService;
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
      const knownCodes = new Set([
        "BRANCH_HEAD_CONFLICT",
        "PARTICIPATION_EXPECTATION_MISMATCH",
        "IDEMPOTENCY_KEY_REUSED",
        "CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED",
        "ACTION_CANCELLED",
        "ACTION_NOT_AWAITING_CONFIRMATION",
        "CORRECTION_TARGET_CHANGED",
        "NO_ACTIVE_CANONICAL_FACT",
        "PENDING_ACTIONS_REQUIRE_RESOLUTION",
        "RESTORE_CONFIRMATION_MISMATCH",
        "RESTORE_REVIEW_NOT_ACTIVE",
        "RESTORE_REVIEW_STALE",
        "RESTORE_RESULT_UNAVAILABLE",
        "RESTORE_HAS_NO_CHANGES",
      ]);
      const code = knownCodes.has(error.message) ? error.message : "STALE_DRAFT";
      void reply.status(409).send({ code, message: error.message });
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

    app.post("/v1/character-assets", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const body = createCharacterAssetRequestSchema.parse(request.body);
      return reply
        .status(201)
        .send(
          characterAssetResponseSchema.parse(await service.createCharacterAsset(account, body)),
        );
    });

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

    app.get("/v1/continuities/:continuityId/orientation", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { continuityId } = request.params as { continuityId: string };
      return orientationResponseSchema.parse(await service.readOrientation(account, continuityId));
    });

    app.get("/v1/continuities/:continuityId/recovery", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { continuityId } = request.params as { continuityId: string };
      return recoveryResponseSchema.parse(await service.readRecovery(account, continuityId));
    });

    app.post("/v1/branches/:branchId/recovery-points", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = createRecoveryPointRequestSchema.parse(request.body);
      return reply
        .status(201)
        .send(
          recoveryPointSchema.parse(await service.createRecoveryPoint(account, branchId, body)),
        );
    });

    app.delete("/v1/recovery-points/:recoveryPointId", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { recoveryPointId } = request.params as { recoveryPointId: string };
      return recoveryPointSchema.parse(await service.deleteRecoveryPoint(account, recoveryPointId));
    });

    app.post("/v1/continuities/:continuityId/branches", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { continuityId } = request.params as { continuityId: string };
      const body = forkBranchRequestSchema.parse(request.body);
      return reply
        .status(201)
        .send(recoveryBranchSchema.parse(await service.forkBranch(account, continuityId, body)));
    });

    app.put("/v1/continuities/:continuityId/active-branch", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { continuityId } = request.params as { continuityId: string };
      const body = selectBranchRequestSchema.parse(request.body);
      return recoveryResponseSchema.parse(
        await service.selectBranch(account, continuityId, body.branchId),
      );
    });

    app.post("/v1/branches/:branchId/restore-proposals", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = createRestoreProposalRequestSchema.parse(request.body);
      return reply
        .status(201)
        .send(
          restoreProposalSchema.parse(
            await service.prepareRestore(account, branchId, body.sourceCommitId),
          ),
        );
    });

    app.get("/v1/restore-proposals/:proposalId", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { proposalId } = request.params as { proposalId: string };
      return restoreProposalSchema.parse(await service.readRestoreProposal(account, proposalId));
    });

    app.post("/v1/branches/:branchId/restores", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = confirmRestoreRequestSchema.parse(request.body);
      return reply
        .status(201)
        .send(restoreCommitSchema.parse(await service.confirmRestore(account, branchId, body)));
    });

    app.get("/v1/branches/:branchId/state", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      return stateResponse(await service.readBranchState(account, branchId));
    });

    app.get("/v1/branches/:branchId/commits", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const query = request.query as { cursor?: string; limit?: string };
      const limit = query.limit ? Number(query.limit) : undefined;
      if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
        throw new ValidationError("Invalid Change Trace limit");
      }
      return branchTraceResponseSchema.parse(
        await service.listBranchCommits(account, branchId, query.cursor, limit),
      );
    });

    app.get("/v1/branches/:branchId/explanations/:targetType/:targetId", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId, targetType, targetId } = request.params as {
        branchId: string;
        targetType: string;
        targetId: string;
      };
      if (targetType !== "fact" && targetType !== "commit") {
        throw new ValidationError("Unsupported explanation target");
      }
      return explanationResponseSchema.parse(
        await service.readExplanation(account, branchId, targetType, targetId),
      );
    });
  }

  if (options.actionService) {
    const actions = options.actionService;
    app.post("/v1/branches/:branchId/actions", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = submitActionRequestSchema.parse(request.body);
      const correlationId = String(reply.getHeader("x-correlation-id"));
      const result = await actions.submitAction(account, branchId, body, correlationId);
      logger.info("action.acknowledged", {
        request_id: request.id,
        correlation_id: reply.getHeader("x-correlation-id"),
        action_id: result.id,
        branch_id: result.branchId,
        expected_head_commit_id: result.expectedHeadCommitId,
      });
      return reply.status(201).send(actionResponseSchema.parse(result));
    });

    app.post("/v1/branches/:branchId/corrections", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = correctionRequestSchema.parse(request.body);
      const result = await actions.submitCorrection(account, branchId, body);
      return reply.status(201).send(actionResponseSchema.parse(result));
    });

    app.post("/v1/branches/:branchId/participation-contract", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      const body = changeParticipationContractRequestSchema.parse(request.body);
      const result = await actions.changeParticipationContract(account, branchId, body);
      return reply.status(201).send(actionResponseSchema.parse(result));
    });

    app.get("/v1/actions/:actionId", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      return actionResponseSchema.parse(await actions.readAction(account, actionId));
    });

    app.post("/v1/actions/:actionId/confirm", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      const body = confirmActionRequestSchema.parse(request.body);
      return actionResponseSchema.parse(await actions.confirmAction(account, actionId, body));
    });

    app.post("/v1/actions/:actionId/cancel", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      return actionResponseSchema.parse(await actions.cancelAction(account, actionId));
    });

    app.post("/v1/actions/:actionId/retry", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      return actionResponseSchema.parse(await actions.retryAction(account, actionId));
    });

    app.get("/v1/actions/:actionId/progress", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      const query = request.query as { after?: string };
      const lastEventId = request.headers["last-event-id"];
      const cursor = query.after ?? (typeof lastEventId === "string" ? lastEventId : undefined);
      const after = cursor ? Number(cursor) : 0;
      if (!Number.isInteger(after) || after < 0)
        throw new ValidationError("Invalid progress cursor");
      return actionProgressResponseSchema.parse(
        await actions.readProgress(account, actionId, after),
      );
    });

    app.get("/v1/actions/:actionId/events", async (request, reply) => {
      const account = await authenticatedAccount(request, auth);
      const { actionId } = request.params as { actionId: string };
      const query = request.query as { after?: string };
      const lastEventId = request.headers["last-event-id"];
      const cursor = query.after ?? (typeof lastEventId === "string" ? lastEventId : undefined);
      const after = cursor ? Number(cursor) : 0;
      if (!Number.isInteger(after) || after < 0)
        throw new ValidationError("Invalid progress cursor");
      const result = actionProgressResponseSchema.parse(
        await actions.readProgress(account, actionId, after),
      );
      reply.header("content-type", "text/event-stream; charset=utf-8");
      reply.header("cache-control", "no-cache");
      reply.header("connection", "keep-alive");
      const frames = result.frames
        .map(
          (frame) =>
            `id: ${frame.sequence}\nevent: ${frame.type}\ndata: ${JSON.stringify(frame.payload)}\n\n`,
        )
        .join("");
      return reply.send(
        `${frames}event: cursor\ndata: ${JSON.stringify({ nextCursor: result.nextCursor, terminal: result.terminal })}\n\n`,
      );
    });

    app.get("/v1/branches/:branchId/actions", async (request) => {
      const account = await authenticatedAccount(request, auth);
      const { branchId } = request.params as { branchId: string };
      return branchActionHistorySchema.parse(await actions.listBranchActions(account, branchId));
    });
  }

  return app;
}
