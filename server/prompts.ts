import type { MemoryNote, Settings, TimelineEntry, TurnNode, World, WorldState } from "../shared/types.ts";
import type { Message } from "./model.ts";
import { describeState, sceneOf } from "./state.ts";

/** How many earlier turns the model reads in full. */
const RECENT_TURNS = 6;

const CONTENT_LINE =
  "Keep to these lines: nothing that helps with real-world crime, and no sexual or graphically violent content.";

// The last sentence: told "I know where she went", the model used to fill the claim in from the secrets
// (2026-10-18, both DeepSeek and Gemini).
// A world whose rules said "the world moves on without the player" made the story send the player's letter for
// them and jump to the next morning (2026-10-18): the rules preface keeps the stopping rule first.
const SECRETS =
  "Secrets are true but the player has not found them. Never state one in the story, the changes or the hooks " +
  "unless the story earns it (a search, evidence, a confession); hints are welcome. A character knows only what " +
  "is listed as known to them, what they have seen in the story, and what they can guess from it. When the " +
  "player's character claims to know something, fill the claim in from that, never from the secrets: a guess " +
  "may be wrong, or the character may bluff.";

function actorName(state: WorldState, actor: string): string | null {
  return actor === "director" ? null : (state.characters.find((c) => c.id === actor)?.name ?? null);
}

/** A turn's text as the model reads it, numbered so newer can win over older. */
function turnText(node: TurnNode, turn: number, state: WorldState): string {
  const who = actorName(state, node.actor);
  const action = node.input ? `[${who ? `${who} (played by the player)` : "Director"}: ${node.input}]\n` : "";
  return `[Turn ${turn}]\n${action}${node.story}`;
}

function recentStory(path: TurnNode[], state: WorldState): string {
  return path
    .slice(-RECENT_TURNS)
    .map((node) => turnText(node, path.indexOf(node), state))
    .join("\n\n");
}

/** The first turn of `path` the model still reads in full: the one after the last trim, or the opening. */
export function storyFrom(path: TurnNode[]): number {
  const trimmed = path.findLast((node) => node.trimmed)?.trimmed;
  return trimmed ? path.findIndex((node) => node.id === trimmed) + 1 : 0;
}

/**
 * The latest memory and timeline on the path, and the last turn they cover (-1 before the first ones). Saves from
 * before 2026-10-18 kept an older kind of memory, not an array; it is passed over.
 */
export function chronicleOf(path: TurnNode[]): { notes: MemoryNote[]; timeline: TimelineEntry[]; at: number } {
  const at = path.findLastIndex((node) => Array.isArray(node.timeline));
  const node = path[at];
  return { notes: node?.memory ?? [], timeline: node?.timeline ?? [], at };
}

const FULL_WIDTH: Record<string, string> = { ",": "，", "?": "？", "!": "！", ":": "：", ";": "；" };

/**
 * Chinese with Chinese punctuation: in JSON replies the model often writes "她说,好" with ASCII marks, and asking it
 * not to did not help (2026-10-18). A mark right after a CJK character or closing quote turns full-width; it depends
 * only on the character before it, so a story streamed piece by piece comes out the same.
 */
export function fullWidth(text: string): string {
  // A closing quote counts only after Chinese: "“Yes”, he said" stays English.
  return text.replace(
    /(?<=[㐀-鿿　-〿＀-￯」』]|[㐀-鿿][”’])[,?!:;]/g,
    (mark) => FULL_WIDTH[mark]!,
  );
}

/** A rough token count: about 0.7 per Chinese, Japanese or Korean character, 0.5 per other non-Latin one, 0.3 else. */
export function tokensOf(text: string): number {
  const cjk = text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g)?.length ?? 0;
  const other = text.match(/[^\u0000-\u024f\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g)?.length ?? 0;
  return Math.round(cjk * 0.7 + other * 0.5 + (text.length - cjk - other) * 0.3);
}

function worldHeader(world: World, state: WorldState, options?: { secrets?: boolean; scene?: string[] | null }): string {
  return `World: ${world.title}\nPremise: ${world.premise}\n\n${describeState(state, options)}`;
}

const noteLine = (note: MemoryNote) => `- [Turn ${note.turn}] ${note.text}`;

const entryLine = (entry: TimelineEntry) => `- [Turns ${entry.from}-${entry.to}] ${entry.text}`;

/** The memory and the timeline as the model reads them, or nothing before the first ones. */
function chronicleLines(path: TurnNode[]): string[] {
  const { notes, timeline } = chronicleOf(path);
  return [
    ...(notes.length
      ? ["Memory: the most important things, as they stand now (the story below wins over it):", ...notes.map(noteLine), ""]
      : []),
    ...(timeline.length
      ? ["Timeline: what happened before, in order (the older, the briefer):", ...timeline.map(entryLine), ""]
      : []),
  ];
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
// The player's ceiling for the default length is 500 characters (2026-10-18).
const limit: Record<Settings["length"], string> = {
  short: "300 Chinese characters (200 English words)",
  auto: "500 Chinese characters (330 English words)",
  long: "1,000 Chinese characters (650 English words)",
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
// The clock line says "always": three days passed in a real game and the clock stayed behind; the player's own
// "Now" kept ink on her palm two turns after she rubbed it off (2026-10-18).
const RECORD_FORMAT = `"changes" lists only the lasting changes that matter, usually two to five. Refer to characters
and places by name, to facts and threads by [id], keep every text short, and use only these shapes:
- {"type":"move","character":name,"place":name}  (a new place name creates the place; also whenever someone is in
  the scene who is listed somewhere else or nowhere: where people are decides who the story is told about in full)
- {"type":"character","name":"what the story calls them","persona":...,"goals":...,"place":name}  (someone new
  is seen or heard in this passage; their name and ties only as the story tells them; never a placeholder for
  someone not yet met)
- {"type":"leave","character":name,"note":"how they left the story, a few words"}  (whenever someone dies, goes
  far away for good or is out of the story for good: not a move. Someone out of the story is moved only when they
  come back into it in this passage, and that brings them back)
- {"type":"status","character":name,"notes":"how they are now, a few words"}  (the whole new state, replacing the
  old; check the player's character's "Now" against the passage and give a new one when it is no longer true)
- {"type":"persona","character":name,"persona":"who they are now","goals":"what they want now"}  (only a lasting
  change in who someone is or what they want; the whole new text, either key may be left out)
- {"type":"fact","text":"one short sentence"}  (something new and lasting became known)
- {"type":"reveal","fact":id,"note":"how it came out, one sentence"}  (only when the story makes the secret plain)
- {"type":"learn","character":name,"fact":id}
- {"type":"relationship","a":name,"b":name,"text":"how they stand now"}
- {"type":"thread","title":"a new open question"}
- {"type":"resolve","thread":id,"resolution":...}
- {"type":"clock","text":"the new time, a few words"}  (always when time moves on: a later hour, the next day,
  a jump of days)
"hooks" gives two or three short, different next steps (another person, another place, a bolder move), written
as actions in the world's language.`;

/** Hooks are moves for whoever the player is playing, not for the story's main character. */
function hooksFor(state: WorldState, actor: string): string {
  const name = actorName(state, actor);
  const who = name
    ? `The player is playing ${name}: write each hook as something ${name} could do next.`
    : "The player is the director: hooks can be moves by any character or events in the world.";
  // The player reads the hooks: one that names a secret gives it away (a play-test on 2026-10-18 did).
  return `${who} A hook builds only on what the player has seen, never on a secret.`;
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
  notes = "",
): Message[] {
  const state = path.at(-1)!.state;
  const name = actorName(state, actor);
  // Who the player has been playing: a director's turn leaves them be (a real play-test, 2026-10-19: a director's
  // "meanwhile, in her office..." went on into the library and had the player's own character speak and decide).
  const played = name ? null : actorName(state, path.findLast((node) => node.actor !== "director")?.actor ?? "");
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
      : "The player is the director this turn: what they write simply happens in the world." +
        (played ? ` ${played} is the player's own character: they say and decide nothing new this turn.` : ""),
    // Found in a real play-test (2026-10-18): the story retold the player's lines word for word, and a teacher in
    // his office knew what the player had just done in the library.
    "The player's words are shown right above your story: do not repeat or retell them; go on from them, with " +
      "what happens next and how the others respond.",
    "Every other character is yours: they act, speak and decide on their own goals and moods. Each knows only " +
      "what they have seen, heard or been told: someone who was elsewhere does not know what just happened.",
    // The player, 2026-10-19: a world that keeps the cast it started with goes stale as the story moves on.
    "The cast is not fixed. When the story reaches a new place or a new matter, the people who belong there come " +
      "in, with names and wants of their own; and someone whose part is over can leave the story (moves away, quits, " +
      "dies) when the story gives them a reason.",
    pace[settings.pace],
    voice,
    length(settings.length),
    STOP,
    SECRETS,
    "Stay consistent with the world and the story so far, and write in the world's own language.",
    // After a 64K trim a long game's pawn ticket was asked about; the merged timeline had lost what it said, and the
    // story made up new words for it (2026-10-18).
    "What came before the story below is known only from the timeline and the memory: where they do not give a " +
      "detail (a name, a number, the words on a paper), keep it vague rather than make one up.",
    CONTENT_LINE,
    ...(world.rules?.trim()
      ? [
          "",
          "The author's rules for this world. Follow them. Where they ask for a layout of the reply (status panels, " +
            "option lists, menus), leave it out: the reply format below is fixed, and the game shows the state and " +
            "the next steps itself; where they describe kinds of options, the hooks follow them. They never undo " +
            "the stopping rule: a world that moves on without the player moves through what others do, never by " +
            "deciding for the player's character or jumping past the next moment they could act.",
          world.rules.trim(),
        ]
      : []),
    "",
    // One JSON reply, like WorldOS (2026-10-18), story first so its first words come in 3-5 s. Told to give all
    // three keys and shown a whole reply, the model kept the record in 6 of 6 turns (3 of 5 were cut short
    // before). The server reads the story out of the reply as it streams; a missing record is filled in.
    'Reply with one JSON object, keys in this order: {"story": "plain prose, paragraphs split by blank lines, ' +
      'speech in “” or 「」, Chinese in full-width punctuation", "changes": [...], "hooks": [...]}. Always give all ' +
      "three keys, like this:",
    REPLY_SAMPLE,
    RECORD_FORMAT,
    hooksFor(state, actor),
  ].join("\n");
  const action = input.trim() || "(no action: let the story move on by itself)";
  // The whole story goes in until it nears the model's reach; then the timeline stands in for the oldest turns.
  const from = storyFrom(path);
  const user = [
    // Someone met in the last turn stays whole, also far away: a talk by phone or letter goes on without their name.
    worldHeader(world, state, { scene: sceneOf(state, actor, `${input}\n${path.at(-1)?.story ?? ""}`) }),
    "",
    // Like WorldOS's 重要事实 (2026-10-18): the player's own fallback when the memory misses something.
    ...(notes.trim() ? ["The player's notes (true in this story, never forget them):", notes.trim(), ""] : []),
    ...chronicleLines(path),
    from ? "The story since then (most recent last):" : "The story so far (most recent last):",
    path
      .slice(from)
      .map((node, i) => turnText(node, from + i, state))
      .join("\n\n"),
    "",
    `${name ? `${name} (played by the player)` : "Director"}. Player's action: ${action}`,
    "",
    // Said in the system prompt alone, neither held (2026-10-18): the story retold the player's words, and it drifted
    // to the length of the earlier turns, a little longer each time (about 520 characters at turn 9 of a real game,
    // 640 and up to 870 at turn 19, for the same action). A bare "(Length: ...)" line here broke the JSON reply.
    // Late in a long game 2 of 10 replies stopped after the story; naming the three keys here, 0 of 10.
    `Now write this turn as one JSON object as asked, with all three keys: the story, then "changes", then "hooks".${input.trim() ? " The player has read their action already: go on from it, do not repeat their words." : ""} The story is ${size[settings.length]}, at most ${limit[settings.length]}, however long the turns above ran and however much happens: tell one scene closely and the rest in a line.`,
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

export function hookMessages(world: World, path: TurnNode[], actor = path.at(-1)!.actor): Message[] {
  const state = path.at(-1)!.state;
  return [
    {
      role: "system",
      content:
        'Suggest what the player could do next in this story world. Return one JSON object: {"hooks": [two or ' +
        "three short, different next steps, written as actions in the world's language]}. A hook must not give " +
        "away a secret the player has not discovered.\n" +
        hooksFor(state, actor) +
        (world.rules?.trim() ? `\nThe author's rules for this world (the hooks follow any kinds of options they describe):\n${world.rules.trim()}` : ""),
    },
    {
      role: "user",
      content: `${worldHeader(world, state, { scene: sceneOf(state, actor, path.at(-1)!.story) })}\n\nStory so far:\n${recentStory(path, state)}`,
    },
  ];
}

/** Every this many turns the timeline gets an entry and the memory is checked, while the player plays on. */
export const CHRONICLE_TURNS = 10;
/**
 * When the timeline grows past this many tokens, its oldest entries are merged into one. WorldOS writes about 430
 * characters for every ten turns and was not seen merging (2026-10-18); at about 400 characters an entry this holds
 * some 700 turns before the first merge, and at the default length a trimmed prompt stays near 42K, under the 64K
 * trim line. At the long length it can reach the line; the trim then waits ("trim.waiting") and nothing breaks.
 */
export const TIMELINE_TOKENS = 20_000;
export const MERGE_ENTRIES = 5;

// A real game's first ten turns got sixteen notes, six of them questions (2026-10-18): at most four a step, three
// questions. What the memory keeps, most important first. In a 150-turn mystery the memory, left to choose, kept clue after
// clue and dropped where the heirloom ring was (2026-10-18).
const MEMORY_KINDS = `What to keep, most important first; when there is no room, the last go first:
1. where important things are and who has them, and what the key ones say or show (the words on a ticket, the mark
   on a ring); promises, debts and meetings still pending;
2. turning points: a decisive choice, a vow, a change of heart, a break or a bond, and why;
3. who knows a secret or a truth that matters;
4. at most three questions still open, one short question each. Clues are not kept one by one: only what they add
   up to.`;

// At turn 20 of a real game five of twenty notes were stale or trivial (a Sunday meeting already held, a question
// already answered, "the Baron said 'I saw'"), and most read as events: notes are written as states now.
// The player's design (2026-10-18): the memory keeps state and turning points, checks every old note first and
// rather changes or drops than adds; the timeline tells what happened and is never changed. At first the memory
// also kept one-off events, 13 notes for the first 10 turns. One request writes both from the same turns.
const CHRONICLE_GOALS = `You keep the timeline and the long-term memory of a story world. Read the new turns below.

Return one JSON object: {"timeline": "...", "memory": ["[Turn 12] ...", "[Turn 30] ..."]}.

"timeline": what happened in the new turns, in order, as one paragraph of plain prose: at most 400 Chinese
characters (or 300 words), however much happened. The events big and small: who did what, where, what was said that
matters, what was promised, given, found or lost, with the names, numbers and words written on things (what a
ticket says, how much is owed and until when, where a thing was hidden). No scenery. It is added after the timeline
below and never changed, so tell only the new turns.

"memory": what is worth keeping for the long run, as it stands now; the whole memory from now on. ${MEMORY_KINDS}
Leave out what has its own place: what merely happened (the timeline tells it), and who each character is, what
they want, how they are and how they stand with each other (the world state above keeps all of that). A note
that only repeats one of those is wasted.
Write every note as how things stand now, never as what someone did: "the ring is under the third brick of the
rice jar", "Zhou owes her eight silver dollars, due in the twelfth month", "she has promised Eleanor a bigger story
once she knows", not "she hid the ring" or "Margo told her about the ink".
First go through the earlier notes one by one against the new turns:
- still true and still important: keep it as it is;
- changed: rewrite it as things stand now, dated by the turn it last changed (a key moved from a tin to a box is
  one note saying it is in the box);
- no longer true or no longer important: drop it. A meeting that has taken place, a question that has been
  answered, a promise kept or broken (keep only what it changed), a passing remark or gesture: all go.
Then add what is new. Rather change or drop than add: fold a new thing into a note it belongs to, and add a note
only for something truly new. One note per thing, one sentence of at most about 60 Chinese characters (or 40
words), at most 20 notes, oldest first, each starting with the one turn it last changed in: "[Turn 12] ...". Ten
turns add at most four notes: most add one or two, some none.

Write in the world's own language, and only what the player has seen or been told.`;

/** Asks for the timeline entry and the memory after the `count` turns that follow what `path` has chronicled. */
export function chronicleMessages(world: World, path: TurnNode[], count: number): Message[] {
  const { notes, timeline, at } = chronicleOf(path);
  const end = at + count;
  const state = path[end]!.state;
  const turns = path.slice(at + 1, end + 1).map((node, i) => turnText(node, at + 1 + i, state));
  return [
    { role: "system", content: `${CHRONICLE_GOALS}\n${CONTENT_LINE}` },
    {
      role: "user",
      content: [
        worldHeader(world, state, { secrets: false }),
        "",
        "The timeline so far:",
        ...(timeline.length ? timeline.map(entryLine) : ["(none yet)"]),
        "",
        "The earlier notes:",
        ...(notes.length ? notes.map(noteLine) : ["(none yet)"]),
        "",
        `The new turns (Turn ${at + 1} to ${end}):`,
        turns.join("\n\n"),
      ].join("\n"),
    },
  ];
}

/** The most notes the memory keeps; a reply with more is asked to fold them. */
export const MAX_NOTES = 20;

/** Asks for the memory folded down to `MAX_NOTES` notes. */
export function foldMessages(world: World, notes: MemoryNote[], keep = MAX_NOTES): Message[] {
  return [
    {
      role: "system",
      content:
        `You keep the long-term memory of a story world. It has ${notes.length} notes; keep at most ${keep}, ` +
        `each one sentence of at most about 60 Chinese characters. Fold notes about the same thing together, and ` +
        `drop what merely happened or what someone merely said (the timeline tells it). ` +
        `${MEMORY_KINDS}\nReturn one JSON object: ` +
        '{"memory": ["[Turn 12] ...", ...]}, oldest first, each starting with the one turn it last changed in. ' +
        "Write in the world's own language.\n" +
        CONTENT_LINE,
    },
    { role: "user", content: `World: ${world.title}\n\nThe notes:\n${notes.map(noteLine).join("\n")}` },
  ];
}

/** Asks for one entry in place of the oldest `MERGE_ENTRIES` entries of the timeline. */
// Merging the first fifty turns of a long game kept 6-7 of 12 key details; naming what to keep, 9-10 (2026-10-18).
export function mergeMessages(world: World, entries: TimelineEntry[]): Message[] {
  return [
    {
      role: "system",
      content:
        "You keep the timeline of a story world. It has grown long, so its oldest entries become one. Return one " +
        'JSON object: {"text": "..."}: what happened across these entries, in order, as one short paragraph of ' +
        "plain prose, about 400 to 600 Chinese characters (or 300 to 450 words). Keep the main events and what " +
        "still shapes the story, with the names, numbers and words written on things that still matter (what a " +
        "ticket or letter says, what a ring is marked with, where a thing is hidden, what is owed and when); let the " +
        "small things go. Write in the world's own language.\n" +
        CONTENT_LINE,
    },
    { role: "user", content: `World: ${world.title}\n\nThe entries:\n${entries.map(entryLine).join("\n")}` },
  ];
}

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
    { role: "user", content: [worldHeader(world, state), "", ...chronicleLines(path), story].join("\n") },
  ];
}

/** The parts of a world draft the AI writes, with names in place of ids. */
export interface PlainDraft {
  title: string;
  premise: string;
  rules: string;
  opening: string;
  clock: string;
  places: { name: string; description: string }[];
  characters: { name: string; persona: string; goals: string; place: string }[];
  facts: string[];
  threads: string[];
  relationships: { a: string; b: string; text: string }[];
}

// One world put the burnt room on the fourth floor in its opening and on the eighth in its places, and the story
// went to the wrong one (2026-10-18): the draft checks itself. A world has to carry a story of hundreds of turns. The first prompt asked for "three to five characters, a few facts"
// and the worlds came out thin (the player, 2026-10-18).
const DRAFT_GUIDE = `You design the world of an interactive story the player will play for a long time, hundreds of turns:
as one character, or as a director who changes the world. Build from the player's answers below; where they leave
something open, choose what makes the best story. The world must be rich enough to carry that long story.

- "title": a short, evocative name.
- "premise": three to five sentences: the situation, what is at stake, and why it starts now.
- "rules": how this world is to be told and how it works, for the storyteller to follow every turn: the voice and
  tone, how magic or fighting or money works and what it costs, how people behave, what the player asked for. If
  the player gave rules of their own, or a whole prompt for another AI, keep every rule of it here, in their own
  words, and leave out only instructions about the layout of a reply (status panels, option lists, menus): the game
  shows those itself. Otherwise write five to ten short rules that fit the world.
- "opening": the first scene, 300 to 600 characters (or 200 to 400 words): the player's character in a concrete
  moment, something already happening that asks for a response, ending open, with no choice made for them.
- "clock": when the story starts, a few words.
- "characters": the player's character first, then the people the story needs: four to six for a small world (one
  place, a few people), six to eight for a middling one, eight to ten for a large one. For each:
  - "persona": sex and age; how they look, in a phrase; their temperament, with one contradiction; how they talk
    (a habit, a turn of phrase); their past in one sentence;
  - "goals": what they want now, and what they would never do;
  - "place": where they are at the start.
  Every one has a reason to cross the player's character's path, and their goals pull against each other.
- "places": three to eight, by the size of the world: how each looks, sounds and smells, who is usually there, and
  what can happen there.
- "facts": six to ten things everyone in the world knows: its rules (magic, technology, law), history, customs,
  who holds power, what things cost.
- "threads": two to four open questions or tensions that can drive the story, at least one of them personal to
  the player's character.
- "relationships": between the important people, each with a tension or a bond (a debt, a rivalry, a love, a
  shared past).

If the player's answers ask to choose or build their character at the start, make the most fitting choices for
them now (the player can change them before playing) and put those choices in their character's persona.

Before you reply, check that the premise, the opening, the places, the facts and the threads agree on every name,
place, floor, date and number: the storyteller trusts all of them.

Names, speech and things fit the era and culture; nothing out of its time. Avoid clichés: give each person and
place one particular detail. If the player names an existing work, stay true to its setting and characters. Leave
out secrets: they are hidden when the story starts. Write in the language of the player's own words.`;

const DRAFT_FORMAT = `Reply with one JSON object and nothing else:
{"title": ..., "premise": ..., "rules": ..., "opening": ..., "clock": ...,
 "characters": [{"name": ..., "persona": ..., "goals": ..., "place": a place name}],
 "places": [{"name": ..., "description": ...}], "facts": [...], "threads": [...],
 "relationships": [{"a": name, "b": name, "text": "how they stand"}]}`;

export function draftMessages(idea: string, draft: PlainDraft | null, feedback: string): Message[] {
  const user = draft
    ? `The player's answers:\n${idea}\n\nThe current draft:\n${JSON.stringify(draft)}\n\n` +
      `Change the draft as the player asks and keep the rest: ${feedback}`
    : `The player's answers:\n${idea}`;
  return [
    { role: "system", content: `${DRAFT_GUIDE}\n\n${DRAFT_FORMAT}\n${CONTENT_LINE}` },
    { role: "user", content: user },
  ];
}

/**
 * The same request as one message the player can paste into another AI (one that can search the web for an
 * existing work, and that they can talk the world over with); its JSON reply is pasted back.
 */
export function draftPrompt(idea: string): string {
  return [
    DRAFT_GUIDE,
    "If the player's answers name an existing novel, game or film and you can search the web, look up its setting " +
      "and characters first. The player may ask you to change the world afterwards; each time, reply with the " +
      "whole JSON object again.",
    "",
    DRAFT_FORMAT,
    CONTENT_LINE,
    "",
    `The player's answers:\n${idea}`,
  ].join("\n");
}
