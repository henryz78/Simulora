import type { Dice, MemoryNote, Settings, TimelineEntry, TurnNode, World, WorldState } from "../shared/types.ts";
import type { Message } from "./model.ts";
import { describeState, same, sceneOf } from "./state.ts";

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
function turnText(node: TurnNode, turn: number, state: WorldState, unseen = true): string {
  const who = actorName(state, node.actor);
  const action = node.input ? `[${who ? `${who} (played by the player)` : "Director"}: ${node.input}]\n` : "";
  const meanwhile = unseen && node.meanwhile?.length
    ? `\n[Meanwhile, out of the scene, unseen by the player's character: ${node.meanwhile.map((m) => `${m.character}: ${m.did}`).join(" ")}]`
    : "";
  return `[Turn ${turn}]\n${action}${node.story}${meanwhile}`;
}

function recentStory(path: TurnNode[], state: WorldState, unseen = true): string {
  return path
    .slice(-RECENT_TURNS)
    .map((node) => turnText(node, path.indexOf(node), state, unseen))
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
  `Write ${size[choice]}, with the others' words and reactions, never just a sentence or two. ` +
  "Earlier passages may be longer; do not match their length.";

// The player, 2026-10-19: the story read too deep to follow; WorldOS reads at once ("满是感激", "我是哈利……谢谢你").
// The richer writing stays, for whoever wants it.
const style: Record<Settings["style"], string> = {
  // Asked for "few metaphors", a long game's turns still came back with three or four (2026-10-19): a number holds.
  plain:
    "Write plainly, like a popular web novel, so the player gets it at once: say what happens, who does what and " +
    "why, and how people feel in plain words (he is relieved, she is angry). Short sentences and everyday words, " +
    "at most one comparison (像……) in the whole passage. People say what they mean; someone who hides something " +
    "does it so the reader can tell. One thing moves forward each turn, with at most one new question or hint. " +
    "Write this way even where the passages above are written otherwise.",
  literary: "Write with concrete detail: let what people do and leave unsaid show who they are.",
};

/** Each turn stops where the player can act again, so the story never runs past what they would change. */
// A turn the dice failed had the player's character give her name and an excuse to the teacher who asked (2026-10-19).
const STOP =
  "Carry out only this action and the immediate response to it, then stop at the next moment the player could " +
  "act or reply: a question, a door opening, a choice. Do not jump ahead or play out what comes after. The " +
  "player's character says and does nothing the player did not write: when someone asks them something, the " +
  "passage ends on the question.";

// Kept short, so the record arrives soon after the story: only the changes that matter, short texts, and a note
// only on a reveal (for the discovery book).
// The clock line says "always": three days passed in a real game and the clock stayed behind; the player's own
// "Now" kept ink on her palm two turns after she rubbed it off (2026-10-18).
const RECORD_FORMAT = `"changes" lists only the lasting changes that matter, usually two to five. Refer to characters
and places by name, to facts and threads by [id], keep every text short, and use only these shapes:
- {"type":"move","character":name,"place":name}  (a new place name creates the place, so where the passage is at a
  listed place or a corner of it, copy its name whole, exactly as listed; give a move whenever someone is in
  the scene who is listed somewhere else or nowhere, and for whoever goes along with the player's character: where
  people are decides who the story is told about in full)
- {"type":"character","name":"what the story calls them","persona":...,"goals":...,"place":name}  (someone new
  is seen or heard in this passage; their name and ties only as the story tells them; never a placeholder for
  someone not yet met; "place" is only a place's name, left out when the passage does not say where they are)
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
as actions in the world's language, each under about 25 Chinese characters (15 English words).`;

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
const replySample = (who: string | null) =>
  JSON.stringify({
    story: "…",
    ...(who ? { where: "…" } : {}),
    changes: [{ type: "status", character: "…", notes: "…" }],
    hooks: ["…", "…", "…"],
  });

/**
 * Whose place a turn's reply gives: the character played, or on a director's turn the player's own character, unless
 * they are out of the story (a director's turn does not bring them back).
 */
export function placedOne(path: TurnNode[], actor: string): string | null {
  const id = actor !== "director" ? actor : path.findLast((node) => node.actor !== "director")?.actor;
  const one = path.at(-1)!.state.characters.find((c) => c.id === id);
  return one && !one.gone ? one.name : null;
}

// Asked among the changes, the player's character's move was left out in 9 of 13 walks of a real game, most when
// time jumped ("a week later, at breakfast") or the place went unnamed; asked for every time, it is given every time.
const whereKey = (who: string) =>
  `"where" is where ${who} is at the end of the story, every time, going by the story: the place listed for them ` +
  "may be out of date. When they are at a listed place or a corner of it, copy its name whole, exactly as listed; " +
  "anywhere else, even another room in the same building, give a short new name. When the story does not show " +
  "them, give the place listed for them.";

export function narrationMessages(
  world: World,
  path: TurnNode[],
  actor: string,
  input: string,
  settings: Settings,
  notes = "",
  elsewhere: { character: string; did: string }[] = [],
  dice: Dice | null = null,
  offline: "world" | "all" | null = null,
): Message[] {
  const state = path.at(-1)!.state;
  const name = actorName(state, actor);
  // Who the player has been playing: a director's turn leaves them be (a real play-test, 2026-10-19: a director's
  // "meanwhile, in her office..." went on into the library and had the player's own character speak and decide).
  const who = placedOne(path, actor);
  const played = name ? null : who;
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
    // Vane said her persona's "日期。地点。然后呢？" word for word on every entrance in three games (2026-10-19).
    "A line quoted in someone's persona shows how they talk: let it come back now and then, and in other words, " +
      "never as what they say every time they appear.",
    // The player, 2026-10-19: a world that keeps the cast it started with goes stale as the story moves on.
    "The cast is not fixed. When the story reaches a new place or a new matter, the people who belong there come " +
      "in, with names and wants of their own; and someone whose part is over can leave the story (moves away, quits, " +
      "dies) when the story gives them a reason.",
    pace[settings.pace],
    voice,
    length(settings.length),
    STOP,
    style[settings.style ?? "plain"],
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
            "deciding for the player's character or jumping past the next moment they could act. " +
            // A world's "不用旁白替他们解释动机" kept the plain style from reading plain (2026-10-19); the length and the
            // person held already. What the player picked now comes before what the world's author wrote then.
            "Where they speak to what the player set above (the length, the person, how much the others push the " +
            "story, the writing style), the player's settings come first; the rules govern the rest.",
          world.rules.trim(),
        ]
      : []),
    "",
    // One JSON reply, like WorldOS (2026-10-18), story first so its first words come in 3-5 s. Told to give all
    // three keys and shown a whole reply, the model kept the record in 6 of 6 turns (3 of 5 were cut short
    // before). The server reads the story out of the reply as it streams; a missing record is filled in.
    'Reply with one JSON object, keys in this order: {"story": "plain prose, paragraphs split by blank lines, ' +
      `speech in “” or 「」, Chinese in full-width punctuation", ${who ? '"where": "…", ' : ""}"changes": [...], ` +
      `"hooks": [...]}. Always give all ${who ? "four" : "three"} keys, like this:`,
    replySample(who),
    ...(who ? [whereKey(who)] : []),
    RECORD_FORMAT,
    hooksFor(state, actor),
  ].join("\n");
  const action = input.trim() || "(no action: let the story move on by itself)";
  // The whole story goes in until it nears the model's reach; then the timeline stands in for the oldest turns.
  const from = storyFrom(path);
  const user = [
    // Someone met in the last turn stays whole, also far away: a talk by phone or letter goes on without their name.
    // After a jump in time, the scene the storyteller sees is the one the people away were judged by: the new place.
    worldHeader(world, state, {
      scene: timeJump(input)
        ? sceneOf(state, actor, input, true)
        : sceneOf(state, actor, `${input}\n${path.at(-1)?.story ?? ""}`),
    }),
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
    // A skip in time: what the people away got up to, so the player comes back to a world that moved on.
    ...(elsewhere.some((m) => !who || !same(m.character, who))
      ? [
          "While the skipped time passed, out of the player's sight (their character learns of it only by what they " +
            `would see, hear or be told on coming back): ${elsewhere
              .filter((m) => !who || !same(m.character, who))
              .map((m) => `${m.character}: ${m.did}`)
              .join(" ")}`,
          "",
        ]
      : []),
    // The player was away for days: how their own character spent them, as the player chose.
    ...(offline && who
      ? [
          offline === "all"
            ? `${who} lived those days too, on their own wants: ${elsewhere.find((m) => same(m.character, who))?.did ?? "as they would"}. ` +
              "Tell it briefly as done, then where they are now, and stop where the player takes them up again."
            : `${who} lived those days quietly where they were and did nothing that matters. Tell them as they are now, ` +
              "the world changed around them; what they do next is the player's.",
          "",
        ]
      : []),
    `${name ? `${name} (played by the player)` : "Director"}. Player's action: ${action}`,
    // The die, not the storyteller, settled it: told as it fell.
    ...(dice
      ? [
          `The dice settled the attempt (${dice.what}): ${OUTCOME[dice.outcome]}` +
            (dice.result ? ` This is fixed, tell it so: ${dice.result}` : "") +
            " Go on from there; never turn a failure or a cost into a clean success, nor a success into a failure.",
        ]
      : []),
    "",
    // Said in the system prompt alone, neither held (2026-10-18): the story retold the player's words, and it drifted
    // to the length of the earlier turns, a little longer each time (about 520 characters at turn 9 of a real game,
    // 640 and up to 870 at turn 19, for the same action). A bare "(Length: ...)" line here broke the JSON reply.
    // Late in a long game 2 of 10 replies stopped after the story; naming the three keys here, 0 of 10.
    `Now write this turn as one JSON object as asked, with all ${who ? "four" : "three"} keys: the story, then ${who ? '"where", then ' : ""}"changes", then "hooks".${input.trim() ? " The player has read their action already: go on from it, do not repeat their words." : ""} The story is ${size[settings.length]}, at most ${limit[settings.length]}, however long the turns above ran and however much happens: tell one scene closely and the rest in a line.`,
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function changeMessages(
  world: World,
  before: WorldState,
  story: string,
  actor: string,
  who: string | null = null,
): Message[] {
  return [
    {
      role: "system",
      content:
        "You keep the records of a story world. Read the new passage and report how the world changed. Return " +
        `one JSON object: {${who ? '"where": "…", ' : ""}"changes": [...], "hooks": [...]}.\n` +
        `${who ? `${whereKey(who).replace("the story", "the passage")}\n` : ""}` +
        `${RECORD_FORMAT}\n${SECRETS}\n${hooksFor(before, actor)}`,
    },
    {
      role: "user",
      content: `${worldHeader(world, before)}\n\nNew passage:\n${story}`,
    },
  ];
}

/** Every this many turns the people out of the scene act on their own, while the turn is written. */
export const MEANWHILE_TURNS = 5;

/**
 * The people out of the scene (`away`, by name) act on their own plans for a while: the player's design (2026-10-17),
 * you come back a few turns later and find the door locked, someone gone up the mountain.
 */
/**
 * How much time the player's words skip, as they put it ("三天后", "过了一个月", "a week later"), or null. A day ("第二天",
 * "一天后", "the next morning") is the story's ordinary pace and no jump.
 */
export function timeJump(input: string): string | null {
  const n = String.raw`(?<!第)[0-9０-９一二两三四五六七八九十百几数半多]+`;
  const unit = "(?:天|日|星期|礼拜|周|个月|月|年|学期)";
  // "下月" or "下周" only where a time is said: "放下月饼", "部下周瑜" are no jumps.
  const next = String.raw`(?:^|[\s，。！？、,.!?到等在去于的])下(?:个)?(?:星期|礼拜|周|月|学期)|下个(?:星期|礼拜|周|月|学期)`;
  const found =
    new RegExp(String.raw`${n}\s*个?\s*${unit}\s*(?:之|以)?(?:后|过后|过去)|过了\s*${n}\s*个?\s*${unit}|${next}`).exec(input)?.[0]?.replace(/^[\s，。！？、,.!?到等在去于的]/, "") ??
    /\b(?:\d+|a|one|two|three|four|five|six|seven|eight|nine|ten|a few|few|several|some)\s+(?:days?|weeks?|months?|years?)\s+(?:later|after|pass(?:es|ed)?)\b|\b(?:after|in) (?:\d+|two|three|four|five|six|seven|eight|nine|ten|a few|several) (?:days|weeks|months|years)\b|\bnext (?:week|month|year|term)\b/i.exec(input)?.[0];
  if (!found || /^(?:一|1|１|半|a|one)\s*(?:天|日|day)/i.test(found.replace(/^过了\s*/, ""))) return null;
  return found;
}

export function meanwhileMessages(
  world: World,
  path: TurnNode[],
  away: string[],
  passed: string | null = null,
  own: string | null = null,
): Message[] {
  const state = path.at(-1)!.state;
  return [
    {
      role: "system",
      content: [
        "You move a living story world while the player is busy elsewhere. The people listed as away are not in the " +
          "player's scene. " +
          (passed
            ? `Time is skipped now: ${passed} (as the player puts it). Pick one to five of them whose goals, fears or ` +
              "plans would move them over that time, and tell what each got done or went through in it: as much as " +
              "such a person would in so long a time, true to who they are and to what they know, and the world " +
              "around them changed by it (a shop closed, a letter sent, a quarrel made up, someone gone away). " +
              // Asked among the changes, a three-day jump moved three of six people left where the last scene was.
              '"where" gives, for every one of the people away, where they are now that the time has passed, ' +
              "the ones who did nothing worth telling too (back where they live or work): a listed place's name " +
              "copied whole, or a short new name."
            : "Pick one to three of them whose goals, fears or plans would have them do something now, and tell what " +
              "each did since the story last showed them: one small, concrete step, the next thing such a person " +
              "would do (a letter written, a door locked, a walk to another place, a talk with someone else away), " +
              "true to who they are and to what they know.") +
          " Nobody does it in the player's scene or to the player's character; it may reach them later. Act on " +
          "secrets, never explain them." +
          // The player chose to have their own character live the days away too.
          (own
            ? ` ${own} is the player's own character: for these days they are away like the others, and live them ` +
              "on their own wants, one of those you tell."
            : ""),
        CONTENT_LINE,
        "Write in the world's own language. Return one JSON object:",
        `{"meanwhile": [{"character": name, "did": "one or two short sentences, at most 60 Chinese characters (40 English words)"}], ${passed ? '"where": {name: place, ...}, ' : ""}"changes": [...]}`,
        '"changes" records only what those steps changed, refer to people and places by name, with only these shapes:',
        '- {"type":"move","character":name,"place":name}  (a listed place\'s name copied whole, exactly as listed, or a ' +
          "short new name for somewhere else)",
        '- {"type":"status","character":name,"notes":"how they are now, a few words"}',
        '- {"type":"relationship","a":name,"b":name,"text":"how they stand now"}',
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        worldHeader(world, state),
        "",
        ...chronicleLines(path),
        `The story lately:\n${recentStory(path, state)}`,
        "",
        `Away from the player's scene now: ${away.join(", ")}.`,
      ].join("\n"),
    },
  ];
}

// Told only "it succeeds", the story let 3 of 5 rolled successes go wrong (2026-10-19): a hiding place rolled 19 and was
// found at once; a questioning rolled 14 and got no name, the answer being a secret. What success means here is now
// said by the judge before the roll, and the story is told it as a fact.
const OUTCOME: Record<Dice["outcome"], string> = {
  success:
    "it succeeds cleanly: the player gets what they tried for, and nothing goes wrong with it in this scene; what " +
    "follows from it can come later. An attempt to learn something learns it, a secret included: the roll earns it.",
  cost:
    "it succeeds (the player gets what they tried for, a secret included if that was the aim), at a real cost: an " +
    "injury, a loss, a debt, a witness, or something broken or given away.",
  fail: "it fails, and the failure has consequences the story goes on from.",
};

/**
 * Whether the player's action is a gamble the dice should settle, and how hard it is, judged before any roll so the
 * roll stays the dice's.
 */
export function riskMessages(world: World, path: TurnNode[], actor: string, input: string): Message[] {
  const state = path.at(-1)!.state;
  const name = actorName(state, actor) ?? "The player's character";
  return [
    {
      role: "system",
      content:
        "You judge an action in a story game before the dice are rolled. It is risky only when its outcome is truly " +
        "uncertain and failing would matter: a climb, a fight, a theft, sneaking past someone or hiding from someone " +
        "who may find them, a lie to someone who may see through it, persuading someone set against it or pressing " +
        "them for what they will not say, a spell or a feat under pressure. Talking, walking, going where they are " +
        "allowed or asked to go, looking, asking someone willing, waiting and ordinary work are not risky. Judge the difficulty by who tries it, against whom, " +
        "and how, from the world and the story so far. Say also, in one plain sentence each in the world's language, " +
        "what success would mean here (the player gets what they tried for: the guard is fooled, they are not seen, " +
        "he names the buyer) and what failure would mean: only how this attempt turns out and how others take it, " +
        "never a further move or word of the player's character (a peek that succeeds sees, it does not also slip " +
        "back). Return one JSON object: " +
        '{"risky": true or false, "what": "the attempt in a few words", "difficulty": "easy" | "normal" | "hard", ' +
        '"success": "…", "fail": "…"}',
    },
    {
      role: "user",
      content: [
        worldHeader(world, state, { secrets: false, scene: sceneOf(state, actor, input) }),
        "",
        // What is known of who tries it (a master thief, a sprained wrist) counts as much as the last scene.
        ...chronicleLines(path),
        `The story lately:\n${path.slice(-2).map((node) => turnText(node, path.indexOf(node), state, false)).join("\n\n")}`,
        "",
        `${name} (played by the player) tries: ${input}`,
      ].join("\n"),
    },
  ];
}

/**
 * A talk with one character out of the story: the player's own design (2026-10-17), "跳出故事和某个角色聊，不改变世界".
 * They answer as they are now, from what they know; what the player has not found stays theirs unless the player chose
 * to see every secret.
 */
export function interviewMessages(
  world: World,
  path: TurnNode[],
  character: string,
  talk: { q: string; a: string }[],
  question: string,
  showSecrets: boolean,
): Message[] {
  const state = path.at(-1)!.state;
  const me = state.characters.find((c) => c.id === character)!;
  const theirs = state.facts.filter((f) => f.secret && !f.revealed && me.knows.includes(f.id));
  // The story is told close to the player's character: once Harriet spoke of "my uncle's accounts", Tamasin's.
  const played = placedOne(path, "director");
  return [
    {
      role: "system",
      content: [
        // Named alone, the interviewee once answered as whoever the last scenes were about (2026-10-19): who they are, here.
        `You are ${me.name}: ${me.persona}${me.goals ? ` What you want: ${me.goals}` : ""}${me.notes ? ` Now: ${me.notes}` : ""}`,
        `You, ${me.name}, are talking with the player outside the story, as in an interview. Answer in the first ` +
          "person, in your own voice and manner, as you are at this point of the story: your temperament, your mood, " +
          "what you want and fear. You know what you have seen, done and been told, and what is listed as known to " +
          "you; you do not know what happened where you were not, and of other people's plans and states you know " +
          "only what you have seen or been told. Nothing said here happens in the story.",
        showSecrets
          ? "The player has chosen to see every secret: say what you know frankly, your own secrets too."
          : "What you know that the player has not found out stays yours: you may hint, dodge or lie as you would, " +
            "never state it plainly.",
        played && played !== me.name ? `The player plays ${played} in the story; you are not ${played}, and their family and past are not yours.` : "",
        me.gone ? `You have left the story (${me.gone}); speak from there.` : "",
        "Talk as people talk, plainly: about 40 to 150 Chinese characters (30 to 100 English words), no stage " +
          "directions or narration, only what you say. Write in the world's own language. " +
          'Return one JSON object: {"answer": "…"}',
        CONTENT_LINE,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      role: "user",
      content: [
        // Those away in a line: the whole of everyone's plans made an all-knowing interviewee (review, 2026-10-19).
        worldHeader(world, state, { secrets: false, scene: sceneOf(state, me.id) }),
        ...(theirs.length ? ["", "What you know that the player has not found out:", ...theirs.map((f) => `- ${f.text}`)] : []),
        "",
        ...chronicleLines(path),
        `The story lately (most recent last):\n${recentStory(path, state, false)}`,
        "",
        ...(talk.length ? ["The talk so far:", ...talk.flatMap((t) => [`Player: ${t.q}`, `${me.name}: ${t.a}`]), ""] : []),
        `Player: ${question}`,
      ].join("\n"),
    },
  ];
}

/**
 * One turn's scene told again through another character's eyes: the player's design (2026-10-17), "同一场戏换一个角色
 * 看". The same events and words; what they notice, think and feel.
 */
export function viewMessages(world: World, path: TurnNode[], turn: number, character: string, settings: Settings): Message[] {
  const node = path[turn]!;
  const state = node.state ?? path.at(-1)!.state;
  const me = state.characters.find((c) => c.id === character)!;
  // Told "only color their thoughts", Slughorn's eyes spelled out both his secrets (2026-10-19): unless the player
  // chose to see every secret, they are not given at all.
  const theirs = settings.showSecrets
    ? state.facts.filter((f) => f.secret && !f.revealed && me.knows.includes(f.id))
    : [];
  return [
    {
      role: "system",
      content: [
        `Tell the passage below again through the eyes of ${me.name}: ${me.persona}${me.goals ? ` What they want: ${me.goals}` : ""}`,
        // A teacher's eyes came back as the player's, with a speech the passage never had (2026-10-19).
        `Stay with ${me.name} the whole way, in the third person: what they notice, think and feel, what they make ` +
          "of the others, and what they keep to themselves; everyone else is seen from outside, as they would see " +
          `them. Where ${me.name} is not there for part of it, start when they arrive or tell only what they hear. ` +
          `Every paragraph follows ${me.name}, beginning with the first sentence: the player's own character too is ` +
          `someone ${me.name} watches.`,
        "Only what the passage tells happens: the same acts in the same order and the same words, no new line or deed " +
          `by anyone; ${me.name} too says only what the passage has them say. What is new is only what goes on ` +
          `inside them. At most ${Math.round(node.story.length * 1.2)} characters.`,
        // A passage that ended on a question handed to the player's character was answered for them (2026-10-19), and
        // the watcher was given one more line of their own at the end, 3 times in 4.
        `It ends where the passage ends, at: "${lastLine(node.story)}" Nothing after that: nobody answers it or speaks ` +
          "again.",
        ...(settings.showSecrets ? ["The player has chosen to see every secret: their thoughts may go to what they know."] : []),
        style[settings.style ?? "plain"],
        "Write in the world's own language. Return one JSON object: {\"story\": \"…\"}",
        CONTENT_LINE,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        worldHeader(world, state, { secrets: false, scene: sceneOf(state, me.id) }),
        ...(theirs.length ? ["", `What ${me.name} knows that the player has not found out:`, ...theirs.map((f) => `- ${f.text}`)] : []),
        "",
        `The story before it:\n${path.slice(Math.max(0, turn - 3), turn).map((n, i) => turnText(n, Math.max(0, turn - 3) + i, state, false)).join("\n\n")}`,
        "",
        `The passage to tell again:\n${turnText(node, turn, state, false)}`,
      ].join("\n"),
    },
  ];
}


/** Every this many turns make a chapter of the novel, as they make an entry of the timeline. */
export const CHAPTER_TURNS = 10;

/**
 * A stretch of play made into a chapter of a novel: the player's own words and deeds woven in (the turns' stories go
 * on from them and never repeat them), the seams smoothed, nothing added. Plain text: a title line, then the chapter.
 */
export function chapterMessages(world: World, path: TurnNode[], from: number, to: number): Message[] {
  const state = path.at(-1)!.state;
  return [
    {
      role: "system",
      content: [
        "You turn a stretch of an interactive story into one chapter of a novel. Each turn below is what the player " +
          "wrote in brackets, then the story that went on from it: the story never repeats the player's words, so " +
          "weave them in, the player's character saying and doing just what the player wrote; every line the player " +
          "gave them to say is their speech in the chapter, word for word. Keep every event, " +
          "every line spoken and every detail that matters, in the same order; smooth the seams between turns, cut " +
          "what is said twice, add nothing that did not happen. About as long as the stories together.",
        "Reply in plain text, no JSON and no markdown: the chapter's title alone on the first line (a few words), " +
          "then the chapter, paragraphs split by blank lines, speech in “” or 「」. Write in the world's own language.",
        CONTENT_LINE,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `World: ${world.title}`,
        `Premise: ${world.premise}`,
        "",
        ...(from > 1 ? [`Before this, in short:`, ...chronicleLines(path.slice(0, from)), ""] : []),
        `The turns to make into this chapter (Turn ${from} to ${to}):`,
        path
          .slice(from, to + 1)
          .map((node, i) => turnText(node, from + i, state, false))
          .join("\n\n"),
      ].join("\n"),
    },
  ];
}

/** A passage's last sentence or so, to end a retelling on. */
export const lastLine = (story: string) => story.trim().split(/(?<=[。！？!?…”」])/).filter((x) => x.trim()).slice(-2).join("").trim().slice(-80);

/** "上回说到" for a player coming back after a break: only what they have seen, in plain words. */
export function recapMessages(world: World, path: TurnNode[]): Message[] {
  const state = path.at(-1)!.state;
  const who = placedOne(path, "director");
  return [
    {
      role: "system",
      content:
        "A player comes back to their story after a break and has forgotten where it stands. Write the recap that " +
        "opens it again, as a storyteller would (\"上回说到\" in Chinese): 120 to 250 Chinese characters (80 to 160 " +
        "English words), plain everyday words. Say " +
        (who ? `where ${who} is and what they are in the middle of, ` : "where the story is, ") +
        "who matters now and why, what has been promised, owed or threatened lately, and end on the very moment the " +
        "last turn stopped, so the player knows what to do next. Only what the player has seen: never a secret, " +
        "never what people did out of the player's sight. No lists, no headings. Write in the world's own language. " +
        'Return one JSON object: {"recap": "…"}',
    },
    {
      role: "user",
      content: [
        worldHeader(world, state, { secrets: false }),
        "",
        ...chronicleLines(path),
        `The story lately (most recent last):\n${recentStory(path, state, false)}`,
      ].join("\n"),
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
        "three short, different next steps, written as actions in the world's language, each under about 25 " +
        "Chinese characters (15 English words)]}. A hook must not give " +
        "away a secret the player has not discovered.\n" +
        hooksFor(state, actor) +
        (world.rules?.trim() ? `\nThe author's rules for this world (the hooks follow any kinds of options they describe):\n${world.rules.trim()}` : ""),
    },
    {
      role: "user",
      content: `${worldHeader(world, state, { scene: sceneOf(state, actor, path.at(-1)!.story) })}\n\nStory so far:\n${recentStory(path, state, false)}`,
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
