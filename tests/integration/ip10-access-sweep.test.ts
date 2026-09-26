import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ActionTruthService,
  GovernanceService,
  WorldContinuityService,
} from "../../packages/application/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { InMemoryObjectStorage } from "../../packages/storage/src/index.js";
import { createApiApp } from "../../apps/api/src/app.js";
import type { AuthPort } from "../../packages/auth/src/index.js";

/**
 * IP-10.5 SEC-ACCESS: a second account presents one owner's identifiers to every
 * owner-scoped route. Each must refuse without revealing the owner's content or
 * changing it. The route list is read from the API source, so a new route that
 * this sweep does not cover fails the test instead of escaping it.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const gateway = new DeterministicModelGateway();

// Routes with no owner-scoped identifier: the caller's own account, public
// product data, or creation of the caller's own objects.
const selfScoped = new Set([
  "GET /health",
  "GET /v1/foundation",
  "GET /v1/me",
  "GET /v1/me/consents",
  "POST /v1/me/consents",
  "GET /v1/me/library",
  "GET /v1/product-changes",
  "POST /v1/usage/quotes",
  "GET /v1/usage/ledger",
  "POST /v1/worlds",
  "POST /v1/character-assets",
  // A signed, expiring bearer link by design; its tamper, expiry and revocation
  // refusals are proven by the IP-9 object-storage suite.
  "GET /v1/export-downloads/:token",
]);

suite("IP-10.5 SEC-ACCESS horizontal sweep against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterAll(async () => pool?.end());

  it("refuses another account on every owner-scoped route and changes nothing", async () => {
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    const intruder = { accountId: randomUUID(), eligibility: "adult" as const };
    const marker = `OWNER_ONLY_${randomUUID().slice(0, 8)}`;
    let authenticated = owner;
    const auth: AuthPort = { authenticate: () => Promise.resolve(authenticated) };
    const governance = new GovernanceService(repository, {
      artifacts: new InMemoryObjectStorage(),
    });
    const app = createApiApp({
      logLevel: "error",
      auth,
      worldService: new WorldContinuityService(repository),
      actionService: new ActionTruthService(repository),
      governanceService: governance,
    });
    const key = (label: string) => `sweep-${label}-${randomUUID()}`;
    const send = async (
      method: "GET" | "POST" | "PUT" | "DELETE",
      url: string,
      payload?: Record<string, unknown>,
    ) => {
      const idempotencyKey =
        typeof payload?.idempotencyKey === "string"
          ? payload.idempotencyKey
          : typeof payload?.actionKey === "string"
            ? payload.actionKey
            : key("header");
      return app.inject({
        method,
        url,
        headers: { "idempotency-key": idempotencyKey },
        ...(payload ? { payload } : {}),
      });
    };
    const created = async <T>(
      method: "POST" | "PUT",
      url: string,
      payload: Record<string, unknown>,
    ) => {
      const response = await send(method, url, payload);
      expect(response.statusCode, `${method} ${url}: ${response.body}`).toBeLessThan(300);
      return response.json<T>();
    };

    try {
      // The owner's objects, made through the same API.
      const world = await created<{ worldId: string }>("POST", "/v1/worlds", {
        document: { ...lanternReachSeed, title: `Private world ${marker}` },
      });
      await created("POST", `/v1/worlds/${world.worldId}/validation`, {});
      const revision = await created<{ revisionId: string }>(
        "POST",
        `/v1/worlds/${world.worldId}/revisions`,
        { expectedDraftVersion: 1 },
      );
      const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;
      const started = await created<{
        continuity: { id: string; branchId: string; headCommitId: string };
      }>("POST", `/v1/world-revisions/${revision.revisionId}/continuities`, { participation });
      const { branchId, id: continuityId, headCommitId: openingHead } = started.continuity;
      const fact = lanternReachSeed.facts[0]!;

      const submitAction = async (expectedHeadCommitId: string, intent: string) => {
        const action = await created<{ id: string }>("POST", `/v1/branches/${branchId}/actions`, {
          schemaVersion: 1,
          idempotencyKey: key("action"),
          expectedHeadCommitId,
          participationExpectation: participation,
          intent,
        });
        const proposed = await repository.processAction(
          action.id,
          (request) => gateway.generateWorldTurn(request),
          "sweep-worker",
        );
        return { id: action.id, proposal: proposed!.proposal! };
      };
      const committed = await submitAction(openingHead, `Steady the signal. ${marker}`);
      const confirmBody = {
        proposalId: committed.proposal.id,
        proposalDigest: committed.proposal.digest,
        expectedHeadCommitId: committed.proposal.expectedHeadCommitId,
      };
      const commit = await created<{ commit: { resultingHeadCommitId: string } }>(
        "POST",
        `/v1/actions/${committed.id}/confirm`,
        confirmBody,
      );
      const head = commit.commit.resultingHeadCommitId;
      const point = await created<{ id: string }>(
        "POST",
        `/v1/branches/${branchId}/recovery-points`,
        { idempotencyKey: key("point"), label: `Safe ${marker}` },
      );
      const restore = await created<{ id: string; digest: string }>(
        "POST",
        `/v1/branches/${branchId}/restore-proposals`,
        { sourceCommitId: openingHead },
      );
      const pending = await submitAction(head, `Read the vessel lights. ${marker}`);

      const quote = await created<{ quoteId: string }>("POST", "/v1/usage/quotes", {
        schemaVersion: 1,
        idempotencyKey: key("quote"),
        actionProfile: "EXPORT",
      });
      const exportKey = key("export");
      const reservation = await created<{ reservationId: string }>(
        "POST",
        `/v1/usage/quotes/${quote.quoteId}/reservations`,
        { schemaVersion: 1, actionKey: `export:${exportKey}` },
      );
      const include = { world: true, characters: true, continuity: true, history: true };
      const exported = await created<{ exportId: string }>("POST", "/v1/exports", {
        schemaVersion: 1,
        idempotencyKey: exportKey,
        reservationId: reservation.reservationId,
        worldId: world.worldId,
        include,
      });
      const spareQuote = await created<{ quoteId: string }>("POST", "/v1/usage/quotes", {
        schemaVersion: 1,
        idempotencyKey: key("quote"),
        actionProfile: "WORLD_TURN",
      });
      const spare = await created<{ reservationId: string; status: string }>(
        "POST",
        `/v1/usage/quotes/${spareQuote.quoteId}/reservations`,
        { schemaVersion: 1, actionKey: key("spare") },
      );
      const appeal = await created<{ appealId: string }>("POST", "/v1/appeals", {
        schemaVersion: 1,
        idempotencyKey: key("appeal"),
        reasonCode: "ACCESS",
        subjectType: "WORLD",
        subjectId: world.worldId,
        summary: `Please review. ${marker}`,
      });
      const asset = await created<{ id: string }>("POST", "/v1/character-assets", {
        document: {
          schemaVersion: 1,
          name: `Private keeper ${marker}`,
          role: "Keeper",
          motives: ["Keep the light."],
          stance: "Careful.",
        },
      });
      const deletion = await created<{ proposalId: string; digest: string }>(
        "POST",
        "/v1/deletion-proposals",
        {
          schemaVersion: 1,
          idempotencyKey: key("delete"),
          targetType: "WORLD",
          targetId: world.worldId,
        },
      );
      const before = await repository.readCurrentState(owner, continuityId);

      // The intruder holds its own valid export reservation, so only the World's
      // ownership can refuse the export below.
      const intruderExport = {
        schemaVersion: 1,
        idempotencyKey: key("intruder-export"),
        reservationId: "",
        worldId: world.worldId,
        include,
      };
      authenticated = intruder;
      const intruderQuote = await created<{ quoteId: string }>("POST", "/v1/usage/quotes", {
        schemaVersion: 1,
        idempotencyKey: key("quote"),
        actionProfile: "EXPORT",
      });
      intruderExport.reservationId = (
        await created<{ reservationId: string }>(
          "POST",
          `/v1/usage/quotes/${intruderQuote.quoteId}/reservations`,
          { schemaVersion: 1, actionKey: `export:${intruderExport.idempotencyKey}` },
        )
      ).reservationId;

      // Every owner-scoped route, presented with the owner's identifiers.
      const probes: Array<
        [string, "GET" | "POST" | "PUT" | "DELETE", string, Record<string, unknown>?]
      > = [
        [
          "GET /v1/resources/:resourceType/:resourceId/access",
          "GET",
          `/v1/resources/world/${world.worldId}/access`,
        ],
        [
          "GET /v1/resources/:resourceType/:resourceId/access",
          "GET",
          `/v1/resources/continuity/${continuityId}/access`,
        ],
        ["GET /v1/appeals/:appealId", "GET", `/v1/appeals/${appeal.appealId}`],
        [
          "POST /v1/appeals",
          "POST",
          "/v1/appeals",
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            reasonCode: "ACCESS",
            subjectType: "CONTINUITY",
            subjectId: continuityId,
            summary: "Mine?",
          },
        ],
        [
          "POST /v1/usage/quotes/:quoteId/reservations",
          "POST",
          `/v1/usage/quotes/${spareQuote.quoteId}/reservations`,
          { schemaVersion: 1, actionKey: key("x") },
        ],
        [
          "POST /v1/usage/reservations/:reservationId/settle",
          "POST",
          `/v1/usage/reservations/${spare.reservationId}/settle`,
        ],
        [
          "POST /v1/usage/reservations/:reservationId/release",
          "POST",
          `/v1/usage/reservations/${spare.reservationId}/release`,
        ],
        ["POST /v1/exports", "POST", "/v1/exports", intruderExport],
        ["GET /v1/exports/:exportId", "GET", `/v1/exports/${exported.exportId}`],
        ["GET /v1/exports/:exportId/artifact", "GET", `/v1/exports/${exported.exportId}/artifact`],
        [
          "POST /v1/exports/:exportId/download-links",
          "POST",
          `/v1/exports/${exported.exportId}/download-links`,
        ],
        [
          "POST /v1/deletion-proposals",
          "POST",
          "/v1/deletion-proposals",
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            targetType: "WORLD",
            targetId: world.worldId,
          },
        ],
        [
          "POST /v1/deletion-proposals",
          "POST",
          "/v1/deletion-proposals",
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            targetType: "CHARACTER_ASSET",
            targetId: asset.id,
          },
        ],
        [
          "POST /v1/deletions",
          "POST",
          "/v1/deletions",
          {
            schemaVersion: 1,
            proposalId: deletion.proposalId,
            digest: deletion.digest,
            idempotencyKey: key("x"),
          },
        ],
        ["GET /v1/deletions/:proposalId", "GET", `/v1/deletions/${deletion.proposalId}`],
        [
          "PUT /v1/worlds/:worldId/draft",
          "PUT",
          `/v1/worlds/${world.worldId}/draft`,
          { expectedVersion: 1, document: lanternReachSeed },
        ],
        [
          "POST /v1/worlds/:worldId/revisions",
          "POST",
          `/v1/worlds/${world.worldId}/revisions`,
          { expectedDraftVersion: 1 },
        ],
        ["GET /v1/worlds/:worldId/studio", "GET", `/v1/worlds/${world.worldId}/studio`],
        [
          "POST /v1/worlds/:worldId/validation",
          "POST",
          `/v1/worlds/${world.worldId}/validation`,
          {},
        ],
        [
          "POST /v1/world-revisions/:worldRevisionId/continuities",
          "POST",
          `/v1/world-revisions/${revision.revisionId}/continuities`,
          { participation },
        ],
        [
          "GET /v1/continuities/:continuityId/state",
          "GET",
          `/v1/continuities/${continuityId}/state`,
        ],
        [
          "GET /v1/continuities/:continuityId/orientation",
          "GET",
          `/v1/continuities/${continuityId}/orientation`,
        ],
        [
          "GET /v1/continuities/:continuityId/recovery",
          "GET",
          `/v1/continuities/${continuityId}/recovery`,
        ],
        [
          "POST /v1/branches/:branchId/recovery-points",
          "POST",
          `/v1/branches/${branchId}/recovery-points`,
          { idempotencyKey: key("x"), label: "Mine" },
        ],
        [
          "DELETE /v1/recovery-points/:recoveryPointId",
          "DELETE",
          `/v1/recovery-points/${point.id}`,
        ],
        [
          "POST /v1/continuities/:continuityId/branches",
          "POST",
          `/v1/continuities/${continuityId}/branches`,
          {
            idempotencyKey: key("x"),
            name: "Mine",
            sourceCommitId: head,
            expectedHeadCommitId: head,
          },
        ],
        [
          "PUT /v1/continuities/:continuityId/active-branch",
          "PUT",
          `/v1/continuities/${continuityId}/active-branch`,
          { branchId },
        ],
        [
          "POST /v1/branches/:branchId/restore-proposals",
          "POST",
          `/v1/branches/${branchId}/restore-proposals`,
          { sourceCommitId: openingHead },
        ],
        ["GET /v1/restore-proposals/:proposalId", "GET", `/v1/restore-proposals/${restore.id}`],
        [
          "POST /v1/branches/:branchId/restores",
          "POST",
          `/v1/branches/${branchId}/restores`,
          { proposalId: restore.id, digest: restore.digest, expectedHeadCommitId: head },
        ],
        ["GET /v1/branches/:branchId/state", "GET", `/v1/branches/${branchId}/state`],
        ["GET /v1/branches/:branchId/commits", "GET", `/v1/branches/${branchId}/commits`],
        [
          "GET /v1/branches/:branchId/explanations/:targetType/:targetId",
          "GET",
          `/v1/branches/${branchId}/explanations/fact/${encodeURIComponent(fact.id)}`,
        ],
        [
          "POST /v1/branches/:branchId/actions",
          "POST",
          `/v1/branches/${branchId}/actions`,
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            expectedHeadCommitId: head,
            participationExpectation: participation,
            intent: "Take over.",
          },
        ],
        [
          "POST /v1/branches/:branchId/corrections",
          "POST",
          `/v1/branches/${branchId}/corrections`,
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            expectedHeadCommitId: head,
            target: { type: "fact", id: fact.id },
            operation: "CORRECT_CONTINUITY",
            before: { statement: fact.statement, scope: fact.scope },
            after: { statement: "Rewritten." },
            reason: "Mine.",
          },
        ],
        [
          "POST /v1/branches/:branchId/participation-contract",
          "POST",
          `/v1/branches/${branchId}/participation-contract`,
          {
            schemaVersion: 1,
            idempotencyKey: key("x"),
            expectedHeadCommitId: head,
            before: participation,
            after: { ...participation, initiativeMode: "DIRECT" },
          },
        ],
        ["GET /v1/actions/:actionId", "GET", `/v1/actions/${pending.id}`],
        [
          "POST /v1/actions/:actionId/confirm",
          "POST",
          `/v1/actions/${pending.id}/confirm`,
          {
            proposalId: pending.proposal.id,
            proposalDigest: pending.proposal.digest,
            expectedHeadCommitId: head,
          },
        ],
        ["POST /v1/actions/:actionId/cancel", "POST", `/v1/actions/${pending.id}/cancel`],
        ["POST /v1/actions/:actionId/retry", "POST", `/v1/actions/${pending.id}/retry`],
        ["GET /v1/actions/:actionId/progress", "GET", `/v1/actions/${pending.id}/progress`],
        ["GET /v1/actions/:actionId/events", "GET", `/v1/actions/${committed.id}/events`],
        ["GET /v1/branches/:branchId/actions", "GET", `/v1/branches/${branchId}/actions`],
      ];

      const neutralReads: string[] = [];
      const leaks = [marker, fact.statement, before.state.facts[0]!.statement];
      for (const [route, method, url, payload] of probes) {
        const response = await send(method, url, payload);
        for (const text of leaks) expect(response.body, route).not.toContain(text);
        if (method === "GET" && ![403, 404].includes(response.statusCode)) {
          // A read may answer rather than refuse only if it answers exactly as
          // for an ID that does not exist: no content and no existence signal.
          const unknownId = randomUUID();
          const unknown = await send("GET", url.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/, unknownId));
          const neutral = (body: string, id: string) => body.replaceAll(id, "ID");
          const ownerId = /[0-9a-f]{8}-[0-9a-f-]{27}/.exec(url)![0];
          expect(response.statusCode, route).toBe(unknown.statusCode);
          expect(neutral(response.body, ownerId), route).toBe(neutral(unknown.body, unknownId));
          neutralReads.push(route);
          continue;
        }
        if (route === "POST /v1/appeals") {
          // An appeal may name a resource the caller cannot reach (an access
          // denial); it is the caller's own record and never looks the subject up,
          // so an unknown ID is answered the same way.
          const unknown = await send("POST", url, {
            ...payload,
            idempotencyKey: key("x"),
            subjectId: randomUUID(),
          });
          expect(response.statusCode).toBe(unknown.statusCode);
          expect(Object.keys(response.json<object>()).sort()).toEqual(
            Object.keys(unknown.json<object>()).sort(),
          );
          continue;
        }
        expect([403, 404], `${route} → ${response.statusCode} ${response.body}`).toContain(
          response.statusCode,
        );
      }
      // Reads that answer neutrally instead of refusing; any new one is a finding.
      expect(neutralReads.sort()).toEqual([
        "GET /v1/branches/:branchId/actions",
        "GET /v1/resources/:resourceType/:resourceId/access",
        "GET /v1/resources/:resourceType/:resourceId/access",
      ]);
      // The intruder's own views hold nothing of the owner's.
      for (const url of ["/v1/usage/ledger", "/v1/me/consents", "/v1/me", "/v1/me/library"]) {
        const body = (await send("GET", url)).body;
        for (const text of [
          marker,
          spare.reservationId,
          reservation.reservationId,
          owner.accountId,
        ]) {
          expect(body, url).not.toContain(text);
        }
      }

      // Every route that takes an identifier is either probed or declared self-scoped.
      const source = await readFile(path.join(repositoryRoot, "apps/api/src/app.ts"), "utf8");
      const routes = [...source.matchAll(/app\.(get|post|put|delete|patch)\(\s*"([^"]+)"/g)].map(
        ([, method, route]) => `${method!.toUpperCase()} ${route}`,
      );
      expect(routes.length).toBeGreaterThan(40);
      const probed = new Set(probes.map(([route]) => route));
      expect(routes.filter((route) => !probed.has(route) && !selfScoped.has(route))).toEqual([]);

      // Nothing the owner holds changed.
      authenticated = owner;
      const after = await repository.readCurrentState(owner, continuityId);
      expect(after.headCommitId).toBe(before.headCommitId);
      expect(after.state).toEqual(before.state);
      expect((await send("GET", `/v1/actions/${pending.id}`)).json()).toMatchObject({
        status: "AWAITING_CONFIRMATION",
      });
      expect((await send("GET", `/v1/deletions/${deletion.proposalId}`)).statusCode).toBe(200);
      expect((await send("GET", `/v1/restore-proposals/${restore.id}`)).statusCode).toBe(200);
      expect((await send("GET", `/v1/exports/${exported.exportId}`)).statusCode).toBe(200);
      const recovery = (await send("GET", `/v1/continuities/${continuityId}/recovery`)).body;
      expect(recovery).toContain(point.id);
      // The intruder's settle and release attempts left the reservation open.
      const settled = await send("POST", `/v1/usage/reservations/${spare.reservationId}/settle`);
      expect(settled.statusCode, settled.body).toBe(200);
    } finally {
      await app.close();
    }
  });
});
