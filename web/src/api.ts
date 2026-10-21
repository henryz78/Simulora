import type { Dice, SampleIntro, SampleSummary, Save, SaveSummary, SaveView, Settings, TurnNode, World, WorldDraft } from "../../shared/types.ts";

/** Who is playing: on this machine nobody signs in; on the public site, the signed-in player, if any. */
export type Me =
  | { mode: "local" }
  | {
      mode: "public";
      user: { email: string; role: "player" | "admin"; points: { used: number; limit: number | null } } | null;
    };

/** What the admin page shows. */
export interface AdminView {
  users: {
    id: string;
    email: string;
    role: "player" | "admin";
    status: string;
    createdAt: number;
    ownPoints: number | null;
    points: { used: number; limit: number | null };
    worlds: number;
    days: number;
    lastDay: string | null;
  }[];
  daily: { day: string; players: number; points: number }[];
  feedback: { id: number; at: number; rating: number | null; text: string; page: string; context: string; email: string }[];
  invites: { code: string; createdAt: number; heldFor: string | null; usedBy: string | null; usedAt: number | null; revoked: boolean }[];
  mail: { asked: number; limit: number };
  calls: { today: number; limit: number | null };
  problems: { at: number; text: string }[];
}

/** The server wants an account: off to sign in, coming back here after. */
function signInFirst() {
  try {
    if (!location.hash.startsWith("#/login")) sessionStorage.setItem("simulora.back", location.hash);
  } catch {
    // Without storage the player lands on the home page after signing in.
  }
  location.hash = "#/login";
}

/** Where to go once signed in. */
export function afterSignIn() {
  let back = "";
  try {
    back = sessionStorage.getItem("simulora.back") ?? "";
    sessionStorage.removeItem("simulora.back");
  } catch {
    // As above.
  }
  location.hash = back && !/^#\/(login|join)/.test(back) ? back : "#/";
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 && !path.startsWith("/auth")) signInFirst();
  // A refusal before the API (a wrong address, a page from another site) comes with no body.
  const value = (await response.json().catch(() => ({}))) as T & { error?: string };
  // A long reply comes as 200 and carries a failure inside it.
  if (!response.ok || value.error) throw new Error(value.error ?? `HTTP ${response.status}`);
  return value;
}

export const api = {
  me: () => call<Me>("GET", "/auth/me"),
  sendCode: (email: string, invite: string) => call<object>("POST", "/auth/code", { email, invite }),
  verify: (email: string, code: string, invite: string) => call<object>("POST", "/auth/verify", { email, code, invite }),
  signOut: () => call<object>("POST", "/auth/signout", {}),
  deleteAccount: (email: string) => call<object>("DELETE", "/auth/me", { email }),
  feedback: (entry: { rating: number | null; text: string; page: string; saveId?: string }) =>
    call<object>("POST", "/feedback", entry),
  admin: () => call<AdminView>("GET", "/admin"),
  createInvites: (count: number) => call<{ codes: string[] }>("POST", "/invites", { count }),
  revokeInvite: (code: string) => call<object>("DELETE", `/invites/${code}`, {}),
  setPlayer: (id: string, change: { points?: number | null; active?: boolean }) => call<object>("POST", `/users/${id}`, change),
  worlds: () => call<{ world: World; saves: SaveSummary[] }[]>("GET", "/worlds"),
  world: (id: string) => call<World>("GET", `/worlds/${id}`),
  samples: () => call<SampleSummary[]>("GET", "/samples"),
  sample: (id: string) => call<SampleIntro>("GET", `/samples/${id}`),
  /** A copy to play, or, with a title, a copy to change. */
  copySample: (id: string, title?: string) =>
    call<World>("POST", `/samples/${id}/copy`, title ? { title, toChange: true } : {}),
  createWorld: (draft: WorldDraft) => call<World>("POST", "/worlds", draft),
  draft: (idea: string, draft: WorldDraft | null, feedback: string) =>
    call<WorldDraft>("POST", "/drafts", { idea, draft, feedback }),
  draftPrompt: (idea: string) => call<{ prompt: string }>("POST", "/drafts/prompt", { idea }),
  importDraft: (text: string) => call<WorldDraft>("POST", "/drafts/import", { text }),
  updateWorld: (id: string, draft: WorldDraft) => call<World>("PUT", `/worlds/${id}`, draft),
  deleteWorld: (id: string) => call<object>("DELETE", `/worlds/${id}`),
  startSave: (worldId: string, title: string) => call<Save>("POST", "/saves", { worldId, title }),
  save: (id: string) => call<SaveView>("GET", `/saves/${id}`),
  deleteSave: (id: string) => call<object>("DELETE", `/saves/${id}`),
  moveHead: (id: string, headId: string) => call<SaveView>("PATCH", `/saves/${id}`, { headId }),
  settings: (id: string, settings: Partial<Settings>) => call<SaveView>("PATCH", `/saves/${id}`, { settings }),
  notes: (id: string, notes: string) => call<SaveView>("PATCH", `/saves/${id}`, { notes }),
  rename: (id: string, title: string) => call<SaveView>("PATCH", `/saves/${id}`, { title }),
  branch: (id: string, nodeId: string, title: string) => call<Save>("POST", `/saves/${id}/branch`, { nodeId, title }),
  hooks: (id: string, actor: string) => call<TurnNode>("POST", `/saves/${id}/hooks`, { actor }),
  records: (id: string) => call<SaveView>("POST", `/saves/${id}/records`),
  recap: (id: string) => call<{ recap: string }>("POST", `/saves/${id}/recap`),
  chapter: (id: string, chapter: number) =>
    call<{ from: number; title: string; text: string }>("POST", `/saves/${id}/chapter`, { chapter }),
  view: (id: string, node: string, character: string) =>
    call<{ story: string }>("POST", `/saves/${id}/view`, { node, character }),
  interview: (id: string, character: string, talk: { q: string; a: string }[], question: string) =>
    call<{ answer: string }>("POST", `/saves/${id}/interview`, { character, talk, question }),
};

/** Plays one turn, reporting the story as it is written. Resolves with the finished turn. */
export async function playTurn(
  saveId: string,
  actor: string,
  input: string,
  on: {
    story: (text: string) => void;
    phase: (phase: string) => void;
    dice?: (dice: Dice) => void;
    /** Waiting for the model: how many go first. */
    queue?: (ahead: number) => void;
    /** The server asks: time to ask the player how the game is going. */
    ask?: () => void;
  },
  offline: "world" | "all" | null = null,
): Promise<TurnNode> {
  const response = await fetch(`/api/saves/${saveId}/turn`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actor, input, offline }),
  });
  if (response.status === 401) signInFirst();
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const name = /^event: (\w+)/.exec(block)?.[1];
      const data = JSON.parse(/\ndata: (.*)/.exec(block)?.[1] ?? "null") as Record<string, unknown> | null;
      if (name === "story") on.story(String(data?.text ?? ""));
      if (name === "phase") on.phase(String(data?.phase ?? ""));
      if (name === "dice") on.dice?.(data as unknown as Dice);
      if (name === "queue") on.queue?.(Number(data?.ahead ?? 0));
      if (name === "error") throw new Error(String(data?.message ?? "The turn failed"));
      if (name === "done") {
        if (data?.ask) on.ask?.();
        return data?.node as TurnNode;
      }
    }
  }
  throw new Error("The connection closed before the turn finished");
}
