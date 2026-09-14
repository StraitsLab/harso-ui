import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The gallery now demonstrates sign-in. Mount the carousel explicitly so its
// keyboard/forced-color contract remains tested independently of gallery choice.
test.beforeEach(async ({ page }) => {
  await page.goto("/#boardui:auth-card");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl && domUrl && producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { AuthCard, AuthMediaCarousel } = await import(`${producerUrl}misc-surfaces.tsx`);
    const node = document.createElement("div");
    node.style.cssText = "width:100%;min-width:0";
    node.className = "hkl-live-example";
    document.querySelector('[data-testid="live-example"]')!.before(node);
    createRoot(node).render(React.createElement(AuthCard, { title: "Authentication media example", style: { padding: 0, minWidth: 0, maxWidth: "100%" } },
      React.createElement(AuthMediaCarousel, null,
        React.createElement("label", null, "Workspace name", React.createElement("input", { type: "text" })),
        React.createElement("p", null, "A quiet surface for live progress and results."),
        React.createElement("p", null, "Your data stays scoped to your workspace."))));
  }, { reactUrl, domUrl, producerUrl });
});

for (const appearance of ["light", "dark"]) {
  for (const palette of ["clean", "cozy"]) {
    for (const width of [1512, 390]) {
      test(`authentication carousel: ${appearance}/${palette} at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1040 });
        // beforeEach mounted the explicit carousel consumer.
        await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
        await page.getByLabel("Palette", { exact: true }).selectOption(palette);
        const carousel = page.getByRole("region", { name: "Authentication media" });
        const workspace = carousel.getByRole("textbox", { name: "Workspace name" });
        await workspace.fill("Example workspace");
        await workspace.press("Home");
        await workspace.press("ArrowRight");
        await expect(workspace).toBeVisible();
        await expect(workspace).toBeFocused();
        await expect(workspace).toHaveValue("Example workspace");
        await carousel.focus();
        await carousel.press("End");
        await expect(carousel.getByText("Your data stays scoped to your workspace.")).toBeVisible();
        await carousel.press("Home");
        await expect(workspace).toBeVisible();
        for (const indicator of await carousel.getByRole("button", { name: /Show media/ }).all()) {
          const bounds = await indicator.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(24);
          expect(bounds?.height).toBeGreaterThanOrEqual(24);
        }
        const third = carousel.getByRole("button", { name: "Show media 3" });
        await third.focus();
        await third.press("Enter");
        await expect(third).toHaveAttribute("aria-current", "true");
        await expect(third).toHaveCSS("outline-style", "solid");
        expect(await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, outside: [...document.querySelectorAll(".hk-auth-card, .hk-auth-card *")].filter(e => e.getBoundingClientRect().right > innerWidth).map(e => ({ tag: e.tagName, cls: e.className, width: e.getBoundingClientRect().width, right: e.getBoundingClientRect().right })) }))).toEqual({ width, scroll: width, outside: [] });
        expect((await new AxeBuilder({ page }).include(".hk-auth-card").analyze()).violations).toEqual([]);
        await page.getByTestId("live-example").screenshot({ path: testInfo.outputPath("auth-carousel.png") });
      });
    }
  }
}

test("authentication carousel retains visible controls in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const indicator = page.getByRole("button", { name: "Show media 2" });
  await indicator.focus();
  await indicator.press("Enter");
  await expect(indicator).toHaveAttribute("aria-current", "true");
  await expect(indicator).toHaveCSS("outline-style", "solid");
  await expect(page.getByText("A quiet surface for live progress and results.")).toBeVisible();
});
