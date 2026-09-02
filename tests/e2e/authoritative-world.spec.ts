import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const continuityId = "10000000-0000-4000-8000-000000000001";
const response = {
  continuity: {
    id: continuityId,
    branchId: "10000000-0000-4000-8000-000000000002",
    headCommitId: "10000000-0000-4000-8000-000000000003",
    stateRevisionId: "10000000-0000-4000-8000-000000000004",
    worldRevisionId: "10000000-0000-4000-8000-000000000005",
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
    participation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
    worldClock: { turn: 0, label: "Opening moment" },
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
    facts: [{ id: "fact.signal", statement: "The western signal is dim." }],
    relationships: [],
    openThreads: ["The western signal has dimmed while an unfamiliar vessel waits offshore."],
    objectives: [],
    resources: {},
    interactionBoundaries: ["The world never authors user speech."],
    customState: {},
  },
  source: { stateHash: "a".repeat(64) },
};

test.beforeEach(async ({ page }) => {
  let failureAttempts = 0;
  await page.route(`**/v1/continuities/${continuityId}/state**`, (route) => {
    if (page.url().includes("simulateFailure=1")) {
      failureAttempts += 1;
      if (failureAttempts === 1) return route.fulfill({ status: 503, body: "unavailable" });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
});
test("read-only authoritative World shell renders accessibly", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await expect(page.getByRole("heading", { level: 1, name: "Lantern Reach" })).toBeVisible();
  await expect(page.getByText("The western signal is dim.")).toBeVisible();
  await expect(page.getByText("Guided · Open ended")).toBeVisible();
  await expect(page.getByText("Revision 1 · current path")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("route refresh recovers the World from the API instead of client fixtures", async ({
  page,
}) => {
  await page.goto(`/continuities/${continuityId}`);
  await expect(page.getByRole("heading", { name: "Lantern Reach" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lantern Reach" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/continuities/${continuityId}$`));
});

test("failed authoritative reads remain honest and recoverable", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}?simulateFailure=1`);
  await expect(
    page.getByRole("heading", { name: "The current world could not be read" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Lantern Reach" })).toBeVisible();
});
