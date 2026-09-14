import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("marketing navigation stays inside its own instance", async ({ page }) => {
  await page.goto("/#boardui:marketing-dashboard");
  await page.evaluate(() => {
    const decoy = document.createElement("div");
    decoy.className = "hk-marketing-workspace";
    decoy.setAttribute("data-decoy", "true");
    decoy.innerHTML = '<div class="hk-marketing-charts"></div><section aria-label="Campaigns"></section>';
    document.body.prepend(decoy);
    for (const target of document.querySelectorAll(".hk-marketing-charts, .hk-marketing-workspace [aria-label='Campaigns']")) target.scrollIntoView = () => target.setAttribute("data-scrolled", "true");
  });
  const workspace = page.locator(".hk-marketing-example .hk-marketing-workspace");
  for (const name of ["Analytics", "Campaigns"]) {
    await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
    await workspace.getByRole("dialog", { name: "Marketing navigation" }).getByRole("button", { name, exact: true }).click();
  }
  await expect(page.locator("[data-decoy] [data-scrolled]")).toHaveCount(0);
  await expect(workspace.locator("[data-scrolled]")).toHaveCount(2);
});

test("marketing metrics, zero spend and period geometry are truthful", async ({ page }) => {
  await page.goto("/#boardui:marketing-dashboard");
  const workspace = page.locator(".hk-marketing-workspace");
  await expect(workspace.getByRole("progressbar", { name: "Visits", exact: true })).toHaveAttribute("max", "84000");
  await expect(workspace.locator("rect[data-month='Aug']")).toHaveAttribute("height", "0");
  await workspace.getByRole("combobox", { name: "Analytics period" }).selectOption("Aug");
  await expect(workspace.getByRole("progressbar", { name: "Visits", exact: true })).toHaveAttribute("value", "11000");
  // Historical values intentionally live in the chart disclosure.
  // Wave 2 added an earlier "Inspect data" disclosure (channels); open the performance one specifically.
  await workspace.locator("details", { has: page.getByText("ROAS unavailable (zero spend)") }).locator("summary").click();
  await expect(workspace.getByRole("button", { name: "Aug: $0 · ROAS unavailable (zero spend)" })).toBeVisible();
  await expect(workspace.getByRole("img", { name: "Monthly ad spend and ROAS" }).locator("circle")).toHaveCount(0);
  await workspace.getByRole("tab", { name: "Sessions", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(workspace.getByRole("tab", { name: "Channels", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("marketing filters, sorting, selection and delivery remain controlled", async ({ page }) => {
  await page.goto("/#boardui:marketing-dashboard");
  const workspace = page.locator(".hk-marketing-workspace");
  await workspace.getByRole("checkbox", { name: "Select Quiet launch", exact: true }).check();
  await workspace.getByRole("button", { name: "Next page" }).click();
  await expect(workspace.getByText("8 campaigns · 1 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "Sort by Spend" }).click();
  await workspace.getByRole("button", { name: "Sort by Spend" }).click();
  await expect(workspace.getByRole("cell", { name: "New horizons", exact: true })).toBeVisible();
  await workspace.getByLabel("Channel filter").selectOption("Search");
  await workspace.getByLabel("Spend filter").selectOption("Under $1,000");
  await expect(workspace.getByText("1 campaigns · 1 selected")).toBeVisible();
  await page.getByLabel("Host retains requests", { exact: true }).check();
  await workspace.getByLabel("Delivery for Quiet launch").selectOption("Paused");
  await expect(workspace.getByLabel("Delivery for Quiet launch")).toHaveValue("Active");
  await page.getByLabel("Host retains requests", { exact: true }).uncheck();
  await workspace.getByLabel("Delivery for Quiet launch").selectOption("Paused");
  await expect(workspace.getByLabel("Delivery for Quiet launch")).toHaveValue("Paused");
  await workspace.getByLabel("Search campaigns").fill("missing");
  await expect(workspace.getByText("No matching campaigns.")).toBeVisible();
});

test("marketing local campaign form validates, refuses and cancels", async ({ page }) => {
  await page.goto("/#boardui:marketing-dashboard");
  const workspace = page.locator(".hk-marketing-workspace");
  await workspace.getByRole("button", { name: "New campaign", exact: true }).click();
  const panel = workspace.getByRole("dialog", { name: "New campaign", exact: true });
  await expect(panel.getByRole("button", { name: "Add local campaign" })).toBeDisabled();
  await panel.getByRole("textbox", { name: "Campaign name", exact: true }).fill("Gentle beginnings");
  await panel.getByRole("spinbutton", { name: "Sample spend USD", exact: true }).fill("-1");
  await panel.getByRole("button", { name: "Add local campaign" }).click();
  await expect(panel).toBeVisible();
  await panel.getByRole("spinbutton", { name: "Sample spend USD", exact: true }).fill("0");
  await panel.getByLabel("Retain campaign submission", { exact: true }).check();
  await panel.getByRole("button", { name: "Add local campaign" }).click();
  await expect(page.getByLabel("Marketing request")).toContainText("host retained state");
  await panel.getByLabel("Retain campaign submission", { exact: true }).uncheck();
  await panel.getByRole("button", { name: "Add local campaign" }).click();
  await expect(panel).toHaveCount(0);
  await expect(workspace.getByText("9 campaigns · 0 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "New campaign", exact: true }).click();
  await expect(panel.getByRole("textbox", { name: "Campaign name", exact: true })).toHaveValue("");
  await panel.getByRole("button", { name: "Cancel campaign" }).click();
  await expect(workspace.getByText("9 campaigns · 0 selected")).toBeVisible();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`marketing layout ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:marketing-dashboard");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-marketing-workspace");
    await expect(workspace).toHaveAttribute("data-compact", width === 390 ? "true" : "false");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await workspace.evaluate(element => element.querySelector(".hk-marketing-charts")!.getBoundingClientRect().width <= element.querySelector(".hk-dashboard-workspace-thread")!.clientWidth)).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("marketing.png") });
    await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
    const panel = workspace.getByRole("dialog", { name: "Marketing navigation" });
    await panel.getByRole("button", { name: "Campaigns", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await page.getByLabel("Marketing scenario").selectOption("empty");
    await expect(workspace.getByText("No matching campaigns.")).toBeVisible();
    await page.getByLabel("Marketing scenario").selectOption("loading");
    await expect(workspace.getByText("Loading rows…")).toBeVisible();
    await page.getByLabel("Marketing scenario").selectOption("error");
    await expect(workspace.getByRole("alert")).toHaveText("Campaign data unavailable.");
    await workspace.getByRole("button", { name: "Retry campaigns" }).click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("Marketing scenario").selectOption("disabled-error");
    await expect(workspace.getByRole("button", { name: "Retry campaigns" })).toBeDisabled();
  });
}
