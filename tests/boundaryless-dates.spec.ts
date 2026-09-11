import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("range drafts commit only on Apply and native dismissal discards them", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  const trigger = page.locator(".hk-date-selection > button");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Research window" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-09-08");
  await expect(page.getByLabel("Selected range")).toHaveText("2026-09-07 / 2026-09-11");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByLabel("Start date", { exact: true })).toHaveValue("2026-09-07");
  await dialog.getByRole("button", { name: "Next workweek" }).click();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByLabel("Selected range")).toHaveText("2026-09-14 / 2026-09-18");
  await trigger.click();
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-09-15");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Selected range")).toHaveText("2026-09-14 / 2026-09-18");
});

test("range validation rejects reversed dates, unavailable interiors and invalid bounds", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.locator(".hk-date-selection > button").click();
  const dialog = page.getByRole("dialog", { name: "Research window" });
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-09-11");
  await dialog.getByLabel("End date", { exact: true }).fill("2026-09-14");
  await expect(dialog.getByRole("status")).toHaveText("The range includes an unavailable date.");
  await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await dialog.getByLabel("End date", { exact: true }).fill("2026-09-10");
  await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-08-31");
  await expect(dialog.getByRole("status")).toContainText("allowed range");
  await dialog.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByLabel("Selected range")).toHaveText("No range");
});

test("controlled single-date refusal and global disabled state remain authoritative", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.getByLabel("Date composition").selectOption("single");
  await page.getByRole("checkbox", { name: "Keep host value" }).check();
  await page.locator(".hk-date-selection > button").click();
  const dialog = page.getByRole("dialog", { name: "Review date" });
  await dialog.getByLabel("Date", { exact: true }).fill("2026-09-09");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByLabel("Date action")).toHaveText("Requested date: 2026-09-09");
  await expect(page.getByLabel("Selected date")).toHaveText("2026-09-06");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(page.locator(".hk-date-selection > button")).toBeDisabled();
});

test("uncontrolled range retains its own applied value without replacing host state", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.getByLabel("Date composition").selectOption("uncontrolled");
  await page.locator(".hk-date-selection > button").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-09-08");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByLabel("Date action")).toHaveText("Local range: 2026-09-08 / 2026-09-11");
  await expect(page.getByLabel("Selected range")).toHaveText("2026-09-07 / 2026-09-11");
  await page.locator(".hk-date-selection > button").click();
  await expect(dialog.getByLabel("Start date", { exact: true })).toHaveValue("2026-09-08");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("inline month preserves keyboard focus, locale-independent values and RTL direction", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.getByLabel("Date composition").selectOption("month");
  const grid = page.getByRole("grid");
  await grid.getByRole("button", { name: /September 6, 2026/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(grid.getByRole("button", { name: /September 7, 2026/ })).toBeFocused();
  await page.keyboard.press("End");
  await expect(grid.getByRole("button", { name: /September 12, 2026/ })).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("button", { name: /October 12, 2026/ })).toBeFocused();
  await page.getByRole("checkbox", { name: "Right to left" }).check();
  await page.getByRole("button", { name: /October 12, 2026/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /October 11, 2026/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Selected date")).toHaveText("2026-10-11");
});

test("supplied meeting slots follow timezone dates and expose repeated-hour offsets", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.getByLabel("Date composition").selectOption("meeting");
  await expect(page.getByRole("radio")).toHaveCount(3);
  await expect(page.getByRole("radio", { name: /Unavailable/ })).toBeDisabled();
  await page.getByRole("radio", { name: /09:00/ }).check();
  await page.getByRole("button", { name: "Confirm time" }).click();
  await expect(page.getByLabel("Date action")).toHaveText("Requested meeting: morning");
  await page.getByLabel("Timezone", { exact: true }).selectOption("America/New_York");
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Confirm time" })).toBeDisabled();
  await page.getByLabel("Date composition").selectOption("dst");
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(page.getByRole("radio", { name: /GMT-4/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /GMT-5/ })).toBeVisible();
  await page.getByRole("radio", { name: /GMT-5/ }).check();
  await page.getByRole("button", { name: "Confirm time" }).click();
  await expect(page.getByLabel("Date action")).toHaveText("Requested meeting: fall-second");
  await page.getByRole("button", { name: "24-hour clock" }).click();
  await expect(page.getByRole("radio", { name: /1:30 AM GMT-5/ })).toBeChecked();
});

test("calendar event details, overflow and inbox retain meaningful actions and focus", async ({ page }) => {
  await page.goto("/#boardui:calendar");
  const event = page.getByRole("button", { name: /^A clearer direction/ });
  await event.click();
  const dialog = page.getByRole("dialog", { name: "A clearer direction" });
  await expect(dialog.getByRole("heading", { name: "Attendees" })).toBeVisible();
  await dialog.getByRole("button", { name: "Join review" }).click();
  await expect(page.getByLabel("Calendar action")).toHaveText("Requested: brief");
  await expect(event).toBeFocused();
  await page.getByText("+2 more", { exact: true }).click();
  await page.getByRole("button", { name: /^Share a first look/ }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Open review", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Inbox · 2" }).click();
  await page.getByRole("menuitem", { name: /Notes ready/ }).click();
  await expect(page.getByLabel("Calendar action")).toHaveText("Inbox: notes");
  await page.getByRole("checkbox", { name: "Empty month" }).check();
  await expect(page.getByText("No events supplied for this month.")).toBeVisible();
});

test("date and calendar surfaces pass accessibility checks with top-layer content open", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.locator(".hk-date-selection > button").click();
  expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByLabel("Date composition").selectOption("meeting");
  expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
  await page.goto("/#boardui:calendar");
  await page.getByRole("button", { name: /^A clearer direction/ }).click();
  expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
});

test("responsive date and calendar compositions keep content and four theme snapshots", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:calendar");
  await expect(page.getByTestId("live-example")).toHaveScreenshot("calendar-light.png");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.getByTestId("live-example")).toHaveScreenshot("calendar-dark.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await page.getByText("+2 more", { exact: true }).click();
  await expect(page.locator(".hk-calendar-event > button")).toHaveCount(6);
  await expect(page.getByTestId("live-example")).toHaveScreenshot("calendar-cozy-narrow.png");
  await page.goto("/#boardui:date-picker");
  await page.locator(".hk-date-selection > button").click();
  const dialog = page.getByRole("dialog", { name: "Research window" });
  await expect(dialog).toHaveScreenshot("date-range-narrow.png");
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(dialog.getByRole("button", { name: /September 7, 2026/ })).toHaveCSS("outline-style", "solid");
});

test("native date disclosure stays usable without anchors and fails closed without popovers", async ({ page }) => {
  await page.goto("/#boardui:date-picker");
  await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index];
        if (rule instanceof CSSSupportsRule && rule.cssText.includes("--hk-date-center")) sheet.deleteRule(index);
      }
    }
  });
  await page.locator(".hk-date-selection > button").click();
  const dialog = page.getByRole("dialog");
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1040);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.addInitScript(() => { delete (HTMLElement.prototype as unknown as { showPopover?: unknown }).showPopover; });
  await page.reload();
  await expect(page.locator(".hk-date-selection > button")).toBeDisabled();
  await expect(page.locator(".hk-date-selection > button")).toHaveAttribute("title", "Requires native popover support");
});

test("320px touch picker scrolls to actions and never loses the chosen range", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 740 }, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/#boardui:date-picker");
  await page.locator(".hk-date-selection > button").tap();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /September 10, 2026/ }).tap();
  await dialog.getByRole("button", { name: /September 11, 2026/ }).tap();
  await dialog.getByRole("button", { name: "Apply", exact: true }).tap();
  await expect(page.getByLabel("Selected range")).toHaveText("2026-09-10 / 2026-09-11");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
