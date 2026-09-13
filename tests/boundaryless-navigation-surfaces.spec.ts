import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, height] of [[390, 320], [320, 740], [1440, 1000]]) {
  test(`nested menu keeps a complete focused action at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#boardui:dropdown");
    await page.getByLabel("Example state", { exact: true }).selectOption("long-content");
    await page.getByRole("button", { name: "Choose model", exact: true }).click();
    await page.getByRole("menu", { name: "Model menu", exact: true }).getByRole("menuitem", { name: "More actions", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");
    const menu = page.getByRole("menu", { name: "More actions", exact: true });
    const action = menu.getByRole("menuitem", { name: "Export options", exact: true });
    await expect(action).toBeFocused();
    await expect.poll(() => menu.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const focused = document.activeElement!.getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight && focused.top - 6 >= bounds.top && focused.bottom + 6 <= bounds.bottom;
    })).toBe(true);
    await expect(action).toHaveCSS("min-height", "44px");
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Menu action")).toHaveText("Export requested");
  });
}

test("menu is a real native top-layer composition with grouped actions", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  await expect(page.getByRole("button", { name: "Choose model" })).toBeVisible({ timeout: 2000 });
  await page.getByRole("button", { name: "Choose model" }).click();
  const menu = page.getByRole("menu", { name: "Model menu" });
  await expect(menu).toBeVisible();
  expect(await menu.evaluate(element => element.matches(":popover-open"))).toBe(true);
  await expect(menu.getByRole("menuitemradio", { name: "Balanced" })).toBeFocused();
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
});

test("menu keyboard navigation, selection and native focus return", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  const trigger = page.getByRole("button", { name: "Choose model" });
  const menu = page.getByRole("menu", { name: "Model menu" });
  await trigger.focus();
  await page.keyboard.press("ArrowUp");
  await expect(menu.getByRole("menuitem", { name: "Model settings" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(menu.getByRole("menuitemradio", { name: "Balanced" })).toBeFocused();
  await page.keyboard.press("d");
  await expect(menu.getByRole("menuitemradio", { name: "Deep research" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitemradio", { name: "Fast draft" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Hold menu open" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(page.getByLabel("Menu selection")).toHaveText("Selected: Deep research");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("f");
  await expect(menu.getByRole("menuitemradio", { name: "Fast draft" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Tab");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Research studio", exact: true })).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Shift+Tab");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("checkbox", { name: "Hold selection" })).toBeFocused();
});

test("host may decline opening, selection or closing without fighting another menu", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  const trigger = page.getByRole("button", { name: "Choose model" });
  const menu = page.getByRole("menu", { name: "Model menu" });
  await page.getByRole("checkbox", { name: "Hold menu state" }).check();
  await trigger.click();
  await expect(menu).toBeHidden();
  await expect(page.getByLabel("Menu state request")).toHaveText("true");
  await page.getByRole("checkbox", { name: "Hold menu state" }).uncheck();
  await page.getByRole("checkbox", { name: "Hold selection" }).check();
  await trigger.click();
  await menu.getByRole("menuitemradio", { name: "Deep research" }).click();
  await expect(page.getByLabel("Menu selection")).toHaveText("Selected: Balanced");
  await trigger.click();
  await menu.getByRole("menuitem", { name: "Hold menu open" }).click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Release menu hold" })).toBeFocused();
  await page.getByRole("button", { name: "Research studio", exact: true }).click();
  const workspace = page.getByRole("menu", { name: "Workspace menu" });
  await expect(workspace).toBeVisible();
  await expect(menu).toBeVisible();
  await workspace.getByRole("menuitemradio", { name: "Personal space" }).click();
  await expect(workspace).toBeHidden();
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitem", { name: "Release menu hold" }).click();
  await page.getByRole("button", { name: "Outside action", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Outside action", exact: true })).toBeFocused();
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(trigger).toBeDisabled();
  await expect(page.getByRole("button", { name: "Research studio", exact: true })).toBeDisabled();
});

test("nested menus preserve ancestor focus and close their whole chain on Tab", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  const trigger = page.getByRole("button", { name: "Choose model" });
  const parent = page.getByRole("menu", { name: "Model menu" });
  const child = page.getByRole("menu", { name: "More actions", exact: true });
  const nestedTrigger = parent.getByRole("menuitem", { name: "More actions", exact: true });
  await trigger.click();
  await nestedTrigger.focus();
  await page.keyboard.press("ArrowRight");
  await expect(child.getByRole("menuitem", { name: "Copy reference" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(child).toBeHidden();
  await expect(parent).toBeVisible();
  await expect(nestedTrigger).toBeFocused();
  await nestedTrigger.click();
  await page.keyboard.press("Tab");
  await expect(child).toBeHidden();
  await expect(parent).toBeHidden();
  await expect(page.getByRole("button", { name: "Research studio", exact: true })).toBeFocused();
  await trigger.click();
  await nestedTrigger.click();
  await child.getByRole("menuitem", { name: "Copy reference" }).click();
  await expect(child).toBeHidden();
  await expect(parent).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await nestedTrigger.click();
  await page.getByRole("button", { name: "Outside action", exact: true }).click();
  await expect(child).toBeHidden();
  await expect(parent).toBeHidden();
});

test("account and workspace compositions, RTL keys and bounded edge positioning", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#boardui:dropdown");
  const example = page.getByTestId("navigation-surface-example");
  await page.getByLabel("Menu composition").selectOption("account");
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Menu action")).toHaveText("Settings requested");
  await page.getByLabel("Menu composition").selectOption("team");
  await page.getByRole("button", { name: "Research studio", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Personal space" }).click();
  await expect(page.getByRole("button", { name: "Personal space", exact: true })).toBeVisible();
  await page.getByLabel("Menu composition").selectOption("model");
  await example.evaluate(element => element.setAttribute("dir", "rtl"));
  const trigger = page.getByRole("button", { name: "Choose model" });
  await trigger.evaluate(element => Object.assign(element.style, { position: "fixed", right: "4px", bottom: "4px" }));
  await trigger.click();
  const parent = page.getByRole("menu", { name: "Model menu" });
  const bounds = await parent.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845);
  await parent.getByRole("menuitem", { name: "More actions", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("menu", { name: "More actions", exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menu", { name: "More actions", exact: true })).toBeHidden();
});

test("sidebar search, compact names, draft identity, refusal and repository tree", async ({ page }) => {
  await page.goto("/#boardui:sidebar");
  const example = page.getByTestId("navigation-surface-example");
  const search = example.getByRole("textbox", { name: "Search navigation" });
  await search.fill("in");
  const original = await search.elementHandle();
  await example.getByRole("checkbox", { name: "Hold collapse state" }).check();
  await example.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(search).toBeVisible();
  await example.getByRole("checkbox", { name: "Hold collapse state" }).uncheck();
  await example.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(search).toBeHidden();
  await expect(example.getByRole("link", { name: "Inbox, 3" })).toBeVisible();
  await example.getByRole("link", { name: "Inbox, 3" }).click();
  await expect(example.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();
  await example.getByRole("button", { name: "Expand navigation" }).click();
  await expect(search).toHaveValue("in");
  expect(await search.evaluate((element, before) => element === before, original)).toBe(true);
  await search.fill("");
  await example.getByLabel("Sidebar composition").selectOption("ai");
  await example.getByText("Launch planning", { exact: true }).click();
  await example.getByRole("button", { name: "Compare the alternatives" }).click();
  await expect(example.getByRole("heading", { name: "Compare the alternatives" })).toBeVisible();
  await example.getByText("Repositories", { exact: true }).click();
  await expect(example.getByRole("button", { name: "Research notes" })).toBeHidden();
  await example.getByText("Repositories", { exact: true }).click();
  await expect(example.getByRole("button", { name: "Research notes" })).toBeVisible();
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
});

async function currentSlide(page: Page, slide: number) {
  await expect(page.getByRole("button", { name: `Go to slide ${slide}` })).toHaveAttribute("aria-current", "true");
}

test("carousel mixed widths, controls, boundaries, input keys and retained drafts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:carousel");
  const example = page.getByTestId("navigation-surface-example");
  const track = page.getByLabel("Research results slides");
  const previous = page.getByRole("button", { name: "Previous slide" });
  const next = page.getByRole("button", { name: "Next slide" });
  const note = page.getByRole("textbox", { name: "Slide note" });
  await expect(previous).toBeDisabled();
  await note.fill("Unchanged draft");
  const original = await note.elementHandle();
  await note.press("ArrowRight");
  await currentSlide(page, 1);
  await next.click();
  await currentSlide(page, 2);
  await track.focus();
  await page.keyboard.press("End");
  await currentSlide(page, 4);
  await expect(next).toBeDisabled();
  await page.keyboard.press("Home");
  await currentSlide(page, 1);
  for (const width of ["mixed", "full", "peek"]) {
    await example.getByLabel("Slide width").selectOption(width);
    for (const align of ["start", "center"]) {
      await example.getByLabel("Alignment").selectOption(align);
      await page.getByRole("button", { name: "Go to slide 4" }).click();
      await currentSlide(page, 4);
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "Go to slide 1" }).click();
      await currentSlide(page, 1);
      await expect(previous).toBeDisabled();
    }
  }
  await page.getByRole("checkbox", { name: "Show arrows" }).uncheck();
  await expect(next).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Show dots" }).uncheck();
  await expect(page.getByRole("group", { name: "Choose slide" })).toHaveCount(0);
  await expect(note).toHaveValue("Unchanged draft");
  expect(await note.evaluate((element, before) => element === before, original)).toBe(true);
  await page.getByLabel("Slide count").selectOption("1");
  await expect(page.getByRole("region", { name: "Research results" }).getByRole("status")).toHaveText("Slide 1 of 1");
  await page.getByLabel("Slide count").selectOption("0");
  await expect(page.getByRole("region", { name: "Research results" }).getByRole("status")).toHaveText("No slides");
});

test("carousel RTL resize, native scrolling and reduced motion preserve real positions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:carousel");
  const example = page.getByTestId("navigation-surface-example");
  const track = page.getByLabel("Research results slides");
  await example.evaluate(element => element.setAttribute("dir", "rtl"));
  await track.focus();
  await page.keyboard.press("ArrowLeft");
  await currentSlide(page, 2);
  await page.keyboard.press("End");
  await currentSlide(page, 4);
  await page.setViewportSize({ width: 390, height: 844 });
  await track.focus();
  await page.keyboard.press("Home");
  await currentSlide(page, 1);
  await track.evaluate(element => { element.scrollLeft = -element.scrollWidth; });
  await currentSlide(page, 4);
  await expect(page.getByRole("button", { name: "Next slide" })).toBeDisabled();
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
});

test("new surfaces remain legible in themes, narrow windows and forced colors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const surface of ["dropdown", "sidebar", "carousel"]) {
    await page.goto(`/#boardui:${surface}`);
    for (const appearance of ["light", "dark"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
      await page.getByLabel("Palette", { exact: true }).selectOption(appearance === "dark" ? "cozy" : "clean");
      if (surface === "dropdown") await page.getByRole("button", { name: "Choose model" }).click();
      const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
      expect(audit.violations, `${surface} ${appearance}`).toEqual([]);
      if (surface === "dropdown") await expect(page).toHaveScreenshot(`menu-${appearance}.png`);
      else await expect(page.getByTestId("live-example")).toHaveScreenshot(`${surface}-${appearance}.png`);
      await page.keyboard.press("Escape");
    }
    await page.emulateMedia({ forcedColors: "active" });
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByTestId("live-example")).toBeVisible();
    await page.emulateMedia({ forcedColors: "none" });
    await page.setViewportSize({ width: 1512, height: 1040 });
  }
});

test("fallback CSS stays centered on desktop and bottom-sheet on phone when anchor positioning rules are omitted", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#boardui:dropdown");
  const removed = await page.evaluate(() => {
    let count = 0;
    for (const sheet of document.styleSheets) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index];
        if (rule instanceof CSSSupportsRule && rule.conditionText.includes("anchor-name") && rule.cssText.includes(".hk-dropdown-popover")) { sheet.deleteRule(index); count++; }
      }
    }
    return count;
  });
  expect(removed).toBe(1);
  await page.getByRole("button", { name: "Choose model" }).click();
  const menu = page.getByRole("menu", { name: "Model menu" });
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x + bounds!.width / 2 - 720)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - 500)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 720 });
  const phone = await menu.boundingBox();
  expect(phone).not.toBeNull();
  expect(phone!.x).toBe(0);
  expect(phone!.width).toBe(390);
  expect(phone!.y + phone!.height).toBe(720);
  expect(phone!.height).toBeLessThanOrEqual(720 * 0.85);
  expect(await menu.evaluate(element => element.matches(":popover-open"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Choose model" })).toBeFocused();
});

test("missing native popover support disables the menu without throwing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => { Reflect.deleteProperty(HTMLElement.prototype, "showPopover"); Reflect.deleteProperty(HTMLElement.prototype, "hidePopover"); });
  await page.goto("/#boardui:dropdown");
  await expect(page.getByRole("button", { name: "Choose model" })).toBeDisabled();
  await page.getByLabel("Menu composition").selectOption("team");
  await expect(page.getByRole("button", { name: "Research studio", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test("native editors and composition events keep their keyboard ownership", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  await page.getByRole("button", { name: "Choose model" }).click();
  const menu = page.getByRole("menu", { name: "Model menu" });
  await menu.evaluate(element => {
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Menu draft");
    input.value = "Draft";
    element.prepend(input);
  });
  const input = page.getByRole("textbox", { name: "Menu draft" });
  await input.focus();
  await input.press("End");
  await expect(input).toBeFocused();
  await input.press("b");
  await expect(input).toHaveValue("Draftb");
  await input.press("Home");
  await input.press("ArrowDown");
  await expect(input).toBeFocused();
  const balanced = menu.getByRole("menuitemradio", { name: "Balanced" });
  await balanced.focus();
  await balanced.dispatchEvent("keydown", { key: "f", isComposing: true });
  await expect(balanced).toBeFocused();
});

test("backward carousel controls leave clamped ends with several visible cards", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:carousel");
  await page.getByLabel("Slide width").selectOption("compact");
  const track = page.getByLabel("Research results slides");
  for (const direction of ["ltr", "rtl"]) {
    for (const width of [600, 700]) {
      await page.getByRole("region", { name: "Research results" }).evaluate((element, options) => { element.style.width = `${options.width}px`; element.setAttribute("dir", options.direction); }, { width, direction });
      await track.focus();
      await page.keyboard.press("End");
      await expect(page.getByRole("button", { name: "Next slide" })).toBeDisabled();
      const end = await track.evaluate(element => Math.abs(element.scrollLeft));
      expect(end).toBeGreaterThan(0);
      await page.getByRole("button", { name: "Previous slide" }).click();
      await expect.poll(() => track.evaluate(element => Math.abs(element.scrollLeft))).toBeLessThan(end - 1);
      await track.focus();
      await page.keyboard.press("End");
      await expect(page.getByRole("button", { name: "Next slide" })).toBeDisabled();
      await page.keyboard.press(direction === "rtl" ? "ArrowRight" : "ArrowLeft");
      await expect.poll(() => track.evaluate(element => Math.abs(element.scrollLeft))).toBeLessThan(end - 1);
    }
  }
});

test.describe("native touch carousel", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("a swipe scrolls and snaps without custom gesture handlers", async ({ page, context }) => {
    await page.goto("/#boardui:carousel");
    const track = page.getByLabel("Research results slides");
    await track.scrollIntoViewIfNeeded();
    const bounds = await track.boundingBox();
    expect(bounds).not.toBeNull();
    const start = bounds!.x + bounds!.width - 24;
    const vertical = bounds!.y + 48;
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y: vertical }] });
    for (let step = 1; step <= 8; step++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start - step * 28, y: vertical }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
    await expect(page.getByRole("button", { name: "Previous slide" })).toBeEnabled();
    await client.detach();
  });
});
