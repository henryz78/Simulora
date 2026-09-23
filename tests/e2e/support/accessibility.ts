import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * IP-9.7 accessibility gate for one rendered state. It extends the automated
 * axe audit every Gate already ran with checks axe cannot make on its own:
 * WCAG 1.4.10 reflow at 320 CSS px (the 400% zoom equivalent), a visible
 * keyboard focus indicator, and reduced motion actually removing motion.
 * It restores the viewport and motion preference it changed.
 */
export async function expectAccessible(page: Page): Promise<void> {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const original = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 640 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(
    overflow,
    "content must reflow at 320 CSS px without horizontal scrolling",
  ).toBeLessThanOrEqual(1);
  if (original) await page.setViewportSize(original);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const moving = await page.evaluate(() => {
    const seconds = (value: string) =>
      Math.max(
        ...value.split(",").map((part) => {
          const trimmed = part.trim();
          return trimmed.endsWith("ms")
            ? Number.parseFloat(trimmed) / 1000
            : Number.parseFloat(trimmed);
        }),
      );
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          seconds(style.transitionDuration) > 0.001 || seconds(style.animationDuration) > 0.001
        );
      })
      .map(
        (element) =>
          element.tagName.toLowerCase() + (element.className ? `.${element.className}` : ""),
      );
  });
  expect(moving, "reduced motion must leave no running transition or animation").toEqual([]);
  await page.emulateMedia({ reducedMotion: null });

  const focusable = page
    .locator(
      "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
    )
    .first();
  if ((await focusable.count()) > 0) {
    await expectVisibleFocus(page, focusable);
  }
}

/** Keyboard focus must be visible without relying on colour alone. */
export async function expectVisibleFocus(page: Page, target: Locator): Promise<void> {
  await target.focus();
  // `:focus-visible` follows keyboard modality, so arrive by keyboard.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return null;
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(outline, "a focused control must exist").not.toBeNull();
  expect(outline!.style).not.toBe("none");
  expect(outline!.width).toBeGreaterThanOrEqual(2);
}

/** Moves keyboard focus forward until `target` holds it, as a keyboard user would. */
export async function tabTo(page: Page, target: Locator, limit = 60): Promise<void> {
  const handle = await target.elementHandle();
  for (let step = 0; step < limit; step += 1) {
    if (await page.evaluate((element) => document.activeElement === element, handle)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("The control is not reachable by keyboard");
}
