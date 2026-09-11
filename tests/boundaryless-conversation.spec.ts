import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("streamed content follows the bottom but preserves a reader above it and jump focus", async ({ page }) => {
  await page.goto("/#vercel:conversation");
  const viewport = page.getByRole("log");
  const distance = () => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop);
  for (let index = 0; index < 8; index++) await page.getByRole("button", { name: "Add sample update" }).click();
  await expect.poll(distance).toBeLessThan(3);
  await viewport.focus();
  await viewport.press("Home");
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  const position = await viewport.evaluate(element => element.scrollTop);
  await page.getByRole("button", { name: "Add sample update" }).click();
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(position);
  const jump = page.getByRole("button", { name: "Latest response ↓" });
  await expect(jump).toBeVisible();
  await jump.focus();
  await jump.press("Enter");
  await expect.poll(distance).toBeLessThan(3);
  await expect(jump).toBeFocused();
  await viewport.focus();
  await expect(jump).toBeHidden();
  await page.getByRole("button", { name: "Switch sample conversation" }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect.poll(distance).toBeLessThan(3);
});

test("export is user initiated and empty and streaming states remain truthful", async ({ page }) => {
  const downloads: string[] = [];
  page.on("download", download => downloads.push(download.suggestedFilename()));
  await page.goto("/#vercel:conversation");
  expect(downloads).toEqual([]);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download conversation" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("harso-synthetic-conversation.md");
  const file = await download.path();
  expect(await readFile(file!, "utf8")).toContain("## assistant\n\n## Start smaller.");
  await page.getByRole("checkbox", { name: "Streaming sample" }).check();
  await expect(page.getByRole("log")).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Clear sample" }).click();
  await expect(page.getByText("A little space to think.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download conversation" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Streaming sample" }).uncheck();
  await page.getByRole("button", { name: "Help me find a direction" }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("controlled branches refuse unaccepted changes and retain keyed notes", async ({ page }) => {
  await page.goto("/#vercel:message");
  await page.getByText("Notes on this version", { exact: true }).click();
  await page.getByLabel("Version one notes").fill("Keep this draft");
  await page.getByRole("checkbox", { name: "Keep host version" }).check();
  await page.getByRole("button", { name: "Next response" }).click();
  await expect(page.getByLabel("Message action", { exact: true })).toHaveText("Requested version 2");
  await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Version one notes")).toHaveValue("Keep this draft");
  await page.getByRole("checkbox", { name: "Keep host version" }).uncheck();
  await page.getByRole("button", { name: "Next response" }).click();
  await expect(page.getByLabel("Version one notes")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Begin with an invitation." })).toBeVisible();
  await page.getByRole("button", { name: "Previous response" }).click();
  await expect(page.getByLabel("Version one notes")).toHaveValue("Keep this draft");
  await page.getByRole("button", { name: "Mark helpful" }).click();
  await expect(page.getByRole("button", { name: "Mark helpful" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(page.getByRole("button", { name: "Next response" })).toBeDisabled();
});

test("Markdown causes no external request and no script or image execution", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("This test requires a configured baseURL");
  const configuredURL = new URL(baseURL);
  const external: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin !== configuredURL.origin || url.protocol !== configuredURL.protocol) external.push(request.url());
  });
  const dialogs: string[] = [];
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto("/#vercel:message");
  await page.getByRole("checkbox", { name: "Untrusted Markdown sample" }).check();
  const response = page.locator(".hk-message-response").first();
  await expect(response.locator("img, script, iframe")).toHaveCount(0);
  await expect(response.getByRole("link")).toHaveCount(1);
  await expect(response.getByRole("link")).toHaveAttribute("href", "https://example.com/");
  await expect(response).toContainText("Image: An inert remote image");
  expect(external).toEqual([]);
  expect(dialogs).toEqual([]);
  const scan = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
  expect(scan.violations).toEqual([]);
});

test("suggestions fill only the example draft with keyboard and long-content touch", async ({ page, browser, baseURL }) => {
  await page.goto("/#vercel:suggestion");
  await page.getByRole("button", { name: "Show me the trade-offs" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Draft, not sent")).toHaveValue("Show me the trade-offs");
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, hasTouch: true, baseURL });
  const touch = await context.newPage();
  await touch.goto("/#vercel:suggestion");
  await touch.getByLabel("Example state").selectOption("long-content");
  await touch.getByRole("button", { name: /Help me decide what to do first/ }).tap();
  await expect(touch.getByLabel("Draft, not sent")).toHaveValue(/Help me decide/);
  expect(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(touch.getByTestId("live-example")).toHaveScreenshot("conversation-suggestions-narrow.png", { animations: "disabled" });
  await context.close();
});

test("shimmer respects static states, reduced motion, semantic elements and forced colors", async ({ page }) => {
  await page.goto("/#vercel:shimmer");
  const heading = page.getByRole("heading", { name: "Making room for the next idea." });
  await expect(heading).toHaveCSS("animation-name", "hk-text-shimmer");
  for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const paints = await heading.evaluate(element => {
      const style = getComputedStyle(element);
      const probe = document.createElement("span");
      element.append(probe);
      const colors = ["--hk-ink", "--hk-secondary"].map(token => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      });
      probe.remove();
      return { colors, gradient: style.backgroundImage, clip: style.backgroundClip, color: style.color };
    });
    expect(paints.clip).toBe("text");
    expect(paints.color).toBe("rgba(0, 0, 0, 0)");
    for (const color of paints.colors) expect(paints.gradient).toContain(color);
    await page.getByTestId("live-example").screenshot({ path: test.info().outputPath(`shimmer-${appearance}-${palette}.png`), animations: "disabled" });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(heading).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "no-preference" });
  await expect(heading).toHaveCSS("animation-name", "none");
  expect(await heading.evaluate(element => getComputedStyle(element).color)).not.toBe("rgba(0, 0, 0, 0)");
  await page.emulateMedia({ forcedColors: "none" });
  await page.getByRole("checkbox", { name: "Waiting state" }).uncheck();
  await expect(heading).toHaveCSS("animation-name", "none");
});

test("message and conversation remain legible across palettes, narrow widths and keyboard focus", async ({ page }) => {
  for (const appearance of ["light", "dark"]) {
    await page.goto("/#vercel:conversation");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    const sample = page.getByTestId("conversation-sample");
    await expect(sample).toHaveScreenshot(`conversation-${appearance}.png`, { animations: "disabled" });
    const scan = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
    expect(scan.violations).toEqual([]);
  }
  await page.goto("/#vercel:message");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await page.setViewportSize({ width: 375, height: 860 });
  await page.getByRole("button", { name: "Next response" }).focus();
  await expect(page.getByTestId("message-sample")).toHaveScreenshot("conversation-message-cozy-narrow.png", { animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Enter");
  await expect(page.getByText("2 of 2", { exact: true })).toBeVisible();
});
