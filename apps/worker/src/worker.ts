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
};

export function createWorkerComposition(databaseUrl?: string): WorkerComposition {
  const actionRepository = databaseUrl
    ? new AuthoritativeWorldRepository(createDatabasePool(databaseUrl, { max: 4 }))
    : undefined;
  const modelGateway = new DeterministicModelGateway();
  return {
    jobs: new NoopJobRepository(),
    modelGateway,
    productSemanticsStarted: true,
    actionRepository,
    processNextAction: () =>
      actionRepository
        ? actionRepository.processNextAction((request) => modelGateway.generateWorldTurn(request))
        : Promise.resolve(null),
  };
}

export function correlationFor(envelope: WorkEnvelope): CorrelationContext {
  return envelope.correlation;
}
