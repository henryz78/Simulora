import { describe, expect, it } from "vitest";
import { DeterministicModelGateway, type WorldTurnRequest } from "./index.js";

const base: WorldTurnRequest = {
  actionId: "action-1",
  expectedHeadCommitId: "commit-1",
  intent: "Ask whether the western signal should be lit.",
  participation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
  character: {
    id: "character.iora",
    name: "Iora",
    role: "Harbor signaler",
    motives: ["Keep arriving vessels safe."],
    stance: "Refuses to light an unsafe signal.",
    currentState: "Watching the western shoals.",
    knownFacts: [{ id: "fact.signal", statement: "The signal is dim.", scope: "SHARED" }],
    relationships: [],
  },
  targetFact: { id: "fact.signal", statement: "The signal is dim.", scope: "SHARED" },
};

describe("IP-6 deterministic orchestration boundary", () => {
  it.each(["DIRECT", "GUIDED", "WORLD_ACTIVE"] as const)(
    "%s remains inside a user-triggered cycle without avatar takeover",
    async (initiativeMode) => {
      const draft = await new DeterministicModelGateway().generateWorldTurn({
        ...base,
        participation: { ...base.participation, initiativeMode },
      });
      expect(draft.narrative).toContain("Iora");
      expect(draft.responseSource).toEqual({
        type: "CHARACTER",
        characterId: "character.iora",
      });
      expect(draft.candidate).toHaveProperty("responseSource", draft.responseSource);
      expect(draft.narrative).not.toMatch(/you (say|promise|spend|agree)/i);
      expect(draft.candidate).not.toHaveProperty("participation");
      expect(draft.candidate).not.toHaveProperty("userAvatarAction");
      if (initiativeMode === "WORLD_ACTIVE") {
        expect(draft.narrative).toContain("user-triggered cycle");
      }
    },
  );

  it("does not fabricate an objective for Open-ended structure", async () => {
    const draft = await new DeterministicModelGateway().generateWorldTurn(base);
    expect(draft.narrative).not.toMatch(/objective|quest|win|complete/i);
  });
});
