import {
  actionResponseSchema,
  changeParticipationContractRequestSchema,
  type ActionResponse,
  type ChangeParticipationContractRequest,
} from "@simulora/contracts";
import { requestJson, type ApiResult } from "./ip4-api.js";

export function changeParticipationContract(
  branchId: string,
  request: ChangeParticipationContractRequest,
): Promise<ApiResult<ActionResponse>> {
  return requestJson(
    `/v1/branches/${encodeURIComponent(branchId)}/participation-contract`,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(changeParticipationContractRequestSchema.parse(request)),
    },
    (value) => actionResponseSchema.parse(value),
  );
}
