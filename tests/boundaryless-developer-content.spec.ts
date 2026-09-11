import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { writes: [] as string[], mode: "success", finish: () => {} };
    Object.assign(window, { clipboardProbe: state });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => { state.writes.push(text); if (state.mode === "failure") return Promise.reject(new Error("Browser denied clipboard")); if (state.mode === "pending") return new Promise<void>(resolve => { state.finish = resolve; }); return Promise.resolve(); } } });
  });
});

test("snippet copies only on keyboard request and discards stale async feedback", async ({ page }) => {
  await page.goto("/#vercel:snippet");
  await expect(page.getByRole("textbox", { name: "Command", exact: true })).toHaveValue("example status");
  const readWrites = () => page.evaluate(() => (window as unknown as { clipboardProbe: { writes: string[] } }).clipboardProbe.writes);
  expect(await readWrites()).toEqual([]);
  const copy = page.getByRole("button", { name: "Copy command" });
  await copy.focus(); await page.keyboard.press("Enter");
  expect(await readWrites()).toEqual(["example status"]);
  await expect(page.getByLabel("Developer request")).toContainText("Command copied");
  await page.getByLabel("Prevent copy").check(); await copy.click(); expect(await readWrites()).toHaveLength(1);
  await page.getByLabel("Prevent copy").uncheck();
  await page.evaluate(() => { (window as unknown as { clipboardProbe: { mode: string } }).clipboardProbe.mode = "failure"; });
  await copy.click(); await expect(page.getByLabel("Developer request")).toContainText("Copy failed"); await expect(copy).toBeEnabled();
  await page.evaluate(() => { (window as unknown as { clipboardProbe: { mode: string } }).clipboardProbe.mode = "pending"; });
  await copy.click(); await expect(copy).toBeDisabled();
  await page.getByRole("button", { name: "Replace sample command" }).click();
  await page.evaluate(() => { (window as unknown as { clipboardProbe: { finish: () => void } }).clipboardProbe.finish(); });
  await expect(page.getByLabel("Developer request")).toContainText("Sample command changed");
  await expect(copy).toBeEnabled();
  await page.getByLabel("Show command prefix").uncheck(); await expect(page.locator(".hk-snippet-addon")).toHaveCount(0);
  await page.getByLabel("Example state").selectOption("disabled"); await expect(copy).toBeDisabled();
});

test("environment reveal is host-owned, copying is masked, replacements start private", async ({ page }) => {
  await page.goto("/#vercel:environment-variables");
  const surface = page.locator(".hk-environment");
  await expect(surface).not.toContainText("demo-sample-one");
  await expect(surface.getByRole("button", { name: "Copy value for SAMPLE_TOKEN" })).toBeDisabled();
  await page.getByLabel("Hold host visibility").check();
  await page.getByRole("switch", { name: "Show values" }).click();
  await expect(page.getByRole("switch")).not.toBeChecked(); await expect(surface).not.toContainText("demo-sample-one");
  await page.getByLabel("Copy format").selectOption("name");
  await surface.getByRole("button", { name: "Copy name for SAMPLE_TOKEN" }).click();
  expect(await page.evaluate(() => (window as unknown as { clipboardProbe: { writes: string[] } }).clipboardProbe.writes)).toEqual(["SAMPLE_TOKEN"]);
  await page.getByLabel("Hold host visibility").uncheck();
  await page.getByRole("switch").focus(); await page.keyboard.press("Space");
  await expect(surface).toContainText("demo-sample-one"); await expect(surface).toContainText("Empty value");
  await page.getByLabel("Copy format").selectOption("export");
  await surface.getByRole("button", { name: "Copy export for SAMPLE_TOKEN" }).click();
  expect(await page.evaluate(() => (window as unknown as { clipboardProbe: { writes: string[] } }).clipboardProbe.writes.at(-1))).toBe("export SAMPLE_TOKEN='demo-sample-one'");
  await page.getByRole("button", { name: "Change sample environment" }).click();
  await expect(page.getByRole("switch")).not.toBeChecked(); await expect(surface).not.toContainText("demo-sample-two");
  await expect(surface.getByRole("button", { name: "Copy export for SAMPLE_TOKEN" })).toBeDisabled();
  await page.getByLabel("Example state").selectOption("disabled"); await expect(page.getByRole("switch")).toBeDisabled();
});

test("package versions stay supplied and developer examples do not fetch or execute", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("This test requires a configured baseURL");
  const configuredURL = new URL(baseURL);
  const external: string[] = []; const failures: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.protocol !== "data:" && (url.origin !== configuredURL.origin || url.protocol !== configuredURL.protocol)) external.push(request.url());
  });
  page.on("pageerror", error => failures.push(error.message));
  for (const family of ["snippet", "environment-variables", "package-info"]) await page.goto(`/#vercel:${family}`);
  const surface = page.locator(".hk-package-info");
  await expect(surface).toContainText("2.1.0"); await expect(surface).toContainText("2.2.0");
  for (const kind of ["major", "minor", "patch", "added", "removed"]) { await page.getByLabel("Change type").selectOption(kind); await expect(surface.locator(".hk-badge")).toHaveText(kind[0].toUpperCase() + kind.slice(1)); }
  await page.getByLabel("Versions unavailable").check(); await expect(surface.locator(".hk-package-version")).toHaveText("Version not supplied");
  expect(external).toEqual([]); expect(failures).toEqual([]);
});

test("developer content is quiet, readable and keyboard accessible in every palette", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    for (const family of ["snippet", "package-info", "environment-variables"]) {
      await page.goto(`/#vercel:${family}`);
      await page.getByLabel("Palette", { exact: true }).selectOption("clean");
      await expect(page.locator(".harso-kit")).toHaveCSS("background-color", scheme === "light" ? "rgb(250, 251, 253)" : "rgb(23, 26, 32)");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.bringToFront();
      await expect(page.getByTestId("live-example")).toHaveScreenshot(`developer-${family}-${scheme}.png`, { animations: "disabled" });
      await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
      await expect(page.locator(".harso-kit")).toHaveCSS("background-color", scheme === "light" ? "rgb(251, 248, 242)" : "rgb(32, 30, 27)");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.bringToFront();
      await expect(page.getByTestId("live-example")).toHaveScreenshot(`developer-${family}-cozy-${scheme}.png`, { animations: "disabled" });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const family of ["snippet", "package-info", "environment-variables"]) {
    await page.goto(`/#vercel:${family}`); await page.getByLabel("Example state").selectOption("long-content");
    await page.getByLabel("Palette", { exact: true }).selectOption("clean");
    await expect(page.locator(".harso-kit")).toHaveCSS("background-color", "rgb(23, 26, 32)");
    if (family === "environment-variables") await page.getByRole("switch").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.bringToFront();
    await expect(page.getByTestId("live-example")).toHaveScreenshot(`developer-${family}-narrow.png`, { animations: "disabled" });
  }
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/#vercel:environment-variables");
  await page.reload();
  await expect(page.getByRole("switch")).not.toBeChecked();
  await page.getByRole("switch").focus(); await page.keyboard.press("Space"); await expect(page.getByRole("switch")).toBeChecked();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
