import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";

const wave = Buffer.alloc(44 + 32000);
wave.write("RIFF");
wave.writeUInt32LE(wave.length - 8, 4);
wave.write("WAVEfmt ", 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(8000, 24);
wave.writeUInt32LE(16000, 28);
wave.writeUInt16LE(2, 32);
wave.writeUInt16LE(16, 34);
wave.write("data", 36);
wave.writeUInt32LE(32000, 40);

async function mountAudio(page: Page, source: "speech" | "remote" | "invalid", appearance: string, palette: string) {
  await page.route("**/proof-audio.wav", route => {
    const range = route.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Number(range[2]) : wave.length - 1;
    return route.fulfill({ status: range ? 206 : 200, contentType: "audio/wav", body: wave.subarray(start, end + 1), headers: { "Accept-Ranges": "bytes", ...(range ? { "Content-Range": `bytes ${start}-${end}/${wave.length}` } : {}) } });
  });
  await page.goto("/#vercel:audio-player");
  const entry = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]*\/deps\/react\.js[^"]*)"/)?.[1];
  const domUrl = entry.match(/from "([^"]*\/deps\/react-dom_client\.js[^"]*)"/)?.[1];
  if (!reactUrl || !domUrl) throw new Error("The native audio proof requires the coordinated Vite dev server.");
  const moduleUrl = `/@fs/${resolve(import.meta.dirname, "../src/audio-player.tsx")}`;
  await page.evaluate(async ({ reactUrl, domUrl, moduleUrl, source, base64, appearance, palette }) => {
    const React = (await import(reactUrl)).default;
    const { createRoot } = (await import(domUrl)).default;
    const parts = await import(moduleUrl);
    document.getElementById("root")!.hidden = true;
    const fixture = document.createElement("main");
    fixture.className = "harso-kit";
    fixture.dataset.mode = appearance;
    fixture.dataset.palette = palette;
    fixture.dataset.testid = "native-audio-proof";
    fixture.style.cssText = "box-sizing:border-box;width:100%;max-width:720px;padding:24px;margin:auto";
    document.body.append(fixture);
    function Host() {
      const [sourceProps, setSourceProps] = React.useState(source === "remote" ? { src: "/proof-audio.wav" } : { data: { base64: source === "invalid" ? "bm90IGF1ZGlv" : base64, mediaType: "audio/wav" } });
      return React.createElement(React.Fragment, null,
        source === "invalid" && React.createElement("button", { onClick: () => setSourceProps({ src: "/proof-audio.wav" }) }, "Load valid local audio"),
        React.createElement(parts.AudioPlayer, null,
      React.createElement(parts.AudioPlayerElement, { ...sourceProps, preload: "auto" }),
      React.createElement(parts.AudioPlayerControlBar, { "aria-label": "Audio playback" },
        React.createElement(parts.AudioPlayerPlayButton),
        React.createElement(parts.AudioPlayerSeekBackwardButton, { seekOffset: 1 }),
        React.createElement(parts.AudioPlayerTimeDisplay),
        React.createElement(parts.AudioPlayerTimeRange),
        React.createElement(parts.AudioPlayerDurationDisplay),
        React.createElement(parts.AudioPlayerSeekForwardButton, { seekOffset: 1 }),
        React.createElement(parts.AudioPlayerMuteButton),
        React.createElement(parts.AudioPlayerVolumeRange))));
    }
    createRoot(fixture).render(React.createElement(Host));
  }, { reactUrl, domUrl, moduleUrl, source, base64: wave.toString("base64"), appearance, palette });
  return page.getByTestId("native-audio-proof");
}

for (const source of ["speech", "remote"] as const) {
  for (const appearance of ["light", "dark"]) {
    for (const palette of ["clean", "cozy"]) {
      for (const width of [390, 1440]) {
        test(`native audio ${source} ${appearance}/${palette}/${width}`, async ({ page }, testInfo) => {
          await page.setViewportSize({ width, height: 800 });
          const fixture = await mountAudio(page, source, appearance, palette);
          const audio = fixture.locator("audio");
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration)).toBe(2);
          await expect(fixture.getByRole("slider", { name: "Seek", exact: true })).toHaveAttribute("max", "2");
          await fixture.getByRole("button", { name: "Play", exact: true }).click();
          await expect(fixture.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0);
          await fixture.getByRole("button", { name: "Pause", exact: true }).click();
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
          await fixture.getByRole("button", { name: "Seek backward 1 seconds" }).click();
          await fixture.getByRole("button", { name: "Seek backward 1 seconds" }).click();
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBe(0);
          await fixture.getByRole("button", { name: "Seek forward 1 seconds" }).click();
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(1, 2);
          await fixture.getByRole("button", { name: "Mute", exact: true }).click();
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.muted)).toBe(true);
          const volume = fixture.getByRole("slider", { name: "Volume", exact: true });
          await volume.focus();
          await volume.press("ArrowLeft");
          await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.99);
          expect(await fixture.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
          expect((await new AxeBuilder({ page }).include('[data-testid="native-audio-proof"]').analyze()).violations).toEqual([]);
          await fixture.screenshot({ path: testInfo.outputPath("audio.png") });
        });
      }
    }
  }
}

for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`invalid audio preserves native error, fits and recovers ${appearance}/${palette}/${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 800 });
    const fixture = await mountAudio(page, "invalid", appearance, palette);
    const audio = fixture.locator("audio");
    const originalAudio = await audio.elementHandle();
    await expect(fixture.getByRole("alert")).toBeVisible();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => !!element.error)).toBe(true);
    const nativeError = await audio.evaluate((element: HTMLAudioElement) => element.error!.message);
    await expect(fixture.getByRole("alert")).toHaveText(nativeError);
    await expect(fixture.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
    const geometry = await fixture.locator(".hk-audio-player").evaluate(element => ({
      width: element.clientWidth, scrollWidth: element.scrollWidth,
      children: Array.from(element.children).map(child => ({ tag: child.tagName, role: child.getAttribute("role"), width: child.getBoundingClientRect().width, minWidth: getComputedStyle(child).minWidth, overflowWrap: getComputedStyle(child).overflowWrap }))
    }));
    await testInfo.attach("native-error-grid", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" });
    await fixture.screenshot({ path: testInfo.outputPath("native-error.png") });
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (appearance === "light" && palette === "clean" && width === 390) {
      const mutation = await page.addStyleTag({ content: '.hk-audio-player > [role="alert"] { overflow-wrap: normal !important; }' });
      expect(await fixture.locator(".hk-audio-player").evaluate(element => element.scrollWidth > element.clientWidth + 1)).toBe(true);
      await mutation.evaluate(element => element.parentNode?.removeChild(element));
      expect(await fixture.locator(".hk-audio-player").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    await fixture.getByRole("button", { name: "Load valid local audio" }).click();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration)).toBe(2);
    await expect(fixture.getByRole("alert")).toHaveCount(0);
    expect(await audio.evaluate((element: HTMLAudioElement) => element.error)).toBeNull();
    expect(await originalAudio!.evaluate(element => element === document.querySelector('[data-testid="native-audio-proof"] audio'))).toBe(true);
    await fixture.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0);
    await fixture.getByRole("button", { name: "Pause", exact: true }).click();
    expect(await fixture.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await fixture.screenshot({ path: testInfo.outputPath("recovered.png") });
  });
}
