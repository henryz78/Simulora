import { readFileSync } from "node:fs";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Model {
  /** Streams prose, piece by piece. */
  stream(messages: Message[]): AsyncIterable<string>;
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
    });
  const failed = async (response: Response) =>
    new Error(`Model request failed: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);

  return {
    async *stream(messages) {
      const response = await request(messages, { stream: true });
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
      for (const piece of ["The wind shifts. ", `(${action || "the story moves on"}) `, "Someone looks up."])
        yield piece;
    },
    async json() {
      return {
        changes: [{ type: "clock", text: "A little later", note: "Time passes." }],
        hooks: ["Look around", "Ask what happened", "Wait and listen"],
      };
    },
  };
}
