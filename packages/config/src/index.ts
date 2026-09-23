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
    SIMULORA_MODEL_ADAPTER: z.enum(["deterministic", "openai-compatible"]).default("deterministic"),
    // A live profile is one reviewable unit: endpoint, model, prompt and limits.
    SIMULORA_MODEL_ENDPOINT: z.string().url().optional(),
    SIMULORA_MODEL_NAME: z.string().min(1).optional(),
    SIMULORA_MODEL_API_KEY: z.string().min(1).optional(),
    SIMULORA_MODEL_PROFILE_ID: z
      .string()
      .regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
      .default("live-primary"),
    SIMULORA_MODEL_PROFILE_VERSION: z
      .string()
      .regex(/^[A-Za-z0-9._-]{1,32}$/)
      .default("1"),
    SIMULORA_MODEL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
    SIMULORA_MODEL_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(256).max(16384).default(2048),
    SIMULORA_MODEL_FALLBACK: z.enum(["none", "deterministic"]).default("none"),
    SIMULORA_MODEL_RETENTION_APPROVAL_REF: z.string().min(1).optional(),
  })
  .superRefine((config, context) => {
    if (
      config.SIMULORA_MODEL_ADAPTER === "openai-compatible" &&
      !(
        config.SIMULORA_MODEL_ENDPOINT &&
        config.SIMULORA_MODEL_NAME &&
        config.SIMULORA_MODEL_API_KEY
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "A live model profile needs an endpoint, a model name and a key",
        path: ["SIMULORA_MODEL_ADAPTER"],
      });
    }
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

export type ModelRoutingSelection =
  | { adapter: "deterministic" }
  | {
      adapter: "openai-compatible";
      endpoint: string;
      model: string;
      apiKey: string;
      profileId: string;
      profileVersion: string;
      timeoutMs: number;
      maxOutputTokens: number;
      fallback: "none" | "deterministic";
      retentionApprovalRef: string | null;
    };

/**
 * Chooses how Actions are generated. A live provider needs a recorded approval of
 * its retention and training terms before it may run anywhere shared; without
 * one it is confined to local and test, where only synthetic data exists.
 */
export function selectModelRouting(config: ServerConfig): ModelRoutingSelection {
  if (config.SIMULORA_MODEL_ADAPTER === "deterministic") return { adapter: "deterministic" };
  const retentionApprovalRef = config.SIMULORA_MODEL_RETENTION_APPROVAL_REF ?? null;
  if (!retentionApprovalRef && !["local", "test"].includes(config.SIMULORA_ENV)) {
    throw new Error(
      "A live model profile without a recorded retention/training approval may run only in local and test",
    );
  }
  return {
    adapter: "openai-compatible",
    endpoint: config.SIMULORA_MODEL_ENDPOINT!,
    model: config.SIMULORA_MODEL_NAME!,
    apiKey: config.SIMULORA_MODEL_API_KEY!,
    profileId: config.SIMULORA_MODEL_PROFILE_ID,
    profileVersion: config.SIMULORA_MODEL_PROFILE_VERSION,
    timeoutMs: config.SIMULORA_MODEL_TIMEOUT_MS,
    maxOutputTokens: config.SIMULORA_MODEL_MAX_OUTPUT_TOKENS,
    fallback: config.SIMULORA_MODEL_FALLBACK,
    retentionApprovalRef,
  };
}

export function redactConfig(config: ServerConfig): Record<string, unknown> {
  return {
    ...config,
    SIMULORA_DATABASE_URL: config.SIMULORA_DATABASE_URL ? "[configured]" : undefined,
    SIMULORA_OBJECT_ACCESS_KEY: config.SIMULORA_OBJECT_ACCESS_KEY ? "[redacted]" : undefined,
    SIMULORA_OBJECT_SECRET_KEY: config.SIMULORA_OBJECT_SECRET_KEY ? "[redacted]" : undefined,
    SIMULORA_DOWNLOAD_SIGNING_KEY: config.SIMULORA_DOWNLOAD_SIGNING_KEY ? "[redacted]" : undefined,
    SIMULORA_MODEL_API_KEY: config.SIMULORA_MODEL_API_KEY ? "[redacted]" : undefined,
  };
}
