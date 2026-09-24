import {
  accessExplanationResponseSchema,
  appealRequestSchema,
  appealResponseSchema,
  consentListResponseSchema,
  consentRecordSchema,
  consentRequestSchema,
  deletionConfirmRequestSchema,
  deletionProposalRequestSchema,
  deletionProposalSchema,
  deletionStatusSchema,
  exportRequestSchema,
  exportResponseSchema,
  meResponseSchema,
  productChangesResponseSchema,
  usageQuoteRequestSchema,
  usageQuoteSchema,
  usageReservationRequestSchema,
  usageReservationSchema,
  type AppealRequest,
  type ConsentRequest,
  type DeletionConfirmRequest,
  type DeletionProposalRequest,
  type ExportRequest,
  type UsageQuoteRequest,
  type UsageReservationRequest,
} from "@simulora/contracts";
import { requestJson, type ApiResult } from "./ip4-api.js";

const jsonHeaders = { "content-type": "application/json", accept: "application/json" };
const idempotencyHeaders = (key: string) => ({
  ...jsonHeaders,
  "idempotency-key": key,
});

export const readMe = () =>
  requestJson("/v1/me", { headers: { accept: "application/json" } }, (value) =>
    meResponseSchema.parse(value),
  );

export const readConsents = () =>
  requestJson("/v1/me/consents", { headers: { accept: "application/json" } }, (value) =>
    consentListResponseSchema.parse(value),
  );

export function setConsent(request: ConsentRequest) {
  const body = consentRequestSchema.parse(request);
  return requestJson(
    "/v1/me/consents",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => consentRecordSchema.parse(value),
  );
}

export const readWorldAccess = (worldId: string) =>
  requestJson(
    `/v1/resources/world/${encodeURIComponent(worldId)}/access`,
    { headers: { accept: "application/json" } },
    (value) => accessExplanationResponseSchema.parse(value),
  );

export const readProductChanges = () =>
  requestJson("/v1/product-changes", { headers: { accept: "application/json" } }, (value) =>
    productChangesResponseSchema.parse(value),
  );

export function createUsageQuote(request: UsageQuoteRequest) {
  const body = usageQuoteRequestSchema.parse(request);
  return requestJson(
    "/v1/usage/quotes",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => usageQuoteSchema.parse(value),
  );
}

export function reserveUsage(quoteId: string, request: UsageReservationRequest) {
  const body = usageReservationRequestSchema.parse(request);
  return requestJson(
    `/v1/usage/quotes/${encodeURIComponent(quoteId)}/reservations`,
    {
      method: "POST",
      headers: idempotencyHeaders(body.actionKey),
      body: JSON.stringify(body),
    },
    (value) => usageReservationSchema.parse(value),
  );
}

export const releaseUsage = (reservationId: string) =>
  requestJson(
    `/v1/usage/reservations/${encodeURIComponent(reservationId)}/release`,
    { method: "POST", headers: idempotencyHeaders(reservationId), body: "{}" },
    (value) => usageReservationSchema.parse(value),
  );

export function createExport(request: ExportRequest) {
  const body = exportRequestSchema.parse(request);
  return requestJson(
    "/v1/exports",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => exportResponseSchema.parse(value),
  );
}

export const readExport = (exportId: string) =>
  requestJson(
    `/v1/exports/${encodeURIComponent(exportId)}`,
    { headers: { accept: "application/json" } },
    (value) => exportResponseSchema.parse(value),
  );

export function proposeDeletion(request: DeletionProposalRequest) {
  const body = deletionProposalRequestSchema.parse(request);
  return requestJson(
    "/v1/deletion-proposals",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => deletionProposalSchema.parse(value),
  );
}

export function confirmDeletion(request: DeletionConfirmRequest) {
  const body = deletionConfirmRequestSchema.parse(request);
  return requestJson(
    "/v1/deletions",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => deletionStatusSchema.parse(value),
  );
}

export function openAppeal(request: AppealRequest) {
  const body = appealRequestSchema.parse(request);
  return requestJson(
    "/v1/appeals",
    {
      method: "POST",
      headers: idempotencyHeaders(body.idempotencyKey),
      body: JSON.stringify(body),
    },
    (value) => appealResponseSchema.parse(value),
  );
}

export type TrustLoad = {
  me: NonNullable<Awaited<ReturnType<typeof readMe>>["data"]>;
  consents: NonNullable<Awaited<ReturnType<typeof readConsents>>["data"]>;
  access: NonNullable<Awaited<ReturnType<typeof readWorldAccess>>["data"]>;
  changes: NonNullable<Awaited<ReturnType<typeof readProductChanges>>["data"]>;
};

export async function loadTrust(worldId: string): Promise<ApiResult<TrustLoad>> {
  const [me, consents, access, changes] = await Promise.all([
    readMe(),
    readConsents(),
    readWorldAccess(worldId),
    readProductChanges(),
  ]);
  const response = [me, consents, access, changes].find((result) => !result.data)?.response;
  return {
    response: response ?? new Response(null, { status: 200 }),
    data:
      me.data && consents.data && access.data && changes.data
        ? { me: me.data, consents: consents.data, access: access.data, changes: changes.data }
        : null,
    errorCode: null,
  };
}
