import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("AI Chat host flow preserves drafts, scoped panels and synthetic streaming", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1040 });
  await page.goto("/#boardui:ai-chat");
  const workspace = page.locator(".hk-ai-workspace");
  await workspace.getByRole("textbox", { name: "Message", exact: true }).fill("Make the title clearer");
  await workspace.getByRole("navigation").getByRole("button", { name: "Test planning", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
  await workspace.getByRole("navigation").getByRole("button", { name: "Studio landing page", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("Make the title clearer");
  await page.getByLabel("Hold host state").check();
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("Make the title clearer");
  await page.getByLabel("Hold host state").uncheck();
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Advance synthetic update" }).click();
  await expect(workspace.getByText(/Synthetic host result/)).toBeVisible();
  await workspace.getByRole("button", { name: "Helpful", exact: true }).last().click();
  await expect(workspace.getByRole("button", { name: "Helpful", exact: true }).last()).toHaveAttribute("aria-pressed", "true");
  await workspace.getByRole("button", { name: "Changes", exact: true }).click();
  await expect(workspace.getByRole("dialog", { name: "Proposed changes" })).toBeVisible();
  await workspace.getByRole("dialog").getByRole("button", { name: "Browser", exact: true }).click();
  await expect(workspace.getByRole("dialog", { name: "Browser preview" })).toBeVisible();
  await expect(workspace.locator("iframe")).toHaveAttribute("sandbox", "");
  await expect(workspace.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Changes", exact: true }).click();
  await workspace.getByRole("navigation").getByRole("button", { name: "Test planning", exact: true }).click();
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
});

test("AI Chat demonstrates empty, loading, error, attachments and stop without live operations", async ({ page }) => {
  await page.goto("/#boardui:ai-chat");
  const workspace = page.locator(".hk-ai-workspace");
  await page.getByLabel("Chat state", { exact: true }).selectOption("empty");
  await expect(workspace.getByText("A little space to create.")).toBeVisible();
  await page.getByLabel("Chat state", { exact: true }).selectOption("loading");
  await expect(workspace.getByText("Loading conversation…")).toBeVisible();
  await expect(workspace.getByRole("textbox", { name: "Message", exact: true })).toBeDisabled();
  await page.getByLabel("Chat state", { exact: true }).selectOption("error");
  await expect(workspace.getByRole("alert")).toContainText("could not load");
  await workspace.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(workspace.getByRole("alert")).toHaveCount(0);
  const composer = workspace.getByRole("group", { name: "Message composer" });
  const fileChooser = page.waitForEvent("filechooser");
  await composer.getByRole("button", { name: "Attach", exact: true }).click();
  await (await fileChooser).setFiles({ name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("Local synthetic attachment") });
  await expect(workspace.getByRole("button", { name: "Remove attachment brief.txt" })).toBeVisible();
  await workspace.getByRole("button", { name: "Remove attachment brief.txt" }).click();
  await expect(workspace.getByRole("button", { name: "Remove attachment brief.txt" })).toHaveCount(0);
  await workspace.getByRole("textbox", { name: "Message", exact: true }).fill("Another request");
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  await workspace.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Stop", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Workspace request")).toContainText("Stop requested");
});

test("AI Chat retains its opener when an open panel changes responsive mode", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1040 });
  await page.goto("/#boardui:ai-chat");
  const workspace = page.locator(".hk-ai-workspace");
  const trigger = workspace.getByRole("button", { name: "Changes", exact: true });
  await trigger.click();
  await page.setViewportSize({ width: 390, height: 1040 });
  await expect(workspace).toHaveAttribute("data-compact", "true");
  await workspace.getByRole("button", { name: "Close context panel" }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.setViewportSize({ width: 1512, height: 1040 });
  await expect(workspace).toHaveAttribute("data-compact", "false");
  await workspace.getByRole("button", { name: "Close context panel" }).click();
  await expect(trigger).toBeFocused();
});

test("AI Chat container boundaries choose drawer, rail and non-modal desktop panel", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1040 });
  await page.goto("/#boardui:ai-chat");
  const workspace = page.locator(".hk-ai-workspace");
  const trigger = workspace.getByRole("button", { name: "Changes", exact: true });
  for (const width of [640, 641, 899, 900, 1024]) {
    await workspace.evaluate((element, width) => { element.style.width = `${width}px`; }, width);
    await expect(workspace).toHaveAttribute("data-compact", String(width < 900));
    await expect(workspace).toHaveAttribute("data-navigation", String(width > 640));
    await trigger.click();
    const panel = workspace.getByRole("dialog");
    await expect(panel).toBeVisible();
    expect(await panel.evaluate(element => element.matches(":modal"))).toBe(width < 900);
    if (width >= 900) {
      await expect(workspace.locator(".hk-ai-workspace-body")).toHaveCSS("grid-template-columns", `240px ${width - 560}px 320px`);
    } else if (width > 640) {
      await expect(workspace.getByRole("navigation")).toHaveCSS("width", "56px");
    }
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`AI Chat ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:ai-chat");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-ai-workspace");
    await expect(workspace).toHaveAttribute("data-compact", width === 390 ? "true" : "false");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const trigger = workspace.locator(".hk-ai-workspace-header").getByRole("button", { name: "Changes", exact: true });
    await trigger.click();
    await expect(workspace.getByRole("dialog")).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    const nativePanel = workspace.getByRole("dialog");
    expect(await nativePanel.evaluate(element => getComputedStyle(element).color)).toBe(await workspace.evaluate(element => getComputedStyle(element).color));
    await nativePanel.screenshot({ path: test.info().outputPath("native-panel.png") });
    if (width === 390) {
      await page.keyboard.press("Shift+Tab");
      expect(await workspace.getByRole("dialog").evaluate(element => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true);
      await trigger.evaluate(element => element.focus());
      await expect(trigger).not.toBeFocused();
    }
    await workspace.screenshot({ path: test.info().outputPath("ai-chat.png") });
    await workspace.getByRole("button", { name: "Close context panel" }).click();
    await expect(trigger).toBeFocused();
    await page.getByLabel("Chat state", { exact: true }).selectOption("disabled");
    await expect(workspace.getByRole("textbox", { name: "Message", exact: true })).toBeDisabled();
  });
}
