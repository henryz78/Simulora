import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type {
  ActionProgressResponse,
  ActionResponse,
  BranchTraceResponse,
  BranchActionHistory,
  ChangeParticipationContractRequest,
  CharacterAssetResponse,
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
  CreateCharacterAssetRequest,
  ForkBranchRequest,
  SubmitActionRequest,
  WorldDraftResponse,
  WorldRevisionSummary,
  WorldStudioResponse,
  WorldValidationResponse,
  AccessExplanationResponse,
  AppealRequest,
  AppealResponse,
  ConsentRecord,
  ConsentRequest,
  DeletionConfirmRequest,
  DeletionProposal,
  DeletionProposalRequest,
  DeletionStatus,
  ExportRequest,
  ExportResponse,
  MeResponse,
  ProductChange,
  UsageLedgerEntry,
  UsageQuote,
  UsageQuoteRequest,
  UsageReservation,
  UsageReservationRequest,
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
    productImplementationPhase: "IP-9",
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
    correlationId?: string,
  ): Promise<ActionResponse>;
  changeParticipationContract?(
    account: EligibleAccount,
    branchId: string,
    request: ChangeParticipationContractRequest,
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

  submitAction(
    account: EligibleAccount,
    branchId: string,
    request: SubmitActionRequest,
    correlationId?: string,
  ) {
    return this.port.submitAction(account, branchId, request, correlationId);
  }

  changeParticipationContract(
    account: EligibleAccount,
    branchId: string,
    request: ChangeParticipationContractRequest,
  ) {
    if (!this.port.changeParticipationContract) {
      throw new Error("Participation contract change is not configured");
    }
    return this.port.changeParticipationContract(account, branchId, request);
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

export interface GovernancePort {
  readMe(account: EligibleAccount): Promise<MeResponse>;
  listConsents(
    account: EligibleAccount,
  ): Promise<{ policyVersion: string; consents: ConsentRecord[] }>;
  setConsent(account: EligibleAccount, request: ConsentRequest): Promise<ConsentRecord>;
  readAccess(
    account: EligibleAccount,
    resourceType: "world" | "continuity",
    resourceId: string,
  ): Promise<AccessExplanationResponse>;
  listProductChanges(): Promise<{ changes: ProductChange[] }>;
  openAppeal(account: EligibleAccount, request: AppealRequest): Promise<AppealResponse>;
  readAppeal(account: EligibleAccount, appealId: string): Promise<AppealResponse>;
  createUsageQuote(account: EligibleAccount, request: UsageQuoteRequest): Promise<UsageQuote>;
  reserveUsage(
    account: EligibleAccount,
    quoteId: string,
    request: UsageReservationRequest,
  ): Promise<UsageReservation>;
  settleUsage(account: EligibleAccount, reservationId: string): Promise<UsageReservation>;
  releaseUsage(account: EligibleAccount, reservationId: string): Promise<UsageReservation>;
  listUsageLedger(account: EligibleAccount): Promise<{ entries: UsageLedgerEntry[] }>;
  createExport(account: EligibleAccount, request: ExportRequest): Promise<ExportResponse>;
  readExport(account: EligibleAccount, exportId: string): Promise<ExportResponse>;
  readExportArtifactLocation(exportId: string, accountId?: string): Promise<ExportArtifactLocation>;
  claimStagedExport(exportId: string): Promise<ExportStorageWork | null>;
  markExportStored(exportId: string): Promise<"STORED" | "ALREADY_STORED" | "REVOKED">;
  recordExportStorageDelay(exportId: string, reasonCode: ExportStorageDelayReason): Promise<void>;
  proposeDeletion(
    account: EligibleAccount,
    request: DeletionProposalRequest,
  ): Promise<DeletionProposal>;
  confirmDeletion(
    account: EligibleAccount,
    request: DeletionConfirmRequest,
  ): Promise<DeletionStatus>;
  readDeletion(account: EligibleAccount, proposalId: string): Promise<DeletionStatus>;
}

/**
 * The object-store capability the export path needs. `@simulora/storage`
 * satisfies it structurally; the application layer does not depend on it.
 */
export interface ExportArtifactStore {
  readonly kind: string;
  put(
    metadata: { key: string; checksum: string; contentType: string },
    body: Uint8Array,
  ): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}

export type ExportArtifactLocation = {
  exportId: string;
  accountId: string;
  objectKey: string;
  checksum: string;
  inlineBytes: Uint8Array | null;
};

export type ExportStorageWork =
  | { operation: "STORE"; exportId: string; objectKey: string; checksum: string; bytes: Uint8Array }
  | { operation: "DELETE"; exportId: string; objectKey: string };

export type ExportStorageDelayReason = "OBJECT_STORE_UNAVAILABLE" | "OBJECT_INTEGRITY_FAILED";

export type ExportDownloadLink = {
  url: string;
  expiresAt: string;
  method: "API_SIGNED";
};

/** A dependency outside PostgreSQL is down; the request may be retried later. */
export class DependencyUnavailableError extends Error {
  override readonly name = "DependencyUnavailableError";
  constructor(
    readonly reasonCode: "OBJECT_STORE_UNAVAILABLE" | "MODEL_PROVIDER_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}

/** A stored artifact no longer matches the checksum PostgreSQL recorded for it. */
export class ExportIntegrityError extends Error {
  override readonly name = "ExportIntegrityError";
  constructor(readonly reasonCode: "EXPORT_CHECKSUM_MISMATCH" | "EXPORT_OBJECT_MISSING") {
    super(reasonCode);
  }
}

/** A signed download link that is malformed, expired or not issued by this service. */
export class InvalidDownloadLinkError extends Error {
  override readonly name = "InvalidDownloadLinkError";
}

function isObjectStoreUnavailable(error: unknown): boolean {
  return (error as { name?: unknown }).name === "ObjectStoreUnavailableError";
}

function isObjectIntegrityFailure(error: unknown): boolean {
  return (error as { name?: unknown }).name === "ObjectIntegrityError";
}

const downloadLinkTtlSeconds = 120;

export type GovernanceServiceOptions = {
  artifacts?: ExportArtifactStore;
  /** HMAC key for API-signed download links; without it links last one process. */
  downloadSigningKey?: string;
  now?: () => number;
};

export class GovernanceService {
  readonly #artifacts: ExportArtifactStore | undefined;
  readonly #signingKey: Buffer;
  readonly #now: () => number;

  constructor(
    private readonly port: GovernancePort,
    options: GovernanceServiceOptions = {},
  ) {
    this.#artifacts = options.artifacts;
    // Without a configured key, links are valid only for this process lifetime,
    // which is the safe failure for local and test use.
    this.#signingKey = options.downloadSigningKey
      ? Buffer.from(options.downloadSigningKey, "utf8")
      : randomBytes(32);
    this.#now = options.now ?? Date.now;
  }

  readMe(account: EligibleAccount) {
    return this.port.readMe(account);
  }
  listConsents(account: EligibleAccount) {
    return this.port.listConsents(account);
  }
  setConsent(account: EligibleAccount, request: ConsentRequest) {
    return this.port.setConsent(account, request);
  }
  readAccess(account: EligibleAccount, resourceType: "world" | "continuity", resourceId: string) {
    return this.port.readAccess(account, resourceType, resourceId);
  }
  listProductChanges() {
    return this.port.listProductChanges();
  }
  openAppeal(account: EligibleAccount, request: AppealRequest) {
    return this.port.openAppeal(account, request);
  }
  readAppeal(account: EligibleAccount, appealId: string) {
    return this.port.readAppeal(account, appealId);
  }
  createUsageQuote(account: EligibleAccount, request: UsageQuoteRequest) {
    return this.port.createUsageQuote(account, request);
  }
  reserveUsage(account: EligibleAccount, quoteId: string, request: UsageReservationRequest) {
    return this.port.reserveUsage(account, quoteId, request);
  }
  settleUsage(account: EligibleAccount, reservationId: string) {
    return this.port.settleUsage(account, reservationId);
  }
  releaseUsage(account: EligibleAccount, reservationId: string) {
    return this.port.releaseUsage(account, reservationId);
  }
  listUsageLedger(account: EligibleAccount) {
    return this.port.listUsageLedger(account);
  }
  async createExport(account: EligibleAccount, request: ExportRequest): Promise<ExportResponse> {
    const created = await this.port.createExport(account, request);
    if (created.status !== "PENDING") return created;
    // A retry of a delayed export is also a chance to store it now.
    await this.storeExport(created.exportId);
    return this.port.readExport(account, created.exportId);
  }

  readExport(account: EligibleAccount, exportId: string) {
    return this.port.readExport(account, exportId);
  }

  /**
   * Uploads one staged export. An unavailable store is recorded as a visible delay
   * and left for the worker; it never fails the request that created the export.
   */
  async storeExport(exportId: string): Promise<"STORED" | "DELAYED" | "REVOKED" | "NOTHING"> {
    const work = await this.port.claimStagedExport(exportId);
    if (!work || work.operation !== "STORE") return "NOTHING";
    if (!this.#artifacts) {
      await this.port.recordExportStorageDelay(exportId, "OBJECT_STORE_UNAVAILABLE");
      return "DELAYED";
    }
    return storeExportWork(this.port, this.#artifacts, work);
  }

  async readExportArtifact(account: EligibleAccount, exportId: string): Promise<Uint8Array> {
    const location = await this.port.readExportArtifactLocation(exportId, account.accountId);
    return this.#loadVerified(location);
  }

  async createExportDownloadLink(
    account: EligibleAccount,
    exportId: string,
  ): Promise<ExportDownloadLink> {
    const location = await this.port.readExportArtifactLocation(exportId, account.accountId);
    const expiresAtSeconds = Math.floor(this.#now() / 1000) + downloadLinkTtlSeconds;
    const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();
    // Always an API link, never a presigned object URL: each use re-checks
    // revocation and verifies the bytes against PostgreSQL's checksum.
    const signature = this.#sign(location.exportId, location.accountId, expiresAtSeconds);
    return {
      url: `/v1/export-downloads/${location.exportId}.${expiresAtSeconds}.${signature}`,
      expiresAt,
      method: "API_SIGNED",
    };
  }

  /** Serves an API-signed link. The link is the authority, so no session is needed. */
  async readSignedExport(token: string): Promise<{ exportId: string; bytes: Uint8Array }> {
    const match = /^([0-9a-f-]{36})\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
    if (!match) throw new InvalidDownloadLinkError("Download link is invalid");
    const [, exportId, expiresRaw, signature] = match as unknown as [
      string,
      string,
      string,
      string,
    ];
    const expiresAtSeconds = Number(expiresRaw);
    if (expiresAtSeconds * 1000 <= this.#now()) {
      throw new InvalidDownloadLinkError("Download link has expired");
    }
    let location: ExportArtifactLocation;
    try {
      location = await this.port.readExportArtifactLocation(exportId);
    } catch {
      // A revoked or deleted export must look the same as a forged link.
      throw new InvalidDownloadLinkError("Download link is invalid");
    }
    const expected = Buffer.from(this.#sign(exportId, location.accountId, expiresAtSeconds));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new InvalidDownloadLinkError("Download link is invalid");
    }
    return { exportId, bytes: await this.#loadVerified(location) };
  }

  #sign(exportId: string, accountId: string, expiresAtSeconds: number): string {
    return createHmac("sha256", this.#signingKey)
      .update(`simulora-export-download:v1:${exportId}:${accountId}:${expiresAtSeconds}`)
      .digest("base64url");
  }

  async #loadVerified(location: ExportArtifactLocation): Promise<Uint8Array> {
    let bytes = location.inlineBytes;
    if (!bytes) {
      if (!this.#artifacts) {
        throw new DependencyUnavailableError("OBJECT_STORE_UNAVAILABLE", "Storage is delayed");
      }
      try {
        bytes = await this.#artifacts.get(location.objectKey);
      } catch (error) {
        if (isObjectStoreUnavailable(error)) {
          throw new DependencyUnavailableError("OBJECT_STORE_UNAVAILABLE", "Storage is delayed");
        }
        throw error;
      }
    }
    // PostgreSQL recorded the checksum, so it decides whether these bytes are the export.
    if (!bytes) throw new ExportIntegrityError("EXPORT_OBJECT_MISSING");
    if (createHash("sha256").update(bytes).digest("hex") !== location.checksum) {
      throw new ExportIntegrityError("EXPORT_CHECKSUM_MISMATCH");
    }
    return bytes;
  }
  proposeDeletion(account: EligibleAccount, request: DeletionProposalRequest) {
    return this.port.proposeDeletion(account, request);
  }
  confirmDeletion(account: EligibleAccount, request: DeletionConfirmRequest) {
    return this.port.confirmDeletion(account, request);
  }
  readDeletion(account: EligibleAccount, proposalId: string) {
    return this.port.readDeletion(account, proposalId);
  }
}

type ExportStorageRecorder = Pick<GovernancePort, "markExportStored" | "recordExportStorageDelay">;

async function storeExportWork(
  port: ExportStorageRecorder,
  artifacts: ExportArtifactStore,
  work: Extract<ExportStorageWork, { operation: "STORE" }>,
): Promise<"STORED" | "DELAYED" | "REVOKED"> {
  try {
    await artifacts.put(
      { key: work.objectKey, checksum: work.checksum, contentType: "application/zip" },
      work.bytes,
    );
  } catch (error) {
    if (isObjectStoreUnavailable(error)) {
      await port.recordExportStorageDelay(work.exportId, "OBJECT_STORE_UNAVAILABLE");
      return "DELAYED";
    }
    if (isObjectIntegrityFailure(error)) {
      await port.recordExportStorageDelay(work.exportId, "OBJECT_INTEGRITY_FAILED");
      return "DELAYED";
    }
    throw error;
  }
  const finalized = await port.markExportStored(work.exportId);
  // Another uploader stored the same immutable object first; it is the artifact.
  if (finalized !== "REVOKED") return "STORED";
  // Revoked while the upload was in flight. The delete waits for this upload's
  // lease, so the worker removes the object even if this best-effort delete fails.
  await artifacts.delete(work.objectKey).catch(() => undefined);
  return "REVOKED";
}

export interface ExportStorageWorkPort extends ExportStorageRecorder {
  claimExportStorageWork(scope?: { worldId?: string }): Promise<ExportStorageWork | null>;
  listExportObjectKeys(): Promise<string[]>;
  markExportObjectDeleted(exportId: string): Promise<void>;
}

export type ExportStorageOutcome = {
  exportId: string;
  operation: ExportStorageWork["operation"];
  outcome: "STORED" | "DELAYED" | "REVOKED" | "DELETED";
};

/**
 * Drives staged uploads, legacy inline migration and revocation deletes to
 * completion. Every step is idempotent, so a crash at any point is retried safely.
 */
export class ExportStorageWorker {
  #inFlight: Promise<ExportStorageOutcome | null> | undefined;
  #nextReconciliationAt = 0;

  constructor(
    private readonly port: ExportStorageWorkPort,
    private readonly artifacts: ExportArtifactStore,
  ) {}

  /** Removes objects that arrived after their export row was tombstoned. */
  private async reconcileOrphanObjects(): Promise<void> {
    const actualKeys = await this.artifacts.list("exports/");
    const liveKeys = await this.port.listExportObjectKeys();
    const live = new Set(liveKeys);
    await Promise.all(
      actualKeys
        .filter((key) => key.endsWith(".zip") && !live.has(key))
        .map((key) => this.artifacts.delete(key)),
    );
  }

  private async reconcileWhenDue(): Promise<void> {
    if (Date.now() < this.#nextReconciliationAt) return;
    this.#nextReconciliationAt = Date.now() + 30_000;
    try {
      await this.reconcileOrphanObjects();
    } catch (error) {
      this.#nextReconciliationAt = 0;
      throw error;
    }
  }

  /** `scope` narrows the queue to one World; drills and tests use it for isolation. */
  async processNext(scope: { worldId?: string } = {}): Promise<ExportStorageOutcome | null> {
    if (this.#inFlight) return this.#inFlight;
    this.#inFlight = this.#processNext(scope).finally(() => {
      this.#inFlight = undefined;
    });
    return this.#inFlight;
  }

  async #processNext(scope: { worldId?: string }): Promise<ExportStorageOutcome | null> {
    await this.reconcileWhenDue();
    const work = await this.port.claimExportStorageWork(scope);
    if (!work) return null;
    if (work.operation === "STORE") {
      const outcome = await storeExportWork(this.port, this.artifacts, work);
      return { exportId: work.exportId, operation: work.operation, outcome };
    }
    try {
      await this.artifacts.delete(work.objectKey);
    } catch (error) {
      if (!isObjectStoreUnavailable(error)) throw error;
      await this.port.recordExportStorageDelay(work.exportId, "OBJECT_STORE_UNAVAILABLE");
      return { exportId: work.exportId, operation: work.operation, outcome: "DELAYED" };
    }
    await this.port.markExportObjectDeleted(work.exportId);
    return { exportId: work.exportId, operation: work.operation, outcome: "DELETED" };
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
  createCharacterAsset?(
    account: EligibleAccount,
    request: CreateCharacterAssetRequest,
  ): Promise<CharacterAssetResponse>;
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
  ): Promise<WorldDraftResponse>;
  createRevision(
    account: EligibleAccount,
    worldId: string,
    expectedDraftVersion: number,
  ): Promise<WorldRevisionSummary>;
  readWorldStudio?(account: EligibleAccount, worldId: string): Promise<WorldStudioResponse>;
  validateDraft?(account: EligibleAccount, worldId: string): Promise<WorldValidationResponse>;
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
  readRestoreProposal?(account: EligibleAccount, proposalId: string): Promise<RestoreProposal>;
  confirmRestore?(
    account: EligibleAccount,
    branchId: string,
    request: { proposalId: string; digest: string; expectedHeadCommitId: string },
  ): Promise<RestoreCommit>;
}

export class WorldContinuityService {
  constructor(private readonly port: WorldContinuityPort) {}

  createCharacterAsset(account: EligibleAccount, request: CreateCharacterAssetRequest) {
    if (!this.port.createCharacterAsset) throw new Error("Character Assets are not configured");
    return this.port.createCharacterAsset(account, request);
  }

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

  readWorldStudio(account: EligibleAccount, worldId: string) {
    if (!this.port.readWorldStudio) throw new Error("World Studio is not configured");
    return this.port.readWorldStudio(account, worldId);
  }

  validateDraft(account: EligibleAccount, worldId: string) {
    if (!this.port.validateDraft) throw new Error("World validation is not configured");
    return this.port.validateDraft(account, worldId);
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

  readRestoreProposal(account: EligibleAccount, proposalId: string) {
    if (!this.port.readRestoreProposal) throw new Error("Restore review is not configured");
    return this.port.readRestoreProposal(account, proposalId);
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
