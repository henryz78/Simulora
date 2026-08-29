import { context, trace } from "@opentelemetry/api";

const sensitiveKeys = /authorization|cookie|content|prompt|secret|token|password/i;

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Readonly<Record<string, unknown>>;

export function redactFields(fields: LogFields): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      sensitiveKeys.test(key) ? "[redacted]" : value,
    ]),
  );
}

export function createLogger(service: string, minimumLevel: LogLevel = "info") {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const threshold = levels.indexOf(minimumLevel);

  function write(level: LogLevel, message: string, fields: LogFields = {}): void {
    if (levels.indexOf(level) < threshold) return;
    const span = trace.getSpan(context.active());
    const traceId = span?.spanContext().traceId;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...(traceId ? { trace_id: traceId } : {}),
      ...redactFields(fields),
    };
    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
  }

  return {
    debug: (message: string, fields?: LogFields) => write("debug", message, fields),
    info: (message: string, fields?: LogFields) => write("info", message, fields),
    warn: (message: string, fields?: LogFields) => write("warn", message, fields),
    error: (message: string, fields?: LogFields) => write("error", message, fields),
  };
}
