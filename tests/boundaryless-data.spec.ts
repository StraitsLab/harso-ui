import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("host sorting, filtering, stable selection and pagination stay independent", async ({ page }) => {
  await page.goto("/#boardui:data-table");
  const table = page.getByRole("table", { name: "Work records" });
  await table.getByRole("checkbox", { name: "Select Audience interviews", exact: true }).check();
  await table.getByRole("button", { name: "Sort by Sources" }).focus();
  await page.keyboard.press("Enter");
  await expect(table.getByRole("columnheader", { name: /Sources/ })).toHaveAttribute("aria-sort", "ascending");
  await expect(table.getByRole("checkbox", { name: "Select Audience interviews", exact: true })).toBeChecked();
  await page.getByLabel("Search records").fill("Audience");
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table.getByRole("checkbox", { name: "Select visible rows" })).toBeChecked();
  await page.getByLabel("Search records").fill("");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  await table.getByRole("checkbox", { name: "Select visible rows" }).check();
  await expect(page.getByTestId("live-example")).toContainText("6 selected");
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(table.getByRole("checkbox", { name: "Select Audience interviews", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Update sample rows" }).click();
  await expect(table.getByRole("checkbox", { name: "Select Audience interviews", exact: true })).toBeChecked();
  await table.getByRole("button", { name: "Review Audience interviews", exact: true }).click();
  await expect(page.getByLabel("Data action")).toContainText("No file was opened");
});

for (const family of ["table", "data-table"]) {
test(`${family}: host refusal, loading, error, empty, invalid IDs and disabled states remain honest`, async ({ page }) => {
  await page.goto(`/#boardui:${family}`);
  const table = page.getByRole("table", { name: "Work records" });
  await page.getByLabel("Hold host state").check();
  await table.getByRole("button", { name: "Sort by Work" }).click();
  await expect(table.getByRole("columnheader", { name: /Work/ })).toHaveAttribute("aria-sort", "none");
  await table.getByRole("checkbox", { name: "Select Audience interviews", exact: true }).click();
  await expect(table.getByRole("checkbox", { name: "Select Audience interviews", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Search records").fill("Audience");
  await expect(page.getByLabel("Search records")).toHaveValue("");
  await page.getByLabel("Hold host state").uncheck();
  await page.getByLabel("Duplicate ID sample").check();
  await expect(table.getByRole("alert")).toContainText("unique, non-empty");
  await expect(table.getByRole("checkbox")).toHaveCount(1);
  await page.getByLabel("Duplicate ID sample").uncheck();
  await page.getByLabel("Loading sample").check();
  await expect(table.getByRole("status")).toContainText("Loading rows");
  await page.getByLabel("Loading sample").uncheck();
  await page.getByLabel("Search records").fill("No such record");
  await expect(table.getByRole("status")).toContainText("No rows");
  await page.getByLabel("Example state").selectOption("error");
  await expect(table.getByRole("alert")).toContainText("host could not load");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(page.getByLabel("Search records")).toBeDisabled();
  for (const control of await table.getByRole("button").all()) await expect(control).toBeDisabled();
  for (const control of await table.getByRole("checkbox").all()) await expect(control).toBeDisabled();
});
}

test("native table composition and metrics expose all densities and decorative variants", async ({ page }) => {
  await page.goto("/#boardui:table");
  await expect(page.getByRole("table", { name: "A small evidence set" })).toBeVisible();
  await page.getByLabel("Table density").selectOption("sm");
  await expect(page.getByRole("table", { name: "Work records" })).toHaveAttribute("data-size", "sm");
  await page.goto("/#boardui:stat-cards");
  await expect(page.locator(".hk-stat-cards dt")).toHaveCount(6);
  await page.getByLabel("Metric layout").selectOption("footer");
  await expect(page.locator(".hk-stat-cards")).toHaveAttribute("data-variant", "footer");
  for (const tone of ["blue", "orange", "purple", "pink", "sky", "emerald"]) {
    await page.getByLabel("Metric accent").selectOption(tone);
    await expect(page.locator(`.hk-stat[data-tone="${tone}"]`)).toHaveCount(6);
  }
  await page.getByRole("button", { name: "About Sources reviewed" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("supplied synthetic data");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("data canvases stay accessible across light, dark, narrow, forced-color and motion preferences", async ({ page }) => {
  for (const mode of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:data-table");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await expect(page.getByTestId("live-example")).toHaveScreenshot(`data-table-${mode}.png`, { animations: "disabled" });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Palette").selectOption("cozy");
  await page.getByLabel("Example state").selectOption("long-content");
  await page.getByLabel("Table density").selectOption("sm");
  const region = page.getByRole("region", { name: "Work records table" });
  await region.focus();
  await expect(region).toBeFocused();
  // Wave 1: under 640px the table stacks each row as a labelled card; nothing scrolls sideways and every field stays visible.
  expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  await expect(region.locator("tbody td[data-label=\"Status\"]").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0)); // the sticky gallery header paints at the scroll position; keep it above the tall capture
  await expect(page.getByTestId("live-example")).toHaveScreenshot("data-table-cozy-narrow.png", { animations: "disabled" });
  await page.goto("/#boardui:stat-cards");
  await page.getByLabel("Metric layout").selectOption("footer");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByTestId("live-example")).toHaveScreenshot("data-metrics-cozy-narrow.png", { animations: "disabled" });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/#boardui:data-table");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
