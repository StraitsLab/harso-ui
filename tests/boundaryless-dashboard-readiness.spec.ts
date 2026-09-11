import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1800, height: 1040 } });

test("finance composed Sankey, rings, scatter and heatmap inspect the supplied financial samples", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  const flow = page.locator(".hk-sankey");
  const rings = page.locator(".hk-activity-rings");
  const portfolio = page.locator(".hk-scatter");
  const heatmap = page.locator(".hk-heatmap");
  await expect(flow.getByRole("status")).toHaveText("Source total: $4,200.00 · Sink total: $4,200.00");
  for (const [category, amount] of [["Home", "$1,245.00"], ["Food", "$106.00"], ["Travel", "$24.00"], ["Unspent", "$2,825.00"]]) {
    await flow.getByRole("button", { name: `Income → ${category}: ${amount}`, exact: true }).focus();
    await expect(flow.getByRole("status")).toHaveText(`Income → ${category}: ${amount}`);
    await page.keyboard.press("Escape");
    await expect(flow.getByRole("status")).toContainText("Source total: $4,200.00");
  }
  for (const [category, amount] of [["Home", "1245"], ["Food", "106"], ["Travel", "24"]]) {
    await rings.getByRole("button", { name: new RegExp(`^${category}`) }).click();
    await expect(rings.getByRole("status")).toHaveText(`${category}: ${amount} / 1375 USD`);
  }
  await page.keyboard.press("Escape");
  await expect(rings.getByRole("status")).toHaveText("3 activity metrics");
  for (const [name, risk, returns, size] of [["Sample A", 10, 20, 20], ["Sample B", 35, 40, 10], ["Sample C", 20, 32, 15]]) {
    await portfolio.getByRole("img", { name: new RegExp(`Samples · ${name}`) }).focus();
    await expect(portfolio.getByRole("status")).toHaveText(`Samples · ${name} · Risk: ${risk} · Return: ${returns} · Size: ${size}`);
  }
  await page.keyboard.press("Escape");
  await expect(portfolio.getByRole("status")).toContainText("3 observations");
  await expect(heatmap.getByRole("status")).toHaveText("Total: $1375");
  for (const [category, amounts] of [["Home", [1200, 0, 0, 0, 45, 0]], ["Food", [0, 68, 0, 6, 0, 32]], ["Travel", [0, 0, 24, 0, 0, 0]]] as const) {
    for (const [index, amount] of amounts.entries()) {
      const label = `${category} · Sep ${index + 1}: $${amount}`;
      await heatmap.getByRole("button", { name: label, exact: true }).focus();
      await expect(heatmap.getByRole("status")).toHaveText(label);
    }
  }
  await page.keyboard.press("Escape");
  await expect(heatmap.getByRole("status")).toHaveText("Total: $1375");
  await expect(page.getByRole("table", { name: "Transactions" })).toContainText("Studio rent");
  await expect(page.getByLabel("Finance request")).toHaveText("Synthetic USD data. No accounts connected.");
  await page.getByRole("navigation", { name: "Finance navigation" }).getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(flow).toHaveCount(0);
  await page.getByRole("navigation", { name: "Finance navigation" }).getByRole("button", { name: "Overview", exact: true }).click();
  await expect(flow.getByRole("status")).toContainText("Source total: $4,200.00");
  await expect(rings.getByRole("status")).toHaveText("3 activity metrics");
});

test("home composed notifications, earnings, revenue and contributions inspect and retain approved state", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  const earnings = workspace.locator(".hk-chart-card--earnings");
  const revenue = workspace.locator(".hk-chart-card").filter({ has: page.getByRole("heading", { name: "Revenue by customer", exact: true }) });
  const contributions = workspace.locator(".hk-heatmap");
  await earnings.getByText("Inspect earnings", { exact: true }).click();
  await expect(earnings.getByRole("listitem")).toHaveText(["Aster: $60", "Birch: $120", "Cedar: $180", "Dawn: $240", "Elm: $300", "Fern: $360", "Grove: $420"]);
  await workspace.getByLabel("Dashboard period").selectOption("Monthly");
  await expect(earnings.getByRole("listitem")).toHaveText(["Aster: $240", "Birch: $480", "Cedar: $720", "Dawn: $960", "Elm: $1,200", "Fern: $1,440", "Grove: $1,680"]);
  await expect(revenue.getByRole("status")).toHaveText("$8,960");
  for (const [customer, amount] of [["Aster Studio", 320], ["Birch Works", 640], ["Cedar Labs", 960], ["Dawn Collective", 1280], ["Elm Design", 1600], ["Fern House", 1920], ["Grove Systems", 2240]]) {
    await revenue.getByRole("button", { name: new RegExp(`^Inspect ${customer}`) }).focus();
    await expect(revenue.getByRole("status")).toContainText(String(customer));
    await expect(revenue.getByRole("status")).toContainText(String(amount));
  }
  await page.keyboard.press("Escape");
  await expect(revenue.getByRole("status")).toHaveText("$8,960");
  await contributions.getByRole("button", { name: "Cedar Labs · Week 2: 3", exact: true }).click();
  await expect(contributions.getByRole("status")).toHaveText("Cedar Labs · Week 2: 3");
  await page.keyboard.press("Escape");
  await expect(contributions.getByRole("status")).toHaveText("Total: 84");
  await workspace.getByRole("button", { name: "Notifications · 1 unread", exact: true }).click();
  const notifications = workspace.getByRole("dialog", { name: "Notifications", exact: true });
  await expect(notifications).toContainText("Unread: Your workspace summary is ready.");
  await notifications.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(notifications).toContainText("Your workspace summary is read.");
  await expect(notifications.getByRole("button", { name: "Mark as read", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await workspace.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(notifications).toContainText("Your workspace summary is read.");
  await page.keyboard.press("Escape");
  await expect(workspace.getByLabel("Dashboard period")).toHaveValue("Monthly");
  await expect(revenue.getByRole("status")).toHaveText("$8,960");
});

test("finance disabled host suppresses inspection in every composed chart", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  await page.getByLabel("Transaction data", { exact: true }).selectOption("disabled");
  for (const selector of [".hk-sankey", ".hk-activity-rings", ".hk-heatmap"]) {
    await expect.soft(page.locator(selector).getByRole("button").first(), `${selector} respects Finance disabled`).toBeDisabled();
  }
  await expect.soft(page.locator(".hk-scatter circle").first()).toHaveAttribute("tabindex", "-1");
});

test("home disabled host suppresses every composed chart interaction", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  await page.getByLabel("Dashboard data").selectOption("disabled");
  await expect(page.getByLabel("Dashboard period")).toBeDisabled();
  await expect(page.locator(".hk-heatmap").getByRole("button").first()).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Inspect Aster Studio/ })).toBeDisabled();
});

test("home controlled callbacks refuse changes while held and recover after release", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  const hold = page.getByLabel("Hold dashboard host state").first();
  await hold.check();
  await workspace.getByRole("button", { name: /^Notifications/ }).click();
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Create ticket", exact: true }).click();
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
  await workspace.getByLabel("Dashboard period").selectOption("Monthly");
  await expect(workspace.getByLabel("Dashboard period")).toHaveValue("Weekly");
  await workspace.getByLabel("Search customers").fill("Aster");
  await expect(workspace.getByLabel("Search customers")).toHaveValue("");
  await workspace.getByRole("combobox", { name: "Product", exact: true }).selectOption("Studio");
  await expect(workspace.getByRole("combobox", { name: "Product", exact: true })).toHaveValue("All");
  await workspace.getByRole("combobox", { name: "Price", exact: true }).selectOption("Under $300");
  await expect(workspace.getByRole("combobox", { name: "Price", exact: true })).toHaveValue("All");
  await workspace.getByRole("button", { name: "Sort by Amount", exact: true }).click();
  await expect(workspace.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "none");
  await workspace.getByRole("checkbox", { name: "Select Aster Studio", exact: true }).click();
  await expect(workspace.getByRole("checkbox", { name: "Select Aster Studio", exact: true })).not.toBeChecked();
  await workspace.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(workspace.getByRole("cell", { name: "Aster Studio", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Pause Aster Studio", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Pause Aster Studio", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Next hire", exact: true }).click();
  await expect(workspace.getByText("Mira Chen", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Dashboard request")).toContainText("host retained state");
  await hold.uncheck();
  await workspace.getByRole("button", { name: /^Notifications/ }).click();
  await hold.check();
  await workspace.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(workspace.getByRole("dialog")).toContainText("Unread: Your workspace summary is ready.");
  await expect(page.getByLabel("Dashboard request")).toHaveText("Mark notification read; host retained state.");
  await hold.uncheck();
  await workspace.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(workspace.getByRole("dialog")).toContainText("Your workspace summary is read.");
  await page.keyboard.press("Escape");
  await workspace.getByLabel("Dashboard period").selectOption("Monthly");
  await expect(workspace.getByLabel("Dashboard period")).toHaveValue("Monthly");
  await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
  await hold.check();
  const navigation = workspace.getByRole("dialog", { name: "Workspace navigation", exact: true });
  await navigation.getByRole("button", { name: "Customers", exact: true }).click();
  await expect(navigation).toBeVisible();
  await expect(workspace.getByText("Workspace / Overview", { exact: true })).toBeVisible();
  await hold.uncheck();
  await navigation.getByRole("button", { name: "Customers", exact: true }).click();
  await expect(navigation).toHaveCount(0);
  await expect(workspace.getByText("Workspace / Customers", { exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
  await navigation.getByRole("button", { name: "Overview", exact: true }).click();
  await workspace.getByRole("button", { name: "Next hire", exact: true }).click();
  await hold.check();
  await workspace.getByRole("button", { name: "Previous hire", exact: true }).click();
  await expect(workspace.getByText("Noah Rivera", { exact: true })).toBeVisible();
  await hold.uncheck();
  await workspace.getByRole("button", { name: "Previous hire", exact: true }).click();
  await expect(workspace.getByText("Mira Chen", { exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Create ticket", exact: true }).click();
  const ticket = workspace.getByRole("dialog", { name: "Create ticket", exact: true });
  await ticket.getByRole("textbox", { name: "Ticket description", exact: true }).fill("Local held ticket");
  await ticket.getByLabel("Hold dashboard host state").check();
  await ticket.getByRole("button", { name: "Create local ticket", exact: true }).click();
  await expect(ticket).toBeVisible();
  await expect(ticket.getByRole("textbox")).toHaveValue("Local held ticket");
  await expect(page.getByLabel("Dashboard request")).toHaveText("Local ticket created; host retained state.");
  await ticket.getByLabel("Hold dashboard host state").uncheck();
  await ticket.getByRole("button", { name: "Create local ticket", exact: true }).click();
  await expect(ticket).toHaveCount(0);
  await expect(page.getByLabel("Dashboard request")).toHaveText("Local ticket created.");
});

test("home lifecycle removes stale overview data, gates notifications and retries without inventing provider state", async ({ page }) => {
  await page.goto("/#boardui:home-dashboard");
  const workspace = page.locator(".hk-home-workspace");
  await page.getByLabel("Dashboard data").selectOption("empty");
  await expect(workspace.getByText("No matching customers.")).toBeVisible();
  await expect(workspace.getByText("No earnings", { exact: true })).toBeVisible();
  await expect(workspace.locator(".hk-heatmap").getByRole("status")).toHaveText("No observations supplied.");
  await page.getByLabel("Dashboard data").selectOption("ready");
  await workspace.getByRole("button", { name: /^Notifications/ }).click();
  for (const state of ["loading", "error", "disabled-error"]) {
    await page.getByLabel("Dashboard data").selectOption(state);
    await expect(workspace.getByRole("button", { name: "Mark as read", exact: true })).toBeDisabled();
    await expect(workspace.getByLabel("Search customers")).toBeDisabled();
    await expect(workspace.locator(".hk-chart-card")).toHaveCount(0);
  }
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("button", { name: "Retry dashboard", exact: true })).toBeDisabled();
  await page.getByLabel("Dashboard data").selectOption("error");
  await page.getByLabel("Hold dashboard host state").check();
  await workspace.getByRole("button", { name: "Retry dashboard", exact: true }).click();
  await expect(workspace.getByRole("alert")).toHaveText("Customer data is unavailable.");
  await expect(page.getByLabel("Dashboard request")).toHaveText("Retry requested; host retained state.");
  await page.getByLabel("Hold dashboard host state").uncheck();
  await workspace.getByRole("button", { name: "Retry dashboard", exact: true }).click();
  await expect(workspace.getByRole("alert")).toHaveCount(0);
  await expect(workspace.locator(".hk-chart-card")).toHaveCount(3);
});
