import { lanternReachSeed, worldDocumentSchema, type WorldDocument } from "@simulora/domain";

/**
 * MGC-1 fixture: an original synthetic World that declares relationship bounds,
 * one story thread and one causal constraint. Tavi has an administrative
 * routine policy whose only route starts at the harbor, so a movement request
 * from the observatory cannot happen and fails against the flood constraint.
 */
export const mgcClosureWorld: WorldDocument = worldDocumentSchema.parse({
  ...lanternReachSeed,
  title: "Lantern Reach — closure fixture",
  locations: [
    ...lanternReachSeed.locations,
    { id: "location.harbor", name: "Harbor", description: "A sheltered fogbound harbor." },
  ],
  characters: [
    ...lanternReachSeed.characters,
    {
      id: "character.tavi",
      name: "Tavi",
      role: "Lamp runner who carries messages to the harbor.",
      locationId: "location.tidal-observatory",
      motives: ["Get word to the harbor before the tide turns."],
      stance: "Tavi trusts the way Iora reads the markers.",
      knowledgeFactIds: ["fact.western-signal-dim"],
    },
  ],
  relationships: [
    {
      id: "relationship.iora-tavi",
      fromCharacterId: "character.iora",
      toCharacterId: "character.tavi",
      description: "Iora is training Tavi to read the markers.",
      protection: "ROUTINE",
      scale: ["wary", "cordial", "trusting"],
      initialState: "wary",
    },
    {
      id: "relationship.iora-oath",
      fromCharacterId: "character.iora",
      toCharacterId: "character.tavi",
      description: "Whether Iora has sworn to stand for Tavi.",
      protection: "PROTECTED",
      scale: ["unsworn", "sworn"],
      initialState: "unsworn",
    },
  ],
  threads: [{ id: "thread.vessel", title: "Why the unfamiliar vessel waits" }],
  constraints: [
    {
      id: "constraint.flood",
      statement: "The causeway floods at high tide; no one crosses it then.",
    },
  ],
});

/** Administrative routine policy for the closure fixture's pinned Revision. */
export const mgcClosureRoutinePolicy = {
  version: "re3-routine-v1",
  npcIds: ["character.tavi"],
  publicLocationIds: ["location.tidal-observatory", "location.harbor"],
  routes: [
    {
      fromLocationId: "location.harbor",
      toLocationId: "location.tidal-observatory",
      label: "the observatory steps",
    },
  ],
} as const;
