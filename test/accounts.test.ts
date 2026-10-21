import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { AccountError, Accounts, canonicalEmail, clientIp, SESSION_COOKIE } from "../server/accounts.ts";
import { Store } from "../server/db.ts";

test("one account per mailbox; codes go to that mailbox", () => {
  assert.equal(canonicalEmail(" Abc@QQ.com "), "abc@qq.com");
  assert.equal(canonicalEmail("a.b.c+x@gmail.com"), "abc@gmail.com");
  assert.equal(canonicalEmail("a.b.c@googlemail.com"), "abc@gmail.com");
  assert.equal(canonicalEmail("Me+game@Outlook.com"), "me@outlook.com", "Outlook delivers +tags to the mailbox");
  assert.equal(canonicalEmail("john.smith@outlook.com"), "john.smith@outlook.com", "outside Gmail a dot is a real difference");
  // Where a +tag is not an alias it may be someone else's mailbox: refused, not merged.
  for (const bad of ["victim+x@qq.com", "x@mailinator.com", "x@sub.qq.com", "a@b@qq.com", "+x@gmail.com", "x y@qq.com",
    "x@qq.com.cn", "@qq.com", "x", "Kevin@qq.com", "a..b@qq.com"])
    assert.equal(canonicalEmail(bad), null, bad);
});

test("an IP is counted by its address, an IPv6 one by its /64", () => {
  const ip = (value: string) => clientIp({ headers: { "cf-connecting-ip": value } } as unknown as IncomingMessage);
  assert.equal(ip("1.2.3.4"), "1.2.3.4");
  assert.equal(ip("2001:db8::1"), ip("2001:db8::2"));
  assert.equal(ip("2001:db8:0:0:5::1"), "2001:db8:0:0::/64");
  assert.equal(ip("::ffff:1.2.3.4"), "1.2.3.4");
  assert.equal(ip("not an ip"), null);
  assert.equal(ip(""), null);
});

function setup(options: { mailPerDay?: number } = {}) {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  const sent: { to: string; code: string }[] = [];
  let clock = Date.UTC(2026, 9, 21, 4);
  const accounts = new Accounts(store.sql, {
    key: Buffer.alloc(32, 7),
    admin: "Boss@QQ.com",
    send: async (to, subject) => void sent.push({ to, code: /\d{6}/.exec(subject)![0] }),
    now: () => clock,
    ...options,
  });
  const lastCode = () => sent.at(-1)!.code;
  const later = (seconds: number) => (clock += seconds * 1000);
  const req = (token?: string) => ({ headers: token ? { cookie: `x=1; ${SESSION_COOKIE}=${token}` } : {} }) as IncomingMessage;
  return { store, accounts, sent, lastCode, later, req };
}

const fails = (work: () => unknown, status: number) => {
  try {
    work();
  } catch (error) {
    assert.ok(error instanceof AccountError, String(error));
    return assert.equal(error.status, status, error.message);
  }
  assert.fail(`expected ${status}`);
};

test("signing up takes an invite, held for one address and used once; codes are single-use", () => {
  const { accounts, sent, lastCode, later, req } = setup();
  const [invite] = accounts.createInvites(1);
  assert.match(invite!, /^[A-Z2-9]{12}$/);
  const ip = "1.2.3.4";

  fails(() => accounts.sendCode("new@qq.com", invite!, null), 400); // no IP: not through the tunnel
  fails(() => accounts.sendCode("new@qq.com", "WRONGWRONG12", ip), 400);
  accounts.sendCode("New@QQ.com", invite!.toLowerCase(), ip);
  assert.equal(sent.at(-1)!.to, "new@qq.com", "the code goes to the mailbox the account stands for");
  // The invite is now held for that address: it cannot mail anyone else.
  fails(() => accounts.sendCode("other@qq.com", invite!, "5.5.5.5"), 400);
  fails(() => accounts.sendCode("new@qq.com", invite!, ip), 429); // within a minute
  fails(() => accounts.verify("new@qq.com", "000000", invite!, ip), 400);
  fails(() => accounts.verify("new@qq.com", lastCode(), invite!, "9.9.9.9"), 400); // a code is for where it was asked
  const { token, user } = accounts.verify("new@qq.com", lastCode(), invite!, ip);
  assert.equal(user.email, "new@qq.com");
  assert.equal(user.role, "player");
  assert.deepEqual(accounts.userOf(req(token)), user);
  assert.equal(accounts.userOf(req("forged")), null);
  fails(() => accounts.verify("new@qq.com", lastCode(), invite!, ip), 400); // used once

  // A member signs in with no invite; signing out ends the session.
  later(61);
  accounts.sendCode("new@qq.com", "", ip);
  assert.ok(accounts.verify("new@qq.com", lastCode(), "", ip).token);
  accounts.signOut(req(token));
  assert.equal(accounts.userOf(req(token)), null);
  // A code runs out after ten minutes.
  later(61);
  accounts.sendCode("new@qq.com", "", ip);
  later(601);
  fails(() => accounts.verify("new@qq.com", lastCode(), "", ip), 400);
});

test("asking for a code tells nobody whether the address has an account", () => {
  const { accounts, sent, lastCode, later } = setup();
  const [invite] = accounts.createInvites(1);
  accounts.sendCode("member@qq.com", invite!, "1.1.1.1");
  accounts.verify("member@qq.com", lastCode(), invite!, "1.1.1.1");
  const before = sent.length;
  later(61);
  // Member and stranger: the same answer to a code, a second ask, and a made-up invite.
  for (const email of ["member@qq.com", "stranger@qq.com"]) {
    assert.doesNotThrow(() => accounts.sendCode(email, "", "2.2.2.2"), email);
    fails(() => accounts.sendCode(email, "", "2.2.2.2"), 429);
    fails(() => accounts.sendCode(email, "AAAAAAAAAAAA", "3.3.3.3"), 400);
  }
  assert.equal(sent.length, before + 1, "only the member was sent a code");
  fails(() => accounts.verify("stranger@qq.com", "123456", "", "2.2.2.2"), 400);
});

test("someone else asking for my address cannot spoil my code", () => {
  const { accounts, lastCode, later } = setup();
  accounts.sendCode("boss@qq.com", "", "1.1.1.1");
  const mine = lastCode();
  later(5);
  accounts.sendCode("boss@qq.com", "", "6.6.6.6"); // from elsewhere
  for (let i = 0; i < 5; i++) fails(() => accounts.verify("boss@qq.com", "999999", "", "6.6.6.6"), 400);
  assert.equal(accounts.verify("boss@qq.com", mine, "", "1.1.1.1").user.role, "admin", "the admin needs no invite");
});

test("limits: five codes a day per address and IP, wrong tries end a code, a day's mail has a ceiling", () => {
  const { accounts, sent, lastCode, later } = setup({ mailPerDay: 7 });
  accounts.sendCode("boss@qq.com", "", "5.6.7.8");
  for (let i = 0; i < 5; i++) fails(() => accounts.verify("boss@qq.com", "999999", "", "5.6.7.8"), 400);
  fails(() => accounts.verify("boss@qq.com", lastCode(), "", "5.6.7.8"), 400);
  for (let i = 0; i < 4; i++) {
    later(61);
    accounts.sendCode("boss@qq.com", "", "5.6.7.8");
  }
  later(61);
  fails(() => accounts.sendCode("boss@qq.com", "", "5.6.7.8"), 429);
  assert.equal(sent.length, 5);
  accounts.sendCode("boss@qq.com", "", "7.7.7.7");
  accounts.sendCode("boss@qq.com", "", "8.8.8.8");
  fails(() => accounts.sendCode("boss@qq.com", "", "9.9.9.9"), 429); // the site's mail for the day
  // Tomorrow (Beijing time) it starts again.
  later(86_400);
  assert.doesNotThrow(() => accounts.sendCode("boss@qq.com", "", "5.6.7.8"));
});

test("a failed email gives the ask back; a closed account is told nothing and sent nothing", async () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  let failing = true;
  const sent: string[] = [];
  const accounts = new Accounts(store.sql, {
    key: Buffer.alloc(32, 3),
    admin: "boss@qq.com",
    send: async (_to, subject) => {
      if (failing) throw new Error("SMTP refused: 535 secret details");
      sent.push(/\d{6}/.exec(subject)![0]);
    },
  });
  accounts.sendCode("boss@qq.com", "", "1.1.1.1");
  await new Promise((done) => setTimeout(done, 10));
  failing = false;
  accounts.sendCode("boss@qq.com", "", "1.1.1.1"); // no minute's wait after a failure
  const admin = accounts.verify("boss@qq.com", sent[0]!, "", "1.1.1.1").user;
  const [invite] = accounts.createInvites(1);
  accounts.sendCode("p@163.com", invite!, "2.2.2.2");
  const player = accounts.verify("p@163.com", sent.at(-1)!, invite!, "2.2.2.2").user;
  store.sql.prepare("update users set status = 'disabled' where id = ?").run(player.id);
  const count = sent.length;
  await new Promise((done) => setTimeout(done, 1));
  assert.doesNotThrow(() => accounts.sendCode("p@163.com", "", "3.3.3.3"));
  assert.equal(sent.length, count);
  fails(() => accounts.deleteUser(admin.id), 400);
});

test("deleting an account ends its sessions; ownerless worlds are swept", () => {
  const { store, accounts, lastCode, req } = setup();
  const [invite] = accounts.createInvites(1);
  accounts.sendCode("gone@163.com", invite!, "9.9.9.9");
  const { token, user } = accounts.verify("gone@163.com", lastCode(), invite!, "9.9.9.9");
  store.putWorld({ id: "w1" } as never, user.id);
  store.putWorld({ id: "w2" } as never, "local");
  accounts.deleteUser(user.id);
  assert.equal(accounts.userOf(req(token)), null);
  accounts.deleteOwnerless();
  assert.equal(store.world("w1"), undefined);
  assert.ok(store.world("w2"), "the local user's worlds stay");
});

test("points: spent before the work, given back once if it comes to nothing; the admin's are not counted", () => {
  const { accounts, lastCode, later } = setup();
  const [invite] = accounts.createInvites(1);
  accounts.sendCode("p@163.com", invite!, "1.1.1.1");
  const player = accounts.verify("p@163.com", lastCode(), invite!, "1.1.1.1").user;
  const refund = accounts.spend(player.id, 29);
  assert.deepEqual(accounts.points(player.id), { used: 29, limit: 30 });
  fails(() => accounts.spend(player.id, 2), 429);
  refund();
  refund();
  assert.equal(accounts.points(player.id).used, 0);
  later(61);
  accounts.sendCode("boss@qq.com", "", "1.1.1.1");
  const admin = accounts.verify("boss@qq.com", lastCode(), "", "1.1.1.1").user;
  accounts.spend(admin.id, 1000);
  assert.equal(accounts.points(admin.id).limit, null);
});

test("a database from before players had their own daily points gains the column, once", () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  store.sql.exec("create table users (id text primary key, email text not null unique, role text not null, status text not null, created_at integer not null)");
  store.sql.exec("insert into users values ('u1', 'old@qq.com', 'player', 'active', 0)");
  const open = () => new Accounts(store.sql, { key: Buffer.alloc(32), admin: "boss@qq.com", send: async () => {}, points: 7 });
  open();
  const accounts = open();
  assert.deepEqual(accounts.points("u1"), { used: 0, limit: 7 });
  accounts.setUser("u1", { points: 3 });
  assert.equal(accounts.points("u1").limit, 3);
});
