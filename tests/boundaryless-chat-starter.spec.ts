import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("starter history supports rename, unread, export, scoped drafts and deletion", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  const workspace = page.locator(".hk-starter-workspace");
  await workspace.getByRole("textbox", { name: "Starter message", exact: true }).fill("A private draft");
  await workspace.getByRole("button", { name: "Personal ideas Unread", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Starter message", exact: true })).toHaveValue("");
  await expect(workspace.getByRole("button", { name: "Personal ideas", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Personal welcome", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Starter message", exact: true })).toHaveValue("A private draft");
  await workspace.getByRole("button", { name: "Actions for Personal welcome", exact: true }).click();
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await workspace.getByRole("textbox", { name: "Conversation name" }).fill("Renamed chat");
  await page.getByLabel("Hold host state").check();
  await workspace.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Personal welcome", exact: true })).toBeVisible();
  await page.getByLabel("Hold host state").uncheck();
  await workspace.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Renamed chat", exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Export preview", exact: true }).click();
  await expect(workspace.getByRole("region", { name: "Export preview" })).toContainText("## assistant");
  await workspace.getByRole("button", { name: "Actions for Renamed chat", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await workspace.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Renamed chat", exact: true })).toHaveCount(0);
  await expect(workspace.getByRole("region", { name: "Export preview" })).toHaveCount(0);
});

test("starter route, team isolation, synthetic response and authentication requests", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  const workspace = page.locator(".hk-starter-workspace");
  await workspace.getByRole("textbox", { name: "Starter message", exact: true }).fill("Explore a plan");
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await expect(workspace.getByText("Working · synthetic")).toBeVisible();
  await page.getByRole("button", { name: "Advance synthetic update" }).click();
  await expect(workspace.getByText(/Synthetic result/)).toBeVisible();
  await workspace.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(workspace.getByRole("region", { name: "Starter dashboard" })).toBeVisible();
  await expect(workspace.getByRole("textbox", { name: "Starter message" })).toHaveCount(0);
  await workspace.getByRole("button", { name: "Personal team", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Studio", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Studio welcome", exact: true })).toBeVisible();
  await expect(workspace.getByText("Explore a plan", { exact: true })).toHaveCount(0);
  await workspace.getByRole("button", { name: "Example account", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign in", exact: true }).click();
  await workspace.getByRole("button", { name: "Request sign-in" }).click();
  await expect(page.getByLabel("Starter request")).not.toContainText("no authentication performed");
  await workspace.getByRole("textbox", { name: "Email", exact: true }).fill("demo@example.test");
  await workspace.getByLabel(/^Password/).fill("synthetic-only");
  await workspace.getByRole("button", { name: "Request sign-in" }).click();
  await expect(page.getByLabel("Starter request")).toContainText("no authentication performed");
  await expect(workspace.getByLabel(/^Password/)).toHaveValue("");
  await workspace.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Name", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("deleting the active conversation marks its displayed replacement read", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  const workspace = page.locator(".hk-starter-workspace");
  await workspace.getByRole("button", { name: "Actions for Personal welcome", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await workspace.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Personal ideas", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(workspace.getByRole("button", { name: "Personal ideas Unread", exact: true })).toHaveCount(0);
});

test("starter pending replies remain conversation-scoped and stop respects host refusal", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  const workspace = page.locator(".hk-starter-workspace");
  await workspace.getByRole("textbox", { name: "Starter message", exact: true }).fill("Keep this work scoped");
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await workspace.getByRole("button", { name: "Personal ideas Unread", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Stop", exact: true })).toHaveCount(0);
  await workspace.getByRole("button", { name: "Personal welcome", exact: true }).click();
  await expect(workspace.getByText("Working · synthetic")).toBeVisible();
  await page.getByLabel("Hold host state").check();
  await workspace.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(workspace.getByText("Working · synthetic")).toBeVisible();
  await page.getByLabel("Hold host state").uncheck();
  await workspace.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(workspace.getByText("Stopped in this synthetic example.")).toBeVisible();
  await expect(workspace.getByText("Working · synthetic")).toHaveCount(0);
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`starter ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:chat-starter");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-starter-workspace");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await workspace.locator(".hk-starter-history-row > button:first-child").evaluateAll(buttons => buttons.every(button => {
      const content = document.createRange();
      content.selectNodeContents(button);
      const bounds = button.getBoundingClientRect();
      return [...content.getClientRects()].every(rect => rect.left >= bounds.left && rect.right <= bounds.right);
    }))).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("chat-starter.png") });
    await page.getByLabel("Starter state", { exact: true }).selectOption("loading");
    await expect(workspace.getByText("Loading history…")).toBeVisible();
    await page.getByLabel("Starter state", { exact: true }).selectOption("error");
    await expect(workspace.getByRole("alert")).toContainText("Conversation unavailable");
    await workspace.getByRole("button", { name: "Retry", exact: true }).click();
    await page.getByLabel("Starter state", { exact: true }).selectOption("disabled");
    await expect(workspace.getByRole("textbox", { name: "Starter message" })).toBeDisabled();
    await page.getByLabel("Starter state", { exact: true }).selectOption("ready");
    await workspace.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(workspace.getByRole("region", { name: "Starter dashboard" })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await workspace.screenshot({ path: test.info().outputPath("starter-dashboard.png") });
    await workspace.getByRole("button", { name: "Example account", exact: true }).click();
    await page.getByRole("menuitem", { name: "Sign up", exact: true }).click();
    await expect(workspace.getByRole("textbox", { name: "Name", exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await workspace.screenshot({ path: test.info().outputPath("starter-signup.png") });
  });
}
