import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("task events count headers, retain disclosure and collapse only at the selected boundary", async ({ page }) => {
  await page.goto("/#boardui:task-list");
  const example = page.getByLabel("Agent trails example"), advance = example.getByRole("button", { name: "Advance event" });
  await example.getByRole("button", { name: "Restart trail" }).click(); // the fixture now opens populated (three events); specs step from zero
  await expect(example.getByText("Inspect the supplied references", { exact: true })).toHaveCount(0);
  await example.getByLabel("Collapse policy").selectOption("task");
  await advance.click(); await expect(example.locator(".hk-trail-task details").first()).toHaveAttribute("open", "");
  await expect(example.getByText("Read", { exact: true })).toHaveCount(0);
  await advance.click(); await expect(example.getByText("agent-surfaces.tsx", { exact: true })).toBeVisible();
  await advance.click(); const disclosure = example.locator(".hk-trail-task details").first(); await expect(disclosure).not.toHaveAttribute("open");
  await disclosure.locator("summary").focus(); await page.keyboard.press("Enter"); await expect(disclosure).toHaveAttribute("open", "");
  await advance.click(); await expect(example.getByText("Prepare a concise summary", { exact: true })).toBeVisible(); await expect(disclosure).toHaveAttribute("open", "");
  await expect(example.getByText("Draft the findings", { exact: true })).toHaveCount(0);
  await advance.click(); await expect(example.getByLabel("Trail presentation")).toHaveText("Presentation complete — no backend state changed.");
  await example.getByLabel("Disable trail").check(); await disclosure.locator("summary").focus(); await page.keyboard.press("Space"); await expect(disclosure).toHaveAttribute("open", "");
  await expect(advance).toBeDisabled(); await expect(example.locator('[data-status="complete"]')).toHaveCount(0);
});

test("search events reveal sources as a separate row and reject unsafe navigation", async ({ page }) => {
  await page.goto("/#boardui:web-search");
  const example = page.getByLabel("Agent trails example"), advance = example.getByRole("button", { name: "Advance event" });
  await example.getByRole("button", { name: "Restart trail" }).click(); // the fixture now opens populated (three events); specs step from zero
  await advance.click(); await advance.click(); await expect(example.getByText("Sources", { exact: true })).toHaveCount(0);
  await expect(example.locator(".hk-trail-working")).toHaveText("Presenting supplied search steps");
  await advance.click(); await expect(example.getByText("Sources", { exact: true })).toBeVisible();
  await expect(example.locator(".hk-trail-marks .hk-trail-source")).toHaveCount(6);
  const link = example.getByRole("link", { name: "Accessible theme patterns · github.com" });
  await expect(link).toHaveAttribute("href", "https://github.com/"); await expect(link).toHaveAttribute("rel", "noreferrer noopener");
  const overflow = example.getByText("+2", { exact: true }); await overflow.focus(); await page.keyboard.press("Enter");
  await expect(example.getByRole("link", { name: "Additional reference · example.net" })).toBeVisible();
  await expect(example.getByLabel("Rejected unsafe URL · example.com")).not.toHaveAttribute("href");
  await advance.click(); await expect(example.locator(".hk-trail-working")).toHaveCount(0); await expect(example.getByLabel("Trail presentation")).toContainText("Presentation complete");
  await example.getByLabel("Disable trail").check(); await expect(example.locator("a[href]")).toHaveCount(0);
  for (const source of await example.getByRole("link").all()) await expect(source).toHaveAttribute("aria-disabled", "true");
  await example.getByLabel("Empty trail").check(); await expect(example).toContainText("No search steps supplied.");
});

test("timed playback cancels on disable, switching inputs and failed state", async ({ page }) => {
  await page.clock.install(); await page.goto("/#boardui:web-search");
  const example = page.getByLabel("Agent trails example");
  await example.getByRole("button", { name: "Restart trail" }).click();
  await example.getByLabel("Trail playback").selectOption("timed");
  await page.clock.runFor(320); await expect(example.locator(".hk-trail-row")).toHaveCount(1);
  await example.getByLabel("Disable trail").check(); await page.clock.runFor(10000); await expect(example.locator(".hk-trail-row")).toHaveCount(1);
  await example.getByLabel("Disable trail").uncheck(); await example.getByLabel("Trail playback").selectOption("events"); await page.clock.runFor(10000); await expect(example.locator(".hk-trail-row")).toHaveCount(0);
  await page.getByLabel("Example state").selectOption("error"); await expect(example.getByRole("alert")).toContainText("interrupted trail"); await expect(example.getByRole("button", { name: "Advance event" })).toBeDisabled();
  await page.getByLabel("Example state").selectOption("disabled"); await expect(example.getByLabel("Trail playback")).toBeDisabled();
});

test("both trails fit narrow and desktop canvases with four palettes and reduced motion", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  for (const component of ["task-list", "web-search"]) for (const scheme of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
    await page.setViewportSize({ width: 320, height: 900 }); await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`/?trails=${component}-${scheme}-${palette}#boardui:${component}`);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette); await page.getByLabel("Example state").selectOption("long-content");
    const example = page.getByLabel("Agent trails example"), advance = example.getByRole("button", { name: "Advance event" });
  await example.getByRole("button", { name: "Restart trail" }).click(); // the fixture now opens populated (three events); specs step from zero
    for (let unit = 0; unit < (component === "task-list" ? 5 : 4); unit++) await advance.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(example.locator(".hk-agent-trail")).toHaveCSS("border-top-width", "0px");
    await expect(example.locator(".hk-trail-title").first()).toHaveCSS("animation-name", "none");
    expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
    await example.screenshot({ path: testInfo.outputPath(`${component}-${palette}-${scheme}-320.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto("/#boardui:task-list");
  const example = page.getByLabel("Agent trails example");
  await example.getByRole("button", { name: "Restart trail" }).click();
  for (let unit = 0; unit < 5; unit++) await example.getByRole("button", { name: "Advance event" }).click();
  await example.screenshot({ path: testInfo.outputPath("task-list-desktop.png") });
});
