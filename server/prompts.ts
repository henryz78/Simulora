import type { Settings, TurnNode, World, WorldState } from "../shared/types.ts";
import type { Message } from "./model.ts";
import { describeState } from "./state.ts";

/** How many earlier turns the model reads in full. */
const RECENT_TURNS = 8;

const CONTENT_LINE =
  "Keep to these lines: nothing that helps with real-world crime, and no sexual or graphically violent content.";

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

const length: Record<Settings["length"], string> = {
  auto:
    "Decide the length by what the moment needs. Never write less than one full paragraph with concrete " +
    "detail of the place and the other characters' reactions; use several paragraphs for a complex moment " +
    "or a long stretch of time.",
  short: "Write about one or two paragraphs, still with concrete detail and the others' reactions.",
  long: "Write four to six rich paragraphs.",
};

export function narrationMessages(
  world: World,
  path: TurnNode[],
  actor: string,
  input: string,
  settings: Settings,
): Message[] {
  const state = path.at(-1)!.state;
  const name = actorName(state, actor);
  const voice =
    settings.person === "second" && name
      ? `Address ${name} as "you" (in Chinese, 你); the player is playing ${name}.`
      : name
        ? `Write in the third person, close to ${name}'s point of view.`
        : "Write in the third person as an all-seeing narrator.";
  const firstPerson = name
    ? settings.person === "second"
      ? `The player may write "I" (我); that is ${name}, written as "you".`
      : `The player may write "I" (我); that is ${name}. Write it as ${name} or he/she, never as "you" (你).`
    : "";
  const system = [
    "You are the co-author of a living story world. The player owns this world.",
    name
      ? `This turn the player acts as ${name}. Carry out what the player wrote for ${name}, adding natural detail.`
      : "This turn the player speaks as the director: what they write simply happens in the world.",
    "Every character the player is not playing is yours: they have their own goals and moods, and they act, speak and decide for themselves.",
    pace[settings.pace],
    voice,
    firstPerson,
    length[settings.length],
    "Secrets are true but the player has not discovered them. Do not state a secret outright; let it surface only when the story earns it (a search, evidence, a confession). You may plant hints.",
    "Stay consistent with the world state and what already happened. Write in the same language as the world's own text.",
    CONTENT_LINE,
    "Write only the story prose: no headings, no lists, no options.",
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

const CHANGE_FORMAT = `Return one JSON object: {"changes": [...], "hooks": [...]}.

"changes" lists every lasting change the passage made to the world. Use only these shapes, and refer to
characters and places by name, to facts and threads by their [id]:
- {"type":"move","character":name,"place":name}  (a new place name creates the place)
- {"type":"place","name":...,"description":...}
- {"type":"character","name":...,"persona":...,"place":name}  (someone new appears)
- {"type":"status","character":name,"notes":"how they are now, in one short phrase: mood, injuries, what they carry"}
- {"type":"fact","text":...}  (something new and lasting became known)
- {"type":"reveal","fact":id}  (only when the passage makes that secret plain)
- {"type":"learn","character":name,"fact":id}
- {"type":"relationship","a":name,"b":name,"text":"how they stand now"}
- {"type":"thread","title":"an open question the story raised"}
- {"type":"resolve","thread":id,"resolution":...}
- {"type":"clock","text":"the new time only, a few words"}
Every change must also have "note": one short sentence for the player saying what changed.
Leave out anything that did not change. An empty list is fine.

"hooks" gives two or three short next steps the player could take, each different (another character,
another place, a bolder move), written as actions in the world's language.`;

/** Hooks are moves for whoever the player is playing, not for the story's main character. */
function hooksFor(state: WorldState, actor: string): string {
  const name = actorName(state, actor);
  return name
    ? `The player is playing ${name}: write each hook as something ${name} could do next.`
    : "The player is the director: hooks can be moves by any character or events in the world.";
}

export function changeMessages(world: World, before: WorldState, story: string, actor: string): Message[] {
  return [
    {
      role: "system",
      content: `You keep the records of a story world. Read the new passage and report how the world changed.\n\n${CHANGE_FORMAT}\n${hooksFor(before, actor)}`,
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
        "three short, different next steps, written as actions in the world's language]}.\n" +
        hooksFor(state, path.at(-1)!.actor),
    },
    {
      role: "user",
      content: `${worldHeader(world, state)}\n\nStory so far:\n${recentStory(path, state)}`,
    },
  ];
}
