import { expect, test, type Locator, type Page } from "@playwright/test";

async function attachmentConsumer(page: Page, appearance: string, palette: string, longName = false) {
  await page.goto("/#vercel:attachments");
  await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
  await page.getByLabel("Palette", { exact: true }).selectOption(palette);
  const entry = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]+\/react\.js\?[^\"]+)"/)?.[1];
  const domUrl = entry.match(/from "([^"]+\/react-dom_client\.js\?[^\"]+)"/)?.[1];
  expect(reactUrl).toBeTruthy();
  expect(domUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, longName }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const galleryUrl = "/src/boundaryless/attachments-examples.tsx";
    const { AttachmentsExample } = await import(galleryUrl);
    const example = document.querySelector<HTMLElement>('[data-testid="live-example"]')!;
    for (const child of Array.from(example.children)) (child as HTMLElement).style.display = "none";
    const host = document.createElement("section");
    host.setAttribute("aria-label", "Attachment contrast consumer");
    host.style.cssText = "width:100%;min-width:0;grid-column:1 / -1";
    example.append(host);
    const element = React.createElement;
    const content = [element(AttachmentsExample, { key: "gallery", component: "Attachments", state: "error" })];
    if (longName) {
      const source = await (await fetch(galleryUrl)).text();
      const producerUrl = source.match(/from "([^"]+\/packages\/ui\/src\/boundaryless\/index\.ts[^\"]*)"/)?.[1];
      if (!producerUrl) throw new Error("Actual attachment producer import not found");
      const { Attachments, Attachment, AttachmentPreview, AttachmentInfo, AttachmentRemove } = await import(producerUrl);
      content.push(element(Attachments, { key: "long", variant: "inline", "aria-label": "Long filename attachment" }, element(Attachment, { data: { id: "long", name: "design-review-evidence-".repeat(12) + ".png", mediaType: "image/png", size: 2048 }, onRemove: () => {} }, element(AttachmentPreview), element(AttachmentInfo, { showMediaType: true }), element(AttachmentRemove))));
    }
    createRoot(host).render(element(React.Fragment, null, ...content));
  }, { reactUrl, domUrl, longName });
  const consumer = page.getByRole("region", { name: "Attachment contrast consumer" });
  await expect(consumer.getByRole("alert")).toHaveText("Upload failed");
  return consumer;
}

async function errorPaint(consumer: Locator) {
  return consumer.getByRole("alert").evaluate(element => {
    const card = element.closest(".hk-attachment")!;
    const style = getComputedStyle(element);
    const resolve = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      card.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    return { foreground: style.color, background: getComputedStyle(card).backgroundColor, negative: resolve("--hk-negative"), filename: getComputedStyle(card.querySelector(".hk-attachment-name")!).color };
  });
}

function contrast(foreground: string, background: string) {
  const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3)
    .map(value => Number(value) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((first, second) => second - first);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
  test(`attachment error contrast ${appearance}/${palette} and retry`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: appearance === "dark" ? 390 : 1440, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance as "light" | "dark", reducedMotion: "reduce" });
    const consumer = await attachmentConsumer(page, appearance, palette);
    const paint = await errorPaint(consumer);
    const ratio = contrast(paint.foreground, paint.background);
    await testInfo.attach("error-paint", { body: JSON.stringify({ ...paint, contrast: ratio }), contentType: "application/json" });
    await consumer.screenshot({ path: testInfo.outputPath("error.png"), animations: "disabled" });
    expect.soft(ratio, "small error text contrast against actual card").toBeGreaterThanOrEqual(4.5);
    expect.soft(paint.foreground, "existing semantic negative token").toBe(paint.negative);
    expect.soft(paint.filename).toBe(paint.negative);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const retry = consumer.getByRole("button", { name: /retry/i });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(consumer.getByRole("alert")).toHaveCount(0);
    await expect(retry).toHaveCount(0);
    await expect(consumer.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await expect(consumer.locator('.hk-attachment[data-attachment-id="2"]')).toHaveClass(/hk-attachment-uploading/);
    await expect(consumer.getByRole("button", { name: /remove/i })).toHaveCount(2);
    await consumer.screenshot({ path: testInfo.outputPath("retry.png"), animations: "disabled" });
  });
}

test("attachment contrast mutation detects legacy fixed-red regression", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const consumer = await attachmentConsumer(page, "dark", "clean");
  const original = await errorPaint(consumer);
  expect(contrast(original.foreground, original.background)).toBeGreaterThanOrEqual(4.5);
  const mutation = await page.addStyleTag({ content: ".hk-attachment-error { color: #b42318 !important; }" });
  const mutated = await errorPaint(consumer);
  expect(contrast(mutated.foreground, mutated.background)).toBeLessThan(4.5);
  expect(mutated.foreground).not.toBe(mutated.negative);
  await testInfo.attach("mutation", { body: JSON.stringify({ original, mutated, mutatedContrast: contrast(mutated.foreground, mutated.background) }), contentType: "application/json" });
  await mutation.evaluate(element => element.parentNode?.removeChild(element));
  const restored = await errorPaint(consumer);
  expect(contrast(restored.foreground, restored.background)).toBeGreaterThanOrEqual(4.5);
});

for (const width of [390, 1440]) for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
  test(`attachment inline metadata spacing ${width} ${appearance}/${palette}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance as "light" | "dark", reducedMotion: "reduce" });
    const consumer = await attachmentConsumer(page, appearance, palette, true);
    const geometry = await consumer.locator(".hk-attachment-info").evaluateAll(nodes => nodes.map(info => {
      const card = info.closest(".hk-attachment")!;
      const bounds = card.getBoundingClientRect();
      const children = Array.from(info.children).map(child => {
        const rect = child.getBoundingClientRect();
        const style = getComputedStyle(child);
        return { text: child.textContent, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, clientWidth: child.clientWidth, scrollWidth: child.scrollWidth, overflow: style.overflowX, textOverflow: style.textOverflow };
      });
      return { id: card.getAttribute("data-attachment-id"), left: bounds.left, right: bounds.right, height: bounds.height, children };
    }));
    await testInfo.attach("inline-geometry", { body: JSON.stringify(geometry), contentType: "application/json" });
    await consumer.screenshot({ path: testInfo.outputPath("inline.png"), animations: "disabled" });
    for (const card of geometry) {
      expect.soft(card.left).toBeGreaterThanOrEqual(0);
      expect.soft(card.right).toBeLessThanOrEqual(width);
      expect.soft(card.height, "compact metadata does not become a tall list card").toBeLessThanOrEqual(100);
      for (let index = 1; index < card.children.length; index++) {
        const previous = card.children[index - 1];
        const next = card.children[index];
        const overlap = Math.min(previous.bottom, next.bottom) - Math.max(previous.top, next.top);
        if (overlap > 0) expect.soft(next.left - previous.right, `${previous.text} / ${next.text}: horizontal separation`).toBeGreaterThanOrEqual(4);
        else expect.soft(next.top - previous.bottom, `${previous.text} / ${next.text}: wrapped row separation`).toBeGreaterThanOrEqual(1);
      }
    }
    const filename = geometry.find(card => card.id === "long")!.children[0];
    expect.soft(filename.clientWidth).toBeGreaterThan(0);
    expect.soft(filename.scrollWidth).toBeGreaterThan(filename.clientWidth);
    expect.soft(filename.overflow).toBe("hidden");
    expect.soft(filename.textOverflow).toBe("ellipsis");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
