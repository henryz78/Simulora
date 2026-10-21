import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Gate } from "../server/gate.ts";
import { openAICompatibleModel } from "../server/model.ts";

test("a failed reply that cannot even be read gives its slot back; 'too many' pauses everyone", async () => {
  const profile = join(mkdtempSync(join(tmpdir(), "simulora-")), "profile.txt");
  writeFileSync(profile, "test-key\nhttps://example.invalid/v1\n");
  const gate = new Gate({ slots: 1, pauseFor: 100 });
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    // A reply whose body breaks off as it is read.
    const body = new ReadableStream({ start: (c) => c.error(new Error("connection reset")) });
    return new Response(body, { status: calls === 1 ? 429 : 500 });
  };
  try {
    const model = openAICompatibleModel({ profilePath: profile, model: "m", reasoning: "", gate });
    await assert.rejects(model.json([{ role: "user", content: "hi" }]));
    assert.equal(calls, 3, "tried three times");
    const leave = await Promise.race([
      gate.enter(),
      new Promise<never>((_, no) => setTimeout(() => no(new Error("the slot was never given back")), 2000)),
    ]);
    leave();
  } finally {
    globalThis.fetch = real;
  }
});
