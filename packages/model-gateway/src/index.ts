export type ModelGatewayStatus = {
  adapter: "deterministic";
  liveProviderConfigured: false;
};

export type WorldTurnRequest = {
  actionId: string;
  expectedHeadCommitId: string;
  intent: string;
  targetFact: {
    id: string;
    statement: string;
    scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
  };
};

export type WorldTurnDraft = {
  narrative: string;
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
    const narrative = `Iora studies the consequence of your action: ${intent}`;
    return Promise.resolve({
      narrative,
      candidate: {
        schemaVersion: 1,
        actionId: request.actionId,
        expectedHeadCommitId: request.expectedHeadCommitId,
        narrative,
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
