export const implementationPhase = "IP-1" as const;

export type Clock = {
  now(): Date;
};

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
