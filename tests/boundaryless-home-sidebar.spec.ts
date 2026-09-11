import { expect, test } from "@playwright/test";

for (const width of [1512, 390]) {
  test(`home floating sidebar has detached geometry and controlled navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#boardui:home-dashboard");
    const workspace = page.locator(".hk-home-workspace");
    const navigation = workspace.locator(".hk-ai-workspace-navigation");
    const sidebar = navigation.getByRole("complementary", { name: "Workspace", exact: true });
    await expect(sidebar).toBeVisible();
    const geometry = await sidebar.evaluate(element => {
      const card = element.parentElement!;
      const style = getComputedStyle(card);
      return { sidebar: element.getBoundingClientRect().toJSON(), card: card.getBoundingClientRect().toJSON(), slot: card.parentElement!.getBoundingClientRect().toJSON(), position: style.position, top: style.top, radius: style.borderRadius, border: style.borderTopWidth, shadow: style.boxShadow, background: style.backgroundColor };
    });
    expect(geometry.position).toBe("sticky");
    expect(parseFloat(geometry.top)).toBeGreaterThan(0);
    expect(parseFloat(geometry.radius)).toBeGreaterThanOrEqual(12);
    expect(parseFloat(geometry.border)).toBe(1);
    expect(geometry.shadow).not.toBe("none");
    expect(geometry.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(geometry.card.x).toBeGreaterThan(geometry.slot.x);
    expect(geometry.card.y).toBeGreaterThan(geometry.slot.y);
    expect(geometry.card.right).toBeLessThan(geometry.slot.right);
    expect(geometry.sidebar.right).toBeLessThanOrEqual(geometry.card.right + 1);
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
  const sidebar = workspace.locator(".hk-ai-workspace-navigation").getByRole("complementary", { name: "Workspace", exact: true });
  await expect(sidebar).toBeVisible();
  const navigate = workspace.getByRole("button", { name: "Navigate", exact: true });
  await navigate.click();
  const drawer = workspace.getByRole("dialog", { name: "Workspace navigation", exact: true });
  const drawerSidebar = drawer.getByRole("complementary", { name: "Workspace", exact: true });
  await expect(drawerSidebar).toBeVisible();
  await drawerSidebar.getByRole("button", { name: "Customers", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(navigate).toBeFocused();
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
  await navigate.click();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(navigate).toBeFocused();
  await expect(sidebar.getByRole("button", { name: "Customers", exact: true })).toHaveAttribute("aria-current", "page");
});
