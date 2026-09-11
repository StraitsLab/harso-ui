import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (process.env.HARSO_SABOTAGE_SPEECH_CLEANUP === "1") await page.route("**/native-speech-examples.tsx*", async route => {
    const response = await route.fetch();
    const original = await response.text();
    const body = original.replace("return release;", "return () => {};");
    expect(body).not.toBe(original);
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    const calls: string[] = [];
    let current: SpeechSynthesisUtterance | null = null;
    class Utterance { constructor(public text: string) {} }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utterance, configurable: true });
    const synth = new EventTarget();
    Object.assign(synth, {
      getVoices: () => [{ localService: true, lang: "en-US", name: "Local test voice" }],
      speak: (utterance: SpeechSynthesisUtterance) => { current = utterance; calls.push(utterance.text); },
      cancel: () => { calls.push("cancel"); current = null; },
    });
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    Object.assign(window, { speechCalls: calls, failSpeech: () => current?.onerror?.({ error: "audio-busy" } as SpeechSynthesisErrorEvent), saveSpeechEnd: () => current?.onend });
  });
});

for (const transition of ["view", "disabled", "unmount"]) test(`read aloud cancels on ${transition}`, async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  if (transition === "view") await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  if (transition === "disabled") await page.getByRole("combobox", { name: "Starter state" }).selectOption("disabled");
  if (transition === "unmount") await page.getByRole("button", { name: "Speech Input V Initial implementation", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { speechCalls: string[] }).speechCalls)).toHaveLength(2);
});

test("stale utterance completion cannot clear a newer reading", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await page.evaluate(() => {
    const browser = window as unknown as { saveSpeechEnd: () => () => void; lateEnd: () => void };
    browser.lateEnd = browser.saveSpeechEnd();
  });
  await page.getByRole("button", { name: "Stop reading", exact: true }).click();
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await page.evaluate(() => (window as unknown as { lateEnd: () => void }).lateEnd());
  await expect(page.getByRole("button", { name: "Stop reading", exact: true })).toBeVisible();
});

for (const failure of ["unsupported", "startup"]) test(`read aloud reports ${failure} failure`, async ({ page }) => {
  await page.addInitScript(failure => {
    if (failure === "unsupported") Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
    else window.speechSynthesis.speak = () => { throw new Error("Output unavailable"); };
  }, failure);
  await page.goto("/#boardui:chat-starter");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(/unavailable/i);
  await expect(page.getByRole("button", { name: "Read aloud", exact: true })).toBeVisible();
});

test("local read aloud honors refusal, stops, and cancels across conversation/team boundaries", async ({ page }) => {
  await page.goto("/#boardui:chat-starter");
  const read = page.getByRole("button", { name: "Read aloud", exact: true });
  await page.getByLabel("Hold host state").check();
  await read.click();
  expect(await page.evaluate(() => (window as unknown as { speechCalls: string[] }).speechCalls)).toEqual([]);
  await page.getByLabel("Hold host state").uncheck();
  await read.click();
  await expect(page.getByRole("button", { name: "Stop reading", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Personal ideas Unread", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { speechCalls: string[] }).speechCalls)).toHaveLength(2);
  await read.click();
  await page.getByRole("button", { name: "Personal team", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Studio", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { speechCalls: string[] }).speechCalls)).toHaveLength(4);
  await read.click();
  await page.evaluate(() => (window as unknown as { failSpeech: () => void }).failSpeech());
  await expect(page.getByRole("alert")).toContainText("audio-busy");
  await read.click();
  await page.getByRole("button", { name: "Stop reading", exact: true }).click();
  await expect(read).toBeVisible();
});

test("no remote voice fallback", async ({ page }) => {
  await page.addInitScript(() => { window.speechSynthesis.getVoices = () => [{ localService: false, lang: "en-US" } as SpeechSynthesisVoice]; });
  await page.goto("/#boardui:chat-starter");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("local voice");
  expect(await page.evaluate(() => (window as unknown as { speechCalls: string[] }).speechCalls)).toEqual([]);
});

test("native transcription callback is visible and clearable, not a provider simulation", async ({ page }) => {
  await page.addInitScript(() => {
    class Recognition {
      onstart?: () => void;
      onresult?: (event: unknown) => void;
      start() { this.onstart?.(); this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: "Dummy spoken phrase" }], { isFinal: true })] }); }
      abort() {}
      stop() {}
    }
    Object.assign(window, { SpeechRecognition: Recognition });
  });
  await page.goto("/#vercel:speech-input");
  await expect(page.getByText(/browser.*speech service/i)).toBeVisible();
  await page.getByRole("button", { name: "Start speech input", exact: true }).click();
  await expect(page.getByRole("status", { name: "Speech transcript" })).toContainText("Dummy spoken phrase");
  await page.getByRole("button", { name: "Clear transcript" }).click();
  await expect(page.getByRole("status", { name: "Speech transcript" })).not.toContainText("Dummy spoken phrase");
});
