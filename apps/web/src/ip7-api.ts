import {
  authoritativeStateResponseSchema,
  createWorldRequestSchema,
  createWorldResponseSchema,
  startContinuityRequestSchema,
  updateWorldDraftRequestSchema,
  worldStudioResponseSchema,
  worldValidationResponseSchema,
  type WorldDocumentInput,
  type WorldStudioResponse,
  type WorldValidationResponse,
} from "@simulora/contracts";
import { requestJson, type ApiResult } from "./ip4-api.js";

const jsonHeaders = { "content-type": "application/json", accept: "application/json" };

export function createWorld(
  document: WorldDocumentInput,
): Promise<ApiResult<{ worldId: string; rowVersion: number; documentHash: string }>> {
  const request = createWorldRequestSchema.parse({ document });
  return requestJson(
    "/v1/worlds",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(request) },
    (value) => createWorldResponseSchema.parse(value),
  );
}

export function readWorldStudio(worldId: string): Promise<ApiResult<WorldStudioResponse>> {
  return requestJson(
    `/v1/worlds/${encodeURIComponent(worldId)}/studio`,
    { headers: { accept: "application/json" } },
    (value) => worldStudioResponseSchema.parse(value),
  );
}

export function updateWorldDraft(
  worldId: string,
  expectedVersion: number,
  document: WorldDocumentInput,
): Promise<ApiResult<WorldStudioResponse["draft"]>> {
  const request = updateWorldDraftRequestSchema.parse({ expectedVersion, document });
  return requestJson(
    `/v1/worlds/${encodeURIComponent(worldId)}/draft`,
    { method: "PUT", headers: jsonHeaders, body: JSON.stringify(request) },
    (value) => worldStudioResponseSchema.shape.draft.parse(value),
  );
}

export function validateWorldDraft(worldId: string): Promise<ApiResult<WorldValidationResponse>> {
  return requestJson(
    `/v1/worlds/${encodeURIComponent(worldId)}/validation`,
    { method: "POST", headers: jsonHeaders, body: "{}" },
    (value) => worldValidationResponseSchema.parse(value),
  );
}

export function createWorldRevision(
  worldId: string,
  expectedDraftVersion: number,
): Promise<ApiResult<WorldStudioResponse["revisions"][number]>> {
  return requestJson(
    `/v1/worlds/${encodeURIComponent(worldId)}/revisions`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ expectedDraftVersion }),
    },
    (value) => worldStudioResponseSchema.shape.revisions.element.parse(value),
  );
}

export function startWorldContinuity(
  worldRevisionId: string,
  participation: {
    initiativeMode: "DIRECT" | "GUIDED" | "WORLD_ACTIVE";
    structureMode: "OPEN_ENDED" | "GOAL_FRAMED";
  },
): Promise<ApiResult<ReturnType<typeof authoritativeStateResponseSchema.parse>>> {
  const request = startContinuityRequestSchema.parse({ participation });
  return requestJson(
    `/v1/world-revisions/${encodeURIComponent(worldRevisionId)}/continuities`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(request) },
    (value) => authoritativeStateResponseSchema.parse(value),
  );
}
