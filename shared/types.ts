// Data shared by the server and the browser.

export interface Place {
  id: string;
  name: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  persona: string;
  goals: string;
  /** Where the character is now; null when nowhere in particular. */
  placeId: string | null;
  /** How the character is doing right now: mood, injuries, what they carry. */
  notes: string;
  /** Ids of facts this character knows. */
  knows: string[];
}

export interface Fact {
  id: string;
  text: string;
  /** A secret is true in the world but hidden from the player until revealed. */
  secret: boolean;
  revealed: boolean;
  source: "author" | "ai" | "story";
  /** How the story brought a secret out, in a sentence for the discovery book. */
  revealNote?: string;
}

export interface Thread {
  id: string;
  title: string;
  resolved: boolean;
  resolution: string;
}

export interface Relationship {
  a: string;
  b: string;
  text: string;
}

export interface WorldState {
  clock: string;
  places: Place[];
  characters: Character[];
  facts: Fact[];
  threads: Thread[];
  relationships: Relationship[];
}

export interface WorldDraft {
  title: string;
  premise: string;
  opening: string;
  state: WorldState;
}

export interface World extends WorldDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  person: "third" | "second";
  pace: "calm" | "medium" | "intense";
  length: "auto" | "short" | "long";
  showSecrets: boolean;
  /** The story model thinks before it writes: better plotted, but the first words take 30-80 s. */
  thinking: boolean;
}

export const defaultSettings: Settings = {
  person: "third",
  pace: "medium",
  length: "auto",
  showSecrets: false,
  thinking: false,
};

export interface Save {
  id: string;
  worldId: string;
  title: string;
  headId: string;
  settings: Settings;
  createdAt: string;
  updatedAt: string;
}

/** One change the story made to the world, as the model reported it. */
export type Change =
  | { type: "move"; character: string; place: string; note: string }
  | { type: "place"; name: string; description: string; note: string }
  | { type: "character"; name: string; persona: string; place: string; note: string }
  | { type: "status"; character: string; notes: string; note: string }
  | { type: "fact"; text: string; note: string }
  | { type: "reveal"; fact: string; note: string }
  | { type: "learn"; character: string; fact: string; note: string }
  | { type: "relationship"; a: string; b: string; text: string; note: string }
  | { type: "thread"; title: string; note: string }
  | { type: "resolve"; thread: string; resolution: string; note: string }
  | { type: "clock"; text: string; note: string };

/** "director", or the id of the character the player acts as. */
export type Actor = string;

/** One turn. Every turn keeps the whole world state after it, so any turn can be resumed. */
export interface TurnNode {
  id: string;
  worldId: string;
  parentId: string | null;
  actor: Actor;
  input: string;
  story: string;
  changes: Change[];
  hooks: string[];
  state: WorldState;
  /** The story was kept but its changes could not be read; the player can ask again. */
  recordsFailed?: boolean;
  createdAt: string;
}

/** The small form of a node, enough to draw the history tree. */
export interface NodeSummary {
  id: string;
  parentId: string | null;
  actor: Actor;
  input: string;
  createdAt: string;
}

export interface SaveView {
  save: Save;
  world: World;
  /** From the opening to the current head. */
  path: TurnNode[];
  tree: NodeSummary[];
}
