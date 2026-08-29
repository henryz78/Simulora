export class FakeClock {
  #now: Date;

  constructor(start = new Date("2026-01-01T00:00:00.000Z")) {
    this.#now = new Date(start);
  }

  now(): Date {
    return new Date(this.#now);
  }

  advance(milliseconds: number): void {
    this.#now = new Date(this.#now.getTime() + milliseconds);
  }
}

export type FakeModelResult = {
  task: string;
  structured: boolean;
};

export class FakeModelProvider {
  run(task: string): Promise<FakeModelResult> {
    return Promise.resolve({ task, structured: true });
  }
}
