import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
function sourceBinding() {
  const files = ["src", "preview"].flatMap(directory =>
    readdirSync(resolve(root, directory), { recursive: true, withFileTypes: true }).filter(entry => entry.isFile()).map(entry => resolve(entry.parentPath, entry.name))
  ).concat([resolve(root, "vite.config.ts"), resolve(root, "package-lock.json"), import.meta.filename]).sort();
  const hashes = Object.fromEntries(files.map(path => [path.slice(root.length + 1), createHash("sha256").update(readFileSync(path)).digest("hex")]));
  return { sha256: createHash("sha256").update(JSON.stringify(hashes)).digest("hex"), hashes };
}
let before: ReturnType<typeof sourceBinding>;
test.beforeAll(async ({ browser }) => {
  before = sourceBinding();
  await test.info().attach("workflow-source-before", { body: JSON.stringify(before), contentType: "application/json" });
  await test.info().attach("workflow-browser", { body: JSON.stringify({ version: browser.version(), baseURL: test.info().project.use.baseURL }), contentType: "application/json" });
});
test.afterAll(async () => {
  const after = sourceBinding();
  await test.info().attach("workflow-source-after", { body: JSON.stringify(after), contentType: "application/json" });
  expect(after).toEqual(before);
});

test("readiness calendar navigates month and year boundaries without inventing events", async ({ page }) => {
  await page.goto("/#boardui:calendar");
  const calendar = page.getByRole("region", { name: "Space to focus", exact: true });
  await expect(calendar.getByRole("heading", { name: "September 2026" })).toBeVisible();
  await expect(calendar.locator("time[datetime]")).toHaveCount(30);
  await expect(calendar.locator("time[aria-current='date']")).toHaveAttribute("datetime", "2026-09-06");
  await expect(calendar.getByRole("region", { name: "Monday, September 7, 2026", exact: true }).getByRole("button")).toHaveCount(2);
  await calendar.getByRole("button", { name: "Previous month" }).click();
  await expect(calendar.getByRole("heading", { name: "August 2026" })).toBeVisible();
  await expect(calendar.locator("time[datetime]")).toHaveCount(31);
  await expect(calendar.getByRole("status")).toHaveText("No events supplied for this month.");
  for (let month = 0; month < 5; month++) await calendar.getByRole("button", { name: "Next month" }).click();
  await expect(calendar.getByRole("heading", { name: "January 2027" })).toBeVisible();
  await expect(calendar.locator("time").first()).toHaveAttribute("datetime", "2027-01-01");
  for (let month = 0; month < 4; month++) await calendar.getByRole("button", { name: "Previous month" }).click();
  await expect(calendar.getByRole("heading", { name: "September 2026" })).toBeVisible();
  await expect(calendar.getByRole("button", { name: /^A clearer direction/ })).toBeVisible();
  await expect(calendar.getByRole("status")).toHaveCount(0);
});

test("readiness calendar popover attendees overflow and inbox perform distinct host actions", async ({ page }) => {
  await page.goto("/#boardui:calendar");
  const event = page.getByRole("button", { name: /^A clearer direction/ });
  await event.click();
  const details = page.getByRole("dialog", { name: "A clearer direction", exact: true });
  await expect(details).toBeVisible();
  expect(await details.evaluate(element => element.matches(":popover-open"))).toBe(true);
  await expect(details).toContainText("Monday, September 7, 2026 · 09:00 · 30 min");
  await expect(details).toContainText("A sample review of the direction and the decisions that matter.");
  await expect(details.getByRole("listitem")).toHaveText(["You", "Design team"]);
  await details.getByRole("button", { name: "Join review" }).click();
  await expect(details).toBeHidden();
  await expect(event).toBeFocused();
  await expect(page.getByLabel("Calendar action")).toHaveText("Requested: brief");
  const day = page.getByRole("region", { name: "Monday, September 7, 2026", exact: true });
  await expect(day.getByRole("button", { name: "A little room to think 14:00", exact: true })).toBeHidden();
  await day.getByText("+2 more", { exact: true }).click();
  await expect(day.getByRole("button")).toHaveCount(4);
  await day.getByRole("button", { name: /^A little room to think/ }).click();
  await expect(page.getByRole("dialog", { name: "A little room to think", exact: true })).toContainText("An intentionally quiet afternoon.");
  await page.keyboard.press("Escape");
  const share = day.getByRole("button", { name: /^Share a first look/ });
  await share.click();
  const shareDetails = page.getByRole("dialog", { name: "Share a first look", exact: true });
  await expect(shareDetails.getByRole("listitem")).toHaveText(["Research team"]);
  await expect(shareDetails.getByRole("button", { name: "Open review", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(share).toBeFocused();
  await day.getByText("+2 more", { exact: true }).click();
  await expect(share).toBeHidden();
  const inbox = page.getByRole("button", { name: "Inbox · 2", exact: true });
  await inbox.click();
  const feed = page.getByRole("menu", { name: "Calendar inbox", exact: true });
  expect(await feed.evaluate(element => element.matches(":popover-open"))).toBe(true);
  await expect(feed.getByRole("menuitem")).toHaveCount(2);
  await feed.getByRole("menuitem", { name: /Review time updated/ }).click();
  await expect(page.getByLabel("Calendar action")).toHaveText("Inbox: time-change");
  await expect(inbox).toBeFocused();
  await inbox.click();
  await feed.getByRole("menuitem", { name: /Notes ready/ }).click();
  await expect(page.getByLabel("Calendar action")).toHaveText("Inbox: notes");
});

test("readiness Table gallery composes keyboard selection actual sorting search and pagination", async ({ page }) => {
  await page.goto("/#boardui:table");
  await expect(page.getByRole("table", { name: "A small evidence set" })).toBeVisible();
  const table = page.getByRole("table", { name: "Work records", exact: true });
  const rows = table.locator("tbody tr");
  const audience = table.getByRole("checkbox", { name: "Select Audience interviews", exact: true });
  await audience.focus();
  await page.keyboard.press("Space");
  await expect(audience).toBeChecked();
  await expect(table.getByRole("checkbox", { name: "Select Support themes", exact: true })).toBeDisabled();
  const sort = table.getByRole("button", { name: "Sort by Sources" });
  await sort.focus();
  await page.keyboard.press("Enter");
  await expect(table.getByRole("columnheader", { name: /Sources/ })).toHaveAttribute("aria-sort", "ascending");
  await expect(rows.locator("td:nth-child(3)")).toHaveText(["0", "1", "3", "4", "5"]);
  await expect(audience).toBeChecked();
  await sort.press("Enter");
  await expect(rows.locator("td:nth-child(3)")).toHaveText(["15", "14", "12", "11", "10"]);
  const search = page.getByLabel("Search records", { exact: true });
  await search.fill("AUDIENCE");
  await expect(rows).toHaveCount(1);
  await expect(audience).toBeChecked();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await search.fill("");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Page 2", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(rows.locator("td:nth-child(3)")).toHaveText(["8", "7", "5", "4", "3"]);
  await expect(audience).toBeChecked();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(rows.locator("td:nth-child(3)")).toHaveText(["1", "0"]);
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await expect(audience).toBeChecked();
  await search.fill("No matching evidence");
  await expect(table.getByRole("status")).toContainText("No rows");
  await search.fill("Audience");
  await expect(audience).toBeChecked();
  await search.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("region", { name: "Work records table", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(table.getByRole("checkbox", { name: "Select visible rows", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(table.getByRole("button", { name: "Sort by Work", exact: true })).toBeFocused();
});

test("readiness sidebar composes team user search badges and independent AI navigation", async ({ page }) => {
  await page.goto("/#boardui:sidebar");
  const example = page.getByTestId("live-example");
  await example.getByRole("button", { name: "Research studio", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Personal space", exact: true }).click();
  await expect(example.getByRole("button", { name: "Personal space", exact: true })).toBeVisible();
  await example.getByRole("button", { name: /Sample member/ }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(example.locator("output")).toHaveText("Settings requested");
  await example.getByLabel("Search navigation", { exact: true }).fill("inb");
  await expect(example.getByRole("link", { name: /Inbox/ })).toContainText("3");
  await expect(example.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
  await example.getByRole("link", { name: /Inbox/ }).click();
  await expect(example.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();
  await example.getByLabel("Search navigation", { exact: true }).fill("");
  await example.getByRole("button", { name: "Dismiss A little more room", exact: true }).click();
  await expect(example.getByText("A little more room", { exact: true })).toHaveCount(0);
  await example.getByLabel("Working note").fill("Keep this local draft");
  await example.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(example.getByRole("button", { name: "Expand navigation" })).toBeVisible();
  await expect(example.getByLabel("Working note")).toHaveValue("Keep this local draft");
  await example.getByRole("button", { name: "Expand navigation" }).click();
  await example.getByLabel("Sidebar composition").selectOption("ai");
  await example.getByRole("link", { name: /Recent conversations/ }).click();
  await expect(example.getByRole("heading", { name: "Recent conversations", exact: true })).toBeVisible();
  await expect(example.getByRole("link", { name: /Recent conversations/ })).toContainText("8");
  await expect(example.getByText("Repositories", { exact: true })).toBeVisible();
  await example.getByText("Launch planning", { exact: true }).click();
  await example.getByRole("button", { name: "Compare the alternatives", exact: true }).click();
  await expect(example.getByRole("heading", { name: "Compare the alternatives", exact: true })).toBeVisible();
  await expect(example.getByLabel("Working note")).toHaveValue("Keep this local draft");
});

test("readiness dropdown model team and account menus apply scoped requests", async ({ page }) => {
  await page.goto("/#boardui:dropdown");
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Fast draft/ }).click();
  await expect(page.getByLabel("Menu selection")).toHaveText("Selected: Fast draft");
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await expect(page.getByRole("menuitemradio", { name: /^Fast draft/ })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await page.getByLabel("Menu composition").selectOption("team");
  await page.getByRole("button", { name: "Research studio", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Personal space", exact: true }).click();
  await expect(page.getByRole("button", { name: "Personal space", exact: true })).toBeVisible();
  await page.getByLabel("Menu composition").selectOption("account");
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Menu action")).toHaveText("Settings requested");
  await expect(page.getByLabel("Menu selection")).toHaveText("Selected: Fast draft");
});

for (const family of ["home-dashboard", "hr-management", "marketing-dashboard", "medical-profile"]) {
  test(`readiness ${family} shell resizes toggles navigation and completes its native panel action`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1512, height: 1040 });
    await page.goto(`/#boardui:${family}`);
    const workspace = page.getByTestId("live-example").locator(".hk-dashboard-workspace");
    const navigation = workspace.getByRole("navigation", { name: "Dashboard workspace", exact: true });
    const toggle = workspace.getByRole("button", { name: "Toggle workspace navigation", exact: true });
    const target = { "home-dashboard": "Customers", "hr-management": "Employees", "marketing-dashboard": "Campaigns", "medical-profile": "Patients" }[family]!;
    for (const width of [1512, 390]) {
      await page.setViewportSize({ width, height: 1040 });
      await expect(workspace).toHaveAttribute("data-compact", String(width === 390));
      if (width === 390) {
        await expect(navigation).toBeHidden();
        await toggle.click();
        await expect(navigation).toBeVisible();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        const backdrop = workspace.getByRole("button", { name: "Close workspace navigation", exact: true });
        const backdropBounds = (await backdrop.boundingBox())!;
        // The drawer covers the backdrop's centre; click its exposed right edge.
        await backdrop.click({ position: { x: backdropBounds.width - 8, y: 8 } });
        await expect(navigation).toBeHidden();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
      } else {
        await expect(navigation).toBeVisible();
        await expect(toggle).toBeHidden();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await workspace.getByRole("button", { name: "Navigate", exact: true }).click();
      const panel = workspace.getByRole("dialog");
      await expect(panel).toBeVisible();
      const bounds = await panel.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      await panel.getByRole("button", { name: target, exact: true }).click();
      await expect(panel).toHaveCount(0);
      await expect(workspace.getByRole("table", { name: target, exact: true })).toBeVisible();
    }
  });
}

test("readiness carousel measures full peek mixed widths and start center alignment with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1040 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:carousel");
  const track = page.getByLabel("Research results slides", { exact: true });
  await track.evaluate(element => {
    const native = element.scrollBy.bind(element);
    element.scrollBy = ((options: ScrollToOptions) => {
      element.setAttribute("data-observed-scroll-behavior", options.behavior ?? "auto");
      native(options);
    }) as typeof element.scrollBy;
  });
  for (const composition of ["full", "peek", "mixed"]) {
    await page.getByLabel("Slide width").selectOption(composition);
    const widths = await track.evaluate(element => ({ track: element.clientWidth, slides: Array.from(element.children).map(child => child.getBoundingClientRect().width) }));
    expect(Math.abs(widths.slides[0] / widths.track - (composition === "full" ? 1 : composition === "peek" ? 0.82 : 0.44))).toBeLessThan(0.01);
    if (composition === "mixed") expect(Math.abs(widths.slides[1] / widths.track - 0.66)).toBeLessThan(0.01);
    for (const alignment of ["start", "center"]) {
      await page.getByLabel("Alignment").selectOption(alignment);
      await page.getByRole("button", { name: "Go to slide 1", exact: true }).click();
      await page.getByRole("button", { name: "Go to slide 2", exact: true }).click();
      await expect(track).toHaveAttribute("data-observed-scroll-behavior", "instant");
      await expect.poll(() => track.evaluate((element, align) => {
        const viewport = element.getBoundingClientRect();
        const slide = element.children[1].getBoundingClientRect();
        return Math.abs(align === "start" ? slide.left - viewport.left : slide.left + slide.width / 2 - viewport.left - viewport.width / 2);
      }, alignment)).toBeLessThan(2);
      await expect(page.getByRole("button", { name: "Go to slide 2", exact: true })).toHaveAttribute("aria-current", "true");
    }
  }
});

test("readiness finance shell navigation changes actual content at narrow and wide widths", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  const navigation = page.getByRole("navigation", { name: "Finance navigation" });
  for (const width of [1512, 390]) {
    await page.setViewportSize({ width, height: 1040 });
    await navigation.getByRole("button", { name: "Overview", exact: true }).click();
    await expect(page.getByText("Available balance", { exact: true })).toBeVisible();
    await navigation.getByRole("button", { name: "Transactions", exact: true }).click();
    await expect(navigation.getByRole("button", { name: "Transactions", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Available balance", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("table", { name: "Transactions", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("runtime branches and feedback preserve draft ownership", async ({ page }) => {
  await page.goto("/#harso:chat-thread");
  await page.getByLabel("Thread state", { exact: true }).selectOption("branching");
  const draft = page.getByRole("textbox", { name: "Message", exact: true });
  await draft.fill("Keep these local notes");
  await expect(page.getByText("2 of 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Previous branch", exact: true }).click();
  await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("log")).toContainText("First branch: start with a focused launch.");
  await page.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect(page.getByRole("button", { name: "Helpful", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next branch", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Second branch: begin with an invitation.");
  await expect(draft).toHaveValue("Keep these local notes");
  await page.getByRole("button", { name: "Previous branch", exact: true }).click();
  await expect(page.getByRole("button", { name: "Helpful", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("Harso shell retains runtime draft across responsive navigation", async ({ page }) => {
  await page.goto("/#harso:chat-shell");
  const draft = page.getByRole("textbox", { name: "Message", exact: true });
  await draft.fill("A draft retained across layouts");
  const original = await draft.elementHandle();
  for (const width of [1512, 390, 1024]) {
    await page.setViewportSize({ width, height: 1040 });
    await expect(draft).toHaveValue("A draft retained across layouts");
    expect(await original!.evaluate(element => element.isConnected)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      await page.getByRole("button", { name: "Open conversations", exact: true }).click();
      await expect(page.getByRole("button", { name: "New conversation", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  }
});
