import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

for (const width of [390, 1800]) {
  test(`gallery preserves cached and conditional native Escape cancellation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.goto("/#boardui:ai-image-generation");
    await page.getByRole("button", { name: "Gallery", exact: true }).click();
    const gallery = page.getByRole("dialog", { name: "Gallery", exact: true });
    await gallery.getByRole("button", { name: "Actions for A quiet horizon", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Actions for A quiet horizon", exact: true });
    await menu.evaluate(element => {
      const cached = new WeakMap<Event, Event["preventDefault"]>();
      window.addEventListener("keydown", event => { cached.set(event, event.preventDefault); }, true);
      element.addEventListener("keydown", event => {
        if ((event as KeyboardEvent).key === "Escape" && !event.defaultPrevented) cached.get(event)?.call(event);
      });
    });
    await page.keyboard.press("Escape");
    await expect(menu).toBeVisible();
    await expect(gallery).toBeVisible();
  });
  test(`gallery menu Escape closes only the topmost surface at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.goto("/#boardui:ai-image-generation");
    const workspace = page.locator(".hk-image-workspace");
    await expect(workspace).toHaveAttribute("data-compact", String(width === 390));
    const galleryTrigger = page.getByRole("button", { name: "Gallery", exact: true });
    await galleryTrigger.click();
    const gallery = page.getByRole("dialog", { name: "Gallery", exact: true });
    const trigger = gallery.getByRole("button", { name: "Actions for A quiet horizon", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Actions for A quiet horizon", exact: true });
    await expect(menu.getByRole("menuitem", { name: "Reuse prompt", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(gallery).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(gallery).toBeHidden();
    await expect(galleryTrigger).toBeFocused();
  });
}

test("gallery dropdown preserves consumer Escape cancellation and controlled close refusal", async ({ page }) => {
  await page.goto("/#boardui:ai-image-generation");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)![1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)![1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)![1];
  const navigationUrl = `${producerUrl}navigation-surfaces.tsx`;
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, navigationUrl }) => {
    const React = (await import(reactUrl)).default;
    const { createRoot } = (await import(domUrl)).default;
    const { AiChat } = await import(`${producerUrl}agent-surfaces.tsx`);
    const { Dropdown, DropdownTrigger, DropdownPopover, DropdownItem } = await import(navigationUrl);
    function Consumer() {
      const [panel, setPanel] = React.useState(true);
      const [open, setOpen] = React.useState(false);
      const [cancel, setCancel] = React.useState(true);
      const [hold, setHold] = React.useState(true);
      const [requests, setRequests] = React.useState(0);
      return React.createElement(AiChat, { title: "Escape fixture", panel: panel ? { title: "Escape contract", onClose: () => setPanel(false), content:
        React.createElement(Dropdown, { label: "Contract menu", open, onOpenChange: (next: boolean) => { if (!next) setRequests((count: number) => count + 1); if (next || !hold) setOpen(next); } },
          React.createElement(DropdownTrigger, null, "Contract actions"),
          React.createElement(DropdownPopover, null,
            React.createElement(DropdownItem, { label: "Cancel Escape", closeOnSelect: false, onKeyDown: (event: KeyboardEvent) => { if (cancel && event.key === "Escape") event.preventDefault(); }, onSelect: () => setCancel(false) }),
            React.createElement(DropdownItem, { label: "Release refusal", closeOnSelect: false, onSelect: () => setHold(false) })),
          React.createElement("output", { "aria-label": "Cancel state" }, String(cancel)),
          React.createElement("output", { "aria-label": "Close requests" }, requests)) } : null });
    }
    const root = document.createElement("div");
    document.querySelector('[data-testid="live-example"]')!.before(root);
    createRoot(root).render(React.createElement(Consumer));
  }, { reactUrl, domUrl, producerUrl, navigationUrl });
  const dialog = page.getByRole("dialog", { name: "Escape contract", exact: true });
  const trigger = dialog.getByRole("button", { name: "Contract actions" });
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Contract menu", exact: true });
  await page.keyboard.press("Escape");
  await expect(menu).toBeVisible();
  await expect(dialog.getByLabel("Close requests")).toHaveText("0");
  await page.keyboard.press("Enter");
  await expect(dialog.getByLabel("Cancel state")).toHaveText("false");
  await page.keyboard.press("Escape");
  await expect(menu).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Close requests")).toHaveText("1");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(dialog.getByLabel("Close requests")).toHaveText("2");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("gallery native drawer retains focus and fits the viewport across compact and wide layouts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:ai-image-generation");
  const opener = page.getByRole("button", { name: "Gallery", exact: true });
  await opener.click();
  const gallery = page.getByRole("dialog", { name: "Gallery", exact: true });
  await expect.poll(() => gallery.evaluate(element => element.matches(":modal"))).toBe(true);
  const compact = await gallery.boundingBox();
  expect(compact!.x + compact!.width).toBeCloseTo(390, 0);
  expect(compact!.y).toBe(0);
  expect(compact!.height).toBe(740);
  const close = gallery.getByRole("button", { name: "Close context panel" });
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await gallery.evaluate(element => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true);
  await opener.evaluate(element => element.focus());
  await expect(opener).not.toBeFocused();
  await close.focus();
  await gallery.screenshot({ path: test.info().outputPath("native-compact.png") });
  await page.setViewportSize({ width: 1800, height: 1040 });
  await expect.poll(() => gallery.evaluate(element => element.matches(":modal"))).toBe(false);
  await expect(close).toBeFocused();
  const wide = await gallery.boundingBox();
  const conversation = await page.locator(".hk-image-workspace .hk-ai-workspace-conversation").boundingBox();
  expect(wide!.x).toBeGreaterThanOrEqual(conversation!.x + conversation!.width);
  await gallery.screenshot({ path: test.info().outputPath("native-wide.png") });
  await page.setViewportSize({ width: 390, height: 740 });
  await expect.poll(() => gallery.evaluate(element => element.matches(":modal"))).toBe(true);
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(gallery).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a nested native dialog owns its cancellation without closing the gallery", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto("/#boardui:ai-image-generation");
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  const gallery = page.getByRole("dialog", { name: "Gallery", exact: true });
  await gallery.evaluate(element => {
    const nested = document.createElement("dialog");
    nested.setAttribute("aria-label", "Native detail");
    const button = document.createElement("button");
    button.textContent = "Nested action";
    nested.append(button);
    element.append(nested);
    nested.showModal();
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Native detail" })).toBeHidden();
  await expect(gallery).toBeVisible();
});

test("image draft refusal preserves the host value and accepts edits after release", async ({ page }) => {
  await page.goto("/#boardui:ai-image-generation");
  const draft = page.getByRole("textbox", { name: "Describe your image" });
  await draft.fill("Original draft");
  await page.getByLabel("Hold image host state").check();
  await draft.fill("Refused replacement");
  await expect(draft).toHaveValue("Original draft");
  await page.getByLabel("Hold image host state").uncheck();
  await draft.fill("Accepted replacement");
  await expect(draft).toHaveValue("Accepted replacement");
});

test("image downloads save the displayed local SVG bytes and filename from both actions", async ({ page }) => {
  await page.goto("/#boardui:ai-image-generation");
  for (const galleryAction of [false, true]) {
    if (galleryAction) await page.getByRole("button", { name: "Gallery", exact: true }).click();
    const image = galleryAction ? page.getByRole("button", { name: "Open Warm morning light" }).getByRole("img") : page.locator(".hk-image-generation-frame img");
    const source = await image.getAttribute("src");
    expect(source).toMatch(/^data:image\/svg\+xml,/);
    const downloadEvent = page.waitForEvent("download", { timeout: 5000 });
    const button = galleryAction ? page.locator(".hk-image-gallery-item").filter({ has: image }).getByRole("button", { name: "Download", exact: true }) : page.getByRole("button", { name: "Download image", exact: true });
    await button.click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(galleryAction ? "harso-synthetic-sample-2.svg" : "harso-synthetic-sample-1.svg");
    expect(await download.failure()).toBeNull();
    const bytes = await readFile((await download.path())!);
    expect(bytes.equals(Buffer.from(decodeURIComponent(source!.split(",")[1])))).toBe(true);
    expect(bytes.toString()).toContain(galleryAction ? 'height="780"' : 'height="400"');
    expect(bytes.toString()).not.toMatch(/<script|<foreignObject|href=/i);
  }
});

test("disabled, incomplete and host-refused image actions never download", async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1040 });
  const downloads: string[] = [];
  page.on("download", download => downloads.push(download.suggestedFilename()));
  await page.goto("/#boardui:ai-image-generation");
  await page.getByLabel("Hold image host state").check();
  await page.getByRole("button", { name: "Download image", exact: true }).click();
  await expect(page.getByLabel("Image request")).toContainText("host retained state");
  await page.getByLabel("Hold image host state").uncheck();
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await page.getByLabel("Hold image host state").check();
  await page.getByRole("button", { name: "Download", exact: true }).first().click();
  await expect(page.getByLabel("Image request")).toContainText("host retained state");
  await page.getByLabel("Hold image host state").uncheck();
  await page.getByLabel("Image example state").selectOption("disabled");
  for (const button of await page.getByRole("button", { name: /^Download/ }).all()) await expect(button).toBeDisabled();
  await page.getByLabel("Image example state").selectOption("ready");
  await page.keyboard.press("Escape");
  for (const state of ["empty", "failed"]) {
    await page.getByLabel("Image example state").selectOption(state);
    await expect(page.getByRole("button", { name: "Download image", exact: true })).toHaveCount(0);
  }
  await page.getByLabel("Image example state").selectOption("ready");
  await page.getByRole("textbox", { name: "Describe your image" }).fill("Pending local sample");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download image", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Pending local sample" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Stop generation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download image", exact: true })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Generation stopped" })).toBeVisible();
  expect(downloads).toEqual([]);
});

for (const width of [1512, 390]) {
  test(`gallery has varied intrinsic aspect ratios and unfragmented masonry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#boardui:ai-image-generation");
    await page.getByRole("button", { name: "Gallery", exact: true }).click();
    const gallery = page.locator(".hk-image-gallery");
    await expect(gallery.locator("img")).toHaveCount(4);
    await expect.poll(() => gallery.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth === 600))).toBe(true);
    const geometry = await gallery.evaluate(element => ({
      bounds: element.getBoundingClientRect().toJSON(),
      items: Array.from(element.children, item => ({ ...item.getBoundingClientRect().toJSON(), fragments: item.getClientRects().length })),
      images: Array.from(element.querySelectorAll("img"), image => ({ rendered: image.height / image.width, intrinsic: image.naturalHeight / image.naturalWidth })),
    }));
    expect(new Set(geometry.images.map(image => image.intrinsic)).size).toBe(3);
    for (const image of geometry.images) expect(image.rendered).toBeCloseTo(image.intrinsic, 1);
    const columns = new Map<number, typeof geometry.items>();
    for (const item of geometry.items) {
      const column = Math.round(item.x);
      columns.set(column, [...(columns.get(column) ?? []), item]);
    }
    expect(columns.size).toBeGreaterThanOrEqual(1);
    if (width === 1512) expect(columns.size).toBe(2);
    for (const items of columns.values()) {
      for (const [index, item] of items.entries()) {
        expect(item.fragments).toBe(1);
        expect(item.x).toBeGreaterThanOrEqual(geometry.bounds.x - 1);
        expect(item.right).toBeLessThanOrEqual(geometry.bounds.right + 1);
        if (index) expect(item.y - items[index - 1].bottom).toBeCloseTo(16, 0);
      }
    }
    expect(Math.max(...Array.from(columns.values(), items => items.length))).toBeGreaterThan(1);
    if (columns.size === 2) {
      const secondRows = Array.from(columns.values(), items => items[1]?.y).filter(value => value !== undefined);
      expect(secondRows).toHaveLength(2);
      expect(Math.abs(secondRows[0] - secondRows[1])).toBeGreaterThan(20);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await gallery.screenshot({ path: test.info().outputPath("masonry.png") });
  });
}

test("original CSS ripple advances and honors reduced motion without claiming Canvas parity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:ai-image-generation");
  await page.getByRole("textbox", { name: "Describe your image" }).fill("Local ripple preview");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  const ripple = page.locator(".hk-image-generation-ripple");
  await expect(ripple).toBeVisible();
  const before = await ripple.evaluate(element => ({ transform: getComputedStyle(element).transform, time: Number(element.getAnimations()[0]?.currentTime) }));
  await expect.poll(() => ripple.evaluate(element => Number(element.getAnimations()[0]?.currentTime))).toBeGreaterThan(before.time + 100);
  expect(await ripple.evaluate(element => getComputedStyle(element).transform)).not.toBe(before.transform);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => ripple.evaluate(element => element.getAnimations().length)).toBe(0);
});
