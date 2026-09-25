import { worldDocumentSchema, type WorldDocument } from "@simulora/domain";

/**
 * LONG-01 fixture (Validation Strategy §5.1): an original synthetic World used
 * only as an evaluation asset. Five Characters with non-overlapping private
 * knowledge, three locations, twenty scoped facts, relationship scales that
 * allow five routine changes, three open threads and one causal constraint.
 * It is not launch content and not the maximum supported World size.
 */
const characters = [
  [
    "mara",
    "Mara",
    "Tide-table keeper at the saltworks.",
    "location.saltworks",
    "Keep the crossing times honest.",
    "Mara will not post a crossing time she has not measured.",
  ],
  [
    "oren",
    "Oren",
    "Ferryman who works the evening crossing.",
    "location.ferry-stair",
    "Get every passenger across before dark.",
    "Oren would rather lose a fare than cross in bad water.",
  ],
  [
    "sella",
    "Sella",
    "Reed-market broker with a long memory.",
    "location.reed-market",
    "Keep the market's trust in her ledgers.",
    "Sella disagrees with ringing the ferry bell early, whoever asks.",
  ],
  [
    "duvan",
    "Duvan",
    "Sluice mechanic for the salt pans.",
    "location.saltworks",
    "Keep the sluices turning through the season.",
    "Duvan fixes what he can see and distrusts rumours.",
  ],
  [
    "pell",
    "Pell",
    "Errand runner between the stair and the works.",
    "location.saltworks",
    "Carry word quickly and truthfully.",
    "Pell goes where the tide allows and no further.",
  ],
] as const;

export const long01CharacterIds = characters.map(([key]) => `character.${key}`);

/** Each Character's two private facts; no other Character knows them. */
export const long01PrivateFacts = Object.fromEntries(
  characters.map(([key, name]) => [
    `character.${key}`,
    [
      {
        id: `fact.private-${key}-1`,
        statement: `${name} privately keeps a spare key to the ${key} locker.`,
      },
      {
        id: `fact.private-${key}-2`,
        statement: `${name} privately suspects the ${key} tally was altered.`,
      },
    ],
  ]),
) as Record<string, Array<{ id: string; statement: string }>>;

/** The wrong fact the scenario corrects through the direct L3 correction path. */
export const long01WrongFact = {
  id: "fact.shared-keeper-left",
  wrong: "The stair keeper left the ferry stair at noon.",
  corrected: "The stair keeper stayed at the ferry stair until the evening bell.",
};

const shared = (id: string, statement: string) => ({
  id,
  statement,
  scope: "SHARED" as const,
  provenance: "LONG-01 fixture",
  lifecycle: "ACTIVE" as const,
});
const continuityPrivate = (id: string, statement: string) => ({
  ...shared(id, statement),
  scope: "CONTINUITY_PRIVATE" as const,
});

export const long01World: WorldDocument = worldDocumentSchema.parse({
  schemaVersion: 1,
  title: "Brackwater Crossing — LONG-01 fixture",
  premise: "A tidal ferry crossing links salt pans and a reed market across brackish water.",
  startingSituation: "The evening ferry bell has gone quiet, and nobody agrees why.",
  userRole: {
    name: "Crossing warden",
    authorityBoundary:
      "The world may respond and develop, but it never authors the warden's speech or irreversible commitments.",
  },
  locations: [
    {
      id: "location.saltworks",
      name: "Saltworks",
      description: "Evaporation pans and sluice gates.",
    },
    {
      id: "location.ferry-stair",
      name: "Ferry Stair",
      description: "Stone steps down to the landing.",
    },
    {
      id: "location.reed-market",
      name: "Reed Market",
      description: "Stalls on stilts over the reeds.",
    },
  ],
  characters: characters.map(([key, name, role, locationId, motive, stance]) => ({
    id: `character.${key}`,
    name,
    role,
    locationId,
    motives: [motive],
    stance,
    knowledgeFactIds: [
      "fact.shared-bell",
      ...(key === "mara" || key === "oren" ? [long01WrongFact.id] : []),
      ...long01PrivateFacts[`character.${key}`]!.map((fact) => fact.id),
    ],
  })),
  facts: [
    // The first SHARED fact is the generator's authorized target.
    shared("fact.shared-bell", "The evening ferry bell has gone quiet."),
    shared(long01WrongFact.id, long01WrongFact.wrong),
    shared("fact.shared-tide", "Spring tides reach the third stair."),
    shared("fact.shared-market", "The reed market opens at first light."),
    shared("fact.shared-sluice", "Two sluice gates feed the salt pans."),
    continuityPrivate("fact.continuity-1", "A torn sail hangs in the ferry shed."),
    continuityPrivate("fact.continuity-2", "The market scales were recalibrated last week."),
    continuityPrivate("fact.continuity-3", "Someone repainted the tide marker."),
    continuityPrivate("fact.continuity-4", "The saltworks cat sleeps on the ledger chest."),
    continuityPrivate("fact.continuity-5", "A second rope was added to the landing post."),
    ...Object.values(long01PrivateFacts)
      .flat()
      .map((fact) => continuityPrivate(fact.id, fact.statement)),
  ],
  relationships: [
    // Ordered so each Character's first scaled relationship is the one it shifts.
    {
      id: "relationship.mara-oren",
      fromCharacterId: "character.mara",
      toCharacterId: "character.oren",
      description: "Mara and Oren argue over whose timetable the ferry keeps.",
      protection: "ROUTINE",
      scale: ["wary", "cordial", "trusting"],
      initialState: "wary",
    },
    {
      id: "relationship.sella-duvan",
      fromCharacterId: "character.sella",
      toCharacterId: "character.duvan",
      description: "Sella buys Duvan's salt but doubts his tallies.",
      protection: "ROUTINE",
      scale: ["wary", "cordial", "trusting"],
      initialState: "wary",
    },
    {
      id: "relationship.pell-mara",
      fromCharacterId: "character.pell",
      toCharacterId: "character.mara",
      description: "Pell runs Mara's errands and wants her trust.",
      protection: "ROUTINE",
      scale: ["wary", "cordial", "trusting"],
      initialState: "wary",
    },
    {
      id: "relationship.oren-sella-oath",
      fromCharacterId: "character.oren",
      toCharacterId: "character.sella",
      description: "Whether Oren has sworn to carry Sella's goods first.",
      protection: "PROTECTED",
      scale: ["unsworn", "sworn"],
      initialState: "unsworn",
    },
  ],
  threads: [
    { id: "thread.bell", title: "Who silenced the ferry bell" },
    { id: "thread.ledger", title: "The missing salt ledger" },
    { id: "thread.stranger", title: "The stranger at the reed market" },
  ],
  constraints: [
    {
      id: "constraint.high-tide",
      statement: "The ferry stair is under water at high tide; no one uses it then.",
    },
  ],
  interactionPaths: ["Talk with the crossing's people, follow a thread, or watch the tide."],
  interactionBoundaries: [
    "The world never authors the warden's speech or an irreversible commitment.",
  ],
  objectives: [],
});

/** Pell's only authorized route starts at the stair, so a move from the works fails. */
export const long01RoutinePolicy = {
  version: "re3-routine-v1",
  npcIds: ["character.pell"],
  publicLocationIds: ["location.saltworks", "location.ferry-stair"],
  routes: [
    {
      fromLocationId: "location.ferry-stair",
      toLocationId: "location.saltworks",
      label: "the stair path",
    },
  ],
} as const;
