import { expect, test } from "@playwright/test";
import { expectAccessible } from "./support/accessibility.js";

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
  await expectAccessible(page);
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
  await expectAccessible(page);
});

test("SA-1: creator authors relationship states, story threads and world rules", async ({
  page,
}) => {
  const second = {
    id: "character-keeper",
    name: "The keeper",
    role: "Tends the harbour bell",
    locationId,
    motives: ["Keep the bell working."],
    stance: "May refuse when the bell is at risk.",
    knowledgeFactIds: [],
  };
  // An API-authored field Studio never displays must survive a save.
  let draft: Record<string, unknown> = {
    ...documentFor(),
    characters: [...documentFor().characters, second],
    relationships: [
      {
        id: "relationship-api",
        fromCharacterId: characterId,
        toCharacterId: second.id,
        description: "Authored through the API.",
        protection: "ROUTINE",
      },
    ],
  };
  let rowVersion = 1;
  const posted: unknown[] = [];
  await page.route(`**/v1/worlds/${worldId}/studio`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(studioResponse(draft as ReturnType<typeof documentFor>, rowVersion)),
    }),
  );
  await page.route(`**/v1/worlds/${worldId}/draft`, async (route) => {
    draft = (route.request().postDataJSON() as { document: Record<string, unknown> }).document;
    posted.push(draft);
    rowVersion += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ worldId, rowVersion, document: draft, documentHash: "b".repeat(64) }),
    });
  });

  await page.goto(`/worlds/${worldId}/studio`);
  await page.getByText("Facts, routes, relationships and boundaries").click();
  const relationship = page.getByRole("group", { name: "Relationship 1", exact: true });
  await relationship.getByLabel("Yes, it can move between named states").check();
  await expect(relationship.getByLabel("Starting state")).toHaveValue("neutral");
  await relationship.getByRole("textbox", { name: "State 2", exact: true }).fill("wary");
  await expect(relationship.getByLabel("Starting state")).toHaveValue("wary");
  await relationship.getByRole("button", { name: "Remove state 2" }).click();
  await expect(relationship.getByLabel("Starting state")).toHaveValue("distant");
  await expect(relationship.getByRole("button", { name: "Remove state 1" })).toBeDisabled();
  for (let count = 2; count < 7; count += 1) {
    await relationship.getByRole("button", { name: "Add state" }).click();
  }
  await expect(relationship.getByRole("button", { name: "Add state" })).toBeDisabled();
  await relationship.getByRole("button", { name: "Remove state 7" }).click();
  await relationship.getByLabel("Starting state").selectOption("close");
  await relationship.getByRole("textbox", { name: "State 3", exact: true }).fill("close");
  await expect(
    page.getByText("Give each relationship state a different name before saving."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Draft" })).toBeDisabled();
  await relationship.getByRole("textbox", { name: "State 3", exact: true }).fill("state 3");
  // Typing a name through a duplicate never moves the starting state (review M1).
  const firstState = relationship.getByRole("textbox", { name: "State 1", exact: true });
  await firstState.fill("");
  await firstState.pressSequentially("closer");
  await expect(relationship.getByLabel("Starting state")).toHaveValue("close");
  await firstState.fill("distant");
  await expect(relationship.getByLabel("How a change is confirmed")).toHaveValue("ROUTINE");

  await page.getByRole("button", { name: "Add story thread" }).click();
  await page.getByRole("group", { name: "Thread 1" }).getByLabel("Title").fill("");
  await expect(page.getByText("Give every story thread a title before saving.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Draft" })).toBeDisabled();
  await page
    .getByRole("group", { name: "Thread 1" })
    .getByLabel("Title")
    .fill("Who rang the harbour bell?");
  await page.getByRole("button", { name: "Add world rule" }).click();
  await page
    .getByRole("group", { name: "Rule 1" })
    .getByLabel("Rule")
    .fill("No one crosses the flooded causeway.");
  await page.getByRole("button", { name: "Add world rule" }).click();
  await page
    .getByRole("group", { name: "Rule 2" })
    .getByRole("button", { name: "Remove rule" })
    .click();

  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(posted).toHaveLength(1);
  const saved = draft as {
    relationships: Array<Record<string, unknown>>;
    threads: Array<{ title: string }>;
    constraints: Array<{ statement: string }>;
  };
  expect(saved.relationships[0]).toMatchObject({
    id: "relationship-api",
    description: "Authored through the API.",
    protection: "ROUTINE",
    scale: ["distant", "close", "state 3", "state 4", "state 5", "state 6"],
    initialState: "close",
  });
  expect(saved.threads.map((thread) => thread.title)).toEqual(["Who rang the harbour bell?"]);
  expect(saved.constraints.map((rule) => rule.statement)).toEqual([
    "No one crosses the flooded causeway.",
  ]);
  await expectAccessible(page);

  // The new controls work from the keyboard alone (review M3).
  await relationship.getByLabel("No, it stays as described").focus();
  await page.keyboard.press("Space");
  await expect(relationship.getByLabel("No, it stays as described")).toBeChecked();
  await page
    .getByRole("group", { name: "Thread 1" })
    .getByRole("button", { name: "Remove thread" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: "Thread 1" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save Draft" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Draft saved");
  const cleared = draft as Record<string, unknown> & {
    relationships: Array<Record<string, unknown>>;
  };
  expect(cleared.relationships[0]).toEqual({
    id: "relationship-api",
    fromCharacterId: characterId,
    toCharacterId: second.id,
    description: "Authored through the API.",
    protection: "ROUTINE",
  });
  expect(cleared).not.toHaveProperty("threads");
});

test("SA-2: creator names who may move and which routes they may use", async ({ page }) => {
  const harbor = { id: "location-harbor", name: "Harbor", description: "A foggy harbor." };
  const keeper = {
    id: "character-keeper",
    name: "The keeper",
    role: "Tends the harbour bell",
    locationId,
    motives: ["Keep the bell working."],
    stance: "May refuse when the bell is at risk.",
    knowledgeFactIds: [],
  };
  let draft: Record<string, unknown> = {
    ...documentFor(),
    locations: [...documentFor().locations, harbor],
    routineRoutes: [
      { fromLocationId: locationId, toLocationId: harbor.id, label: "The harbour steps." },
    ],
    characters: [...documentFor().characters, keeper],
  };
  let rowVersion = 1;
  await page.route(`**/v1/worlds/${worldId}/studio`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(studioResponse(draft as ReturnType<typeof documentFor>, rowVersion)),
    }),
  );
  await page.route(`**/v1/worlds/${worldId}/draft`, async (route) => {
    draft = (route.request().postDataJSON() as { document: Record<string, unknown> }).document;
    rowVersion += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ worldId, rowVersion, document: draft, documentHash: "b".repeat(64) }),
    });
  });

  await page.goto(`/worlds/${worldId}/studio`);
  await page.getByText("Facts, routes, relationships and boundaries").click();
  const movers = page.getByRole("group", { name: "Who may move" });
  const save = page.getByRole("button", { name: "Save Draft" });

  // Each half of the grant alone is explained and cannot be saved.
  await movers.getByLabel("The keeper").check();
  await expect(
    page.getByText("Open at least one route to the Characters who move on their own"),
  ).toBeVisible();
  await expect(save).toBeDisabled();
  await movers.getByLabel("The keeper").uncheck();
  const route = page.getByRole("group", { name: "Route 1" });
  await route.getByLabel("Characters above may use this route on their own").check();
  await expect(
    page.getByText("Tick at least one Character who may use the open routes"),
  ).toBeVisible();
  await movers.getByLabel("The keeper").focus();
  await page.keyboard.press("Space");
  await expect(save).toBeEnabled();
  await expectAccessible(page);
  await save.click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(draft).toMatchObject({
    routineMovers: [keeper.id],
    routineRoutes: [
      { fromLocationId: locationId, toLocationId: harbor.id, permitsRoutineMovement: true },
    ],
  });

  // Removing the mover leaves an open route with nobody to use it, which is explained.
  await page
    .getByRole("group", { name: "Character 2", exact: true })
    .getByRole("button", { name: "Remove Character" })
    .click();
  await expect(movers.getByLabel("The keeper")).toHaveCount(0);
  await expect(
    page.getByText("Tick at least one Character who may use the open routes"),
  ).toBeVisible();
  await route.getByLabel("Characters above may use this route on their own").uncheck();
  await save.click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(draft).not.toHaveProperty("routineMovers");
  expect((draft.routineRoutes as Array<Record<string, unknown>>)[0]).not.toHaveProperty(
    "permitsRoutineMovement",
  );
});

test("WD-1b: creator marks a private fact as a secret and says how it could be found", async ({
  page,
}) => {
  let draft: Record<string, unknown> = {
    ...documentFor(),
    facts: [
      ...documentFor().facts,
      {
        id: "fact-ledger",
        statement: "The ledger is sewn into the merchant's coat.",
        scope: "CONTINUITY_PRIVATE",
        provenance: "World creator Draft",
        lifecycle: "ACTIVE",
      },
    ],
  };
  let rowVersion = 1;
  await page.route(`**/v1/worlds/${worldId}/studio`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(studioResponse(draft as ReturnType<typeof documentFor>, rowVersion)),
    }),
  );
  await page.route(`**/v1/worlds/${worldId}/draft`, async (route) => {
    draft = (route.request().postDataJSON() as { document: Record<string, unknown> }).document;
    rowVersion += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ worldId, rowVersion, document: draft, documentHash: "b".repeat(64) }),
    });
  });

  await page.goto(`/worlds/${worldId}/studio`);
  await page.getByText("Facts, routes, relationships and boundaries").click();
  const shared = page.getByRole("group", { name: "Fact 1", exact: true });
  await expect(shared.getByLabel("Can be discovered in play")).toHaveCount(0);
  const secret = page.getByRole("group", { name: "Fact 2", exact: true });
  await secret.getByLabel("Can be discovered in play").check();
  await secret.getByLabel("How it could be found").fill("Searching the merchant's coat.");
  await expectAccessible(page);
  const save = page.getByRole("button", { name: "Save Draft" });
  await save.click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(draft.discoverableFacts).toEqual([
    { factId: "fact-ledger", howToFind: "Searching the merchant's coat." },
  ]);

  // A shared fact cannot be a secret, so changing the scope withdraws it.
  await secret.getByLabel("Scope").selectOption("SHARED");
  await expect(secret.getByLabel("Can be discovered in play")).toHaveCount(0);
  await save.click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect(draft).not.toHaveProperty("discoverableFacts");
});
