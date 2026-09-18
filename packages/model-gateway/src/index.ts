export type ModelGatewayStatus = {
  adapter: "deterministic";
  liveProviderConfigured: false;
};

export type WorldTurnRequest = {
  actionId: string;
  expectedHeadCommitId: string;
  intent: string;
  requestedEffect?: "FACT_REWRITE" | "ROUTINE_EFFECT" | "NO_WORLD_EFFECT";
  routineRoutes?: Array<{ fromLocationId: string; toLocationId: string; label: string }>;
  context?: Readonly<Record<string, unknown>>;
  priorDialogue?: ReadonlyArray<{
    id: string;
    narrative: string;
    responseSource: { type: "WORLD" } | { type: "CHARACTER"; characterId: string };
    sourceHeadCommitId: string;
    sourceStateRevisionId: string;
    provenance: string;
    visibilityScope: "CONTINUITY_PRIVATE";
    recordedAt: string;
  }>;
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
    locationId?: string;
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
    const requestedEffect = request.requestedEffect ?? "FACT_REWRITE";
    const route = request.routineRoutes?.find(
      (item) =>
        actor && item.fromLocationId === actor.locationId && item.toLocationId !== actor.locationId,
    );
    if (requestedEffect === "NO_WORLD_EFFECT") {
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
            type: "NO_WORLD_EFFECT",
            reason: "No canonical change is warranted for this response.",
            causalFactIds: [request.targetFact.id],
          },
        },
      });
    }
    if (requestedEffect === "ROUTINE_EFFECT" && actor && route) {
      return Promise.resolve({
        narrative: `${actor.name} moves along the familiar route toward ${route.label}.`,
        responseSource,
        candidate: {
          schemaVersion: 1,
          actionId: request.actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          narrative: `${actor.name} moves along the familiar route toward ${route.label}.`,
          responseSource,
          operation: {
            type: "MOVE_CHARACTER",
            characterId: actor.id,
            beforeLocationId: route.fromLocationId,
            afterLocationId: route.toLocationId,
            causalFactIds: [request.targetFact.id],
          },
        },
      });
    }
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
