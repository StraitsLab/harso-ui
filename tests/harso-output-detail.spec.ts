import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const fixture = "/preview/c1-image-document.html";
const pane = (page: Page) => page.getByTestId("pane");
const counts = async (page: Page) => JSON.parse(await page.getByLabel("Fixture callback counts").innerText());
async function targets(page: Page, scope: Locator) {
  const result = await scope.locator("button:visible").evaluateAll(buttons => {
    const rects = buttons.map(button => {
      const r = button.getBoundingClientRect();
      return { label: button.getAttribute("aria-label") || button.textContent, x: r.x, y: r.y, width: r.width, height: r.height, after: getComputedStyle(button, "::after").content };
    });
    return { rects, overlaps: rects.flatMap((a, i) => rects.slice(i + 1).filter(b => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)) };
  });
  for (const rect of result.rects) { expect(rect.width, rect.label ?? "").toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44); expect(rect.after).toBe("none"); }
  expect(result.overlaps).toHaveLength(0);
  for (const button of await scope.locator("button:visible").all()) {
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate(node => {
      const r = node.getBoundingClientRect();
      return [[r.x + r.width / 2, r.y + r.height / 2], [r.x + 2, r.y + r.height / 2], [r.right - 2, r.y + r.height / 2], [r.x + r.width / 2, r.y + 2], [r.x + r.width / 2, r.bottom - 2]]
        .every(([x, y]) => node.contains(document.elementFromPoint(x, y)));
    })).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  return result;
}

async function contrast(scope: Locator) {
  return scope.evaluate(root => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (color: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const blend = (top: number[], bottom: number[]) => top.slice(0, 3).map((v, i) => v * top[3] / 255 + bottom[i] * (1 - top[3] / 255)).concat(255);
    const background = (node: Element | null): number[] => node ? blend(rgba(getComputedStyle(node).backgroundColor), background(node.parentElement)) : [255, 255, 255, 255];
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const ratio = (a: number[], b: number[]) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    return [...root.querySelectorAll(".hkc-output-title, button, .c1-document p, th, td")].map(node => {
      const style = getComputedStyle(node), bg = background(node);
      return { text: node.textContent, foreground: style.color, background: bg, ratio: ratio(blend(rgba(style.color), bg), bg), focusRatio: ratio(rgba(style.getPropertyValue("--hk-accent")), background(node.parentElement)) };
    });
  });
}

for (const mode of ["light", "dark"]) for (const kind of ["image", "document"]) {
  test(`${kind} ${mode}: approved geometry, semantics, target boxes and contrast`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 520, height: 900 });
    await page.goto(`${fixture}?mode=${mode}&kind=${kind}`);
    const body = pane(page).locator(".hkc-output-content");
    const box = await body.boundingBox();
    expect(box?.x).toBe(20); expect(box?.width).toBe(480); expect(box?.y).toBe(kind === "image" ? 88 : 80);
    if (kind === "image") {
      const image = pane(page).getByRole("img");
      await expect(image).toBeVisible();
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth > 0 && node.naturalWidth / node.naturalHeight)).toBe(1.6);
      expect((await image.boundingBox())?.height).toBe(300);
    } else {
      await expect(pane(page).getByRole("heading", { name: "Blue and yellow" })).toBeVisible();
      await expect(pane(page).locator("strong")).toHaveText("A simple study in contrast.");
      await expect(pane(page).locator("tbody tr")).toHaveCount(2);
      expect(await body.evaluate(node => getComputedStyle(node).padding)).toBe("28px");
      expect(box?.height).toBe(640);
      expect(await pane(page).locator(".c1-document > p:not(.c1-deck)").first().evaluate(node => {
        const style = getComputedStyle(node); const probe = document.createElement("span"); probe.style.color = style.getPropertyValue("--hk-secondary"); node.append(probe);
        const expected = getComputedStyle(probe).color; probe.remove(); return { actual: style.color, expected };
      })).toEqual(mode === "light" ? { actual: "rgb(91, 96, 103)", expected: "rgb(91, 96, 103)" } : { actual: "rgb(165, 170, 179)", expected: "rgb(165, 170, 179)" });
      await expect(pane(page).getByRole("region", { name: "Colour table" })).toHaveAttribute("tabindex", "0");
    }
    const actions = await pane(page).locator(".hkc-output-actions").boundingBox();
    expect(actions?.y).toBe(kind === "image" ? 412 : 744);
    const widths = await pane(page).locator(".hkc-output-actions button").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
    expect(widths).toEqual([112, 96, 148]);
    const geometry = await targets(page, pane(page));
    const ratios = await contrast(pane(page));
    for (const sample of ratios) { expect(sample.ratio, sample.text ?? "").toBeGreaterThanOrEqual(4.5); expect(sample.focusRatio).toBeGreaterThanOrEqual(3); }
    await writeFile(testInfo.outputPath("geometry-contrast.json"), JSON.stringify({ geometry, ratios }, null, 2));
    await writeFile(testInfo.outputPath("accessibility.txt"), await pane(page).ariaSnapshot());
    const title = await pane(page).locator(".hkc-output-title").boundingBox();
    const trigger = await pane(page).getByRole("button", { name: "Details", exact: true }).boundingBox();
    expect(title!.y + title!.height / 2).toBeCloseTo(trigger!.y + trigger!.height / 2, 1);
    expect((await new AxeBuilder({ page }).include(".c1-pane").analyze()).violations).toEqual([]);
    await pane(page).screenshot({ path: testInfo.outputPath(`${kind}-${mode}-520.png`) });
  });
}

test("Details keyboard is nonmodal, Escape consumed once, same content DOM/scroll across disclosure and width", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 520, height: 900 });
  await page.goto(`${fixture}?kind=document&tall=1`);
  const content = pane(page).locator(".hkc-output-content");
  await content.evaluate(node => { (window as any).__content = node; node.setAttribute("data-retained", "yes"); });
  // Host-owned scroll viewport; kit must not replace or reset it.
  await content.evaluate(node => { const el = node as HTMLElement; el.style.maxHeight = "500px"; el.style.overflow = "auto"; el.scrollTop = 100; });
  const details = pane(page).getByRole("button", { name: "Details", exact: true });
  await page.keyboard.press("Tab"); await expect(details).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Close output" })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Go to conversation" })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("region", { name: "Colour table" })).toBeFocused();
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Escape");
  await expect(details).toBeFocused(); await expect(details).toHaveAttribute("aria-expanded", "false");
  expect((await counts(page)).escape).toBe(0);
  await page.keyboard.press("Escape"); expect((await counts(page)).escape).toBe(1);
  await content.evaluate(node => { (node as HTMLElement).scrollTop = 100; });
  await details.press("Space");
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await content.evaluate(node => node === (window as any).__content && node.scrollTop === 100)).toBe(true);
  const disclosure = page.getByRole("region", { name: "Output details" });
  const box = await disclosure.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(20); expect(box!.x + box!.width).toBeLessThanOrEqual(370);
  await pane(page).screenshot({ path: testInfo.outputPath("details-narrow.png") });
  await page.getByRole("button", { name: "Image", exact: true }).click();
  await expect(details).toHaveAttribute("aria-expanded", "false");
  await expect(pane(page).getByRole("img")).toBeVisible();
  await targets(page, page.locator(".c1-selector"));
  await expect(page.getByText("Legacy row must be replaced")).toHaveCount(0);
  await page.getByRole("button", { name: "Two outputs" }).click();
  await expect(page.getByRole("button", { name: "Image", exact: true })).toHaveCount(0);
});

for (const forcedColors of ["none", "active"] as const) test(`long title and metadata stay viewport-bound: ${forcedColors}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ forcedColors, reducedMotion: "reduce" });
  await page.goto(`${fixture}?kind=document&stress=1&tall=1`);
  const content = pane(page).locator(".hkc-output-content");
  await content.evaluate(node => {
    (window as any).__retainedContent = node;
    Object.assign((node as HTMLElement).style, { maxHeight: "150px", overflow: "auto" });
    node.scrollTop = 100;
  });
  const trigger = page.getByRole("button", { name: "Details", exact: true });
  await trigger.click();
  const region = page.getByRole("region", { name: "Output details" });
  for (const [width, height] of [[320, 900], [390, 600], [520, 450], [320, 900]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => {
      const b = await region.boundingBox();
      return !!b && b.y >= 0 && b.y + b.height <= height && b.x >= 20 && b.x + b.width <= width - 20;
    }).toBe(true);
    await region.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(page.getByText("Long metadata row 79")).toBeInViewport();
    expect(await content.evaluate(node => node === (window as any).__retainedContent && node.scrollTop === 100)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await region.evaluate(node => { node.scrollTop = 0; });
    await page.screenshot({ path: testInfo.outputPath(`bounded-${forcedColors}-${width}-${height}.png`) });
  }
  await page.getByRole("button", { name: "Go to conversation" }).focus();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect((await counts(page)).escape).toBe(0);
  await page.keyboard.press("Escape");
  expect((await counts(page)).escape).toBe(1);
  await trigger.press("Enter");
  await trigger.press("Tab");
  await expect(page.getByRole("button", { name: "Close output" })).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // A shorter, independently scrolling host pane is also a clipping boundary.
  await pane(page).evaluate(node => Object.assign((node as HTMLElement).style, { minHeight: "0", height: "600px", overflow: "auto" }));
  expect((await pane(page).boundingBox())?.height).toBe(600);
  await expect.poll(async () => {
    const b = await region.boundingBox();
    return !!b && b.y >= 0 && b.y + b.height <= 600;
  }).toBe(true);
  await pane(page).evaluate(node => { node.scrollTop = 120; });
  await expect.poll(async () => {
    const b = await region.boundingBox();
    return !!b && b.y >= 0 && b.y + b.height <= 600;
  }).toBe(true);
  await region.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect(page.getByText("Long metadata row 79")).toBeInViewport();
});

test("per-action counters, pending double-click fence, failure retry retains preview", async ({ page }, testInfo) => {
  await page.goto(fixture);
  const image = pane(page).getByRole("img");
  await image.evaluate(node => { (window as any).__image = node; });
  await pane(page).getByRole("button", { name: "Expand", exact: true }).click();
  expect(await counts(page)).toMatchObject({ expand: 1, download: 0, openExternally: 0 });
  const download = pane(page).getByRole("button", { name: "Download", exact: true });
  await download.dblclick();
  expect((await counts(page)).download).toBe(1); await expect(download).toBeDisabled();
  await expect(pane(page).getByRole("button", { name: "Expand", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Simulate download failure" }).click();
  await expect(pane(page).getByText("Could not download. Your preview is still here.")).toBeVisible();
  await pane(page).screenshot({ path: testInfo.outputPath("download-failed.png") });
  await pane(page).getByRole("button", { name: "Retry download" }).click();
  expect((await counts(page)).download).toBe(2);
  expect(await image.evaluate(node => node === (window as any).__image)).toBe(true);
  await pane(page).getByRole("button", { name: "Open externally" }).click();
  await pane(page).getByRole("button", { name: "Close output" }).click();
  expect(await counts(page)).toMatchObject({ expand: 1, download: 2, openExternally: 1, close: 1 });
});

for (const state of ["omitted", "disabled", "pending"]) test(`${state} actions cannot invoke`, async ({ page }) => {
  await page.goto(`${fixture}?action=${state}`);
  for (const label of ["Download", "Expand", "Open externally"]) {
    const button = pane(page).getByRole("button", { name: label, exact: true });
    if (state === "omitted") await expect(button).toHaveCount(0);
    else { await expect(button).toBeDisabled(); await button.evaluate((node: HTMLButtonElement) => node.click()); }
  }
  expect(await counts(page)).toMatchObject({ download: 0, expand: 0, openExternally: 0 });
});

for (const preview of ["loading", "unsupported", "error", "unavailable"]) test(`${preview} is politely announced without disabling available bytes`, async ({ page }) => {
  await page.goto(`${fixture}?preview=${preview}`);
  const status = pane(page).locator(".hkc-output-status");
  await expect(status).not.toBeEmpty(); await expect(status).toHaveAttribute("aria-live", "polite");
  await status.evaluate(node => {
    (window as any).__statusChanges = 0;
    new MutationObserver(() => (window as any).__statusChanges++).observe(node, { subtree: true, childList: true, characterData: true });
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await pane(page).getByRole("button", { name: "Details", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__statusChanges)).toBe(0);
  await pane(page).getByRole("button", { name: "Details", exact: true }).click();
  await pane(page).getByRole("button", { name: "Download", exact: true }).click();
  expect((await counts(page)).download).toBe(1);
});

test("constrained document and runtime token changes preserve readable content", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`${fixture}?kind=document`);
  await targets(page, pane(page));
  await expect(pane(page).locator("tbody tr")).toHaveCount(2);
  const table = page.getByRole("region", { name: "Colour table" });
  await table.focus(); await page.keyboard.press("ArrowRight");
  await expect(table).toBeFocused();
  expect(await table.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
  await pane(page).screenshot({ path: testInfo.outputPath("document-320.png") });
  const title = pane(page).locator(".hkc-output-title");
  await page.locator(".harso-kit").evaluate(node => (node as HTMLElement).style.setProperty("--hk-text-title", "18px"));
  await expect(title).toHaveCSS("font-size", "18px");
  await page.locator(".harso-kit").evaluate(node => (node as HTMLElement).style.removeProperty("--hk-text-title"));
  await expect(title).toHaveCSS("font-size", "15px");
});

test("Details full-size reference and keyboard disclosure geometry", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 520, height: 900 });
  await page.goto(fixture);
  const trigger = pane(page).getByRole("button", { name: "Details", exact: true });
  await trigger.press("Enter");
  const disclosure = page.getByRole("region", { name: "Output details" });
  const box = await disclosure.boundingBox();
  expect(box?.x).toBe(168); expect(box?.y).toBe(60); expect(box?.width).toBe(332);
  await targets(page, disclosure);
  await writeFile(testInfo.outputPath("details-accessibility.txt"), await pane(page).ariaSnapshot());
  await pane(page).screenshot({ path: testInfo.outputPath("details-520.png") });
});

for (const mode of ["light", "dark"]) test(`${mode} narrow390, long title, 200% layout zoom, forced colors and reduced motion`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${fixture}?mode=${mode}&long=1`);
  await targets(page, pane(page));
  const rows = await pane(page).locator(".hkc-output-actions button").evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y));
  expect(new Set(rows).size).toBeGreaterThan(1);
  await pane(page).screenshot({ path: testInfo.outputPath(`narrow-${mode}.png`) });
  // A translated-label stress probe without adding an unfrozen labels prop.
  await pane(page).getByRole("button", { name: "Open externally" }).evaluate(node => { node.textContent = "Open this document in an external application"; });
  await targets(page, pane(page));
  await pane(page).screenshot({ path: testInfo.outputPath(`long-label-${mode}.png`) });
  await page.setViewportSize({ width: 780, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await targets(page, pane(page));
  await page.screenshot({ path: testInfo.outputPath(`zoom200-${mode}.png`), fullPage: true });
  await page.evaluate(() => { document.documentElement.style.zoom = "1"; });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const button = pane(page).getByRole("button", { name: "Download", exact: true });
  await button.focus();
  expect(await button.evaluate(node => getComputedStyle(node).borderTopStyle)).toBe("solid");
  await button.click();
  const spinner = pane(page).locator(".hk-spinner");
  expect(await spinner.evaluate(node => getComputedStyle(node).animationName)).toBe("none");
  await expect(pane(page).getByText("Download in progress.")).toBeVisible();
  await pane(page).screenshot({ path: testInfo.outputPath(`forced-reduced-${mode}.png`) });
});
