import { expect, test } from "@playwright/test";
import { attachFile, openChat, sendMessage } from "./helpers/harso-chat";

test("streaming grows, announces status, and Stop cancels", async ({ page }) => {
  const example = await openChat(page, "chat-thread");
  await sendMessage(example, "Inspect the responsive conversation layouts.");
  const response = example.getByRole("article", { name: "Harso", exact: true }).last();
  const text = response.locator(".hkc-message-text");
  await expect(response.getByRole("status", { name: "Streaming" })).toBeVisible();
  const initialLength = (await text.innerText()).length;
  await expect.poll(async () => (await text.innerText()).length).toBeGreaterThan(initialLength);
  await example.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(response.getByRole("status")).toHaveText("Stopped by you.");
  await expect(response.getByRole("status", { name: "Streaming" })).toHaveCount(0);
  const stoppedText = await text.innerText();
  await page.waitForTimeout(350);
  await expect(text).toHaveText(stoppedText);
});

test("editing preserves the original and navigates both user branches", async ({ page }) => {
  const example = await openChat(page, "chat-thread");
  const user = example.getByRole("article", { name: "You", exact: true }).last();
  const original = await user.locator(".hkc-message-text").innerText();
  await user.hover();
  await user.getByRole("button", { name: "Edit message", exact: true }).click();
  await example.getByRole("textbox", { name: "Edit your message" }).fill("Edited responsive review");
  await example.getByRole("button", { name: "Save & send", exact: true }).click();
  await expect(user.locator(".hkc-message-branches")).toHaveText("2 of 2");
  await expect(example.getByRole("status", { name: "Streaming" })).toBeVisible();
  await expect(example.getByRole("status", { name: "Streaming" })).toHaveCount(0);
  await user.hover();
  await user.getByRole("button", { name: "Previous branch" }).click();
  await expect(user.locator(".hkc-message-text")).toHaveText(original);
  await expect(user.locator(".hkc-message-branches")).toHaveText("1 of 2");
  await user.hover();
  await user.getByRole("button", { name: "Next branch" }).click();
  await expect(user.locator(".hkc-message-text")).toHaveText("Edited responsive review");
  await expect(user.locator(".hkc-message-branches")).toHaveText("2 of 2");
});

test("copy writes the actual message to the clipboard", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL!).origin });
  const example = await openChat(page, "chat-thread");
  const user = example.getByRole("article", { name: "You", exact: true }).last();
  const text = await user.locator(".hkc-message-text").innerText();
  await user.hover();
  await user.getByRole("button", { name: "Copy message", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
});

test("regenerate creates a second assistant branch", async ({ page }) => {
  const example = await openChat(page, "chat-thread");
  const assistant = example.getByRole("article", { name: "Harso", exact: true }).last();
  const original = await assistant.locator(".hkc-message-text").innerText();
  await assistant.hover();
  await assistant.getByRole("button", { name: "Regenerate response" }).click();
  await expect(assistant.locator(".hkc-message-branches")).toHaveText("2 of 2");
  await expect(assistant.getByRole("status", { name: "Streaming" })).toBeVisible();
  await expect(assistant.getByRole("status", { name: "Streaming" })).toHaveCount(0);
  await assistant.hover();
  await assistant.getByRole("button", { name: "Previous branch" }).click();
  await expect(assistant.locator(".hkc-message-text")).toHaveText(original);
});

for (const decision of ["Approve", "Deny"] as const) {
  test(`${decision} updates the live tool badge`, async ({ page }) => {
    const example = await openChat(page, "chat-parts");
    await example.getByRole("button", { name: "Start live approval" }).click();
    const tool = example.locator('.hkc-tool[data-tool="terminal"]').last();
    await expect(tool.locator(".hkc-tool-state")).toHaveText("awaiting approval");
    await tool.getByRole("button", { name: decision, exact: true }).click();
    const state = decision === "Approve" ? "completed" : "denied";
    await expect(tool).toHaveAttribute("data-state", state);
    await expect(tool.locator('.hkc-tool-state[role="status"]')).toHaveText(state);
    await expect(tool.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
    await expect(tool.getByRole("button", { name: "Deny", exact: true })).toHaveCount(0);
  });
}

test("adapter error can be retried successfully", async ({ page }) => {
  const example = await openChat(page, "chat-thread");
  await sendMessage(example, "Demonstrate an error");
  const response = example.getByRole("article", { name: "Harso", exact: true }).last();
  await expect(response.getByRole("alert")).toContainText("Simulated adapter error");
  await response.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(response.getByRole("status", { name: "Streaming" })).toBeVisible();
  await expect(response.getByRole("status", { name: "Streaming" })).toHaveCount(0);
  await expect(response.getByRole("alert")).toHaveCount(0);
  await expect(response.locator(".hkc-message-text")).toContainText("no command runs without a decision");
});

test("attachments add, remove, and render on the sent message", async ({ page }) => {
  const example = await openChat(page, "chat-composer");
  const composer = example.locator(".hkc-composer");
  await attachFile(page, example);
  await expect(composer.getByText("lane-7.txt", { exact: true })).toBeVisible();
  await composer.getByRole("button", { name: "Remove lane-7.txt" }).click();
  await expect(composer.getByText("lane-7.txt", { exact: true })).toHaveCount(0);
  await attachFile(page, example);
  await sendMessage(example, "Review this local attachment");
  await expect(composer.getByText("lane-7.txt", { exact: true })).toHaveCount(0);
  await expect(example.locator(".hkc-attachment--message").getByText("lane-7.txt", { exact: true })).toBeVisible();
});

test("seed attachments are inside the user bubble", async ({ page }) => {
  const example = await openChat(page, "chat-thread");
  const bubble = example.getByRole("article", { name: "You", exact: true }).first().locator(".hkc-message-bubble");
  await expect(bubble.getByText("requirements.md", { exact: true })).toBeVisible();
  await expect(bubble.getByRole("img", { name: "conversation.png" })).toBeVisible();
});

test("thread list renames, deletes, and starts a new conversation", async ({ page }) => {
  const example = await openChat(page, "chat-shell");
  const open = example.getByRole("button", { name: "Open conversations", exact: true });
  if (await open.isVisible()) await open.click();
  const row = example.locator(".hkc-thread-row").first();
  await expect(row).toBeVisible();
  const originalTitle = await row.locator(".hkc-thread-trigger").innerText();
  await example.getByRole("button", { name: "New conversation", exact: true }).click();
  await expect(example.locator(".hkc-thread-empty")).toHaveText("Start a conversation.");
  await row.getByRole("button", { name: originalTitle.trim(), exact: true }).click();
  await expect(example.locator(".hkc-message--user")).not.toHaveCount(0);
  await row.getByRole("button", { name: /^Rename / }).click();
  await row.getByRole("textbox", { name: "Conversation title" }).fill("Lane 7 review");
  await row.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row.getByRole("button", { name: "Lane 7 review", exact: true })).toBeVisible();
  await row.getByRole("button", { name: "Delete Lane 7 review", exact: true }).click();
  await row.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await expect(example.getByRole("button", { name: "Lane 7 review", exact: true })).toHaveCount(0);
});
