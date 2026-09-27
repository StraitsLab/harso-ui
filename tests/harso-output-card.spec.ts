import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// WEV-1851 S1 + packet 5a: display-only inline output card. Fixture content and callbacks are simulated.
// The card renders no actions (choices go through the native question card); overflow is one View-all row.
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
  test(`flights ${mode}: display-only inline card at 420px, axe clean, no action, no overlap`, async ({ page }) => {
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

    // Display-only: the S0 example's reply action renders nothing; Details is the only control.
    await expect(region.getByRole("button")).toHaveText(["Details"]);
    await expect(region.getByText(/Choose|Not available/)).toHaveCount(0);
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

// Packet 5c: status now renders too (the failed document draws amber, tests/harso-output-media.spec.ts); a block kind
// the card cannot draw (`doc=unknown`) still falls back.
for (const [doc, mode] of [["unknown", "light"], ["unknown", "dark"]] as const) {
  test(`${doc} ${mode}: unsupported blocks render fallback_text only, axe clean`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?doc=${doc}&mode=${mode}`);
    await expect(card(page)).toHaveAttribute("data-fallback", "true");
    await expect(card(page).getByRole("listitem")).toHaveCount(0);
    await expect(card(page).getByRole("button", { name: /Try again|Choose|View all/ })).toHaveCount(0);
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
  await expect(page.getByRole("button", { name: "Details" })).toBeVisible();
  expect((await geometry(page)).overlaps).toEqual([]);
  await mkdir(screens, { recursive: true });
  await card(page).screenshot({ path: resolve(screens, "flights-cozy-forced-colors-420-card.png") });
});

for (const mode of ["light", "dark"] as const) {
  test(`more ${mode}: seven rows show three plus one quiet View all 7 row that calls the host`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?doc=more&mode=${mode}`);
    const region = page.getByRole("region", { name: "Flights to Tokyo" });
    await expect(region.getByRole("listitem")).toHaveCount(3);
    const viewAll = region.getByRole("button", { name: "View all 7" });
    await expect(viewAll).toBeVisible();
    const g = await geometry(page);
    expect(g.bordered).toEqual([]);
    expect(g.overlaps).toEqual([]);
    expect(g.outside).toEqual([]);
    const box = (await viewAll.boundingBox())!;
    const cardBox = (await card(page).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    // Full-width row inside the 16px padding: label on the row text edge, chevron on the values edge.
    expect(box.x - cardBox.x).toBeCloseTo(16, 0);
    expect(cardBox.x + cardBox.width - (box.x + box.width)).toBeCloseTo(16, 0);
    const lastRow = (await region.getByRole("listitem").last().boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(lastRow.y + lastRow.height - .5);
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await mkdir(screens, { recursive: true });
    await card(page).screenshot({ path: resolve(screens, `more-${mode}-420-card.png`) });
    await viewAll.focus();
    await page.keyboard.press("Enter");
    expect((await callbacks(page)).viewAllOpened).toBe(1);
    await card(page).screenshot({ path: resolve(screens, `more-${mode}-420-card-focused.png`) });
  });
}

test("narrow 320px: long rows wrap without horizontal overflow or overlap", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(fixture);
  const g = await geometry(page);
  expect(g.overlaps).toEqual([]);
  expect(g.outside).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Packet 5a: key numbers and a short text block render as themselves (light + dark evidence in .lane/evidence).
const evidence = resolve(process.cwd(), ".lane/evidence");
for (const mode of ["light", "dark"] as const) {
  test(`numbers ${mode}: two key figures inline, the third behind the View-all row, axe clean`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?doc=numbers&mode=${mode}`);
    const region = page.getByRole("region", { name: "September spending" });
    await expect(card(page)).not.toHaveAttribute("data-fallback", "true");
    await expect(region.getByRole("listitem")).toHaveText(["S$4,280Spent", "S$720Left"]);
    await expect(region.getByText("S$5,000")).toHaveCount(0);
    const viewAll = region.getByRole("button", { name: "View all transactions" });
    await expect(viewAll).toBeVisible();
    const cells = await card(page).locator(".hkc-output-card-number").evaluateAll(nodes => nodes.map(node => {
      const [value, label] = [...node.children].map(child => { const r = child.getBoundingClientRect(); const s = getComputedStyle(child); return { top: r.top, bottom: r.bottom, left: r.left, size: s.fontSize, weight: s.fontWeight, color: s.color }; });
      return { value, label, left: node.getBoundingClientRect().left };
    }));
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      expect(cell.value.size).toBe("22px");
      expect(cell.value.weight).toBe("600");
      expect(cell.label.size).toBe("13px");
      expect(cell.label.top).toBeGreaterThanOrEqual(cell.value.bottom - .5);
      expect(cell.label.color).not.toBe(cell.value.color);
    }
    // Side by side on one line (2-up), left cell first.
    expect(cells[1].left).toBeGreaterThan(cells[0].left);
    expect(Math.abs(cells[0].value.top - cells[1].value.top)).toBeLessThanOrEqual(.5);
    const g = await geometry(page);
    expect(g.bordered).toEqual([]);
    expect(g.overlaps).toEqual([]);
    expect(g.outside).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await viewAll.click();
    expect((await callbacks(page)).viewAllOpened).toBe(1);
    await mkdir(evidence, { recursive: true });
    await card(page).screenshot({ path: resolve(evidence, `numbers-${mode}-420-card.png`) });
  });

  test(`text ${mode}: summary and long prose stay within ~4 lines with the View-all row, axe clean`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    for (const [doc, name, more] of [["brief", "Singapore EV charging in 2026", "Read brief"], ["text", "Is an EV worth it now?", "View all"]] as const) {
      await page.goto(`${fixture}?doc=${doc}&mode=${mode}`);
      const region = page.getByRole("region", { name });
      await expect(card(page)).not.toHaveAttribute("data-fallback", "true");
      const text = card(page).locator(".hkc-output-card-text");
      await expect(text).toBeVisible();
      const lines = await text.evaluate(node => { const s = getComputedStyle(node); return node.getBoundingClientRect().height / parseFloat(s.lineHeight); });
      expect(Math.round(lines)).toBeGreaterThanOrEqual(2);
      expect(Math.round(lines)).toBeLessThanOrEqual(4);
      expect(await text.evaluate(node => getComputedStyle(node).fontSize)).toBe("14px");
      await expect(region.getByRole("button", { name: more, exact: true })).toBeVisible();
      await expect(region.getByText("Where things stand")).toHaveCount(0);
      const g = await geometry(page);
      expect(g.bordered).toEqual([]);
      expect(g.overlaps).toEqual([]);
      expect(g.outside).toEqual([]);
      expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
      await mkdir(evidence, { recursive: true });
      await card(page).screenshot({ path: resolve(evidence, `${doc}-${mode}-420-card.png`) });
    }
  });
}

// Review F1: the ~4-line cap is a rendered clamp. Wide-script text under the character budget, a short control, and
// the same card re-measured as the viewport narrows and widens.
const textLines = (page: Page) => card(page).locator(".hkc-output-card-text").evaluate(node => {
  const s = getComputedStyle(node);
  return Math.round(node.getBoundingClientRect().height / parseFloat(s.lineHeight));
});
for (const mode of ["light", "dark"] as const) {
  test(`text ${mode}: CJK prose under 180 characters clamps to 4 lines and offers View all; a short sentence does not`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 720 });
    await page.goto(`${fixture}?doc=cjk&mode=${mode}`);
    const region = page.getByRole("region", { name: "电动车值得买吗？" });
    expect(await textLines(page)).toBe(4);
    const viewAll = region.getByRole("button", { name: "View all", exact: true });
    await expect(viewAll).toBeVisible();
    const g = await geometry(page);
    expect(g.overlaps).toEqual([]);
    expect(g.outside).toEqual([]);
    expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
    await viewAll.click();
    expect((await callbacks(page)).viewAllOpened).toBe(1);
    await mkdir(evidence, { recursive: true });
    await card(page).screenshot({ path: resolve(evidence, `cjk-${mode}-420-card.png`) });
    await page.goto(`${fixture}?doc=short&mode=${mode}`);
    expect(await textLines(page)).toBe(1);
    await expect(card(page).getByRole("button")).toHaveCount(0);
  });
}

test("text: the clamp and the View-all row follow width changes", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto(`${fixture}?doc=cjk`);
  const viewAll = card(page).getByRole("button", { name: "View all", exact: true });
  // Wide: the CJK paragraph fits under the clamp, so nothing is hidden and there is no View all.
  expect(await textLines(page)).toBeLessThan(4);
  await expect(viewAll).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(viewAll).toBeVisible();
  expect(await textLines(page)).toBe(4);
  await page.setViewportSize({ width: 1200, height: 720 });
  await expect(viewAll).toHaveCount(0);
  expect(await textLines(page)).toBeLessThan(4);
});

test("reduced motion: numbers and text render identically (no animation on either)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${fixture}?doc=numbers`);
  const animated = await card(page).evaluate(root => [root, ...root.querySelectorAll("*")].filter(node => {
    const s = getComputedStyle(node);
    return s.animationName !== "none" || (s.transitionDuration.split(",").some(d => parseFloat(d) > 0) && !node.closest("button"));
  }).map(node => node.className));
  expect(animated).toEqual([]);
  await expect(card(page).getByRole("listitem")).toHaveCount(2);
});

// K1 (journey walk): a text block keeps its headings, paragraphs and bullets inline and in View all. Measured in a real
// browser at the inline widths, light and dark, with hostile content (CJK with no spaces, a 300-character word, RTL).
const itinerary = { header: { title: "Kyoto in 4 days", subtitle: "14–17 Oct" }, fallback_text: "Kyoto in 4 days.", blocks: [{ kind: "text", sections: [
  { heading: "Day 1 · Higashiyama", bullets: ["09:00 Kiyomizu-dera before the crowds", "12:30 Lunch on Ninenzaka", "16:00 Yasaka Shrine at dusk"] },
  { heading: "Day 2 · Arashiyama", bullets: ["08:30 Bamboo grove", "11:00 Tenryu-ji garden", "14:00 Hozu river boat"] },
  { heading: "Day 3 · Fushimi Inari", bullets: ["07:30 Walk the torii gates to Yotsutsuji", "13:00 Tofuku-ji"] }] }] };
const hostileText = { header: { title: "Hostile text" }, fallback_text: "x", blocks: [{ kind: "text", sections: [
  { heading: "京都三日游行程安排", bullets: ["公共充电设施持续增加家庭充电费用较低".repeat(4), "x".repeat(300)] },
  { heading: "مرحبا", paragraphs: ["مرحبا بالعالم، هذه فقرة قصيرة."] }] }] };
async function textSections(page: Page) {
  return card(page).locator(".hkc-output-card-sections").evaluate(root => {
    const lineHeight = parseFloat(getComputedStyle(root).lineHeight);
    const cardBox = root.closest(".hkc-output-card")!.getBoundingClientRect();
    const nodes = [...root.querySelectorAll("h3, p, li")];
    return { lines: root.getBoundingClientRect().height / lineHeight, last: nodes.at(-1)?.tagName, headings: root.querySelectorAll("h3").length,
      items: root.querySelectorAll("li").length, outside: nodes.filter(n => { const r = n.getBoundingClientRect(); return r.left < cardBox.left - .5 || r.right > cardBox.right + .5; }).length,
      marker: getComputedStyle(root.querySelector("li") ?? root).listStyleType };
  });
}
for (const mode of ["light", "dark"] as const) for (const width of [390, 420]) {
  test(`text ${mode} ${width}: headings and bullets keep their structure inline (~4 lines, never a trailing heading) and whole in View all`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const full of [false, true]) {
      for (const sent of [itinerary, hostileText]) {
        await page.goto(`${fixture}?mode=${mode}&width=${width}${full ? "&full=1" : ""}`);
        await page.evaluate(doc => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(doc), sent);
        await expect(card(page).locator(".hkc-output-card-sections")).toBeVisible();
        const facts = await textSections(page);
        expect(facts.last).not.toBe("H3");
        expect(facts.outside).toBe(0);
        expect(facts.marker).toBe("disc");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (full) {
          expect(facts.headings).toBe(sent.blocks[0].sections.length);
          await expect(card(page).getByRole("button", { name: /View all/ })).toHaveCount(0);
        } else {
          // Inline: about four lines of whole items (a wrapped item and the gaps between sections add a little).
          expect(facts.lines).toBeLessThanOrEqual(6);
          await expect(card(page).getByRole("button", { name: "View all", exact: true })).toBeVisible();
        }
        expect((await new AxeBuilder({ page }).include(".hkc-output-card").analyze()).violations).toEqual([]);
      }
    }
  });
}

// Round 2, F1: the inline budget is the RENDERED lines of the structured block, not a character estimate. Each case fits
// the contract; each must stay within maxTextLines rendered lines (plus the gaps between items) and offer View all.
const wide = "WWW WWW WWW WWW WWW WWW WWW WWW WWW WWW WWW";
const budgetCases: [string, unknown[]][] = [
  ["wide bullets", [{ bullets: Array(4).fill(wide) }]],
  ["wide paragraphs", [{ paragraphs: Array(4).fill(wide) }]],
  ["wide headings", Array(2).fill({ heading: wide, paragraphs: ["Body."] })],
  ["CJK bullets", [{ bullets: Array(4).fill("公共充电设施持续增加家庭充电费用较低公共充电") }]],
  ["RTL paragraphs", [{ paragraphs: Array(4).fill("مرحبا بالعالم، هذه فقرة طويلة بعض الشيء لتلتف على سطرين") }]],
  ["one long token", [{ heading: "Notes", paragraphs: ["x".repeat(170), "Next."] }]],
];
/** Rendered text lines of the inline block (each h3/p/li's height over its own line height), and what it shows. */
const inlineText = (page: Page) => card(page).evaluate(root => {
  const nodes = [...root.querySelectorAll(".hkc-output-card-sections :is(h3, p, li)")];
  return { lines: nodes.reduce((sum, node) => sum + Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight)), 0),
    body: nodes.filter(node => node.tagName !== "H3").map(node => node.textContent!), last: nodes.at(-1)?.tagName,
    more: !!root.querySelector(".hkc-output-card-view-all") };
});
const renderedLines = async (page: Page) => (await inlineText(page)).lines;
for (const mode of ["light", "dark"] as const) for (const width of [390, 420]) {
  test(`text ${mode} ${width}: contract-sized wide, CJK, RTL and long-token blocks stay within 4 rendered lines, View all exactly when cut`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${fixture}?mode=${mode}&width=${width}`);
    for (const [name, sections] of budgetCases) {
      await page.evaluate(doc => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(doc),
        { header: { title: name }, fallback_text: "x", blocks: [{ kind: "text", sections }] });
      await expect(card(page).getByRole("heading", { name, level: 2 })).toBeVisible();
      await expect.poll(() => renderedLines(page), { message: name }).toBeLessThanOrEqual(4);
      const facts = await inlineText(page);
      const sent = (sections as { paragraphs?: string[]; bullets?: string[] }[]).flatMap(s => [...s.paragraphs ?? [], ...s.bullets ?? []]);
      const whole = facts.body.length === sent.length && facts.body.every((text, index) => text === sent[index]);
      expect(facts.more, `${name}: View all exactly when something is left out`).toBe(!whole);
      expect(facts.last, name).not.toBe("H3");
    }
  });
}

test("text: the budget is measured again after a resize and a font-size change", async ({ page }) => {
  const sections = [{ heading: "Bring", bullets: ["Your old passport, even if it has expired", "Your NRIC"] }];
  const doc = { header: { title: "Passport" }, fallback_text: "x", blocks: [{ kind: "text", sections }] };
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto(`${fixture}?width=420`);
  await page.evaluate(d => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(d), doc);
  // At the pane width everything fits on three lines, nothing continues.
  await expect(card(page).getByRole("listitem")).toHaveCount(2);
  await expect(card(page).getByRole("button", { name: /View all/ })).toHaveCount(0);
  // Narrow the card: the first bullet wraps onto three lines, the second no longer fits and waits for View all.
  await card(page).evaluate(node => { node.style.width = "160px"; });
  await expect.poll(() => renderedLines(page)).toBeLessThanOrEqual(4);
  await expect(card(page).getByRole("listitem")).toHaveCount(1);
  await expect(card(page).getByRole("button", { name: "View all", exact: true })).toBeVisible();
  // Back to the pane width: the whole list comes back.
  await card(page).evaluate(node => { node.style.width = ""; });
  await expect(card(page).getByRole("listitem")).toHaveCount(2);
  await expect(card(page).getByRole("button", { name: /View all/ })).toHaveCount(0);
  // Larger text (the person's text size): measured again at the new font size, and the second bullet waits again.
  await card(page).evaluate(node => { (node.querySelector(".hkc-output-card-sections") as HTMLElement).style.fontSize = "40px"; });
  await expect.poll(() => renderedLines(page)).toBeLessThanOrEqual(4);
  await expect(card(page).getByRole("listitem")).toHaveCount(1);
  await expect(card(page).getByRole("button", { name: "View all", exact: true })).toBeVisible();
});

const renderBullets = async (page: Page, items: string[]) => {
  await page.waitForFunction(() => "renderOutput" in window);
  await page.evaluate(d => (window as unknown as { renderOutput: (d: unknown) => void }).renderOutput(d),
    { header: { title: "Font" }, fallback_text: "x", blocks: [{ kind: "text", sections: [{ bullets: items }] }] });
  // Fonts settled first: the card's own fonts-ready re-measure must not land later and mask what a test proves.
  await page.evaluate(() => document.fonts.ready);
};
const bodyStyle = (page: Page, prop: "fontFamily" | "fontSize", value: string) => card(page).evaluate((node, [k, v]) => {
  ((node.querySelector(".hkc-output-card-sections") as HTMLElement).style as unknown as Record<string, string>)[k] = v;
}, [prop, value] as const);
const items = (page: Page) => card(page).getByRole("listitem").allTextContents();

test("text: a font-family change at the same size re-measures the budget", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${fixture}?width=390`);
  // Narrow glyphs fit four bullets; a wider family (same size and line height) must still stay within the budget.
  await renderBullets(page, Array(4).fill("iiiiiiiiii iiiiiiiiii iiiiiiiiii iiiiiiiiii"));
  await expect(card(page).getByRole("listitem")).toHaveCount(4);
  await bodyStyle(page, "fontFamily", "monospace");
  await expect.poll(() => renderedLines(page)).toBeLessThanOrEqual(4);
  await expect(card(page).getByRole("button", { name: "View all", exact: true })).toBeVisible();
});

test("text: bullets cut away to an empty body at a large size come back when the size is restored", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${fixture}?width=390`);
  // One unbreakable word. (a) At 14px some of it fits: wait until what shows is non-empty and stable.
  await renderBullets(page, ["W".repeat(65), "Next item."]);
  await bodyStyle(page, "fontSize", "14px");
  let fitting: string[] = [];
  await expect.poll(async () => { const before = await items(page); await page.waitForTimeout(100); fitting = await items(page);
    return fitting.length > 0 && JSON.stringify(before) === JSON.stringify(fitting); }).toBe(true);
  // (b) At 28px even the first bullet waits for View all: no list items and a zero-height body, not just View all.
  await bodyStyle(page, "fontSize", "28px");
  await expect(card(page).getByRole("listitem")).toHaveCount(0);
  await expect.poll(() => card(page).evaluate(root => {
    const body = root.querySelector(".hkc-output-card-sections")!;
    return body.querySelectorAll(":is(h3, p, li)").length + body.getBoundingClientRect().height;
  })).toBe(0);
  // Settled, not just seen: let the body's own pending resize notice (to zero) land before the size is restored.
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  // (c) Back at 14px the empty body has nothing of its own to resize; the bullets that fit must still come back.
  await bodyStyle(page, "fontSize", "14px");
  await expect.poll(() => items(page)).toEqual(fitting);
});

for (const full of [false, true]) test(`text ${full ? "full" : "inline"} 390: the hidden font sample adds no horizontal scroll at 40px and keeps its natural width`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${fixture}?width=390${full ? "&full=1" : ""}`);
  await renderBullets(page, ["W".repeat(65), "Next item."]);
  await bodyStyle(page, "fontSize", "40px");
  const facts = () => page.evaluate(() => {
    const sections = document.querySelector(".hkc-output-card-sections")!, sample = document.querySelector(".hkc-output-card-sections-probe")!;
    return { scroll: document.documentElement.scrollWidth, sample: sample.getBoundingClientRect().width, body: sections.clientWidth };
  });
  await expect.poll(async () => (await facts()).sample).toBeGreaterThan(300);
  const settled = await facts();
  expect(settled.scroll, "page scroll width").toBeLessThanOrEqual(390);
  expect(settled.sample, "sample keeps its natural max-content width").toBeGreaterThan(settled.body);
});
