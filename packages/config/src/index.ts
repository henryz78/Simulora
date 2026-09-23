import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { z } from "zod";

const environmentSchema = z.enum(["local", "test", "preview", "staging", "production"]);

const serverConfigSchema = z
  .object({
    SIMULORA_ENV: environmentSchema.default("local"),
    SIMULORA_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SIMULORA_API_HOST: z.string().min(1).default("127.0.0.1"),
    SIMULORA_API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    SIMULORA_WORKER_POLL_MS: z.coerce.number().int().min(100).max(60000).default(1000),
    SIMULORA_DATABASE_URL: z.string().url().optional(),
    SIMULORA_OBJECT_ENDPOINT: z.string().url().optional(),
    SIMULORA_OBJECT_REGION: z.string().min(1).default("local"),
    SIMULORA_OBJECT_BUCKET: z.string().min(1).default("simulora-local"),
    SIMULORA_OBJECT_ACCESS_KEY: z.string().min(1).optional(),
    SIMULORA_OBJECT_SECRET_KEY: z.string().min(1).optional(),
    // Without an endpoint, local development keeps objects on disk and tests keep
    // them in memory. Shared environments must name an S3-compatible endpoint.
    SIMULORA_OBJECT_ADAPTER: z.enum(["s3", "filesystem", "memory"]).optional(),
    SIMULORA_OBJECT_DIR: z.string().min(1).default(".local-data/objects"),
    SIMULORA_DOWNLOAD_SIGNING_KEY: z.string().min(32).optional(),
    SIMULORA_AUTH_ADAPTER: z.literal("development").default("development"),
    SIMULORA_MODEL_ADAPTER: z.literal("deterministic").default("deterministic"),
  })
  .superRefine((config, context) => {
    if (["preview", "staging", "production"].includes(config.SIMULORA_ENV)) {
      context.addIssue({
        code: "custom",
        message:
          "IP-1 has no approved non-development auth or live model adapter; shared and production environments must fail closed",
        path: ["SIMULORA_ENV"],
      });
    }
  });

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export type LocalEnvironmentOptions = {
  environment?: NodeJS.ProcessEnv;
  startDirectory?: string;
};

export function loadLocalEnvironment(options: LocalEnvironmentOptions = {}): string | null {
  const environment = options.environment ?? process.env;
  if (environment.SIMULORA_ENV && environment.SIMULORA_ENV !== "local") return null;

  let directory = path.resolve(options.startDirectory ?? process.cwd());
  while (true) {
    const workspaceMarker = path.join(directory, "pnpm-workspace.yaml");
    const candidate = path.join(directory, ".env.local");
    if (existsSync(workspaceMarker) && existsSync(candidate)) {
      const parsed = parseEnv(readFileSync(candidate, "utf8"));
      for (const [key, value] of Object.entries(parsed)) {
        if (environment[key] === undefined) environment[key] = value;
      }
      return candidate;
    }

    if (existsSync(workspaceMarker)) return null;

    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

export function loadServerConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const config = serverConfigSchema.parse(environment);
  // A production-shaped runtime must never silently fall back to the local
  // development identity/model adapters when SIMULORA_ENV is omitted.
  if (environment.NODE_ENV === "production" && config.SIMULORA_ENV === "local") {
    throw new Error("SIMULORA_ENV must be explicitly set for production-shaped runtimes");
  }
  return config;
}

export type ObjectStorageSelection =
  | {
      adapter: "s3";
      endpoint: string | undefined;
      region: string;
      bucket: string;
      accessKeyId: string | undefined;
      secretAccessKey: string | undefined;
    }
  | { adapter: "filesystem"; directory: string }
  | { adapter: "memory" };

/** Chooses the object store for a runtime without silently degrading a shared one. */
export function selectObjectStorage(config: ServerConfig): ObjectStorageSelection {
  const adapter =
    config.SIMULORA_OBJECT_ADAPTER ??
    (config.SIMULORA_OBJECT_ENDPOINT
      ? "s3"
      : config.SIMULORA_ENV === "test"
        ? "memory"
        : "filesystem");
  if (adapter !== "s3" && !["local", "test"].includes(config.SIMULORA_ENV)) {
    throw new Error("Shared environments require S3-compatible object storage");
  }
  if (adapter === "s3") {
    return {
      adapter,
      endpoint: config.SIMULORA_OBJECT_ENDPOINT,
      region: config.SIMULORA_OBJECT_REGION,
      bucket: config.SIMULORA_OBJECT_BUCKET,
      accessKeyId: config.SIMULORA_OBJECT_ACCESS_KEY,
      secretAccessKey: config.SIMULORA_OBJECT_SECRET_KEY,
    };
  }
  return adapter === "filesystem"
    ? { adapter, directory: path.resolve(config.SIMULORA_OBJECT_DIR) }
    : { adapter };
}

export function redactConfig(config: ServerConfig): Record<string, unknown> {
  return {
    ...config,
    SIMULORA_DATABASE_URL: config.SIMULORA_DATABASE_URL ? "[configured]" : undefined,
    SIMULORA_OBJECT_ACCESS_KEY: config.SIMULORA_OBJECT_ACCESS_KEY ? "[redacted]" : undefined,
    SIMULORA_OBJECT_SECRET_KEY: config.SIMULORA_OBJECT_SECRET_KEY ? "[redacted]" : undefined,
    SIMULORA_DOWNLOAD_SIGNING_KEY: config.SIMULORA_DOWNLOAD_SIGNING_KEY ? "[redacted]" : undefined,
  };
}
