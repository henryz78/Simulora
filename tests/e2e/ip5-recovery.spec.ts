import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const continuityId = "60000000-0000-4000-8000-000000000001";
const branchId = "60000000-0000-4000-8000-000000000002";
const branchHead = "60000000-0000-4000-8000-000000000003";
const oldCommit = "60000000-0000-4000-8000-000000000004";
const stateRevisionId = "60000000-0000-4000-8000-000000000005";
const worldRevisionId = "60000000-0000-4000-8000-000000000006";
const pointId = "60000000-0000-4000-8000-000000000007";
const now = "2026-09-07T00:00:00.000Z";

function state(branch = branchId, head = branchHead): Record<string, unknown> {
  return {
    continuity: {
      id: continuityId,
      branchId: branch,
      headCommitId: head,
      stateRevisionId,
      worldRevisionId,
      worldRevisionNumber: 1,
    },
    world: {
      schemaVersion: 1,
      title: "Lantern Reach",
      premise: "A tidal observatory keeps a coastal settlement oriented through fog.",
      startingSituation: "The western signal has changed.",
      userRole: {
        name: "Observatory keeper",
        authorityBoundary: "The world never authors user speech.",
      },
      locations: [
        { id: "location.observatory", name: "Observatory", description: "A salt-dark tower." },
      ],
      characters: [
        {
          id: "character.iora",
          name: "Iora",
          role: "Signaler",
          locationId: "location.observatory",
        },
      ],
      facts: [
        {
          id: "fact.signal",
          statement: "The signal is steady.",
          scope: "SHARED",
          provenance: "Recorded Action",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [],
      interactionPaths: ["Inspect the lamp."],
      interactionBoundaries: ["The world never authors user speech."],
      objectives: [],
    },
    state: {
      schemaVersion: 1,
      participation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
      worldClock: { turn: 1, label: "After the signal changed" },
      locations: [],
      entities: [],
      characters: [],
      facts: [
        {
          id: "fact.signal",
          statement: "The signal is steady.",
          scope: "SHARED",
          provenance: "Recorded Action",
          lifecycle: "ACTIVE",
        },
      ],
      relationships: [],
      openThreads: ["The harbor watches the signal."],
      objectives: [],
      resources: {},
      interactionBoundaries: ["The world never authors user speech."],
      customState: {},
    },
    source: { stateHash: "a".repeat(64) },
  };
}

function recovery(): Record<string, unknown> {
  return {
    continuityId,
    currentBranchId: branchId,
    branches: [
      {
        id: branchId,
        continuityId,
        name: "Original path",
        status: "ACTIVE",
        headCommitId: branchHead,
        headStateRevisionId: stateRevisionId,
        parentBranchId: null,
        forkSourceCommitId: null,
        isCurrent: true,
        createdAt: now,
      },
    ],
    recoveryPoints: [
      {
        id: pointId,
        continuityId,
        branchId,
        commitId: oldCommit,
        label: "Before the signal changed",
        createdAt: now,
        deletedAt: null,
      },
    ],
    restoreProposals: [],
  };
}

async function json(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installRoutes(page: Page, pending = false): Promise<void> {
  const recoveryState = recovery();
  await page.route(`**/v1/continuities/${continuityId}/state`, (route) => json(route, state()));
  await page.route(`**/v1/branches/${branchId}/actions`, (route) =>
    json(route, {
      branchId,
      actions: pending
        ? [
            {
              id: "60000000-0000-4000-8000-000000000020",
              status: "ACKNOWLEDGED",
              intent: "Inspect the signal",
              acknowledgedAt: now,
              committedAt: null,
              narrative: null,
            },
          ]
        : [],
    }),
  );
  await page.route(`**/v1/actions/60000000-0000-4000-8000-000000000020/events`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: "event: heartbeat\ndata: {}\n\n",
    }),
  );
  await page.route(`**/v1/actions/60000000-0000-4000-8000-000000000020`, (route) =>
    json(route, {
      id: "60000000-0000-4000-8000-000000000020",
      continuityId,
      branchId,
      expectedHeadCommitId: branchHead,
      operationType: "PARTICIPATE",
      status: "ACKNOWLEDGED",
      intent: "Inspect the signal",
      participationExpectation: { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" },
      acknowledgedAt: now,
      terminalAt: null,
      recoverableWait: false,
      statusReason: null,
      progressUrl: "/progress",
      eventsUrl: "/v1/actions/60000000-0000-4000-8000-000000000020/events",
      proposal: null,
      commit: null,
    }),
  );
  await page.route(`**/v1/continuities/${continuityId}/recovery`, (route) =>
    json(route, recoveryState),
  );
  await page.route(`**/v1/branches/${branchId}/recovery-points`, async (route) => {
    const created = {
      id: "60000000-0000-4000-8000-000000000008",
      continuityId,
      branchId,
      commitId: branchHead,
      label: "Before the next choice",
      createdAt: now,
      deletedAt: null,
    };
    (recoveryState.recoveryPoints as unknown[]).unshift(created);
    await json(route, created, 201);
  });
  await page.route(`**/v1/continuities/${continuityId}/branches`, async (route) => {
    const branch = {
      id: "60000000-0000-4000-8000-000000000009",
      continuityId,
      name: "Alternative path",
      status: "ACTIVE",
      headCommitId: "60000000-0000-4000-8000-000000000010",
      headStateRevisionId: "60000000-0000-4000-8000-000000000011",
      parentBranchId: branchId,
      forkSourceCommitId: oldCommit,
      isCurrent: false,
      createdAt: now,
    };
    (recoveryState.branches as unknown[]).push(branch);
    await json(route, branch, 201);
  });
  await page.route(`**/v1/branches/${branchId}/restore-proposals`, async (route) => {
    const proposal = {
      id: "60000000-0000-4000-8000-000000000012",
      continuityId,
      branchId,
      sourceCommitId: oldCommit,
      expectedHeadCommitId: branchHead,
      includedSections: [
        "worldClock",
        "locations",
        "entities",
        "characters",
        "facts",
        "relationships",
        "openThreads",
        "objectives",
        "resources",
      ],
      excludedSections: ["participation", "interactionBoundaries", "customState", "other Branches"],
      changedSections: ["worldClock", "facts", "openThreads"],
      sectionChanges: [
        {
          section: "worldClock",
          before: { turn: 2, label: "Current watch" },
          after: { turn: 0, label: "Opening watch" },
        },
        { section: "facts", before: [{ statement: "Signal steady" }], after: [] },
        { section: "openThreads", before: [{ title: "Follow the signal" }], after: [] },
      ],
      beforeHash: "a".repeat(64),
      sourceHash: "b".repeat(64),
      digest: "c".repeat(64),
      expiresAt: "2026-09-07T01:00:00.000Z",
      status: "ACTIVE",
    };
    (recoveryState.restoreProposals as unknown[]).splice(0, 1, proposal);
    await json(route, proposal, 201);
  });
  await page.route(`**/v1/branches/${branchId}/restores`, async (route) => {
    (recoveryState.restoreProposals as unknown[]).splice(0);
    await json(
      route,
      {
        commitId: "60000000-0000-4000-8000-000000000013",
        stateRevisionId: "60000000-0000-4000-8000-000000000014",
        resultingHeadCommitId: "60000000-0000-4000-8000-000000000013",
        committedAt: now,
      },
      201,
    );
  });
}

test("pending Action stays understandable through Recovery navigation", async ({ page }) => {
  await installRoutes(page, true);
  await page.goto(`/continuities/${continuityId}`);
  await page.getByRole("link", { name: "Open Recovery" }).click();
  await expect(page).toHaveURL(`/continuities/${continuityId}/recovery`);
  await expect(page.getByText("One Action still needs attention")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Finish the unresolved Action before switching paths" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to world" }).click();
  await expect(page.getByText("Pending Actions")).toBeVisible();
});

test("Safe Point, Branch and exact append-only Restore share one Recovery model", async ({
  page,
}) => {
  await installRoutes(page);
  await page.goto(`/continuities/${continuityId}/recovery`);
  await expect(
    page.getByRole("heading", { name: "Preserve, branch or restore this path" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Safe Point" }).click();
  await expect(page.getByText("Safe Point recorded as a reference")).toBeVisible();
  await page.getByRole("button", { name: "Create separate Branch" }).click();
  await expect(page.getByText("Separate Branch created")).toBeVisible();
  await expect(page.getByText("Original path", { exact: true })).toBeVisible();
  await page.getByLabel("Restore from").selectOption(oldCommit);
  await page.getByRole("button", { name: "Review Restore scope" }).click();
  await expect(page.getByRole("region", { name: "Exact Restore review" })).toContainText(
    "participation",
  );
  await page.reload();
  await expect(page.getByRole("region", { name: "Exact Restore review" })).toContainText(
    "other Branches",
  );
  await page.getByRole("button", { name: "Confirm exact Restore" }).click();
  await expect(page.getByText("Restore recorded as a new Commit")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Correction and Delete are not Restore" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
