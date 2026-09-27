import { describe, expect, it } from "vitest";
import {
  applyValidatedActionCandidate,
  createInitialState,
  lanternReachSeed,
  revealableFacts,
  revealedFactBefore,
  validateActionCandidate,
  worldDocumentSchema,
} from "./index.js";

describe("WD-1b secrets and STORY_DECIDES", () => {
  const ledger = "The ledger is sewn into the wool merchant's coat lining.";
  const world = worldDocumentSchema.parse({
    ...lanternReachSeed,
    facts: [
      ...lanternReachSeed.facts,
      {
        id: "fact.ledger",
        statement: ledger,
        scope: "CONTINUITY_PRIVATE",
        provenance: "WD-1b test seed",
        lifecycle: "ACTIVE",
      },
      {
        id: "fact.second-secret",
        statement: "A spare key hangs behind the kitchen door.",
        scope: "CONTINUITY_PRIVATE",
        provenance: "WD-1b test seed",
        lifecycle: "ACTIVE",
      },
    ],
    discoverableFacts: [
      { factId: "fact.ledger", howToFind: "Searching the merchant's coat." },
      { factId: "fact.second-secret", howToFind: "Looking behind the kitchen door." },
    ],
  });
  const state = createInitialState(world, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  const actionId = "00000000-0000-4000-8000-000000000501";
  const head = "00000000-0000-4000-8000-000000000502";
  const lead = "fact.western-signal-dim";
  const candidate = (operation: Record<string, unknown>, narrative = "You open the lining.") => ({
    schemaVersion: 1,
    actionId,
    expectedHeadCommitId: head,
    narrative,
    responseSource: { type: "WORLD" },
    operation,
  });
  const reveal = { type: "REVEAL_FACT", factId: "fact.ledger", causalFactIds: [lead] };
  const options = {
    actionId,
    expectedHeadCommitId: head,
    state,
    authorizedTargetFactIds: [lead],
    authorizedContextFactIds: [lead],
    responseSource: { type: "WORLD" } as const,
    userRoleName: world.userRole.name,
    requestedEffect: "STORY_DECIDES" as const,
    allowAddFact: true,
    revealableFactIds: revealableFacts(world, state, null).map((item) => item.factId),
  };

  it("accepts only distinct continuity-private secrets", () => {
    const withSecrets = (discoverableFacts: unknown) =>
      worldDocumentSchema.safeParse({ ...world, discoverableFacts }).success;
    expect(withSecrets([{ factId: "fact.ledger", howToFind: "Search the coat." }])).toBe(true);
    expect(withSecrets([{ factId: lead, howToFind: "Already shared." }])).toBe(false);
    expect(withSecrets([{ factId: "fact.missing", howToFind: "Nowhere." }])).toBe(false);
    expect(
      withSecrets([
        { factId: "fact.ledger", howToFind: "Once." },
        { factId: "fact.ledger", howToFind: "Twice." },
      ]),
    ).toBe(false);
  });

  it("lists every secret for the World and only known ones for a Character", () => {
    expect(revealableFacts(world, state, null).map((item) => item.factId)).toEqual([
      "fact.ledger",
      "fact.second-secret",
    ]);
    expect(revealableFacts(world, state, [lead, "fact.ledger"])).toEqual([
      { factId: "fact.ledger", statement: ledger, howToFind: "Searching the merchant's coat." },
    ]);
  });

  it("reveals a listed secret at L2 and makes it SHARED in place", () => {
    const validated = validateActionCandidate(
      candidate(reveal, `You open the lining. ${ledger}`),
      options,
    );
    expect(validated.impact).toBe("L2");
    expect(validated.displayEffect).toEqual({
      target: "fact.ledger",
      before: revealedFactBefore,
      after: ledger,
      scope: "SHARED",
    });
    const next = applyValidatedActionCandidate(state, validated);
    const index = state.facts.findIndex((fact) => fact.id === "fact.ledger");
    expect(next.facts[index]).toEqual({ ...state.facts[index]!, scope: "SHARED" });
    expect(next.facts.length).toBe(state.facts.length);
  });

  it("refuses a reveal outside the story, of an unlisted fact, or one that discloses another secret", () => {
    expect(() =>
      validateActionCandidate(candidate(reveal), { ...options, requestedEffect: "FACT_REWRITE" }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(candidate(reveal), { ...options, revealableFactIds: [] }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(
        candidate(reveal, "You open the lining. A spare key hangs behind the kitchen door."),
        options,
      ),
    ).toThrow();
  });

  it("lets the story respond or add a fact, never rewrite, and keeps secrets out of a response", () => {
    expect(
      validateActionCandidate(
        candidate({ type: "NO_WORLD_EFFECT", reason: "Nothing found.", causalFactIds: [lead] }),
        options,
      ).impact,
    ).toBe("L0");
    expect(
      validateActionCandidate(
        candidate({ type: "ADD_FACT", statement: "The coat is damp.", causalFactIds: [lead] }),
        options,
      ).impact,
    ).toBe("L2");
    expect(() =>
      validateActionCandidate(
        candidate({
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: lead,
          beforeStatement: state.facts[0]!.statement,
          afterStatement: "The western signal is bright.",
          scope: "SHARED",
          provenance: `Confirmed Action ${actionId}`,
        }),
        options,
      ),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(
        candidate(
          { type: "NO_WORLD_EFFECT", reason: "Nothing found.", causalFactIds: [lead] },
          `You search. ${ledger}`,
        ),
        options,
      ),
    ).toThrow();
  });
});
