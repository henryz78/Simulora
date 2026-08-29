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

export class FaultInjector {
  readonly #armed = new Set<string>();

  arm(point: string): void {
    this.#armed.add(point);
  }

  consume(point: string): void {
    if (!this.#armed.delete(point)) return;
    throw new Error(`Injected failure at ${point}`);
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
