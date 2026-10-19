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
  /** How they left the story (died, moved away), while they are out of it; the story may bring them back. */
  gone?: string;
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
  /** Its turns were trimmed from what the model reads: kept for the player, no longer sent. */
  archived?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  resolved: boolean;
  resolution: string;
  /** Its turns were trimmed from what the model reads: kept for the player, no longer sent. */
  archived?: boolean;
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
  /** How this world is told and how it works, in the author's words; the story model reads it every turn. */
  rules: string;
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
  /** "plain" reads at once; "literary" is richer, with more left between the lines. */
  style: "plain" | "literary";
  showSecrets: boolean;
  /** The story model thinks before it writes: better plotted, but the first words take 30-80 s. */
  thinking: boolean;
  /** Every few turns the people out of the scene act on their own plans. */
  meanwhile: boolean;
  /** A risky attempt by the player's character is settled by a die, not by the storyteller. */
  dice: boolean;
}

/** A risky attempt and how the die settled it. */
export interface Dice {
  what: string;
  difficulty: "easy" | "normal" | "hard";
  /** 1 to 20. */
  roll: number;
  outcome: "success" | "cost" | "fail";
  /** What the outcome means here, judged with the difficulty before the roll: a fact the story must keep. */
  result?: string;
}

export const defaultSettings: Settings = {
  person: "third",
  pace: "medium",
  length: "auto",
  style: "plain",
  showSecrets: false,
  thinking: false,
  meanwhile: true,
  dice: false,
};

export interface Save {
  id: string;
  worldId: string;
  title: string;
  headId: string;
  settings: Settings;
  /** What the player wants the story never to forget, in their own words; the story model reads it every turn. */
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** One change the story made to the world, as the model reported it. */
export type Change =
  | { type: "move"; character: string; place: string; note: string }
  | { type: "place"; name: string; description: string; note: string }
  | { type: "character"; name: string; persona: string; goals: string; place: string; note: string }
  | { type: "leave"; character: string; note: string }
  | { type: "status"; character: string; notes: string; note: string }
  | { type: "persona"; character: string; persona: string; goals: string; note: string }
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
  /** What people out of the scene did while this turn was played, unseen by the player's character. */
  meanwhile?: { character: string; did: string }[];
  /** On a turn that skipped time: what the people away changed before the story was written. */
  offstage?: Change[];
  /** The die that settled the player's attempt this turn. */
  dice?: Dice;
  /** "上回说到": where the story stands after this turn, for a player coming back; written once when asked. */
  recap?: string;
  /** This turn's scene told again through another character's eyes, by character id; written once when asked. */
  views?: Record<string, string>;
  /** On the last turn of a whole chapter: the turns since `from` made into a chapter of a novel. */
  chapter?: { from: number; title: string; text: string };
  /**
   * Written every few turns on the last turn they cover: the memory (the most important things, as they stand now)
   * and the timeline (what happened, in order). Later turns find the latest by walking back along their path.
   */
  memory?: MemoryNote[];
  timeline?: TimelineEntry[];
  /** Set when the story grew too long for the model: the turns up to this one are no longer sent, only the timeline. */
  trimmed?: string;
  createdAt: string;
}

/** What happened in turns `from` to `to`, told briefly. Older entries are merged into fewer, briefer ones. */
export interface TimelineEntry {
  from: number;
  to: number;
  text: string;
}

/** One thing worth remembering from earlier turns, dated by the turn it last changed in. */
export interface MemoryNote {
  turn: number;
  text: string;
}

/** The small form of a node, enough to draw the history tree. */
export interface NodeSummary {
  id: string;
  parentId: string | null;
  actor: Actor;
  input: string;
  createdAt: string;
  /** The turn still keeps its whole world state, so the player can go back to it or branch from it. */
  resumable: boolean;
}

export interface SaveView {
  save: Save;
  world: World;
  /**
   * From the opening to the current head. Only the head carries its world state, and only the latest turn with a
   * timeline carries the timeline and the memory: a long game would otherwise send megabytes on every turn.
   */
  path: TurnNode[];
  tree: NodeSummary[];
}
