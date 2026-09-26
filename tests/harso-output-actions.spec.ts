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

  test(`sources ${mode}: a source with a url is a button through the host (click, Enter, Space), no href; the page never navigates`, async ({ page }) => {
    await open(page, `doc=directions&mode=${mode}`, 420);
    await card(page).getByRole("button", { name: "Details" }).click();
    const sources = card(page).getByRole("list", { name: "Sources" });
    const lta = sources.getByRole("button", { name: "LTA statement" });
    await expect(sources.getByRole("button")).toHaveText(["LTA statement"]);
    await expect(lta).toHaveAttribute("title", "https://www.lta.gov.sg/content/ltagov/en/newsroom.html");
    await expect(card(page).getByRole("region", { name: "Output details" }).locator("a, [href]")).toHaveCount(0);
    await expect(sources.getByText("SMRT journey planner, 26 Sep 2026")).toBeVisible();
    // At rest it reads as link text, not a button: no border, no fill, underlined, the list's own type size.
    const rest = await lta.evaluate(button => { const style = getComputedStyle(button), item = getComputedStyle(button.parentElement!);
      return { border: style.borderTopStyle, fill: style.backgroundColor, line: style.textDecorationLine, size: style.fontSize === item.fontSize, outline: style.outlineStyle }; });
    expect(rest).toEqual({ border: "none", fill: "rgba(0, 0, 0, 0)", line: "underline", size: true, outline: "none" });
    expect(await axe(page)).toEqual([]);
    const before = page.url();
    await lta.click();
    await lta.click({ modifiers: ["Meta"] });
    await lta.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(page.url()).toBe(before);
    expect(page.context().pages()).toHaveLength(1);
    expect(await actions(page)).toEqual(Array(4).fill("open_url https://www.lta.gov.sg/content/ltagov/en/newsroom.html"));
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
  // Without onOpenUrl a source with a url stays plain text: no source button (and never a link).
  await expect(card(page).getByRole("list", { name: "Sources" }).getByRole("button")).toHaveCount(0);
  await expect(card(page).getByRole("list", { name: "Sources" })).toContainText("LTA statement");
  await expect(card(page).locator("a, [href]")).toHaveCount(0);
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

// Source targets are layout boxes, so adjacent sources (the news brief lists three) each get their own: >= 44px on the
// 390 phone card, >= 28px in the 420 pane, never overlapping one another or the next Details line. A wrapped label grows
// its box instead of spilling into its neighbour's.
const sourcesDoc = { kind: "output_blocks", major: 1, header: { title: "Trains are back on the East-West Line" },
  blocks: [{ kind: "text", text: "Service resumed at 14:10 after a signalling fault." }],
  details: { sources: [
    { label: "LTA statement", url: "https://www.lta.gov.sg/content/ltagov/en/newsroom.html" },
    { label: "The Straits Times", url: "https://www.straitstimes.com/singapore/transport" },
    { label: "CNA", url: "https://www.channelnewsasia.com/singapore" },
    { label: "X", url: "https://x.com/SMRT_Singapore" },
    { label: "新", url: "https://www.zaobao.com.sg/" },
    { label: "SMRT service update for the East-West Line between Tanjong Pagar and Jurong East, 26 Sep 2026, 14:10", url: "https://www.smrt.com.sg/" },
    { label: "Commuter reports (not linked)" }],
  assumptions: ["Times are SGT."] } };
async function sourceBoxes(page: Page) {
  return card(page).getByRole("region", { name: "Output details" }).evaluate(region => {
    const box = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const buttons = [...region.querySelectorAll(".hkc-output-card-source-link")].map(box);
    const lines = [...region.querySelectorAll("li")].map(box);
    const leaves = [...buttons, ...lines.filter((_, i) => !region.querySelectorAll("li")[i].querySelector("button"))];
    const overlaps = leaves.flatMap((a, i) => leaves.slice(i + 1).filter(b => a.x < b.right - .5 && a.right > b.x + .5 && a.y < b.bottom - .5 && a.bottom > b.y + .5)).length;
    const outside = buttons.filter(b => b.right > region.getBoundingClientRect().right + .5).length;
    // Text that spills out of its button's box would sit on a neighbour's target.
    const spill = [...region.querySelectorAll(".hkc-output-card-source-link")].filter(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const text = range.getBoundingClientRect(), own = node.getBoundingClientRect();
      return text.top < own.top - .5 || text.bottom > own.bottom + .5 || text.right > own.right + .5;
    }).length;
    const lastLines = (() => { const range = document.createRange(); range.selectNodeContents([...region.querySelectorAll(".hkc-output-card-source-link")].find(node => node.textContent!.startsWith("SMRT"))!);
      return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size; })();
    return { widths: buttons.map(b => b.width), heights: buttons.map(b => b.height), overlaps, outside, spill, lastLines };
  });
}
for (const mode of ["light", "dark"] as const) {
  for (const width of [390, 420] as const) {
    test(`source targets ${mode} ${width}: adjacent linked sources (short Latin and CJK labels too) each >= ${width === 390 ? 44 : 28}px wide and tall, no overlap`, async ({ page }) => {
      await open(page, `doc=directions&mode=${mode}`, width);
      await page.evaluate(doc => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(doc), sourcesDoc);
      await card(page).getByRole("button", { name: "Details" }).click();
      const l = await sourceBoxes(page);
      expect(l.heights).toHaveLength(6);
      for (const height of l.heights) expect(height).toBeGreaterThanOrEqual(width === 390 ? 44 : 28);
      for (const w of l.widths) expect(w).toBeGreaterThanOrEqual(width === 390 ? 44 : 28);
      // The long label wraps to more than one line and stays inside its own box.
      expect(l.lastLines).toBeGreaterThan(1);
      expect(l.spill).toBe(0);
      expect(l.overlaps).toBe(0);
      expect(l.outside).toBe(0);
      expect(await axe(page)).toEqual([]);
      await card(page).getByRole("button", { name: "CNA" }).click();
      expect(await actions(page)).toEqual(["open_url https://www.channelnewsasia.com/singapore"]);
      await card(page).screenshot({ path: resolve(shots, `sources-adjacent-${mode}-${width}.png`) });
    });
  }
}

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("source targets are 44px wide and tall in the 420 pane under a touch pointer", async ({ page }) => {
    await open(page, "doc=directions", 420);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    await page.evaluate(doc => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(doc), sourcesDoc);
    await card(page).getByRole("button", { name: "Details" }).click();
    const l = await sourceBoxes(page);
    expect(l.widths).toHaveLength(6);
    for (const height of l.heights) expect(height).toBeGreaterThanOrEqual(44);
    for (const w of l.widths) expect(w).toBeGreaterThanOrEqual(44);
    expect(l.overlaps).toBe(0);
  });
});

test("the real news brief: its three linked sources are separate 28px targets in the gallery", async ({ page }) => {
  await page.setViewportSize({ width: 1760, height: 1000 });
  await page.goto("/#/catalogue/news?mode=light");
  const frame = page.locator('[data-example="news-brief"] .hkl-cat-frame').first();
  await frame.getByRole("button", { name: "Details", exact: true }).click();
  const boxes = await frame.locator(".hkc-output-card-source-link").evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { y: r.y, bottom: r.bottom, width: r.width, height: r.height }; }));
  expect(boxes.length).toBeGreaterThanOrEqual(3);
  for (const [i, b] of boxes.entries()) {
    expect(b.height).toBeGreaterThanOrEqual(28);
    expect(b.width).toBeGreaterThanOrEqual(28);
    if (i) expect(b.y).toBeGreaterThanOrEqual(boxes[i - 1].bottom - .5);
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
