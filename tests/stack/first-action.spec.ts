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
  await page.getByLabel("Your Action").fill(intent);
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  // Names, never raw identifiers, describe who answers and what would change.
  await expect(page.getByText("Character response · A local guide")).toBeVisible();
  await expect(page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-/)).toHaveCount(0);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Recorded. The Branch head")).toBeVisible();
  await expect(page.getByLabel("Your Action")).toBeEnabled();
}

test("a new World reaches its first confirmed Action and Return on the real stack", async ({
  page,
}, testInfo) => {
  const { continuityId } = await beginNewWorld(page, testInfo);
  await page.getByLabel("Your Action").fill("Look around the starting place.");
  await page.getByRole("button", { name: "Send Action" }).click();
  await expect(page.getByText("Provisional — not current truth")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Confirm this exact change" }).click();
  await expect(page.getByText("Recorded. The Branch head")).toBeVisible();

  // What was confirmed survives a reload and is what Return reports.
  await page.reload();
  const recorded = page.getByRole("heading", { name: "Recorded Actions" }).locator("..");
  await expect(recorded.getByRole("listitem")).toHaveCount(1);
  await page.goto(`/continuities/${continuityId}/return`);
  await expect(page.getByText(/Look around the starting place/).first()).toBeVisible();
  await expectAccessible(page);
});

test("Action, Correction, Branch, Restore and export compose on one World", async ({
  page,
}, testInfo) => {
  const { worldId, continuityId } = await beginNewWorld(page, testInfo);
  await confirmFirstAction(page, "Ask the guide what changed overnight.");

  // Correction of the fact the Action changed, through its own exact review.
  await page.goto(`/continuities/${continuityId}/continuity`);
  await page.getByRole("link", { name: /Ask the guide what changed overnight/ }).click();
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
  const recorded = page.getByRole("heading", { name: "Recorded Actions" }).locator("..");
  await expect(recorded).toContainText("Ask the guide what changed overnight.");

  // The same World exports through the real worker and object store.
  await page.goto(`/worlds/${worldId}/trust`);
  await expect(page.getByText("You own this World.")).toBeVisible();
  await page.getByRole("button", { name: "Review export usage" }).click();
  await page.getByRole("button", { name: "Create selected export" }).click();
  await expect(page.getByRole("link", { name: "Download ZIP" })).toBeVisible({ timeout: 30000 });
  await expectAccessible(page);
});
