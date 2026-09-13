import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceFiles = ["preview/ai-chat-example.tsx", "preview/composer-example.tsx", "preview/consumer-readiness-examples.tsx", "src/agent-surfaces.tsx", "src/composer.tsx", "src/prompt-input.tsx", "src/question.tsx", "src/misc-surfaces.tsx", "tests/boundaryless-ai-consumer-completion.spec.ts"];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [file, createHash("sha256").update(readFileSync(resolve(import.meta.dirname, "..", file))).digest("hex")]));
let before: ReturnType<typeof hashes>;
test.beforeAll(async ({ browser }) => {
  before = hashes();
  await test.info().attach("ai-consumer-source-before", { body: JSON.stringify({ files: before, browser: browser.version(), baseURL: test.info().project.use.baseURL }), contentType: "application/json" });
});
test.afterAll(async () => {
  await test.info().attach("ai-consumer-source-after", { body: JSON.stringify(hashes()), contentType: "application/json" });
  expect(hashes()).toEqual(before);
});

test("AI CONSUMER wide AiChat disabled actions retain mounted draft while escape chrome stays available", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1040 });
  await page.goto("/#boardui:ai-chat");
  const example = page.getByTestId("live-example");
  const workspace = example.locator(".hk-ai-workspace");
  await expect(workspace).toHaveAttribute("data-compact", "false");
  const draft = workspace.getByRole("textbox", { name: "Message", exact: true });
  await draft.fill("Retained chat draft");
  const original = await draft.elementHandle();
  await workspace.getByRole("button", { name: "Changes", exact: true }).click();
  const close = workspace.getByRole("button", { name: "Close context panel" });
  const navigation = workspace.locator(".hk-ai-navigation-toggle");
  await example.getByLabel("Chat state", { exact: true }).selectOption("disabled");
  const request = await example.getByLabel("Workspace request").textContent();
  for (const control of [workspace.getByRole("navigation").getByRole("button", { name: "Test planning", exact: true }), workspace.getByRole("dialog").getByRole("button", { name: "Browser", exact: true })]) {
    await expect(control).toBeDisabled();
    await control.evaluate((button: HTMLButtonElement) => button.click());
  }
  await expect(workspace.getByRole("dialog", { name: "Proposed changes" })).toBeVisible();
  await expect(navigation).toHaveAttribute("aria-expanded", "true");
  await expect(example.getByLabel("Workspace request")).toHaveText(request!);
  await expect(draft).toBeDisabled();
  await expect(close).toBeEnabled();
  await expect(navigation).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(workspace.getByRole("dialog")).toHaveCount(0);
  await expect(example.getByLabel("Workspace request")).toHaveText("Close panel.");
  await example.getByLabel("Chat state", { exact: true }).selectOption("ready");
  expect(await original!.evaluate(element => element.isConnected)).toBe(true);
  await expect(draft).toHaveValue("Retained chat draft");
  // Navigation is persistent on desktop; its escape toggle is phone-only.
  await page.setViewportSize({ width: 390, height: 1040 });
  await expect(navigation).toBeVisible();
  await expect(navigation).toHaveAttribute("aria-expanded", "false");
  await navigation.press("Enter");
  await expect(navigation).toHaveAttribute("aria-expanded", "true");
  await workspace.getByRole("navigation").getByRole("button", { name: "Test planning", exact: true }).press("Escape");
  await expect(navigation).toBeFocused();
  await expect(navigation).toHaveAttribute("aria-expanded", "false");
});

test("AI CONSUMER AiChat empty loading error and refused retry preserve local draft and attachment", async ({ page }) => {
  await page.goto("/#boardui:ai-chat");
  const example = page.getByTestId("live-example");
  const draft = example.getByRole("textbox", { name: "Message", exact: true });
  await draft.fill("Retry this local draft");
  await example.locator('input[type="file"]').last().setInputFiles({ name: "context.txt", mimeType: "text/plain", buffer: Buffer.from("Local only") });
  const attachment = example.getByRole("button", { name: "Remove attachment context.txt" });
  for (const state of ["empty", "loading", "error"]) {
    await example.getByLabel("Chat state", { exact: true }).selectOption(state);
    await expect(draft).toHaveValue("Retry this local draft");
    await expect(attachment).toBeVisible();
    if (state === "empty") await expect(example.getByText("A little space to create.", { exact: true })).toBeVisible();
    else {
      await expect(draft).toBeDisabled();
      await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
    }
    if (state === "loading") await expect(example.getByRole("status").filter({ hasText: "Loading conversation" })).toBeVisible();
  }
  await expect(example.getByRole("alert")).toContainText("could not load");
  await example.getByLabel("Hold host state").check();
  await example.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(example.getByRole("alert")).toBeVisible();
  await expect(example.getByLabel("Workspace request")).toHaveText("Retry requested; host retained state.");
  await example.getByLabel("Hold host state").uncheck();
  await example.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(example.getByRole("alert")).toHaveCount(0);
  await expect(draft).toBeEnabled();
  await expect(draft).toHaveValue("Retry this local draft");
  await expect(attachment).toBeVisible();
});

for (const family of ["composer", "composer-panel"]) {
  test(`AI CONSUMER ${family} mounted empty loading error disabled recovery`, async ({ page }) => {
    await page.goto(`/#boardui:${family}`);
    const example = page.getByTestId("live-example");
    const draft = example.getByRole("textbox", { name: "Message", exact: true });
    await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
    await draft.fill("   ");
    await draft.press("Enter");
    await expect(example.getByText(/Local submission:/)).toHaveCount(0);
    await draft.fill("Retained composer draft");
    const original = await draft.elementHandle();
    for (const state of ["loading", "disabled", "error", "ready"]) {
      await example.getByLabel("Composer host state", { exact: true }).selectOption(state);
      expect(await original!.evaluate(element => element.isConnected)).toBe(true);
      await expect(draft).toHaveValue("Retained composer draft");
      if (state === "loading" || state === "disabled") {
        await expect(draft).toBeDisabled();
        const send = example.getByRole("button", { name: "Send", exact: true });
        await expect(send).toBeDisabled();
        await send.evaluate((button: HTMLButtonElement) => button.click());
        await expect(example.getByText(/Local submission:/)).toHaveCount(0);
        await expect(example.getByRole("button", { name: "Remove brief.md" })).toBeDisabled();
      } else await expect(draft).toBeEnabled();
      if (state === "loading") {
        await expect(example.locator(family === "composer" ? ".hk-composer" : ".hk-composer-panel").first()).toHaveAttribute("aria-busy", "true");
        if (family === "composer-panel") await expect(example.getByRole("status").filter({ hasText: "Working" })).toBeVisible();
      }
      if (state === "error") await expect(example.getByRole("alert").filter({ hasText: /draft could not be sent/ })).toBeVisible();
    }
    await example.getByRole("button", { name: "Send", exact: true }).click();
    await expect(example.getByText("Local submission: Retained composer draft", { exact: true })).toBeVisible();
    await expect(draft).toHaveValue("");
  });
}

test("AI CONSUMER core Composer GlassComposer controlled edit refusal reports callback then accepts replacement", async ({ page }) => {
  await page.goto("/#boardui:composer");
  const example = page.getByTestId("live-example");
  const draft = example.locator(".hk-composer .hk-glass-composer").getByRole("textbox", { name: "Message" });
  await draft.fill("Host draft");
  await example.getByLabel("Hold host state").check();
  await draft.fill("Refused edit");
  await expect(draft).toHaveValue("Host draft");
  await expect(example.getByLabel("Composer draft requests")).toHaveText("2 requests");
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(draft).toHaveValue("Host draft");
  await expect(example.getByText(/Local submission:/)).toHaveCount(0);
  await example.getByLabel("Hold host state").uncheck();
  await draft.fill("Accepted replacement");
  await expect(draft).toHaveValue("Accepted replacement");
  await expect(example.getByLabel("Composer draft requests")).toHaveText("3 requests");
});

test("AI CONSUMER PromptInput mounted empty loading error disabled recovery and refusal", async ({ page }) => {
  await page.goto("/#vercel:prompt-input");
  const example = page.getByTestId("live-example");
  const draft = example.getByRole("textbox", { name: "Prompt", exact: true });
  await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await draft.fill("   ");
  await draft.press("Enter");
  await expect(example.getByLabel("Prompt result")).not.toContainText("Accepted locally");
  await draft.fill("Preserved prompt");
  await example.locator('input[type="file"]').last().setInputFiles({ name: "prompt.txt", mimeType: "text/plain", buffer: Buffer.from("Never uploaded") });
  const original = await draft.elementHandle();
  for (const state of ["loading", "disabled", "error"]) {
    await example.getByLabel("Prompt host state", { exact: true }).selectOption(state);
    expect(await original!.evaluate(element => element.isConnected)).toBe(true);
    await expect(draft).toHaveValue("Preserved prompt");
    await expect(example.getByRole("list", { name: "Prompt attachments" })).toContainText("prompt.txt");
    await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
    if (state !== "error") {
      await expect(draft).toBeDisabled();
      await expect(example.getByRole("button", { name: "Remove prompt.txt" })).toBeDisabled();
      await example.getByRole("button", { name: "Clear draft", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      await expect(draft).toHaveValue("Preserved prompt");
    }
    if (state === "loading") await expect(example.getByRole("status").filter({ hasText: "Waiting for the local host." })).toBeVisible();
  }
  await expect(example.getByRole("alert")).toHaveText("The local host rejected submission. Draft and attachments retained.");
  await example.getByLabel("Hold prompt changes").check();
  await example.getByRole("button", { name: "Retry local prompt", exact: true }).click();
  await expect(example.getByRole("alert")).toBeVisible();
  await example.getByLabel("Hold prompt changes").uncheck();
  await example.getByRole("button", { name: "Retry local prompt", exact: true }).click();
  await expect(example.getByRole("alert")).toHaveCount(0);
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(example.getByLabel("Prompt result")).toHaveText("Accepted locally · Balanced: Preserved prompt · Files: prompt.txt");
  await expect(draft).toHaveValue("");
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toHaveCount(0);
});

test("AI CONSUMER Question native disabled option emits no callback and recovers without remount", async ({ page }) => {
  await page.goto("/#vercel:question");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^\"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^\"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^\"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const Question = await import(`${producerUrl}question.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [disabled, setDisabled] = React.useState(false);
      const [value, setValue] = React.useState({ selectedValues: [], text: "" });
      const [changes, setChanges] = React.useState(0);
      const [submits, setSubmits] = React.useState(0);
      return element("section", { "aria-label": "Question completion fixture" },
        element("label", null, element("input", { type: "checkbox", checked: disabled, onChange: (event: Event) => setDisabled((event.target as HTMLInputElement).checked) }), "Disable actual Question"),
        element(Question.Question, { value, disabled, onValueChange: (next: typeof value) => { setChanges((count: number) => count + 1); setValue(next); }, onSubmit: () => setSubmits((count: number) => count + 1) },
          element(Question.QuestionPrompt, null, "Choose locally"),
          element(Question.QuestionOptions, null, element(Question.QuestionOption, { value: "continue" }, "Continue")),
          element(Question.QuestionInput, { "aria-label": "Question draft" }),
          element(Question.QuestionSubmit)),
        element("output", { "aria-label": "Question callback counts" }, `${changes} changes; ${submits} submits`));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl });
  const fixture = page.getByRole("region", { name: "Question completion fixture" });
  const option = fixture.getByRole("button", { name: "Continue", exact: true });
  const draft = fixture.getByRole("textbox");
  await expect(fixture.getByRole("button", { name: "Submit", exact: true })).toBeDisabled();
  await draft.fill("   ");
  await fixture.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(fixture.getByLabel("Question callback counts")).toHaveText("1 changes; 0 submits");
  await fixture.getByLabel("Disable actual Question").check();
  await expect(option).toBeDisabled();
  await option.scrollIntoViewIfNeeded();
  const bounds = (await option.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await option.evaluate((button: HTMLButtonElement) => button.click());
  await fixture.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(option).toHaveAttribute("aria-pressed", "false");
  await expect(fixture.getByLabel("Question callback counts")).toHaveText("1 changes; 0 submits");
  await fixture.getByLabel("Disable actual Question").uncheck();
  await option.press("Space");
  await expect(option).toHaveAttribute("aria-pressed", "true");
  await fixture.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(fixture.getByLabel("Question callback counts")).toHaveText("2 changes; 1 submits");
});

for (const provider of ["Microsoft", "Bitbucket", "Auth0", "Okta"]) {
  test(`AI CONSUMER SocialButton ${provider} uses its supplied mark or labelled initial`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", request => { if (request.method() !== "GET" || new URL(request.url()).origin !== new URL(test.info().project.use.baseURL!).origin) requests.push(request.url()); });
    await page.goto("/#boardui:social-button");
    const example = page.getByTestId("live-example");
    await example.getByLabel("Social provider", { exact: true }).selectOption(provider);
    const social = example.locator(".hk-social-button");
    await expect(social).toHaveAccessibleName(`Continue with ${provider}`);
    await expect(social).toContainText(`Continue with ${provider}`);
    if (provider === "Microsoft" || provider === "Bitbucket") {
      await expect(social.locator("img")).toHaveCount(1);
      expect(await social.locator("img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(social.locator("svg,img")).toHaveCount(0);
      await expect(social.locator('[aria-hidden="true"]').first()).toHaveText(provider[0]);
    }
    await expect(example.getByText(/Auth0 and Okta still use illustrative initials/)).toBeVisible();
    await example.getByLabel("Hold social requests").check();
    await social.press("Enter");
    await expect(example.getByLabel("Social result")).toHaveText(`${provider} requested; host retained none.`);
    await example.getByLabel("Hold social requests").uncheck();
    await social.press("Space");
    await expect(example.getByLabel("Social result")).toHaveText(`${provider} request accepted locally; no authentication started.`);
    await example.getByLabel("Icon-only social button").check();
    await expect(social).toHaveAccessibleName(`Continue with ${provider}`);
    await expect(social).not.toContainText("Continue with");
    for (const label of ["Pending social request", "Disable social buttons"]) {
      await example.getByLabel(label).check();
      await expect(social).toBeDisabled();
      await social.evaluate((button: HTMLButtonElement) => button.click());
      await expect(example.getByLabel("Social result")).toHaveText(`${provider} request accepted locally; no authentication started.`);
      await example.getByLabel(label).uncheck();
      await expect(social).toBeEnabled();
    }
    await social.click();
    expect(new URL(page.url()).hash).toBe("#boardui:social-button");
    expect(requests).toEqual([]);
  });
}
