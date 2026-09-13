import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("HR metrics and chart geometry reflect their stated scales", async ({ page }) => {
  await page.goto("/#boardui:hr-management");
  const workspace = page.locator(".hk-hr-workspace");
  await expect(workspace.getByRole("progressbar", { name: "Applications", exact: true })).toHaveAttribute("max", "80");
  await expect(workspace.getByRole("progressbar", { name: "Hires", exact: true })).toHaveAttribute("value", "3");
  await expect(workspace.getByText("76.8 / 100", { exact: true })).toBeVisible();
  const polygon = workspace.locator("polygon.hk-chart-radar");
  const points = (await polygon.getAttribute("points"))!.split(" ").map(point => point.split(",").map(Number));
  expect(points[0][0]).toBeCloseTo(120);
  expect(points[0][1]).toBeCloseTo(44);
  await expect(workspace.locator("rect[data-hires='0']")).toHaveAttribute("height", "0");
  await workspace.getByText("Inspect workforce movement", { exact: true }).click();
  await expect(workspace.getByText("Aug: 0 hires · 0% attrition")).toBeVisible();
  await workspace.getByRole("tab", { name: "People", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(workspace.getByRole("tab", { name: "Departments", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(workspace.getByRole("tabpanel", { name: "Departments", exact: true })).toContainText("Engineering2");
});

test("HR add, cancel and refusal remain local", async ({ page }) => {
  await page.goto("/#boardui:hr-management");
  const workspace = page.locator(".hk-hr-workspace");
  await workspace.getByRole("button", { name: "Add employee", exact: true }).click();
  const form = workspace.getByRole("dialog", { name: "Add employee", exact: true });
  await expect(form.getByRole("button", { name: "Add local employee" })).toBeDisabled();
  await form.getByRole("textbox", { name: "Employee name", exact: true }).fill("Taylor Example");
  await form.getByRole("textbox", { name: "Role", exact: true }).fill("Researcher");
  await form.getByRole("spinbutton", { name: "Annual salary USD", exact: true }).fill("85000");
  await form.getByLabel("Hold HR host state").check();
  await form.getByRole("button", { name: "Add local employee" }).click();
  await expect(form).toBeVisible();
  await expect(page.getByLabel("HR request")).toContainText("host retained state");
  await expect(form.getByRole("textbox", { name: "Employee name", exact: true })).toHaveValue("Taylor Example");
  await form.getByLabel("Hold HR host state").uncheck();
  await form.getByRole("button", { name: "Add local employee" }).click();
  await expect(form).toHaveCount(0);
  await expect(workspace.getByText("9 employees · 0 selected")).toBeVisible();
  await workspace.getByLabel("Search employees").fill("Taylor");
  await expect(workspace.getByRole("cell", { name: "Taylor Example Researcher" })).toBeVisible();
  await workspace.getByRole("button", { name: "Add employee", exact: true }).click();
  await expect(form.getByRole("textbox", { name: "Employee name", exact: true })).toHaveValue("");
  await form.getByRole("button", { name: "Cancel employee" }).click();
  await expect(workspace.getByText("1 employees · 0 selected")).toBeVisible();
});

test("HR table filters, selections and status requests are controlled", async ({ page }) => {
  await page.goto("/#boardui:hr-management");
  const workspace = page.locator(".hk-hr-workspace");
  await workspace.getByRole("checkbox", { name: "Select Mira Chen", exact: true }).check();
  await workspace.getByRole("button", { name: "Next page" }).click();
  await expect(workspace.getByText("8 employees · 1 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "Sort by Salary" }).click();
  await workspace.getByRole("button", { name: "Sort by Salary" }).click();
  await expect(workspace.getByRole("cell", { name: "Drew Lane Team lead" })).toBeVisible();
  await workspace.getByLabel("Department filter").selectOption("Engineering");
  await expect(workspace.getByText("2 employees · 1 selected")).toBeVisible();
  await workspace.getByLabel("Status filter").selectOption("Active");
  await expect(workspace.getByText("1 employees · 1 selected")).toBeVisible();
  await page.getByLabel("Hold HR host state").check();
  await workspace.getByLabel("Status for Mira Chen").selectOption("On leave");
  await expect(workspace.getByLabel("Status for Mira Chen")).toHaveValue("Active");
  await page.getByLabel("Hold HR host state").uncheck();
  await workspace.getByLabel("Status for Mira Chen").selectOption("On leave");
  await expect(workspace.getByText("No matching employees.")).toBeVisible();
});

test("HR disabled state preserves the selected team breakdown", async ({ page }) => {
  await page.goto("/#boardui:hr-management");
  const workspace = page.locator(".hk-hr-workspace");
  await workspace.getByRole("tab", { name: "Departments", exact: true }).click();
  await page.getByLabel("HR data").selectOption("disabled");
  await expect(workspace.getByRole("tabpanel", { name: "Departments", exact: true })).toBeVisible();
  await expect(workspace.getByRole("tab", { name: "Departments", exact: true })).toBeDisabled();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`HR layout ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:hr-management");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-hr-workspace");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await workspace.evaluate(element => {
      const thread = element.querySelector(".hk-dashboard-workspace-thread")!;
      const charts = element.querySelector(".hk-hr-charts")!;
      return charts.getBoundingClientRect().width <= thread.clientWidth;
    })).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("hr.png") });
    await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
    const panel = workspace.getByRole("dialog", { name: "People navigation" });
    await panel.getByRole("button", { name: "Employees", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await page.getByLabel("HR data").selectOption("empty");
    await expect(workspace.getByText("No matching employees.")).toBeVisible();
    await page.getByLabel("HR data").selectOption("loading");
    await expect(workspace.getByText("Loading rows…")).toBeVisible();
    await page.getByLabel("HR data").selectOption("error");
    await expect(workspace.getByRole("alert")).toHaveText("Employee data unavailable.");
    await workspace.getByRole("button", { name: "Retry employees" }).click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("HR data").selectOption("disabled-error");
    await expect(workspace.getByRole("button", { name: "Retry employees" })).toBeDisabled();
  });
}
