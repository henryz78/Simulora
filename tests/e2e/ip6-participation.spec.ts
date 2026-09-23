import { expect, test } from "@playwright/test";
import { expectAccessible } from "./support/accessibility.js";
import type { ParticipationContract } from "../../packages/contracts/src/index.js";

const continuityId = "61000000-0000-4000-8000-000000000001";
const branchId = "61000000-0000-4000-8000-000000000002";
let headCommitId = "61000000-0000-4000-8000-000000000003";
let participation: ParticipationContract = {
  initiativeMode: "GUIDED",
  structureMode: "OPEN_ENDED",
};
let staleOnce = false;
let loseCommittedResponseOnce = false;
let participationRequestCount = 0;
let participationRequests: unknown[] = [];

function stateResponse() {
  return {
    continuity: {
      id: continuityId,
      branchId,
      headCommitId,
      stateRevisionId: "61000000-0000-4000-8000-000000000004",
      worldRevisionId: "61000000-0000-4000-8000-000000000005",
      worldRevisionNumber: 3,
    },
    world: {
      schemaVersion: 1,
      title: "Lantern Reach",
      premise: "A tidal observatory keeps the harbor oriented through fog.",
      startingSituation: "The western signal is dim.",
      userRole: { name: "Keeper", authorityBoundary: "The world never acts as the keeper." },
      locations: [{ id: "location.observatory", name: "Observatory", description: "A tower." }],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.observatory",
          motives: ["Keep vessels safe."],
          stance: "Refuses an unsafe signal.",
          knowledgeFactIds: ["fact.signal"],
        },
      ],
      facts: [
        {
          id: "fact.signal",
          statement: "The western signal is dim.",
          scope: "SHARED",
          provenance: "World seed",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [],
      interactionPaths: ["Ask Iora about the signal."],
      interactionBoundaries: ["The world never acts as the keeper."],
      objectives: [],
    },
    state: {
      schemaVersion: 1,
      participation,
      worldClock: { turn: 0, label: "Opening moment" },
      locations: [],
      entities: [],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Harbor signaler",
          locationId: "location.observatory",
          currentState: "Watching the shoals.",
          knownFactIds: ["fact.signal"],
        },
      ],
      facts: [{ id: "fact.signal", statement: "The western signal is dim.", lifecycle: "ACTIVE" }],
      relationships: [],
      openThreads: ["The signal is dim."],
      objectives: [],
      resources: {},
      interactionBoundaries: ["The world never acts as the keeper."],
      customState: {},
    },
    source: { stateHash: "a".repeat(64) },
  };
}

test.beforeEach(async ({ page }) => {
  headCommitId = "61000000-0000-4000-8000-000000000003";
  participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" };
  staleOnce = false;
  loseCommittedResponseOnce = false;
  participationRequestCount = 0;
  participationRequests = [];
  await page.route(`**/v1/continuities/${continuityId}/state`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stateResponse()),
    }),
  );
  await page.route(`**/v1/branches/${branchId}/actions`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ branchId, actions: [] }),
    }),
  );
  await page.route(`**/v1/branches/${branchId}/participation-contract`, async (route) => {
    const request = route.request().postDataJSON() as {
      before: typeof participation;
      after: typeof participation;
    };
    participationRequestCount += 1;
    participationRequests.push(request);
    if (staleOnce) {
      staleOnce = false;
      participation = { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" };
      headCommitId = "61000000-0000-4000-8000-000000000099";
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ code: "BRANCH_HEAD_CONFLICT", message: "BRANCH_HEAD_CONFLICT" }),
      });
    }
    participation = request.after;
    headCommitId = "61000000-0000-4000-8000-000000000006";
    if (loseCommittedResponseOnce) {
      loseCommittedResponseOnce = false;
      return route.abort("failed");
    }
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "61000000-0000-4000-8000-000000000007",
        continuityId,
        branchId,
        expectedHeadCommitId: "61000000-0000-4000-8000-000000000003",
        operationType: "CHANGE_PARTICIPATION_CONTRACT",
        status: "COMMITTED",
        intent: "Change participation contract",
        participationExpectation: request.before,
        acknowledgedAt: new Date().toISOString(),
        terminalAt: new Date().toISOString(),
        recoverableWait: false,
        statusReason: null,
        progressUrl: "/progress",
        eventsUrl: "/events",
        proposal: null,
        commit: {
          id: headCommitId,
          resultingHeadCommitId: headCommitId,
          stateRevisionId: "61000000-0000-4000-8000-000000000004",
          committedAt: new Date().toISOString(),
        },
      }),
    });
  });
});

test("changes the two independent axes through an exact direct review", async ({ page }) => {
  await page.goto(`/continuities/${continuityId}`);
  await page.getByRole("link", { name: "Change participation contract" }).click();
  await expect(page).toHaveURL(new RegExp(`/continuities/${continuityId}/participation$`));
  await page.getByRole("radio", { name: /World-active/ }).check();
  await page.getByRole("radio", { name: /Goal-framed/ }).check();
  await page.getByRole("button", { name: "Review authority change" }).click();
  await expect(page.getByText(/does not authorize the world to act as you/)).toBeVisible();
  await page.getByRole("button", { name: "Apply this exact contract" }).click();
  await expect(page.getByText("Participation changed by one direct user Commit.")).toBeVisible();
  await expect(page.getByText("World active · Goal framed", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("World active · Goal framed", { exact: true }).first()).toBeVisible();
  await expectAccessible(page);
});

test("stale review writes nothing and requires a fresh intentional review", async ({ page }) => {
  staleOnce = true;
  await page.goto(`/continuities/${continuityId}/participation`);
  await page.getByRole("radio", { name: /World-active/ }).check();
  await page.getByRole("button", { name: "Review authority change" }).click();
  await page.getByRole("button", { name: "Apply this exact contract" }).click();
  await expect(
    page.getByText("The current path changed. Review its current contract before trying again."),
  ).toBeVisible();
  await expect(page.getByText("Direct · Open ended", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply this exact contract" })).toHaveCount(0);
});

test("reconciles a committed participation change after its first response is lost", async ({
  page,
}) => {
  loseCommittedResponseOnce = true;
  await page.goto(`/continuities/${continuityId}/participation`);
  await page.getByRole("radio", { name: /World-active/ }).check();
  await page.getByRole("button", { name: "Review authority change" }).click();
  await page.getByRole("button", { name: "Apply this exact contract" }).click();

  await expect(page.getByText("Participation changed by one direct user Commit.")).toBeVisible();
  await expect(page.getByText("World active · Open ended", { exact: true }).first()).toBeVisible();
  expect(participationRequestCount).toBe(2);
  expect(participationRequests[1]).toEqual(participationRequests[0]);
  expect(participationRequests[0]).toMatchObject({
    expectedHeadCommitId: "61000000-0000-4000-8000-000000000003",
    before: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
    after: { initiativeMode: "WORLD_ACTIVE", structureMode: "OPEN_ENDED" },
  });
  expect(participationRequests[0]).toHaveProperty("idempotencyKey");
  await expect(page.getByText(/current truth is unchanged/i)).toHaveCount(0);
});
