import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// WEV-1851 S1: display-only inline output card. Fixture content and callbacks are simulated.
const fixture = "/preview/output-card.html";
const screens = resolve(process.cwd(), ".lane/screens");
const card = (page: Page) => page.locator(".hkc-output-card");
const callbacks = async (page: Page) => JSON.parse(await page.getByLabel("Fixture callbacks").innerText());

async function geometry(page: Page) {
  return card(page).evaluate(root => {
    const boxes = [...root.querySelectorAll("button, .hkc-output-card-row, .hkc-output-card-title, .hkc-output-card-subtitle, .hkc-output-card-pick, .hkc-output-card-row-value, .hkc-output-card-row-label")]
      .filter(node => (node as HTMLElement).offsetParent !== null)
      .map(node => { const r = node.getBoundingClientRect(); return { name: node.className, text: node.textContent, x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; });
    const cardBox = root.getBoundingClientRect();
    const leaves = boxes.filter(b => !/hkc-output-card-row( |$)/.test(b.name));
    const overlaps = leaves.flatMap((a, i) => leaves.slice(i + 1).filter(b => a.x < b.right - .5 && a.right > b.x + .5 && a.y < b.bottom - .5 && a.bottom > b.y + .5).map(b => `${a.text} × ${b.text}`));
    const outside = boxes.filter(b => b.x < cardBox.x - .5 || b.right > cardBox.right + .5 || b.y < cardBox.y - .5 || b.bottom > cardBox.bottom + .5).map(b => b.text);
    const bordered = [root, ...root.querySelectorAll("*")].flatMap(node => {
      const s = getComputedStyle(node);
      return ["top", "right", "bottom", "left"].filter(side => s.getPropertyValue(`border-${side}-style`) !== "none" && parseFloat(s.getPropertyValue(`border-${side}-width`)) > 0).map(side => `${node.className || node.tagName} ${side}`);
    });
    const style = getComputedStyle(root);
    return { boxes, overlaps, outside, bordered, radius: style.borderRadius, outline: style.outlineStyle, background: style.backgroundColor };
  });
}

for (const mode of ["light", "dark"] as const) {
  test(`flights ${mode}: approved inline card at 420px, axe clean, 44px action, no overlap`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?mode=${mode}`);
    await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", mode);
    const region = page.getByRole("region", { name: "Flights to Tokyo" });
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: "Flights to Tokyo" })).toBeVisible();
    await expect(region.getByText("12 Oct · 1 adult · economy")).toBeVisible();
    await expect(region.getByRole("listitem")).toHaveCount(3);
    await expect(region.getByText("Pick", { exact: true })).toHaveCount(1);

    const g = await geometry(page);
    expect(g.bordered).toEqual([]);
    expect(g.outline).toBe("none");
    expect(g.radius).toBe("12px");
    expect(g.overlaps).toEqual([]);
    expect(g.outside).toEqual([]);
    const surface = await page.locator(".harso-kit").evaluate(node => getComputedStyle(node).getPropertyValue("--hk-surface").trim());
    const probe = await page.evaluate(color => { const el = document.createElement("i"); el.style.color = color; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c; }, surface);
    expect(g.background).toBe(probe);

    const action = region.getByRole("button", { name: "Choose SQ 638" });
    const box = (await action.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const cardBox = (await card(page).boundingBox())!;
    expect(box.x - cardBox.x).toBeCloseTo(16, 0);
    expect(cardBox.x + cardBox.width - (box.x + box.width)).toBeCloseTo(16, 0);
    const details = (await region.getByRole("button", { name: "Details" }).boundingBox())!;
    expect(details.width).toBeGreaterThanOrEqual(44);
    expect(details.height).toBeGreaterThanOrEqual(44);
    // Trailing values right-aligned to one edge, on the label line.
    const values = g.boxes.filter(b => b.name.includes("row-value"));
    const labels = g.boxes.filter(b => b.name.includes("row-label"));
    expect(new Set(values.map(v => Math.round(v.right))).size).toBe(1);
    values.forEach((v, i) => expect(Math.abs(v.y + v.height / 2 - (labels[i].y + labels[i].height / 2))).toBeLessThanOrEqual(2));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);

    await action.click();
    expect((await callbacks(page)).replies).toEqual(["Choose SQ 638 on 12 Oct (Singapore Airlines, dep 08:35)."]);

    await mkdir(screens, { recursive: true });
    await card(page).screenshot({ path: resolve(screens, `flights-${mode}-420-card.png`) });
    await page.screenshot({ path: resolve(screens, `flights-${mode}-420.png`) });
  });
}

test("Details: keyboard disclosure shows sources, Escape closes and restores focus; axe clean when open", async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 720 });
  await page.goto(fixture);
  const trigger = page.getByRole("button", { name: "Details" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const region = page.getByRole("region", { name: "Output details" });
  await expect(region.getByText("Fare search, 23 Sep 2026 09:12 SGT (illustrative)")).toBeVisible();
  expect((await geometry(page)).bordered).toEqual([]);
  expect((await geometry(page)).overlaps).toEqual([]);
  expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
  await mkdir(screens, { recursive: true });
  await card(page).screenshot({ path: resolve(screens, "flights-light-420-details.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(region).toBeHidden();
});

test("host-owned Details: onOpenDetails is called and no inline region renders", async ({ page }) => {
  await page.goto(`${fixture}?hostDetails=1`);
  await page.getByRole("button", { name: "Details" }).click();
  expect((await callbacks(page)).detailsOpened).toBe(1);
  await expect(page.getByRole("region", { name: "Output details" })).toHaveCount(0);
});

for (const [doc, mode] of [["failed", "light"], ["spending", "dark"]] as const) {
  test(`${doc} ${mode}: unsupported blocks render fallback_text only, axe clean`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?doc=${doc}&mode=${mode}`);
    await expect(card(page)).toHaveAttribute("data-fallback", "true");
    await expect(card(page).getByRole("listitem")).toHaveCount(0);
    await expect(card(page).getByRole("button", { name: /Try again|Choose/ })).toHaveCount(0);
    await expect(card(page).locator(".hkc-output-card-fallback")).toBeVisible();
    expect(await card(page).innerText()).not.toMatch(/[{}"]|"kind"/);
    const g = await geometry(page);
    expect(g.bordered).toEqual([]);
    expect(g.overlaps).toEqual([]);
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await mkdir(screens, { recursive: true });
    await card(page).screenshot({ path: resolve(screens, `${doc}-${mode}-420-card.png`) });
  });
}

test("warm palette and forced colors keep the card legible and bounded", async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 720 });
  await page.goto(`${fixture}?palette=cozy`);
  expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByRole("button", { name: "Choose SQ 638" })).toBeVisible();
  expect((await geometry(page)).overlaps).toEqual([]);
  await mkdir(screens, { recursive: true });
  await card(page).screenshot({ path: resolve(screens, "flights-cozy-forced-colors-420-card.png") });
});

test("narrow 320px: long rows wrap without horizontal overflow or overlap", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(fixture);
  const g = await geometry(page);
  expect(g.overlaps).toEqual([]);
  expect(g.outside).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
