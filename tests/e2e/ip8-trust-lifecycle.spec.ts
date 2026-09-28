import { expect, test, type Page } from "@playwright/test";
import { expectAccessible } from "./support/accessibility.js";

const worldId = "81000000-0000-4000-8000-000000000001";
const quoteId = "81000000-0000-4000-8000-000000000002";
const reservationId = "81000000-0000-4000-8000-000000000003";
const exportId = "81000000-0000-4000-8000-000000000004";
const proposalId = "81000000-0000-4000-8000-000000000005";

async function routeTrustBasics(page: Page): Promise<void> {
  await page.route("**/v1/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        accountId: "81000000-0000-4000-8000-000000000010",
        eligibility: "adult",
        policyVersion: "IP-8-ADULT-ONLY-V1",
        capabilities: { canCreateWorld: true, canParticipate: true, canAppeal: true },
        reasonCode: "ELIGIBLE_ADULT",
      }),
    }),
  );
  await page.route("**/v1/me/consents", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ...body,
          withdrawalAvailable: body.decision === "GRANTED",
          updatedAt: new Date().toISOString(),
        }),
      });
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ policyVersion: "IP-8-ADULT-ONLY-V1", consents: [] }),
    });
  });
  await page.route(`**/v1/resources/world/${worldId}/access`, (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        resourceType: "world",
        resourceId: worldId,
        accessLevel: "OWNER",
        visibility: "OWNER_ONLY",
        canRead: true,
        canModify: true,
        canStart: true,
        reasonCode: "OWNER",
        explanation: "You own this World.",
        recovery: null,
      }),
    }),
  );
  await page.route("**/v1/product-changes", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        changes: [
          {
            id: "81000000-0000-4000-8000-000000000011",
            version: "IP-8-TRUST-LIFECYCLE-V1",
            category: "CAPABILITY",
            summary: "Trust and lifecycle controls are explicit.",
            effect: "Exports and deletion now require review.",
            recovery: "Return without confirming to leave the World unchanged.",
            affectedScopes: ["ACCOUNT", "WORLD", "EXPORT"],
            effectiveAt: new Date().toISOString(),
            availableChoices: ["REVIEW_ACCESS", "EXPORT_SELECTED_SCOPE", "OPEN_APPEAL"],
            publishedAt: new Date().toISOString(),
          },
        ],
      }),
    }),
  );
  await page.route("**/v1/usage/quotes", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        quoteId,
        actionProfile: "EXPORT",
        policyVersion: "IP-8-ZERO-COST-TEST-V1",
        costMode: "ZERO_COST_TEST",
        units: 0,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        failureBehavior: {
          retry: "Retry with the same key.",
          cancel: "Cancellation releases the reservation.",
          terminalNoCommit: "Failure creates no settlement.",
        },
        status: "ISSUED",
      }),
    }),
  );
  await page.route(`**/v1/usage/quotes/${quoteId}/reservations`, (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        reservationId,
        quoteId,
        actionKey: "export:test",
        status: "RESERVED",
        units: 0,
        createdAt: new Date().toISOString(),
      }),
    }),
  );
  await page.route(`**/v1/usage/reservations/${reservationId}/settle`, (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        reservationId,
        quoteId,
        actionKey: "export:test",
        status: "SETTLED",
        units: 0,
        createdAt: new Date().toISOString(),
      }),
    }),
  );
}

test("owner can inspect trust, export selected data, appeal, and review deletion", async ({
  page,
}) => {
  let deleted = false;
  await routeTrustBasics(page);
  await page.route("**/v1/exports", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        exportId,
        status: "READY",
        schemaVersion: 1,
        worldId,
        selectedScopes: ["world", "characters", "continuity", "history"],
        omittedScopes: [],
        checksum: "a".repeat(64),
        artifactKey: `exports/${exportId}.zip`,
        manifest: { schemaVersion: 1, worldId },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }),
    }),
  );
  await page.route("**/v1/appeals", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        appealId: "81000000-0000-4000-8000-000000000012",
        status: "OPEN",
        recoveryState: "REVIEW_PENDING",
        reasonCode: "ACCESS",
        subjectType: "WORLD",
        subjectId: worldId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }),
  );
  await page.route("**/v1/deletion-proposals", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        proposalId,
        targetType: "WORLD",
        targetId: worldId,
        digest: "b".repeat(64),
        status: "ACTIVE",
        affected: {
          continuities: 2,
          grants: 1,
          exports: 1,
          auditCategories: ["DELETION", "ACCESS", "RECOVERY"],
        },
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        explanation: "Confirmation tombstones the World.",
      }),
    }),
  );
  await page.route("**/v1/deletions", (route) => {
    deleted = true;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        proposalId,
        targetType: "WORLD",
        targetId: worldId,
        status: "COMPLETED",
        tombstonedAt: new Date().toISOString(),
        purgeStatus: "RETAINING_MINIMAL_AUDIT",
        updatedAt: new Date().toISOString(),
      }),
    });
  });

  await page.goto(`/worlds/${worldId}/trust`);
  await expect(
    page.getByRole("heading", { name: "Ownership, portability and exit" }),
  ).toBeVisible();
  await expect(page.getByText("You own this World.")).toBeVisible();
  // WD-1b: an export is the owner's full copy, author secrets included.
  await expect(page.getByText(/Secrets you wrote into your worlds are included/)).toBeVisible();

  await page.getByRole("button", { name: "Review export usage" }).click();
  await expect(page.getByText("ZERO COST TEST · 0 units")).toBeVisible();
  await page.getByRole("button", { name: "Create selected export" }).click();
  await expect(page.getByRole("link", { name: "Download ZIP" })).toBeVisible();

  await page.getByLabel("What needs review?").fill("Please review this access decision.");
  await page.getByRole("button", { name: "Open appeal" }).click();
  await expect(page.getByRole("status")).toContainText("is open");

  const reviewDeletion = page.getByRole("button", { name: "Review deletion effect" });
  await expect(reviewDeletion).toBeEnabled();
  await reviewDeletion.scrollIntoViewIfNeeded();
  await reviewDeletion.click();
  await expect(page.getByText("2 Continuities become unavailable.")).toBeVisible();
  const cancelDeletion = page.getByRole("button", { name: "Cancel unchanged" });
  await cancelDeletion.click();
  expect(deleted).toBe(false);
  await reviewDeletion.scrollIntoViewIfNeeded();
  await reviewDeletion.click();
  await page.getByRole("button", { name: "Confirm exact deletion" }).click();
  await expect(page.getByText("RETAINING MINIMAL AUDIT")).toBeVisible();
  expect(deleted).toBe(true);
  await expectAccessible(page);
});

test("a delayed export stays reviewable and leaves settlement to the server", async ({ page }) => {
  await routeTrustBasics(page);
  let settled = false;
  let released = false;
  let reads = 0;
  await page.route(`**/v1/usage/reservations/${reservationId}/settle`, (route) => {
    settled = true;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        reservationId,
        quoteId,
        actionKey: "export:test",
        status: "SETTLED",
        units: 0,
        createdAt: new Date().toISOString(),
      }),
    });
  });
  await page.route(`**/v1/usage/reservations/${reservationId}/release`, (route) => {
    released = true;
    return route.fulfill({ status: 500, body: "unexpected release" });
  });
  const exportBody = (status: "PENDING" | "READY") => ({
    exportId,
    status,
    schemaVersion: 1,
    worldId,
    selectedScopes: ["world", "characters", "continuity", "history"],
    omittedScopes: [],
    checksum: "c".repeat(64),
    artifactKey: `exports/${exportId}.zip`,
    manifest: { schemaVersion: 1, worldId },
    createdAt: new Date().toISOString(),
    completedAt: status === "READY" ? new Date().toISOString() : null,
    delay:
      status === "PENDING"
        ? {
            reasonCode: "OBJECT_STORE_UNAVAILABLE",
            message: "The export is built and checksummed but storage is delayed.",
          }
        : null,
  });
  await page.route("**/v1/exports", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(exportBody("PENDING")),
    }),
  );
  await page.route(`**/v1/exports/${exportId}`, (route) => {
    reads += 1;
    return route.fulfill({
      contentType: "application/json",
      // The first status read still finds it delayed; storage finishes after that.
      body: JSON.stringify(exportBody(reads >= 2 ? "READY" : "PENDING")),
    });
  });

  await page.goto(`/worlds/${worldId}/trust`);
  await page.getByRole("button", { name: "Review export usage" }).click();
  await page.getByRole("button", { name: "Create selected export" }).click();
  await expect(page.getByText("Export storage delayed")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("not downloadable yet");
  await expect(page.getByRole("link", { name: "Download ZIP" })).toHaveCount(0);
  expect(settled).toBe(false);
  await expectAccessible(page);

  const check = page.getByRole("button", { name: "Check export again" });
  await check.focus();
  await page.keyboard.press("Enter");
  // Either the explicit check or the page's own background check completes it.
  await expect(page.getByRole("link", { name: "Download ZIP" })).toBeVisible({ timeout: 12_000 });
  // Storing the export settles its reservation, so a closed tab cannot strand it.
  expect(settled).toBe(false);
  expect(released).toBe(false);
});

test("an export revoked while delayed is never offered for download", async ({ page }) => {
  await routeTrustBasics(page);
  const exportBody = (status: "PENDING" | "REVOKED") => ({
    exportId,
    status,
    schemaVersion: 1,
    worldId,
    selectedScopes: ["world", "characters", "continuity", "history"],
    omittedScopes: [],
    checksum: "c".repeat(64),
    artifactKey: `exports/${exportId}.zip`,
    manifest: { schemaVersion: 1, worldId },
    createdAt: new Date().toISOString(),
    completedAt: null,
    delay:
      status === "PENDING"
        ? {
            reasonCode: "OBJECT_STORE_UNAVAILABLE",
            message: "The export is built and checksummed but storage is delayed.",
          }
        : null,
  });
  await page.route("**/v1/exports", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(exportBody("PENDING")),
    }),
  );
  await page.route(`**/v1/exports/${exportId}`, (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(exportBody("REVOKED")) }),
  );

  await page.goto(`/worlds/${worldId}/trust`);
  await page.getByRole("button", { name: "Review export usage" }).click();
  await page.getByRole("button", { name: "Create selected export" }).click();
  await expect(page.getByText("Export storage delayed")).toBeVisible();
  await page.getByRole("button", { name: "Check export again" }).click();
  await expect(page.getByText("Export not available")).toBeVisible();
  await expect(page.getByText("This export was revoked")).toBeVisible();
  await expect(page.getByText("Export ready")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Download ZIP" })).toHaveCount(0);
  await expectAccessible(page);
});
