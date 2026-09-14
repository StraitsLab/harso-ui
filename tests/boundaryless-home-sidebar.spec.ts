import { expect, test } from "@playwright/test";

for (const width of [1512, 390]) {
  test(`home sidebar sits flush in the navigation rail with controlled navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#boardui:home-dashboard");
    const workspace = page.locator(".hk-home-workspace");
    const navigation = workspace.locator(".hk-dashboard-workspace-navigation");
    const sidebar = navigation.getByRole("complementary", { name: "Workspace", exact: true });
    if (width === 390) {
      await expect(sidebar).toBeHidden();
      await workspace.getByRole("button", { name: "Toggle workspace navigation", exact: true }).click();
    }
    await expect(sidebar).toBeVisible();
    // Wave 1: the workspace sidebar sits flush in the navigation rail (panel tone + hairline), Linear-style, instead of a floating card.
    const geometry = await sidebar.evaluate(element => {
      const rail = element.closest(".hk-dashboard-workspace-navigation") as HTMLElement;
      const style = getComputedStyle(rail);
      return { sidebar: element.getBoundingClientRect().toJSON(), rail: rail.getBoundingClientRect().toJSON(), border: style.borderInlineEndWidth, background: style.backgroundColor, shadow: style.boxShadow };
    });
    expect(parseFloat(geometry.border)).toBe(1);
    expect(geometry.shadow).toBe("none");
    expect(geometry.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(geometry.sidebar.x).toBeGreaterThanOrEqual(geometry.rail.x);
    expect(geometry.sidebar.right).toBeLessThanOrEqual(geometry.rail.right + 1);
    await expect(sidebar.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByLabel("Hold dashboard host state").check();
    await sidebar.getByRole("button", { name: "Customers", exact: true }).click();
    await expect(sidebar.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(workspace.getByText("Workspace / Overview", { exact: true })).toBeVisible();
    await sidebar.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await expect(sidebar.getByRole("button", { name: "Collapse navigation", exact: true })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByLabel("Dashboard request")).toContainText("host retained state");
    await page.getByLabel("Hold dashboard host state").uncheck();
    await sidebar.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await expect(sidebar.getByRole("button", { name: "Expand navigation", exact: true })).toHaveAttribute("aria-expanded", "false");
    expect((await sidebar.boundingBox())!.width).toBeLessThan(geometry.sidebar.width);
    await sidebar.getByRole("button", { name: "Customers", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(workspace.getByText("Workspace / Customers", { exact: true })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Customers", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(workspace.getByRole("region", { name: "Earnings", exact: true })).toHaveCount(0);
    await expect(workspace.getByRole("table", { name: "Customers", exact: true })).toBeVisible();
    await sidebar.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await sidebar.getByRole("button", { name: "Overview", exact: true }).click();
    await expect(workspace.getByRole("region", { name: "Earnings", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await navigation.screenshot({ path: test.info().outputPath("floating-sidebar.png") });
  });
}

test("home floating sidebar selection synchronizes with mobile drawer and preserves disabled gates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1040 });
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  const sidebar = workspace.locator(".hk-dashboard-workspace-navigation").getByRole("complementary", { name: "Workspace", exact: true });
  await expect(sidebar).toBeHidden();
  const navigate = workspace.getByRole("button", { name: "Navigate", exact: true });
  await navigate.click();
  const drawer = workspace.getByRole("dialog", { name: "Workspace navigation", exact: true });
  const drawerSidebar = drawer.getByRole("complementary", { name: "Workspace", exact: true });
  await expect(drawerSidebar).toBeVisible();
  await drawerSidebar.getByRole("button", { name: "Customers", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(navigate).toBeFocused();
  await expect(workspace.getByText("Workspace / Customers", { exact: true })).toBeVisible();
  // The phone rail is off-canvas; verify selection and disabled gates on desktop.
  await page.setViewportSize({ width: 1512, height: 1040 });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Customers", exact: true })).toHaveAttribute("aria-current", "page");
  for (const state of ["disabled", "loading", "error", "disabled-error"]) {
    await page.getByLabel("Dashboard data").selectOption(state);
    await expect(sidebar.getByRole("button", { name: "Overview", exact: true })).toBeDisabled();
    await expect(sidebar.getByRole("button", { name: "Customers", exact: true })).toBeDisabled();
    await sidebar.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await expect(sidebar.getByRole("button", { name: "Collapse navigation", exact: true })).toHaveAttribute("aria-expanded", "true");
    await expect(navigate).toBeDisabled();
  }
  await page.getByLabel("Dashboard data").selectOption("ready");
  await page.setViewportSize({ width: 390, height: 1040 });
  await expect(sidebar).toBeHidden();
  await navigate.click();
  await expect(drawerSidebar.getByRole("button", { name: "Customers", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(navigate).toBeFocused();
  await expect(workspace.getByText("Workspace / Customers", { exact: true })).toBeVisible();
});
