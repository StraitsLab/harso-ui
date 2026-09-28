import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// KIT-ROW-PHOTOS: row thumbnails and the photo gallery, in the catalogue gallery (local sample photos, no network).
const example = (page: Page, id: string) => page.locator(`[data-example="${id}"] .hkl-cat-state:not([data-state]) .hkl-cat-frame[data-width="420"]`).first();

for (const mode of ["light", "dark"] as const) {
  test(`gallery ${mode}: swipe-snap, buttons, keys and counter on a home listing; axe clean`, async ({ page }) => {
    await page.goto(`/#/catalogue/real_estate?mode=${mode}`);
    const frame = example(page, "home-listing-card");
    const gallery = frame.getByRole("region", { name: "8 photos" });
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery.getByText("1 of 8")).toBeVisible();
    // Only the shown photo and its neighbour are fetched.
    await expect(gallery.locator(".hkc-output-gallery-photo img")).toHaveCount(2);
    const box = await gallery.boundingBox();
    // Hover reveals Next; there is no Previous on photo 1.
    const next = gallery.getByRole("button", { name: "Next photo" });
    await gallery.hover();
    await expect(next).toHaveCSS("opacity", "1");
    await expect(gallery.getByRole("button", { name: "Previous photo" })).toHaveCount(0);
    await next.click();
    await expect(gallery.getByText("2 of 8")).toBeVisible();
    const track = gallery.locator(".hkc-output-gallery-track");
    await expect.poll(() => track.evaluate(el => Math.round(el.scrollLeft / el.clientWidth))).toBe(1);
    // Arrow keys on the focused track.
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await expect(gallery.getByText("3 of 8")).toBeVisible();
    await page.keyboard.press("End");
    await expect(gallery.getByText("8 of 8")).toBeVisible();
    await expect.poll(() => track.evaluate(el => Math.round(el.scrollLeft / el.clientWidth))).toBe(7);
    // A trackpad/hand scroll snaps to a whole photo and the counter follows.
    await track.evaluate(el => el.scrollTo({ left: el.clientWidth * 2.3, behavior: "instant" as ScrollBehavior }));
    await expect.poll(() => track.evaluate(el => el.scrollLeft / el.clientWidth)).toBeCloseTo(2, 1);
    await expect(gallery.getByText("3 of 8")).toBeVisible();
    // The frame never changed size.
    expect(await gallery.boundingBox()).toEqual(box);
    // Vertical page scroll is not captured by the gallery.
    expect(await track.evaluate(el => getComputedStyle(el).touchAction)).toContain("pan-y");
    const axe = await new AxeBuilder({ page }).include(`[data-example="home-listing-card"] .hkl-cat-state:not([data-state]) .hkl-cat-frame[data-width="420"]`).analyze();
    expect(axe.violations.map(v => v.id)).toEqual([]);
  });

  test(`row photos ${mode}: every row leads with a 44px square photo, aligned, inside the card; axe clean`, async ({ page }) => {
    await page.goto(`/#/catalogue/shopping?mode=${mode}`);
    const frame = example(page, "shop-vacuum-options");
    await frame.scrollIntoViewIfNeeded();
    const thumbs = frame.locator(".hkc-output-thumb");
    await expect(thumbs).toHaveCount(3);
    await expect(thumbs.locator("img")).toHaveCount(3);
    await expect.poll(() => thumbs.evaluateAll(all => all.map(t => t.getAttribute("data-state")))).toEqual(["ready", "ready", "ready"]);
    const boxes = await thumbs.evaluateAll(all => all.map(t => { const r = t.getBoundingClientRect(); return [Math.round(r.x), r.width, r.height]; }));
    expect(new Set(boxes.map(b => b[0])).size).toBe(1);
    expect(boxes.every(([, w, h]) => w === 44 && h === 44)).toBe(true);
    const radius = await thumbs.first().evaluate(t => getComputedStyle(t).borderRadius);
    expect(radius).toBe("8px");
    const axe = await new AxeBuilder({ page }).include(`[data-example="shop-vacuum-options"] .hkl-cat-state:not([data-state]) .hkl-cat-frame[data-width="420"]`).analyze();
    expect(axe.violations.map(v => v.id)).toEqual([]);
  });
}

test("a photo that does not arrive leaves the quiet tile, never a broken image; the gallery still browses", async ({ page }) => {
  await page.goto("/#/catalogue/travel?mode=light");
  await page.evaluate(() => {
    // Break every sample photo: the host resolves each artifact to a URL that fails.
    for (const img of document.querySelectorAll<HTMLImageElement>("[data-example] img")) img.src = "/__missing__/photo.png";
  });
  const frame = example(page, "travel-hotels-ueno");
  await frame.scrollIntoViewIfNeeded();
  await expect.poll(() => frame.locator(".hkc-output-thumb").evaluateAll(all => all.map(t => t.getAttribute("data-state")))).toEqual(["failed", "failed", "failed"]);
  await expect(frame.locator(".hkc-output-thumb img")).toHaveCount(0);
  await expect(frame.getByRole("img", { name: "Hotel Gracery Ueno, room photo" })).toBeVisible();
  await expect(frame.getByText("Hotel Gracery Ueno", { exact: true })).toBeVisible();
  const gallery = example(page, "travel-hotel-detail").getByRole("region", { name: "6 photos" });
  await gallery.scrollIntoViewIfNeeded();
  await expect.poll(() => gallery.locator(".hkc-output-gallery-photo").first().getAttribute("data-state")).toBe("failed");
  await gallery.hover();
  await gallery.getByRole("button", { name: "Next photo" }).click();
  await expect(gallery.getByText("2 of 6")).toBeVisible();
});

test("View all shows the same gallery", async ({ page }) => {
  await page.goto("/#/catalogue/shopping?mode=light");
  const frame = example(page, "shop-product-detail");
  await frame.scrollIntoViewIfNeeded();
  const viewAll = frame.locator(".hkc-output-card-view-all");
  if (await viewAll.count()) await viewAll.click();
  await expect(frame.getByRole("region", { name: "6 photos" })).toBeVisible();
  await expect(frame.getByText("1 of 6")).toBeVisible();
});

test("reduced motion: buttons jump straight to the photo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/catalogue/real_estate?mode=light");
  const gallery = example(page, "home-listing-card").getByRole("region", { name: "8 photos" });
  await gallery.scrollIntoViewIfNeeded();
  await gallery.hover();
  const track = gallery.locator(".hkc-output-gallery-track");
  await gallery.getByRole("button", { name: "Next photo" }).click();
  // No smooth scroll: the track is already there on the next frame.
  expect(await track.evaluate(el => new Promise<number>(done => requestAnimationFrame(() => done(Math.round(el.scrollLeft / el.clientWidth)))))).toBe(1);
  expect(await gallery.getByRole("button", { name: "Next photo" }).evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
});
