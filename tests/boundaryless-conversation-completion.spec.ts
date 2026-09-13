import { expect, test } from "@playwright/test";

test("runtime empty loading error and disabled recovery stay distinct", async ({ page }) => {
  await page.goto("/#harso:chat-thread");
  const state = page.getByLabel("Thread state", { exact: true });
  await state.selectOption("empty");
  await expect(page.getByRole("log")).toContainText("Start a conversation.");
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await state.selectOption("loading");
  await expect(page.getByRole("status", { name: "Streaming", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await state.selectOption("error");
  await expect(page.getByRole("alert")).toContainText("Simulated adapter error");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeEnabled();
  await expect(page.getByText("Start a conversation.", { exact: true })).toHaveCount(0);
  await state.selectOption("empty");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Retained local draft");
  const mounted = await input.elementHandle();
  await page.getByLabel("Disable thread input", { exact: true }).check();
  await expect(input).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await page.getByLabel("Disable thread input", { exact: true }).uncheck();
  await expect(input).toHaveValue("Retained local draft");
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
});

test("runtime transcript retains reader position across mounted disable and jumps to latest", async ({ page }) => {
  await page.goto("/#harso:chat-thread");
  await page.getByLabel("Thread state", { exact: true }).selectOption("long transcript");
  const viewport = page.locator(".hkc-thread-viewport");
  await expect(page.getByRole("article")).toHaveCount(40);
  const mounted = await viewport.elementHandle();
  await viewport.evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event("scroll")); });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  const transcript = await page.getByRole("log").textContent();
  await page.getByLabel("Disable thread input", { exact: true }).check();
  await expect(page.getByRole("log")).toHaveText(transcript!);
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  await page.getByLabel("Disable thread input", { exact: true }).uncheck();
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
  const jump = page.getByRole("button", { name: "Latest message", exact: true });
  await jump.focus(); await page.keyboard.press("Enter");
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(3);
  // Runtime scroll primitive may hide after reaching bottom; keyboard activation remains real.
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

test("shimmer only follows supplied active state without owning a lifecycle", async ({ page }) => {
  await page.goto("/#vercel:shimmer");
  const example = page.getByTestId("live-example");
  const title = example.getByRole("heading", { name: "Making room for the next idea.", exact: true });
  await expect(title).toHaveAttribute("data-active", "true");
  await title.click();
  await expect(title).toHaveAttribute("data-active", "true");
  await example.getByRole("checkbox", { name: "Waiting state", exact: true }).uncheck();
  await expect(title).not.toHaveAttribute("data-active");
  await expect(title).toHaveText("Making room for the next idea.");
  await example.getByRole("checkbox", { name: "Waiting state", exact: true }).check();
  await expect(title).toHaveAttribute("data-active", "true");
});

test("shimmer preserves its mounted element through supplied text replacement and empty state", async ({ page }) => {
  await page.goto("/#vercel:shimmer");
  const example = page.getByTestId("live-example");
  const title = example.locator("h2");
  const mounted = await title.elementHandle();
  await example.getByLabel("Waiting text", { exact: true }).fill("");
  await expect(title).toHaveText("");
  await example.getByRole("checkbox", { name: "Waiting state", exact: true }).uncheck();
  await expect(title).not.toHaveAttribute("data-active");
  await example.getByLabel("Waiting text", { exact: true }).fill("A supplied replacement");
  await expect(title).toHaveText("A supplied replacement");
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
});

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

