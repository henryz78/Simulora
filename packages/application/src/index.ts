import type { FoundationResponse } from "@simulora/contracts";

export type DependencyHealth = {
  name: "database" | "object-storage" | "model-gateway" | "auth";
  configured: boolean;
};

export function describeFoundation(dependencies: readonly DependencyHealth[]): FoundationResponse {
  return {
    productImplementationPhase: "IP-1",
    productSemanticsStarted: false,
    capabilities: dependencies.map((dependency) => ({
      name: dependency.name,
      status: dependency.configured ? "configured" : "not-configured",
    })),
  };
}
