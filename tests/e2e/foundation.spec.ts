import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation shell is honest, responsive and interactive", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Simulora Engineering Foundation");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Product semantics have not started",
  );
  await expect(page.getByText("IP-1 Foundation")).toBeVisible();

  const reviewButton = page.getByRole("button", { name: "Review foundation boundaries" });
  await reviewButton.click();
  await expect(page.getByRole("heading", { name: "Current boundary" })).toBeVisible();
  await expect(page.getByText("No World or Continuity domain implementation.")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("foundation controls are keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Simulora engineering foundation home" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Review foundation boundaries" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Current boundary" })).toBeVisible();
});
