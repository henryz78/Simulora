import { expect, test } from "@playwright/test";
import { expectAccessible, tabTo } from "./support/accessibility.js";

const continuityId = "30000000-0000-4000-8000-000000000001";
const branchId = "30000000-0000-4000-8000-000000000002";
const initialHead = "30000000-0000-4000-8000-000000000003";
const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;
const ledger = "The ledger is sewn into the pilot's coat lining.";
let observedIdempotencyKeys: string[] = [];
let confirmRequests: Array<Record<string, string>> = [];
let restoreRequests: Array<Record<string, string>> = [];

test.beforeEach(async ({ page }, testInfo) => {
  // Routine fixtures return L2 proposals; the others return L3.
  const routine =
    testInfo.title.startsWith("RE-3 routine movement") || testInfo.title.includes("[L2]");
  // The server refuses a Restore whose expected head has moved on.
  const staleUndo = testInfo.title.includes("[stale]");
  // WD-1a: the World records one new fact at L2.
  const added = testInfo.title.includes("[added]");
  // WD-1b: the World reveals an author's secret at L2.
  const revealed = testInfo.title.includes("[revealed]");
  // PX-4b: the story records two changes in one turn, at L2.
  const multi = testInfo.title.includes("[multi]");
  let characterLocation = "location.tidal-observatory";
  observedIdempotencyKeys = [];
  confirmRequests = [];
  restoreRequests = [];
  let head = initialHead;
  let fact = "The western signal is dim.";
  // WD-1b: the author's secret, hidden from the player until play reveals it.
  let ledgerScope = "CONTINUITY_PRIVATE";
  let actionNumber = 0;
  let dropFirstRetryResponse = true;
  const actions = new Map<string, Record<string, unknown>>();
  const actionsByIdempotencyKey = new Map<string, Record<string, unknown>>();
  const history: Array<Record<string, unknown>> = [];

  const worldResponse = (): Record<string, unknown> => ({
    continuity: {
      id: continuityId,
      branchId,
      headCommitId: head,
      stateRevisionId: "30000000-0000-4000-8000-000000000004",
      worldRevisionId: "30000000-0000-4000-8000-000000000005",
      worldRevisionNumber: 1,
    },
    world: {
      schemaVersion: 1,
      title: "Lantern Reach",
      premise: "A tidal observatory keeps a coastal settlement oriented through persistent fog.",
      startingSituation: "The western signal has dimmed while an unfamiliar vessel waits offshore.",
      userRole: {
        name: "Observatory keeper",
        authorityBoundary: "The world never authors user speech.",
      },
      locations: [
        {
          id: "location.tidal-observatory",
          name: "Tidal Observatory",
          description: "A salt-dark tower.",
        },
      ],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.tidal-observatory",
        },
      ],
      facts: [
        {
          id: "fact.signal",
          statement: "The western signal is dim.",
          scope: "SHARED",
          provenance: "Original World seed",
          lifecycle: "ACTIVE",
        },
        ...(revealed
          ? [
              {
                id: "fact.ledger",
                statement: ledger,
                scope: "CONTINUITY_PRIVATE",
                provenance: "Original World seed",
                lifecycle: "ACTIVE",
              },
            ]
          : []),
      ],
      ...(revealed
        ? {
            discoverableFacts: [
              { factId: "fact.ledger", howToFind: "Searching the pilot's coat." },
            ],
          }
        : {}),
      relationships: [],
      interactionPaths: ["Inspect the signal."],
      interactionBoundaries: ["The world never authors user speech."],
      objectives: [],
    },
    state: {
      schemaVersion: 1,
      participation,
      worldClock: {
        turn: actionNumber,
        label: actionNumber ? `After action ${actionNumber}` : "Opening moment",
      },
      locations: [],
      entities: [],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: characterLocation,
          currentState:
            characterLocation === "location.harbor"
              ? "Present at Harbor."
              : "Present at the observatory.",
        },
      ],
      facts: [
        { id: "fact.signal", statement: fact },
        ...(revealed ? [{ id: "fact.ledger", statement: ledger, scope: ledgerScope }] : []),
      ],
      relationships: [],
      openThreads: ["The unfamiliar vessel waits offshore."],
      objectives: [],
      resources: {},
      interactionBoundaries: ["The world never authors user speech."],
      customState: {},
    },
    source: { stateHash: "a".repeat(64) },
  });

  await page.route(`**/v1/continuities/${continuityId}/state**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(worldResponse()),
    }),
  );
  await page.route(`**/v1/branches/${branchId}/actions**`, async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ branchId, actions: history }),
      });
    }
    const input = route.request().postDataJSON() as {
      intent: string;
      expectedHeadCommitId: string;
      idempotencyKey: string;
    };
    observedIdempotencyKeys.push(input.idempotencyKey);
    const existing = actionsByIdempotencyKey.get(input.idempotencyKey);
    if (existing) {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ...existing, proposal: null }),
      });
    }
    actionNumber += 1;
    const actionId = `30000000-0000-4000-8000-${String(actionNumber).padStart(12, "0")}`;
    const proposalId = `31000000-0000-4000-8000-${String(actionNumber).padStart(12, "0")}`;
    const proposalDigest = String(actionNumber).repeat(64).slice(0, 64);
    const changes = [
      {
        target: `fact.${actionId}.1`,
        before: "Nothing recorded yet.",
        after: "The bell rope is cut.",
        scope: "SHARED",
      },
      {
        target: `thread.${actionId}.2`,
        before: "No thread",
        after: "Who cut the rope",
        scope: "SHARED",
      },
    ];
    const base = {
      id: actionId,
      continuityId,
      branchId,
      expectedHeadCommitId: input.expectedHeadCommitId,
      status: "ACKNOWLEDGED",
      intent: input.intent,
      participationExpectation: participation,
      acknowledgedAt: new Date().toISOString(),
      terminalAt: null,
      recoverableWait: false,
      statusReason: null,
      progressUrl: `/v1/actions/${actionId}/progress`,
      eventsUrl: `/v1/actions/${actionId}/events`,
      proposal: {
        id: proposalId,
        digest: proposalDigest,
        expectedHeadCommitId: input.expectedHeadCommitId,
        impact: routine || added || revealed || multi ? "L2" : "L3",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        narrative: `Iora studies the consequence of: ${input.intent}`,
        responseSource:
          added || revealed || multi
            ? { type: "WORLD" }
            : { type: "CHARACTER", characterId: "character.iora" },
        ...(multi ? { displayEffects: changes } : {}),
        displayEffect: multi
          ? changes[0]
          : revealed
            ? {
                target: "fact.ledger",
                before: "Hidden until now.",
                after: ledger,
                scope: "SHARED",
              }
            : added
              ? {
                  target: `fact.${actionId}`,
                  before: "Nothing recorded yet.",
                  after: "A second hull rides low behind the waiting vessel.",
                  scope: "SHARED",
                }
              : {
                  target: routine ? "character.iora" : "fact.signal",
                  before: routine ? characterLocation : fact,
                  after: routine ? "location.harbor" : `Recorded consequence ${actionNumber}.`,
                  scope: "SHARED",
                },
      },
      commit: null,
    };
    actions.set(actionId, base);
    actionsByIdempotencyKey.set(input.idempotencyKey, base);
    history.push({
      id: actionId,
      status: "ACKNOWLEDGED",
      intent: input.intent,
      acknowledgedAt: base.acknowledgedAt,
      committedAt: null,
      narrative: null,
    });
    if (input.intent.startsWith("Retry after lost ACK") && dropFirstRetryResponse) {
      dropFirstRetryResponse = false;
      return route.abort("connectionreset");
    }
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ...base, proposal: null }),
    });
  });
  // PX-2a Undo: the existing Restore endpoints, with the request bodies kept.
  await page.route(`**/v1/branches/${branchId}/restore-proposals`, async (route) => {
    const input = route.request().postDataJSON() as { sourceCommitId: string };
    restoreRequests.push({ step: "prepare", ...input });
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "34000000-0000-4000-8000-000000000001",
        continuityId,
        branchId,
        sourceCommitId: input.sourceCommitId,
        expectedHeadCommitId: head,
        includedSections: ["characters", "facts"],
        excludedSections: [],
        changedSections: ["characters"],
        sectionChanges: [],
        beforeHash: "b".repeat(64),
        sourceHash: "c".repeat(64),
        digest: "d".repeat(64),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: "ACTIVE",
        resultCommitId: null,
      }),
    });
  });
  await page.route(`**/v1/branches/${branchId}/restores`, async (route) => {
    const input = route.request().postDataJSON() as Record<string, string>;
    restoreRequests.push({ step: "confirm", ...input });
    if (staleUndo) {
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ code: "STALE_RESTORE", message: "STALE_RESTORE" }),
      });
    }
    head = "35000000-0000-4000-8000-000000000001";
    characterLocation = "location.tidal-observatory";
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        commitId: head,
        stateRevisionId: "35000000-0000-4000-8000-000000000002",
        resultingHeadCommitId: head,
        committedAt: new Date().toISOString(),
      }),
    });
  });
  await page.route("**/v1/actions/**", async (route) => {
    const url = new URL(route.request().url());
    const segments = url.pathname.split("/");
    const actionId = segments[3]!;
    const action = actions.get(actionId)!;
    if (url.pathname.endsWith("/events")) {
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: "event: heartbeat\ndata: {}\n\n",
      });
    }
    if (url.pathname.endsWith("/confirm")) {
      confirmRequests.push(route.request().postDataJSON() as Record<string, string>);
      const committedHead = `32000000-0000-4000-8000-${String(actionNumber).padStart(12, "0")}`;
      head = committedHead;
      const proposal = action.proposal as { displayEffect: { after: string }; narrative: string };
      if (routine) characterLocation = proposal.displayEffect.after;
      else if (revealed) ledgerScope = "SHARED";
      else fact = proposal.displayEffect.after;
      const committed = {
        ...action,
        status: "COMMITTED",
        terminalAt: new Date().toISOString(),
        commit: {
          id: committedHead,
          resultingHeadCommitId: committedHead,
          stateRevisionId: "33000000-0000-4000-8000-000000000001",
          committedAt: new Date().toISOString(),
        },
      };
      actions.set(actionId, committed);
      const item = history.find((entry) => entry.id === actionId)!;
      item.status = "COMMITTED";
      item.committedAt = committed.terminalAt;
      item.narrative = proposal.narrative;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(committed),
      });
    }
    if (route.request().method() === "GET") {
      if (action.status === "ACKNOWLEDGED") action.status = "AWAITING_CONFIRMATION";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(action),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(action),
    });
  });
});

// Transport fixture only; real sealed proposal and Commit are covered by the PG suite.
test("RE-3 routine movement is provisional, refreshable and does not rewrite facts", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Your Action").fill("Ask Iora to inspect the harbor.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expect(page.getByText("location.harbor", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  const context = page.getByLabel("Current world context");
  await expect(context.getByText("Present at Harbor.", { exact: true })).toBeVisible();
  await expect(context.getByText("The western signal is dim.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
});

test("Action Truth completes twice without confusing proposal and current truth", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Relight the western signal with Iora.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Received and durably recorded.")).toBeVisible();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expect(page.getByText("Character response · Iora")).toBeVisible();
  const worldContext = page.getByLabel("Current world context");
  await expect(worldContext.getByText("The western signal is dim.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(worldContext.getByText("Recorded consequence 1.", { exact: true })).toBeVisible();
  // PX-1: the confirmed reply stays on the page and joins the story so far.
  const reply = "Iora studies the consequence of: Relight the western signal with Iora.";
  await expect(page.locator(".latest-action-panel").getByText(reply)).toBeVisible();
  const story = page.getByRole("heading", { name: "Story so far" }).locator("..");
  await expect(story.getByText(reply)).toBeVisible();

  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Read the waiting vessel's lantern pattern.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  const recordedHistory = page.getByRole("heading", { name: "Story so far" }).locator("..");
  await expect(recordedHistory).toBeVisible();
  await expect(recordedHistory.getByRole("listitem")).toHaveCount(2);
  await expectAccessible(page);
});

test("an unresolved Action is recovered after refresh by durable Action ID", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Inspect the western signal housing.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this exact change" })).toBeVisible();
});

test("reconciles a lost acknowledgement before another Action", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Retry after lost ACK by the western signal.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "The acknowledgement could not be confirmed. Current durable Action state was refreshed; retrying the same intent is safe.",
  );
  await expect(
    page.getByRole("link", {
      name: "Awaiting confirmation · Retry after lost ACK by the western signal.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this exact change" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send Action" })).toBeDisabled();
  expect(observedIdempotencyKeys).toHaveLength(1);
});

test("a keyboard-only person can send, review and confirm an exact Action", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  const intent = page.getByLabel("Your Action");
  await tabTo(page, intent);
  await page.keyboard.type("Relight the western signal using only the keyboard.");
  await tabTo(page, page.getByRole("button", { name: "Send Action" }));
  await page.keyboard.press("Enter");
  // The provisional state is announced as text, not only through colour.
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  const confirm = page.getByRole("button", { name: "Confirm this exact change" });
  await tabTo(page, confirm);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(
    page.getByLabel("Current world context").getByText("Recorded consequence 1.", { exact: true }),
  ).toBeVisible();
  await expectAccessible(page);
});

// PX-4a (ADR-PX4-1): these run in the product default, direct play. The rest of
// the suite starts in Strict mode (see playwright.config.ts) to exercise review.
test.describe("in direct play", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("PX-4a direct play confirms a change without a click, and Undo restores [L2]", async ({
    page,
  }) => {
    await page.goto(`/continuities/${continuityId}`);
    const strict = page.getByLabel("Strict mode: confirm every change myself");
    await expect(strict).not.toBeChecked();
    await page.getByLabel("Your Action").fill("Ask Iora to inspect the harbor.");
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Applied at once. You can undo this turn.")).toBeVisible();
    await expect(page.getByText("This turn changed:")).toBeVisible();
    const context = page.getByLabel("Current world context");
    await expect(context.getByText("Present at Harbor.", { exact: true })).toBeVisible();
    // Exactly the confirmation the button would send, once.
    expect(confirmRequests).toEqual([
      {
        proposalId: "31000000-0000-4000-8000-000000000001",
        proposalDigest: "1".repeat(64),
        expectedHeadCommitId: initialHead,
      },
    ]);
    await expectAccessible(page);

    // Undo restores the head before the change, through the Restore endpoints.
    await page.getByRole("button", { name: "Undo this turn" }).click();
    await expect(context.getByText("Present at the observatory.", { exact: true })).toBeVisible();
    expect(restoreRequests).toEqual([
      { step: "prepare", sourceCommitId: initialHead },
      {
        step: "confirm",
        proposalId: "34000000-0000-4000-8000-000000000001",
        digest: "d".repeat(64),
        expectedHeadCommitId: "32000000-0000-4000-8000-000000000001",
      },
    ]);
    // The head has moved on, so the turn is no longer offered for Undo, and the
    // story says the world went back while keeping what was said.
    await expect(page.getByRole("button", { name: "Undo this turn" })).toHaveCount(0);
    await expect(page.getByText("Undone. The world is back to how it was")).toBeVisible();
    const story = page.getByRole("heading", { name: "Story so far" }).locator("..");
    await expect(story.getByText("Undone: the world went back to before this.")).toBeVisible();
    await expectAccessible(page);

    // Strict mode is the player's and survives a reload.
    await strict.check();
    await page.reload();
    await expect(page.getByLabel("Strict mode: confirm every change myself")).toBeChecked();
  });

  test("PX-4b direct play applies every change of a turn, and Undo restores [multi]", async ({
    page,
  }) => {
    await page.goto(`/continuities/${continuityId}`);
    await page.getByLabel("Your Action").fill("I cut the bell rope and slip away.");
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Applied at once. You can undo this turn.")).toBeVisible();
    const changed = page.locator(".turn-change");
    await expect(changed).toContainText("New in the world: The bell rope is cut.");
    await expect(changed).toContainText("Who cut the rope");
    expect(confirmRequests).toHaveLength(1);
    await page.getByRole("button", { name: "Undo this turn" }).click();
    await expect(page.getByText("Undone. The world is back to how it was")).toBeVisible();
    expect(restoreRequests.map((item) => item.step)).toEqual(["prepare", "confirm"]);
  });

  test("PX-4a direct play applies an important change too", async ({ page }) => {
    await page.goto(`/continuities/${continuityId}`);
    await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
    await page.getByLabel("Your Action").fill("Relight the western signal with Iora.");
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Applied at once. You can undo this turn.")).toBeVisible();
    expect(confirmRequests).toHaveLength(1);
  });

  test("PX-4a Undo that the server refuses leaves the world and says why [L2] [stale]", async ({
    page,
  }) => {
    await page.goto(`/continuities/${continuityId}`);
    await page.getByLabel("Your Action").fill("Ask Iora to inspect the harbor.");
    await page.getByRole("button", { name: "Send Action" }).click();
    await expect(page.getByText("Applied at once. You can undo this turn.")).toBeVisible();
    await page.getByRole("button", { name: "Undo this turn" }).click();
    await expect(page.getByRole("alert")).toContainText("The change could not be undone.");
    const context = page.getByLabel("Current world context");
    await expect(context.getByText("Present at Harbor.", { exact: true })).toBeVisible();
    await expect(page.getByText("Undone: the world went back to before this.")).toHaveCount(0);
  });
});

test("PX-4b a turn with several changes lists each one for review [multi]", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Your Action").fill("I cut the bell rope and slip away.");
  await page.getByRole("button", { name: "Send Action" }).click();
  const review = page.locator("ol.turn-changes");
  await expect(review.getByRole("listitem")).toHaveCount(2);
  await expect(review).toContainText("New in the world: The bell rope is cut.");
  await expect(review).toContainText("Who cut the rope");
  await expect(page.getByText("A small, everyday change")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  const changed = page.locator(".turn-change");
  await expect(changed).toContainText("New in the world: The bell rope is cut.");
  await expect(changed).toContainText("Who cut the rope");
});

test("PX-4a Strict mode leaves every change to the player", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await expect(page.getByLabel("Strict mode: confirm every change myself")).toBeChecked();
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("Relight the western signal with Iora.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByRole("button", { name: "Confirm this exact change" })).toBeVisible();
  await expect(page.getByText("An important change — review it carefully")).toBeVisible();
  expect(confirmRequests).toEqual([]);
});

test("WD-1a a new fact reads as new in the world, not as a before and after [added]", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Desired outcome").selectOption("FACT_REWRITE");
  await page.getByLabel("Your Action").fill("I scan the harbor markers through the glass.");
  await page.getByRole("button", { name: "Send Action" }).click();
  const review = page.getByText("New in the world").locator("xpath=ancestor::dl");
  await expect(review).toContainText("A second hull rides low behind the waiting vessel.");
  await expect(review).toContainText("A small, everyday change");
  await expect(page.getByText("Nothing recorded yet.")).toHaveCount(0);
  await expect(page.getByText("World response", { exact: true })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
});

test("WD-1b the story decides by default, and a revealed secret reads as discovered [revealed]", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  const context = page.getByLabel("Current world context");
  await expect(context.getByText("The western signal is dim.")).toBeVisible();
  await expect(context.getByText(ledger)).toHaveCount(0);
  const outcome = page.getByLabel("Desired outcome");
  await expect(outcome).toHaveValue("STORY_DECIDES");
  await expect(outcome.locator("option").first()).toHaveText("Let the story decide");
  await page.getByLabel("Your Action").fill("I search the pilot's coat by the door.");
  await page.getByRole("button", { name: "Send Action" }).click();
  const review = page.getByText("Discovered", { exact: true }).locator("xpath=ancestor::dl");
  await expect(review).toContainText(ledger);
  await expect(review).toContainText("A small, everyday change");
  await expect(page.getByText("Hidden until now.")).toHaveCount(0);
  await expect(context.getByText(ledger)).toHaveCount(0);
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Done. This is now part of your story.")).toBeVisible();
  await expect(context.getByText(ledger, { exact: true })).toBeVisible();
});
