import { expect, test, type Page } from "@playwright/test";

async function localSpeechEvents(page: Page) {
  await page.addInitScript(() => {
    const probe = { recognition: null as any, recorder: null as any, mediaRequests: 0, releasedTracks: 0, complete: null as null | ((text: string) => void) };
    Object.assign(window, { visualSpeech: probe });
    class Recognition {
      continuous = false; interimResults = false; lang = "";
      onstart: any = null; onend: any = null; onerror: any = null; onresult: any = null;
      start() { probe.recognition = this; }
      stop() { this.onend?.(); }
      abort() {}
    }
    class Recorder {
      state = "inactive"; mimeType = "audio/webm";
      onstart: any = null; onstop: any = null; onerror: any = null; ondataavailable: any = null;
      constructor() { probe.recorder = this; }
      start() { this.state = "recording"; this.onstart?.(); }
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["local visual fixture"], { type: this.mimeType }) }); this.onstop?.(); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: Recognition });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: Recorder });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => {
      probe.mediaRequests++;
      return { getTracks: () => [{ stop: () => { probe.releasedTracks++; } }] };
    } } });
  });
}

async function mountSpeechStates(page: Page) {
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { SpeechInput } = await import(`${producerUrl}speech-input.tsx`);
    const element = React.createElement;
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element("section", { "aria-label": "Speech visual states", style: { padding: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", maxWidth: 960 } },
      ...["Idle", "Requesting", "Listening", "Processing", "Disabled", "Error"].map(label => element("section", { key: label, "aria-label": label, style: { minWidth: 0, padding: 12, border: "1px solid var(--hk-line)", borderRadius: 12 } },
        element("h3", null, label), element(SpeechInput, { "aria-label": `${label} speech`, disabled: label === "Disabled",
          ...(label === "Processing" ? { onAudioRecorded: () => new Promise<string>(resolve => { (window as any).visualSpeech.complete = resolve; }) } : {}),
        })))));
  }, { reactUrl, domUrl, producerUrl });
  return page.getByRole("region", { name: "Speech visual states", exact: true });
}

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`INPUT VISUAL ${appearance} ${palette} ${width} current prompt and mocked speech states`, async ({ page }, testInfo) => {
    const mutation = process.env.INPUT_VISUAL_MUTATION;
    if (mutation === "reference") await page.route("**/consumer-readiness-examples.tsx*", async route => {
      const response = await route.fetch();
      const body = await response.text();
      expect(body).toContain("referencedSources.add(source)");
      await route.fulfill({ response, body: body.replace("referencedSources.add(source)", "undefined") });
    });
    if (mutation === "accent") await page.route("**/primitives.css*", async route => {
      const response = await route.fetch();
      const body = await response.text();
      expect(body).toContain("background: var(--hk-accent); color: var(--hk-inverse); animation: hk-speech-pulse");
      await route.fulfill({ response, body: body.replace("background: var(--hk-accent); color: var(--hk-inverse); animation: hk-speech-pulse", "background: transparent; color: var(--hk-inverse); animation: hk-speech-pulse") });
    });
    await localSpeechEvents(page);
    await page.setViewportSize({ width, height: 1050 });
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: appearance });
    const externalRequests: string[] = [];
    page.on("request", request => { if (new URL(request.url()).origin !== new URL(test.info().project.use.baseURL!).origin && !request.url().startsWith("data:")) externalRequests.push(request.url()); });
    await page.goto("/#vercel:prompt-input");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const prompt = page.getByTestId("live-example");
    await prompt.getByRole("textbox", { name: "Prompt", exact: true }).fill("Review the supplied project brief.\nKeep this draft local.");
    await expect(prompt.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
    await expect(prompt.getByRole("tab", { name: "brief.md", exact: true })).toHaveAttribute("aria-selected", "true");
    await prompt.getByRole("tab", { name: "notes.md", exact: true }).click();
    await expect(prompt.getByRole("tabpanel")).toContainText("Keep review comments concise");
    await prompt.getByRole("button", { name: "Project rules", exact: true }).focus();
    await expect(prompt.getByText("Use existing kit controls. Never read workspace files.", { exact: true })).toBeVisible();
    await prompt.getByRole("button", { name: "Project rules", exact: true }).press("Escape");
    const search = prompt.getByRole("combobox", { name: "Find supplied context" });
    await search.fill("no-such-context");
    await expect(prompt.getByText("No supplied context matches.", { exact: true })).toBeVisible();
    await search.fill("brief");
    await search.press("ArrowDown");
    await search.press("Enter");
    const references = prompt.getByRole("list", { name: "Selected context" });
    await expect(references).toContainText("brief.md");
    await search.press("Enter");
    await expect(references.getByRole("listitem")).toHaveCount(1);
    await prompt.getByLabel("Hold prompt changes").check();
    await prompt.getByRole("button", { name: "Remove context brief.md" }).click();
    await expect(references.getByRole("listitem")).toHaveCount(1);
    await prompt.getByLabel("Hold prompt changes").uncheck();
    await prompt.getByLabel("Disable prompt").check();
    await expect(search).toBeDisabled();
    await expect(prompt.getByRole("tab", { name: "brief.md", exact: true })).toBeDisabled();
    await prompt.getByLabel("Disable prompt").uncheck();
    await expect(prompt.getByRole("tab", { name: "notes.md", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(prompt.getByRole("textbox", { name: "Prompt", exact: true })).toHaveValue("Review the supplied project brief.\nKeep this draft local.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await prompt.screenshot({ path: testInfo.outputPath("current-prompt-gallery.png") });
    await prompt.getByRole("button", { name: "Send", exact: true }).click();
    await expect(prompt.getByLabel("Prompt result")).toContainText("Context: brief.md");
    await expect(references.getByRole("listitem")).toHaveCount(1);
    await prompt.getByRole("button", { name: "Remove context brief.md" }).click();
    await expect(prompt.getByText("No context selected.", { exact: true })).toBeVisible();
    await page.goto("/#vercel:speech-input");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const gallery = page.getByTestId("live-example");
    const galleryButton = gallery.getByRole("button", { name: "Start speech input" });
    await expect(galleryButton).toHaveText("Speak");
    await galleryButton.click();
    await expect(galleryButton).toHaveText("Requesting microphone…");
    await expect(galleryButton).toHaveAttribute("aria-busy", "true");
    await page.evaluate(() => (window as any).visualSpeech.recognition.onstart());
    await expect(gallery.getByRole("button", { name: "Stop speech input" })).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => (window as any).visualSpeech.recognition.onerror({ error: "local-visual-fixture" }));
    await expect(gallery.getByRole("alert")).toHaveText("Speech input failed: local-visual-fixture");
    await galleryButton.click();
    await expect(gallery.getByRole("alert")).toHaveCount(0);
    await page.evaluate(() => { const recognition = (window as any).visualSpeech.recognition; recognition.onstart(); recognition.onend(); });
    await expect(galleryButton).toHaveText("Speak");
    const host = await mountSpeechStates(page);
    const idle = host.getByRole("button", { name: "Idle speech" });
    const requesting = host.getByRole("button", { name: "Requesting speech" });
    const listening = host.getByRole("button", { name: "Listening speech" });
    const processing = host.getByRole("button", { name: "Processing speech" });
    const disabled = host.getByRole("button", { name: "Disabled speech" });
    const error = host.getByRole("button", { name: "Error speech" });
    await requesting.click();
    await listening.click();
    await page.evaluate(() => (window as any).visualSpeech.recognition.onstart());
    await processing.click();
    await expect(processing).toHaveText("Stop");
    await processing.click();
    await expect(processing).toHaveText("Transcribing…");
    await error.click();
    await page.evaluate(() => (window as any).visualSpeech.recognition.onerror({ error: "local-visual-fixture" }));
    await expect(idle).toHaveText("Speak");
    await expect(idle).toBeEnabled();
    await expect(idle).toHaveAttribute("aria-pressed", "false");
    await expect(requesting).toHaveText("Requesting microphone…");
    for (const pending of [requesting, processing]) {
      await expect(pending).toBeDisabled();
      await expect(pending).toHaveAttribute("aria-busy", "true");
      await expect(pending.locator(".hk-spinner")).toBeVisible();
    }
    await expect(listening).toHaveText("Stop");
    await expect(listening).toHaveAttribute("aria-pressed", "true");
    await expect(listening).toHaveCSS("animation-name", "hk-speech-pulse");
    expect.soft(await listening.evaluate(button => getComputedStyle(button).backgroundColor), "Listening must retain its accent background rather than the idle transparent background").not.toEqual(await idle.evaluate(button => getComputedStyle(button).backgroundColor));
    const colors = await listening.evaluate(button => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--hk-accent)";
      probe.style.color = "var(--hk-inverse)";
      button.append(probe);
      const computed = getComputedStyle(probe);
      const values = { background: computed.backgroundColor, foreground: computed.color };
      probe.remove();
      return values;
    });
    await page.mouse.move(0, 0);
    await expect(listening).toHaveCSS("background-color", colors.background);
    await expect(listening).toHaveCSS("color", colors.foreground);
    await listening.hover();
    await expect(listening).toHaveCSS("background-color", colors.background);
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveCSS("animation-name", "none");
    await expect(disabled).not.toHaveAttribute("aria-busy", "true");
    await expect(error).toHaveAttribute("aria-describedby", /.+/);
    await expect(host.getByRole("alert")).toHaveText("Speech input failed: local-visual-fixture");
    expect(await host.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const card of await host.locator(":scope > section").all()) expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await host.screenshot({ path: testInfo.outputPath("speech-visual-states.png") });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(listening).toHaveCSS("animation-name", "none");
    await page.evaluate(() => (window as any).visualSpeech.complete("Local fixture text only"));
    await expect(processing).toHaveText("Speak");
    await expect(processing).toBeEnabled();
    await expect(processing.locator(".hk-spinner")).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).visualSpeech.mediaRequests)).toBe(1);
    expect(externalRequests).toEqual([]);
  });
}

test("INPUT VISUAL actual gallery unavailable state never requests native permission", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => { throw new Error("Native permission must not be requested"); } } });
  });
  await page.goto("/#vercel:speech-input");
  const gallery = page.getByTestId("live-example");
  const button = gallery.getByRole("button", { name: "Start speech input" });
  await expect(button).toHaveText("Speak");
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button.locator(".hk-spinner")).toHaveCount(0);
  await gallery.screenshot({ path: testInfo.outputPath("speech-unavailable.png") });
});
