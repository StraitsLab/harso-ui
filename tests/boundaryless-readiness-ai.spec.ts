import { expect, test } from "@playwright/test";

test("actual PromptInput parts compose native selection, action menu, tooltip and submission", async ({ page, request }) => {
  await page.goto("/#vercel:prompt-input");
  const entry = await (await request.get("/preview/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]+\/react\.js\?[^\"]+)"/)?.[1];
  const domUrl = entry.match(/from "([^"]+\/react-dom_client\.js\?[^\"]+)"/)?.[1];
  const producerUrl = entry.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const Prompt = await import(`${producerUrl}prompt-input.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [model, setModel] = React.useState("balanced");
      const [hold, setHold] = React.useState(true);
      const [draft, setDraft] = React.useState("");
      const [result, setResult] = React.useState("");
      return element("section", { "aria-label": "Readiness prompt fixture" },
        element("label", null, element("input", { type: "checkbox", checked: hold, onChange: (event: Event) => setHold((event.target as HTMLInputElement).checked) }), "Hold prompt host"),
        element(Prompt.PromptInput, { value: draft, onValueChange: setDraft, onSubmit: (value: string) => setResult(`Submitted ${model}: ${value}`) },
          element(Prompt.PromptInputHeader, null, "Local prompt composition"),
          element(Prompt.PromptInputBody, null, element(Prompt.PromptInputTextarea, { "aria-label": "Readiness draft" })),
          element(Prompt.PromptInputFooter, null,
            element(Prompt.PromptInputTools, null,
              element(Prompt.PromptInputSelect, { label: "Readiness model", value: model, onValueChange: (value: string) => { setResult(`Requested ${value}`); if (!hold) setModel(value); } },
                element(Prompt.PromptInputSelectTrigger, null, element(Prompt.PromptInputSelectValue)),
                element(Prompt.PromptInputSelectContent, null,
                  element(Prompt.PromptInputSelectItem, { value: "balanced" }, "Balanced"),
                  element(Prompt.PromptInputSelectItem, { value: "unavailable", disabled: true }, "Unavailable"),
                  element(Prompt.PromptInputSelectItem, { value: "fast" }, "Fast"))),
              element(Prompt.PromptInputActionMenu, { label: "Readiness actions" },
                element(Prompt.PromptInputActionMenuTrigger, null, "Prompt actions"),
                element(Prompt.PromptInputActionMenuContent, null,
                  element(Prompt.PromptInputActionMenuItem, { onSelect: () => setDraft("Explain the queue") }, "Insert example"))),
              element(Prompt.PromptInputButton, { tooltip: "Clear the local draft", onClick: () => setDraft("") }, "Clear draft")),
            element(Prompt.PromptInputSubmit))),
        element("output", { "aria-label": "Readiness prompt result" }, result));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl });
  const fixture = page.getByRole("region", { name: "Readiness prompt fixture" });
  const result = fixture.getByLabel("Readiness prompt result");
  await fixture.getByRole("button", { name: "balanced", exact: true }).click();
  await expect(fixture.getByRole("menu", { name: "Readiness model" })).toBeVisible();
  await expect(fixture.getByRole("menuitemradio", { name: "Balanced", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(fixture.getByRole("menuitemradio", { name: "Unavailable" })).toBeDisabled();
  await fixture.getByRole("menuitemradio", { name: "Fast", exact: true }).click();
  await expect(result).toHaveText("Requested fast");
  await expect(fixture.getByRole("button", { name: "balanced", exact: true })).toBeVisible();
  await fixture.getByLabel("Hold prompt host").uncheck();
  await fixture.getByRole("button", { name: "balanced", exact: true }).click();
  await fixture.getByRole("menuitemradio", { name: "Fast", exact: true }).click();
  await expect(fixture.getByRole("button", { name: "fast", exact: true })).toBeVisible();
  await fixture.getByRole("button", { name: "Prompt actions", exact: true }).click();
  await expect(fixture.getByRole("menu", { name: "Readiness actions" })).toBeVisible();
  await fixture.getByRole("menuitem", { name: "Insert example" }).click();
  await expect(fixture.getByRole("textbox", { name: "Readiness draft" })).toHaveValue("Explain the queue");
  await fixture.getByRole("button", { name: "Send", exact: true }).click();
  await expect(result).toHaveText("Submitted fast: Explain the queue");
  await fixture.getByRole("button", { name: "Clear draft" }).hover();
  await expect(page.getByRole("tooltip", { name: "Clear the local draft" })).toBeVisible();
  await fixture.getByRole("button", { name: "Clear draft" }).click();
  await expect(fixture.getByRole("textbox", { name: "Readiness draft" })).toHaveValue("");
  await expect(fixture.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
});

test("image estimates advance only from host updates and reveal uses a real CSS mask animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:ai-image-generation");
  const workspace = page.locator(".hk-image-workspace");
  await workspace.getByRole("textbox", { name: "Describe your image" }).fill("Readiness horizon");
  await workspace.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect(workspace.getByText("Estimated 12 seconds remaining")).toBeVisible();
  const ripple = workspace.locator(".hk-image-generation-ripple");
  await expect(ripple).toBeVisible();
  expect(await ripple.evaluate(element => getComputedStyle(element).animationName)).toBe("hk-image-ripple");
  await page.getByRole("button", { name: "Advance image update" }).click();
  await expect(workspace.getByText("Estimated 8 seconds remaining")).toBeVisible();
  await page.getByRole("button", { name: "Advance image update" }).click();
  await expect(workspace.getByText("Estimated 4 seconds remaining")).toBeVisible();
  await page.getByLabel("Hold image host state").check();
  await page.getByRole("button", { name: "Advance image update" }).click();
  await expect(workspace.getByText("Estimated 4 seconds remaining")).toBeVisible();
  await page.getByLabel("Hold image host state").uncheck();
  await page.getByRole("button", { name: "Advance image update" }).click();
  const image = workspace.locator(".hk-image-generation-frame > img");
  const reveal = await image.evaluate(element => {
    const animation = element.getAnimations().find(animation => (animation as CSSAnimation).animationName === "hk-image-reveal")!;
    animation.pause();
    animation.currentTime = 0;
    const start = getComputedStyle(element).clipPath;
    animation.currentTime = 175;
    const middle = getComputedStyle(element).clipPath;
    animation.currentTime = 350;
    const end = getComputedStyle(element).clipPath;
    animation.play();
    return { start, middle, end };
  });
  expect(reveal.start).toBe("inset(0px 0px 100%)");
  expect(reveal.middle).not.toBe(reveal.start);
  expect(reveal.middle).not.toBe(reveal.end);
  expect(reveal.end).toBe("none");
  await expect(image).toBeVisible();
  await expect(workspace.getByText(/Estimated \d+ seconds remaining/)).toHaveCount(0);
  await expect(workspace.locator(".hk-image-generation-frame")).toHaveAttribute("data-state", "complete");
  expect(await image.evaluate(element => getComputedStyle(element).animationName)).toBe("hk-image-reveal");
  expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await image.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
});

test("image clipboard confirms copied prompt and gallery actions download the local sample", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#boardui:ai-image-generation");
  const workspace = page.locator(".hk-image-workspace");
  await workspace.getByRole("button", { name: "Copy image prompt" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("A quiet horizon");
  await expect(workspace.locator(".hk-snippet").getByRole("status")).toHaveText("Copied");
  await workspace.getByRole("button", { name: "Gallery", exact: true }).click();
  const gallery = workspace.getByRole("dialog", { name: "Gallery", exact: true });
  await expect(gallery.getByRole("button", { name: /^Open / })).toHaveCount(4);
  const columns = await gallery.locator(".hk-image-gallery").evaluate(element => ({ columns: getComputedStyle(element).columnCount, avoid: [...element.children].every(child => getComputedStyle(child).breakInside === "avoid") }));
  expect(columns).toEqual({ columns: "2", avoid: true });
  await gallery.getByRole("button", { name: "Open Warm morning light" }).click();
  await expect(gallery).toHaveCount(0);
  await expect(workspace.locator(".hk-image-generation-frame figcaption")).toHaveText("Warm morning light");
  const source = await workspace.locator(".hk-image-generation-frame img").getAttribute("src");
  const downloadEvent = page.waitForEvent("download");
  await workspace.getByRole("button", { name: "Download image" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("harso-synthetic-sample-2.svg");
  expect(await download.failure()).toBeNull();
  const { readFile } = await import("node:fs/promises");
  expect(await readFile((await download.path())!, "utf8")).toBe(decodeURIComponent(source!.split(",")[1]));
  await workspace.getByRole("button", { name: "Gallery", exact: true }).click();
  await gallery.getByRole("button", { name: "Actions for A quiet horizon" }).click();
  await page.getByRole("menuitem", { name: "Reuse prompt", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Describe your image" })).toHaveValue("A quiet horizon");
});

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
