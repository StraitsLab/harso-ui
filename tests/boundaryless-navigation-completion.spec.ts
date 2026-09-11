import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { page.setDefaultTimeout(5000); });

test("theme host refusal and mounted disable/re-enable retain appearance", async ({ page }) => {
  await page.goto("/#boardui:theme-toggle");
  const example = page.getByTestId("live-example");
  const dark = example.getByRole("radio", { name: "Dark", exact: true });
  const original = await dark.elementHandle();
  await example.getByLabel("Hold host selection").check();
  await dark.click();
  await expect(example.getByLabel("Host request")).toHaveText("Requested: dark");
  await expect(example.getByRole("radio", { name: "System", exact: true })).toBeChecked();
  await example.getByLabel("Hold host selection").uncheck();
  await dark.click();
  await expect(dark).toBeChecked();
  await example.getByLabel("Disable example controls").check();
  await expect(dark).toBeDisabled();
  await example.getByRole("button", { name: "Change appearance, currently dark" }).click({ force: true });
  await expect(dark).toBeChecked();
  await example.getByLabel("Disable example controls").uncheck();
  expect(await dark.evaluate((element, before) => element === before, original)).toBe(true);
  await example.getByRole("button", { name: "Change appearance, currently dark" }).click();
  await expect(example.getByRole("radio", { name: "System", exact: true })).toBeChecked();
});

test("tabs retain drafts through disabled state and handle host refusal and replacement", async ({ page }) => {
  await page.goto("/#boardui:tabs");
  const example = page.getByTestId("live-example");
  const draft = example.getByRole("textbox", { name: "Draft title" });
  await draft.fill("Retained navigation draft");
  const original = await draft.elementHandle();
  await example.getByLabel("Hold host selection").check();
  await example.getByRole("tab", { name: /Sources/ }).click();
  await expect(example.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(example.getByLabel("Host request")).toHaveText("Requested: sources");
  await example.getByLabel("Hold host selection").uncheck();
  await example.getByRole("tab", { name: /Sources/ }).click();
  await example.getByLabel("Disable example controls").check();
  await expect(example.getByRole("tabpanel")).toHaveCount(0);
  await expect(example.getByRole("tab", { name: "Overview" })).toBeDisabled();
  await example.getByLabel("Disable example controls").uncheck();
  await expect(example.getByRole("tab", { name: /Sources/ })).toHaveAttribute("aria-selected", "true");
  await example.getByLabel("Tab content").selectOption("replacement");
  await expect(example.getByRole("tab", { name: /Sources/ })).toHaveCount(0);
  await expect(draft).toHaveValue("Retained navigation draft");
  expect(await draft.evaluate((element, before) => element === before, original)).toBe(true);
  await example.getByLabel("Tab content").selectOption("empty");
  await expect(example.getByRole("tab")).toHaveCount(0);
  await expect(example.getByText("No panels supplied.")).toBeVisible();
  await example.getByLabel("Tab content").selectOption("full");
  await expect(example.getByRole("tab", { name: /Sources/ })).toHaveAttribute("aria-selected", "true");
});

test("tooltip disabled action, replacement, and host refusal use the real trigger", async ({ page }) => {
  await page.goto("/#boardui:tooltip");
  const example = page.getByTestId("live-example");
  const copy = example.getByRole("button", { name: "Copy link", exact: true });
  const original = await copy.elementHandle();
  await example.getByLabel("Hold hint state").check();
  await copy.focus();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await example.getByLabel("Hold hint state").uncheck();
  await example.getByLabel("Hint content").fill("Replacement hint");
  await copy.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Replacement hint");
  await page.keyboard.press("Escape");
  await expect(copy).toBeFocused();
  await example.getByLabel("Hint content").fill("");
  await copy.focus();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await example.getByLabel("Hint content").fill("Restored hint");
  await example.getByLabel("Disable example controls").check();
  await expect(copy).toBeDisabled();
  await expect(example.getByRole("button", { name: /Open brief/ })).toBeDisabled();
  await copy.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Restored hint");
  await copy.click({ force: true });
  await expect(example.getByRole("status").last()).not.toContainText("Copy action received");
  await example.getByLabel("Disable example controls").uncheck();
  expect(await copy.evaluate((element, before) => element === before, original)).toBe(true);
  await copy.click();
  await expect(example.getByRole("status").last()).toContainText("Copy action received");
});

test("sidebar refuses navigation and retains work through disabled and empty navigation", async ({ page }) => {
  await page.goto("/#boardui:sidebar");
  const example = page.getByTestId("navigation-surface-example");
  const draft = example.getByRole("textbox", { name: "Working note" });
  await draft.fill("Keep this workspace draft");
  const original = await draft.elementHandle();
  await example.getByLabel("Hold navigation selection").check();
  await example.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(example.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await expect(example.getByRole("status").last()).toHaveText("Navigation requested: Projects");
  await example.getByLabel("Hold navigation selection").uncheck();
  await example.getByLabel("Disable navigation items").check();
  const projects = example.getByRole("link", { name: "Projects", exact: true });
  await expect(projects).toHaveAttribute("aria-disabled", "true");
  await projects.click({ force: true });
  await expect(example.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await example.getByLabel("Disable navigation items").uncheck();
  await projects.click();
  await expect(example.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await example.getByRole("textbox", { name: "Search navigation" }).fill("no-such-entry");
  await expect(example.getByText("No navigation matches.")).toBeVisible();
  await example.getByRole("textbox", { name: "Search navigation" }).fill("");
  await example.getByRole("button", { name: "Collapse navigation" }).click();
  await example.getByRole("button", { name: "Expand navigation" }).click();
  expect(await draft.evaluate((element, before) => element === before, original)).toBe(true);
  await expect(draft).toHaveValue("Keep this workspace draft");
});

test("dropdown retains host open intent across disabling and replaces open contents", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  const example = page.getByTestId("navigation-surface-example");
  const trigger = example.getByRole("button", { name: "Choose model" });
  const original = await trigger.elementHandle();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Hold menu open", exact: true }).click();
  await example.getByLabel("Disable menu controls").check();
  await expect(trigger).toBeDisabled();
  await expect(page.getByRole("menu", { name: "Model menu", exact: true })).toHaveCount(0);
  await example.getByLabel("Disable menu controls").uncheck();
  await expect(page.getByRole("menu", { name: "Model menu", exact: true })).toBeVisible();
  expect(await trigger.evaluate((element, before) => element === before, original)).toBe(true);
  await example.getByLabel("Model content").selectOption("replacement");
  await expect(page.getByRole("menuitemradio", { name: "Deep research", exact: true })).toHaveCount(0);
  await expect(page.getByRole("menuitemradio", { name: "Replacement model", exact: true })).toBeVisible();
  await example.getByLabel("Model content").selectOption("empty");
  await expect(page.getByText("No models supplied.", { exact: true })).toBeVisible();
  await example.getByLabel("Model content").selectOption("full");
  await expect(page.getByRole("menuitemradio", { name: "Balanced", exact: true })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitem", { name: "Release menu hold", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const viewport of [390, 1440]) {
  test(`carousel presentation matrix ${appearance}/${palette}/${viewport}`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: viewport, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    await page.goto("/#boardui:carousel");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.getByTestId("navigation-surface-example");
    const region = example.getByRole("region", { name: "Research results", exact: true });
    const track = example.getByLabel("Research results slides", { exact: true });
    await expect(page.locator(".hkl-root")).toHaveAttribute("data-mode", appearance);
    await expect(page.locator(".hkl-root")).toHaveAttribute("data-palette", palette);
    for (const contentState of ["default", "long-content"]) {
      await page.getByLabel("Example state", { exact: true }).selectOption(contentState);
      for (const width of ["full", "peek", "mixed", "compact"]) for (const align of ["start", "center"]) {
        await example.getByRole("combobox", { name: "Slide width", exact: true }).selectOption(width);
        await example.getByRole("combobox", { name: "Alignment", exact: true }).selectOption(align);
        await track.focus();
        await page.keyboard.press("Home");
        await expect(region.getByRole("status")).toHaveText("Slide 1 of 4");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        expect(await region.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth + 1;
        })).toBe(true);
        await example.getByLabel("Disable slide controls", { exact: true }).check();
        await expect(example.getByRole("textbox", { name: "Slide note" })).toBeDisabled();
        await track.focus();
        await page.keyboard.press("End");
        const scrollable = await track.evaluate(element => element.scrollWidth > element.clientWidth + 1);
        await expect(region.getByRole("status")).toHaveText(scrollable ? "Slide 4 of 4" : "Slide 1 of 4");
        await example.getByLabel("Show arrows", { exact: true }).uncheck();
        await expect(region.getByRole("button", { name: "Next slide", exact: true })).toHaveCount(0);
        await example.getByLabel("Show dots", { exact: true }).uncheck();
        await expect(region.getByRole("group", { name: "Choose slide" })).toHaveCount(0);
        await example.getByLabel("Show arrows", { exact: true }).check();
        await example.getByLabel("Show dots", { exact: true }).check();
        await example.getByLabel("Disable slide controls", { exact: true }).uncheck();
        for (const count of ["0", "1", "4"]) {
          await example.getByRole("combobox", { name: "Slide count", exact: true }).selectOption(count);
          await expect(region.locator('[aria-roledescription="slide"]')).toHaveCount(Number(count));
          if (count !== "4") {
            await expect(region.getByRole("status")).toHaveText(count === "0" ? "No slides" : "Slide 1 of 1");
            await expect(region.getByRole("button", { name: "Next slide", exact: true })).toHaveCount(0);
          }
        }
        await region.screenshot({ path: testInfo.outputPath(`${contentState}-${width}-${align}.png`), animations: "disabled" });
      }
    }
  });
}
