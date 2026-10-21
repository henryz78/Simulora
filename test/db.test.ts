import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { LOCAL_USER, Store } from "../server/db.ts";

test("worlds made before accounts belong to the local user, and keep their owner when saved again", () => {
  const path = join(mkdtempSync(join(tmpdir(), "simulora-")), "old.db");
  const old = new DatabaseSync(path);
  old.exec("create table worlds (id text primary key, data text not null)");
  old.prepare("insert into worlds (id, data) values (?, ?)").run("w1", JSON.stringify({ id: "w1", title: "Old" }));
  old.close();
  const store = new Store(path);
  assert.deepEqual(store.worlds(LOCAL_USER).map((w) => w.title), ["Old"]);
  assert.equal(store.world("w1", "someone"), undefined);
  store.putWorld({ ...store.world("w1")!, title: "Edited" }, "someone");
  assert.equal(store.world("w1", LOCAL_USER)?.title, "Edited", "a save never moves a world to another owner");
});
