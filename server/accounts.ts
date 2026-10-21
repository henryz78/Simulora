// Accounts for the public site: invite codes, sign-in by a code sent to an email address, and sessions.
// Codes and session tokens are stored only as keyed hashes. Everything here is for `--public`; on this machine
// there is one user and no sign-in.
//
// Asking for a code is answered alike whether or not the address has an account (same status, same limits,
// the email sent after the answer), so nobody learns who is a member. Each address and IP pair has its own code,
// so someone guessing at another's address cannot spoil the code its owner asked for.
import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { isIP } from "node:net";
import type { DatabaseSync } from "node:sqlite";
import type { SendMail } from "./mail.ts";

export const SESSION_COOKIE = "__Host-simulora";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const CODE_TRIES = 5;
const RESEND_SECONDS = 60;
const SENDS_PER_ADDRESS_IP_DAY = 5;
const SENDS_PER_ADDRESS_DAY = 15;
const SENDS_PER_IP_HOUR = 10;
const BAD_INVITES_PER_IP_HOUR = 10;

/** Well-known mailboxes only, so throwaway addresses cannot sign up. */
export const MAIL_DOMAINS = [
  "qq.com", "foxmail.com", "163.com", "126.com", "yeah.net", "sina.com", "sina.cn", "sohu.com", "aliyun.com",
  "139.com", "gmail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com",
  "yahoo.com", "proton.me", "protonmail.com",
];
/** Where "name+tag" reaches the same mailbox as "name". Elsewhere it is another mailbox, or none, so it is refused. */
const PLUS_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "proton.me", "protonmail.com"];

/**
 * The one mailbox an address stands for, or null if it cannot sign up: lower case, without a "+tag" where the
 * mail service ignores one, and for Gmail without the dots, which Gmail ignores. Codes go to this address, so
 * whoever signs in as it can read its mail.
 */
export function canonicalEmail(raw: string, domains: readonly string[] = MAIL_DOMAINS): string | null {
  const trimmed = raw.trim();
  // Plain ASCII only: some letters (the Kelvin sign) lower-case into ASCII ones.
  if (!/^[\x21-\x7e]+$/.test(trimmed)) return null;
  const match = /^([a-z0-9._+-]{1,64})@([a-z0-9.-]{1,253})$/.exec(trimmed.toLowerCase());
  if (!match) return null;
  let [, local = "", domain = ""] = match;
  if (domain === "googlemail.com") domain = "gmail.com";
  if (!domains.includes(domain)) return null;
  if (local.includes("+")) {
    if (!PLUS_DOMAINS.includes(domain)) return null;
    local = local.split("+")[0]!;
  }
  if (domain === "gmail.com") local = local.replaceAll(".", "");
  if (!/^[a-z0-9_-]/.test(local) || local.endsWith(".") || local.includes("..")) return null;
  return `${local}@${domain}`;
}

/** The IP a request came from, as Cloudflare saw it; IPv6 by its /64, which one household or phone holds. */
export function clientIp(req: IncomingMessage): string | null {
  const ip = String(req.headers["cf-connecting-ip"] ?? "").trim();
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return null;
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(ip)?.[1];
  if (v4) return v4; // an IPv4 address written as IPv6
  const [head = "", tail = ""] = ip.split("::");
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...front, ...Array(8 - front.length - back.length).fill("0"), ...back] : front;
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}

export class AccountError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface User {
  id: string;
  email: string;
  role: "player" | "admin";
}

export class Accounts {
  #db: DatabaseSync;
  #key: Buffer;
  #send: SendMail;
  #admin: string | null;
  #domains: readonly string[];
  #mailPerDay: number;
  #points: number;
  #now: () => number;

  constructor(
    db: DatabaseSync,
    {
      key,
      send,
      admin,
      domains = MAIL_DOMAINS,
      // Gmail sends about 500 a day; past this nobody can sign in until tomorrow, but the account stays in good standing.
      mailPerDay = 300,
      // Each player's daily points: a turn is one.
      points = 30,
      now = Date.now,
    }: {
      key: Buffer;
      send: SendMail;
      admin: string;
      domains?: readonly string[];
      mailPerDay?: number;
      points?: number;
      now?: () => number;
    },
  ) {
    this.#db = db;
    this.#key = key;
    this.#send = send;
    this.#domains = domains;
    this.#mailPerDay = mailPerDay;
    this.#points = points;
    this.#now = now;
    this.#admin = canonicalEmail(admin, domains);
    if (!this.#admin) throw new Error("ADMIN_EMAIL is not an address that can sign in");
    db.exec(`
      create table if not exists users (
        id text primary key, email text not null unique, role text not null, status text not null, created_at integer not null);
      create table if not exists usage (user_id text not null, day text not null, points real not null, primary key (user_id, day));
      create table if not exists invites (
        code text primary key, created_at integer not null, reserved_for text, used_by text, used_at integer,
        revoked integer not null default 0);
      create table if not exists login_codes (
        email text not null, ip text not null, mac text not null, expires_at integer not null, tries integer not null,
        sent_at integer not null, day text not null, sends integer not null, primary key (email, ip));
      create table if not exists sessions (token text primary key, user_id text not null, expires_at integer not null);
      create index if not exists sessions_user on sessions (user_id);
      create table if not exists limits (key text primary key, count integer not null);
    `);
    // A player's own daily points, set by the admin; empty means the site's.
    const columns = db.prepare("select name from pragma_table_info('users')").all() as { name: string }[];
    if (!columns.some((c) => c.name === "daily_points")) db.exec("alter table users add column daily_points real");
  }

  #mac = (text: string) => createHmac("sha256", this.#key).update(text).digest("hex");
  #day = () => new Date(this.#now() + 8 * 3600_000).toISOString().slice(0, 10); // Beijing time
  #hour = () => new Date(this.#now()).toISOString().slice(0, 13);

  /** Counts one more under `key`; false once it has passed `max`. */
  #within(key: string, max: number) {
    const row = this.#db
      .prepare("insert into limits (key, count) values (?, 1) on conflict (key) do update set count = count + 1 returning count")
      .get(key) as { count: number };
    return row.count <= max;
  }

  #user = (email: string) =>
    this.#db.prepare("select id, email, role, status from users where email = ?").get(email) as
      | (User & { status: string })
      | undefined;

  /** An invite not yet used, nor held for another address. */
  #inviteOpen = (code: string, email: string) =>
    !!this.#db
      .prepare(
        "select 1 from invites where code = ? and used_by is null and revoked = 0 and (reserved_for is null or reserved_for = ?)",
      )
      .get(code, email);

  /**
   * Sends a sign-in code to an active member, to a newcomer with a good invite (the admin needs none), and to
   * nobody else, answering everyone alike. An invite asked with is held for that address, so one invite cannot
   * send mail to many.
   */
  sendCode(rawEmail: string, rawInvite: string, ip: string | null) {
    if (!ip) throw new AccountError(400, "Cannot tell where this came from");
    // Counts only matter within their hour or day.
    this.#db.prepare("delete from limits where key not like ? and key not like ?").run(`%:${this.#hour()}`, `%:${this.#day()}`);
    const email = canonicalEmail(rawEmail, this.#domains);
    if (!email) throw new AccountError(400, "Use a plain address at a common mailbox, such as QQ, 163, Gmail or Outlook");
    const invite = rawInvite.trim().toUpperCase();
    if (invite && !this.#inviteOpen(invite, email)) {
      if (!this.#within(`invite:${ip}:${this.#hour()}`, BAD_INVITES_PER_IP_HOUR))
        throw new AccountError(429, "Too many tries; wait an hour");
      throw new AccountError(400, "That invite code does not work");
    }
    const row = this.#db.prepare("select sent_at, day, sends from login_codes where email = ? and ip = ?").get(email, ip) as
      | { sent_at: number; day: string; sends: number }
      | undefined;
    if (row && this.#now() - row.sent_at < RESEND_SECONDS * 1000) throw new AccountError(429, "Wait a minute before asking again");
    const sends = row?.day === this.#day() ? row.sends : 0;
    if (sends >= SENDS_PER_ADDRESS_IP_DAY) throw new AccountError(429, "Too many codes today; try again tomorrow");
    if (!this.#within(`send:${ip}:${this.#hour()}`, SENDS_PER_IP_HOUR)) throw new AccountError(429, "Too many codes; wait an hour");
    if (!this.#within(`mail:${email}:${this.#day()}`, SENDS_PER_ADDRESS_DAY))
      throw new AccountError(429, "Too many codes today; try again tomorrow");
    if (!this.#within(`all:${this.#day()}`, this.#mailPerDay))
      throw new AccountError(429, "Sign-in mail is paused for today; try again tomorrow");
    const member = this.#user(email);
    const may = member ? member.status === "active" : !!invite || email === this.#admin;
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    // Kept even when nothing is sent, so the next ask is limited alike; then it holds a code nobody has.
    this.#db
      .prepare(
        `insert into login_codes (email, ip, mac, expires_at, tries, sent_at, day, sends) values (?, ?, ?, ?, 0, ?, ?, ?)
         on conflict (email, ip) do update set mac = excluded.mac, expires_at = excluded.expires_at, tries = 0,
           sent_at = excluded.sent_at, day = excluded.day, sends = excluded.sends`,
      )
      .run(email, ip, this.#mac(`${email}:${may ? code : randomBytes(16).toString("hex")}`), this.#now() + CODE_MINUTES * 60_000,
        this.#now(), this.#day(), sends + 1);
    if (!may) return;
    if (invite && !member) this.#db.prepare("update invites set reserved_for = ? where code = ?").run(email, invite);
    // After the answer: how long the mail takes, or why it failed, tells nobody anything. A failure gives the ask back.
    void this.#send(
      email,
      `Simulora 验证码 ${code}`,
      `你的验证码是 ${code}，${CODE_MINUTES} 分钟内有效。\n\n` +
        `Your Simulora sign-in code is ${code}. It works for ${CODE_MINUTES} minutes.\n\n` +
        "不是你本人操作的话，忽略这封邮件即可。If you did not ask for it, ignore this email.",
    ).catch((error: unknown) => {
      console.warn("mail.failed", error instanceof Error ? error.message : error);
      this.#db.prepare("update login_codes set sent_at = 0, sends = sends - 1 where email = ? and ip = ?").run(email, ip);
    });
  }

  /** Checks a code; a newcomer's account is made, spending the invite, in one go. Returns a session token. */
  verify(rawEmail: string, rawCode: string, rawInvite: string, ip: string | null): { token: string; user: User } {
    const email = canonicalEmail(rawEmail, this.#domains);
    const row =
      email && ip
        ? (this.#db.prepare("select mac, expires_at, tries from login_codes where email = ? and ip = ?").get(email, ip) as
            | { mac: string; expires_at: number; tries: number }
            | undefined)
        : undefined;
    const bad = new AccountError(400, "That code is wrong or has run out; ask for a new one");
    if (!email || !row || row.expires_at < this.#now() || row.tries >= CODE_TRIES) throw bad;
    const given = Buffer.from(this.#mac(`${email}:${rawCode.trim()}`));
    if (!timingSafeEqual(given, Buffer.from(row.mac))) {
      this.#db.prepare("update login_codes set tries = tries + 1 where email = ? and ip = ?").run(email, ip);
      throw bad;
    }
    // Used once; the day's count of codes stays.
    this.#db.prepare("update login_codes set expires_at = 0 where email = ? and ip = ?").run(email, ip);
    let user = this.#user(email);
    if (!user) {
      const invite = rawInvite.trim().toUpperCase();
      const id = randomUUID();
      const role = email === this.#admin ? "admin" : "player";
      this.#db.exec("begin");
      try {
        if (role !== "admin") {
          const spent = this.#db
            .prepare(
              `update invites set used_by = ?, used_at = ? where code = ? and used_by is null and revoked = 0
                 and (reserved_for is null or reserved_for = ?)`,
            )
            .run(id, this.#now(), invite, email);
          if (spent.changes !== 1) throw new AccountError(400, "That invite code does not work");
        }
        this.#db
          .prepare("insert into users (id, email, role, status, created_at) values (?, ?, ?, 'active', ?)")
          .run(id, email, role, this.#now());
        this.#db.exec("commit");
      } catch (error) {
        this.#db.exec("rollback");
        throw error;
      }
      user = { id, email, role, status: "active" };
    }
    if (user.status !== "active") throw bad;
    const token = randomBytes(32).toString("base64url");
    this.#db.prepare("delete from sessions where expires_at <= ?").run(this.#now());
    this.#db
      .prepare("insert into sessions (token, user_id, expires_at) values (?, ?, ?)")
      .run(this.#mac(token), user.id, this.#now() + SESSION_DAYS * 86_400_000);
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  /** The signed-in user of a request, checked on every request so a closed account is out at once. */
  userOf(req: IncomingMessage): User | null {
    const token = tokenOf(req);
    if (!token) return null;
    const row = this.#db
      .prepare(
        `select u.id, u.email, u.role from sessions s join users u on u.id = s.user_id
         where s.token = ? and s.expires_at > ? and u.status = 'active'`,
      )
      .get(this.#mac(token), this.#now()) as User | undefined;
    return row ? { id: row.id, email: row.email, role: row.role } : null;
  }

  /** Today's points: used, and how many a day; the admin's are not counted. */
  points(userId: string): { used: number; limit: number | null } {
    const user = this.#db.prepare("select role, daily_points from users where id = ?").get(userId) as
      | { role: string; daily_points: number | null }
      | undefined;
    const row = this.#db.prepare("select points from usage where user_id = ? and day = ?").get(userId, this.#day()) as
      | { points: number }
      | undefined;
    return { used: row?.points ?? 0, limit: user?.role === "admin" ? null : (user?.daily_points ?? this.#points) };
  }

  /** Takes `cost` points from today's, or refuses; returns the way to give them back if the work comes to nothing. */
  spend(userId: string, cost: number): () => void {
    const { limit } = this.points(userId);
    const day = this.#day();
    this.#db.prepare("insert into usage (user_id, day, points) values (?, ?, 0) on conflict do nothing").run(userId, day);
    const taken = this.#db
      .prepare("update usage set points = points + ? where user_id = ? and day = ? and points + ? <= ?")
      .run(cost, userId, day, cost, limit ?? Number.MAX_SAFE_INTEGER);
    if (taken.changes !== 1) throw new AccountError(429, "Today's points are used up; they come back at midnight, Beijing time");
    let given = false;
    return () => {
      if (given) return;
      given = true;
      this.#db.prepare("update usage set points = max(0, points - ?) where user_id = ? and day = ?").run(cost, userId, day);
    };
  }

  signOut(req: IncomingMessage) {
    const token = tokenOf(req);
    if (token) this.#db.prepare("delete from sessions where token = ?").run(this.#mac(token));
  }

  /** Invite codes for the admin to hand out: 12 letters and digits, none that look alike. */
  createInvites(count: number): string[] {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: count }, () => {
      const code = Array.from({ length: 12 }, () => letters[randomInt(letters.length)]).join("");
      this.#db.prepare("insert into invites (code, created_at) values (?, ?)").run(code, this.#now());
      return code;
    });
  }

  /** What the admin page shows: every account with today's points, every invite, and today's sign-in mail. */
  overview() {
    const users = (
      this.#db
        .prepare("select id, email, role, status, created_at, daily_points from users order by created_at desc")
        .all() as { id: string; email: string; role: string; status: string; created_at: number; daily_points: number | null }[]
    ).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
      ownPoints: u.daily_points,
      points: this.points(u.id),
    }));
    const invites = (
      this.#db
        .prepare(
          `select i.code, i.created_at, i.reserved_for, i.used_by, i.used_at, i.revoked, u.email from invites i
           left join users u on u.id = i.used_by order by i.created_at desc, i.code`,
        )
        .all() as { code: string; created_at: number; reserved_for: string | null; used_by: string | null; used_at: number | null; revoked: number; email: string | null }[]
    ).map((i) => ({
      code: i.code,
      createdAt: i.created_at,
      // Who asked for a code with it but has not signed in yet.
      heldFor: i.used_by ? null : i.reserved_for,
      usedBy: i.used_by ? (i.email ?? "(deleted)") : null,
      usedAt: i.used_at,
      revoked: !!i.revoked,
    }));
    const asked = this.#db.prepare("select count from limits where key = ?").get(`all:${this.#day()}`) as { count: number } | undefined;
    return { users, invites, mail: { asked: asked?.count ?? 0, limit: this.#mailPerDay } };
  }

  /** An invite not yet used can no longer be. */
  revokeInvite(code: string) {
    const done = this.#db.prepare("update invites set revoked = 1 where code = ? and used_by is null").run(code);
    if (done.changes !== 1) throw new AccountError(400, "Only an unused invite can be withdrawn");
  }

  /** The admin changes a player: their own daily points (null for the site's), or closes or reopens the account. */
  setUser(id: string, change: { points?: number | null; active?: boolean }) {
    const user = this.#db.prepare("select role from users where id = ?").get(id) as { role: string } | undefined;
    if (!user) throw new AccountError(404, "No such player");
    if (user.role === "admin") throw new AccountError(400, "The admin account cannot be changed here");
    if (change.points !== undefined) this.#db.prepare("update users set daily_points = ? where id = ?").run(change.points, id);
    if (change.active !== undefined) {
      this.#db.prepare("update users set status = ? where id = ?").run(change.active ? "active" : "disabled", id);
      // Signed out everywhere at once; a closed account cannot ask for a code either.
      if (!change.active) this.#db.prepare("delete from sessions where user_id = ?").run(id);
    }
  }

  /** The account and what it alone holds; the invite it used stays spent. Its worlds go first, by the caller. */
  deleteUser(id: string) {
    const user = this.#db.prepare("select email, role from users where id = ?").get(id) as
      | { email: string; role: string }
      | undefined;
    if (!user) return;
    if (user.role === "admin") throw new AccountError(400, "The admin account cannot be deleted here");
    this.#db.exec("begin");
    try {
      this.#db.prepare("delete from sessions where user_id = ?").run(id);
      this.#db.prepare("delete from login_codes where email = ?").run(user.email);
      this.#db.prepare("delete from usage where user_id = ?").run(id);
      this.#db.prepare("update invites set used_by = 'deleted', reserved_for = null where used_by = ?").run(id);
      this.#db.prepare("delete from users where id = ?").run(id);
      this.#db.exec("commit");
    } catch (error) {
      this.#db.exec("rollback");
      throw error;
    }
  }

  /** Worlds whose owner is gone: left by a deletion that stopped halfway. */
  deleteOwnerless() {
    this.#db.exec(`delete from worlds where user_id != 'local' and user_id not in (select id from users)`);
  }
}

function tokenOf(req: IncomingMessage): string | null {
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}

/** The Set-Cookie value for a session, or for clearing it. */
export const sessionCookie = (token: string | null) =>
  token
    ? `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}`
    : `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
