import { test, expect } from "@playwright/test";

test("panel context and voice stay host-owned while working locks input", async ({ page }) => {
  await page.goto("/#boardui:composer-panel");
  const example = page.getByTestId("live-example");
  await expect(example.locator(".hk-composer-context")).toHaveText("Project Atlas · main");
  await expect(example.locator(".hk-status-bar")).toHaveCount(0);
  const voice = example.getByRole("button", { name: "Request voice input" });
  await example.getByLabel("Hold host state").check();
  await voice.click();
  await expect(example.getByText(/Local voice request:/)).toHaveCount(0);
  await example.getByLabel("Hold host state").uncheck();
  await voice.focus();
  await page.keyboard.press("Enter");
  await expect(example.getByRole("status")).toHaveText("Local voice request: 1. Microphone not started.");
  await expect(voice).not.toHaveAttribute("aria-pressed");
  await example.getByLabel("Host reports working").check();
  await expect(example.locator(".hk-composer-panel")).toHaveAttribute("aria-busy", "true");
  await expect(voice).toBeDisabled();
  await expect(example.getByRole("textbox")).toBeDisabled();
  await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await example.getByLabel("Host reports working").uncheck();
  await expect(voice).toBeEnabled();
  await expect(example.locator(".hk-status-bar")).toHaveCount(0);
});

test("composer previews submit and remove attachments only when the host accepts", async ({ page }) => {
  await page.goto("/#boardui:composer");
  const example = page.getByTestId("live-example");
  await example.getByRole("textbox", { name: "Message" }).fill("A calm workspace");
  await example.getByLabel("Hold host state").check();
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(example.getByRole("textbox", { name: "Message" })).toHaveValue("A calm workspace");
  await example.getByRole("button", { name: "Remove brief.md" }).click();
  await expect(example.getByRole("button", { name: "Remove brief.md" })).toBeVisible();
  await example.getByLabel("Hold host state").uncheck();
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(example.getByRole("status")).toHaveText("Local submission: A calm workspace");
  await expect(example.getByRole("textbox", { name: "Message" })).toHaveValue("");
  await example.getByRole("button", { name: "Remove brief.md" }).click();
  await expect(example.getByRole("button", { name: "Remove brief.md" })).toHaveCount(0);
  await example.getByRole("button", { name: "Add sample attachment" }).click();
  await example.getByLabel("Attachment preview state").selectOption("uploading");
  await expect(example.getByRole("progressbar")).toHaveAttribute("value", "0.35");
  await expect(example.getByRole("progressbar")).toHaveAttribute("max", "1");
});
