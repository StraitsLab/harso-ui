import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceFiles = ["src/work.tsx", "src/work.css", "preview/work-examples.tsx", "tests/boundaryless-work-completion.spec.ts"];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [file, createHash("sha256").update(readFileSync(resolve(import.meta.dirname, "..", file))).digest("hex")]));
let before: ReturnType<typeof hashes>;
test.beforeAll(async ({ browser }) => {
  before = hashes();
  await test.info().attach("work-source-before", { body: JSON.stringify({ files: before, browser: browser.version(), baseURL: test.info().project.use.baseURL }), contentType: "application/json" });
});
test.afterAll(async () => {
  await test.info().attach("work-source-after", { body: JSON.stringify(hashes()), contentType: "application/json" });
  expect(hashes()).toEqual(before);
});

for (const family of ["plan", "task", "checkpoint", "reasoning"]) {
  test(`WORK COMPLETION ${family} mounted empty loading error disabled and recovery`, async ({ page }) => {
    await page.goto(`/#vercel:${family}`);
    const example = page.getByTestId("live-example");
    const host = example.getByLabel("Host sample state", { exact: true });
    const draft = example.getByRole("textbox").first();
    await draft.fill("Retained local draft");
    const originalDraft = await draft.elementHandle();
    for (const state of ["empty", "loading", "error", "disabled", "ready"]) {
      await host.selectOption(state);
      expect(await originalDraft!.evaluate(element => element.isConnected)).toBe(true);
      await expect(draft).toHaveValue("Retained local draft");
      await expect(example.getByLabel("Host sample status", { exact: true })).toHaveText(state === "empty" ? "No records supplied." : state === "loading" ? "Waiting for host records." : state === "error" ? "Host reported missing access. No runtime action." : state === "disabled" ? "Sample interactions disabled." : "Local sample ready.");
      await expect(example.getByRole("group", { name: `${family[0].toUpperCase()}${family.slice(1)} local sample`, exact: true })).toHaveAttribute("aria-busy", String(state === "loading"));
      if (["empty", "loading", "error"].includes(state)) {
        if (family === "plan" || family === "task") await expect(example.locator(".hk-task-item-status:visible")).toHaveCount(0);
        if (family === "task") await expect(example.getByRole("button", { name: /^Shape the launch brief/ })).not.toContainText("2 working");
        if (family === "checkpoint") await expect(example.locator(".hk-checkpoint-trigger:visible")).toHaveCount(0);
        if (family === "reasoning") {
          await expect(example.locator(".hk-message-response")).toHaveText("");
          if (state !== "loading") await expect(example.locator(".hk-reasoning")).not.toHaveAttribute("data-streaming");
        }
      }
      if (state === "ready" || state === "error") await expect(draft).toBeEnabled();
      else {
        await expect(draft).toBeDisabled();
        for (const button of await example.getByRole("button").all()) {
          await expect(button).toBeDisabled();
          await button.evaluate((element: HTMLButtonElement) => element.click());
        }
      }
      if (family === "plan") await expect(example.getByLabel("Disclosure requests")).toHaveText("0 requests");
      if (family === "task") await expect(example.getByLabel("Work action")).toHaveText("No file requested");
      if (family === "checkpoint") await expect(example.getByLabel("Local checkpoint selection", { exact: true })).toHaveText("Manual: None selected");
    }
    await draft.fill("Editable after recovery");
    await expect(draft).toHaveValue("Editable after recovery");
  });
}

test("WORK COMPLETION reasoning refuses disclosure while public host updates retain mounted state", async ({ page }) => {
  await page.goto("/#vercel:reasoning");
  const example = page.getByTestId("live-example");
  const trigger = example.locator(".hk-reasoning .hk-work-trigger");
  await example.getByLabel("Keep host disclosure").check();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(example.getByLabel("Reasoning disclosure requests")).toHaveText("1 requests");
  await example.getByRole("button", { name: "Append sample update" }).click();
  await example.getByLabel("Streaming sample").uncheck();
  await expect(trigger).toContainText("12s");
  await expect(example.getByText("Received 1 additional sample update.")).toBeVisible();
  await example.getByLabel("Keep host disclosure").uncheck();
  await trigger.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await example.getByLabel("Host sample state").selectOption("loading");
  await example.getByLabel("Host sample state").selectOption("ready");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await expect(example.getByText("Received 1 additional sample update.")).toBeVisible();
  await expect(example.getByLabel("Reasoning disclosure requests")).toHaveText("3 requests");
});

test("WORK COMPLETION task controlled refusal keeps disclosure draft nested state and explicit requests", async ({ page }) => {
  await page.goto("/#vercel:task");
  const example = page.getByTestId("live-example");
  const trigger = example.getByRole("button", { name: /^Shape the launch brief/ });
  await example.getByLabel("Task notes", { exact: true }).fill("Keep task draft");
  await example.getByRole("button", { name: "Six sources reviewed", exact: true }).click();
  await example.getByLabel("Keep host disclosure", { exact: true }).check();
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toBeFocused();
  await expect(example.getByLabel("Task disclosure requests")).toHaveText("1 requests");
  await example.getByRole("button", { name: "Complete sample progress", exact: true }).click();
  await expect(trigger).toContainText("Complete");
  await expect(example.getByLabel("Task notes", { exact: true })).toHaveValue("Keep task draft");
  await example.getByLabel("Keep host disclosure", { exact: true }).uncheck();
  await trigger.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await example.getByLabel("Host sample state").selectOption("loading");
  await example.getByLabel("Host sample state").selectOption("ready");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await expect(example.getByLabel("Task notes", { exact: true })).toHaveValue("Keep task draft");
  await expect(example.getByText("Original interview notes", { exact: true })).toBeVisible();
  await expect(example.getByLabel("Task disclosure requests")).toHaveText("3 requests");
  await expect(example.getByLabel("Work action")).toHaveText("No file requested");
});

test("WORK FOLLOWUP Plan streaming preference survives absent records without stale Updating", async ({ page }) => {
  await page.goto("/#vercel:plan");
  const example = page.getByTestId("live-example");
  const draft = example.getByLabel("Plan notes", { exact: true });
  await draft.fill("Retain plan notes");
  const original = await draft.elementHandle();
  await example.getByRole("button", { name: "Our team", exact: true }).click();
  await example.getByLabel("Streaming sample", { exact: true }).check();
  await expect(example.getByText("Updating", { exact: true })).toBeVisible();
  for (const state of ["empty", "error"]) {
    await example.getByLabel("Host sample state", { exact: true }).selectOption(state);
    await expect(example.locator(".hk-plan").first()).not.toHaveAttribute("data-streaming", "true");
    await expect(example.getByText("Updating", { exact: true })).toHaveCount(0);
    await expect(example.getByText("No plan supplied", { exact: true })).toBeVisible();
    await expect(example.getByLabel("Streaming sample", { exact: true })).toBeChecked();
    await expect(draft).toHaveValue("Retain plan notes");
    await expect(example.getByRole("button", { name: "Our team", exact: true })).toHaveAttribute("aria-pressed", "true");
    await example.getByLabel("Host sample state", { exact: true }).selectOption("ready");
    await expect(example.getByText("Updating", { exact: true })).toBeVisible();
    await expect(example.locator(".hk-plan").first()).toHaveAttribute("data-streaming", "true");
  }
  expect(await original!.evaluate(element => element.isConnected)).toBe(true);
});

test("WORK FOLLOWUP Task completed preference survives absent records without stale readiness", async ({ page }) => {
  await page.goto("/#vercel:task");
  const example = page.getByTestId("live-example");
  const draft = example.getByLabel("Task notes", { exact: true });
  await draft.fill("Retain task notes");
  const original = await draft.elementHandle();
  await example.getByRole("button", { name: "Complete sample progress", exact: true }).click();
  await expect(example.getByText("Ready for your review.", { exact: true })).toBeVisible();
  for (const state of ["empty", "loading"]) {
    await example.getByLabel("Host sample state", { exact: true }).selectOption(state);
    await expect(example.getByText("Ready for your review.", { exact: true })).toHaveCount(0);
    await expect(example.getByText("No task records supplied.", { exact: true })).toBeVisible();
    await expect(example.getByRole("button", { name: "Reset sample progress", exact: true })).toBeVisible();
    await expect(example.getByRole("button", { name: "Review decision", exact: true })).toBeVisible();
    await expect(draft).toHaveValue("Retain task notes");
    await example.getByLabel("Host sample state", { exact: true }).selectOption("ready");
    await expect(example.getByText("Ready for your review.", { exact: true })).toBeVisible();
    await expect(example.getByRole("button", { name: /^Shape the launch brief/ })).toContainText("Complete");
  }
  expect(await original!.evaluate(element => element.isConnected)).toBe(true);
});

for (const mode of ["Manual", "Automatic", "Branching"]) {
  test(`WORK COMPLETION checkpoint ${mode} local applicability and refusal only`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", request => { if (request.method() !== "GET" || new URL(request.url()).origin !== new URL(test.info().project.use.baseURL!).origin) requests.push(request.url()); });
    await page.goto("/#vercel:checkpoint");
    const example = page.getByRole("region", { name: "Local checkpoint modes", exact: true });
    await example.getByRole("button", { name: mode, exact: true }).click();
    const key = mode === "Branching" ? "Main" : mode;
    const first = example.getByRole("button", { name: `${key} marker 1`, exact: true });
    await first.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await example.getByRole("button", { name: mode === "Automatic" ? "Supply automatic sample records" : "Add local marker", exact: true }).click();
    const second = example.getByRole("button", { name: `${key} marker 2`, exact: true });
    await example.getByLabel("Refuse local checkpoint selection").check();
    await second.press("Space");
    await expect(second).toHaveAttribute("aria-pressed", "false");
    await expect(example.getByLabel("Local checkpoint selection", { exact: true })).toHaveText(`${key}: ${key} marker 1`);
    await expect(example.getByLabel("Local checkpoint request", { exact: true })).toHaveText(`Refused local selection: ${key} marker 2. No runtime action.`);
    await example.getByLabel("Refuse local checkpoint selection").uncheck();
    await second.click();
    await expect(second).toHaveAttribute("aria-pressed", "true");
    const draft = example.getByRole("textbox");
    await draft.fill(`${key} retained draft`);
    if (mode === "Branching") {
      await example.getByRole("button", { name: "Alternative", exact: true }).click();
      await expect(draft).toHaveValue("Alternative draft");
      await expect(example.getByLabel("Local checkpoint selection", { exact: true })).toHaveText("Alternative: None selected");
      await draft.fill("Alternative independent draft");
      await example.getByRole("button", { name: "Main", exact: true }).click();
    } else {
      if (mode === "Automatic") await expect(example.getByRole("button", { name: "Supply automatic sample records" })).toBeDisabled();
      await example.getByRole("button", { name: mode === "Manual" ? "Automatic" : "Manual", exact: true }).click();
      await example.getByRole("button", { name: mode, exact: true }).click();
    }
    await expect(draft).toHaveValue(`${key} retained draft`);
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Host sample state").selectOption("loading");
    await expect(second).toHaveCount(0);
    await page.getByLabel("Host sample state").selectOption("ready");
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(draft).toHaveValue(`${key} retained draft`);
    await expect(example.getByText(/do not save or restore runtime history/)).toBeVisible();
    expect(requests).toEqual([]);
  });
}
