// Every request to the model passes through one gate: a few at a time, a ceiling per minute, a pause when the
// provider says "too many", and a count of the day's requests against the provider's daily allowance.
// A player's request goes before the server's own background work, unless that work has waited long.
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Who a model request is for and what to do while it waits: work started by a player, or the server's own in the
 * background; `tell.queued` hears how many wait ahead (-1 once through), shared by everything a turn starts;
 * `signal` gives up the wait, for work the turn can go on without.
 */
export const lane = new AsyncLocalStorage<{
  background?: boolean;
  tell?: { queued?: (ahead: number) => void };
  signal?: AbortSignal;
}>();

/** A request the gate turned away; never retried, since trying again only asks again. */
export class GateError extends Error {
  status = 429;
}

interface Waiter {
  background: boolean;
  since: number;
  go: () => void;
}

export class Gate {
  #slots: number;
  #perMinute: number;
  #pauseFor: number;
  #dayLimit: number;
  #remember: { read: (day: string) => number; write: (day: string, count: number) => void } | undefined;
  #now: () => number;
  #busy = 0;
  #queue: Waiter[] = [];
  #started: number[] = [];
  #pausedUntil = 0;
  #day = "";
  #today = 0;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor({
    slots = 3,
    perMinute = 20,
    // How long everyone waits after the provider says "too many".
    pauseFor = 30_000,
    // The provider's daily allowance, in requests; past it, nothing more is asked until tomorrow.
    dayLimit = Infinity,
    // Where the day's count is kept, so a restart does not forget what was already asked.
    remember = undefined as { read: (day: string) => number; write: (day: string, count: number) => void } | undefined,
    now = Date.now,
  } = {}) {
    this.#slots = slots;
    this.#perMinute = perMinute;
    this.#pauseFor = pauseFor;
    this.#dayLimit = dayLimit;
    this.#remember = remember;
    this.#now = now;
  }

  /** Requests made today (Beijing time, as the provider counts). */
  today() {
    const day = new Date(this.#now() + 8 * 3600_000).toISOString().slice(0, 10);
    if (day !== this.#day) [this.#day, this.#today] = [day, this.#remember?.read(day) ?? 0];
    return this.#today;
  }

  /** The day's allowance, in requests (Infinity when there is none). */
  get limit() {
    return this.#dayLimit;
  }

  /** Whether new work should start: a margin is kept for work already under way. */
  open = (share = 0.85) => this.today() < this.#dayLimit * share;

  /** After a "too many requests": nobody asks for a while. */
  pause(ms = this.#pauseFor) {
    this.#pausedUntil = Math.max(this.#pausedUntil, this.#now() + ms);
    this.#next();
  }

  /** Waits for a turn; resolves with the function that gives the slot back. */
  async enter(): Promise<() => void> {
    if (this.today() >= this.#dayLimit) throw new GateError("The site's AI allowance for today is used up; try again tomorrow");
    const { background = false, tell, signal } = lane.getStore() ?? {};
    if (signal?.aborted) throw new GateError("Given up waiting");
    let waited = false;
    await new Promise<void>((go, stop) => {
      const quit = () => {
        const at = this.#queue.indexOf(me);
        if (at < 0) return;
        this.#queue.splice(at, 1);
        stop(new GateError("Given up waiting"));
      };
      const me: Waiter = {
        background,
        since: this.#now(),
        go: () => {
          signal?.removeEventListener("abort", quit);
          go();
        },
      };
      signal?.addEventListener("abort", quit, { once: true });
      this.#queue.push(me);
      this.#next();
      if (this.#queue.includes(me)) {
        waited = true;
        tell?.queued?.(this.#order().indexOf(me));
      }
    });
    if (waited) tell?.queued?.(-1);
    let left = false;
    return () => {
      if (left) return;
      left = true;
      this.#busy--;
      this.#next();
    };
  }

  /** Players first, oldest first; background work that has waited a minute and a half counts as a player's. */
  #order() {
    const rank = (w: Waiter) => (w.background && this.#now() - w.since < 90_000 ? 1 : 0);
    return [...this.#queue].sort((a, b) => rank(a) - rank(b) || a.since - b.since);
  }

  #next() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const now = this.#now();
    this.#started = this.#started.filter((t) => now - t < 60_000);
    while (this.#queue.length > 0 && this.#busy < this.#slots) {
      const wait = Math.max(
        this.#pausedUntil - now,
        this.#started.length >= this.#perMinute ? this.#started[0]! + 60_000 - now : 0,
      );
      if (wait > 0) {
        this.#timer = setTimeout(() => this.#next(), wait).unref();
        return;
      }
      // The slot is taken here, as the waiter is let through: it runs on later, after this loop.
      const first = this.#order()[0]!;
      this.#queue.splice(this.#queue.indexOf(first), 1);
      this.#busy++;
      this.#started.push(now);
      this.today();
      this.#today++;
      this.#remember?.write(this.#day, this.#today);
      first.go();
    }
    // Background work that waits may become a player's in rank: look again then.
    if (this.#queue.length > 0 && !this.#timer) this.#timer = setTimeout(() => this.#next(), 15_000).unref();
  }
}
