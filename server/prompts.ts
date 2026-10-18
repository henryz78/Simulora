import type { Settings, TurnNode, World, WorldState } from "../shared/types.ts";
import type { Message } from "./model.ts";
import { describeState } from "./state.ts";

/** How many earlier turns the model reads in full. */
const RECENT_TURNS = 6;

const CONTENT_LINE =
  "Keep to these lines: nothing that helps with real-world crime, and no sexual or graphically violent content.";

// The last sentence: told "I know where she went", the model used to fill the claim in from the secrets
// (2026-10-18, both DeepSeek and Gemini).
const SECRETS =
  "Secrets are true but the player has not found them. Never state one in the story, the changes or the hooks " +
  "unless the story earns it (a search, evidence, a confession); hints are welcome. A character knows only what " +
  "is listed as known to them, what they have seen in the story, and what they can guess from it. When the " +
  "player's character claims to know something, fill the claim in from that, never from the secrets: a guess " +
  "may be wrong, or the character may bluff.";

function actorName(state: WorldState, actor: string): string | null {
  return actor === "director" ? null : (state.characters.find((c) => c.id === actor)?.name ?? null);
}

function recentStory(path: TurnNode[], state: WorldState): string {
  return path
    .slice(-RECENT_TURNS)
    .map((node) => {
      const who = actorName(state, node.actor);
      const action = node.input
        ? `[${who ? `${who} (played by the player)` : "Director"}: ${node.input}]\n`
        : "";
      return `${action}${node.story}`;
    })
    .join("\n\n");
}

function worldHeader(world: World, state: WorldState): string {
  return `World: ${world.title}\nPremise: ${world.premise}\n\n${describeState(state)}`;
}

const pace: Record<Settings["pace"], string> = {
  calm: "Let the other characters respond naturally, without new major events.",
  medium:
    "The other characters act on their own goals and feelings. Bring in small developments when they fit.",
  intense:
    "Drive the plot: bring in events, complications and surprises. The other characters take bold initiative.",
};

// The player picks the length. Numbers alone did not hold the model (800-1600 characters for "250-450"); with a
// word against copying the earlier, longer turns it wrote about 450-550 (2026-10-18). A sample passage on top
// changed little and was dropped.
const size: Record<Settings["length"], string> = {
  short: "about 150 to 250 Chinese characters (100 to 160 English words), one or two short paragraphs",
  auto: "about 250 to 400 Chinese characters (150 to 250 English words), two to four short paragraphs",
  long: "about 600 to 900 Chinese characters (400 to 600 English words)",
};
const length = (choice: Settings["length"]) =>
  `Write ${size[choice]}, with concrete detail and the others' words and reactions, never just a sentence or two. ` +
  "Earlier passages may be longer; do not match their length.";

/** Each turn stops where the player can act again, so the story never runs past what they would change. */
const STOP =
  "Carry out only this action and the immediate response to it, then stop at the next moment the player could " +
  "act or reply: a question, a door opening, a choice. Do not jump ahead or play out what comes after.";

// Kept short, so the record arrives soon after the story: only the changes that matter, short texts, and a note
// only on a reveal (for the discovery book).
const RECORD_FORMAT = `"changes" lists only the lasting changes that matter, usually two to five. Refer to characters
and places by name, to facts and threads by [id], keep every text short, and use only these shapes:
- {"type":"move","character":name,"place":name}  (a new place name creates the place)
- {"type":"character","name":...,"persona":...,"place":name}  (someone new appears)
- {"type":"status","character":name,"notes":"how they are now, a few words"}
- {"type":"fact","text":"one short sentence"}  (something new and lasting became known)
- {"type":"reveal","fact":id,"note":"how it came out, one sentence"}  (only when the story makes the secret plain)
- {"type":"learn","character":name,"fact":id}
- {"type":"relationship","a":name,"b":name,"text":"how they stand now"}
- {"type":"thread","title":"a new open question"}
- {"type":"resolve","thread":id,"resolution":...}
- {"type":"clock","text":"the new time, a few words"}
"hooks" gives two or three short, different next steps (another person, another place, a bolder move), written
as actions in the world's language.`;

/** Hooks are moves for whoever the player is playing, not for the story's main character. */
function hooksFor(state: WorldState, actor: string): string {
  const name = actorName(state, actor);
  return name
    ? `The player is playing ${name}: write each hook as something ${name} could do next.`
    : "The player is the director: hooks can be moves by any character or events in the world.";
}

/** The shape of a whole reply. Shown in full, it keeps the model from stopping after the story. */
const REPLY_SAMPLE = JSON.stringify({
  story: "…",
  changes: [{ type: "status", character: "…", notes: "…" }],
  hooks: ["…", "…", "…"],
});

export function narrationMessages(
  world: World,
  path: TurnNode[],
  actor: string,
  input: string,
  settings: Settings,
): Message[] {
  const state = path.at(-1)!.state;
  const name = actorName(state, actor);
  const voice = !name
    ? "Write in the third person as an all-seeing narrator."
    : settings.person === "second"
      ? `Address ${name} as "you" (你). When the player writes "I" (我), that is ${name}.`
      : `Write in the third person, close to ${name}. When the player writes "I" (我), that is ${name}: write ` +
        `${name} or he/she, never "you" (你).`;
  const system = [
    "You are the co-author of a living story world. The player owns it.",
    name
      ? `The player plays ${name} this turn. Carry out what they wrote for ${name}, with natural detail, but ` +
        `${name} decides nothing more: that is the player's choice.`
      : "The player is the director this turn: what they write simply happens in the world.",
    "Every other character is yours: they act, speak and decide on their own goals and moods.",
    pace[settings.pace],
    voice,
    length(settings.length),
    STOP,
    SECRETS,
    "Stay consistent with the world and the story so far, and write in the world's own language.",
    CONTENT_LINE,
    "",
    // One JSON reply, like WorldOS (2026-10-18), story first so its first words come in 3-5 s. Told to give all
    // three keys and shown a whole reply, the model kept the record in 6 of 6 turns (3 of 5 were cut short
    // before). The server reads the story out of the reply as it streams; a missing record is filled in.
    'Reply with one JSON object, keys in this order: {"story": "plain prose, paragraphs split by blank lines", ' +
      '"changes": [...], "hooks": [...]}. Always give all three keys, like this:',
    REPLY_SAMPLE,
    RECORD_FORMAT,
    hooksFor(state, actor),
  ].join("\n");
  const action = input.trim() || "(no action: let the story move on by itself)";
  const user = [
    worldHeader(world, state),
    "",
    "Story so far (most recent last):",
    recentStory(path, state),
    "",
    `${name ? `${name} (played by the player)` : "Director"}. Player's action: ${action}`,
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function changeMessages(world: World, before: WorldState, story: string, actor: string): Message[] {
  return [
    {
      role: "system",
      content:
        "You keep the records of a story world. Read the new passage and report how the world changed. Return " +
        `one JSON object: {"changes": [...], "hooks": [...]}.\n${RECORD_FORMAT}\n${SECRETS}\n${hooksFor(before, actor)}`,
    },
    {
      role: "user",
      content: `${worldHeader(world, before)}\n\nNew passage:\n${story}`,
    },
  ];
}

export function hookMessages(world: World, path: TurnNode[]): Message[] {
  const state = path.at(-1)!.state;
  return [
    {
      role: "system",
      content:
        'Suggest what the player could do next in this story world. Return one JSON object: {"hooks": [two or ' +
        "three short, different next steps, written as actions in the world's language]}. A hook must not give " +
        "away a secret the player has not discovered.\n" +
        hooksFor(state, path.at(-1)!.actor),
    },
    {
      role: "user",
      content: `${worldHeader(world, state)}\n\nStory so far:\n${recentStory(path, state)}`,
    },
  ];
}

/** How many turns pass between the times the AI buries new secrets, and how many may wait undiscovered. */
export const BURY_EVERY = 4;
export const MAX_HIDDEN = 5;

const BURY_FORMAT =
  'Return one JSON object: {"secrets": [{"text": "the secret, one or two sentences", "knownBy": [names of ' +
  'characters who know it], "because": "what in the world or story it grows from"}]}. A secret is a hidden truth: ' +
  "concrete, surprising, and able to come out later through the story (a search, evidence, a confession). It fits " +
  "everything already established and never contradicts it. Bring in no new main characters. Do not repeat a " +
  "secret already listed. Write in the same language as the world's own text.";

/** Asks for secrets to bury: from the world itself at the start, from what has happened later on. */
export function buryMessages(world: World, path: TurnNode[]): Message[] {
  const state = path.at(-1)!.state;
  const start = path.length === 1;
  const task = start
    ? "The story is about to start. Bury two or three secrets in this world, grounded in the premise, the places " +
      "and the characters already here. The best secret explains or deepens something the player can already see."
    : "The story has moved on. Bury one or two new secrets grounded in what has happened: the hidden truth behind " +
      'a specific unexplained detail, odd reaction or open question in the recent story. Say which in "because".';
  const story = start ? `Opening:\n${path[0]!.story}` : `Story so far:\n${recentStory(path, state)}`;
  return [
    {
      role: "system",
      content: `You are the co-author of a story world and you hide its secrets. ${task}\n\n${BURY_FORMAT}\n${CONTENT_LINE}`,
    },
    { role: "user", content: `${worldHeader(world, state)}\n\n${story}` },
  ];
}

/** The parts of a world draft the AI writes, with names in place of ids. */
export interface PlainDraft {
  title: string;
  premise: string;
  opening: string;
  clock: string;
  places: { name: string; description: string }[];
  characters: { name: string; persona: string; goals: string; place: string }[];
  facts: string[];
  threads: string[];
  relationships: { a: string; b: string; text: string }[];
}

const DRAFT_FORMAT = `Return one JSON object:
{"title": ..., "premise": "two or three sentences", "opening": "one vivid paragraph: the first moment of the story",
 "clock": "the time when the story starts", "places": [{"name": ..., "description": ...}],
 "characters": [{"name": ..., "persona": "who they are, how they act", "goals": "what they want", "place": a place name}],
 "facts": ["things everyone knows"], "threads": ["open questions that pull the story"],
 "relationships": [{"a": name, "b": name, "text": "how they stand"}]}
Give three to five characters whose goals pull against each other, two to four places, a few facts and one or two
open questions. Leave out secrets: the AI buries those when the story starts. Write in the language of the player's
own words.`;

export function draftMessages(idea: string, draft: PlainDraft | null, feedback: string): Message[] {
  const user = draft
    ? `The player's idea: ${idea}\n\nThe current draft:\n${JSON.stringify(draft)}\n\n` +
      `Change the draft as the player asks and keep the rest: ${feedback}`
    : `The player's idea: ${idea}`;
  return [
    {
      role: "system",
      content: `You help a player build a world for an interactive story they will play.\n\n${DRAFT_FORMAT}\n${CONTENT_LINE}`,
    },
    { role: "user", content: user },
  ];
}
