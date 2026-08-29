export type JobStatus = "available" | "leased" | "succeeded" | "failed" | "dead-letter";

export type DurableJob = {
  id: string;
  type: string;
  dedupeKey: string;
  status: JobStatus;
};

export type OutboxRecord = {
  id: string;
  topic: string;
  dedupeKey: string;
  published: boolean;
};

export interface JobRepository {
  claimNext(workerId: string): Promise<DurableJob | null>;
}

export class NoopJobRepository implements JobRepository {
  claimNext(_workerId: string): Promise<DurableJob | null> {
    return Promise.resolve(null);
  }
}
