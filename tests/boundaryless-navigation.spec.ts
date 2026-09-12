import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("all chip tones preserve text contrast in every palette", async ({ page }) => {
  await page.goto("/#boardui:chip");
  for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    await expect(page.locator(".hk-chip")).toHaveCount(39);
    expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations, `${appearance}/${palette}`).toEqual([]);
  }
});

test("all ten navigation families expose meaningful accessible examples", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const examples: Record<string, string> = {
    breadcrumb: '.hk-breadcrumb [aria-current="page"]', "button-group": '.hk-button-group input[type="checkbox"]', chip: ".hk-chip--caption", "close-button": ".hk-close--2xs",
    pagination: '.hk-pagination [aria-current="page"]', "segmented-control": '.hk-segmented input[type="radio"]', tabs: '[role="tabpanel"]:not([hidden])',
    "theme-toggle": '.hkl-theme-example fieldset', tooltip: '.hk-icon-button[aria-label="Copy link"]', announcement: ".hk-announcement h3",
  };
  for (const [slug, selector] of Object.entries(examples)) {
    await page.goto(`/#boardui:${slug}`);
    await expect(page.getByTestId("live-example").locator(selector).first()).toBeAttached();
    if (slug === "announcement") {
      for (const announcement of await page.getByTestId("live-example").locator(".hk-announcement").all()) await expect(announcement).toHaveCSS("opacity", "1");
    }
    const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
    expect(audit.violations, slug).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("tab keyboard behavior, drafts, variants and RTL work in the browser", async ({ page }) => {
  await page.goto("/#boardui:tabs");
  const example = page.getByTestId("live-example");
  const overview = example.getByRole("tab", { name: "Overview" });
  const sources = example.getByRole("tab", { name: "Sources 6" });
  await example.getByRole("textbox", { name: "Draft title" }).fill("My unchanged draft");
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(sources).toBeFocused();
  await expect(sources).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(overview).toBeFocused();
  await expect(example.getByRole("textbox", { name: "Draft title" })).toHaveValue("My unchanged draft");
  for (const variant of ["pill", "accent", "vertical"]) {
    await example.getByLabel("Tab treatment").selectOption(variant);
    await overview.focus();
    await page.keyboard.press(variant === "vertical" ? "ArrowDown" : "End");
    await expect(sources).toBeFocused();
    await page.keyboard.press("Home");
    await expect(overview).toBeFocused();
  }
  await example.getByLabel("Tab treatment").selectOption("underline");
  await example.evaluate(element => { element.setAttribute("dir", "rtl"); });
  await overview.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(sources).toBeFocused();
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(example.getByRole("tab", { name: "Overview" })).toBeDisabled();
});

test("native selections, pagination and explicit attention actions reach the host", async ({ page }) => {
  await page.goto("/#boardui:segmented-control");
  const example = page.getByTestId("live-example");
  await example.getByRole("radio", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByText("Showing activity")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("radio", { name: "Overview" })).toBeChecked();
  await example.getByRole("radio", { name: "Compact" }).check();
  await example.getByRole("button", { name: "Read form" }).click();
  await expect(example.getByText("Native form: compact")).toBeVisible();
  await example.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(example.getByRole("radio", { name: "Comfortable" })).toBeChecked();
  await page.goto("/#boardui:button-group");
  await example.getByRole("checkbox", { name: "Markdown" }).check();
  await expect(example.getByText("Selected: pdf, markdown")).toBeVisible();
  await page.goto("/#boardui:pagination");
  await example.getByRole("navigation", { name: "Pagination", exact: true }).getByRole("button", { name: "Next page" }).click();
  await expect(example.getByText("Page 13 of 24 · sample results")).toBeVisible();
  await page.goto("/#boardui:announcement");
  await example.getByRole("button", { name: "Take a look" }).click();
  await expect(example.getByText("Explore action received")).toBeVisible();
  await example.getByRole("button", { name: "Dismiss A little more room to think." }).click();
  await expect(example.getByText("A little more room to think.")).toBeHidden();
  await expect(example.getByText("A title is sometimes enough.")).toBeVisible();
  await example.getByRole("button", { name: "Show announcement again" }).click();
  await expect(example.getByText("A little more room to think.")).toBeVisible();
});

test("tooltips inherit the theme, dismiss with Escape and do not steal focus", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/#boardui:tooltip");
  const example = page.getByTestId("live-example");
  const trigger = example.getByRole("button", { name: "Copy link" });
  for (const side of ["top", "bottom", "left", "right"]) {
    await example.getByLabel("Hint placement").focus();
    await example.getByLabel("Hint placement").selectOption(side);
    await trigger.focus();
    await expect(page.getByRole("tooltip")).toContainText("Copy a link to this sample brief");
    await expect(trigger).toBeFocused();
    const visibleHint = page.locator(".hk-tooltip");
    await expect(visibleHint).toHaveCSS("color", "rgb(19, 21, 24)");
    await expect(visibleHint).toHaveCSS("background-color", "rgb(242, 243, 245)");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
  }
  await trigger.click();
  await expect(example.getByText("Copy action received; no clipboard write.")).toBeVisible();
  await example.getByLabel("Hint placement").focus();
  await example.getByLabel("Hint placement").hover();
  await trigger.hover();
  await expect(page.getByRole("tooltip")).toContainText("Copy a link to this sample brief");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("new components stay readable across palettes and a narrow viewport", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:tabs");
  const example = page.getByTestId("live-example");
  for (const mode of ["light", "dark"]) {
    for (const palette of ["clean", "cozy"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(mode);
      await page.getByLabel("Palette", { exact: true }).selectOption(palette);
      expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
      await expect(example).toHaveScreenshot(`navigation-tabs-${palette}-${mode}.png`, { animations: "disabled" });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of ["tabs", "pagination", "chip", "announcement", "breadcrumb", "button-group", "segmented-control"]) {
    await page.goto(`/#boardui:${slug}`);
    if (["tabs", "announcement", "breadcrumb"].includes(slug)) await page.getByLabel("Example state").selectOption("long-content");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), slug).toBe(true);
    expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations, slug).toEqual([]);
  }
  await expect(example).toHaveScreenshot("navigation-segmented-narrow.png", { animations: "disabled" });
});

test("tooltips escape a clipped local container without leaving their theme", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1040 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/#boardui:tooltip");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  const example = page.getByTestId("live-example");
  await example.locator(".hkl-example-row").evaluate(element => { const row = element as HTMLElement; row.style.overflow = "hidden"; row.style.transform = "translateZ(0)"; row.style.height = "44px"; });
  await example.getByRole("button", { name: "Copy link" }).focus();
  const hint = page.locator(".hk-tooltip");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCSS("background-color", "rgb(243, 237, 227)");
  await expect.poll(() => hint.evaluate(element => { const bounds = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)); })).toBe(true);
  await page.keyboard.press("Escape");
  await expect(hint).toBeHidden();
});

test("theme control is controlled, settles and supports compact cycling", async ({ page }) => {
  await page.goto("/#boardui:theme-toggle");
  const example = page.getByTestId("live-example");
  const dark = example.getByRole("radio", { name: "Dark" });
  await dark.click();
  await expect(dark).toBeChecked();
  await expect(example.locator(".harso-kit")).toHaveAttribute("data-mode", "dark");
  await example.getByRole("button", { name: "Change appearance, currently dark" }).click();
  await expect(example.locator(".harso-kit")).toHaveAttribute("data-appearance", "system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(example.locator(".harso-kit")).toHaveAttribute("data-mode", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(example.locator(".harso-kit")).toHaveAttribute("data-mode", "dark");
});

test("coarse-pointer hit targets work with touch and forced colors preserve selection", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  try {
    await page.goto("/#boardui:segmented-control");
    const example = page.getByTestId("live-example");
    await example.getByRole("radio", { name: "Activity" }).tap();
    await expect(example.getByText("Showing activity")).toBeVisible();
    await page.goto("/#boardui:close-button");
    const close = example.getByRole("button", { name: "Close 2xs example" });
    const bounds = await close.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await close.tap();
    await expect(example.getByText("2xs close action received")).toBeVisible();
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/#boardui:tabs");
    const sources = example.getByRole("tab", { name: "Sources 6" });
    await sources.tap();
    await expect(sources).toHaveAttribute("aria-selected", "true");
    await expect(sources).toHaveCSS("outline-style", "solid");
    expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
    await expect(example).toHaveScreenshot("navigation-forced-colors-touch.png", { animations: "disabled" });
  } finally { await context.close(); }
});
