import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("profile daily geometry and inspection agree, including zero activity", async ({ page }) => {
  await page.goto("/#boardui:ai-profile");
  const workspace = page.locator(".hk-profile-workspace");
  await expect(workspace.getByRole("heading", { name: "Mira Chen", exact: true })).toBeVisible();
  const bars = workspace.locator(".hk-chart-card--orders .hk-chart-bar");
  await expect(bars).toHaveCount(31);
  expect(await bars.nth(3).evaluate(element => element.getBoundingClientRect().height)).toBe(0);
  await workspace.getByLabel("Inspect activity day").selectOption("3");
  await expect(workspace.getByLabel("Daily agent inspection")).toHaveText("2026-08-04: 0 agents");
  await expect(workspace.getByLabel("Daily token inspection")).toHaveText("2026-08-04: 90 tokens");
  await workspace.getByLabel("Activity month").selectOption("2026-07");
  await expect(workspace.getByLabel("Daily agent inspection")).toHaveText("2026-07-01: 2 agents");
  await expect(workspace.getByLabel("Daily token inspection")).toHaveText("2026-07-01: 1,300 tokens");
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`profile ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:ai-profile");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-profile-workspace");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const chartLabels = workspace.locator(".hk-chart-card--orders small:visible");
    expect(await chartLabels.evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth))).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("profile.png") });
    await workspace.getByRole("button", { name: "Browse profiles" }).click();
    await workspace.getByRole("button", { name: "Noah Rivera", exact: true }).click();
    await expect(workspace.getByRole("dialog")).toHaveCount(0);
    await expect(workspace.getByRole("heading", { name: "Noah Rivera", exact: true })).toBeVisible();
    await page.getByLabel("Profile data", { exact: true }).selectOption("empty");
    await expect(workspace.getByText("No activity recorded for this example.")).toBeVisible();
    await page.getByLabel("Profile data", { exact: true }).selectOption("loading");
    await expect(workspace.getByRole("status")).toHaveText("Loading profile activity…");
    await page.getByLabel("Profile data", { exact: true }).selectOption("error");
    await expect(workspace.getByRole("alert")).toContainText("Profile activity unavailable.");
    await workspace.getByRole("button", { name: "Retry profile activity" }).click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await page.getByLabel("Profile data", { exact: true }).selectOption("disabled");
    await expect(workspace.getByRole("button", { name: "Edit profile", exact: true })).toBeDisabled();
  });
}

test("profile edits and share remain local and host controlled", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#boardui:ai-profile");
  const workspace = page.locator(".hk-profile-workspace");
  await workspace.getByRole("button", { name: "Edit profile", exact: true }).click();
  await workspace.getByRole("textbox", { name: "Display name", exact: true }).fill("Mira Updated");
  await workspace.getByRole("button", { name: "Cancel edits" }).click();
  await expect(workspace.getByRole("heading", { name: "Mira Chen", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Edit profile", exact: true }).click();
  await workspace.getByRole("textbox", { name: "Display name", exact: true }).fill("Mira Updated");
  await workspace.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(workspace.getByRole("heading", { name: "Mira Updated", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Share profile", exact: true }).click();
  await workspace.getByRole("button", { name: "Copy profile text" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Mira Updated\nDesigner exploring calm, useful AI experiences.");
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
});

test("profile refusal, validation and keyboard inspection preserve host state", async ({ page }) => {
  await page.goto("/#boardui:ai-profile");
  const workspace = page.locator(".hk-profile-workspace");
  await workspace.getByLabel("Inspect activity day").focus();
  await expect(workspace.getByLabel("Inspect activity day")).toBeFocused();
  await workspace.getByLabel("Inspect activity day").selectOption("1");
  await expect(workspace.getByLabel("Daily agent inspection")).toHaveText("2026-08-02: 4 agents");
  await workspace.getByRole("button", { name: "Edit profile", exact: true }).focus();
  await page.keyboard.press("Enter");
  const name = workspace.getByRole("textbox", { name: "Display name", exact: true });
  await name.fill("   ");
  await expect(workspace.getByRole("button", { name: "Save profile", exact: true })).toBeDisabled();
  await name.fill("Unaccepted name");
  await workspace.getByRole("dialog", { name: "Edit profile" }).getByLabel("Hold profile host state").check();
  await workspace.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(workspace.getByRole("dialog", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByLabel("Profile request")).toContainText("host retained state");
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("heading", { name: "Mira Chen", exact: true })).toBeVisible();
  await workspace.getByLabel("Activity month").selectOption("2026-07");
  await expect(workspace.getByLabel("Activity month")).toHaveValue("2026-08");
  await page.getByLabel("Hold profile host state").uncheck();
  await workspace.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(name).toHaveValue("Mira Chen");
});
