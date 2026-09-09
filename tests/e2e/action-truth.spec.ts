import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const continuityId = "30000000-0000-4000-8000-000000000001";
const branchId = "30000000-0000-4000-8000-000000000002";
const initialHead = "30000000-0000-4000-8000-000000000003";
const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;
let observedIdempotencyKeys: string[] = [];

test.beforeEach(async ({ page }) => {
  observedIdempotencyKeys = [];
  let head = initialHead;
  let fact = "The western signal is dim.";
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
      ],
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
          locationId: "location.tidal-observatory",
          currentState: "Present at the observatory.",
        },
      ],
      facts: [{ id: "fact.signal", statement: fact }],
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
        impact: "L3",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        narrative: `Iora studies the consequence of: ${input.intent}`,
        responseSource: { type: "CHARACTER", characterId: "character.iora" },
        displayEffect: {
          target: "fact.signal",
          before: fact,
          after: `Recorded consequence ${actionNumber}.`,
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
      const committedHead = `32000000-0000-4000-8000-${String(actionNumber).padStart(12, "0")}`;
      head = committedHead;
      const proposal = action.proposal as { displayEffect: { after: string }; narrative: string };
      fact = proposal.displayEffect.after;
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

test("Action Truth completes twice without confusing proposal and current truth", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Your Action").fill("Relight the western signal with Iora.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Received and durably recorded.")).toBeVisible();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expect(page.getByText("Character response · Iora")).toBeVisible();
  const worldContext = page.getByLabel("Current world context");
  await expect(worldContext.getByText("The western signal is dim.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Recorded. The Branch head")).toBeVisible();
  await expect(worldContext.getByText("Recorded consequence 1.", { exact: true })).toBeVisible();

  await page.getByLabel("Your Action").fill("Read the waiting vessel's lantern pattern.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  const recordedHistory = page.getByRole("heading", { name: "Recorded Actions" }).locator("..");
  await expect(recordedHistory).toBeVisible();
  await expect(recordedHistory.getByRole("listitem")).toHaveCount(2);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("an unresolved Action is recovered after refresh by durable Action ID", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Your Action").fill("Inspect the western signal housing.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this exact change" })).toBeVisible();
});

test("retries a lost acknowledgement with the same idempotency key", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByLabel("Your Action").fill("Retry after lost ACK by the western signal.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "The acknowledgement could not be confirmed. Retry is safe and uses the same submission.",
  );
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Received and durably recorded.")).toBeVisible();
  expect(observedIdempotencyKeys).toHaveLength(2);
  expect(observedIdempotencyKeys[0]).toBe(observedIdempotencyKeys[1]);
});
