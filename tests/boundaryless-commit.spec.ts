import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { writes: [] as string[], denied: false };
    Object.assign(window, { commitClipboard: probe });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => { probe.writes.push(text); return probe.denied ? Promise.reject(new Error("Denied")) : Promise.resolve(); } } });
  });
});

test("commit copy and keyboard disclosure remain separate with host refusal and disabled states", async ({ page }) => {
  await page.goto("/#vercel:commit");
  const commit = page.getByLabel("Example commit", { exact: true });
  const trigger = commit.getByRole("button", { name: "4 changed files" });
  const copy = commit.getByRole("button", { name: "Copy commit hash" });
  await copy.focus(); await page.keyboard.press("Enter");
  await expect(commit.getByRole("status")).toHaveText("Copied"); await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => (window as unknown as { commitClipboard: { writes: string[] } }).commitClipboard.writes)).toEqual(["a71b90283fc419de567820ba193dc04256efab80"]);
  await page.getByLabel("Hold commit updates").check(); await trigger.click(); await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Hold commit updates").uncheck(); await trigger.focus(); await page.keyboard.press("Space");
  for (const status of ["Added", "Modified", "Deleted", "Renamed"]) await expect(commit.getByLabel(status, { exact: true })).toBeVisible();
  await page.getByLabel("Unavailable metadata").check(); await expect(commit).toContainText("Date unavailable"); await expect(commit.getByLabel(/count unavailable/)).toHaveCount(8);
  await page.getByLabel("No changed files", { exact: true }).check(); await expect(commit).toContainText("No changed files supplied.");
  await page.evaluate(() => { (window as unknown as { commitClipboard: { denied: boolean } }).commitClipboard.denied = true; });
  await copy.click(); await expect(commit.getByRole("status")).toHaveText("Copy failed");
  await page.getByLabel("Example state").selectOption("disabled"); await expect(commit.getByRole("button", { name: "Copy commit hash" })).toBeDisabled(); await expect(commit.getByRole("button", { name: "4 changed files" })).toBeDisabled();
});

test("commit stays compact and accessible in every320px palette", async ({ page }, testInfo) => {
  for (const scheme of ["light", "dark"] as const) {
    for (const palette of ["clean", "cozy"]) {
      await page.setViewportSize({ width: 320, height: 900 }); await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/?commitProof=${scheme}-${palette}#vercel:commit`);
      await page.getByLabel("Palette", { exact: true }).selectOption(palette); await page.getByLabel("Example state").selectOption("long-content");
      const commit = page.getByLabel("Example commit", { exact: true }); await commit.getByRole("button", { name: "4 changed files" }).click();
      await expect(commit.getByText(/continuous-work-progress/)).toBeVisible();
      expect((await commit.locator(".hk-commit-file-path").first().boundingBox())?.height).toBeLessThanOrEqual(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const button of await commit.getByRole("button").all()) { const box = await button.boundingBox(); expect(box?.height).toBeGreaterThanOrEqual(42); }
      expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
      await commit.screenshot({ path: testInfo.outputPath(`commit-${palette}-${scheme}-320.png`) });
      const row = commit.locator(".hk-commit-file").first();
      await row.locator(".hk-commit-file-status").evaluate(status => status.parentElement?.prepend(status));
      const statusBox = await row.locator(".hk-commit-file-status").boundingBox();
      const countsBox = await row.locator(".hk-commit-file-changes").boundingBox();
      expect(Math.abs(statusBox!.y - countsBox!.y)).toBeLessThan(1);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto("/#vercel:commit"); await page.getByRole("button", { name: "4 changed files" }).click();
  await page.getByLabel("Example commit", { exact: true }).screenshot({ path: testInfo.outputPath("commit-desktop.png") });
});
