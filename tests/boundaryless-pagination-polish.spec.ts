import { expect, test } from "@playwright/test";

test("pagination keeps both navigation controls together at narrow widths", async ({ page }) => {
  await page.goto("/#boardui:pagination");
  const navigation = page.getByRole("navigation", { name: "Pagination", exact: true });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const previous = await navigation.getByRole("button", { name: "Previous page", exact: true }).boundingBox();
    const next = await navigation.getByRole("button", { name: "Next page", exact: true }).boundingBox();
    expect(Math.abs(previous!.y - next!.y)).toBeLessThan(2);
    expect(next!.x + next!.width).toBeLessThanOrEqual(width);
    await navigation.getByRole("button", { name: "Page 24", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(navigation.getByRole("button", { name: "Page 24", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
    await page.reload();
  }
});

test("pagination reveals every keyboard-focused page and its outline", async ({ browser, baseURL }) => {
  for (const hasTouch of [false, true]) {
    const context = await browser.newContext({ baseURL, hasTouch, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/#boardui:pagination");
        const navigation = page.getByRole("navigation", { name: "Pagination", exact: true });
        const buttons = navigation.locator(".hk-page-window button");
        const labels = await buttons.evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")));
        await buttons.first().focus();
        const traversal = [...labels, ...labels.slice(0, -1).reverse()];
        for (const [index, label] of traversal.entries()) {
          const focused = page.locator(":focus");
          await expect(focused).toHaveAttribute("aria-label", label!);
          await expect.poll(() => focused.evaluate(element => {
            const bounds = element.getBoundingClientRect();
            const window = element.closest(".hk-page-window")!.getBoundingClientRect();
            const style = getComputedStyle(element);
            const outline = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
            return element.matches(":focus-visible") && bounds.left >= window.left && bounds.right <= window.right
              && bounds.left - outline >= window.left && bounds.right + outline <= window.right
              && bounds.top - outline >= window.top && bounds.bottom + outline <= window.bottom;
          })).toBe(true);
          const bounds = await focused.boundingBox();
          expect(bounds!.height).toBeGreaterThanOrEqual(hasTouch ? 44 : 40);
          expect(bounds!.width).toBeGreaterThanOrEqual(hasTouch ? 44 : 36);
          if (index < traversal.length - 1) await page.keyboard.press(index < labels.length - 1 ? "Tab" : "Shift+Tab");
        }
      }
    } finally { await context.close(); }
  }
});
