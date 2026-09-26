import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Packet 5d: the action row (one filled, one quiet) and linked sources, all through host callbacks the fixture records.
// `width` is the kit frame: 390 is the iPhone inline card (stacked, 44px targets), 420 the desktop pane (a right-aligned
// pair). Fixture documents are catalogue examples (preview/output-card.tsx); nothing here reaches the network.
const fixture = "/preview/output-card.html";
const shots = resolve(process.cwd(), ".lane/screens/actions");
const card = (page: Page) => page.locator(".hkc-output-card");
const actions = async (page: Page) => JSON.parse(await page.getByLabel("Fixture callbacks").innerText()).actions as string[];
const open = async (page: Page, query: string, width: number) => {
  await page.setViewportSize({ width: width + 48, height: 900 });
  await page.goto(`${fixture}?${query}&width=${width}`);
  await expect(card(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};
const axe = async (page: Page) => (await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations;

/** Every action button's box, the row's box, the card's content box, and any overlap or overflow among them. */
async function layout(page: Page) {
  return card(page).evaluate(root => {
    const box = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const style = getComputedStyle(root);
    const cardBox = box(root);
    const content = { x: cardBox.x + parseFloat(style.paddingLeft), right: cardBox.right - parseFloat(style.paddingRight) };
    const row = root.querySelector(".hkc-output-card-actions")!;
    const buttons = [...row.querySelectorAll("button")].map(node => ({ slot: node.getAttribute("data-slot"), ...box(node),
      label: node.querySelector(".hkc-output-card-action-label")!, font: parseFloat(getComputedStyle(node).fontSize) }))
      .map(({ label, ...rest }) => ({ ...rest, clipped: label.scrollWidth > label.clientWidth + 1, labelRight: label.getBoundingClientRect().right }));
    const leaves = [...root.querySelectorAll("button, .hkc-output-card-row, .hkc-output-card-number, .hkc-output-card-text, .hkc-output-status")].map(box);
    const overlaps = leaves.flatMap((a, i) => leaves.slice(i + 1).filter(b => a.x < b.right - .5 && a.right > b.x + .5 && a.y < b.bottom - .5 && a.bottom > b.y + .5)).length;
    const outside = buttons.filter(b => b.x < content.x - .5 || b.right > content.right + .5 || b.labelRight > b.right + .5).length;
    const hairline = getComputedStyle(row, "::before");
    return { buttons, row: box(row), content, overlaps, outside, last: root.lastElementChild === row, hairline: hairline.height, bottomOfOthers: Math.max(...[...root.children].filter(c => c !== row).map(c => c.getBoundingClientRect().bottom)) };
  });
}

for (const mode of ["light", "dark"] as const) {
  for (const width of [390, 420] as const) {
    test(`invoice ${mode} ${width}: Open (filled) and Download (quiet), last, no overlap, axe clean, each through the host`, async ({ page }) => {
      await open(page, `doc=invoice&mode=${mode}`, width);
      const primary = card(page).getByRole("button", { name: "Open invoice" });
      const secondary = card(page).getByRole("button", { name: "Download PDF" });
      await expect(primary).toBeVisible();
      await expect(secondary).toBeVisible();
      const l = await layout(page);
      expect(l.last).toBe(true);
      expect(l.row.y).toBeGreaterThanOrEqual(l.bottomOfOthers - .5);
      expect(l.hairline).toBe("1px");
      expect(l.overlaps).toBe(0);
      expect(l.outside).toBe(0);
      const [p, s] = l.buttons;
      expect([p.slot, s.slot]).toEqual(["primary", "secondary"]);
      if (width === 390) {
        // iPhone inline: stacked, full width, primary above, 44px targets.
        for (const b of l.buttons) { expect(b.width).toBeCloseTo(l.content.right - l.content.x, 0); expect(b.height).toBeGreaterThanOrEqual(44); }
        expect(s.y).toBeGreaterThan(p.bottom - .5);
      } else {
        // Desktop pane: one row, right-aligned, primary at the trailing edge, at least 28px tall.
        for (const b of l.buttons) expect(b.height).toBeGreaterThanOrEqual(28);
        expect(Math.abs(p.y - s.y)).toBeLessThan(1);
        expect(p.right).toBeCloseTo(l.content.right, 0);
        expect(s.right).toBeLessThanOrEqual(p.x);
      }
      // Filled against the card for the primary, no fill for the quiet one; both legible.
      const fills = await card(page).locator(".hkc-output-card-action").evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
      expect(fills[0]).not.toBe(fills[1]);
      expect(await axe(page)).toEqual([]);
      await mkdir(shots, { recursive: true });
      await card(page).screenshot({ path: resolve(shots, `invoice-${mode}-${width}.png`) });

      await primary.click();
      await secondary.focus();
      await page.keyboard.press("Enter");
      expect(await actions(page)).toEqual(["open_artifact artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29", "download_artifact artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29"]);
      // Keyboard focus shows a ring.
      expect(await secondary.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
    });
  }

  test(`directions, work and long labels ${mode}: one action each; long labels stay one line with an ellipsis and the full name`, async ({ page }) => {
    for (const [doc, name, logged] of [
      ["directions", "Directions in Maps", "open_url https://maps.apple.com/?daddr=Jewel+Changi+Airport&dirflg=r"],
      ["work", "Stop", "work_control cancel 0192a3b4-5c6d-7e8f-9a0b-000000000962"]
    ] as const) {
      for (const width of [390, 420]) {
        await open(page, `doc=${doc}&mode=${mode}`, width);
        const l = await layout(page);
        expect(l.buttons).toHaveLength(1);
        expect(l.overlaps).toBe(0);
        expect(l.outside).toBe(0);
        expect(await axe(page)).toEqual([]);
        await card(page).screenshot({ path: resolve(shots, `${doc}-${mode}-${width}.png`) });
        await card(page).getByRole("button", { name }).click();
        expect(await actions(page)).toEqual([logged]);
      }
    }
    for (const doc of ["longactions", "rtlactions"]) {
      for (const width of [390, 420]) {
        await open(page, `doc=${doc}&mode=${mode}`, width);
        const l = await layout(page);
        expect(l.overlaps).toBe(0);
        expect(l.outside).toBe(0);
        // Each label is one line (the button does not grow for it) and keeps its whole text as the accessible name.
        for (const b of l.buttons) expect(b.height).toBeLessThanOrEqual(width === 390 ? 44.5 : 32.5);
        if (doc === "longactions") {
          // At 420 the pair wraps rather than squeezing both; only a label longer than the whole row is cut.
          if (width === 420) expect(l.buttons[1].y).toBeGreaterThan(l.buttons[0].bottom - .5);
          if (width === 390) expect(l.buttons.some(b => b.clipped)).toBe(true);
          await expect(card(page).getByRole("button", { name: "W".repeat(28) })).toBeVisible();
          await expect(card(page).getByRole("button", { name: "长".repeat(28) })).toBeVisible();
        } else {
          // The reply action beside it is never drawn.
          expect(l.buttons).toHaveLength(1);
          await expect(card(page).getByText("Choose")).toHaveCount(0);
        }
        expect(await axe(page)).toEqual([]);
        await card(page).screenshot({ path: resolve(shots, `${doc}-${mode}-${width}.png`) });
      }
    }
  });

  test(`sources ${mode}: a source with a url is a link through the host; the page never navigates`, async ({ page }) => {
    await open(page, `doc=directions&mode=${mode}`, 420);
    await card(page).getByRole("button", { name: "Details" }).click();
    const sources = card(page).getByRole("list", { name: "Sources" });
    await expect(sources.getByRole("link")).toHaveText(["LTA statement"]);
    await expect(sources.getByText("SMRT journey planner, 26 Sep 2026")).toBeVisible();
    expect(await axe(page)).toEqual([]);
    const before = page.url();
    await sources.getByRole("link", { name: "LTA statement" }).click();
    await sources.getByRole("link", { name: "LTA statement" }).click({ modifiers: ["Meta"] });
    expect(page.url()).toBe(before);
    expect(page.context().pages()).toHaveLength(1);
    expect(await actions(page)).toEqual(["open_url https://www.lta.gov.sg/content/ltagov/en/newsroom.html", "open_url https://www.lta.gov.sg/content/ltagov/en/newsroom.html"]);
    await card(page).screenshot({ path: resolve(shots, `sources-${mode}-420.png`) });
  });
}

test("a kind whose callback the host did not supply is not drawn; with none supplied the row is gone", async ({ page }) => {
  await open(page, "doc=invoice&without=download", 420);
  await expect(card(page).locator(".hkc-output-card-action")).toHaveText(["Open invoice"]);
  await open(page, "doc=invoice&without=download,open", 420);
  await expect(card(page).locator(".hkc-output-card-actions")).toHaveCount(0);
  await expect(card(page).getByRole("button")).toHaveCount(0);
  await open(page, "doc=directions&without=url", 420);
  await card(page).getByRole("button", { name: "Details" }).click();
  await expect(card(page).getByRole("link")).toHaveCount(0);
  // The S0 flights example's reply action stays undrawn with every callback supplied.
  await open(page, "doc=flights", 420);
  await expect(card(page).getByRole("button")).toHaveText(["Details"]);
});

test("forced colours: the action row keeps its hairline and outlined buttons, axe clean", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  for (const width of [390, 420]) {
    await open(page, "doc=invoice", width);
    const l = await layout(page);
    expect(l.overlaps).toBe(0);
    const paints = await card(page).locator(".hkc-output-card-action").evaluateAll(nodes => nodes.map(node => { const s = getComputedStyle(node); return { border: s.borderTopStyle, fill: s.backgroundColor, ink: s.color }; }));
    expect(paints.map(paint => paint.border)).toEqual(["solid", "solid"]);
    // Each label is painted in a colour other than its own fill (the filled primary once drew its label in its fill).
    for (const paint of paints) expect(paint.ink).not.toBe(paint.fill);
    expect(await axe(page)).toEqual([]);
    await card(page).screenshot({ path: resolve(shots, `invoice-forced-${width}.png`) });
  }
});

test("the catalogue gallery's actions flash what the app would do and open nothing", async ({ page }) => {
  await page.setViewportSize({ width: 1760, height: 1000 });
  await page.goto("/#/catalogue/money?mode=light");
  const example = page.locator('[data-example="file-invoice-pdf"] .hkl-cat-frame').first();
  await example.getByRole("button", { name: "Download PDF" }).click();
  await expect(example.getByRole("status")).toHaveText("Would download artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29");
  expect(page.context().pages()).toHaveLength(1);
});
