import { expect, test, type Page } from "@playwright/test";

async function mountExample(page: Page, component: "Conversation" | "Message") {
  await page.goto("/#vercel:conversation");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, component, exampleUrl }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { ConversationExample } = await import(exampleUrl);
    const element = React.createElement;
    function Consumer() {
      const [state, setState] = React.useState("default");
      return element("section", { "aria-label": "Conversation completion consumer" },
        element("select", { "aria-label": "Mounted state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["default", "disabled"].map(value => element("option", { key: value }, value))),
        element(ConversationExample, { component, state }));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, component, exampleUrl: "/src/boundaryless/conversation-examples.tsx" });
  return page.getByRole("region", { name: "Conversation completion consumer" });
}

test("conversation mounted disabled recovery preserves transcript and reader through supplied streaming and empty recovery", async ({ page }) => {
  const fixture = await mountExample(page, "Conversation");
  const viewport = fixture.getByRole("log");
  const original = await viewport.elementHandle();
  for (let index = 0; index < 8; index++) await fixture.getByRole("button", { name: "Add sample update", exact: true }).click();
  await viewport.focus();
  await viewport.press("Home");
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  const transcript = await viewport.textContent();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  for (const name of ["Add sample update", "Download conversation", "Latest response ↓"]) {
    const button = fixture.getByRole("button", { name, exact: true });
    await expect(button).toBeDisabled();
    await button.click({ force: true });
  }
  await expect(viewport).toHaveText(transcript!);
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await viewport.evaluate((element, previous) => element === previous, original)).toBe(true);
  await expect(viewport).toHaveText(transcript!);
  await fixture.getByRole("button", { name: "Latest response ↓", exact: true }).click();
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(3);
  await fixture.getByLabel("Streaming sample", { exact: true }).check();
  await expect(viewport.locator('.hk-message-response').last()).toHaveAttribute("aria-busy", "true");
  await fixture.getByRole("button", { name: "Add sample update", exact: true }).click();
  await expect(viewport).not.toHaveText(transcript!);
  await fixture.getByRole("button", { name: "Clear sample", exact: true }).click();
  await expect(viewport.getByRole("article")).toHaveCount(0);
  await expect(fixture.getByRole("button", { name: "Download conversation", exact: true })).toBeDisabled();
  const suggestion = fixture.getByRole("button", { name: "Help me find a direction", exact: true });
  const originalSuggestion = await suggestion.elementHandle();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(suggestion).toBeDisabled();
  await suggestion.click({ force: true });
  await expect(viewport.getByRole("article")).toHaveCount(0);
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await suggestion.evaluate((element, previous) => element === previous, originalSuggestion)).toBe(true);
  await fixture.getByLabel("Streaming sample", { exact: true }).uncheck();
  await suggestion.click();
  await expect(viewport.getByRole("article")).toHaveCount(2);
  await expect(viewport.locator('.hk-message-response').last()).not.toHaveAttribute("aria-busy");
  expect(await viewport.evaluate((element, previous) => element === previous, original)).toBe(true);
  const download = page.waitForEvent("download");
  await fixture.getByRole("button", { name: "Download conversation", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("harso-synthetic-conversation.md");
});

test("message mounted disabled recovery retains draft and feedback across supplied replacement and branches", async ({ page }) => {
  const fixture = await mountExample(page, "Message");
  await fixture.getByText("Notes on this version", { exact: true }).click();
  const draft = fixture.getByLabel("Version one notes");
  await draft.fill("Keep these local notes");
  const originalDraft = await draft.elementHandle();
  const helpful = fixture.getByRole("button", { name: "Mark helpful", exact: true });
  const originalHelpful = await helpful.elementHandle();
  await helpful.click();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  for (const name of ["Next response", "Mark helpful", "Request another answer"]) {
    const button = fixture.getByRole("button", { name, exact: true });
    await expect(button).toBeDisabled();
    await button.click({ force: true });
  }
  await expect(fixture.getByLabel("Message action", { exact: true })).toBeEmpty();
  await expect(helpful).toHaveAttribute("aria-pressed", "true");
  await expect(fixture.getByText("1 of 2", { exact: true })).toBeVisible();
  await fixture.getByLabel("Untrusted Markdown sample", { exact: true }).check();
  await expect(fixture.getByRole("heading", { name: "Safe to read.", exact: true })).toBeVisible();
  await expect(draft).toHaveValue("Keep these local notes");
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await draft.evaluate((element, previous) => element === previous, originalDraft)).toBe(true);
  expect(await helpful.evaluate((element, previous) => element === previous, originalHelpful)).toBe(true);
  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await fixture.getByRole("button", { name: "Request another answer", exact: true }).click();
  await expect(fixture.getByLabel("Message action", { exact: true })).toHaveText("Another answer requested; no runtime is connected");
  await fixture.getByRole("button", { name: "Next response", exact: true }).click();
  await expect(draft).toBeHidden();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  const previous = fixture.getByRole("button", { name: "Previous response", exact: true });
  await expect(previous).toBeDisabled();
  await previous.click({ force: true });
  await expect(fixture.getByText("2 of 2", { exact: true })).toBeVisible();
  await fixture.getByLabel("Mounted state").selectOption("default");
  await previous.click();
  await expect(draft).toHaveValue("Keep these local notes");
  await fixture.getByLabel("Untrusted Markdown sample", { exact: true }).uncheck();
  await expect(fixture.getByRole("heading", { name: "A focused launch.", exact: true })).toBeVisible();
  expect(await draft.evaluate((element, before) => element === before, originalDraft)).toBe(true);
});

test("disabled empty conversation cannot request a new sample", async ({ page }) => {
  await page.goto("/#vercel:conversation");
  await page.getByLabel("Example state", { exact: true }).selectOption("disabled");
  await page.getByRole("button", { name: "Clear sample", exact: true }).click();
  const suggestion = page.getByRole("button", { name: "Help me find a direction", exact: true });
  await expect(suggestion).toBeDisabled();
  await suggestion.click({ force: true });
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download conversation", exact: true })).toBeDisabled();
  await page.getByLabel("Example state", { exact: true }).selectOption("default");
  await page.getByRole("button", { name: "Clear sample", exact: true }).click();
  await suggestion.click();
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("disabled conversation keeps the reading position instead of jumping", async ({ page }) => {
  await page.goto("/#vercel:conversation");
  await page.getByLabel("Example state", { exact: true }).selectOption("disabled");
  const viewport = page.getByRole("log");
  await viewport.evaluate(element => { element.style.maxHeight = "120px"; });
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(24);
  await viewport.focus();
  await viewport.press("Home");
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  const jump = page.getByRole("button", { name: "Latest response ↓", exact: true });
  await expect(jump).toBeVisible();
  await expect(jump).toBeDisabled();
  await jump.click({ force: true });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
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

test("conversation host refusal preserves transcript and reading position", async ({ page }) => {
  await page.goto("/#vercel:conversation");
  await page.getByRole("checkbox", { name: "Keep supplied conversation", exact: true }).check();
  const text = await page.getByRole("log").textContent();
  await page.getByRole("button", { name: "Download conversation", exact: true }).click();
  await expect(page.getByLabel("Export result", { exact: true })).toHaveText("Download declined by example host");
  await expect(page.getByRole("log")).toHaveText(text!);
  const viewport = page.getByRole("log");
  for (let index = 0; index < 8; index++) await page.getByRole("button", { name: "Add sample update", exact: true }).click();
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(24);
  await viewport.focus();
  await viewport.press("Home");
  const jump = page.getByRole("button", { name: "Latest response ↓", exact: true });
  await jump.click();
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  await page.getByRole("checkbox", { name: "Keep supplied conversation", exact: true }).uncheck();
  await jump.click();
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(3);
});
