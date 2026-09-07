import type {
  ActionProgressResponse,
  ActionResponse,
  BranchTraceResponse,
  BranchActionHistory,
  ConfirmActionRequest,
  CorrectionRequest,
  ExplanationResponse,
  FoundationResponse,
  OrientationResponse,
  RecoveryBranch,
  RecoveryPoint,
  RecoveryResponse,
  RestoreCommit,
  RestoreProposal,
  CreateRecoveryPointRequest,
  ForkBranchRequest,
  SubmitActionRequest,
} from "@simulora/contracts";
import type { ParticipationContract, StateRevisionDocument, WorldDocument } from "@simulora/domain";

export type { ParticipationContract, StateRevisionDocument, WorldDocument } from "@simulora/domain";
export {
  applyValidatedActionCandidate,
  createInitialState,
  lanternReachSeed,
  validateActionCandidate,
} from "@simulora/domain";

export type DependencyHealth = {
  name: "database" | "object-storage" | "model-gateway" | "auth";
  configured: boolean;
};

export function describeFoundation(dependencies: readonly DependencyHealth[]): FoundationResponse {
  return {
    productImplementationPhase: "IP-5",
    productSemanticsStarted: true,
    capabilities: dependencies.map((dependency) => ({
      name: dependency.name,
      status: dependency.configured ? "configured" : "not-configured",
    })),
  };
}

export interface ActionTruthPort {
  submitAction(
    account: EligibleAccount,
    branchId: string,
    request: SubmitActionRequest,
  ): Promise<ActionResponse>;
  readAction(account: EligibleAccount, actionId: string): Promise<ActionResponse>;
  confirmAction(
    account: EligibleAccount,
    actionId: string,
    request: ConfirmActionRequest,
  ): Promise<ActionResponse>;
  cancelAction(account: EligibleAccount, actionId: string): Promise<ActionResponse>;
  retryAction(account: EligibleAccount, actionId: string): Promise<ActionResponse>;
  readProgress(
    account: EligibleAccount,
    actionId: string,
    afterSequence: number,
  ): Promise<ActionProgressResponse>;
  listBranchActions(account: EligibleAccount, branchId: string): Promise<BranchActionHistory>;
  submitCorrection?(
    account: EligibleAccount,
    branchId: string,
    request: CorrectionRequest,
  ): Promise<ActionResponse>;
}

export class ActionTruthService {
  constructor(private readonly port: ActionTruthPort) {}

  submitAction(account: EligibleAccount, branchId: string, request: SubmitActionRequest) {
    return this.port.submitAction(account, branchId, request);
  }

  readAction(account: EligibleAccount, actionId: string) {
    return this.port.readAction(account, actionId);
  }

  confirmAction(account: EligibleAccount, actionId: string, request: ConfirmActionRequest) {
    return this.port.confirmAction(account, actionId, request);
  }

  cancelAction(account: EligibleAccount, actionId: string) {
    return this.port.cancelAction(account, actionId);
  }

  retryAction(account: EligibleAccount, actionId: string) {
    return this.port.retryAction(account, actionId);
  }

  readProgress(account: EligibleAccount, actionId: string, afterSequence: number) {
    return this.port.readProgress(account, actionId, afterSequence);
  }

  listBranchActions(account: EligibleAccount, branchId: string) {
    return this.port.listBranchActions(account, branchId);
  }

  submitCorrection(account: EligibleAccount, branchId: string, request: CorrectionRequest) {
    if (!this.port.submitCorrection) {
      throw new Error("Continuity correction is not configured");
    }
    return this.port.submitCorrection(account, branchId, request);
  }
}

export type EligibleAccount = {
  accountId: string;
  eligibility: "adult" | "ineligible" | "unknown";
};

export type AuthoritativeState = {
  continuityId: string;
  branchId: string;
  headCommitId: string;
  stateRevisionId: string;
  worldRevisionId: string;
  worldRevisionNumber: number;
  world: WorldDocument;
  state: StateRevisionDocument;
  stateHash: string;
};

export interface WorldContinuityPort {
  createWorld(
    account: EligibleAccount,
    document: WorldDocument,
  ): Promise<{
    worldId: string;
    rowVersion: number;
    documentHash: string;
  }>;
  updateDraft(
    account: EligibleAccount,
    worldId: string,
    expectedVersion: number,
    document: WorldDocument,
  ): Promise<{
    worldId: string;
    rowVersion: number;
    documentHash: string;
  }>;
  createRevision(
    account: EligibleAccount,
    worldId: string,
    expectedDraftVersion: number,
  ): Promise<{
    revisionId: string;
    worldId: string;
    revisionNumber: number;
    documentHash: string;
  }>;
  startContinuity(
    account: EligibleAccount,
    worldRevisionId: string,
    participation: ParticipationContract,
  ): Promise<AuthoritativeState>;
  readCurrentState(account: EligibleAccount, continuityId: string): Promise<AuthoritativeState>;
  readBranchState?(account: EligibleAccount, branchId: string): Promise<AuthoritativeState>;
  readOrientation?(account: EligibleAccount, continuityId: string): Promise<OrientationResponse>;
  listBranchCommits?(
    account: EligibleAccount,
    branchId: string,
    cursor?: string,
    limit?: number,
  ): Promise<BranchTraceResponse>;
  readExplanation?(
    account: EligibleAccount,
    branchId: string,
    targetType: "fact" | "commit",
    targetId: string,
  ): Promise<ExplanationResponse>;
  readRecovery?(account: EligibleAccount, continuityId: string): Promise<RecoveryResponse>;
  createRecoveryPoint?(
    account: EligibleAccount,
    branchId: string,
    request: CreateRecoveryPointRequest,
  ): Promise<RecoveryPoint>;
  deleteRecoveryPoint?(account: EligibleAccount, recoveryPointId: string): Promise<RecoveryPoint>;
  forkBranch?(
    account: EligibleAccount,
    continuityId: string,
    request: ForkBranchRequest,
  ): Promise<RecoveryBranch>;
  selectBranch?(
    account: EligibleAccount,
    continuityId: string,
    branchId: string,
  ): Promise<RecoveryResponse>;
  prepareRestore?(
    account: EligibleAccount,
    branchId: string,
    sourceCommitId: string,
  ): Promise<RestoreProposal>;
  confirmRestore?(
    account: EligibleAccount,
    branchId: string,
    request: { proposalId: string; digest: string; expectedHeadCommitId: string },
  ): Promise<RestoreCommit>;
}

export class WorldContinuityService {
  constructor(private readonly port: WorldContinuityPort) {}

  createWorld(account: EligibleAccount, document: WorldDocument) {
    return this.port.createWorld(account, document);
  }

  updateDraft(
    account: EligibleAccount,
    worldId: string,
    expectedVersion: number,
    document: WorldDocument,
  ) {
    return this.port.updateDraft(account, worldId, expectedVersion, document);
  }

  createRevision(account: EligibleAccount, worldId: string, expectedDraftVersion: number) {
    return this.port.createRevision(account, worldId, expectedDraftVersion);
  }

  startContinuity(
    account: EligibleAccount,
    worldRevisionId: string,
    participation: ParticipationContract,
  ) {
    return this.port.startContinuity(account, worldRevisionId, participation);
  }

  readCurrentState(account: EligibleAccount, continuityId: string) {
    return this.port.readCurrentState(account, continuityId);
  }

  readBranchState(account: EligibleAccount, branchId: string) {
    if (!this.port.readBranchState) throw new Error("Branch state is not configured");
    return this.port.readBranchState(account, branchId);
  }

  readOrientation(account: EligibleAccount, continuityId: string) {
    if (!this.port.readOrientation) throw new Error("Return orientation is not configured");
    return this.port.readOrientation(account, continuityId);
  }

  listBranchCommits(account: EligibleAccount, branchId: string, cursor?: string, limit?: number) {
    if (!this.port.listBranchCommits) throw new Error("Change Trace is not configured");
    return this.port.listBranchCommits(account, branchId, cursor, limit);
  }

  readExplanation(
    account: EligibleAccount,
    branchId: string,
    targetType: "fact" | "commit",
    targetId: string,
  ) {
    if (!this.port.readExplanation) throw new Error("Explanation is not configured");
    return this.port.readExplanation(account, branchId, targetType, targetId);
  }

  readRecovery(account: EligibleAccount, continuityId: string) {
    if (!this.port.readRecovery) throw new Error("Recovery is not configured");
    return this.port.readRecovery(account, continuityId);
  }

  createRecoveryPoint(
    account: EligibleAccount,
    branchId: string,
    request: CreateRecoveryPointRequest,
  ) {
    if (!this.port.createRecoveryPoint) throw new Error("Recovery Point is not configured");
    return this.port.createRecoveryPoint(account, branchId, request);
  }

  deleteRecoveryPoint(account: EligibleAccount, recoveryPointId: string) {
    if (!this.port.deleteRecoveryPoint) throw new Error("Recovery Point is not configured");
    return this.port.deleteRecoveryPoint(account, recoveryPointId);
  }

  forkBranch(account: EligibleAccount, continuityId: string, request: ForkBranchRequest) {
    if (!this.port.forkBranch) throw new Error("Branch recovery is not configured");
    return this.port.forkBranch(account, continuityId, request);
  }

  selectBranch(account: EligibleAccount, continuityId: string, branchId: string) {
    if (!this.port.selectBranch) throw new Error("Branch selection is not configured");
    return this.port.selectBranch(account, continuityId, branchId);
  }

  prepareRestore(account: EligibleAccount, branchId: string, sourceCommitId: string) {
    if (!this.port.prepareRestore) throw new Error("Restore review is not configured");
    return this.port.prepareRestore(account, branchId, sourceCommitId);
  }

  confirmRestore(
    account: EligibleAccount,
    branchId: string,
    request: { proposalId: string; digest: string; expectedHeadCommitId: string },
  ) {
    if (!this.port.confirmRestore) throw new Error("Restore confirmation is not configured");
    return this.port.confirmRestore(account, branchId, request);
  }
}
