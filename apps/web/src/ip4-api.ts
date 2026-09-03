import {
  actionResponseSchema,
  branchTraceResponseSchema,
  correctionRequestSchema,
  explanationResponseSchema,
  orientationResponseSchema,
  type ActionResponse,
  type BranchTraceResponse,
  type CorrectionRequest,
  type ExplanationResponse,
  type OrientationResponse,
} from "@simulora/contracts";

export type ApiResult<T> = {
  response: Response;
  data: T | null;
  errorCode: string | null;
};

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const value: unknown = await response.clone().json();
    if (typeof value !== "object" || value === null) return null;
    const body = value as Record<string, unknown>;
    if (typeof body.code === "string") return body.code;
    if (typeof body.error === "object" && body.error !== null) {
      const nested = body.error as Record<string, unknown>;
      return typeof nested.code === "string" ? nested.code : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  parse: (value: unknown) => T,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return {
      response: new Response(null, { status: 503 }),
      data: null,
      errorCode: null,
    };
  }
  if (!response.ok) return { response, data: null, errorCode: await readErrorCode(response) };
  try {
    return { response, data: parse(await response.json()), errorCode: null };
  } catch {
    return { response, data: null, errorCode: null };
  }
}

export async function readOrientation(
  continuityId: string,
): Promise<ApiResult<OrientationResponse>> {
  return requestJson(
    `/v1/continuities/${encodeURIComponent(continuityId)}/orientation`,
    { headers: { accept: "application/json" } },
    (value) => orientationResponseSchema.parse(value),
  );
}

export async function readBranchTrace(
  branchId: string,
  cursor?: string,
): Promise<ApiResult<BranchTraceResponse>> {
  const query = new URLSearchParams({ limit: "50" });
  if (cursor) query.set("cursor", cursor);
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/commits?${query.toString()}`,
    { headers: { accept: "application/json" } },
    (value) => branchTraceResponseSchema.parse(value),
  );
}

export async function readExplanation(
  branchId: string,
  targetType: "fact" | "commit",
  targetId: string,
): Promise<ApiResult<ExplanationResponse>> {
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/explanations/${targetType}/${encodeURIComponent(targetId)}`,
    { headers: { accept: "application/json" } },
    (value) => explanationResponseSchema.parse(value),
  );
}

export async function submitCorrection(
  branchId: string,
  request: CorrectionRequest,
): Promise<ApiResult<ActionResponse>> {
  const validated = correctionRequestSchema.parse(request);
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/corrections`,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(validated),
    },
    (value) => actionResponseSchema.parse(value),
  );
}
