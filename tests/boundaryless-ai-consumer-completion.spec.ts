import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceFiles = ["preview/chat-thread-example.tsx", "preview/chat-composer-example.tsx", "preview/consumer-readiness-examples.tsx", "src/chat/composer.tsx", "src/question.tsx", "src/misc-surfaces.tsx", "tests/boundaryless-ai-consumer-completion.spec.ts"];
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
