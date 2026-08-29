import { z } from "zod";

const environmentSchema = z.enum(["local", "test", "preview", "staging", "production"]);

const serverConfigSchema = z.object({
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
  SIMULORA_AUTH_ADAPTER: z.literal("development").default("development"),
  SIMULORA_MODEL_ADAPTER: z.literal("deterministic").default("deterministic"),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function loadServerConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  return serverConfigSchema.parse(environment);
}

export function redactConfig(config: ServerConfig): Record<string, unknown> {
  return {
    ...config,
    SIMULORA_DATABASE_URL: config.SIMULORA_DATABASE_URL ? "[configured]" : undefined,
    SIMULORA_OBJECT_ACCESS_KEY: config.SIMULORA_OBJECT_ACCESS_KEY ? "[redacted]" : undefined,
    SIMULORA_OBJECT_SECRET_KEY: config.SIMULORA_OBJECT_SECRET_KEY ? "[redacted]" : undefined,
  };
}
