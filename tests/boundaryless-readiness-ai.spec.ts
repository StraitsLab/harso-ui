import { expect, test } from "@playwright/test";

test("runtime composer preserves mounted drafts, attachments and host refusal", async ({ page }) => {
  await page.goto("/#harso:chat-composer");
  await page.getByLabel("Composer state", { exact: true }).selectOption("with attachment");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Keep this draft");
  const mounted = await input.elementHandle();
  await expect(page.getByText("requirements.md", { exact: true })).toBeVisible();
  await page.getByLabel("Disable composer input", { exact: true }).check();
  await expect(input).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add attachment", exact: true })).toBeDisabled();
  await page.getByLabel("Disable composer input", { exact: true }).uncheck();
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
  await expect(input).toHaveValue("Keep this draft");
  await page.getByLabel("Refuse submission", { exact: true }).check();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByTestId("composer-host-result")).toContainText("Submission refused");
  await expect(input).toHaveValue("Keep this draft");
  await expect(page.getByText("requirements.md", { exact: true })).toBeVisible();
  await page.getByLabel("Refuse submission", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Remove requirements.md", exact: true }).click();
  await expect(page.getByText("requirements.md", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(input).toHaveValue("");
});

// Phase D removes image-template estimates/reveal/download; AgentThinking remains.
test("thinking host tone and shimmer controls change computed presentation without restarting elapsed time", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:agent-thinking");
  const thinking = page.locator(".hk-thinking");
  const indicator = thinking.locator(".hk-thinking-indicator");
  const label = thinking.locator(".hk-thinking-label");
  await expect(label).toHaveText("Considering the next step");
  const accent = await indicator.evaluate(element => getComputedStyle(element).color);
  await page.getByLabel("Thinking tone").selectOption("subtle");
  await expect(indicator).not.toHaveCSS("color", accent);
  await page.getByLabel("Thinking tone").selectOption("accent");
  await expect(indicator).toHaveCSS("color", accent);
  await expect(label).toHaveCSS("animation-name", "hk-thinking-shimmer");
  await page.getByLabel("Shimmer label", { exact: true }).uncheck();
  await expect(label).toHaveCSS("animation-name", "none");
  await expect(label).toHaveCSS("background-image", "none");
  const timer = thinking.getByRole("timer");
  await expect(timer).not.toHaveText("0.0 s");
  await page.getByLabel("Show elapsed time", { exact: true }).uncheck();
  await expect(timer).toHaveCount(0);
  await page.getByLabel("Show elapsed time", { exact: true }).check();
  await expect(timer).not.toHaveText("0.0 s");
  await page.getByLabel("Shimmer label", { exact: true }).check();
  await expect(label).toHaveCSS("animation-name", "hk-thinking-shimmer");
});
