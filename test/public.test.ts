// The public site: the sign-in flow through the API, and the server's own guards in front of it.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { World } from "../shared/types.ts";
import { Accounts, SESSION_COOKIE } from "../server/accounts.ts";
import { createApi } from "../server/app.ts";
import { Store } from "../server/db.ts";
import { fakeModel } from "../server/model.ts";

test("on the public site, everything but signing in and the samples needs an account", async () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  const codes: string[] = [];
  const accounts = new Accounts(store.sql, {
    key: Buffer.alloc(32, 1),
    admin: "boss@qq.com",
    send: async (_to, subject) => void codes.push(/\d{6}/.exec(subject)![0]),
  });
  const api = createApi(store, fakeModel(), { accounts });
  const server = createServer((req, res) => void api(req, res));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  let cookie = "";
  const call = (method: string, path: string, body?: unknown) =>
    fetch(base + path, {
      method,
      headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4", cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    assert.equal((await call("GET", "/worlds")).status, 401);
    assert.equal((await call("POST", "/worlds", {})).status, 401);
    assert.equal((await call("GET", "/samples")).status, 200);
    assert.deepEqual(await (await call("GET", "/auth/me")).json(), { mode: "public", user: null });

    const [invite] = accounts.createInvites(1);
    assert.equal((await call("POST", "/auth/code", { email: "p@163.com", invite })).status, 200);
    const wrong = await call("POST", "/auth/verify", { email: "p@163.com", code: "x", invite });
    assert.equal(wrong.status, 400);
    const ok = await call("POST", "/auth/verify", { email: "p@163.com", code: codes.at(-1), invite });
    assert.equal(ok.status, 200);
    const set = ok.headers.get("set-cookie") ?? "";
    assert.match(set, new RegExp(`^${SESSION_COOKIE}=[\\w-]{40,}; Path=/; HttpOnly; Secure; SameSite=Lax`));
    assert.equal(ok.headers.get("cache-control"), "no-store");
    cookie = set.split(";")[0]!;
    assert.deepEqual(await (await call("GET", "/auth/me")).json(), { mode: "public", user: { email: "p@163.com", role: "player" } });

    // Their own world, gone with the account once they confirm with their address.
    const world = (await (await call("POST", `/samples/${(await (await call("GET", "/samples")).json())[0].id}/copy`)).json()) as World;
    assert.equal((await call("GET", `/worlds/${world.id}`)).status, 200);
    assert.equal((await call("DELETE", "/auth/me", { email: "someone@163.com" })).status, 400);
    const gone = await call("DELETE", "/auth/me", { email: "P@163.com" });
    assert.equal(gone.status, 200);
    assert.match(gone.headers.get("set-cookie") ?? "", /Max-Age=0/);
    assert.equal(store.world(world.id), undefined);
    assert.equal((await call("GET", "/worlds")).status, 401, "the old cookie no longer works");
  } finally {
    server.close();
  }
});

/** Starts the real server with these arguments and environment; resolves once it listens, or with its exit code. */
async function start(args: string[], env: Record<string, string>) {
  const port = 20_000 + Math.floor(Math.random() * 20_000);
  const child = spawn(process.execPath, ["--disable-warning=ExperimentalWarning", "server/main.ts", "--fake", ...args], {
    env: { ...process.env, SIMULORA_PORT: String(port), SIMULORA_DATA: mkdtempSync(join(tmpdir(), "simulora-")), ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = await new Promise<number | "up">((done) => {
    child.stdout.on("data", (chunk: Buffer) => chunk.toString().includes("Simulora on") && done("up"));
    child.on("exit", (code) => done(code ?? -1));
  });
  return { port, result, stop: () => child.kill() };
}

test("the local game refuses anything that came through a proxy, and will not start with a public address", async () => {
  const local = await start([], { SITE_URL: "" });
  try {
    assert.equal(local.result, "up");
    const url = `http://127.0.0.1:${local.port}/api/auth/me`;
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url, { headers: { "cf-connecting-ip": "1.2.3.4" } })).status, 403);
    assert.equal((await fetch(url, { headers: { "x-forwarded-for": "1.2.3.4" } })).status, 403);
  } finally {
    local.stop();
  }
  assert.equal((await start([], { SITE_URL: "https://play.example.com" })).result, 1);
  assert.equal((await start(["--public"], { SITE_URL: "" })).result, 1);
});

/** fetch will not send a Host header of our choosing; node:http will. */
const ask = (url: string, headers: Record<string, string>, body?: string) =>
  new Promise<{ status: number; headers: Record<string, unknown> }>((done, failed) => {
    const req = request(url, { method: body === undefined ? "GET" : "POST", headers }, (res) => {
      res.resume();
      done({ status: res.statusCode!, headers: res.headers });
    });
    req.on("error", failed);
    req.end(body);
  });

test("the public server answers only its own address, and changes only from its own pages", async () => {
  const site = "https://play.example.com";
  const server = await start(["--public"], { SITE_URL: site, ADMIN_EMAIL: "boss@qq.com" });
  try {
    assert.equal(server.result, "up");
    const url = (path: string) => `http://127.0.0.1:${server.port}${path}`;
    const host = { host: "play.example.com" };
    assert.equal((await ask(url("/api/samples"), {})).status, 403, "wrong host");
    const samples = await ask(url("/api/samples"), host);
    assert.equal(samples.status, 200);
    assert.equal(samples.headers["x-frame-options"], "DENY");
    assert.equal((await ask(url("/api/worlds"), host)).status, 401);
    const post = (origin: string) =>
      ask(
        url("/api/auth/code"),
        { ...host, origin, "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" },
        JSON.stringify({ email: "x@qq.com" }),
      );
    assert.equal((await post("https://evil.example.com")).status, 403);
    assert.equal((await post(site)).status, 200);
  } finally {
    server.stop();
  }
});
