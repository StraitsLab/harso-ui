import { expect, test } from "@playwright/test";

const labels = [
  "Compare the best hotel options",
  "Show a detailed day-by-day itinerary with restaurants",
  "Check the flight prices",
];

for (const touch of [false, true]) {
  test.describe(touch ? "coarse pointer" : "fine pointer", () => {
    test.use({ hasTouch: touch });

    for (const width of [320, 720]) {
      test(`suggestions at ${width}px keep full labels in one scroll row with reachable targets`, async ({ page }) => {
        await page.setViewportSize({ width, height: 480 });
        // Isolate the shared wrapper's real styles and Button markup, not a private conversation fixture.
        await page.route("**/__suggestion-test", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><title>Suggestion row regression</title>
          <link rel="stylesheet" href="/src/primitives.css?direct">
          <link rel="stylesheet" href="/src/chat/output-card.css?direct">
          <style>body { margin: 0; }</style></head><body>
          <main class="harso-kit" style="display:flex; flex-direction:column; width:100%">
            <div class="hkc-output-suggestions" role="group" aria-label="Suggested questions">
              ${labels.map(label => `<button type="button" class="hk-button hk-button--secondary hk-button--small">${label}</button>`).join("")}
            </div>
          </main></body></html>` }));
        await page.goto("/__suggestion-test");
        await expect(page.getByRole("button").first()).toHaveCSS("font-size", "13px");
        await page.evaluate(() => document.fonts.ready);
        const row = page.getByRole("group", { name: "Suggested questions" });
        const geometry = await row.evaluate(root => ({
          width: root.clientWidth, scrollWidth: root.scrollWidth,
          pageWidth: document.documentElement.scrollWidth,
          buttons: [...root.querySelectorAll("button")].map(button => {
            const box = button.getBoundingClientRect();
            const range = document.createRange(); range.selectNodeContents(button);
            return { top: box.top, height: box.height, textLines: range.getClientRects().length,
              clipped: button.scrollWidth > button.clientWidth, fontSize: getComputedStyle(button).fontSize };
          }),
        }));
        expect(geometry.width).toBe(width);
        expect(geometry.pageWidth).toBe(width);
        expect(geometry.scrollWidth).toBeGreaterThan(width);
        expect(new Set(geometry.buttons.map(button => button.top)).size).toBe(1);
        for (const button of geometry.buttons) {
          expect(button.textLines).toBe(1);
          expect(button.clipped).toBe(false);
          expect(button.height).toBe(touch || width === 320 ? 44 : 32);
        }
        await expect(row.getByRole("button")).toHaveText(labels);
        // Tab reaches every pill; native focus scrolls fully hidden pills into view.
        await page.evaluate(() => {
          document.querySelectorAll("button").forEach(button => button.addEventListener("click", () => button.dataset.clicked = "true"));
        });
        for (let index = 0; index < labels.length; index++) {
          const button = row.getByRole("button").nth(index);
          await page.keyboard.press("Tab");
          await expect(button).toBeFocused();
          await expect(button).toHaveCSS("outline-style", "solid");
          await expect.poll(() => button.evaluate(button => {
            const box = button.getBoundingClientRect(), row = button.parentElement!.getBoundingClientRect();
            return Math.min(box.right, row.right) - Math.max(box.left, row.left);
          })).toBeGreaterThanOrEqual(44);
          const target = await button.evaluate(button => {
            const box = button.getBoundingClientRect(), row = button.parentElement!.getBoundingClientRect();
            const extension = Math.max(0, (42 - box.height) / 2);
            return { top: box.top - extension, bottom: box.bottom + extension, rowTop: row.top, rowBottom: row.bottom,
              left: box.left, right: box.right, rowLeft: row.left, rowRight: row.right,
              hit: document.elementFromPoint((Math.max(box.left, row.left) + Math.min(box.right, row.right)) / 2, box.top - extension + 1) === button };
          });
          expect(target.top).toBeGreaterThanOrEqual(target.rowTop);
          expect(target.bottom).toBeLessThanOrEqual(target.rowBottom);
          expect(target.hit).toBe(true);
          await page.keyboard.press(index % 2 ? "Space" : "Enter");
          await expect(button).toHaveAttribute("data-clicked", "true");
        }
        if (width === 320) expect(await row.evaluate(root => root.scrollLeft)).toBeGreaterThan(0);
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Shift+Tab");
        await expect(row.getByRole("button").first()).toBeFocused();
        // A partly visible focused pill need not auto-scroll in Chromium; horizontal scrolling exposes its full label.
        await row.hover();
        await page.mouse.wheel(1000, 0);
        await expect.poll(() => row.evaluate(root => root.scrollLeft)).toBeGreaterThan(0);
        await expect.poll(() => row.getByRole("button").last().evaluate(button =>
          button.getBoundingClientRect().right <= button.parentElement!.getBoundingClientRect().right
        )).toBe(true);
        await page.mouse.wheel(-1000, 0);
        await expect.poll(() => row.evaluate(root => root.scrollLeft)).toBe(0);
        console.log(JSON.stringify({ touch, ...geometry }));
      });
    }
  });
}
