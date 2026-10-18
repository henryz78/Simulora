import { readFileSync } from "node:fs";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Model {
  /** Streams the reply, piece by piece; with `json` the provider holds it to one JSON object. */
  stream(messages: Message[], options?: { json?: boolean }): AsyncIterable<string>;
  /** Asks for one JSON object. */
  json(messages: Message[]): Promise<unknown>;
}

interface Profile {
  key: string;
  endpoint: string;
}

/**
 * Reads the owner's local profile: key, HTTPS base URL and model, one per line.
 * The key never leaves this process.
 */
function readProfile(path: string): Profile {
  const lines = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [key, base] = lines;
  if (!key || !base) throw new Error("The local model profile needs a key and a base URL");
  const url = new URL(base);
  if (url.protocol !== "https:") throw new Error("The model endpoint must use HTTPS");
  url.pathname = url.pathname.replace(/\/$/, "");
  if (!url.pathname.endsWith("/chat/completions")) url.pathname += "/chat/completions";
  return { key, endpoint: url.href };
}

export interface ModelConfig {
  profilePath: string;
  model: string;
  /** Sent as reasoning_effort when set; empty leaves the provider default. */
  reasoning: string;
}

export function openAICompatibleModel(config: ModelConfig): Model {
  const profile = readProfile(config.profilePath);
  const request = (messages: Message[], extra: Record<string, unknown>) =>
    fetch(profile.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${profile.key}` },
      body: JSON.stringify({
        model: config.model,
        messages,
        ...(config.reasoning ? { reasoning_effort: config.reasoning } : {}),
        ...extra,
      }),
      signal: AbortSignal.timeout(180_000),
    }).catch((error: Error) => {
      console.warn("model.unreachable", error.message);
      throw new Error("Could not reach the model");
    });
  // The provider's own words go to the server log; the player gets a plain sentence.
  const failed = async (response: Response) => {
    console.warn("model.failed", response.status, (await response.text()).slice(0, 300));
    return new Error("The model request failed");
  };

  return {
    async *stream(messages, options) {
      const json = options?.json ? { response_format: { type: "json_object" } } : {};
      const response = await request(messages, { stream: true, ...json });
      if (!response.ok || !response.body) throw await failed(response);
      const decoder = new TextDecoder();
      let buffer = "";
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.replace(/^data:\s*/, "").trim();
          if (!line.startsWith("data:") || !data || data === "[DONE]") continue;
          const piece = (JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[] })
            .choices?.[0]?.delta?.content;
          if (piece) yield piece;
        }
      }
    },
    async json(messages) {
      const response = await request(messages, { response_format: { type: "json_object" } });
      if (!response.ok) throw await failed(response);
      const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      return parseJsonObject(body.choices?.[0]?.message?.content ?? "");
    },
  };
}

/** The index of the quote that closes the string opening at `start`, or -1 while it is still arriving. */
function closeOf(json: string, start: number): number {
  for (let i = start + 1; i < json.length; i++) {
    if (json[i] === "\\") i++;
    else if (json[i] === '"') return i;
  }
  return -1;
}

/**
 * Reads the string value of `key` in the outer object of a JSON reply that may still be arriving: the text so far,
 * and whether the string has closed. Lets the story inside a JSON reply reach the player as it is written.
 */
export function readString(json: string, key: string): { text: string; done: boolean } {
  let depth = 0;
  let open = -1;
  for (let i = 0; i < json.length && open < 0; i++) {
    const c = json[i];
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") depth--;
    else if (c === '"') {
      const close = closeOf(json, i);
      if (close < 0) break;
      const after = /^\s*:\s*"/.exec(json.slice(close + 1, close + 40));
      if (depth === 1 && after) {
        let name: unknown = null;
        try {
          name = JSON.parse(json.slice(i, close + 1));
        } catch {
          // a key the model escaped badly is not the one we want
        }
        if (name === key) open = close + 1 + after[0].length;
      }
      i = close;
    }
  }
  if (open < 0) return { text: "", done: false };
  let text = "";
  for (let i = open; i < json.length; i++) {
    const c = json[i]!;
    if (c === '"') return { text, done: true };
    if (c !== "\\") {
      text += c;
      continue;
    }
    const next = json[i + 1];
    if (next === undefined) break; // the escape is cut off; wait for the rest
    if (next === "u") {
      const hex = json.slice(i + 2, i + 6);
      if (hex.length < 4) break;
      if (/^[0-9a-f]{4}$/i.test(hex)) text += String.fromCharCode(parseInt(hex, 16));
      i += 5;
      continue;
    }
    text += ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f" } as Record<string, string>)[next] ?? next;
    i += 1;
  }
  return { text, done: false };
}

/** Reads a JSON object out of model text, tolerating code fences around it. */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

/** A stand-in for tests and for trying the interface without a key. */
export function fakeModel(): Model {
  return {
    async *stream(messages) {
      const last = messages.at(-1)?.content ?? "";
      const action = /Player's action: (.*)/.exec(last)?.[1] ?? "";
      const changes = JSON.stringify([{ type: "clock", text: "A little later", note: "Time passes." }]);
      const hooks = JSON.stringify(["Look around", "Ask what happened", "Wait and listen"]);
      // One JSON reply in the asked order, cut where a real stream may cut it: inside an escape.
      for (const piece of [
        `{"changes": ${changes}, "story": "The wind shifts. `,
        `(${action || "the story moves on"}) `,
        "Someone looks up.\\",
        "nIt is quiet.",
        `", "hooks": ${hooks}}`,
      ])
        yield piece;
    },
    async json(messages) {
      const system = messages[0]?.content ?? "";
      if (system.includes("hide its secrets"))
        return { secrets: [{ text: `A buried secret, told in ${messages.at(-1)!.content.length} characters.`, knownBy: [] }] };
      if (system.includes("build a world"))
        return {
          title: "Fake Harbor",
          premise: "A harbor where the lighthouse came back on.",
          opening: "The light swings over the water.",
          clock: "Night",
          places: [{ name: "Pier", description: "Wet stones" }],
          characters: [{ name: "Wan", persona: "Quiet", goals: "Find her father", place: "Pier" }],
          facts: ["The lighthouse was dark for ten years."],
          threads: ["Who lit the lamp?"],
          relationships: [],
        };
      return {
        changes: [{ type: "clock", text: "A little later", note: "Time passes." }],
        hooks: ["Look around", "Ask what happened", "Wait and listen"],
      };
    },
  };
}
