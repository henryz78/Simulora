import { randomUUID } from "node:crypto";
import {
  ExportStorageWorker,
  type ExportArtifactStore,
  type ExportStorageOutcome,
} from "@simulora/application";
import { NoopJobRepository, type JobRepository } from "@simulora/jobs";
import { DeterministicModelGateway, type ModelGatewayPort } from "@simulora/model-gateway";
import { AuthoritativeWorldRepository, createDatabasePool } from "@simulora/database";
import type { ActionRecord } from "@simulora/database";
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
};

export type WorkerCompositionOptions = {
  objectStorage?: ExportArtifactStore;
};

export function createWorkerComposition(
  databaseUrl?: string,
  options: WorkerCompositionOptions = {},
): WorkerComposition {
  const workerId = `worker-${randomUUID()}`;
  const actionRepository = databaseUrl
    ? new AuthoritativeWorldRepository(createDatabasePool(databaseUrl, { max: 4 }))
    : undefined;
  const modelGateway = new DeterministicModelGateway();
  const exportStorage =
    actionRepository && options.objectStorage
      ? new ExportStorageWorker(actionRepository, options.objectStorage)
      : undefined;
  return {
    jobs: new NoopJobRepository(),
    modelGateway,
    productSemanticsStarted: true,
    actionRepository,
    processNextAction: () =>
      actionRepository
        ? actionRepository.processNextAction(
            (request) => modelGateway.generateWorldTurn(request),
            workerId,
          )
        : Promise.resolve(null),
    processNextProjection: () =>
      actionRepository ? actionRepository.processNextProjection() : Promise.resolve(null),
    processNextExportStorage: () =>
      exportStorage ? exportStorage.processNext() : Promise.resolve(null),
  };
}

export function correlationFor(envelope: WorkEnvelope): CorrelationContext {
  return envelope.correlation;
}
