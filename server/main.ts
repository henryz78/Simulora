import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { createApi } from "./app.ts";
import { Store } from "./db.ts";
import { fakeModel, openAICompatibleModel } from "./model.ts";

const root = resolve(import.meta.dirname, "..");
const prod = process.argv.includes("--prod");
const fake = process.argv.includes("--fake");
const port = Number(process.env.SIMULORA_PORT ?? 5170);

mkdirSync(join(root, "data"), { recursive: true });
const store = new Store(join(root, "data", fake ? "fake.db" : "simulora.db"));
// The story and the records of what changed can use different models.
const live = (model: string, reasoning: string) =>
  openAICompatibleModel({ profilePath: join(root, ".secret.txt"), model, reasoning });
// DeepSeek-V4.1-Flash wrote the liveliest scenes in the 2026-10-17 comparison. Without thinking ("none") its first
// words come in about 3 s instead of 30-60 s, and the prose is as good. The records and the buried secrets think a
// little ("low"): without thinking they mark hinted secrets as revealed and bury the same secret twice; at the
// default they take 50 s to over 100 s, long enough for the gateway to give up (2026-10-18).
const storyModel = process.env.SIMULORA_MODEL ?? "ModelScope/deepseek-ai/DeepSeek-V4.1-Flash";
const story = fake ? fakeModel() : live(storyModel, process.env.SIMULORA_REASONING ?? "none");
const records = fake
  ? story
  : live(process.env.SIMULORA_RECORD_MODEL ?? storyModel, process.env.SIMULORA_RECORD_REASONING ?? "low");
const model = { stream: story.stream, json: records.json };
// The "deep thinking" setting: the same model at the provider's default effort.
const thinker = fake ? story : live(storyModel, process.env.SIMULORA_THINKING_REASONING ?? "");
const api = createApi(store, model, { thinker, writer: story });

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const dist = join(root, "web", "dist");
const vite = prod
  ? null
  : await (await import("vite")).createServer({
      configFile: join(root, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });

// Only this machine's own names: a page on another site that rebinds its domain to 127.0.0.1 is refused.
const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);

createServer((req, res) => {
  if (!hosts.has(req.headers.host ?? "")) {
    res.writeHead(403);
    return void res.end();
  }
  if (req.url?.startsWith("/api/")) return void api(req, res);
  if (vite) return vite.middlewares(req, res);
  try {
    const file = normalize(join(dist, decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname)));
    const target = file.startsWith(dist + sep) && existsSync(file) && extname(file) ? file : join(dist, "index.html");
    const body = readFileSync(target);
    res.writeHead(200, { "content-type": types[extname(target)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found (run npm run build first?)");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Simulora on http://127.0.0.1:${port}${fake ? " (fake model)" : ` (story: ${storyModel})`}`);
});
