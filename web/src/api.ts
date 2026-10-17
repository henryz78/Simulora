import type { Save, SaveView, Settings, TurnNode, World, WorldDraft } from "../../shared/types.ts";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
  return value;
}

export const api = {
  worlds: () => call<{ world: World; saves: Save[] }[]>("GET", "/worlds"),
  world: (id: string) => call<World>("GET", `/worlds/${id}`),
  createWorld: (draft: WorldDraft) => call<World>("POST", "/worlds", draft),
  updateWorld: (id: string, draft: WorldDraft) => call<World>("PUT", `/worlds/${id}`, draft),
  deleteWorld: (id: string) => call<object>("DELETE", `/worlds/${id}`),
  startSave: (worldId: string) => call<Save>("POST", "/saves", { worldId }),
  save: (id: string) => call<SaveView>("GET", `/saves/${id}`),
  deleteSave: (id: string) => call<object>("DELETE", `/saves/${id}`),
  moveHead: (id: string, headId: string) => call<SaveView>("PATCH", `/saves/${id}`, { headId }),
  settings: (id: string, settings: Partial<Settings>) => call<SaveView>("PATCH", `/saves/${id}`, { settings }),
  branch: (id: string, nodeId: string) => call<Save>("POST", `/saves/${id}/branch`, { nodeId }),
  hooks: (id: string) => call<TurnNode>("POST", `/saves/${id}/hooks`),
};

/** Plays one turn, reporting the story as it is written. Resolves with the finished turn. */
export async function playTurn(
  saveId: string,
  actor: string,
  input: string,
  on: { story: (text: string) => void; phase: (phase: string) => void },
): Promise<TurnNode> {
  const response = await fetch(`/api/saves/${saveId}/turn`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actor, input }),
  });
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
      if (name === "error") throw new Error(String(data?.message ?? "The turn failed"));
      if (name === "done") return data?.node as TurnNode;
    }
  }
  throw new Error("The connection closed before the turn finished");
}
