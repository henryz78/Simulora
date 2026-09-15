export type ModelGatewayStatus = {
  adapter: "deterministic";
  liveProviderConfigured: false;
};

export type WorldTurnRequest = {
  actionId: string;
  expectedHeadCommitId: string;
  intent: string;
  context?: Readonly<Record<string, unknown>>;
  participation: {
    initiativeMode: "DIRECT" | "GUIDED" | "WORLD_ACTIVE";
    structureMode: "OPEN_ENDED" | "GOAL_FRAMED";
  };
  character?: {
    id: string;
    name: string;
    role: string;
    motives: string[];
    stance: string;
    currentState: string;
    knownFacts: Array<{
      id: string;
      statement: string;
      scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
    }>;
    relationships: Array<{
      id: string;
      fromCharacterId: string;
      toCharacterId: string;
      description: string;
    }>;
  } | null;
  targetFact: {
    id: string;
    statement: string;
    scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
  };
};

export type WorldTurnDraft = {
  narrative: string;
  responseSource: { type: "WORLD" } | { type: "CHARACTER"; characterId: string };
  candidate: unknown;
};

export interface ModelGatewayPort {
  status(): Promise<ModelGatewayStatus>;
  generateWorldTurn(request: WorldTurnRequest): Promise<WorldTurnDraft>;
}

export class DeterministicModelGateway implements ModelGatewayPort {
  status(): Promise<ModelGatewayStatus> {
    return Promise.resolve({ adapter: "deterministic", liveProviderConfigured: false });
  }

  generateWorldTurn(request: WorldTurnRequest): Promise<WorldTurnDraft> {
    const intent = request.intent.trim();
    const actor = request.character ?? null;
    const responseSource = actor
      ? ({ type: "CHARACTER", characterId: actor.id } as const)
      : ({ type: "WORLD" } as const);
    const narrative = actor
      ? request.participation.initiativeMode === "DIRECT"
        ? `${actor.name} responds only to your stated action from this stance: ${actor.stance}`
        : request.participation.initiativeMode === "GUIDED"
          ? `${actor.name} considers your action and answers from a distinct motive: ${actor.motives[0]}`
          : `${actor.name} advances one bounded response during this user-triggered cycle: ${actor.motives[0]}`
      : `The world responds to your stated action: ${intent}`;
    return Promise.resolve({
      narrative,
      responseSource,
      candidate: {
        schemaVersion: 1,
        actionId: request.actionId,
        expectedHeadCommitId: request.expectedHeadCommitId,
        narrative,
        responseSource,
        operation: {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: request.targetFact.id,
          beforeStatement: request.targetFact.statement,
          afterStatement: `The observatory now bears the consequence of: ${intent}`,
          scope: request.targetFact.scope,
          provenance: `Confirmed Action ${request.actionId}`,
        },
      },
    });
  }
}
