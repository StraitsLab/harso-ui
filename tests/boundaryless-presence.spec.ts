import { test, expect } from "@playwright/test";

const cases = [
  { name: "Announcement", hash: "boardui:announcement", selector: ".hk-announcement:first-child", close: "Dismiss A little more room to think.", open: "Show announcement again" },
  { name: "Notification", hash: "boardui:notification", selector: ".hk-notification", close: "Dismiss notification", open: "Show notification" },
];

for (const surface of cases) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`${surface.name} native display/opacity presence with ${reducedMotion}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(`/#${surface.hash}`);
      const example = page.getByTestId("live-example");
      const target = example.locator(surface.selector);
      await expect(target).toBeVisible();
      await expect(target).toHaveCSS("opacity", "1");
      const samples: Record<string, unknown> = {};
      for (const [phase, action] of [["exit", surface.close], ["enter", surface.open]] as const) {
        const button = example.getByRole("button", { name: action, exact: true });
        await expect(button).toBeEnabled();
        const observed = await button.evaluate(async (element, selector) => {
          const target = document.querySelector(`[data-testid="live-example"] ${selector}`)!;
          const frames: { opacity: number; display: string; hidden: boolean; inert: boolean; ariaHidden: string | null }[] = [];
          (element as HTMLButtonElement).click();
          const start = performance.now();
          await new Promise<void>(resolve => {
            const sample = () => {
              const style = getComputedStyle(target);
              frames.push({ opacity: Number(style.opacity), display: style.display, hidden: target.hasAttribute("hidden"), inert: target.hasAttribute("inert"), ariaHidden: target.getAttribute("aria-hidden") });
              if (performance.now() - start >= 450) resolve();
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
          return frames;
        }, surface.selector);
        samples[phase] = observed;
        if (reducedMotion === "no-preference") {
          expect(observed.some(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== "none")).toBe(true);
        } else {
          expect(observed.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(false);
          await expect(target).toHaveCSS("transition-duration", "0s");
        }
        if (phase === "exit") {
          expect(observed.filter(frame => frame.hidden).every(frame => frame.inert && frame.ariaHidden === "true")).toBe(true);
          await expect(target).toHaveAttribute("hidden", "");
          await expect(target).toHaveCSS("display", "none");
          await expect(target).toHaveCSS("opacity", "0");
          await expect(example.getByRole("status").filter({ hasText: "Work unit updated" })).toHaveCount(0);
        } else {
          await expect(target).not.toHaveAttribute("hidden");
          await expect(target).toHaveCSS("opacity", "1");
          await expect(target).toBeVisible();
        }
      }
      await testInfo.attach("presence-frames", { body: JSON.stringify(samples), contentType: "application/json" });
    });
  }
}
