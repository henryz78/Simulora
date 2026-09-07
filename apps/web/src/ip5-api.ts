import {
  recoveryBranchSchema,
  recoveryPointSchema,
  recoveryResponseSchema,
  restoreCommitSchema,
  restoreProposalSchema,
  type CreateRecoveryPointRequest,
  type ForkBranchRequest,
  type RecoveryBranch,
  type RecoveryPoint,
  type RecoveryResponse,
  type RestoreCommit,
  type RestoreProposal,
} from "@simulora/contracts";
import { requestJson, type ApiResult } from "./ip4-api.js";

const jsonHeaders = { "content-type": "application/json", accept: "application/json" };

export function readRecovery(continuityId: string): Promise<ApiResult<RecoveryResponse>> {
  return requestJson(
    `/v1/continuities/${encodeURIComponent(continuityId)}/recovery`,
    { headers: { accept: "application/json" } },
    (value) => recoveryResponseSchema.parse(value),
  );
}

export function createRecoveryPoint(
  branchId: string,
  request: CreateRecoveryPointRequest,
): Promise<ApiResult<RecoveryPoint>> {
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/recovery-points`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(request) },
    (value) => recoveryPointSchema.parse(value),
  );
}

export function deleteRecoveryPoint(id: string): Promise<ApiResult<RecoveryPoint>> {
  return requestJson(
    `/v1/recovery-points/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: { accept: "application/json" } },
    (value) => recoveryPointSchema.parse(value),
  );
}

export function forkBranch(
  continuityId: string,
  request: ForkBranchRequest,
): Promise<ApiResult<RecoveryBranch>> {
  return requestJson(
    `/v1/continuities/${encodeURIComponent(continuityId)}/branches`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(request) },
    (value) => recoveryBranchSchema.parse(value),
  );
}

export function selectBranch(
  continuityId: string,
  branchId: string,
): Promise<ApiResult<RecoveryResponse>> {
  return requestJson(
    `/v1/continuities/${encodeURIComponent(continuityId)}/active-branch`,
    { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ branchId }) },
    (value) => recoveryResponseSchema.parse(value),
  );
}

export function prepareRestore(
  branchId: string,
  sourceCommitId: string,
): Promise<ApiResult<RestoreProposal>> {
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/restore-proposals`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ sourceCommitId }) },
    (value) => restoreProposalSchema.parse(value),
  );
}

export function readRestoreProposal(id: string): Promise<ApiResult<RestoreProposal>> {
  return requestJson(
    `/v1/restore-proposals/${encodeURIComponent(id)}`,
    { headers: { accept: "application/json" } },
    (value) => restoreProposalSchema.parse(value),
  );
}

export function confirmRestore(
  branchId: string,
  proposal: RestoreProposal,
): Promise<ApiResult<RestoreCommit>> {
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/restores`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        proposalId: proposal.id,
        digest: proposal.digest,
        expectedHeadCommitId: proposal.expectedHeadCommitId,
      }),
    },
    (value) => restoreCommitSchema.parse(value),
  );
}
