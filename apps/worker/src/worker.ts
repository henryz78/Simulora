import { NoopJobRepository, type JobRepository } from "@simulora/jobs";
import { DeterministicModelGateway, type ModelGatewayPort } from "@simulora/model-gateway";
import type { CorrelationContext, WorkEnvelope } from "@simulora/contracts";

export type WorkerComposition = {
  jobs: JobRepository;
  modelGateway: ModelGatewayPort;
  productSemanticsStarted: false;
};

export function createWorkerComposition(): WorkerComposition {
  return {
    jobs: new NoopJobRepository(),
    modelGateway: new DeterministicModelGateway(),
    productSemanticsStarted: false,
  };
}

export function correlationFor(envelope: WorkEnvelope): CorrelationContext {
  return envelope.correlation;
}
