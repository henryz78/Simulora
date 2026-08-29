import { z } from "zod";

export const serviceNameSchema = z.enum(["api", "worker", "web"]);

export const healthStatusSchema = z.object({
  service: serviceNameSchema,
  status: z.enum(["ok", "degraded"]),
  version: z.string().min(1),
});

export const foundationCapabilitySchema = z.object({
  name: z.string().min(1),
  status: z.enum(["configured", "not-configured", "not-started"]),
});

export const foundationResponseSchema = z.object({
  productImplementationPhase: z.literal("IP-1"),
  productSemanticsStarted: z.literal(false),
  capabilities: z.array(foundationCapabilitySchema),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type FoundationResponse = z.infer<typeof foundationResponseSchema>;
