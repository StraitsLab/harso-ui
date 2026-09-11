import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { writes: [] as string[], denied: false };
    Object.assign(window, { traceClipboard: probe });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => { probe.writes.push(text); return probe.denied ? Promise.reject(new Error("Denied")) : Promise.resolve(); } } });
  });
});

test("stack trace actions remain explicit, controlled, isolated and truthful", async ({ page }) => {
  await page.goto("/#vercel:stack-trace");
  const stack = page.getByLabel("Example stack trace", { exact: true }), expand = stack.getByRole("button", { name: "Stack frames" }), copy = stack.getByRole("button", { name: "Copy stack trace" });
  await copy.focus(); await page.keyboard.press("Enter"); await expect(stack.getByRole("status")).toHaveText("Copied"); await expect(expand).toHaveAttribute("aria-expanded", "false");
  const copied = await page.evaluate(() => (window as unknown as { traceClipboard: { writes: string[] } }).traceClipboard.writes);
  expect(copied).toHaveLength(1); expect(copied[0]).toContain("node:internal/process/task_queues:105:5"); expect(copied[0]).toContain("at unresolved (native)");
  await page.getByLabel("Hold trace disclosure").check(); await expand.click(); await expect(expand).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Hold trace disclosure").uncheck(); await expand.focus(); await page.keyboard.press("Space");
  const location = stack.getByRole("button", { name: "/src/work/progress.ts:42:8" }); await location.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Selected" })).toHaveText("Selected /src/work/progress.ts:42:8 — host callback only; no file opened.");
  await expect(expand).toHaveAttribute("aria-expanded", "true"); await expect(stack.locator("a")).toHaveCount(0);
  await page.getByLabel("Show internal frames").uncheck(); await expect(stack).toContainText("2 internal frames hidden"); await expect(stack.getByText("Internal", { exact: true })).toHaveCount(0);
  await expect(stack.getByText("at unresolved (native)")).toBeVisible();
  await page.evaluate(() => { (window as unknown as { traceClipboard: { denied: boolean } }).traceClipboard.denied = true; });
  await copy.click(); await expect(stack.getByRole("status")).toHaveText("Copy failed");
  await page.getByLabel("Empty trace").check(); await expect(stack).toContainText("No stack trace supplied."); await expect(copy).toBeDisabled();
  await page.getByLabel("Example state").selectOption("disabled"); await expect(copy).toBeDisabled(); await expect(expand).toBeDisabled();
});

test("stack trace preserves narrow scrolling and accessible controls in four palettes", async ({ page }, testInfo) => {
  for (const scheme of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
    await page.setViewportSize({ width: 320, height: 900 }); await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`/?traceProof=${scheme}-${palette}#vercel:stack-trace`);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette); await page.getByLabel("Example state").selectOption("long-content");
    const stack = page.getByLabel("Example stack trace", { exact: true }); await stack.getByRole("button", { name: "Stack frames" }).click();
    const copyBox = await stack.getByRole("button", { name: "Copy stack trace" }).boundingBox(), expandBox = await stack.getByRole("button", { name: "Stack frames" }).boundingBox();
    expect(Math.abs(copyBox!.y - expandBox!.y)).toBeLessThan(1);
    expect((await stack.locator(".hk-stack-frame").first().boundingBox())?.height).toBeLessThanOrEqual(125);
    const scroll = stack.locator(".hk-stack-content"); expect((await scroll.boundingBox())?.height).toBeLessThanOrEqual(280);
    expect(await scroll.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true); await scroll.focus(); await page.keyboard.press("End"); await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await scroll.evaluate(node => { node.scrollTop = 0; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await stack.getByRole("button").all()) expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(42);
    expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
    await stack.screenshot({ path: testInfo.outputPath(`stack-trace-${palette}-${scheme}-320.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto("/#vercel:stack-trace"); await page.getByLabel("Example stack trace", { exact: true }).getByRole("button", { name: "Stack frames" }).click();
  await page.getByLabel("Example stack trace", { exact: true }).screenshot({ path: testInfo.outputPath("stack-trace-desktop.png") });
});
