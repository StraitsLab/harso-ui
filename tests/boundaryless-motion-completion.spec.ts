import { test, expect, type Page, type Locator } from "@playwright/test";

async function box(locator: Locator) {
  const rectangle = await locator.boundingBox();
  expect(rectangle).not.toBeNull();
  return rectangle!;
}

test("MOTION questionnaire forward/back slide and rendered height interpolate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:questionnaire");
  const questionnaire = page.locator(".hk-questionnaire");
  const outer = questionnaire.locator(":scope > div");
  await expect(outer.locator(":scope > div")).toHaveCSS("opacity", "1");
  for (const [action, title, sign] of [["Next", "How would you like the result?", 1], ["Previous", "What should Harso help with?", -1]] as const) {
    const initialHeight = (await box(outer)).height;
    const frames = await questionnaire.getByRole("button", { name: action, exact: true }).evaluate(async element => {
      const questionnaire = element.closest(".hk-questionnaire")!;
      const outer = questionnaire.querySelector(":scope > div")!;
      const frames: { title: string | null; height: number; x: number; opacity: number; fields: number }[] = [];
      (element as HTMLButtonElement).click();
      const start = performance.now();
      await new Promise<void>(resolve => {
        const sample = () => {
          const inner = outer.firstElementChild!;
          const style = getComputedStyle(inner);
          frames.push({ title: inner.querySelector("h3")!.textContent, height: outer.getBoundingClientRect().height, x: new DOMMatrixReadOnly(style.transform).m41, opacity: Number(style.opacity), fields: questionnaire.querySelectorAll("fieldset").length });
          if (performance.now() - start >= 500) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return frames;
    });
    await test.info().attach(`questionnaire-${action}-frames`, { body: JSON.stringify({ initialHeight, frames }), contentType: "application/json" });
    await expect(questionnaire.getByRole("heading")).toHaveText(title);
    const finalHeight = (await box(outer)).height;
    expect(Math.abs(finalHeight - initialHeight)).toBeGreaterThan(8);
    const changed = frames.filter(frame => frame.title === title);
    expect(changed.some(frame => frame.x * sign > 0.1 && frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    expect(changed.some(frame => frame.x * sign < -0.1)).toBe(false);
    expect(changed.some(frame => frame.height > Math.min(initialHeight, finalHeight) + 0.5 && frame.height < Math.max(initialHeight, finalHeight) - 0.5)).toBe(true);
    expect(frames.every(frame => frame.fields === 1)).toBe(true);
    expect(changed.at(-1)!.x).toBeCloseTo(0, 2);
    expect(changed.at(-1)!.height).toBeCloseTo(finalHeight, 1);
    await expect(outer.locator(":scope > div")).toHaveCSS("opacity", "1");
  }
});

test("MOTION agent progress SVG interpolates actual host update", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:agent-progress");
  const circle = page.locator(".hk-agent-progress-value");
  const original = await circle.evaluate(element => parseFloat(getComputedStyle(element).strokeDashoffset));
  expect(original).toBeCloseTo(1 - 1.4 / 3, 4);
  await circle.evaluate(element => {
    element.addEventListener("transitionrun", event => {
      if ((event as TransitionEvent).propertyName !== "stroke-dashoffset") return;
      for (const animation of element.getAnimations()) {
        animation.pause();
        animation.currentTime = 90;
      }
    }, { once: true });
  });
  await page.getByLabel("Progress scenario", { exact: true }).selectOption("complete");
  await expect.poll(() => circle.evaluate(element => element.getAnimations().map(animation => animation.playState))).toEqual(["paused"]);
  const middle = await circle.evaluate(element => parseFloat(getComputedStyle(element).strokeDashoffset));
  expect(middle).toBeGreaterThan(0);
  expect(middle).toBeLessThan(original);
  expect(middle).toBeCloseTo(original / 2, 3);
  await expect(page.getByRole("progressbar", { name: "Agent progress" })).toHaveAttribute("aria-valuenow", "100");
  await circle.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await expect.poll(() => circle.evaluate(element => parseFloat(getComputedStyle(element).strokeDashoffset))).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Progress scenario", { exact: true }).selectOption("pending");
  await expect(circle).toHaveCSS("transition-duration", "0s");
  expect(await circle.evaluate(element => parseFloat(getComputedStyle(element).strokeDashoffset))).toBeCloseTo(1 - 0.4 / 3, 4);
  expect(await circle.evaluate(element => element.getAnimations().length)).toBe(0);
  await test.info().attach("progress-interpolation", { body: JSON.stringify({ original, middle, final: 0, sampleMilliseconds: 90, durationMilliseconds: 180 }), contentType: "application/json" });
});

async function notificationStack(page: Page, position: string) {
  await page.goto("/#boardui:notification");
  const entry = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = entry.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = entry.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, position }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { Notification, NotificationViewport } = await import(`${producerUrl}notification.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [open, setOpen] = React.useState(true);
      return element("section", { "aria-label": "Motion stack consumer" },
        element("button", { onClick: () => setOpen(!open) }, "Toggle first notification"),
        element(NotificationViewport, { position, label: "Motion stack" },
          element(Notification, { title: "First motion notice", description: "A supplied first item", open }),
          element(Notification, { title: "Second motion notice", description: "A supplied second item" })));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, position });
  return page.getByRole("region", { name: "Motion stack consumer" });
}

for (const position of ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`MOTION notification stack ${position} ${reducedMotion} presence and placement`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      const fixture = await notificationStack(page, position);
      const viewport = fixture.locator(".hk-notification-viewport");
      const first = viewport.locator(".hk-notification").first();
      const second = viewport.locator(".hk-notification").nth(1);
      await expect(first).toHaveCSS("opacity", "1");
      await expect(second).toHaveCSS("opacity", "1");
      const initial = await box(viewport);
      const firstBox = await box(first);
      const secondBox = await box(second);
      expect(secondBox.y - firstBox.y - firstBox.height).toBeCloseTo(10, 1);
      expect(secondBox.x).toBeCloseTo(firstBox.x, 1);
      const screen = page.viewportSize()!;
      if (position.startsWith("top")) expect(initial.y).toBeCloseTo(20, 1);
      else expect(initial.y + initial.height).toBeCloseTo(screen.height - 20, 1);
      if (position.endsWith("left")) expect(initial.x).toBeCloseTo(20, 1);
      else if (position.endsWith("right")) expect(initial.x + initial.width).toBeCloseTo(screen.width - 20, 1);
      else expect(initial.x + initial.width / 2).toBeCloseTo(screen.width / 2, 1);
      for (const phase of ["exit", "enter"]) {
        const frames = await fixture.getByRole("button", { name: "Toggle first notification" }).evaluate(async element => {
          const viewport = element.closest("section")!.querySelector(".hk-notification-viewport")!;
          const first = viewport.firstElementChild!;
          const second = viewport.lastElementChild!;
          const frames: { opacity: number; display: string; hidden: boolean; inert: boolean; firstHeight: number; secondY: number; stackHeight: number }[] = [];
          (element as HTMLButtonElement).click();
          const start = performance.now();
          await new Promise<void>(resolve => {
            const sample = () => {
              const style = getComputedStyle(first);
              frames.push({ opacity: Number(style.opacity), display: style.display, hidden: first.hasAttribute("hidden"), inert: first.hasAttribute("inert"), firstHeight: first.getBoundingClientRect().height, secondY: second.getBoundingClientRect().y, stackHeight: viewport.getBoundingClientRect().height });
              if (performance.now() - start >= 450) resolve();
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
          return frames;
        });
        await test.info().attach(`${position}-${phase}-frames`, { body: JSON.stringify({ initial, firstBox, secondBox, frames }), contentType: "application/json" });
        if (reducedMotion === "no-preference") expect(frames.some(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== "none" && frame.firstHeight > 0)).toBe(true);
        else {
          expect(frames.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(false);
          await expect(first).toHaveCSS("transition-duration", "0s");
        }
        await expect(second).toBeVisible();
        await expect(second).toHaveCSS("opacity", "1");
        if (phase === "exit") {
          await expect(first).toHaveCSS("display", "none");
          await expect(first).toHaveAttribute("aria-hidden", "true");
          expect(frames.filter(frame => frame.hidden).every(frame => frame.inert)).toBe(true);
          expect((await box(viewport)).height).toBeCloseTo(secondBox.height, 1);
          if (position.startsWith("top")) expect((await box(second)).y).toBeCloseTo(firstBox.y, 1);
          else expect((await box(second)).y).toBeCloseTo(secondBox.y, 1);
        } else {
          await expect(first).toHaveCSS("opacity", "1");
          await expect(first).not.toHaveAttribute("hidden");
          expect((await box(viewport)).height).toBeCloseTo(initial.height, 1);
          expect((await box(second)).y).toBeCloseTo(secondBox.y, 1);
        }
      }
    });
  }
}
