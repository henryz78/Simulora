import type { FoundationResponse } from "@simulora/contracts";
import type { ParticipationContract, StateRevisionDocument, WorldDocument } from "@simulora/domain";

export type { ParticipationContract, StateRevisionDocument, WorldDocument } from "@simulora/domain";
export { createInitialState, lanternReachSeed } from "@simulora/domain";

export type DependencyHealth = {
  name: "database" | "object-storage" | "model-gateway" | "auth";
  configured: boolean;
};

export function describeFoundation(dependencies: readonly DependencyHealth[]): FoundationResponse {
  return {
    productImplementationPhase: "IP-2",
    productSemanticsStarted: true,
    capabilities: dependencies.map((dependency) => ({
      name: dependency.name,
      status: dependency.configured ? "configured" : "not-configured",
    })),
  };
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
}
