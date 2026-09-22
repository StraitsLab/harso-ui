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
  test(`INPUT VISUAL ${appearance} ${palette} ${width} runtime composer and mocked speech states`, async ({ page }, testInfo) => {
    const mutation = process.env.INPUT_VISUAL_MUTATION;
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
    await page.goto("/#harso:chat-composer");
    await page.evaluate(({ appearance, palette }) => { const kit = document.querySelector<HTMLElement>(".harso-kit")!; kit.dataset.mode = appearance; kit.dataset.palette = palette; }, { appearance, palette });
    const prompt = page.getByTestId("composer-fixture");
    for (const state of ["empty", "typing", "disabled", "error", "with attachment", "refused submission"]) {
      await page.getByLabel("Composer state", { exact: true }).selectOption(state);
      const input = prompt.getByRole("textbox", { name: "Message", exact: true });
      if (state === "disabled") await expect(input).toBeDisabled();
      else await expect(input).toBeEnabled();
      if (state === "empty" || state === "disabled") await expect(prompt.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
      if (state === "error") await expect(prompt.getByRole("alert")).toBeVisible();
      if (state === "with attachment") await expect(prompt.getByText("requirements.md", { exact: true })).toBeVisible();
      if (state === "refused submission") {
        await input.fill("Review the supplied project brief.");
        await prompt.getByRole("button", { name: "Send", exact: true }).click();
        await expect(input).toHaveValue("Review the supplied project brief.");
        await expect(page.getByTestId("composer-host-result")).toContainText("Submission refused");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await prompt.screenshot({ path: testInfo.outputPath(`composer-${state}.png`) });
    }
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

test("INPUT VISUAL composer layout settles under a resting pointer and the touch target never resizes on hover", async ({ page }, testInfo) => {
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/#harso:chat-composer");
    await page.getByLabel("Composer state", { exact: true }).selectOption("refused submission");
    const prompt = page.getByTestId("composer-fixture");
    const input = prompt.getByRole("textbox", { name: "Message", exact: true });
    await input.fill("Review the supplied project brief.");
    const send = prompt.getByRole("button", { name: "Send", exact: true });

    // Invariant: the phone touch target is a stable box; hover restyles it, never resizes it.
    await page.mouse.move(1, 1);
    await page.waitForTimeout(100);
    const idle = await send.boundingBox();
    await page.mouse.move(1, 1);

    // Derive a draft whose wrap decision differs between the hover-driven width estimates, if any remains.
    const estIdle = await page.evaluate(() => {
      const form = document.querySelector(".hkc-composer")!;
      const style = getComputedStyle(form);
      const controls = [...form.querySelectorAll<HTMLElement>(".hkc-composer-control")].filter(node => getComputedStyle(node).display !== "none");
      return form.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0") - controls.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) - controls.length * (parseFloat(style.columnGap) || 0);
    });
    await send.hover();
    await page.waitForTimeout(100);
    const estHover = await page.evaluate(() => {
      const form = document.querySelector(".hkc-composer")!;
      const style = getComputedStyle(form);
      const controls = [...form.querySelectorAll<HTMLElement>(".hkc-composer-control")].filter(node => getComputedStyle(node).display !== "none");
      return form.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0") - controls.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) - controls.length * (parseFloat(style.columnGap) || 0);
    });
    await page.mouse.move(1, 1);
    await page.waitForTimeout(100);
    const provocateur = await page.evaluate(({ lo, hi }) => {
      const form = document.querySelector(".hkc-composer")!;
      const input = form.querySelector("textarea")!;
      const inputStyle = getComputedStyle(input);
      const wraps = (text: string, w: number) => {
        const probe = input.cloneNode() as HTMLTextAreaElement;
        Object.assign(probe.style, { position: "fixed", visibility: "hidden", pointerEvents: "none", height: "0", minHeight: "0", maxHeight: "none", width: `${Math.max(1, w)}px`, font: inputStyle.font, lineHeight: inputStyle.lineHeight, padding: "0", border: "0", boxSizing: "border-box" });
        probe.removeAttribute("id");
        probe.value = text;
        document.body.append(probe);
        const wrapped = probe.scrollHeight > parseFloat(inputStyle.lineHeight) + 1;
        probe.remove();
        return wrapped;
      };
      const base = "Review the supplied project brief.";
      const candidates = [...Array.from({ length: 23 }, (_, i) => base.slice(0, 12 + i)), ...Array.from({ length: 6 }, (_, i) => base.slice(0, 22) + "x".repeat(i + 1))];
      return candidates.find(text => wraps(text, lo) !== wraps(text, hi)) ?? base;
    }, { lo: Math.min(estIdle, estHover), hi: Math.max(estIdle, estHover) });

    // Behavior: the compact/expanded state must settle under a resting pointer after the host
    // refuses submission — with the exact consumer draft and with the derived boundary draft.
    await input.fill("Review the supplied project brief.");
    await send.click();
    await expect(input).toHaveValue("Review the supplied project brief.");
    for (const draft of ["Review the supplied project brief.", provocateur]) {
      if (draft !== "Review the supplied project brief.") {
        await input.fill(draft);
        await expect(input).toHaveValue(draft);
      }
      const frames = await page.evaluate(async () => {
        const samples: (string | undefined | null)[] = [];
        for (let i = 0; i < 60; i++) {
          await new Promise(requestAnimationFrame);
          samples.push(document.querySelector(".hkc-composer")!.getAttribute("data-multiline"));
        }
        return samples;
      });
      expect(new Set(frames), `data-multiline must settle, not oscillate, at ${width}px (est ${Math.round(estIdle * 10) / 10}..${Math.round(estHover * 10) / 10}, draft ${JSON.stringify(draft)}, frames ${JSON.stringify(frames.filter((v, i) => v !== frames[i ? i - 1 : 0]).slice(0, 6))})`).toEqual(new Set([frames[0]]));
    }
    await prompt.screenshot({ path: testInfo.outputPath(`composer-settled-${width}.png`) });

    // Invariant: the touch target keeps its box across hover (the measured operand of the layout probe).
    await send.hover();
    await page.waitForTimeout(100);
    const hovered = await send.boundingBox();
    expect({ width: hovered!.width, height: hovered!.height }, `Send box must not resize on hover at ${width}px`).toEqual({ width: idle!.width, height: idle!.height });

    // Behavior preserved: explicit newline expands, clearing collapses.
    await input.fill("First\nSecond");
    await expect(prompt.locator(".hkc-composer")).toHaveAttribute("data-multiline", "true");
    await input.fill("");
    await expect(prompt.locator(".hkc-composer")).not.toHaveAttribute("data-multiline");
  }
});

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
