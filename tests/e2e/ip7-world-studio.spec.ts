import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const worldId = "71000000-0000-4000-8000-000000000001";
const revisionId = "71000000-0000-4000-8000-000000000002";
const continuityId = "71000000-0000-4000-8000-000000000003";
const locationId = "location-start";
const characterId = "character-guide";
const factId = "fact-opening";

function documentFor(title = "A user world") {
  return {
    schemaVersion: 1,
    title,
    premise: "A continuing place shaped by its people.",
    startingSituation: "A first choice is waiting.",
    userRole: { name: "Witness", authorityBoundary: "The world never authors my speech." },
    locations: [{ id: locationId, name: "The starting place", description: "A quiet beginning." }],
    routineRoutes: [],
    characters: [
      {
        id: characterId,
        name: "A local guide",
        role: "A person who knows this place",
        locationId,
        motives: ["Act consistently with this role."],
        stance: "May disagree when their motives require it.",
        knowledgeFactIds: [factId],
      },
    ],
    facts: [
      {
        id: factId,
        statement: "The first scene is ready.",
        scope: "SHARED",
        provenance: "World creator Draft",
        lifecycle: "ACTIVE",
      },
    ],
    relationships: [],
    interactionPaths: ["Look around."],
    interactionBoundaries: ["The world never authors the user's speech."],
    objectives: [],
  };
}

type RevisionSummary = {
  revisionId: string;
  worldId: string;
  revisionNumber: number;
  sourceDraftRowVersion: number;
  documentHash: string;
  createdAt: string;
};

function studioResponse(draft = documentFor(), rowVersion = 1, revisions: RevisionSummary[] = []) {
  return {
    worldId,
    draft: { worldId, rowVersion, document: draft, documentHash: "a".repeat(64) },
    revisions,
    continuities: [],
    validation: null,
  };
}

test("creator can make a Draft, inspect play effect, and keep revision boundaries visible", async ({
  page,
}) => {
  let draft = documentFor();
  let rowVersion = 1;
  let revisions: RevisionSummary[] = [];
  await page.route("**/v1/worlds", async (route) => {
    const request = route.request().postDataJSON() as { document: typeof draft };
    draft = request.document;
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ worldId, rowVersion, documentHash: "a".repeat(64) }),
    });
  });
  await page.route(`**/v1/worlds/${worldId}/studio`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(studioResponse(draft, rowVersion, revisions)),
    }),
  );
  await page.route(`**/v1/worlds/${worldId}/draft`, async (route) => {
    const request = route.request().postDataJSON() as { document: typeof draft };
    draft = request.document;
    rowVersion += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ worldId, rowVersion, document: draft, documentHash: "b".repeat(64) }),
    });
  });
  await page.route(`**/v1/worlds/${worldId}/validation`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        worldId,
        draftRowVersion: rowVersion,
        outcome: "VALID",
        findings: [],
        validatedAt: new Date().toISOString(),
      }),
    }),
  );
  await page.route(`**/v1/worlds/${worldId}/revisions`, async (route) => {
    const created = {
      revisionId,
      worldId,
      revisionNumber: 1,
      sourceDraftRowVersion: rowVersion,
      documentHash: "c".repeat(64),
      createdAt: new Date().toISOString(),
    };
    revisions = [created];
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(created),
    });
  });

  await page.goto("/worlds/new");
  await page.getByLabel("World title").fill("A world made here");
  await page.getByRole("button", { name: "Create Draft" }).click();
  await expect(page).toHaveURL(new RegExp(`/worlds/${worldId}/studio$`));
  await page.getByRole("button", { name: "Add place" }).click();
  await page.getByRole("button", { name: "Add Character" }).click();
  await page.getByText("Facts, routes, relationships and boundaries").click();
  await page.getByRole("button", { name: "Add fact" }).click();
  await page.getByRole("button", { name: "Add route" }).click();
  await page.getByRole("button", { name: "Add relationship" }).click();
  await page.getByLabel("Premise").fill("A user-authored premise with a durable future.");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(draft.locations).toHaveLength(2);
  expect(draft.characters).toHaveLength(2);
  expect(draft.facts).toHaveLength(2);
  expect(draft.routineRoutes).toHaveLength(1);
  expect(draft.relationships).toHaveLength(1);
  await page.getByRole("button", { name: "Check playability" }).click();
  await expect(page.getByText("Playable shape accepted")).toBeVisible();
  await page.getByRole("button", { name: "Create playable Revision" }).click();
  await expect(page.getByRole("status")).toContainText("Revision 1 created");
  await expect(page.getByText("not applied to existing Continuities")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Studio keeps an existing Continuity pinned and is complete on mobile", async ({ page }) => {
  const revision = {
    revisionId,
    worldId,
    revisionNumber: 1,
    sourceDraftRowVersion: 1,
    documentHash: "a".repeat(64),
    createdAt: new Date().toISOString(),
  };
  const newerRevision = {
    ...revision,
    revisionId: "71000000-0000-4000-8000-000000000004",
    revisionNumber: 2,
    sourceDraftRowVersion: 2,
  };
  await page.route(`**/v1/worlds/${worldId}/studio`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...studioResponse(documentFor(), 2, [newerRevision, revision]),
        continuities: [
          { continuityId, worldRevisionId: revisionId, revisionNumber: 1, status: "PINNED" },
        ],
      }),
    }),
  );
  await page.goto(`/worlds/${worldId}/studio`);
  await expect(
    page.getByRole("heading", { name: "Draft and playable versions stay distinct" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume pinned Continuity" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Begin from Revision 2" })).toBeVisible();
  await page.getByRole("button", { name: "Resume pinned Continuity" }).click();
  await expect(page).toHaveURL(new RegExp(`/continuities/${continuityId}$`));
  await page.goBack();
  await expect(page.getByRole("link", { name: /Pinned Continuity/ })).toHaveAttribute(
    "href",
    `/continuities/${continuityId}`,
  );
  await expect(page.getByRole("button", { name: "Resume pinned Continuity" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
