import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { writes: [] as string[], spoken: [] as string[], cancels: 0, reject: () => {}, resolve: () => {} };
    Object.assign(window, { starterActions: probe });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => {
      probe.writes.push(text);
      return new Promise<void>((resolve, reject) => { probe.resolve = resolve; probe.reject = () => reject(new Error("Local adapter denied")); });
    } } });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: (utterance: { text: string }) => probe.spoken.push(utterance.text), cancel: () => { probe.cancels++; } } });
  });
  await page.goto("/#boardui:chat-starter");
});

test("starter copies supplied assistant text on request, bounds pending reentry and recovers from adapter rejection", async ({ page }) => {
  const message = page.getByRole("log").getByRole("article").first();
  const copy = message.getByRole("button", { name: "Copy assistant message", exact: true });
  const text = await message.locator(".hk-message-response").innerText();
  expect(await page.evaluate(() => (window as any).starterActions.writes)).toEqual([]);
  await copy.focus(); await copy.press("Enter");
  await expect(copy).toBeDisabled();
  await expect(copy).toHaveAttribute("aria-busy", "true");
  await copy.click({ force: true });
  expect(await page.evaluate(() => (window as any).starterActions.writes)).toEqual([text]);
  await page.evaluate(() => (window as any).starterActions.reject());
  await expect(message.getByRole("status")).toHaveText("Copy failed");
  await expect(copy).toBeEnabled();
  await copy.click();
  await page.evaluate(() => (window as any).starterActions.resolve());
  await expect(message.getByRole("status")).toHaveText("Copied");
  expect(await page.evaluate(() => (window as any).starterActions.writes)).toEqual([text, text]);
});

test("starter host refusal and disabled state prevent clipboard invocation", async ({ page }) => {
  const copy = page.getByRole("button", { name: "Copy assistant message", exact: true });
  await page.getByLabel("Hold host state", { exact: true }).check();
  await copy.click();
  await expect(page.getByLabel("Starter request", { exact: true })).toContainText("host retained state");
  expect(await page.evaluate(() => (window as any).starterActions.writes)).toEqual([]);
  await page.getByLabel("Hold host state", { exact: true }).uncheck();
  await page.getByLabel("Starter state", { exact: true }).selectOption("disabled");
  await expect(copy).toBeDisabled();
  await copy.click({ force: true });
  expect(await page.evaluate(() => (window as any).starterActions.writes)).toEqual([]);
  await page.getByLabel("Starter state", { exact: true }).selectOption("ready");
  await expect(copy).toBeEnabled();
});
