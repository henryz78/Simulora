import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { Accounts } from "./accounts.ts";
import { createApi } from "./app.ts";
import { Store } from "./db.ts";
import { Gate } from "./gate.ts";
import { smtpMailer } from "./mail.ts";
import { fakeModel, openAICompatibleModel } from "./model.ts";

const root = resolve(import.meta.dirname, "..");
// "--public": the site on the internet, behind a Cloudflare Tunnel, with accounts. Otherwise one player's game on
// their own machine, with no sign-in, which is why it must never be reachable from outside.
const pub = process.argv.includes("--public");
const prod = pub || process.argv.includes("--prod");
const fake = process.argv.includes("--fake");
const port = Number(process.env.SIMULORA_PORT ?? 5170);
const site = process.env.SITE_URL;
const stop = (message: string) => {
  console.error(message);
  process.exit(1);
};
if (site && !pub) stop("SITE_URL is set, so this is the public server: start it with --public");
if (pub && !site) stop("--public needs SITE_URL, the address players open (https://...)");
// The session cookie is sent over HTTPS only; plain http is for trying the public mode on this machine.
if (site && new URL(site).protocol !== "https:" && !["localhost", "127.0.0.1"].includes(new URL(site).hostname))
  stop("SITE_URL must start with https://");
if (pub && !process.env.ADMIN_EMAIL) stop("--public needs ADMIN_EMAIL, the admin's sign-in address");

const data = process.env.SIMULORA_DATA ?? join(root, "data");
mkdirSync(data, { recursive: true });
const store = new Store(join(data, fake ? "fake.db" : "simulora.db"));
store.deleteOrphans();
let accounts: Accounts | undefined;
if (pub) {
  // The key that signs sign-in codes and sessions: made once, kept beside the database, readable by this user only.
  const keyFile = join(data, "session.key");
  if (!existsSync(keyFile)) writeFileSync(keyFile, randomBytes(32), { mode: 0o600 });
  accounts = new Accounts(store.sql, {
    key: readFileSync(keyFile),
    send: fake
      ? async (to, subject) => console.log("mail.fake", to, subject)
      : smtpMailer(process.env.SIMULORA_SMTP_FILE ?? join(root, ".smtp.txt")),
    admin: process.env.ADMIN_EMAIL!,
    ...(process.env.SIMULORA_MAIL_DOMAINS ? { domains: process.env.SIMULORA_MAIL_DOMAINS.split(",") } : {}),
    ...(process.env.SIMULORA_MAIL_PER_DAY ? { mailPerDay: Number(process.env.SIMULORA_MAIL_PER_DAY) } : {}),
    ...(process.env.SIMULORA_POINTS ? { points: Number(process.env.SIMULORA_POINTS) } : {}),
  });
  accounts.deleteOwnerless();
  store.deleteOrphans();
}
// Every request to the provider waits its turn here: a few at a time, a ceiling a minute, and on the public site the
// day's allowance (ModelScope gives about 2000 a day; the rest is kept for work under way and for tomorrow's start).
const env = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return process.env[name] && Number.isFinite(value) && value > 0 ? value : fallback;
};
store.sql.exec("create table if not exists model_calls (day text primary key, count integer not null)");
const gate = new Gate({
  slots: env("SIMULORA_SLOTS", 3),
  perMinute: env("SIMULORA_PER_MINUTE", 20),
  dayLimit: env("SIMULORA_DAY_LIMIT", pub ? 1800 : Infinity),
  remember: {
    read: (day) => (store.sql.prepare("select count from model_calls where day = ?").get(day) as { count: number } | undefined)?.count ?? 0,
    write: (day, count) =>
      void store.sql
        .prepare("insert into model_calls (day, count) values (?, ?) on conflict (day) do update set count = excluded.count")
        .run(day, count),
  },
});
// The story and the records of what changed can use different models.
const live = (model: string, reasoning: string) =>
  openAICompatibleModel({ profilePath: join(root, ".secret.txt"), model, reasoning, gate });
// DeepSeek-V4.1-Flash wrote the liveliest scenes in the 2026-10-17 comparison; since 2026-10-19 the provider serves
// only its 1017 version. Without thinking ("none") its first words come in about 3 s instead of 30-60 s, and the
// prose is as good. The records and the buried secrets think a little ("low"): without thinking they mark hinted
// secrets as revealed and bury the same secret twice; at the default they take 50 s to over 100 s,
// long enough for the gateway to give up (2026-10-18).
const storyModel = process.env.SIMULORA_MODEL ?? "ModelScope/deepseek-ai/DeepSeek-V4.1-Flash-1017";
const story = fake ? fakeModel() : live(storyModel, process.env.SIMULORA_REASONING ?? "none");
const records = fake
  ? story
  : live(process.env.SIMULORA_RECORD_MODEL ?? storyModel, process.env.SIMULORA_RECORD_REASONING ?? "low");
const model = { stream: story.stream, json: records.json };
// The "deep thinking" setting: the same model at the provider's default effort.
const thinker = fake ? story : live(storyModel, process.env.SIMULORA_THINKING_REASONING ?? "");
// The latest warnings (a failed model request, a mail that did not go), kept for the admin page as well as the log.
// ponytail: in memory, so a restart forgets them; the full record is the system log (journalctl -u simulora).
const problems: { at: number; text: string }[] = [];
const warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const text = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
  // A provider's error may quote part of a key; the page shows it masked.
  problems.unshift({ at: Date.now(), text: text.replace(/(sk|ms)-[\w-]{6,}|Bearer\s+\S+/gi, "***").slice(0, 500) });
  problems.length = Math.min(problems.length, 50);
  warn(...args);
};
const api = createApi(store, model, { thinker, writer: story, accounts, gate, problems });

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
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

// Only the site's own name: on this machine its local names, so a page on another site that rebinds its domain to
// 127.0.0.1 is refused; on the internet, the public address.
const hosts = new Set(site ? [new URL(site).host] : [`127.0.0.1:${port}`, `localhost:${port}`]);
const origin = site ? new URL(site).origin : null;
const proxied = ["cf-connecting-ip", "cf-ray", "x-forwarded-for"];

createServer((req, res) => {
  const refuse = () => {
    res.writeHead(403);
    res.end();
  };
  if (!hosts.has(req.headers.host ?? "")) return refuse();
  // A request through a proxy or tunnel to the local game would get in with no sign-in.
  if (!pub && proxied.some((h) => req.headers[h] !== undefined)) return refuse();
  // A change asked from another site's page.
  if (pub && req.method !== "GET" && req.method !== "HEAD" && req.headers.origin !== origin) return refuse();
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("content-security-policy", "frame-ancestors 'none'");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "same-origin");
  if (req.url?.startsWith("/api/")) return void api(req, res);
  if (vite) return vite.middlewares(req, res);
  try {
    const file = normalize(join(dist, decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname)));
    const target = file.startsWith(dist + sep) && existsSync(file) && extname(file) ? file : join(dist, "index.html");
    const body = readFileSync(target);
    res.writeHead(200, {
      "content-type": types[extname(target)] ?? "application/octet-stream",
      // Built files carry a hash in their names; the page itself is checked every time, so an update shows at once.
      "cache-control": target.includes(`${sep}assets${sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found (run npm run build first?)");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(
    `Simulora on http://127.0.0.1:${port}${pub ? ` for ${site}` : ""}${fake ? " (fake model)" : ` (story: ${storyModel})`}`,
  );
});
