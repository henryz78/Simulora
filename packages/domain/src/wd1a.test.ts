import { describe, expect, it } from "vitest";
import {
  addedFactBefore,
  applyValidatedActionCandidate,
  createInitialState,
  factIdForAction,
  lanternReachSeed,
  validateActionCandidate,
  worldDocumentSchema,
} from "./index.js";

describe("WD-1a ADD_FACT", () => {
  const world = worldDocumentSchema.parse({
    ...lanternReachSeed,
    facts: [
      ...lanternReachSeed.facts,
      {
        id: "fact.vessel-waiting",
        statement: "An unfamiliar vessel waits beyond the harbor markers.",
        scope: "SHARED",
        provenance: "WD-1a test seed",
        lifecycle: "ACTIVE",
      },
      {
        id: "fact.keeper-private",
        statement: "The keeper keeps a spare lens key under the stairs.",
        scope: "ACCOUNT_PRIVATE",
        provenance: "WD-1a test seed",
        lifecycle: "ACTIVE",
      },
    ],
  });
  const state = createInitialState(world, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  const actionId = "00000000-0000-4000-8000-000000000401";
  const head = "00000000-0000-4000-8000-000000000402";
  const context = ["fact.western-signal-dim", "fact.vessel-waiting"];
  const candidate = (operation: Record<string, unknown>) => ({
    schemaVersion: 1,
    actionId,
    expectedHeadCommitId: head,
    narrative: "You scan the markers. A second hull rides low behind the first.",
    responseSource: { type: "WORLD" },
    operation: {
      type: "ADD_FACT",
      statement: "A second, smaller hull rides low behind the waiting vessel.",
      causalFactIds: ["fact.vessel-waiting"],
      ...operation,
    },
  });
  const options = {
    actionId,
    expectedHeadCommitId: head,
    state,
    authorizedTargetFactIds: context,
    authorizedContextFactIds: context,
    responseSource: { type: "WORLD" } as const,
    userRoleName: world.userRole.name,
    requestedEffect: "FACT_REWRITE" as const,
    allowAddFact: true,
  };

  it("records one new SHARED fact at L2 and changes nothing else", () => {
    const validated = validateActionCandidate(candidate({}), options);
    expect(validated.impact).toBe("L2");
    expect(validated.displayEffect).toEqual({
      target: factIdForAction(actionId),
      before: addedFactBefore,
      after: "A second, smaller hull rides low behind the waiting vessel.",
      scope: "SHARED",
    });
    const next = applyValidatedActionCandidate(state, validated);
    expect(next.facts.slice(0, state.facts.length)).toEqual(state.facts);
    expect(next.facts.at(-1)).toEqual({
      id: factIdForAction(actionId),
      statement: "A second, smaller hull rides low behind the waiting vessel.",
      scope: "SHARED",
      provenance: `Confirmed Action ${actionId}`,
      lifecycle: "ACTIVE",
    });
    expect(next.worldClock.turn).toBe(state.worldClock.turn + 1);
  });

  it("is refused before the epoch, outside a fact change, or with unsafe text or causes", () => {
    expect(() =>
      validateActionCandidate(candidate({}), { ...options, allowAddFact: false }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(candidate({}), { ...options, requestedEffect: "THREAD_EFFECT" }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(candidate({ causalFactIds: ["fact.keeper-private"] }), options),
    ).toThrow(/outside the authorized context/);
    expect(() =>
      validateActionCandidate(
        candidate({ statement: "The keeper keeps a spare lens key under the stairs." }),
        options,
      ),
    ).toThrow();
    expect(() =>
      validateActionCandidate(
        candidate({ statement: `The ${world.userRole.name} agreed to pay the pilot.` }),
        options,
      ),
    ).toThrow();
    const taken = {
      ...state,
      facts: [
        ...state.facts,
        { ...state.facts[0]!, id: factIdForAction(actionId), statement: "Already here." },
      ],
    };
    expect(() => validateActionCandidate(candidate({}), { ...options, state: taken })).toThrow(
      /already exists/,
    );
  });

  it("lets a rewrite target any authorized shared fact, still at L3", () => {
    const rewrite = {
      type: "UPDATE_CANONICAL_FACT",
      targetFactId: "fact.vessel-waiting",
      beforeStatement: "An unfamiliar vessel waits beyond the harbor markers.",
      afterStatement: "The unfamiliar vessel has dropped anchor inside the markers.",
      scope: "SHARED",
      provenance: `Confirmed Action ${actionId}`,
    };
    const validated = validateActionCandidate({ ...candidate({}), operation: rewrite }, options);
    expect(validated.impact).toBe("L3");
    expect(() =>
      validateActionCandidate(
        { ...candidate({}), operation: rewrite },
        { ...options, authorizedTargetFactIds: ["fact.western-signal-dim"] },
      ),
    ).toThrow(/outside the authorized context/);
  });
});
