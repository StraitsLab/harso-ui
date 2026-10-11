import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { schemaErrors, semanticErrors } from "../../../scripts/check-output-playbook.mjs";
import schema from "../../../docs/agent/schema/output-blocks.v1.json";
import { HarsoOutputCard, type HarsoOutputBlock, type HarsoOutputCardProps, type HarsoOutputDocument, type HarsoOutputRow } from "../output-card";
import type { HarsoOutputMediaHost } from "../output-card-media";
import styles from "./commerce.css?raw";
import { family } from "./commerce";
import type { V6Template } from "./types";

// WEV-3318 (P02): price watch, compare products and product shortlist. Photos come from the host, prices and ratings
// only from the document, and a missing or failed part leaves the text, never a blank frame or a zero.

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const PW = "0192a3b4-5c6d-7e8f-9a0b-000000000709";
const artifact = (n: number) => `artifact:0192a3b4-5c6d-7e8f-9a0b-${String(n).padStart(12, "0")}`;
const photoUrl = (uri: string) => `https://files.test/${uri.slice(9)}`;
const media: HarsoOutputMediaHost = { resolveArtifact: photoUrl };
const families = { "price-watch": family, "compare-products": family, "product-shortlist": family } as const;

/** A document the agent may send: the schema and the semantic checks both pass, so the family is tested on real input. */
function valid(document: HarsoOutputDocument) {
  expect(schemaErrors(schema, document)).toEqual([]);
  expect(semanticErrors(document)).toEqual([]);
  return document;
}
const doc = (template: V6Template | undefined, blocks: HarsoOutputBlock[], extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, ...template ? { template } : {}, header: { title: "Card" }, blocks, fallback_text: "FALLBACK", as_of: "2026-10-11T02:30Z", ...extra });
function draw(document: HarsoOutputDocument, props: Partial<HarsoOutputCardProps> = {}) {
  const onViewAll = vi.fn();
  const view = render(<div className="harso-kit"><HarsoOutputCard document={document} families={families} media={media} onViewAll={onViewAll}
    renderBrand={({ domain }) => <svg data-brand={domain} />} {...props} /></div>);
  return { onViewAll, view, card: screen.getByRole("region", { name: document.header.title }) };
}

// ---- price watch ----

const watching = { kind: "status", state: "watching", detail: "since 26 Sep", subject: { page_watch_id: PW } } as const;
const turnOff = { kind: "page_watch_control", label: "Turn off", page_watch_id: PW, control: "disable" } as const;
const photo = { kind: "visual", visual: { kind: "image", artifact: artifact(1), alt: "AirPods Pro in the open case" } } as const;
const shops: HarsoOutputRow[] = [
  { id: "apple", label: "Apple", brand: "apple.com", trailing: "S$349" },
  { id: "lazada", label: "Lazada", brand: "lazada.sg", trailing: "S$339", mark: "pick" },
  { id: "shopee", label: "Shopee", brand: "shopee.sg", trailing: "S$345" },
];
const priceWatch = (rows: HarsoOutputRow[] = shops, ...before: HarsoOutputBlock[]) =>
  valid(doc("price-watch", [watching, ...before, { kind: "rows", items: rows }, { kind: "action", secondary: turnOff }], { header: { title: "AirPods Pro price watch", subtitle: "Apple, Lazada, Shopee" } }));

test("price watch: the saved photo, each shop with its mark and its price, in source order", () => {
  const { card } = draw(priceWatch(shops, photo));
  const img = card.querySelector<HTMLImageElement>(".hkc-v6-photo img")!;
  expect([img.getAttribute("src"), img.alt]).toEqual([photoUrl(artifact(1)), "AirPods Pro in the open case"]);
  const rows = [...card.querySelectorAll(".hkc-v6-shop")];
  expect(rows.map(row => row.textContent)).toEqual(["AppleS$349", "LazadaPickS$339", "ShopeeS$345"]);
  expect(rows.map(row => row.querySelector("[data-brand]")?.getAttribute("data-brand"))).toEqual(["apple.com", "lazada.sg", "shopee.sg"]);
  expect(within(card).getByText("Watching")).toBeTruthy();
  expect(within(card).getByText(/^As of /)).toBeTruthy();
});

test("a shop whose logo the host does not have gets a letter tile; a row with no brand gets no tile at all", () => {
  const { card } = draw(priceWatch([{ label: "Carousell", brand: "carousell.sg", trailing: "S$310" }, { label: "Target", trailing: "Under S$300" }]),
    { renderBrand: () => undefined });
  const [first, second] = card.querySelectorAll(".hkc-v6-shop");
  expect(first.querySelector(".hkc-v6-brand")!.textContent).toBe("C");
  expect(second.querySelector(".hkc-v6-brand")).toBeNull();
});

test("missing photo: no host URL or no photo block draws no frame, and the text stays", () => {
  for (const options of [{ media: {} }, { media: { resolveArtifact: () => undefined } }] as Partial<HarsoOutputCardProps>[]) {
    const { card, view } = draw(priceWatch(shops, photo), options);
    expect(card.querySelector(".hkc-v6-photo")).toBeNull();
    expect(within(card).getByText("Lazada")).toBeTruthy();
    view.unmount();
  }
  const { card } = draw(priceWatch());
  expect(card.querySelector(".hkc-v6-photo")).toBeNull();
});

test("failed image: the tile is marked failed and hidden by the styles, and every word is still there", () => {
  const { card } = draw(priceWatch(shops, photo));
  fireEvent.error(card.querySelector(".hkc-v6-photo img")!);
  expect(card.querySelector(".hkc-v6-photo [data-state=failed]")).not.toBeNull();
  expect(styles).toMatch(/\.hkc-v6-photo \[data-state="failed"\][^{]*\{[^}]*display: none/);
  expect(within(card).getByText("AirPods Pro price watch")).toBeTruthy();
  expect(within(card).getByText("S$339")).toBeTruthy();
});

test("a price the source did not give is nothing: no zero, no empty price, the other shops unchanged", () => {
  const { card } = draw(priceWatch([{ label: "Apple", brand: "apple.com" }, { label: "Lazada", brand: "lazada.sg", trailing: "S$339" }]));
  const [apple, lazada] = card.querySelectorAll(".hkc-v6-shop");
  expect(apple.textContent).toBe("Apple");
  expect(apple.querySelector(".hkc-v6-price")).toBeNull();
  expect(lazada.querySelector(".hkc-v6-price")!.textContent).toBe("S$339");
  expect(card.textContent).not.toMatch(/\$0\b/);
});

test("Turn off calls the host once with the exact page-watch ID and no other control", () => {
  const onPageWatchControl = vi.fn(), onRoutineControl = vi.fn(), onWorkControl = vi.fn();
  const { card } = draw(priceWatch(), { onPageWatchControl, onRoutineControl, onWorkControl });
  fireEvent.click(within(card).getByRole("button", { name: "Turn off" }));
  expect(onPageWatchControl).toHaveBeenCalledExactlyOnceWith("disable", PW);
  expect(onRoutineControl).not.toHaveBeenCalled();
  expect(onWorkControl).not.toHaveBeenCalled();
});

test("Turn off shows only the state the host confirmed: a click alone changes nothing, the host's word replaces it", () => {
  let live: { word: string; meaning: "done" | "in_progress" } | undefined;
  const subjectState = vi.fn(() => live);
  const { card, view } = draw(priceWatch(), { onPageWatchControl: vi.fn(), subjectState });
  fireEvent.click(within(card).getByRole("button", { name: "Turn off" }));
  expect(within(card).getByText("Watching")).toBeTruthy();
  expect(within(card).getByRole("button", { name: "Turn off" })).toBeTruthy();
  expect(subjectState).toHaveBeenCalledWith({ page_watch_id: PW });
  live = { word: "Turned off", meaning: "done" };
  view.rerender(<div className="harso-kit"><HarsoOutputCard document={priceWatch()} families={families} media={media} onViewAll={() => {}}
    onPageWatchControl={vi.fn()} subjectState={subjectState} /></div>);
  expect(within(card).getByText("Turned off")).toBeTruthy();
  expect(within(card).queryByText("Watching")).toBeNull();
  // Whether the control is still offered is the host's call (it drops the action once it cannot act); the family adds no state of its own.
  expect(within(card).getByRole("button", { name: "Turn off" })).toBeTruthy();
});

test("without the host callback Turn off is not drawn", () => {
  const { card } = draw(priceWatch(), { onRoutineControl: vi.fn() });
  expect(within(card).queryByRole("button", { name: "Turn off" })).toBeNull();
  expect(card.querySelector("[data-slot=trailing]")).toBeNull();
});

// ---- compare products ----

const columns = [{ label: "Camera" }, { label: "iPhone 17", thumbnail: { artifact: artifact(11), alt: "iPhone 17, back" } }, { label: "Pixel 11", thumbnail: { artifact: artifact(12), alt: "Pixel 11, back" } }];
const compare = (rows: { cells: string[]; winner?: number }[], cols = columns) =>
  valid(doc("compare-products", [{ kind: "table", columns: cols, rows }], { header: { title: "iPhone 17 vs Pixel 11" } }));
const sample = [{ cells: ["Price", "S$1,299", "S$1,249"], winner: 2 }, { cells: ["Zoom", "2x optical", "5x optical"], winner: 2 }, { cells: ["Video", "4K 120 fps", "4K 60 fps"], winner: 1 }, { cells: ["Weight", "177 g", "186 g"] }];
const marked = (card: HTMLElement) => [...card.querySelectorAll("tbody tr")].map(row => [...row.children].findIndex(cell => cell.querySelector(".hkc-v6-winner")));

test("compare: one photo per product column, in the header, with the criteria column left bare", () => {
  const { card } = draw(compare(sample));
  const head = [...card.querySelectorAll("thead th")];
  expect(head.map(cell => cell.textContent)).toEqual(["Camera", "iPhone 17", "Pixel 11"]);
  expect(head.map(cell => cell.querySelector("img")?.getAttribute("src") ?? null)).toEqual([null, photoUrl(artifact(11)), photoUrl(artifact(12))]);
});

test("compare: the winner mark sits in the winning column's cell, says so in words, and a row with no winner has none", () => {
  const { card } = draw(compare(sample));
  expect(marked(card)).toEqual([2, 2, 1, -1]);
  const cell = card.querySelectorAll("tbody tr")[0].children[2];
  expect(cell.textContent).toContain("S$1,249");
  expect(within(cell as HTMLElement).getByText("Best")).toBeTruthy();
});

test("compare: the winner follows the column it names when the columns change order", () => {
  const swapped = compare(sample.map(row => ({ cells: [row.cells[0], row.cells[2], row.cells[1]], ...row.winner ? { winner: 3 - row.winner } : {} })),
    [columns[0], columns[2], columns[1]]);
  const { card } = draw(swapped);
  const head = [...card.querySelectorAll("thead th")].map(cell => cell.textContent);
  const winning = [...card.querySelectorAll("tbody tr")].map(row => head[[...row.children].findIndex(cell => cell.querySelector(".hkc-v6-winner"))] ?? null);
  expect(winning).toEqual(["Pixel 11", "Pixel 11", "iPhone 17", null]);
});

test("compare: the criteria column can never win, and a winner outside the columns is ignored", () => {
  const bad = { ...compare(sample), blocks: [{ kind: "table", columns, rows: [{ cells: ["Price", "S$1,299", "S$1,249"], winner: 0 }, { cells: ["Zoom", "2x", "5x"], winner: 7 }] }] } as HarsoOutputDocument;
  const { card } = draw(bad);
  expect(card.querySelector(".hkc-v6-winner")).toBeNull();
  expect(within(card).getByText("S$1,299")).toBeTruthy();
});

test("compare: a missing or failed column photo keeps the column's name and its cells", () => {
  const { card, view } = draw(compare(sample), { media: {} });
  expect(card.querySelector("thead img")).toBeNull();
  expect(card.querySelector(".hkc-v6-photo")).toBeNull();
  expect([...card.querySelectorAll("thead th")].map(cell => cell.textContent)).toEqual(["Camera", "iPhone 17", "Pixel 11"]);
  view.unmount();
  const again = draw(compare(sample));
  fireEvent.error(again.card.querySelector("thead img")!);
  expect(again.card.querySelectorAll("thead [data-state=failed]")).toHaveLength(1);
  expect(within(again.card).getByText("iPhone 17")).toBeTruthy();
});

test("compare: a price cell the source left blank stays blank, never 0", () => {
  // The contract refuses an empty cell, so this is a host handing the card a malformed document: it still draws no zero.
  const raw = { ...compare(sample), blocks: [{ kind: "table", columns, rows: [{ cells: ["Price", "", "S$1,249"] }] }] } as HarsoOutputDocument;
  const { card } = draw(raw);
  expect(card.querySelectorAll("tbody td")[0].textContent).toBe("");
  expect(card.textContent).not.toMatch(/\$0\b/);
});

test("compare: the totals row and a status word on a criterion are kept", () => {
  const withTotals = valid(doc("compare-products", [{ kind: "table", columns, rows: [{ cells: ["Price", "S$1,299", "S$1,249"], status: "done", status_label: "Cheaper" }], totals: { cells: ["Total", "S$1,299", "S$1,249"] } }]));
  const { card } = draw(withTotals);
  expect(card.querySelector("tfoot")!.textContent).toBe("TotalS$1,299S$1,249");
  expect(within(card).getByText("Cheaper")).toBeTruthy();
});

// ---- product shortlist ----

const URL_A = "https://shop.example/dyson-v8-origin", URL_B = "https://shop.example/xiaomi-g11";
const vacuums: HarsoOutputRow[] = [
  { id: "dyson", label: "Dyson V8 Origin", secondary: "72 dB · 40 min", trailing: "S$379", mark: "pick", rating: "4.6", review_count: 12394, action: { kind: "open_url", label: "Open at Courts", url: URL_A }, thumbnail: { artifact: artifact(21), alt: "Dyson V8 Origin" } },
  { id: "xiaomi", label: "Xiaomi G11", secondary: "74 dB · 60 min", trailing: "S$299", rating: "4.4", action: { kind: "open_url", label: "Open at Lazada", url: URL_B }, thumbnail: { artifact: artifact(22), alt: "Xiaomi G11" } },
  { id: "samsung", label: "Samsung Jet 60", secondary: "76 dB · 40 min", thumbnail: { artifact: artifact(23), alt: "Samsung Jet 60" } },
];
const shortlist = (rows = vacuums) => valid(doc("product-shortlist", [{ kind: "rows", items: rows }], { header: { title: "Quiet stick vacuums" } }));
const items = (card: HTMLElement) => [...card.querySelectorAll<HTMLElement>(".hkc-v6-product")];

test("shortlist: photo, name, price and the pick mark per row, in source order", () => {
  const { card } = draw(shortlist());
  expect(items(card).map(item => item.querySelector(".hkc-v6-product-name")!.textContent)).toEqual(["Dyson V8 Origin", "Xiaomi G11", "Samsung Jet 60"]);
  expect(items(card).map(item => item.querySelector("img")!.getAttribute("src"))).toEqual([21, 22, 23].map(n => photoUrl(artifact(n))));
  expect(items(card)[0].querySelector(".hkc-v6-price")!.textContent).toBe("S$379");
  expect(within(items(card)[0]).getByText("Pick")).toBeTruthy();
  expect(items(card)[2].querySelector(".hkc-v6-price")).toBeNull();
  expect(items(card)[2].textContent).not.toMatch(/\b0\b/);
});

test("shortlist: stars follow the rating, say it in words, and a row without a rating draws none", () => {
  const { card } = draw(shortlist());
  const [dyson, xiaomi, samsung] = items(card);
  const stars = dyson.querySelector<HTMLElement>(".hkc-v6-stars > span")!;
  expect(stars.getAttribute("style")).toContain("92%");
  expect(dyson.querySelector(".hkc-v6-rating")!.getAttribute("aria-label")).toBe("Rated 4.6 out of 5, 12,394 reviews");
  expect(dyson.querySelector(".hkc-v6-rating")!.textContent).toBe("4.6(12,394)");
  expect(xiaomi.querySelector(".hkc-v6-rating")!.getAttribute("aria-label")).toBe("Rated 4.4 out of 5");
  expect(xiaomi.querySelector<HTMLElement>(".hkc-v6-stars > span")!.getAttribute("style")).toContain("88%");
  expect(samsung.querySelector(".hkc-v6-rating")).toBeNull();
});

test("shortlist: a review count with no rating, or a rating outside 0-5, draws no stars", () => {
  // The contract refuses the first two; a host may still hand them over, and the card draws no stars for them.
  const { card } = draw({ ...shortlist(), blocks: [{ kind: "rows", items: [{ label: "A", review_count: 40 }, { label: "B", rating: "5.5" }, { label: "C", rating: "0" }] }] });
  const [a, b, c] = items(card);
  expect(a.querySelector(".hkc-v6-rating")).toBeNull();
  expect(b.querySelector(".hkc-v6-rating")).toBeNull();
  expect(c.querySelector(".hkc-v6-rating")!.getAttribute("aria-label")).toBe("Rated 0 out of 5");
});

test("shortlist: a row opens its exact listing once, through the host, and not the card", () => {
  const onOpenUrl = vi.fn();
  const { card, onViewAll } = draw(shortlist(), { onOpenUrl });
  fireEvent.click(within(items(card)[1]).getByRole("button", { name: "Xiaomi G11, Open at Lazada" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith(URL_B);
  expect(onViewAll).not.toHaveBeenCalled();
});

test("shortlist: no host callback, no link, or a link that is not https draws a plain row, never a dead button", () => {
  const { card, view } = draw(shortlist(), {});
  expect(items(card).flatMap(item => [...item.querySelectorAll("button")])).toHaveLength(0);
  view.unmount();
  const insecure = shortlist([{ label: "Plain", action: { kind: "open_url", label: "Open", url: "https://shop.example/x" } }]);
  const bad = { ...insecure, blocks: [{ kind: "rows", items: [{ label: "Plain", action: { kind: "open_url", label: "Open", url: "http://shop.example/x" } }] }] } as HarsoOutputDocument;
  const again = draw(bad, { onOpenUrl: vi.fn() });
  expect(items(again.card).flatMap(item => [...item.querySelectorAll("button")])).toHaveLength(0);
  expect(within(again.card).getByText("Plain")).toBeTruthy();
});

test("shortlist: a failed row photo leaves the row text, a missing host leaves no photo box", () => {
  const { card, view } = draw(shortlist());
  fireEvent.error(items(card)[0].querySelector("img")!);
  expect(items(card)[0].querySelector("[data-state=failed]")).not.toBeNull();
  expect(within(items(card)[0]).getByText("Dyson V8 Origin")).toBeTruthy();
  view.unmount();
  const none = draw(shortlist(), { media: {} });
  expect(none.card.querySelector(".hkc-v6-photo")).toBeNull();
  expect(items(none.card)).toHaveLength(3);
});

test("shortlist: rows the document did not send are said once, not hidden", () => {
  const more = { ...shortlist(), blocks: [{ kind: "rows", items: vacuums, total_count: 9 }] } as HarsoOutputDocument;
  const { card } = draw(more);
  expect(within(card).getByText("Showing 3 of 9")).toBeTruthy();
  expect(card.textContent).not.toContain("Showing 3 of 3");
});

// ---- fallback, widgets, interactive layout ----

test("a document the family cannot draw whole falls back to the generic card", () => {
  const extra = { ...priceWatch(), blocks: [...priceWatch().blocks, { kind: "numbers", items: [{ value: "S$339", label: "Now" }] }] } as HarsoOutputDocument;
  const { card } = draw(extra);
  expect(card.querySelector(".hkc-v6-shop")).toBeNull();
  expect(within(card).getByText("Now")).toBeTruthy();
  cleanup();
  const noRows = draw(doc("price-watch", [watching]));
  expect(noRows.card.querySelector(".hkc-v6-shop")).toBeNull();
  cleanup();
  const blank = draw(doc("price-watch", [{ kind: "rows", items: shops }]), { blockStates: { 0: { state: "failed", message: "Couldn’t load this" } } });
  expect(blank.card.querySelector(".hkc-v6-shop")).toBeNull();
});

test("no template hint draws the generic card; only price watch has widget sizes", () => {
  const { card } = draw(doc(undefined, [{ kind: "rows", items: shops }]));
  expect(card.querySelector(".hkc-v6-shop")).toBeNull();
  expect(family.supportedWidgetSizes("price-watch")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("compare-products")).toEqual([]);
  expect(family.supportedWidgetSizes("product-shortlist")).toEqual([]);
});

test("compare and shortlist draw nothing at a widget size; price watch draws small and medium, with no control", () => {
  // The generic card draws instead, so none of the family's own markup is there.
  expect(draw(compare(sample), { widgetSize: "small" }).card.querySelector(".hkc-v6-compare, .hkc-v6-winner")).toBeNull();
  cleanup();
  expect(draw(shortlist(), { widgetSize: "medium" }).card.querySelector(".hkc-v6-product")).toBeNull();
  cleanup();
  const onViewAll = vi.fn(), onPageWatchControl = vi.fn();
  const small = draw(priceWatch(shops, photo), { widgetSize: "small", onViewAll, onPageWatchControl });
  expect(small.card.querySelector("[data-widget]")!.getAttribute("data-widget")).toBe("small");
  expect(small.card.querySelector("img")!.getAttribute("src")).toBe(photoUrl(artifact(1)));
  expect(within(small.card).getByText("S$339")).toBeTruthy();
  expect(within(small.card).getByText("Lazada")).toBeTruthy();
  expect(within(small.card).queryByRole("button", { name: "Turn off" })).toBeNull();
  expect(small.card.querySelectorAll("button")).toHaveLength(1);
  fireEvent.click(within(small.card).getByRole("button", { name: "AirPods Pro price watch" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
  expect(onPageWatchControl).not.toHaveBeenCalled();
  cleanup();
  const medium = draw(priceWatch(shops, photo), { widgetSize: "medium" });
  expect([...medium.card.querySelectorAll(".hkc-v6-price")].map(node => node.textContent)).toEqual(["S$349", "S$339", "S$345"]);
});

test("a small widget with no sourced price shows the title and the snapshot time, and no price", () => {
  const { card } = draw(priceWatch([{ label: "Lazada", brand: "lazada.sg" }]), { widgetSize: "small" });
  expect(card.querySelector(".hkc-v6-price")).toBeNull();
  expect(within(card).getByText(/^As of /)).toBeTruthy();
});

test.each([
  ["price watch", () => draw(priceWatch(shops, photo), { onPageWatchControl: vi.fn() })],
  ["compare", () => draw(compare(sample))],
  ["shortlist", () => draw(shortlist(), { onOpenUrl: vi.fn() })],
  ["widget", () => draw(priceWatch(shops, photo), { widgetSize: "medium" })],
])("%s: no pressable sits inside another, each has a name, and axe finds no violation", async (_name, make) => {
  const { view, card } = make();
  for (const target of card.querySelectorAll("button, a[href]")) {
    expect(target.parentElement!.closest("button, a[href]")).toBeNull();
    expect((target.textContent ?? "").trim() || target.getAttribute("aria-label")).toBeTruthy();
  }
  const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

// ---- styles ----

test("styles: tokens only, no !important, 44px targets on touch, a visible focus ring, light and dark safe", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  expect(normal).not.toMatch(/prefers-color-scheme/);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-v6-open-row[^}]*min-height: 44px/);
  expect(source).toMatch(/hkc-v6-open-row:focus-visible/);
});
