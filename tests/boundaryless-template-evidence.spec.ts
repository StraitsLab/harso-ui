import { expect, test } from "@playwright/test";

for (const { family, button, progress } of [
  { family: "marketing-dashboard", button: "Visits: 84,000", progress: "Visits" },
  { family: "medical-profile", button: "Duration: 44 / 50", progress: "Duration" }
]) {
  test(`${family} chart inspection button keeps its visible name separate from progress`, async ({ page }) => {
    await page.goto(`/#boardui:${family}`);
    const inspect = page.getByRole("button", { name: button, exact: true });
    await expect(inspect).toBeVisible();
    await inspect.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("output").filter({ hasText: button })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: progress, exact: true })).toBeVisible();
  });
}

for (const { family, table, first, next } of [
  { family: "hr-management", table: "Employees", first: "Mira Chen", next: "Ari Morgan" },
  { family: "marketing-dashboard", table: "Campaigns", first: "Quiet launch", next: "Meet Harso" },
  { family: "medical-profile", table: "Patients", first: "Alex Example", next: "Sam Example" }
]) {
  test(`${family} pagination replaces supplied rows and restores the previous page`, async ({ page }) => {
    await page.goto(`/#boardui:${family}`);
    const rows = page.getByRole("table", { name: table, exact: true });
    await expect(rows.getByText(first, { exact: true })).toBeVisible();
    await expect(rows.getByText(next, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(rows.getByText(first, { exact: true })).toHaveCount(0);
    await expect(rows.getByText(next, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Previous page", exact: true }).click();
    await expect(rows.getByText(next, { exact: true })).toHaveCount(0);
    await expect(rows.getByText(first, { exact: true })).toBeVisible();
  });
}

test("HR combo renders both hires and attrition against their independent scales", async ({ page }) => {
  await page.goto("/#boardui:hr-management");
  const chart = page.getByRole("img", { name: "Monthly hires and attrition with independent people and percent axes", exact: true });
  await expect(chart.locator("rect[data-hires='8']")).toHaveAttribute("height", "112");
  await expect(chart.locator("rect[data-hires='8']")).toHaveAttribute("y", "68");
  await expect(chart.locator("polyline")).toHaveAttribute("points", "76,124 154,68 232,152 310,96 388,180");
  await page.getByText("Inspect workforce movement", { exact: true }).click();
  await expect(page.getByText("May: 8 hires · 4% attrition", { exact: true })).toBeVisible();
});

test("Medical sleep metrics update their actual progress values with selected-day data", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const chart = page.locator(".hk-medical-sleep");
  for (const [name, value, max] of [["Duration", "44", "50"], ["Timing", "24", "30"], ["Continuity", "18", "20"]]) {
    await expect(chart.getByRole("progressbar", { name, exact: true })).toHaveAttribute("value", value);
    await expect(chart.getByRole("progressbar", { name, exact: true })).toHaveAttribute("max", max);
  }
  await page.locator("button[data-date='2026-09-03']").click();
  for (const [name, value] of [["Duration", "30"], ["Timing", "16"], ["Continuity", "12"]]) {
    await expect(chart.getByRole("progressbar", { name, exact: true })).toHaveAttribute("value", value);
  }
});
