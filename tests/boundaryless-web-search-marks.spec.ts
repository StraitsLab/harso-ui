import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`web-search marks visibly lift on hover and keyboard focus at ${width}px`, async ({ page, context }) => {
    const externalRequests: string[] = [];
    await context.route("**/*", route => {
      if (new URL(route.request().url()).hostname === "127.0.0.1") return route.continue();
      externalRequests.push(route.request().url());
      return route.abort();
    });
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#boardui:web-search");
    const example = page.getByLabel("Agent trails example");
    await example.getByRole("button", { name: "Restart trail" }).click(); // the fixture opens populated; step from zero
    for (let event = 0; event < 3; event++) await example.getByRole("button", { name: "Advance event" }).click();
    const marks = example.locator(".hk-trail-marks .hk-trail-source");
    await expect(marks).toHaveCount(6);
    const github = example.getByRole("link", { name: "Accessible theme patterns · github.com" });
    await expect(github.locator('[data-brand="github"] svg')).toBeVisible();
    await expect(github.locator(".hk-trail-site-mark")).toHaveAttribute("aria-hidden", "true");
    await expect(github).toHaveAttribute("title", "Accessible theme patterns · github.com");
    const fallback = example.getByRole("link", { name: "A public reference · example.com" });
    await expect(fallback.locator(".hk-trail-site-mark svg")).toBeVisible();
    await expect(fallback.locator(".hk-trail-site-mark")).not.toHaveAttribute("data-brand");
    await github.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const resting = (await github.boundingBox())!;
    await github.hover();
    await expect.poll(() => github.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(-3);
    await expect(github).toHaveCSS("z-index", "1");
    expect((await github.boundingBox())!.y).toBeCloseTo(resting.y - 3, 1);
    await page.mouse.move(0, 0);
    await expect.poll(() => github.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
    await github.focus();
    await page.keyboard.press("Tab");
    const reddit = example.getByRole("link", { name: "Design systems discussion · www.reddit.com" });
    await expect(reddit).toBeFocused();
    await expect.poll(() => reddit.evaluate(element => element.matches(":focus-visible"))).toBe(true);
    await expect(reddit).toHaveCSS("outline-style", "solid");
    await expect(reddit).toHaveCSS("outline-width", "2px");
    await expect.poll(() => reddit.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(-3);
    await page.keyboard.press("Tab");
    await expect(example.getByRole("link", { name: "Design notes · x.com" })).toBeFocused();
    await expect(example.getByRole("link", { name: "Teams sharing their process · www.linkedin.com" })).toHaveAttribute("tabindex", "-1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(externalRequests).toEqual([]);
  });
}

test("web-search marks activate native safe links while missing, unsafe and disabled destinations stay inert", async ({ page, context }) => {
  const destinations: string[] = [];
  const dialogs: string[] = [];
  await context.route("**/*", route => {
    const request = route.request();
    if (new URL(request.url()).hostname === "127.0.0.1") return route.continue();
    if (request.isNavigationRequest()) destinations.push(request.url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Local link proof</title><p>Intercepted locally; no remote site contacted.</p>" });
  });
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto("/#boardui:web-search");
  const example = page.getByLabel("Agent trails example");
  await example.getByRole("button", { name: "Restart trail" }).click(); // the fixture opens populated; step from zero
  for (let event = 0; event < 3; event++) await example.getByRole("button", { name: "Advance event" }).click();
  const originalUrl = page.url();
  const github = example.getByRole("link", { name: "Accessible theme patterns · github.com" });
  await expect(github).toHaveAttribute("href", "https://github.com/");
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noreferrer noopener");
  await expect(github).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(destinations).toEqual([]);
  for (const keyboard of [false, true]) {
    const popupEvent = context.waitForEvent("page");
    if (keyboard) { await github.focus(); await page.keyboard.press("Enter"); } else await github.click();
    const popup = await popupEvent;
    await popup.waitForURL("https://github.com/");
    await expect(popup.getByText("Intercepted locally; no remote site contacted.")).toBeVisible();
    expect(await popup.evaluate(() => window.opener === null && document.referrer === "")).toBe(true);
    await popup.close();
    expect(page.url()).toBe(originalUrl);
  }
  expect(destinations).toEqual(["https://github.com/", "https://github.com/"]);
  const summary = example.locator(".hk-trail-overflow summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(example.getByRole("link", { name: "Additional reference · example.net" })).toBeVisible();
  for (const name of ["Teams sharing their process · www.linkedin.com", "Rejected unsafe URL · example.com"]) {
    const mark = example.getByRole("link", { name });
    await expect(mark).not.toHaveAttribute("href");
    await expect(mark).toHaveAttribute("aria-disabled", "true");
    await expect(mark).toHaveAttribute("tabindex", "-1");
    await mark.click({ force: true });
    await mark.focus();
    await page.keyboard.press("Enter");
  }
  await example.getByLabel("Disable trail").check();
  await expect(example.locator(".hk-trail-source[href]")).toHaveCount(0);
  await expect(github).toHaveAttribute("aria-disabled", "true");
  await expect(github).toHaveAttribute("tabindex", "-1");
  await github.click({ force: true });
  await github.focus();
  await page.keyboard.press("Enter");
  expect(destinations).toEqual(["https://github.com/", "https://github.com/"]);
  expect(dialogs).toEqual([]);
  expect(context.pages()).toHaveLength(1);
  expect(page.url()).toBe(originalUrl);
  await example.getByLabel("Disable trail").uncheck();
  await expect(github).toHaveAttribute("href", "https://github.com/");
  await expect(github).not.toHaveAttribute("aria-disabled");
});
