import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputCardProps, type HarsoOutputDocument, type HarsoOutputRow } from "../output-card";
import theme from "../../theme.css?raw";
import styles from "./finance.css?raw";
import { family } from "./finance";
import type { V6ChartRange, V6Registry, WidgetSize } from "./types";

// WEV-3317 (P01): the money cards. Stock, bills and subscriptions draw from the document's own fields: a brand mark,
// a signed change, the chart's own range and baseline, and each row's status and date. A missing fact is left out.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const families: V6Registry = { "stock-quote": family, "bills-due": family, subscriptions: family };
const AS_OF = "2026-09-25T20:00Z";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}

const LABELS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const VALUES = ["234.2", "235.9", "236.4", "237.1", "237.8", "238.1", "238.4"];
interface StockOptions { delta?: string; range?: V6ChartRange; baseline?: string; brand?: string; values?: (string | null)[]; chart?: boolean }
const stock = ({ delta = "+1.8%", range, baseline, brand = "apple.com", values = VALUES, chart = true }: StockOptions = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "stock-quote",
  header: { title: "Apple · AAPL", subtitle: "Nasdaq", ...(brand ? { brand } : {}) },
  blocks: [
    { kind: "numbers", items: [{ value: "US$238.40", label: "Close", ...(delta ? { delta } : {}) }] },
    ...(chart ? [{ kind: "visual" as const, visual: { kind: "chart" as const, chart: "line" as const, ticker: "AAPL", unit: "US$", x_labels: LABELS, series: [{ label: "Display label", values }], ...(range ? { range } : {}), ...(baseline ? { baseline } : {}) } }] : []),
  ],
  details: { sources: [{ label: "Nasdaq closing price" }], disclaimers: ["Not financial advice."] },
  as_of: AS_OF, fallback_text: "FALLBACK",
});

const bills = (rows: HarsoOutputRow[], extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "bills-due", header: { title: "Bills due this week", subtitle: "21–27 Sep" },
  blocks: [{ kind: "rows", items: rows }], as_of: AS_OF, fallback_text: "FALLBACK", ...extra,
});
const subs = (rows: HarsoOutputRow[], extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "subscriptions", header: { title: "Subscriptions", subtitle: "6 found" },
  blocks: [{ kind: "numbers", items: [{ value: "S$98.47", label: "Total" }, { value: "6", label: "Subscriptions" }] }, { kind: "rows", items: rows }],
  as_of: AS_OF, fallback_text: "FALLBACK", ...extra,
});
// Deliberately not sorted by amount, date or name: the source order is the answer.
const BILLS: HarsoOutputRow[] = [
  { id: "b-sp", label: "SP Group electricity", secondary: "Was due 21 Sep", trailing: "S$212.40", status: "overdue", brand: "spgroup.com.sg" },
  { id: "b-st", label: "Singtel Fibre", secondary: "Due 25 Sep · Autopay", trailing: "S$49.90", brand: "singtel.com" },
  { id: "b-ge", label: "Great Eastern", secondary: "Due 27 Sep · Autopay", trailing: "S$224.10", status: "paid", brand: "greateasternlife.com" },
];
const SUBS: HarsoOutputRow[] = [
  { id: "s-chat", label: "ChatGPT Plus", secondary: "Renews 4 Oct · DBS card", trailing: "S$27.50", brand: "chatgpt.com" },
  { id: "s-net", label: "Netflix", secondary: "Renews 21 Oct · DBS card", trailing: "S$25.98", brand: "netflix.com" },
  { id: "s-dis", label: "Disney+", secondary: "Renews 12 Oct · OCBC card", trailing: "S$16.98", brand: "disneyplus.com" },
];

function draw(document: HarsoOutputDocument, props: Partial<HarsoOutputCardProps> & { appearance?: "dark" | "light" } = {}) {
  const { appearance, ...rest } = props;
  const onViewAll = vi.fn();
  const view = render(<div className="harso-kit" data-mode={appearance}>
    <HarsoOutputCard document={document} onViewAll={onViewAll} families={families} {...rest} />
  </div>);
  return { view, onViewAll, root: view.container, card: view.container.querySelector<HTMLElement>(".hkc-v6-frame") };
}
const change = (root: HTMLElement) => root.querySelector<HTMLElement>(".hkc-fin-change");
const tiles = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(".hkc-fin-row .hkc-v6-brand")];
const rowIds = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(".hkc-fin-row")].map(row => row.dataset.rowId);
const points = (path: Element) => [...(path.getAttribute("d") ?? "").matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }));

// ---- stock: signed change ----

test("stock: an up change is green, a down change is red, a zero change is grey, and each says so in words", () => {
  const cases = [["+1.8%", "up", "Up"], ["−2.3%", "down", "Down"], ["-2.3%", "down", "Down"], ["0.00%", "flat", "Unchanged"], ["+0.0%", "flat", "Unchanged"]] as const;
  for (const [delta, direction, word] of cases) {
    const { root, view } = draw(stock({ delta, range: "1D" }));
    const node = change(root)!;
    expect(node.dataset.direction, delta).toBe(direction);
    expect(node.textContent).toContain(delta);
    expect(within(node).getByText(word, { exact: false }).classList.contains("hk-sr-only")).toBe(true);
    // The sparkline takes the same tone as the change, from the same field.
    expect(root.querySelector<SVGElement>("svg.hkc-fin-spark")!.dataset.direction).toBe(direction);
    view.unmount();
  }
});

test("stock: a change with no sign has no direction, and one with no digits or no value is left out", () => {
  const unsigned = draw(stock({ delta: "1.8%" }));
  expect(change(unsigned.root)!.dataset.direction).toBe("none");
  expect(change(unsigned.root)!.querySelector(".hk-sr-only")).toBeNull();
  unsigned.view.unmount();
  for (const delta of ["n/a", ""]) {
    const { root, view } = draw(stock({ delta }));
    expect(change(root), `delta "${delta}"`).toBeNull();
    expect(root.textContent).toContain("US$238.40");
    expect(root.querySelector<SVGElement>("svg.hkc-fin-spark")!.dataset.direction).toBe("none");
    view.unmount();
  }
});

test("stock: the price, the brand mark from the host and the snapshot time are drawn; the change is never rebuilt from other numbers", () => {
  const renderBrand = vi.fn(() => <svg data-testid="apple-mark" />);
  const { root, card } = draw(stock({ delta: "", brand: "apple.com" }), { renderBrand });
  expect(renderBrand).toHaveBeenCalledWith({ domain: "apple.com", label: "Apple · AAPL" });
  expect(within(card!).getByTestId("apple-mark")).toBeTruthy();
  expect(within(card!).getByText("US$238.40")).toBeTruthy();
  expect(within(card!).getByText(/^As of /)).toBeTruthy();
  expect(change(root)).toBeNull(); // the series rose, but the document gave no change, so none is drawn
});

// ---- missing logo ----

test("missing logo: no brand on the header draws no mark; a host with no mark gets a letter tile and the name stays in the text", () => {
  const none = draw(stock({ brand: "" }));
  expect(none.root.querySelector(".hkc-v6-header .hkc-v6-brand")).toBeNull();
  expect(none.root.textContent).toContain("Apple · AAPL");
  none.view.unmount();
  const declined = draw(stock(), { renderBrand: () => undefined });
  const tile = declined.root.querySelector<HTMLElement>(".hkc-v6-header .hkc-v6-brand")!;
  expect(tile.dataset.mark).toBe("letter");
  expect(tile.textContent).toBe("A");
  expect(tile.getAttribute("aria-hidden")).toBe("true");
});

test("missing logo: a bill row with no brand draws a letter tile and never asks the host; one with a brand asks once", () => {
  const renderBrand = vi.fn(({ domain }: { domain: string }) => domain === "singtel.com" ? <svg data-testid="singtel" /> : undefined);
  const rows: HarsoOutputRow[] = [{ id: "x", label: "Landlord", trailing: "S$2,400" }, BILLS[1]];
  const { root } = draw(bills(rows), { renderBrand });
  expect(renderBrand.mock.calls.map(call => call[0])).toEqual([{ domain: "singtel.com", label: "Singtel Fibre" }]);
  const [first, second] = tiles(root);
  expect(first.dataset.mark).toBe("letter");
  expect(first.textContent).toBe("L");
  expect(second.dataset.mark).toBe("host");
  expect(within(second).getByTestId("singtel")).toBeTruthy();
});

test("logos never come from the network: no image, no request", () => {
  const fetch = vi.fn(), open = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("XMLHttpRequest", class { constructor() { open(); } });
  const { root } = draw(bills(BILLS.map(row => ({ ...row, brand: "https://evil.example/x.png" } as HarsoOutputRow))));
  expect(root.querySelectorAll("img")).toHaveLength(0);
  expect(tiles(root).every(tile => tile.dataset.mark === "letter")).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
});

// ---- chart range and baseline ----

test("missing range with a baseline: the baseline is drawn and no range is named, not even a default one", () => {
  const { root } = draw(stock({ baseline: "236.1" }));
  expect(root.querySelector("line.hkc-fin-baseline")).not.toBeNull();
  expect(root.querySelector(".hkc-fin-prev")!.textContent).toBe("Previous close US$236.1");
  expect(root.querySelector(".hkc-fin-range")).toBeNull();
  for (const text of ["1D", "1W", "1M", "1Y"]) expect(within(root).queryByText(text)).toBeNull();
});

test("a range other than one day does not call the baseline a previous close", () => {
  const { root } = draw(stock({ range: "1W", baseline: "230.5" }));
  expect(root.querySelector(".hkc-fin-prev")!.textContent).toBe("Baseline US$230.5");
});

test("missing range: no range label is drawn, and no range control at all", () => {
  const { root } = draw(stock());
  expect(root.querySelector(".hkc-fin-range")).toBeNull();
  expect(root.querySelector(".hkc-fin-chartnote")).toBeNull(); // not even an empty line
  for (const text of ["1D", "1W", "1M", "1Y"]) expect(within(root).queryByText(text)).toBeNull();
  // The only control is the title (open target); nothing for a range, and Details waits in the opened card (V6).
  expect(within(root).getAllByRole("button").map(button => button.textContent?.trim())).toEqual(["Apple · AAPL"]);
  expect(within(root).queryAllByRole("tab")).toHaveLength(0);
});

test("range present: exactly the supplied range is named, as plain text that is not a control", () => {
  for (const range of ["1D", "1W", "1M", "1Y"] as const) {
    const { root, view } = draw(stock({ range }));
    const label = root.querySelector<HTMLElement>(".hkc-fin-range")!;
    expect(label.textContent).toBe(range);
    expect(label.closest("button, [role=button], [role=tab]")).toBeNull();
    for (const other of ["1D", "1W", "1M", "1Y"].filter(text => text !== range)) expect(within(root).queryByText(other)).toBeNull();
    expect(within(root).getAllByRole("button")).toHaveLength(1);
    view.unmount();
  }
});

test.each(["inline", "full"] as const)("%s range replies carry the exact ticker and leave the saved chart selected on failure", mode => {
  const document = deepFreeze(stock({ range: "1D", baseline: "234.17" }));
  const onReply = vi.fn(); // No new answer arrives (e.g. the normal chat read fails).
  const { root } = draw(document, { mode, onReply });
  const before = root.querySelector("svg.hkc-fin-spark")!.outerHTML;
  const group = within(root).getByRole("group", { name: "Stock chart range" });
  for (const range of ["1W", "1M", "1Y"]) {
    fireEvent.click(within(group).getByRole("button", { name: range }));
    expect(onReply).toHaveBeenLastCalledWith(`Show the AAPL stock chart for ${range}.`);
    expect(within(group).getByRole("button", { name: "1D" }).getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("svg.hkc-fin-spark")!.outerHTML).toBe(before);
  }
  expect(onReply).toHaveBeenCalledTimes(3);
});

test("range replies use the chart ticker, never title parsing, and reject unsafe or missing identity", () => {
  for (const ticker of ["BRK-B", "^GSPC", "1234567890ABCDEF", "Apple Inc.", "AAPL; buy", "AAPL\n", "", undefined]) {
    const document = stock({ range: "1W" });
    document.header.title = "A different title";
    const chart = document.blocks[1] as { visual: { ticker?: string } };
    chart.visual.ticker = ticker;
    const onReply = vi.fn();
    const { root, view } = draw(document, { onReply });
    const valid = ticker !== undefined && ["BRK-B", "^GSPC", "1234567890ABCDEF"].includes(ticker);
    expect(within(root).queryAllByRole("group", { name: "Stock chart range" })).toHaveLength(valid ? 1 : 0);
    if (valid) {
      fireEvent.click(within(root).getByRole("button", { name: "1Y" }));
      expect(onReply).toHaveBeenCalledWith(`Show the ${ticker} stock chart for 1Y.`);
    }
    view.unmount();
  }
});

test("range replies reject malformed runtime ticker and range values without guessing identity", () => {
  const invalid: { ticker: unknown; range: unknown }[] = [
    { ticker: 123, range: "1D" }, { ticker: true, range: "1D" }, { ticker: {}, range: "1D" },
    { ticker: "AAPL", range: "5Y" }, { ticker: "AAPL", range: "1d" },
    { ticker: "AAPL", range: "1D\n" }, { ticker: "AAPL", range: 1 },
  ];
  for (const values of invalid) {
    const document = stock({ range: "1D" });
    Object.assign((document.blocks[1] as { visual: object }).visual, values);
    const onReply = vi.fn();
    const { root, view } = draw(document, { onReply });
    expect(within(root).queryByRole("group", { name: "Stock chart range" })).toBeNull();
    expect(onReply).not.toHaveBeenCalled();
    expect(root.querySelector("svg.hkc-fin-spark")).not.toBeNull();
    view.unmount();
  }
});

test("range replies are absent on widgets and without a range or reply sender", () => {
  for (const props of [{}, { widgetSize: "large" as const, onReply: vi.fn() }]) {
    const { root, view } = draw(stock({ range: "1D" }), props);
    expect(within(root).queryByRole("group", { name: "Stock chart range" })).toBeNull();
    view.unmount();
  }
  const { root } = draw(stock(), { onReply: vi.fn() });
  expect(within(root).queryByRole("group", { name: "Stock chart range" })).toBeNull();
});

test("exact baseline: the dashed line sits at the supplied decimal and the label says it digit for digit", () => {
  const baseline = "236.123456";
  const { root } = draw(stock({ baseline, range: "1D" }));
  const line = root.querySelector<SVGLineElement>("svg.hkc-fin-spark line.hkc-fin-baseline")!;
  expect(line.dataset.value).toBe(baseline);
  expect(line.getAttribute("stroke-dasharray")).toBeTruthy();
  expect(root.querySelector(".hkc-fin-prev")!.textContent).toBe("Previous close US$236.123456");
  // Not rebuilt from the +1.8% figure: 238.40 / 1.018 would be about 234.18.
  expect(root.textContent).not.toMatch(/234\.1/);
  const ys = points(root.querySelector("svg.hkc-fin-spark path.hkc-fin-line")!).map(point => point.y);
  const y = Number(line.getAttribute("y1"));
  expect(line.getAttribute("y2")).toBe(String(y));
  expect(y).toBeGreaterThan(Math.min(...ys));
  expect(y).toBeLessThan(Math.max(...ys));
});

test("exact baseline: the digits are kept as sent, a trailing zero included", () => {
  const { root } = draw(stock({ baseline: "236.10", range: "1D" }));
  expect(root.querySelector("line.hkc-fin-baseline")!.getAttribute("data-value")).toBe("236.10");
  expect(root.querySelector(".hkc-fin-prev")!.textContent).toBe("Previous close US$236.10");
});

test("exact baseline: a baseline outside the data is still drawn, on the right side of every point", () => {
  const above = draw(stock({ baseline: "240" }));
  const ysAbove = points(above.root.querySelector("path.hkc-fin-line")!).map(point => point.y);
  const yAbove = Number(above.root.querySelector("line.hkc-fin-baseline")!.getAttribute("y1"));
  expect(yAbove).toBeLessThan(Math.min(...ysAbove)); // higher on the card than the whole line
  expect(yAbove).toBeGreaterThanOrEqual(0);
  above.view.unmount();
  const below = draw(stock({ baseline: "230" }));
  const ysBelow = points(below.root.querySelector("path.hkc-fin-line")!).map(point => point.y);
  const yBelow = Number(below.root.querySelector("line.hkc-fin-baseline")!.getAttribute("y1"));
  expect(yBelow).toBeGreaterThan(Math.max(...ysBelow));
  expect(yBelow).toBeLessThanOrEqual(Number(below.root.querySelector("svg.hkc-fin-spark")!.getAttribute("viewBox")!.split(" ")[3]));
});

test("no baseline: no dashed line and no previous-close text, and the series is drawn as given", () => {
  const { root } = draw(stock());
  expect(root.querySelector("line.hkc-fin-baseline")).toBeNull();
  expect(root.querySelector(".hkc-fin-prev")).toBeNull();
  expect(points(root.querySelector("path.hkc-fin-line")!)).toHaveLength(VALUES.length);
});

test("a gap in the series is a gap in the line, never a zero", () => {
  const { root } = draw(stock({ values: ["234.2", "235.9", null, "237.1", "237.8", "238.1", "238.4"] }));
  const d = root.querySelector("path.hkc-fin-line")!.getAttribute("d")!;
  expect(d.match(/M/g)).toHaveLength(2);
  expect(points(root.querySelector("path.hkc-fin-line")!)).toHaveLength(6);
});

// ---- bills and subscriptions ----

test("bills: each row has its mark, amount, due text and status word; source order and ids are kept", () => {
  const document = deepFreeze(bills(BILLS));
  const { root } = draw(document, { renderBrand: ({ domain }) => <svg data-testid={`mark-${domain}`} /> });
  expect(rowIds(root)).toEqual(["b-sp", "b-st", "b-ge"]);
  const rows = [...root.querySelectorAll<HTMLElement>(".hkc-fin-row")];
  expect(within(rows[0]).getByTestId("mark-spgroup.com.sg")).toBeTruthy();
  expect(within(rows[0]).getByText("S$212.40")).toBeTruthy();
  expect(within(rows[0]).getByText("Was due 21 Sep")).toBeTruthy();
  expect(within(rows[0]).getByText("Overdue")).toBeTruthy();
  expect(within(rows[1]).getByText("Due 25 Sep · Autopay")).toBeTruthy();
  expect(within(rows[1]).queryByText("Overdue")).toBeNull();
  expect(within(rows[2]).getByText("Paid")).toBeTruthy();
});

test("bills: a row with no due date has none drawn, and a row with an exact due_at but no words gets its date from the instant", () => {
  const { root } = draw(bills([
    { id: "a", label: "Water", trailing: "S$31.20" },
    { id: "b", label: "Gas", trailing: "S$20.00", due_at: "2026-09-25T04:00Z" },
  ]));
  const [water, gas] = [...root.querySelectorAll<HTMLElement>(".hkc-fin-row")];
  expect(water.querySelector(".hkc-fin-when")).toBeNull();
  expect(water.textContent).not.toMatch(/due/i);
  const time = gas.querySelector<HTMLTimeElement>("time")!;
  expect(time.dateTime).toBe("2026-09-25T04:00Z");
  expect(time.textContent).toBe("Due 25 Sep");
});

test("a due_at is read as the UTC day it names, in fixed English words, whatever the device zone or locale (the iPhone does the same)", () => {
  const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
  const zone = env.TZ;
  try {
    for (const tz of ["Asia/Singapore", "America/Los_Angeles", "UTC"]) {
      env.TZ = tz;
      const { root, view } = draw(bills([{ id: "z", label: "Late", trailing: "S$1", due_at: "2026-09-25T23:30Z" }, { id: "y", label: "Early", trailing: "S$1", due_at: "2026-10-01T00:05:30Z" }]));
      expect([...root.querySelectorAll("time")].map(time => time.textContent), tz).toEqual(["Due 25 Sep", "Due 1 Oct"]);
      view.unmount();
    }
  } finally { if (zone === undefined) delete env.TZ; else env.TZ = zone; }
});

test("a due_at that is not a real UTC instant is a missing date, not a rolled-forward one", () => {
  const { root } = draw(bills(["2026-02-30T04:00Z", "2026-09-25", "2026-09-25T25:00Z", "soon"].map((due_at, i) => ({ id: `d${i}`, label: `Bill ${i}`, trailing: "S$1", due_at } as HarsoOutputRow))));
  expect(root.querySelectorAll("time")).toHaveLength(0);
  expect(root.querySelectorAll(".hkc-fin-when")).toHaveLength(0);
});

test("subscriptions: a row with no renewal date has none drawn and none invented", () => {
  const { root } = draw(subs([
    { id: "s1", label: "Spotify", trailing: "S$11.98", brand: "spotify.com" },
    { id: "s2", label: "iCloud+", secondary: "DBS card", trailing: "S$4.05" },
  ]));
  const [spotify, icloud] = [...root.querySelectorAll<HTMLElement>(".hkc-fin-row")];
  expect(spotify.querySelector(".hkc-fin-when")).toBeNull();
  expect(spotify.textContent).not.toMatch(/renew/i);
  expect(icloud.querySelector(".hkc-fin-when")!.textContent).toBe("DBS card"); // only the words the document gave
  expect(root.textContent).not.toMatch(/renew/i);
});

test("subscriptions: renewal words are kept as given, an exact due_at stands in when there are none, and the total is drawn", () => {
  const { root } = draw(subs([
    SUBS[0],
    { id: "s9", label: "Max", trailing: "S$9.99", due_at: "2026-10-12T04:00Z" },
  ]));
  expect(within(root).getByText("Renews 4 Oct · DBS card")).toBeTruthy();
  const time = root.querySelector<HTMLTimeElement>(".hkc-fin-row time")!;
  expect(time.dateTime).toBe("2026-10-12T04:00Z");
  expect(time.textContent).toBe("Renews 12 Oct");
  expect(within(root).getByText("S$98.47")).toBeTruthy();
  expect(within(root).getByText("Total")).toBeTruthy();
});

test("subscriptions: source order is kept, whatever the dates and prices say", () => {
  const document = deepFreeze(subs(SUBS));
  const { root } = draw(document);
  expect(rowIds(root)).toEqual(["s-chat", "s-net", "s-dis"]);
  expect(document.blocks[1]).toEqual({ kind: "rows", items: SUBS });
});

test("rows beyond the inline budget wait behind one View all that asks the host; full mode draws them all", () => {
  const many = Array.from({ length: 9 }, (_, i): HarsoOutputRow => ({ id: `r${i}`, label: `Service ${i}`, trailing: `S$${i}.00` }));
  const inline = draw(subs(many, { more_label: undefined }));
  expect(rowIds(inline.root)).toEqual(many.slice(0, 6).map(row => row.id));
  fireEvent.click(within(inline.root).getByRole("button", { name: "View all 9" }));
  expect(inline.onViewAll).toHaveBeenCalledTimes(1);
  inline.view.unmount();
  const full = draw(subs(many), { caps: { maxRows: Infinity } });
  expect(rowIds(full.root)).toEqual(many.map(row => row.id));
  expect(within(full.root).queryByRole("button", { name: /View all/ })).toBeNull();
  full.view.unmount();
  const partial = draw({ ...subs(many.slice(0, 2)), blocks: [{ kind: "rows", items: many.slice(0, 2), total_count: 5 }] }, { caps: { maxRows: Infinity } });
  expect(partial.root.querySelector(".hkc-fin-note")!.textContent).toBe("Showing 2 of 5");
});

// ---- widget sizes ----

test("supported sizes: stock small, medium and large; bills and subscriptions small and medium; nothing else", () => {
  expect(family.supportedWidgetSizes("stock-quote")).toEqual(["small", "medium", "large"]);
  expect(family.supportedWidgetSizes("bills-due")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("subscriptions")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("weather-now")).toEqual([]);
});

test("a size the family does not design falls back to the generic card", () => {
  for (const [document, size] of [[bills(BILLS), "large"], [subs(SUBS), "extraLarge"], [stock(), "extraLarge"]] as const) {
    const { root, view } = draw(document, { widgetSize: size });
    expect(root.querySelector(".hkc-v6-frame")).toBeNull();
    expect(root.querySelector(".hkc-output-card")).not.toBeNull();
    view.unmount();
  }
});

test("bill and subscription widgets show their rows in source order: small the first row, medium the first three", () => {
  const four = [...SUBS, { id: "s-4", label: "Spotify", trailing: "S$11.98" }];
  const small = draw(subs(four), { widgetSize: "small" });
  expect(rowIds(small.root)).toEqual(["s-chat"]);
  expect(small.root.querySelector<HTMLElement>(".hkc-fin")!.dataset.size).toBe("small");
  small.view.unmount();
  const medium = draw(subs(four), { widgetSize: "medium" });
  expect(rowIds(medium.root)).toEqual(["s-chat", "s-net", "s-dis"]);
  expect(medium.root.querySelector(".hkc-fin-note")!.textContent).toBe("+1 more");
  // The total rides at the title's right in a medium widget; a small one has no room for it.
  expect(within(medium.root.querySelector<HTMLElement>("[data-slot=trailing]")!).getByText("S$98.47")).toBeTruthy();
  expect(small.root.querySelector(".hkc-fin-total")).toBeNull();
  expect(within(medium.root).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("stock widgets keep the price, change and chart at every size, and a widget has no Details toggle (the title opens the whole answer)", () => {
  for (const size of ["small", "medium", "large"] as const) {
    const { root, view } = draw(stock({ range: "1D", baseline: "236.1" }), { widgetSize: size });
    expect(root.querySelector<HTMLElement>(".hkc-fin")!.dataset.size).toBe(size);
    expect(within(root).getByText("US$238.40")).toBeTruthy();
    expect(change(root)!.dataset.direction).toBe("up");
    expect(root.querySelector("svg.hkc-fin-spark")).not.toBeNull();
    expect(within(root).queryByRole("button", { name: "Details" })).toBeNull();
    view.unmount();
  }
  expect(within(draw(stock(), { mode: "full" }).root).getByRole("button", { name: "Details" })).toBeTruthy();
});

// ---- fallback: what this family cannot draw, the generic card draws ----

test("a document the family cannot draw whole goes to the generic card, so no block is lost", () => {
  const cannot: HarsoOutputDocument[] = [
    { ...stock(), blocks: [] },                                                                       // no price
    { ...stock(), blocks: [{ kind: "numbers", items: [] }] },                                         // no price
    { ...stock(), blocks: [...stock().blocks, { kind: "text", sections: [{ paragraphs: ["Extra"] }] }] }, // a block this card does not draw
    stock({ values: ["234.2", null, null, null, null, null, null] }),                                 // nothing to plot
    { ...stock(), blocks: [stock().blocks[0], { kind: "visual", visual: { kind: "map" } }] },          // a visual that is not a chart
    bills([]),                                                                                        // no rows
    bills([{ label: "Rent", trailing: "S$1", status: "mystery" }]),                                   // a status this card cannot say
    { ...bills(BILLS), blocks: [...bills(BILLS).blocks, ...bills(BILLS).blocks] },                    // two row lists
    { ...bills(BILLS), template: undefined },                                                         // no template hint
    { ...bills(BILLS), template: "flight-status" },                                                   // someone else's template
  ];
  for (const document of cannot) {
    const { root, view } = draw(document);
    expect(root.querySelector(".hkc-v6-frame"), JSON.stringify(document).slice(0, 80)).toBeNull();
    expect(root.querySelector(".hkc-output-card")).not.toBeNull();
    view.unmount();
  }
});

test("an action the host can run sits in the trailing area; with no callback nothing is drawn for it", () => {
  const action = { kind: "action" as const, primary: { kind: "open_url" as const, label: "Open Nasdaq", url: "https://www.nasdaq.com/market-activity/stocks/aapl" } };
  const document = { ...stock(), blocks: [...stock().blocks, action] };
  const onOpenUrl = vi.fn();
  const withHost = draw(document, { onOpenUrl });
  fireEvent.click(within(withHost.root.querySelector<HTMLElement>("[data-slot=trailing]")!).getByRole("button", { name: "Open Nasdaq" }));
  expect(onOpenUrl).toHaveBeenCalledWith(action.primary.url);
  withHost.view.unmount();
  const without = draw(document);
  expect(without.root.querySelector(".hkc-v6-frame")).not.toBeNull(); // still the family card
  expect(within(without.root).queryByRole("button", { name: "Open Nasdaq" })).toBeNull();
});

// ---- interactive layout and styles ----

test("axe finds no violation in any of the cards, light or dark, card or widget", async () => {
  const cases: [HarsoOutputDocument, WidgetSize | undefined][] = [
    [stock({ range: "1D", baseline: "236.1" }), undefined], [stock({ delta: "-2.3%" }), "small"], [stock(), "large"],
    [bills(BILLS), undefined], [bills(BILLS), "medium"], [subs(SUBS), undefined], [subs(SUBS), "small"],
  ];
  for (const appearance of ["light", "dark"] as const) for (const [document, widgetSize] of cases) {
    const { view, root } = draw(document, { widgetSize, appearance, onReply: vi.fn() });
    const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map(violation => violation.id), `${document.template} ${widgetSize ?? "card"} ${appearance}`).toEqual([]);
    // Nothing pressable sits inside another pressable.
    for (const target of root.querySelectorAll("button, a[href]")) expect(target.parentElement!.closest("button, a[href]")).toBeNull();
    view.unmount();
  }
});

const block = (selector: string) => theme.slice(theme.indexOf(selector)).match(/\{([\s\S]*?)\n\}/)![1];
const token = (css: string, name: string) => css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))![1];
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test("styles: up, down and flat take kit tokens that read on the card surface in light and dark, and differ from each other", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [direction, name] of [["up", "--hk-positive"], ["down", "--hk-negative"], ["flat", "--hk-secondary"]] as const) {
    expect(source, direction).toMatch(new RegExp(`\\[data-direction="${direction}"\\][^{]*\\{[^}]*var\\(${name}\\)`));
  }
  const themes = { light: block(".harso-kit {"), dark: block('.harso-kit[data-mode="dark"] {') };
  for (const [mode, css] of Object.entries(themes)) {
    const surface = token(css, "--hk-surface");
    const tones = ["--hk-positive", "--hk-negative", "--hk-secondary"].map(name => token(css, name));
    for (const tone of tones) expect(contrast(tone, surface), `${mode} ${tone} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    expect(new Set(tones).size).toBe(3);
  }
});

test("styles: tokens only, no borders or !important, no font, 44px targets on touch", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line))).toEqual([]);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-fin-more[^}]*min-height: 44px/);
});

// WEV-3469: V6 draws a soft fill under the price line (Apple Stocks); a gap in the prices leaves no fill across it.
test("the chart has a soft fill under each unbroken run of prices, closed to the bottom edge", () => {
  const { root } = draw(stock({ range: "1D" }));
  const fills = [...root.querySelectorAll("svg.hkc-fin-spark path.hkc-fin-fill")];
  expect(fills).toHaveLength(1);
  expect(fills[0].getAttribute("aria-hidden")).toBe("true");
  expect(fills[0].getAttribute("d")).toMatch(/^M0 80 L0 [\d.]+ .* L300 80 Z$/);
});
