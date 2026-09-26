import { expect, test } from "@playwright/test";
import { expectAccessible } from "./support/accessibility.js";

test("home is a player's entry, responsive and accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Simulora");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Step into a world that keeps what happened",
  );
  await expect(page.getByRole("link", { name: "Open World Studio" })).toBeVisible();
  // Without a library (no API here) nothing is invented.
  await expect(page.getByRole("heading", { name: "Continue playing" })).toHaveCount(0);
  await expectAccessible(page);
});

test("home lists the player's own Continuities and Worlds", async ({ page }) => {
  const continuityId = "20000000-0000-4000-8000-000000000001";
  const worldId = "10000000-0000-4000-8000-000000000001";
  await page.route("**/v1/me/library", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        continuities: [
          { continuityId, worldTitle: "The Lantern Inn", lastActivityAt: new Date().toISOString() },
        ],
        worlds: [{ worldId, title: "The Lantern Inn", updatedAt: new Date().toISOString() }],
      }),
    }),
  );
  await page.goto("/");
  const playing = page.getByRole("heading", { name: "Continue playing" }).locator("..");
  await expect(playing.getByRole("link", { name: "The Lantern Inn" })).toHaveAttribute(
    "href",
    `/continuities/${continuityId}`,
  );
  const worlds = page.getByRole("heading", { name: "Your worlds" }).locator("..");
  await expect(worlds.getByRole("link", { name: "The Lantern Inn" })).toHaveAttribute(
    "href",
    `/worlds/${worldId}/studio`,
  );
  await expectAccessible(page);
});

test("home shell remains keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Simulora home" })).toBeFocused();
});
