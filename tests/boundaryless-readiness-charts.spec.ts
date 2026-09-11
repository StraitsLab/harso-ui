import { expect, test } from "@playwright/test";

test("curved area data stays monotone between the actual monthly endpoints", async ({ page }) => {
  await page.goto("/#boardui:area-chart-card");
  const line = page.locator(".hk-interactive-line").first();
  const curve = await line.getAttribute("d");
  expect(curve).toContain("C");
  const endpoints = [2400, 3200, 2800, 4100].map((value, index) => ({ x: 44 + index / 3 * 352, y: 184 - value / 6100 * 164 }));
  const samples = await line.evaluate(element => {
    const path = element as SVGPathElement;
    const length = path.getTotalLength();
    return Array.from({ length: 1001 }, (_, index) => {
      const point = path.getPointAtLength(length * index / 1000);
      return { x: point.x, y: point.y };
    });
  });
  expect(samples[0].x).toBeCloseTo(endpoints[0].x, 3);
  expect(samples[0].y).toBeCloseTo(endpoints[0].y, 3);
  expect(samples.at(-1)!.x).toBeCloseTo(endpoints.at(-1)!.x, 3);
  expect(samples.at(-1)!.y).toBeCloseTo(endpoints.at(-1)!.y, 3);
  for (const [index, start] of endpoints.slice(0, -1).entries()) {
    const finish = endpoints[index + 1];
    const section = samples.filter(point => point.x >= start.x && point.x <= finish.x);
    expect(section.length).toBeGreaterThan(100);
    expect(section[0].y).toBeCloseTo(start.y, 1);
    expect(section.at(-1)!.y).toBeCloseTo(finish.y, 1);
    for (const [sampleIndex, point] of section.entries()) {
      expect(point.y).toBeGreaterThanOrEqual(Math.min(start.y, finish.y) - .001);
      expect(point.y).toBeLessThanOrEqual(Math.max(start.y, finish.y) + .001);
      if (sampleIndex) expect((point.y - section[sampleIndex - 1].y) * Math.sign(finish.y - start.y)).toBeGreaterThanOrEqual(-.001);
    }
  }
  await page.getByLabel("Curve shape").selectOption("sharp");
  expect(await line.getAttribute("d")).not.toContain("C");
  expect(await line.getAttribute("d")).not.toBe(curve);
});

test("stage widths interpolate natively and reduced motion removes the transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:stage-bars-card");
  const bar = page.locator(".hk-chart-funnel-bar").nth(1);
  const originalWidth = await bar.evaluate(element => element.getBoundingClientRect().width);
  expect(originalWidth).toBeGreaterThan(0);
  await bar.evaluate(element => {
    element.addEventListener("transitionrun", () => {
      for (const animation of element.getAnimations()) {
        animation.pause();
        animation.currentTime = 80;
      }
    }, { once: true });
  });
  await page.getByLabel("Chart scenario").selectOption("zero");
  await expect.poll(() => bar.evaluate(element => element.getAnimations().map(animation => animation.playState))).toEqual(["paused"]);
  const middleWidth = await bar.evaluate(element => element.getBoundingClientRect().width);
  expect(middleWidth).toBeGreaterThan(0);
  expect(middleWidth).toBeLessThan(originalWidth);
  await bar.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await expect.poll(() => bar.evaluate(element => element.getBoundingClientRect().width)).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Chart scenario").selectOption("fractional");
  await expect(bar).toHaveCSS("transition-duration", "0s");
  expect(await bar.evaluate(element => element.getAnimations().length)).toBe(0);
  expect(await bar.evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(originalWidth, 1);
});
