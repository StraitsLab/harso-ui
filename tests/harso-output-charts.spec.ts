import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Packet 5b: chart (bar, line), share and table blocks render as themselves in the inline output card.
// Fixture documents carry the B0 v4 master data (preview/output-card.tsx); `state=` sets the block's host state.
const fixture = "/preview/output-card.html";
const card = (page: Page) => page.locator(".hkc-output-card");
const open = async (page: Page, query: string, width = 560) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${fixture}?${query}`);
  await expect(card(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

/** Every drawn text and mark inside the card: overlaps between text boxes, anything outside the card, any border. */
async function geometry(page: Page) {
  return card(page).evaluate(root => {
    const cardBox = root.getBoundingClientRect();
    const texts = [...root.querySelectorAll("svg text, .hkc-output-share-row > span, .hkc-output-block-note, .hkc-output-block-failed-text > *, .hkc-output-card-title, .hkc-output-card-view-all")]
      .map(node => ({ text: node.textContent, box: node.getBoundingClientRect() }));
    const overlaps = texts.flatMap((a, i) => texts.slice(i + 1).filter(b => a.box.left < b.box.right - .5 && a.box.right > b.box.left + .5 && a.box.top < b.box.bottom - .5 && a.box.bottom > b.box.top + .5 && !(a.box.width === 0 || b.box.width === 0))
      .map(b => `${a.text} × ${b.text}`)).filter(pair => !/^View all/.test(pair));
    const scroller = root.querySelector(".hkc-output-table-scroll");
    const outside = [...root.querySelectorAll("svg, svg text, svg path, svg rect, .hkc-output-share-bar, .hkc-output-share-row, .hkc-output-table-scroll, .hkc-output-block-retry")]
      .filter(node => !(scroller && scroller.contains(node) && node !== scroller))
      .map(node => ({ node, box: node.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && (box.left < cardBox.left - .5 || box.right > cardBox.right + .5 || box.top < cardBox.top - .5 || box.bottom > cardBox.bottom + .5))
      .map(({ node }) => node.getAttribute("class") ?? node.tagName);
    const bordered = [root, ...root.querySelectorAll("*")].flatMap(node => {
      const s = getComputedStyle(node);
      return ["top", "right", "bottom", "left"].filter(side => s.getPropertyValue(`border-${side}-style`) !== "none" && parseFloat(s.getPropertyValue(`border-${side}-width`)) > 0).map(side => `${node.getAttribute("class")} ${side}`);
    });
    return { overlaps, outside, bordered };
  });
}

/** WCAG contrast of an element's paint (fill or background) against the card surface. */
async function contrast(page: Page, selector: string, property: "fill" | "backgroundColor" | "color") {
  return card(page).evaluate((root, [selector, property]) => {
    const toRgb = (value: string) => { const probe = document.createElement("i"); probe.style.color = value; root.append(probe); const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1; const ctx = canvas.getContext("2d")!; ctx.fillStyle = getComputedStyle(probe).color; ctx.fillRect(0, 0, 1, 1); probe.remove(); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const bg = toRgb(getComputedStyle(root).backgroundColor);
    return [...root.querySelectorAll(selector)].map(node => { const fg = toRgb((getComputedStyle(node) as unknown as Record<string, string>)[property]); const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return Math.round((a + .05) / (b + .05) * 100) / 100; });
  }, [selector, property] as const);
}

for (const mode of ["light", "dark"] as const) {
  test(`bar ${mode}: SVG chart with baseline, units, highlighted week named, uneven last period labelled; axe clean`, async ({ page }) => {
    await open(page, `doc=bar&mode=${mode}&width=544`);
    const svg = card(page).locator("svg.hkc-chart-svg");
    await expect(svg.locator(".hkc-chart-axis")).toHaveText(["S$0", "S$1,000", "S$2,000"]);
    await expect(svg.locator(".hkc-chart-value")).toHaveText("S$1,570");
    await expect(svg.locator(".hkc-chart-x--strong")).toHaveText("15–21");
    await expect(svg.locator(".hkc-chart-x-note")).toHaveText("9 days");
    await expect(svg.locator(".hkc-chart-baseline")).toHaveCount(1);
    // The highlighted value sits above its own bar, centred on it.
    const [bar, label] = await Promise.all([svg.locator(".hkc-chart-mark--strong").boundingBox(), svg.locator(".hkc-chart-value").boundingBox()]);
    expect(label!.y + label!.height).toBeLessThanOrEqual(bar!.y + .5);
    expect(Math.abs(label!.x + label!.width / 2 - (bar!.x + bar!.width / 2))).toBeLessThanOrEqual(1);
    // Every bar stands on the baseline.
    const baseline = (await svg.locator(".hkc-chart-baseline").boundingBox())!.y;
    for (const box of await svg.locator(".hkc-chart-mark").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().bottom))) expect(Math.abs(box - baseline)).toBeLessThanOrEqual(1);
    const g = await geometry(page);
    expect(g).toEqual({ overlaps: [], outside: [], bordered: [] });
    // Lightest mark >= 3:1 on the card (lead ruling); axis text >= 4.5:1.
    for (const ratio of await contrast(page, ".hkc-chart-mark", "fill")) expect(ratio).toBeGreaterThanOrEqual(3);
    for (const ratio of await contrast(page, ".hkc-chart-axis, .hkc-chart-x", "fill")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    await expect(card(page).getByRole("table", { name: /Spent per week/ })).toBeAttached();
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-bar-${mode}.png`, { animations: "disabled" });
  });

  test(`line ${mode}: the real zero is highlighted with value and date; nulls are gaps in partial; axe clean`, async ({ page }) => {
    await open(page, `doc=line&mode=${mode}&width=544`);
    const svg = card(page).locator("svg.hkc-chart-svg");
    await expect(svg.locator(".hkc-chart-highlight .hkc-chart-value")).toHaveText("S$0 · 7 Sep");
    await expect(svg.locator(".hkc-chart-x")).toHaveText(["1 Sep", "7 Sep", "14 Sep"]);
    await expect(svg.locator(".hkc-chart-x--strong")).toHaveText("7 Sep");
    const point = (await svg.locator(".hkc-chart-point").boundingBox())!;
    const baseline = (await svg.locator(".hkc-chart-baseline").boundingBox())!;
    expect(Math.abs(point.y + point.height / 2 - baseline.y)).toBeLessThanOrEqual(1.5);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-line-${mode}.png`, { animations: "disabled" });
    await open(page, `doc=line&state=partial&mode=${mode}&width=544`);
    await expect(svg.locator(".hkc-chart-missing")).toHaveCount(2);
    await expect(card(page).locator(".hkc-output-block-note")).toHaveText("12 of 14 days reported · 13–14 Sep still coming in");
  });

  test(`share ${mode}: thin stacked bar above ruled rows, lightest segment >= 3:1, View all under a full-width hairline; axe clean`, async ({ page }) => {
    await open(page, `doc=share&mode=${mode}&width=544`);
    const bar = card(page).locator(".hkc-output-share-bar");
    expect((await bar.boundingBox())!.height).toBe(10);
    await expect(card(page).locator(".hkc-output-share-segment")).toHaveCount(5);
    await expect(card(page).getByRole("listitem")).toHaveText(["Dining27%S$1,160", "Other25%S$1,080", "Groceries20%S$840"]);
    for (const ratio of await contrast(page, ".hkc-output-share-segment, .hkc-output-share-key", "backgroundColor")) expect(ratio).toBeGreaterThanOrEqual(3);
    for (const ratio of await contrast(page, ".hkc-output-share-percent", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    // Percent and amount columns each share one right edge.
    for (const column of [".hkc-output-share-percent", ".hkc-output-share-amount"]) {
      const rights = await card(page).locator(column).evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().right)));
      expect(new Set(rights).size).toBe(1);
    }
    const viewAll = card(page).getByRole("button", { name: "View all 5" });
    const [cardBox, hairline] = await Promise.all([card(page).boundingBox(), viewAll.evaluate(node => { const s = getComputedStyle(node, "::before"); const r = node.getBoundingClientRect(); return { left: r.left + parseFloat(s.left), right: r.right - parseFloat(s.right), height: s.height }; })]);
    expect(hairline).toEqual({ left: cardBox!.x, right: cardBox!.x + cardBox!.width, height: "1px" });
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-share-${mode}.png`, { animations: "disabled" });
  });

  test(`table ${mode}: header 500, numbers right-aligned and tabular, Total last with a rule, wide tables scroll inside; axe clean`, async ({ page }) => {
    await open(page, `doc=table&mode=${mode}&width=544`);
    const table = card(page).locator(".hkc-output-table");
    const head = await table.locator("thead th").evaluateAll(nodes => nodes.map(node => { const s = getComputedStyle(node); return [s.fontWeight, s.textAlign]; }));
    expect(head).toEqual([["500", "start"], ["500", "start"], ["500", "end"]]);
    const amounts = await table.locator("td[data-align=end]").evaluateAll(nodes => nodes.map(node => ({ right: Math.round(node.getBoundingClientRect().right), numeric: getComputedStyle(node).fontVariantNumeric })));
    expect(new Set(amounts.map(cell => cell.right)).size).toBe(1);
    expect(amounts.every(cell => cell.numeric === "tabular-nums")).toBe(true);
    const total = table.locator("tr.hkc-output-table-total");
    await expect(total).toHaveText("Total · 4S$19,465.50");
    expect(await total.locator("th").evaluate(node => [getComputedStyle(node).fontWeight, getComputedStyle(node).boxShadow.includes("inset")])).toEqual(["500", true]);
    await expect(table.locator("tbody tr").last()).toHaveClass(/hkc-output-table-total/);
    for (const ratio of await contrast(page, ".hkc-output-table thead th", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await expect(card(page)).toHaveScreenshot(`output-table-${mode}.png`, { animations: "disabled" });

    await open(page, `doc=wide&mode=${mode}&width=360`, 400);
    const scroller = card(page).locator(".hkc-output-table-scroll");
    const sizes = await scroller.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth, card: node.closest(".hkc-output-card")!.scrollWidth <= node.closest(".hkc-output-card")!.clientWidth }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    expect(sizes.card).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await scroller.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => scroller.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);

    await open(page, `doc=standings&mode=${mode}&width=544`);
    await expect(card(page).getByRole("button", { name: "View all 20" })).toBeVisible();
  });
}

for (const doc of ["bar", "line", "share", "table"] as const) for (const mode of ["light", "dark"] as const) {
  test(`${doc} ${mode}: loading, empty, partial, stale and failed draw as B0; failed is amber with a 28px bordered Try again`, async ({ page }) => {
    for (const state of ["loading", "empty", "partial", "stale", "failed"] as const) {
      await open(page, `doc=${doc}&state=${state}&mode=${mode}&width=544`);
      const block = card(page).locator(`[data-state=${state}]`);
      await expect(block).toBeVisible();
      if (state === "loading") await expect(block).toHaveAttribute("aria-busy", "true");
      if (state === "partial" || state === "stale") {
        const note = block.locator(".hkc-output-block-note");
        await expect(note).toBeVisible();
        for (const ratio of await contrast(page, ".hkc-output-block-note", "color")) expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
      if (state === "failed") {
        const retry = block.getByRole("button", { name: "Try again" });
        const box = (await retry.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(28);
        expect(await retry.evaluate(node => getComputedStyle(node).boxShadow)).toMatch(/inset/);
        // Amber, never red.
        const glyph = await block.locator(".hkc-output-block-failed-glyph").evaluate(node => getComputedStyle(node).color);
        const attention = await page.locator(".harso-kit").evaluate(node => { const probe = document.createElement("i"); probe.style.color = "var(--hk-attention)"; node.append(probe); const c = getComputedStyle(probe).color; probe.remove(); return c; });
        expect(glyph).toBe(attention);
        await retry.click();
        expect(JSON.parse(await page.getByLabel("Fixture callbacks").innerText()).retried).toBe(1);
      }
      expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
      expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    }
  });
}

test("money-spending-month at 320px: numbers, bar and share reflow without overflow or overlap", async ({ page }) => {
  await open(page, "doc=month&mode=light", 320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await geometry(page)).toEqual({ overlaps: [], outside: [], bordered: [] });
  await expect(card(page).getByRole("button", { name: "View all categories" })).toBeVisible();
  // The chart re-measures when the pane widens.
  const narrow = await card(page).locator("svg.hkc-chart-svg").getAttribute("width");
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect.poll(() => card(page).locator("svg.hkc-chart-svg").getAttribute("width")).not.toBe(narrow);
});

test("forced colors: chart and share marks stay visible", async ({ page }) => {
  await open(page, "doc=month&mode=light&width=544");
  await page.emulateMedia({ forcedColors: "active" });
  // Each mark is read by the property that paints it: SVG bars by fill, HTML share segments and keys by background.
  const painted = (selector: string, property: "fill" | "backgroundColor") => card(page).locator(selector)
    .evaluateAll((nodes, property) => nodes.map(node => (getComputedStyle(node) as unknown as Record<string, string>)[property]), property);
  const bars = await painted(".hkc-chart-mark", "fill");
  const segments = await painted(".hkc-output-share-segment, .hkc-output-share-key", "backgroundColor");
  expect(bars).toHaveLength(4);
  expect(segments).toHaveLength(8);
  for (const paint of [...bars, ...segments]) expect(paint).not.toMatch(/^(none|transparent|rgba\(0, 0, 0, 0\))$/);
});

// Review round 1 (F2): every required x label (first, last, highlighted, uneven period with its note) stays visible at
// every width, including a long unit that widens the axis; a figure wider than the plot still sits inside the card.
for (const width of [320, 390, 420]) for (const unit of ["S$", "transactions"]) {
  test(`required chart labels survive at ${width}px with unit ${unit}`, async ({ page }) => {
    await open(page, "doc=short", width);
    await page.waitForFunction(() => "renderOutput" in window);
    for (const kind of ["bar", "line"] as const) {
      await page.evaluate(({ kind, unit }) => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput({ header: { title: "August" },
        blocks: [{ kind: "visual", visual: { kind: "chart", chart: kind, unit, x_labels: ["1–7 Aug", "8–14 Aug", "15–21 Aug", "22–31 Aug"], series: [{ label: "Spent", values: ["980", "1040", "1460", "800"] }], highlight_index: 2 } }],
        fallback_text: "F" }), { kind, unit });
      const svg = card(page).locator("svg.hkc-chart-svg");
      await expect(svg.locator(".hkc-chart-x").first()).toHaveText("1–7 Aug");
      await expect(svg.locator(".hkc-chart-x").last()).toHaveText(kind === "bar" ? "22–31 Aug10 days" : "22–31 Aug");
      await expect(svg.locator(".hkc-chart-x--strong")).toHaveText("15–21 Aug");
      expect(await geometry(page), kind).toEqual({ overlaps: [], outside: [], bordered: [] });
    }
  });
}

test("figures wider than the plot are drawn whole and inside the card at 320px", async ({ page }) => {
  await open(page, "doc=short", 320);
  await page.waitForFunction(() => "renderOutput" in window);
  for (const kind of ["bar", "line"] as const) for (const values of [["999999999999998", "999999999999999"], ["-999999999999999", "1"], ["999999999999999.123456", "999999999999999.654321"]]) {
    await page.evaluate(({ kind, values }) => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput({ header: { title: "Big" },
      blocks: [{ kind: "visual", visual: { kind: "chart", chart: kind, unit: "S$", x_labels: ["A", "B"], series: [{ label: "V", values }], highlight_index: 1 } }], fallback_text: "F" }), { kind, values });
    const value = card(page).locator(".hkc-chart-value");
    await expect(value).toContainText(values[1].startsWith("999") ? "S$999,999,999,999,999" : "S$1");
    const axis = await card(page).locator(".hkc-chart-axis").allTextContents();
    expect(new Set(axis).size, `${kind} ${values}`).toBe(axis.length);
    expect(await geometry(page), `${kind} ${values}`).toEqual({ overlaps: [], outside: [], bordered: [] });
  }
});

// Hostile content (CJK without spaces, a 300-character word, emoji, RTL, negatives, 9-digit values) at four widths:
// chart text never overlaps, never leaves the card's content box, and the page never scrolls sideways.
for (const width of [320, 400, 560, 900]) {
  test(`hostile content at ${width}px: chart labels stay apart and inside, the table scrolls inside, no page overflow`, async ({ page }) => {
    for (const doc of ["hostile", "month", "bar", "line"]) {
      await open(page, `doc=${doc}`, width);
      const result = await card(page).evaluate(root => {
        const box = root.getBoundingClientRect();
        const texts = [...root.querySelectorAll(".hkc-chart-svg text")].map(node => ({ text: node.textContent, r: node.getBoundingClientRect() }));
        const overlaps = texts.flatMap((a, i) => texts.slice(i + 1).filter(b => a.r.left < b.r.right - .5 && a.r.right > b.r.left + .5 && a.r.top < b.r.bottom - .5 && a.r.bottom > b.r.top + .5).map(b => `${a.text} × ${b.text}`));
        const outside = texts.filter(t => t.r.right > box.right - 15.5 || t.r.left < box.left + 15.5).map(t => t.text);
        return { overlaps, outside };
      });
      expect(result, doc).toEqual({ overlaps: [], outside: [] });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), doc).toBe(true);
    }
    await open(page, "doc=hostile", width);
    expect(await card(page).locator(".hkc-output-table-scroll").evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
    await expect(card(page).locator(".hkc-chart-value")).toHaveText("−S$1,200");
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
  });
}
