import { randomUUID } from "node:crypto";
import {
  ExportStorageWorker,
  type ExportArtifactStore,
  type ExportStorageOutcome,
} from "@simulora/application";
import { NoopJobRepository, type JobRepository } from "@simulora/jobs";
import {
  DeterministicModelGateway,
  isMaterialProfileChange,
  profileDigest,
  type ModelGatewayPort,
} from "@simulora/model-gateway";
import { AuthoritativeWorldRepository, createDatabasePool } from "@simulora/database";
import type { ActionRecord, ModelProfileActivationRecord } from "@simulora/database";
import type { CorrelationContext, WorkEnvelope } from "@simulora/contracts";

export type WorkerComposition = {
  jobs: JobRepository;
  modelGateway: ModelGatewayPort;
  productSemanticsStarted: true;
  actionRepository: AuthoritativeWorldRepository | undefined;
  processNextAction(): Promise<ActionRecord | null>;
  processNextProjection(): Promise<
    Awaited<ReturnType<AuthoritativeWorldRepository["processNextProjection"]>>
  >;
  processNextExportStorage(): Promise<ExportStorageOutcome | null>;
  /** Records the routed profile; a material change publishes its notice first. */
  recordModelProfile(): Promise<ModelProfileActivationRecord | null>;
};

export type WorkerCompositionOptions = {
  objectStorage?: ExportArtifactStore;
  modelGateway?: ModelGatewayPort;
};

export function createWorkerComposition(
  databaseUrl?: string,
  options: WorkerCompositionOptions = {},
): WorkerComposition {
  const workerId = `worker-${randomUUID()}`;
  const actionRepository = databaseUrl
    ? new AuthoritativeWorldRepository(createDatabasePool(databaseUrl, { max: 4 }))
    : undefined;
  const modelGateway = options.modelGateway ?? new DeterministicModelGateway();
  let activation: Promise<ModelProfileActivationRecord> | undefined;
  const routing = {
    id: modelGateway.profile.id,
    version: modelGateway.profile.version,
    adapter: modelGateway.profile.adapter,
  };
  const exportStorage =
    actionRepository && options.objectStorage
      ? new ExportStorageWorker(actionRepository, options.objectStorage)
      : undefined;
  const composition: WorkerComposition = {
    jobs: new NoopJobRepository(),
    modelGateway,
    productSemanticsStarted: true,
    actionRepository,
    processNextAction: async () => {
      if (!actionRepository) return null;
      // No Action is generated under a profile whose activation, and therefore
      // whose material-change notice, has not been durably recorded.
      await recordModelProfile();
      return actionRepository.processNextAction(
        (request) => modelGateway.generateWorldTurn(request),
        workerId,
        { profile: routing },
      );
    },
    processNextProjection: () =>
      actionRepository ? actionRepository.processNextProjection() : Promise.resolve(null),
    processNextExportStorage: () =>
      exportStorage ? exportStorage.processNext() : Promise.resolve(null),
    recordModelProfile,
  };

  async function recordModelProfile(): Promise<ModelProfileActivationRecord | null> {
    if (!actionRepository) return null;
    activation ??= recordActivation(actionRepository).catch((error: unknown) => {
      activation = undefined;
      throw error;
    });
    return activation;
  }

  async function recordActivation(
    repository: AuthoritativeWorldRepository,
  ): Promise<ModelProfileActivationRecord> {
    const status = await modelGateway.status();
    const profile = modelGateway.profile;
    return repository.recordModelProfileActivation({
      profileId: profile.id,
      profileVersion: profile.version,
      adapter: profile.adapter,
      model: profile.model,
      promptVersion: profile.promptVersion,
      profileDigest: profileDigest(profile),
      fallbackProfile: status.fallback ? `${status.fallback.id}@${status.fallback.version}` : null,
      isMaterialChange: (previous) =>
        isMaterialProfileChange(
          previous
            ? {
                ...profile,
                id: previous.id,
                adapter: previous.adapter,
                model: previous.model,
                promptVersion: previous.promptVersion,
              }
            : null,
          profile,
        ),
    });
  }

  return composition;
}

export function correlationFor(envelope: WorkEnvelope): CorrelationContext {
  return envelope.correlation;
}
