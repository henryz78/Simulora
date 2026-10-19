import { readFileSync } from "node:fs";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Model {
  /** Streams the reply, piece by piece; with `json` the provider holds it to one JSON object. */
  stream(messages: Message[], options?: { json?: boolean }): AsyncIterable<string>;
  /** Asks for one JSON object; a temperature of 0 asks for the same answer every time. */
  json(messages: Message[], options?: { temperature?: number }): Promise<unknown>;
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
  const send = (messages: Message[], extra: Record<string, unknown>, signal: AbortSignal) =>
    fetch(profile.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${profile.key}` },
      body: JSON.stringify({
        model: config.model,
        messages,
        // Left out, the provider cut replies at about 8K tokens (2026-10-18); a compressed story runs longer.
        max_tokens: 50_000,
        ...(config.reasoning ? { reasoning_effort: config.reasoning } : {}),
        ...extra,
      }),
      signal,
    }).catch((error: Error) => {
      console.warn("model.unreachable", error.message);
      throw new Error("Could not reach the model");
    });
  // The provider now and then fails a good request (a 400 "Invalid request parameters" about one in eight times on
  // 2026-10-18, or a 429 or 5xx); after a short wait it passes.
  const request = async (
    messages: Message[],
    extra: Record<string, unknown>,
    signal: AbortSignal = AbortSignal.timeout(180_000),
  ) => {
    for (let attempt = 1; ; attempt++) {
      // The provider was out of reach for a few seconds at a time during a long test (2026-10-19): wait and retry.
      const response = await send(messages, extra, signal).catch((error: Error) => {
        if (attempt === 3 || signal.aborted) throw error;
        return null;
      });
      if (!response) {
        await new Promise((done) => setTimeout(done, attempt * 1500));
        continue;
      }
      if (response.ok || attempt === 3 || ![400, 429, 500, 502, 503, 504].includes(response.status)) return response;
      const body = await response.text();
      // Too long a prompt or too high a max_tokens fails every time: give up at once.
      if (/max_tokens|context|too long|maximum/i.test(body)) return new Response(body, { status: response.status });
      console.warn("model.retry", response.status, body.slice(0, 200));
      await new Promise((done) => setTimeout(done, attempt * 1500));
    }
  };
  // The provider's own words go to the server log; the player gets a plain sentence.
  const failed = async (response: Response) => {
    console.warn("model.failed", response.status, (await response.text()).slice(0, 300));
    return new Error("The model request failed");
  };

  return {
    async *stream(messages, options) {
      const json = options?.json ? { response_format: { type: "json_object" } } : {};
      // A long reply may take minutes to write, so a stream is given up only when it goes quiet for 3 minutes.
      const quiet = new AbortController();
      const timer = setTimeout(() => quiet.abort(new Error("The model went quiet")), 180_000).unref();
      const response = await request(messages, { stream: true, ...json }, quiet.signal);
      if (!response.ok || !response.body) throw await failed(response);
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        for await (const chunk of response.body) {
          timer.refresh();
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, "").trim();
            if (!line.startsWith("data:") || !data || data === "[DONE]") continue;
            const event = JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[]; error?: unknown };
            // The provider's output check now and then stops a harmless story partway ("Output data may contain
            // inappropriate content", 2 of 6 memory requests on 2026-10-18) and says so inside the stream.
            if (event.error) {
              console.warn("model.stopped", JSON.stringify(event.error).slice(0, 300));
              throw new Error("The model stopped partway");
            }
            const piece = event.choices?.[0]?.delta?.content;
            if (piece) yield piece;
          }
        }
      } finally {
        clearTimeout(timer);
      }
    },
    async json(messages, options) {
      const temperature = options?.temperature;
      const response = await request(messages, {
        response_format: { type: "json_object" },
        ...(temperature !== undefined && { temperature }),
      });
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
 * and whether the string has closed. Lets the story inside a JSON reply reach the player as it is written. The model
 * now and then quotes speech with a bare " inside the story; a quote is taken as the end only when a comma or brace
 * follows it.
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
    if (c === '"') {
      // The end is a quote before the closing brace or the next key ("changes":); "no", then left and 他"嗯"了一声,
      // "别碰" are still the story. Only a quote before a comma and a quote once cut a story at 17 characters.
      const rest = json.slice(i + 1, i + 40);
      if (/^\s*(,\s*("[A-Za-z_]*"?\s*)?)?$/.test(rest)) break; // wait for what follows
      if (/^\s*(}|,\s*"[A-Za-z_]+"\s*:)/.test(rest)) return { text, done: true };
      text += c;
      continue;
    }
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

/**
 * Reads a JSON object out of model text, tolerating code fences around it, and bare quotes inside its strings (the
 * model now and then quotes a name or a line of speech with " and does not escape it).
 */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a JSON object");
  const json = text.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch (error) {
    try {
      return JSON.parse(escapeBareQuotes(json));
    } catch {
      throw error;
    }
  }
}

/** Escapes each quote inside a string that is not followed by what may follow a string's end. */
function escapeBareQuotes(json: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i]!;
    if (inString && c === "\\") {
      out += c + (json[++i] ?? "");
      continue;
    }
    if (c === '"') {
      if (!inString) inString = true;
      else if (/^\s*([:}\]]|,\s*(["[{\d-]|true|false|null))/.test(json.slice(i + 1, i + 40)) || i === json.length - 1)
        inString = false;
      else {
        out += '\\"';
        continue;
      }
    }
    out += c;
  }
  return out;
}

/** A stand-in for tests and for trying the interface without a key. */
export function fakeModel(): Model {
  return {
    async *stream(messages) {
      const last = messages.at(-1)?.content ?? "";
      if (messages[0]?.content.includes("timeline and the long-term memory")) {
        const turns = [...last.matchAll(/\[Turn (\d+)\]\n/g)].map((m) => Number(m[1]));
        const span = `${turns[0]}-${turns.at(-1)}`;
        yield JSON.stringify({ timeline: `Turns ${span} went by.`, memory: [`[Turn ${turns.at(-1)}] Remembered ${span}.`] });
        return;
      }
      if (messages[0]?.content.includes("You design the world")) {
        yield JSON.stringify(await fakeModel().json(messages));
        return;
      }
      if (messages[0]?.content.includes("its oldest entries become one")) {
        const spans = [...last.matchAll(/\[Turns (\d+)-(\d+)\]/g)];
        yield JSON.stringify({ text: `Merged turns ${spans[0]![1]}-${spans.at(-1)![2]}.` });
        return;
      }
      const action = /Player's action: (.*)/.exec(last)?.[1] ?? "";
      const settled = /The dice settled the attempt \([^)]*\): it (\w+)/.exec(last)?.[1];
      const changes = JSON.stringify([
        { type: "clock", text: "A little later", note: "Time passes." },
        ...(action ? [{ type: "fact", text: `Seen: ${action}`, note: "" }] : []),
      ]);
      const hooks = JSON.stringify(["Look around", "Ask what happened", "Wait and listen"]);
      // One JSON reply in the asked order, cut where a real stream may cut it: inside an escape.
      for (const piece of [
        '{"story": "The wind shifts. ',
        `(${action || "the story moves on"}${settled ? `; it ${settled}` : ""}) `,
        "Someone looks up.\\",
        "nIt is quiet.",
        '"',
        `, "changes": ${changes}, "hooks": ${hooks}`,
        "}",
      ])
        yield piece;
    },
    async json(messages) {
      const system = messages[0]?.content ?? "";
      if (system.includes("comes back to their story after a break")) return { recap: "上回说到，风雪还没停。" };
      if (system.includes("talking with the player outside the story")) {
        const question = /Player: (.*)$/.exec(messages.at(-1)!.content)?.[1] ?? "";
        return { answer: `You ask "${question}". I keep my counsel.` };
      }
      if (system.includes("before the dice are rolled")) {
        const tries = /tries: (.*)$/.exec(messages.at(-1)!.content)?.[1] ?? "";
        return /climb|steal|fight/i.test(tries) ? { risky: true, what: "the climb", difficulty: "hard" } : { risky: false };
      }
      if (system.includes("You move a living story world")) {
        const name = /Away from the player's scene now: ([^,.]+)/.exec(messages.at(-1)!.content)?.[1] ?? "";
        return {
          meanwhile: [{ character: name, did: "Locked the back door." }],
          ...(system.includes('"where" gives') && { where: { [name]: "Cellar" } }),
          changes: [
            { type: "status", character: name, notes: "Behind a locked door" },
            { type: "persona", character: name, persona: "Someone else" }, // not the step's to change
          ],
        };
      }
      if (system.includes("hide its secrets"))
        return { secrets: [{ text: `A buried secret, told in ${messages.at(-1)!.content.length} characters.`, knownBy: [] }] };
      if (system.includes("You design the world"))
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
