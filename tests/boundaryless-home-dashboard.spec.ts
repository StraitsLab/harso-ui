import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home periods, customer filters and local tickets are host owned", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  await expect(workspace.getByText("$2,240", { exact: true })).toHaveCount(2);
  await workspace.getByLabel("Dashboard period").selectOption("Monthly");
  await expect(workspace.getByText("$8,960", { exact: true })).toHaveCount(2);
  await workspace.getByRole("button", { name: "Create ticket", exact: true }).click();
  const ticket = workspace.getByRole("dialog", { name: "Create ticket" });
  await ticket.getByRole("textbox", { name: "Ticket description", exact: true }).fill("A synthetic request");
  await ticket.getByRole("button", { name: "Create local ticket" }).click();
  await expect(ticket).toHaveCount(0);
  await expect(page.getByLabel("Dashboard request")).toHaveText("Local ticket created.");
  await workspace.getByRole("button", { name: "Notifications · 1 unread" }).click();
  await workspace.getByRole("button", { name: "Mark as read" }).click();
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
  await workspace.getByLabel("Search customers").fill("Cedar");
  await expect(workspace.getByRole("cell", { name: "Cedar Labs", exact: true })).toBeVisible();
  await expect(workspace.getByText("1 results · 0 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "Activate Cedar Labs" }).click();
  await expect(workspace.getByRole("button", { name: "Pause Cedar Labs" })).toBeVisible();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`home layout ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:home-dashboard");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-home-workspace");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const contributions = workspace.getByRole("region", { name: "Contributions", exact: true });
    expect(await contributions.evaluate(element => element.clientWidth)).toBeGreaterThan(width === 1512 ? 700 : 250);
    await workspace.screenshot({ path: test.info().outputPath("home.png") });
    await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
    const navigation = workspace.getByRole("dialog", { name: "Workspace navigation" });
    await navigation.getByRole("button", { name: "Customers", exact: true }).click();
    await expect(navigation).toHaveCount(0);
    await expect(workspace.getByText("Workspace / Customers")).toBeVisible();
    await page.getByLabel("Dashboard data").selectOption("empty");
    await expect(workspace.getByText("No matching customers.")).toBeVisible();
    await page.getByLabel("Dashboard data").selectOption("disabled");
    await expect(workspace.getByRole("button", { name: "Create ticket", exact: true })).toBeDisabled();
  });
}

test("home customer selection, sorting, pagination and refusal stay consistent", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  await workspace.getByRole("checkbox", { name: "Select Aster Studio", exact: true }).check();
  await workspace.getByRole("button", { name: "Next page" }).click();
  await expect(workspace.getByText("7 results · 1 selected")).toBeVisible();
  await workspace.getByRole("button", { name: "Sort by Amount" }).click();
  await workspace.getByRole("button", { name: "Sort by Amount" }).click();
  await expect(workspace.getByRole("cell", { name: "Grove Systems", exact: true })).toBeVisible();
  await workspace.getByRole("combobox", { name: "Product", exact: true }).selectOption("Studio");
  await expect(workspace.getByText("3 results · 1 selected")).toBeVisible();
  await workspace.getByRole("combobox", { name: "Price", exact: true }).selectOption("Under $300");
  await expect(workspace.getByText("1 results · 1 selected")).toBeVisible();
  await page.getByLabel("Hold dashboard host state").check();
  await workspace.getByRole("button", { name: "Pause Birch Works" }).click();
  await expect(workspace.getByRole("button", { name: "Pause Birch Works" })).toBeVisible();
  await expect(page.getByLabel("Dashboard request")).toContainText("host retained state");
  await page.getByLabel("Hold dashboard host state").uncheck();
  await page.getByLabel("Dashboard data").selectOption("loading");
  await expect(workspace.getByText("Loading rows…")).toBeVisible();
  await expect(workspace.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByLabel("Dashboard data").selectOption("error");
  await expect(workspace.getByRole("alert")).toHaveText("Customer data is unavailable.");
  await workspace.getByRole("button", { name: "Retry dashboard" }).click();
  await expect(workspace.getByRole("alert")).toHaveCount(0);
});

test("home retry respects the host disabled state", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  await page.getByLabel("Dashboard data").selectOption("disabled-error");
  await expect(page.getByRole("button", { name: "Retry dashboard" })).toBeDisabled();
});

test("home hire navigation and ticket cancel/refusal preserve local state", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  await expect(workspace.getByRole("button", { name: "Previous hire" })).toBeDisabled();
  await workspace.getByRole("button", { name: "Next hire" }).click();
  await expect(workspace.getByText("Noah Rivera", { exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Next hire" }).click();
  await expect(workspace.getByRole("button", { name: "Next hire" })).toBeDisabled();
  await workspace.getByRole("button", { name: "Create ticket", exact: true }).focus();
  await page.keyboard.press("Enter");
  const ticket = workspace.getByRole("dialog", { name: "Create ticket" });
  await expect(ticket.getByRole("button", { name: "Create local ticket" })).toBeDisabled();
  await ticket.getByRole("textbox").fill("A draft to discard");
  await ticket.getByRole("button", { name: "Cancel ticket" }).click();
  await workspace.getByRole("button", { name: "Create ticket", exact: true }).click();
  await expect(ticket.getByRole("textbox")).toHaveValue("");
  await ticket.getByRole("textbox").fill("A held request");
  await ticket.getByLabel("Hold dashboard host state").check();
  await ticket.getByRole("button", { name: "Create local ticket" }).click();
  await expect(ticket).toBeVisible();
  await expect(page.getByLabel("Dashboard request")).toContainText("host retained state");
  await page.keyboard.press("Escape");
  await expect(ticket).toHaveCount(0);
});
