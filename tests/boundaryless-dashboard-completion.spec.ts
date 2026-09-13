import { expect, test } from "@playwright/test";

const dashboards = [
  { id: "finance-dashboard", scenario: "Transaction data", hold: "Hold host state", request: "Finance request", table: "Transactions", first: "Studio rent", search: "Search transactions", sort: "Amount", retry: "Retry transactions", count: "matching records", size: 7 },
  { id: "home-dashboard", scenario: "Dashboard data", hold: "Hold dashboard host state", request: "Dashboard request", table: "Customers", first: "Aster Studio", search: "Search customers", sort: "Customer", retry: "Retry dashboard", count: "results", size: 7 },
  { id: "hr-management", scenario: "HR data", hold: "Hold HR host state", request: "HR request", table: "Employees", first: "Mira Chen", search: "Search employees", sort: "Employee", retry: "Retry employees", count: "employees", size: 8 },
  { id: "marketing-dashboard", scenario: "Marketing scenario", hold: "Host retains requests", request: "Marketing request", table: "Campaigns", first: "Quiet launch", search: "Search campaigns", sort: "Campaign", retry: "Retry campaigns", count: "campaigns", size: 8 },
  { id: "medical-profile", scenario: "Medical scenario", hold: "Hold medical requests", request: "Medical request", table: "Patients", first: "Alex Example", search: "Search patients", sort: "Patient", retry: "Retry profiles", count: "patients", size: 7 },
] as const;

for (const dashboard of dashboards) {
  test(`${dashboard.id} lifecycle clears withdrawn rows and recovers through controlled retry`, async ({ page }) => {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    const scenario = host.getByRole("combobox", { name: dashboard.scenario, exact: true });
    const table = host.getByRole("table", { name: dashboard.table, exact: true });
    await host.getByLabel(`Select ${dashboard.first}`, { exact: true }).check();
    await host.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(host.getByText(`${dashboard.size} ${dashboard.count} · 1 selected`, { exact: true })).toBeVisible();
    await scenario.selectOption("empty");
    await expect(host.getByText(`No matching ${dashboard.table.toLowerCase()}.`, { exact: true })).toBeVisible();
    await expect(host.getByText(`0 ${dashboard.count} · 0 selected`, { exact: true })).toBeVisible();
    await expect(table.locator("tbody")).not.toContainText(dashboard.first);
    await expect(host.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
    await scenario.selectOption("loading");
    await expect(host.getByText("Loading rows…", { exact: true })).toBeVisible();
    await expect(host.getByLabel(dashboard.search)).toBeDisabled();
    await expect(table.locator("tbody")).not.toContainText(dashboard.first);
    await scenario.selectOption("error");
    await expect(host.getByRole("alert")).toBeVisible();
    await expect(host.getByLabel(dashboard.search)).toBeDisabled();
    await scenario.selectOption("disabled-error");
    await expect(host.getByRole("button", { name: dashboard.retry, exact: true })).toBeDisabled();
    await scenario.selectOption("error");
    await host.getByLabel(dashboard.hold, { exact: true }).check();
    await host.getByRole("button", { name: dashboard.retry, exact: true }).click();
    await expect(scenario).toHaveValue("error");
    await expect(host.getByLabel(dashboard.request, { exact: true })).toContainText("host retained");
    await host.getByLabel(dashboard.hold, { exact: true }).uncheck();
    await host.getByRole("button", { name: dashboard.retry, exact: true }).click();
    await expect(scenario).toHaveValue("ready");
    await expect(host.getByRole("alert")).toHaveCount(0);
    await expect(table).toContainText(dashboard.first);
    await expect(host.getByText(`${dashboard.size} ${dashboard.count} · 0 selected`, { exact: true })).toBeVisible();
  });

  test(`${dashboard.id} mounted disabled controls preserve edits and resume`, async ({ page }) => {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    const search = host.getByLabel(dashboard.search);
    const mountedInput = await search.elementHandle();
    await search.fill(dashboard.first);
    const request = await host.getByLabel(dashboard.request, { exact: true }).textContent();
    await host.getByRole("combobox", { name: dashboard.scenario, exact: true }).selectOption("disabled");
    await expect(search).toBeDisabled();
    expect(await search.evaluate((element, original) => element === original, mountedInput)).toBe(true);
    await expect(search).toHaveValue(dashboard.first);
    await expect(host.getByRole("button", { name: `Sort by ${dashboard.sort}`, exact: true })).toBeDisabled();
    await expect(host.getByLabel(`Select ${dashboard.first}`, { exact: true })).toBeDisabled();
    await expect(host.getByLabel(dashboard.request, { exact: true })).toHaveText(request!);
    await host.getByRole("combobox", { name: dashboard.scenario, exact: true }).selectOption("ready");
    await expect(search).toBeEnabled();
    await expect(search).toHaveValue(dashboard.first);
    await search.fill("");
    await expect(host.getByRole("table", { name: dashboard.table }).locator("tbody tr")).toHaveCount(3);
  });
}

for (const dashboard of dashboards.slice(2)) {
  test(`${dashboard.id} refuses table requests then accepts host-approved replacements`, async ({ page }) => {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    const table = host.getByRole("table", { name: dashboard.table, exact: true });
    const selection = host.getByLabel(`Select ${dashboard.first}`, { exact: true });
    const hold = host.getByLabel(dashboard.hold, { exact: true });
    await hold.check();
    await selection.click();
    await expect(selection).not.toBeChecked();
    await host.getByRole("button", { name: `Sort by ${dashboard.sort}`, exact: true }).click();
    await expect(table.locator("th[aria-sort]").first()).toHaveAttribute("aria-sort", "none");
    await host.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(table).toContainText(dashboard.first);
    await host.getByLabel(dashboard.search).fill("missing");
    await expect(host.getByLabel(dashboard.search)).toHaveValue("");
    await expect(host.getByLabel(dashboard.request, { exact: true })).toContainText("host retained state");
    await hold.uncheck();
    await selection.check();
    await expect(selection).toBeChecked();
    await host.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(table).not.toContainText(dashboard.first);
    await host.getByLabel(dashboard.search).fill("missing");
    await expect(host.getByText(`No matching ${dashboard.table.toLowerCase()}.`, { exact: true })).toBeVisible();
    await host.getByLabel(dashboard.search).fill("");
    await expect(table).toContainText(dashboard.first);
    await expect(selection).toBeChecked();
  });
}

test("HR and marketing tabs refuse changes and resume after mounted disable", async ({ page }) => {
  for (const dashboard of [
    { id: "hr-management", scenario: "HR data", hold: "Hold HR host state", original: "People", next: "Departments" },
    { id: "marketing-dashboard", scenario: "Marketing scenario", hold: "Host retains requests", original: "Sessions", next: "Channels" },
  ]) {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    await host.getByLabel(dashboard.hold, { exact: true }).check();
    await host.getByRole("tab", { name: dashboard.next, exact: true }).click();
    await expect(host.getByRole("tabpanel", { name: dashboard.original, exact: true })).toBeVisible();
    await host.getByLabel(dashboard.hold, { exact: true }).uncheck();
    await host.getByRole("tab", { name: dashboard.next, exact: true }).click();
    await host.getByRole("combobox", { name: dashboard.scenario, exact: true }).selectOption("disabled");
    await expect(host.getByRole("tab", { name: dashboard.original, exact: true })).toBeDisabled();
    await expect(host.getByRole("tabpanel", { name: dashboard.next, exact: true })).toBeVisible();
    await host.getByRole("combobox", { name: dashboard.scenario, exact: true }).selectOption("ready");
    await host.getByRole("tab", { name: dashboard.original, exact: true }).click();
    await expect(host.getByRole("tabpanel", { name: dashboard.original, exact: true })).toBeVisible();
  }
});

test("medical profile replacement refuses then refreshes associated activity without stale inspection", async ({ page }) => {
  await page.goto("/#boardui:medical-profile");
  const host = page.getByTestId("live-example");
  const profile = host.getByRole("combobox", { name: "Selected profile", exact: true });
  await host.getByLabel("Hold medical requests").check();
  await profile.selectOption("1");
  await expect(profile).toHaveValue("0");
  await expect(host.getByText("33,200 steps", { exact: true })).toBeVisible();
  await host.getByLabel("Hold medical requests").uncheck();
  await profile.selectOption("1");
  await expect(host.getByRole("heading", { name: "Mira Sample", exact: true })).toBeVisible();
  await expect(host.getByText("36,520 steps", { exact: true })).toBeVisible();
  await host.getByRole("combobox", { name: "Medical scenario", exact: true }).selectOption("empty");
  await expect(host.getByRole("region", { name: "Patient information", exact: true })).toHaveText("No profile selected.");
  await expect(host.locator("button[data-date]")).toHaveCount(0);
  await expect(host.getByText("36,520 steps", { exact: true })).toHaveCount(0);
  await host.getByRole("combobox", { name: "Medical scenario", exact: true }).selectOption("ready");
  await expect(profile).toHaveValue("1");
  await expect(host.getByText("36,520 steps", { exact: true })).toBeVisible();
});

test("dashboard navigation and marketing period requests stay host-controlled", async ({ page }) => {
  for (const dashboard of dashboards.slice(2)) {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    const hold = host.getByLabel(dashboard.hold, { exact: true });
    await hold.check();
    await host.getByRole("button", { name: "Navigate", exact: true }).click();
    await expect(host.getByRole("dialog")).toHaveCount(0);
    await expect(host.getByLabel(dashboard.request, { exact: true })).toContainText("host retained state");
    if (dashboard.id === "marketing-dashboard") {
      await host.getByRole("combobox", { name: "Analytics period" }).selectOption("Aug");
      await expect(host.getByRole("combobox", { name: "Analytics period" })).toHaveValue("All months");
    }
    await hold.uncheck();
    await host.getByRole("button", { name: "Navigate", exact: true }).click();
    await expect(host.getByRole("dialog")).toBeVisible();
    await host.getByRole("dialog").getByRole("button", { name: dashboard.table, exact: true }).click();
    await expect(host.getByRole("dialog")).toHaveCount(0);
    await expect(host.getByRole("table", { name: dashboard.table, exact: true })).toBeVisible();
    if (dashboard.id === "marketing-dashboard") {
      await host.getByRole("combobox", { name: "Analytics period" }).selectOption("Aug");
      await expect(host.getByRole("combobox", { name: "Analytics period" })).toHaveValue("Aug");
      await expect(host.getByRole("button", { name: "Aug: $0 · ROAS unavailable (zero spend)", exact: true })).toBeVisible();
    }
  }
});

test("wide medical calendar and alert acknowledgement refuse and recover", async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1040 });
  await page.goto("/#boardui:medical-profile");
  const host = page.getByTestId("live-example");
  await expect(host.locator(".hk-dashboard-workspace")).toHaveAttribute("data-compact", "false");
  await host.getByLabel("Hold medical requests").check();
  await host.locator('button[data-date="2026-09-03"]').click();
  await expect(host.locator('button[data-date="2026-09-07"]')).toHaveAttribute("aria-pressed", "true");
  await host.getByRole("button", { name: "Previous month", exact: true }).click();
  await expect(host.getByRole("heading", { name: "September 2026", exact: true })).toBeVisible();
  await host.getByRole("button", { name: "Inspect Profile record updated", exact: true }).click();
  await expect(host.getByRole("dialog")).toHaveCount(0);
  await host.getByLabel("Hold medical requests").uncheck();
  await host.locator('button[data-date="2026-09-03"]').click();
  await expect(host.locator('button[data-date="2026-09-03"]')).toHaveAttribute("aria-pressed", "true");
  await host.getByRole("button", { name: "Inspect Profile record updated", exact: true }).click();
  const panel = host.getByRole("dialog", { name: "Alert detail", exact: true });
  await host.getByLabel("Hold medical requests").check();
  await panel.getByRole("button", { name: "Mark alert read", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Mark alert read", exact: true })).toBeEnabled();
  await host.getByLabel("Hold medical requests").uncheck();
  await panel.getByRole("button", { name: "Mark alert read", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Read", exact: true })).toBeDisabled();
});

test("wide open home and HR editors receive disabled updates without remounting drafts", async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1040 });
  for (const editor of [
    { id: "home-dashboard", scenario: "Dashboard data", open: "Create ticket", field: "Ticket description", submit: "Create local ticket", cancel: "Cancel ticket" },
    { id: "hr-management", scenario: "HR data", open: "Add employee", field: "Employee name", submit: "Add local employee", cancel: "Cancel employee" },
  ]) {
    await page.goto(`/#boardui:${editor.id}`);
    const host = page.getByTestId("live-example");
    await expect(host.locator(".hk-dashboard-workspace")).toHaveAttribute("data-compact", "false");
    await host.getByRole("button", { name: editor.open, exact: true }).click();
    const panel = host.getByRole("dialog", { name: editor.open, exact: true });
    const field = panel.getByRole("textbox", { name: editor.field, exact: true });
    await field.fill("Local draft");
    const original = await field.elementHandle();
    await host.getByRole("combobox", { name: editor.scenario, exact: true }).selectOption("disabled");
    await expect(field).toBeDisabled();
    await expect(field).toHaveValue("Local draft");
    expect(await field.evaluate((element, mounted) => element === mounted, original)).toBe(true);
    await expect(panel.getByRole("button", { name: editor.submit, exact: true })).toBeDisabled();
    await host.getByRole("combobox", { name: editor.scenario, exact: true }).selectOption("ready");
    await expect(field).toBeEnabled();
    await expect(field).toHaveValue("Local draft");
    await panel.getByRole("button", { name: editor.cancel, exact: true }).click();
    await expect(panel).toHaveCount(0);
  }
});

test("HR marketing and medical unavailable samples replace charts and recover", async ({ page }) => {
  for (const dashboard of dashboards.slice(2)) {
    await page.goto(`/#boardui:${dashboard.id}`);
    const host = page.getByTestId("live-example");
    const scenario = host.getByRole("combobox", { name: dashboard.scenario, exact: true });
    const plots = host.locator("svg.hk-hr-chart, svg.hk-marketing-plot, svg.hk-medical-plot");
    expect(await plots.count()).toBeGreaterThan(0);
    for (const value of ["empty", "loading", "error"]) {
      await scenario.selectOption(value);
      if (dashboard.id === "hr-management") {
        await expect(host.locator("svg.hk-hr-chart")).toHaveCount(0);
        if (value === "empty") await expect(host.getByRole("tabpanel", { name: "People", exact: true })).toHaveText("No people to summarize");
        else await expect(host.locator(".hk-hr-charts")).toHaveCount(0);
      } else if (dashboard.id === "marketing-dashboard") {
        await expect(host.locator("svg.hk-marketing-plot")).toHaveCount(0);
        await expect(host.getByText(value === "loading" ? "Loading analytics…" : value === "error" ? "Analytics unavailable." : "No analytics for this period.").first()).toBeVisible();
      } else {
        await expect(host.locator("svg.hk-medical-plot")).toHaveCount(0);
        await expect(host.locator("button[data-date]")).toHaveCount(0);
        await expect(host.getByRole("button", { name: "Inspect Profile record updated", exact: true })).toHaveCount(0);
      }
    }
    await host.getByRole("button", { name: dashboard.retry, exact: true }).click();
    await expect(scenario).toHaveValue("ready");
    await expect(host.getByRole("table", { name: dashboard.table, exact: true })).toContainText(dashboard.first);
    expect(await plots.count()).toBeGreaterThan(0);
  }
});

test("finance unavailable overview withdraws stale chart samples and exposes local retry", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  const host = page.getByTestId("live-example");
  for (const scenario of ["empty", "loading", "error"]) {
    await host.getByRole("combobox", { name: "Transaction data", exact: true }).selectOption(scenario);
    await expect(host.locator(".hk-finance-grid")).toHaveCount(0);
    await expect(host.locator(".hk-stat-cards")).toHaveCount(0);
  }
  await expect(host.getByRole("button", { name: "Retry transactions", exact: true })).toBeEnabled();
  await host.getByRole("button", { name: "Retry transactions", exact: true }).click();
  await expect(host.locator(".hk-finance-grid > section")).toHaveCount(4);
});

test("settings mounted host lifecycle preserves preferences and replaces unavailable content", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.getByRole("button", { name: "Profile", exact: true }).click();
  const name = dialog.getByLabel("Workspace name");
  await name.fill("Local research workspace");
  const mountedDialog = await dialog.elementHandle();
  const mountedName = await name.elementHandle();
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("disabled");
  await expect(name).toBeDisabled();
  await expect(name).toHaveValue("Local research workspace");
  expect(await dialog.evaluate((element, original) => element === original, mountedDialog)).toBe(true);
  expect(await name.evaluate((element, original) => element === original, mountedName)).toBe(true);
  await dialog.getByRole("button", { name: "General", exact: true }).click();
  await expect(dialog.getByLabel("Notify me when work is ready")).toBeDisabled();
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("loading");
  await expect(dialog.getByRole("status")).toHaveText("Loading local preferences…");
  await expect(dialog.getByLabel("Notify me when work is ready")).toHaveCount(0);
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("empty");
  for (const section of ["General", "Profile", "Tools", "Storage"]) {
    await dialog.getByRole("button", { name: section, exact: true }).click();
    await expect(dialog.getByText(`No ${section.toLowerCase()} data supplied.`, { exact: true })).toBeVisible();
  }
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("error");
  await expect(dialog.getByRole("alert")).toHaveText("Local preferences unavailable. No account request was sent.");
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("disabled-error");
  await expect(dialog.getByRole("button", { name: "Retry preferences" })).toBeDisabled();
  await dialog.getByLabel("Settings data", { exact: true }).selectOption("error");
  await dialog.getByRole("button", { name: "Retry preferences" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(name).toHaveValue("Local research workspace");
  await expect(name).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "General", exact: true })).toBeVisible();
});
