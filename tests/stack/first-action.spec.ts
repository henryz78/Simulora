import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectAccessible } from "../e2e/support/accessibility.js";

// IP-10.2: journeys through the real API, worker and database with the
// deterministic adapter; nothing here is a transport fixture.

/** Studio premise → playable Revision → "Begin play"; returns the World and Continuity. */
async function beginNewWorld(page: Page, testInfo: TestInfo) {
  await page.goto("/worlds/new");
  await page.getByLabel("World title").fill(`Stack journey ${testInfo.project.name} ${Date.now()}`);
  await page.getByRole("button", { name: "Create Draft" }).click();
  await expect(page).toHaveURL(/\/worlds\/[0-9a-f-]+\/studio$/);
  const worldId = /\/worlds\/([0-9a-f-]+)\/studio$/.exec(page.url())![1]!;
  return playFromStudio(page, worldId);
}

/** Studio → playable Revision → "Begin play" for an existing Draft. */
async function playFromStudio(page: Page, worldId: string) {
  if (!page.url().endsWith(`/worlds/${worldId}/studio`))
    await page.goto(`/worlds/${worldId}/studio`);
  await page.getByRole("button", { name: "Check playability" }).click();
  await expect(page.getByText("Playable shape accepted")).toBeVisible();
  await page.getByRole("button", { name: "Create playable Revision" }).click();
  await expect(page.getByRole("status")).toContainText("Revision 1 created");
  await page.getByRole("button", { name: "Begin play" }).click();
  await expect(page).toHaveURL(/\/continuities\/[0-9a-f-]+$/);
  const continuityId = /\/continuities\/([0-9a-f-]+)$/.exec(page.url())![1]!;
  return { worldId, continuityId };
}

async function confirmFirstAction(page: Page, intent: string) {
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill(intent);
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  // Names, never raw identifiers, describe who answers and what would change.
  // PX-2b: an Action that addresses no Character is answered by the world.
  await expect(page.getByText("World response", { exact: true })).toBeVisible();
  await expect(page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-/)).toHaveCount(0);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
}

test("a new World reaches its first confirmed Action and Return on the real stack", async ({
  page,
}, testInfo) => {
  const { continuityId } = await beginNewWorld(page, testInfo);
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Look around the starting place.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();

  // What was confirmed survives a reload and is what Return reports.
  await page.reload();
  const recorded = page.getByRole("heading", { name: "Story so far" }).locator("..");
  await expect(recorded.getByRole("listitem")).toHaveCount(1);
  // PX-1: after reload the recorded turn still shows the reply it received.
  await expect(recorded.getByRole("listitem").locator("span")).not.toBeEmpty();
  await page.goto(`/continuities/${continuityId}/return`);
  await expect(page.getByText(/Look around the starting place/).first()).toBeVisible();
  await expectAccessible(page);

  // PX-1: the home page leads back into this Continuity.
  await page.goto("/");
  const playing = page.getByRole("heading", { name: "Continue playing" }).locator("..");
  await expect(playing.locator(`a[href="/continuities/${continuityId}"]`)).toHaveCount(1);
  await expectAccessible(page);
});

test("Action, Correction, Branch, Restore and export compose on one World", async ({
  page,
}, testInfo) => {
  const { worldId, continuityId } = await beginNewWorld(page, testInfo);
  await confirmFirstAction(page, "Ask the guide what changed overnight.");

  // Correction of the fact the Action changed, through its own exact review.
  await page.goto(`/continuities/${continuityId}/continuity`);
  await page
    .getByRole("region", { name: "Facts that are accessible here" })
    .getByRole("link", { name: /Ask the guide what changed overnight/ })
    .click();
  await page.getByRole("link", { name: "Correct this fact" }).click();
  await page.getByLabel("Exact replacement statement").fill("The guide saw nothing change.");
  await page.getByLabel("Reason for this direct correction").fill("The guide was asleep.");
  await page.getByRole("button", { name: "Review exact correction" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await page.goto(`/continuities/${continuityId}`);
  const context = page.getByLabel("Current world context");
  await expect(context.getByText("The guide saw nothing change.")).toBeVisible();

  // A separate Branch leaves this path alone; Restore appends the opening state.
  await page.goto(`/continuities/${continuityId}/recovery`);
  await page.getByRole("button", { name: "Create Safe Point" }).click();
  await expect(page.getByText("Safe Point recorded as a reference")).toBeVisible();
  await page.getByRole("button", { name: "Create separate Branch" }).click();
  await expect(page.getByText("Separate Branch created")).toBeVisible();
  const restoreFrom = page.getByLabel("Restore from");
  const opening = restoreFrom.locator("option").last();
  await restoreFrom.selectOption(await opening.getAttribute("value"));
  await page.getByRole("button", { name: "Review Restore scope" }).click();
  await expect(page.getByRole("region", { name: "Exact Restore review" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm exact Restore" }).click();
  await expect(page.getByText(/Restore recorded as/).first()).toBeVisible();
  await page.goto(`/continuities/${continuityId}`);
  await expect(context.getByText("The first scene is ready to unfold.")).toBeVisible();
  // Restore appends; the Action and Correction remain in recorded history.
  const recorded = page.getByRole("heading", { name: "Story so far" }).locator("..");
  await expect(recorded).toContainText("Ask the guide what changed overnight.");

  // The same World exports through the real worker and object store.
  await page.goto(`/worlds/${worldId}/trust`);
  await expect(page.getByText("You own this World.")).toBeVisible();
  await page.getByRole("button", { name: "Review export usage" }).click();
  await page.getByRole("button", { name: "Create selected export" }).click();
  await expect(page.getByRole("link", { name: "Download ZIP" })).toBeVisible({ timeout: 30000 });
  await expectAccessible(page);
});

// E2E-CONTINUITY-IMPACT (Validation §4.1) for the implemented rows. The World is
// created through the formal API, which also proves an API-authored World plays;
// SA-1 below authors the same kinds of field in Studio. Everything after that is
// the browser.
const place = "location.tidal-observatory";
const signal = "fact.western-signal-dim";
const person = (id: string, name: string, role: string) => ({
  id,
  name,
  role,
  locationId: place,
  motives: ["Keep the harbor safe in the fog."],
  stance: `${name} will not light an unsafe signal.`,
  knowledgeFactIds: [signal],
});
const impactWorld = (title: string) => ({
  schemaVersion: 1,
  title,
  premise: "A tidal observatory keeps a coastal settlement oriented through persistent fog.",
  startingSituation: "The western signal has dimmed while an unfamiliar vessel waits.",
  userRole: {
    name: "Observatory keeper",
    authorityBoundary:
      "The world may respond and develop, but it never authors the keeper's speech or irreversible commitments.",
  },
  locations: [{ id: place, name: "Tidal Observatory", description: "A salt-dark tower." }],
  characters: [
    person("character.iora", "Iora", "Harbor signaler"),
    person("character.tavi", "Tavi", "Lamp runner"),
    person("character.maren", "Maren", "Pilot"),
  ],
  facts: [
    {
      id: signal,
      statement: "The western signal is dim.",
      scope: "SHARED",
      provenance: "Original World seed",
      lifecycle: "ACTIVE",
    },
  ],
  // Tavi's first scaled relationship is protected; Iora's is routine.
  relationships: [
    {
      id: "relationship.tavi-maren-oath",
      fromCharacterId: "character.tavi",
      toCharacterId: "character.maren",
      description: "Whether Tavi has sworn to keep Maren's lamp.",
      protection: "PROTECTED",
      scale: ["unsworn", "sworn"],
      initialState: "unsworn",
    },
    {
      id: "relationship.iora-tavi",
      fromCharacterId: "character.iora",
      toCharacterId: "character.tavi",
      description: "Iora is training Tavi to read the markers.",
      protection: "ROUTINE",
      scale: ["wary", "cordial", "trusting"],
      initialState: "wary",
    },
  ],
  threads: [{ id: "thread.vessel", title: "Why the unfamiliar vessel waits" }],
  interactionPaths: ["Inspect the signal, speak with Iora, or watch the vessel."],
  interactionBoundaries: ["The world never authors user speech."],
  objectives: [],
});

type Trace = {
  commits: Array<{ id: string; sourceClass: string; events: Array<{ type: string }> }>;
};

test("a caused change, a protected refusal and a correction agree across review, Trace, Explanation and Return", async ({
  page,
}, testInfo) => {
  const created = await page.request.post("/v1/worlds", {
    data: { document: impactWorld(`Continuity impact ${testInfo.project.name} ${Date.now()}`) },
  });
  expect(created.status()).toBe(201);
  const { worldId } = (await created.json()) as { worldId: string };
  const { continuityId } = await playFromStudio(page, worldId);
  const context = page.getByLabel("Current world context");
  const relationships = context.getByRole("list", { name: "Relationships" });
  const review = page.locator(".proposal-review");
  const send = async (character: string | null, outcome: string, intent: string) => {
    if (character) await page.getByLabel("Address a character").selectOption(character);
    await page.getByLabel("Desired outcome").selectOption(outcome);
    await page.getByLabel("Your Action").fill(intent);
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  };

  // 1. A routine L2 change: exact review, no change before confirmation, then committed.
  await send("character.iora", "RELATIONSHIP_EFFECT", "Show Tavi how to read the outer markers.");
  await expect(review).toContainText("Relationship · Iora and Tavi");
  await expect(review).toContainText("A small, everyday change");
  await expect(relationships).toContainText("wary");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(relationships).toContainText("cordial");

  // 2. A protected relationship is never changed as routine: it asks for L3, and cancelling leaves it.
  await send("character.tavi", "RELATIONSHIP_EFFECT", "Ask Tavi to swear to keep Maren's lamp.");
  await expect(review).toContainText("Relationship · Tavi and Maren");
  await expect(review).toContainText("An important change — review it carefully");
  await page.getByRole("button", { name: "Cancel Action" }).click();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
  await expect(relationships).toContainText("unsworn");

  // 3. A thread resolves from a caused Action.
  await send(null, "THREAD_EFFECT:thread.vessel", "Ask the vessel what it carries.");
  await expect(review).toContainText("Story thread");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(context.getByRole("list", { name: "Story threads" })).toContainText(
    "Resolved · Why the unfamiliar vessel waits",
  );

  // 4. A direct correction through the fact's Explanation.
  await page.goto(`/continuities/${continuityId}/continuity`);
  await page.getByRole("link", { name: /The western signal is dim/ }).click();
  await page.getByRole("link", { name: "Correct this fact" }).click();
  await page
    .getByLabel("Exact replacement statement")
    .fill("The western signal was relit at dusk.");
  await page.getByLabel("Reason for this direct correction").fill("The keeper relit it.");
  await page.getByRole("button", { name: "Review exact correction" }).click();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await page.goto(`/continuities/${continuityId}`);
  await expect(context.getByText("The western signal was relit at dusk.")).toBeVisible();

  // Source, cause and impact agree: one Commit per confirmed change, none for the cancel.
  const state = (await (
    await page.request.get(`/v1/continuities/${continuityId}/state`)
  ).json()) as { continuity: { branchId: string; headCommitId: string } };
  const branchId = state.continuity.branchId;
  const trace = (await (
    await page.request.get(`/v1/branches/${branchId}/commits`)
  ).json()) as Trace;
  const withEvent = (type: string) =>
    trace.commits.filter((commit) => commit.events.some((event) => event.type === type));
  expect(withEvent("RELATIONSHIP_SHIFTED")).toHaveLength(1);
  expect(withEvent("THREAD_RESOLVED")).toHaveLength(1);
  const corrected = withEvent("CONTINUITY_ITEM_CORRECTED");
  expect(corrected).toHaveLength(1);
  expect(corrected[0]!.id).toBe(state.continuity.headCommitId);
  const actions = (await (await page.request.get(`/v1/branches/${branchId}/actions`)).json()) as {
    actions: Array<{ status: string }>;
  };
  expect(actions.actions.map((action) => action.status).sort()).toEqual([
    "CANCELLED",
    "COMMITTED",
    "COMMITTED",
    "COMMITTED",
  ]);
  const shift = withEvent("RELATIONSHIP_SHIFTED")[0]!;
  const shiftExplanation = (await (
    await page.request.get(`/v1/branches/${branchId}/explanations/commit/${shift.id}`)
  ).json()) as { source: { class: string; commitId: string }; target: { current: boolean } };
  expect(shiftExplanation.source).toEqual({ class: shift.sourceClass, commitId: shift.id });
  expect(shiftExplanation.target.current).toBe(false);

  // The fact's Explanation names the correction Commit as its source.
  await page.goto(`/continuities/${continuityId}/continuity`);
  await page.getByRole("link", { name: /The western signal was relit at dusk/ }).click();
  const provenance = page.getByRole("region", { name: "Why it is available here" });
  await expect(provenance).toContainText(corrected[0]!.id.slice(0, 8));
  await expect(provenance).toContainText("SHARED");
  await expect(provenance).toContainText("Current projection");

  // The Continuity history links each confirmed Action to its own Commit.
  await page.goto(`/continuities/${continuityId}/continuity`);
  await expect(
    page.getByRole("link", { name: /Show Tavi how to read the outer markers/ }),
  ).toContainText(shift.id.slice(0, 8));
  await expect(page.getByText("Ask Tavi to swear to keep Maren's lamp.")).toHaveCount(0);

  // Change Trace says what changed, to what and from which Action, by name.
  await page.getByRole("link", { name: /Show Tavi how to read the outer markers/ }).click();
  const traceCard = page.getByRole("region", { name: "Change Trace" });
  const shiftEntry = traceCard
    .locator(".trace-list > li")
    .filter({ hasText: "changed from wary to cordial" });
  await expect(shiftEntry).toContainText(
    "From your Action: Show Tavi how to read the outer markers.",
  );
  await expect(shiftEntry).toContainText("Relationship · Iora and Tavi");
  await expect(traceCard).toContainText("A story thread was resolved by the recorded Action");
  await expect(traceCard.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-/)).toHaveCount(0);
  const traced = (await (await page.request.get(`/v1/branches/${branchId}/commits`)).json()) as {
    commits: Array<{ events: Array<{ type: string; targetId?: string; summary: string }> }>;
  };
  const events = traced.commits.flatMap((commit) => commit.events);
  expect(events.find((event) => event.type === "RELATIONSHIP_SHIFTED")).toMatchObject({
    targetId: "relationship.iora-tavi",
    summary: "A relationship changed from wary to cordial, caused by the recorded Action.",
  });
  expect(events.find((event) => event.type === "THREAD_RESOLVED")?.targetId).toBe("thread.vessel");

  // Return reports the same current truth once its projection catches up.
  await expect(async () => {
    await page.goto(`/continuities/${continuityId}/return`);
    await expect(page.getByText("Current projection")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20000 });
  await expect(page.getByText("The western signal was relit at dusk.").first()).toBeVisible();
  const returned = page.getByRole("list", { name: "Relationships" });
  await expect(returned).toContainText("now cordial");
  await expect(returned).toContainText("now unsworn");
  await expect(page.getByRole("list", { name: "Story threads" })).toContainText(
    "Resolved · Why the unfamiliar vessel waits",
  );
  await expectAccessible(page);
});

// SA-1: the same kinds of change on a World authored entirely in Studio, with
// no API-created document.
test("a World authored only in Studio plays relationship states, a thread and a rule", async ({
  page,
}, testInfo) => {
  await page.goto("/worlds/new");
  await page
    .getByLabel("World title")
    .fill(`Studio authored ${testInfo.project.name} ${Date.now()}`);
  await page.getByRole("button", { name: "Create Draft" }).click();
  await expect(page).toHaveURL(/\/worlds\/[0-9a-f-]+\/studio$/);
  const worldId = /\/worlds\/([0-9a-f-]+)\/studio$/.exec(page.url())![1]!;
  await page.getByRole("button", { name: "Add Character" }).click();
  await page.getByRole("button", { name: "Add Character" }).click();
  // A Character can be addressed only about what it knows (RE-2 authorized context).
  await page
    .getByRole("group", { name: "Character 3", exact: true })
    .getByLabel("The first scene is ready to unfold.")
    .check();
  await page.getByText("Facts, routes, relationships and boundaries").click();
  await page.getByRole("button", { name: "Add relationship" }).click();
  await page.getByRole("button", { name: "Add relationship" }).click();

  // Character 3's only scaled relationship is protected; the guide's is routine.
  const oath = page.getByRole("group", { name: "Relationship 1", exact: true });
  await oath.getByLabel(/^From/).selectOption({ label: "Character 3" });
  await oath.getByLabel("Yes, it can move between named states").check();
  await oath.getByRole("textbox", { name: "State 1", exact: true }).fill("unsworn");
  await oath.getByRole("textbox", { name: "State 2", exact: true }).fill("sworn");
  await oath.getByRole("button", { name: "Remove state 3" }).click();
  await oath.getByLabel("Starting state").selectOption("unsworn");
  await expect(oath.getByLabel("How a change is confirmed")).toHaveValue("PROTECTED");
  const trust = page.getByRole("group", { name: "Relationship 2", exact: true });
  await trust.getByLabel("Yes, it can move between named states").check();
  await trust.getByLabel("How a change is confirmed").selectOption("ROUTINE");

  await page.getByRole("button", { name: "Add story thread" }).click();
  await page.getByRole("group", { name: "Thread 1" }).getByLabel("Title").fill("Why the bell rang");
  await page.getByRole("button", { name: "Add world rule" }).click();
  await page
    .getByRole("group", { name: "Rule 1" })
    .getByLabel("Rule")
    .fill("The flooded causeway cannot be crossed.");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  const { continuityId } = await playFromStudio(page, worldId);

  const context = page.getByLabel("Current world context");
  const relationships = context.getByRole("list", { name: "Relationships" });
  const review = page.locator(".proposal-review");
  const send = async (
    character: string | null,
    outcome: string | { label: string },
    intent: string,
  ) => {
    if (character) await page.getByLabel("Address a character").selectOption({ label: character });
    await page.getByLabel("Desired outcome").selectOption(outcome);
    await page.getByLabel("Your Action").fill(intent);
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  };

  // A routine relationship moves one step after an ordinary confirmation.
  await send("A local guide", "RELATIONSHIP_EFFECT", "Share the evening watch with Character 2.");
  await expect(review).toContainText("Relationship · A local guide and Character 2");
  await expect(review).toContainText("A small, everyday change");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(relationships).toContainText("close");

  // The protected one asks for a high-consequence confirmation; cancelling keeps it.
  await send("Character 3", "RELATIONSHIP_EFFECT", "Ask Character 3 to swear the oath.");
  await expect(review).toContainText("An important change — review it carefully");
  await page.getByRole("button", { name: "Cancel Action" }).click();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
  await expect(relationships).toContainText("unsworn");

  // The authored rule and thread reach the played World exactly. A rule shapes
  // an outcome only through movement or a live model: movement needs a
  // revision-bound RE-3 routine policy that Studio does not author (recorded gap).
  const played = (await (
    await page.request.get(`/v1/continuities/${continuityId}/state`)
  ).json()) as {
    world: { constraints?: Array<{ statement: string }>; threads?: Array<{ title: string }> };
  };
  expect(played.world.constraints?.map((rule) => rule.statement)).toEqual([
    "The flooded causeway cannot be crossed.",
  ]);
  expect(played.world.threads?.map((thread) => thread.title)).toEqual(["Why the bell rang"]);

  // The authored thread resolves from a caused Action.
  await send(null, { label: "Work toward resolving: Why the bell rang" }, "Ask who rang it.");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(context.getByRole("list", { name: "Story threads" })).toContainText(
    "Resolved · Why the bell rang",
  );

  await expect(async () => {
    await page.goto(`/continuities/${continuityId}/return`);
    await expect(page.getByText("Current projection")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20000 });
  const returned = page.getByRole("list", { name: "Relationships" });
  await expect(returned).toContainText("now close");
  await expect(returned).toContainText("now unsworn");
  await expect(page.getByRole("list", { name: "Story threads" })).toContainText(
    "Resolved · Why the bell rang",
  );
  await expectAccessible(page);
});

// SA-2: a creator-granted movement on a World authored only in Studio.
test("a Studio World moves a named Character along an opened route, and its rule meets the closed way back", async ({
  page,
}, testInfo) => {
  await page.goto("/worlds/new");
  await page
    .getByLabel("World title")
    .fill(`Studio movement ${testInfo.project.name} ${Date.now()}`);
  await page.getByRole("button", { name: "Create Draft" }).click();
  await expect(page).toHaveURL(/\/worlds\/[0-9a-f-]+\/studio$/);
  const worldId = /\/worlds\/([0-9a-f-]+)\/studio$/.exec(page.url())![1]!;
  await page.getByRole("button", { name: "Add place" }).click();
  await page.getByRole("button", { name: "Add Character" }).click();
  await page.getByText("Facts, routes, relationships and boundaries").click();
  await page.getByRole("button", { name: "Add route" }).click();
  await page
    .getByRole("group", { name: "Route 1" })
    .getByLabel("Characters above may use this route on their own")
    .check();
  await page.getByRole("group", { name: "Who may move" }).getByLabel("A local guide").check();
  await page.getByRole("button", { name: "Add world rule" }).click();
  await page
    .getByRole("group", { name: "Rule 1" })
    .getByLabel("Rule")
    .fill("The flooded causeway cannot be crossed.");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");

  // Character 2 knows nothing yet: the playability check says so before play.
  await page.getByRole("button", { name: "Check playability" }).click();
  await expect(
    page.getByText("Character 2 does not know anything a player can ask about yet"),
  ).toBeVisible();
  // PX-1: the finding names its Studio area, not an internal path, and quotes cleanly.
  await expect(page.getByText("Optional warning · Character 2")).toBeVisible();
  await expect(page.getByText("knowledgeFactIds")).toHaveCount(0);
  await expect(page.getByText('.".', { exact: false })).toHaveCount(0);
  const { continuityId } = await playFromStudio(page, worldId);

  const where = async (name: string) => {
    const state = (await (
      await page.request.get(`/v1/continuities/${continuityId}/state`)
    ).json()) as {
      world: { locations: Array<{ id: string }> };
      state: { characters: Array<{ name: string; locationId: string }> };
      routineMoverIds: string[];
    };
    return {
      state,
      at: state.state.characters.find((character) => character.name === name)!.locationId,
    };
  };
  const before = await where("A local guide");
  expect(before.state.routineMoverIds).toHaveLength(1);
  const [start, place2] = before.state.world.locations.map((location) => location.id);
  expect(before.at).toBe(start);

  const outcome = page.getByLabel("Desired outcome");
  const move = outcome.locator("option", { hasText: "Have this character move" });
  await page.getByLabel("Address a character").selectOption({ label: "Character 2" });
  await expect(move).toBeDisabled();

  const review = page.locator(".proposal-review");
  const sendMove = async (intent: string) => {
    await page.getByLabel("Address a character").selectOption({ label: "A local guide" });
    await outcome.selectOption("ROUTINE_EFFECT");
    await page.getByLabel("Your Action").fill(intent);
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  };
  await sendMove("Walk the guide to the next place.");
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  expect((await where("A local guide")).at).toBe(place2);

  // The way back was drawn only one way, so the authored rule shapes the outcome.
  await sendMove("Walk the guide back across the causeway.");
  await expect(review).toContainText("World constraint · The flooded causeway cannot be crossed.");
  await page.getByRole("button", { name: "Cancel Action" }).click();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
  expect((await where("A local guide")).at).toBe(place2);
  await expectAccessible(page);
});
