import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("IP-7 shell is honest, responsive and accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Simulora");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "durable world begins with a known source of truth",
  );
  await expect(page.getByText("IP-7 · World Studio")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("home shell remains keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Simulora home" })).toBeFocused();
});
