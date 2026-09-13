import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("medical profile switches associated data and shows zero-correct steps", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const workspace = page.locator(".hk-medical-workspace");
  await expect(workspace.getByText("33,200 steps", { exact: true })).toBeVisible();
  await expect(workspace.locator("rect[data-date='2026-09-03']")).toHaveAttribute("height", "0");
  await expect(workspace.getByText("86 / 100", { exact: true })).toBeVisible();
  await workspace.getByRole("combobox", { name: "Selected profile", exact: true }).selectOption("1");
  await expect(workspace.getByRole("heading", { name: "Mira Sample", exact: true })).toBeVisible();
  await expect(workspace.getByText("36,520 steps", { exact: true })).toBeVisible();
  await workspace.locator("button[data-date='2026-09-03']").click();
  await expect(workspace.getByText("58 / 100", { exact: true })).toBeVisible();
  await expect(workspace.getByRole("region", { name: "Activity", exact: true })).toContainText("0 / 400");
  await workspace.getByRole("button", { name: "Previous month" }).click();
  await expect(workspace.getByRole("heading", { name: "August 2026" })).toBeVisible();
  await expect(workspace.locator("button[data-date='2026-08-01']")).toHaveAttribute("aria-pressed", "true");
  await workspace.locator("button[data-date='2026-08-01']").focus();
  await page.keyboard.press("ArrowRight");
  await expect(workspace.locator("button[data-date='2026-08-02']")).toBeFocused();
});

test("medical filters, sorting, selection and admission changes stay controlled", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const workspace = page.locator(".hk-medical-workspace");
  await workspace.getByRole("checkbox", { name: "Select Alex Example", exact: true }).check();
  await workspace.getByRole("button", { name: "Next page" }).click();
  await expect(workspace.getByText("7 patients · 1 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "Sort by Next appointment" }).click();
  await workspace.getByRole("button", { name: "Sort by Next appointment" }).click();
  await expect(workspace.getByRole("button", { name: "Ari Example", exact: true })).toBeVisible();
  await workspace.getByLabel("Status filter").selectOption("Stable");
  await workspace.getByLabel("Condition filter").selectOption("Allergy");
  await expect(workspace.getByText("3 patients · 1 selected")).toBeVisible();
  await workspace.getByLabel("Search patients").fill("Alex");
  await page.getByLabel("Hold medical requests").check();
  await workspace.getByLabel("Admission for Alex Example").selectOption("Inpatient");
  await expect(workspace.getByLabel("Admission for Alex Example")).toHaveValue("Outpatient");
  await page.getByLabel("Hold medical requests").uncheck();
  await workspace.getByLabel("Admission for Alex Example").selectOption("Inpatient");
  await expect(workspace.getByLabel("Admission for Alex Example")).toHaveValue("Inpatient");
});

test("medical report draft validates, refuses, cancels and stays profile-scoped", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const workspace = page.locator(".hk-medical-workspace");
  await workspace.getByRole("button", { name: "File a report", exact: true }).click();
  const panel = workspace.getByRole("dialog", { name: "File a report", exact: true });
  await expect(panel.getByRole("button", { name: "Save local report" })).toBeDisabled();
  await panel.getByRole("textbox", { name: "Report subject", exact: true }).fill("Example note");
  await panel.getByRole("textbox", { name: "Report note", exact: true }).fill("Synthetic demonstration only.");
  await panel.getByLabel("Retain report submission").check();
  await panel.getByRole("button", { name: "Save local report" }).click();
  await expect(panel).toBeVisible();
  await expect(page.getByLabel("Medical request", { exact: true })).toContainText("host retained state");
  await panel.getByLabel("Retain report submission").uncheck();
  await panel.getByRole("button", { name: "Save local report" }).click();
  await expect(panel).toHaveCount(0);
  await expect(workspace.getByRole("region", { name: "Local report drafts" })).toContainText("Synthetic demonstration only.");
  await workspace.getByRole("combobox", { name: "Selected profile", exact: true }).selectOption("1");
  await expect(workspace.getByRole("region", { name: "Local report drafts" })).toHaveCount(0);
  await workspace.getByRole("button", { name: "File a report", exact: true }).click();
  await expect(panel.getByRole("textbox", { name: "Report subject", exact: true })).toHaveValue("");
  await panel.getByRole("button", { name: "Cancel report" }).click();
  await expect(workspace.getByRole("region", { name: "Local report drafts" })).toHaveCount(0);
});

test("medical alerts track read state independently for each profile", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const workspace = page.locator(".hk-medical-workspace");
  await workspace.getByRole("button", { name: "Inspect Profile record updated" }).click();
  const panel = workspace.getByRole("dialog", { name: "Alert detail" });
  await panel.getByRole("button", { name: "Mark alert read" }).click();
  await expect(panel.getByRole("button", { name: "Read", exact: true })).toBeDisabled();
  await panel.getByRole("button", { name: "Close context panel" }).click();
  await workspace.getByRole("combobox", { name: "Selected profile", exact: true }).selectOption("1");
  await workspace.getByRole("button", { name: "Inspect Profile record updated" }).click();
  await expect(panel.getByRole("button", { name: "Mark alert read" })).toBeEnabled();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`medical layout ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:medical-profile");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-medical-workspace");
    await expect(workspace).toHaveAttribute("data-compact", width === 390 ? "true" : "false");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await workspace.evaluate(element => element.querySelector(".hk-medical-charts")!.getBoundingClientRect().width <= element.querySelector(".hk-dashboard-workspace-thread")!.clientWidth)).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("medical.png") });
    await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
    const panel = workspace.getByRole("dialog", { name: "Health navigation" });
    await panel.getByRole("button", { name: "Patients", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await page.getByLabel("Medical scenario").selectOption("empty");
    await expect(workspace.getByText("No matching patients.")).toBeVisible();
    await page.getByLabel("Medical scenario").selectOption("loading");
    await expect(workspace.getByText("Loading rows…")).toBeVisible();
    await page.getByLabel("Medical scenario").selectOption("error");
    await expect(workspace.getByRole("alert")).toHaveText("Patient data unavailable.");
    await workspace.getByRole("button", { name: "Retry profiles" }).click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("Medical scenario").selectOption("disabled-error");
    await expect(workspace.getByRole("button", { name: "Retry profiles" })).toBeDisabled();
  });
}
