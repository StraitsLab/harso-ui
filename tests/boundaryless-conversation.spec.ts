import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("runtime transcript retains reader position across mounted disable and jumps to latest", async ({ page }) => {
  await page.goto("/#harso:chat-thread");
  await page.getByLabel("Thread state", { exact: true }).selectOption("long transcript");
  const viewport = page.locator(".hkc-thread-viewport");
  await expect(page.getByRole("article")).toHaveCount(40);
  const mounted = await viewport.elementHandle();
  await viewport.evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event("scroll")); });
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  const transcript = await page.getByRole("log").textContent();
  await page.getByLabel("Disable thread input", { exact: true }).check();
  await expect(page.getByRole("log")).toHaveText(transcript!);
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeLessThan(3);
  await page.getByLabel("Disable thread input", { exact: true }).uncheck();
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
  const jump = page.getByRole("button", { name: "Latest message", exact: true });
  await jump.focus(); await page.keyboard.press("Enter");
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(3);
  // Runtime scroll primitive may hide after reaching bottom; keyboard activation remains real.
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

test("runtime branches and feedback preserve draft ownership", async ({ page }) => {
  await page.goto("/#harso:chat-thread");
  await page.getByLabel("Thread state", { exact: true }).selectOption("branching");
  const draft = page.getByRole("textbox", { name: "Message", exact: true });
  await draft.fill("Keep these local notes");
  await expect(page.getByText("2 of 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Previous branch", exact: true }).click();
  await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("log")).toContainText("First branch: start with a focused launch.");
  await page.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect(page.getByRole("button", { name: "Helpful", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next branch", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Second branch: begin with an invitation.");
  await expect(draft).toHaveValue("Keep these local notes");
  await page.getByRole("button", { name: "Previous branch", exact: true }).click();
  await expect(page.getByRole("button", { name: "Helpful", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("shimmer respects static states, reduced motion, semantic elements and forced colors", async ({ page }) => {
  await page.goto("/#vercel:shimmer");
  const heading = page.getByRole("heading", { name: "Making room for the next idea." });
  await expect(heading).toHaveCSS("animation-name", "hk-text-shimmer");
  for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const paints = await heading.evaluate(element => {
      const style = getComputedStyle(element);
      const probe = document.createElement("span");
      element.append(probe);
      const colors = ["--hk-ink", "--hk-secondary"].map(token => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      });
      probe.remove();
      return { colors, gradient: style.backgroundImage, clip: style.backgroundClip, color: style.color };
    });
    expect(paints.clip).toBe("text");
    expect(paints.color).toBe("rgba(0, 0, 0, 0)");
    for (const color of paints.colors) expect(paints.gradient).toContain(color);
    await page.getByTestId("live-example").screenshot({ path: test.info().outputPath(`shimmer-${appearance}-${palette}.png`), animations: "disabled" });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(heading).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "no-preference" });
  await expect(heading).toHaveCSS("animation-name", "none");
  expect(await heading.evaluate(element => getComputedStyle(element).color)).not.toBe("rgba(0, 0, 0, 0)");
  await page.emulateMedia({ forcedColors: "none" });
  await page.getByRole("checkbox", { name: "Waiting state" }).uncheck();
  await expect(heading).toHaveCSS("animation-name", "none");
});

test("runtime Markdown rejects unsafe content without remote requests", async ({ page, baseURL }) => {
  const external: string[] = []; const dialogs: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  // Inject hostile text into the actual runtime Markdown fixture, not a removed module.
  await page.route("**/chat-markdown-example.tsx*", async route => {
    const response = await route.fetch();
    const source = await response.text();
    const body = source.replace("# A calmer space to build", "# A calmer space to build\\n\\n<script>alert('unsafe')</script>\\n\\n![Remote](https://invalid.example/image.png)\\n\\n[Unsafe](javascript:alert(1))");
    expect(body).not.toBe(source); await route.fulfill({ response, body });
  });
  await page.goto("/#harso:chat-markdown");
  const response = page.locator(".hkc-markdown").first();
  await expect(response).toBeVisible();
  await expect(response.locator("img,script,iframe")).toHaveCount(0);
  await expect(response.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(external).toEqual([]); expect(dialogs).toEqual([]);
});

test("runtime conversation retains keyboard branches and responsive palette readability", async ({ page }) => {
  for (const width of [375, 1024, 1440]) for (const mode of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
    await page.setViewportSize({ width, height: 860 });
    await page.goto("/#harso:chat-thread");
    await page.evaluate(({ mode, palette }) => { document.documentElement.dataset.mode = mode; document.documentElement.dataset.palette = palette; }, { mode, palette });
    await page.getByLabel("Thread state", { exact: true }).selectOption("branching");
    await page.getByRole("button", { name: "Previous branch", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const scan = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
    expect(scan.violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`runtime-${width}-${mode}-${palette}.png`), animations: "disabled" });
  }
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("button", { name: "Next branch", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("2 of 2", { exact: true })).toBeVisible();
});
