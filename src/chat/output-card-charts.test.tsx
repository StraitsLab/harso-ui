import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";
import { periodNotes, readShare, scale, withUnit } from "./output-card-charts";
import chartStyles from "./output-card-charts.css?raw";
import cardStyles from "./output-card.css?raw";

afterEach(cleanup);

// Verbatim blocks from docs/agent/output-playbook.examples.json: money-spending-month, data-channel-share,
// data-table-small, partial-days.
const spendingBar: chat.HarsoOutputVisualBlock = { kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$",
  x_labels: ["1–7 Aug", "8–14 Aug", "15–21 Aug", "22–31 Aug"], series: [{ label: "Spent", values: ["980", "1040", "1460", "800"] }], highlight_index: 2 } };
const shareRows: chat.HarsoOutputRowsBlock = { kind: "rows", items: [
  { label: "Dining", secondary: "27%", trailing: "S$1,160" }, { label: "Other", secondary: "25%", trailing: "S$1,080" },
  { label: "Groceries", secondary: "20%", trailing: "S$840" }, { label: "Transport", secondary: "14%", trailing: "S$610" },
  { label: "Shopping", secondary: "14%", trailing: "S$590" }] };
const channelRows: chat.HarsoOutputRowsBlock = { kind: "rows", items: [
  { label: "Online store", secondary: "60%", trailing: "S$28,900" }, { label: "Instagram shop", secondary: "25%", trailing: "S$12,100" },
  { label: "Weekend markets", secondary: "15%", trailing: "S$7,200" }] };
const regionTable: chat.HarsoOutputTableBlock = { kind: "table", columns: [{ label: "Region" }, { label: "Revenue", align: "end" }, { label: "vs Q1", align: "end" }],
  rows: [{ cells: ["Central", "S$182,400", "+4%"] }, { cells: ["East", "S$96,300", "+18%"] }, { cells: ["West", "S$71,900", "−2%"] }, { cells: ["Total", "S$350,600", "+6%"] }] };
const partialLine: chat.HarsoOutputVisualBlock = { kind: "visual", visual: { kind: "chart", chart: "line", unit: "S$",
  x_labels: ["13 Sep", "14 Sep", "15 Sep", "16 Sep", "17 Sep", "18 Sep", "19 Sep", "20 Sep", "21 Sep", "22 Sep", "23 Sep", "24 Sep", "25 Sep", "26 Sep"],
  series: [{ label: "Sales", values: ["1500", "1700", "1300", "2000", "2100", "1600", "0", "1400", "1800", "2000", "1500", "1900", null, null] }], highlight_index: 6 } };

const doc = (blocks: chat.HarsoOutputBlock[], extra: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, header: { title: "August spending", subtitle: "1–31 Aug · all accounts" }, blocks, fallback_text: "FALLBACK", ...extra });
const renderDoc = (document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) => {
  const onViewAll = vi.fn();
  render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={onViewAll} {...props} /></div>);
  return { card: screen.getByRole("region", { name: document.header.title }), onViewAll };
};

// ---- chart ----

test("bar: hand-built SVG with baseline, gridlines, unit on every axis figure, the highlighted bar labelled", () => {
  const { card } = renderDoc(doc([spendingBar]));
  expect(card).not.toHaveAttribute("data-fallback");
  const svg = card.querySelector("svg.hkc-chart-svg")!;
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg.querySelectorAll(".hkc-chart-baseline")).toHaveLength(1);
  expect(svg.querySelectorAll(".hkc-chart-grid").length).toBeGreaterThanOrEqual(1);
  const axis = [...svg.querySelectorAll(".hkc-chart-axis")].map(node => node.textContent);
  expect(axis).toEqual(["S$0", "S$1,000", "S$2,000"]);
  expect(svg.querySelectorAll(".hkc-chart-mark")).toHaveLength(4);
  expect(svg.querySelectorAll(".hkc-chart-mark--strong")).toHaveLength(1);
  expect(svg.querySelector(".hkc-chart-mark--strong")).toHaveAttribute("data-index", "2");
  expect(svg.querySelector(".hkc-chart-value")!.textContent).toBe("S$1,460");
  expect(svg.querySelector(".hkc-chart-x--strong")!.textContent).toBe("15–21 Aug");
  // The series label is the caption; no chart library markup.
  expect(within(card).getByText("Spent", { selector: "figcaption" })).toBeVisible();
});

test("bar: the uneven last period is labelled with its length, equal weeks are not", () => {
  const { card } = renderDoc(doc([spendingBar]));
  const notes = [...card.querySelectorAll(".hkc-chart-x-note")].map(node => node.textContent);
  expect(notes).toEqual(["10 days"]);
  expect(periodNotes(["1–7", "8–14", "15–21", "22–30"])).toEqual([undefined, undefined, undefined, "9 days"]);
  expect(periodNotes(["1–7", "8–14", "15–21", "22–28"])).toEqual([undefined, undefined, undefined, undefined]);
  expect(periodNotes(["Mon", "Tue"])).toEqual([undefined, undefined]);
});

test("chart data is announced as a table with every value, its unit and the highlighted period", () => {
  const { card } = renderDoc(doc([spendingBar]));
  const table = within(card).getByRole("table", { name: "Spent (S$)" });
  const rows = within(table).getAllByRole("row").map(row => row.textContent);
  expect(rows).toEqual(["PeriodSpent", "1–7 AugS$980", "8–14 AugS$1,040", "15–21 Aug (highlighted)S$1,460", "22–31 AugS$800"]);
});

test("line: nulls are gaps with not-reported ticks, a real zero is plotted and highlighted with its value and period", () => {
  const { card } = renderDoc(doc([partialLine], { header: { title: "Daily sales" } }));
  const svg = card.querySelector("svg")!;
  expect(svg.querySelectorAll(".hkc-chart-line")).toHaveLength(1);
  expect(svg.querySelectorAll(".hkc-chart-missing")).toHaveLength(2);
  expect([...svg.querySelectorAll(".hkc-chart-missing")].map(node => node.getAttribute("data-index"))).toEqual(["12", "13"]);
  expect(svg.querySelector(".hkc-chart-highlight .hkc-chart-value")!.textContent).toBe("S$0 · 19 Sep");
  expect(svg.querySelector(".hkc-chart-x--strong")!.textContent).toBe("19 Sep");
  expect(within(card).getByRole("table").textContent).toContain("25 SepNot reported");
  // First, last and highlighted labels always show; axis includes S$0 because the data does.
  const xs = [...svg.querySelectorAll(".hkc-chart-x")].map(node => node.textContent);
  expect(xs).toContain("13 Sep"); expect(xs).toContain("26 Sep"); expect(xs).toContain("19 Sep");
  expect([...svg.querySelectorAll(".hkc-chart-axis")].map(node => node.textContent)[0]).toBe("S$0");
});

test("line: three series get distinct dash patterns and a key; the pill names the period only", () => {
  const compare: chat.HarsoOutputVisualBlock = { kind: "visual", visual: { kind: "chart", chart: "line", unit: "%", x_labels: ["Jan", "Mar", "May", "Jul", "Sep"],
    series: [{ label: "AAPL", values: ["0", "5", "9", "12", "14"] }, { label: "MSFT", values: ["0", "3", "4", "8", "11"] }, { label: "VOO", values: ["0", "-2", "1", "4", "6"] }], highlight_index: 4 } };
  const { card } = renderDoc(doc([compare], { header: { title: "Returns" } }));
  const dashes = [...card.querySelectorAll(".hkc-chart-series .hkc-chart-line")].map(node => node.getAttribute("stroke-dasharray"));
  expect(new Set(dashes).size).toBe(3);
  expect([...card.querySelectorAll(".hkc-output-chart-key li")].map(node => node.textContent)).toEqual(["AAPL", "MSFT", "VOO"]);
  expect(card.querySelector(".hkc-chart-highlight .hkc-chart-value")!.textContent).toBe("Sep");
  expect(card.querySelectorAll(".hkc-chart-point")).toHaveLength(3);
  expect([...card.querySelectorAll(".hkc-chart-axis")].map(node => node.textContent)).toContain("−10%");
});

test("negative bars hang below a zero baseline; units follow the figure the way people write them", () => {
  const loss: chat.HarsoOutputVisualBlock = { kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$k", x_labels: ["Q1", "Q2", "Q3"], series: [{ label: "Profit", values: ["12.5", "-4", "8"] }], highlight_index: 1 } };
  const { card } = renderDoc(doc([loss], { header: { title: "Profit" } }));
  expect(card.querySelector(".hkc-chart-value")!.textContent).toBe("−S$4k");
  const axis = [...card.querySelectorAll(".hkc-chart-axis")].map(node => node.textContent);
  expect(axis).toContain("S$0k"); expect(axis.some(text => text!.startsWith("−S$"))).toBe(true);
  expect(withUnit(1160, 0, "S$")).toBe("S$1,160");
  expect(withUnit(31, 0, "°C")).toBe("31°C");
  expect(withUnit(7.8, 1, "hours")).toBe("7.8\u00a0hours");
  expect(withUnit(412, 0, "units")).toBe("412\u00a0units");
  expect(withUnit(-2, 0, "%")).toBe("−2%");
  expect(withUnit(1234567, 0)).toBe("1,234,567");
  expect(withUnit(18.4, 1, "US$")).toBe("US$18.4");
});

test("scale: bars always include zero; lines span their data; flat and all-zero data still get two intervals", () => {
  expect(scale([980, 1460], true)).toMatchObject({ bottom: 0, top: 2000, ticks: [0, 1000, 2000] });
  expect(scale([402.5, 418.3], false).bottom).toBeGreaterThan(0);
  expect(scale([0, 0], true).ticks).toEqual([0, 0.5, 1]);
  expect(scale([649, 649], false).ticks.length).toBeGreaterThanOrEqual(2);
  expect(scale([-4, 12.5], true).bottom).toBeLessThan(0);
});

test("charts the card cannot draw fall back: ragged series, bad decimals, multi-series bars, unknown chart kinds", () => {
  const bad: chat.HarsoOutputBlock[] = [
    { kind: "visual", visual: { kind: "chart", chart: "bar", x_labels: ["a", "b"], series: [{ label: "x", values: ["1"] }] } },
    { kind: "visual", visual: { kind: "chart", chart: "bar", x_labels: ["a", "b"], series: [{ label: "x", values: ["1", "1,200"] }] } },
    { kind: "visual", visual: { kind: "chart", chart: "bar", x_labels: ["a", "b"], series: [{ label: "x", values: ["1", "2"] }, { label: "y", values: ["1", "2"] }] } },
    { kind: "visual", visual: { kind: "chart", chart: "pie", x_labels: ["a", "b"], series: [{ label: "x", values: ["1", "2"] }] } },
    { kind: "visual", visual: { kind: "map", places: [] } },
  ];
  for (const block of bad) {
    const { card } = renderDoc(doc([block]));
    expect(card).toHaveAttribute("data-fallback", "true");
    cleanup();
  }
});

// ---- share ----

test("share: one thin stacked bar above ruled rows (key · label · share % · amount), largest first", () => {
  const { card } = renderDoc(doc([shareRows]), { caps: { maxRows: 5 } });
  const segments = card.querySelectorAll<HTMLElement>(".hkc-output-share-segment");
  expect(segments).toHaveLength(5);
  expect([...segments].map(node => Number(node.style.flexGrow).toFixed(2))).toEqual(["0.27", "0.25", "0.20", "0.14", "0.14"]);
  expect(card.querySelector(".hkc-output-share-bar")).toHaveAttribute("aria-hidden", "true");
  const rows = within(card).getAllByRole("listitem").map(row => row.textContent);
  expect(rows).toEqual(["Dining27%S$1,160", "Other25%S$1,080", "Groceries20%S$840", "Transport14%S$610", "Shopping14%S$590"]);
  // Tones step from full ink to 55%: the lightest segment and its key match.
  const tones = [...segments].map(node => node.style.getPropertyValue("--hkc-tone"));
  expect(tones).toEqual(["100%", "89%", "78%", "66%", "55%"]);
  expect(card.querySelectorAll<HTMLElement>(".hkc-output-share-key")[4].style.getPropertyValue("--hkc-tone")).toBe("55%");
  expect(card.textContent).not.toMatch(/donut|pie/i);
});

test("share: the bar shows every share even when rows are capped; hidden rows count toward View all", () => {
  const { card, onViewAll } = renderDoc(doc([shareRows], { more_label: "View all categories" }));
  expect(card.querySelectorAll(".hkc-output-share-segment")).toHaveLength(5);
  expect(within(card).getAllByRole("listitem")).toHaveLength(3);
  fireEvent.click(within(card).getByRole("button", { name: "View all categories" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  const { card: three } = renderDoc(doc([channelRows], { header: { title: "Revenue by channel · August" } }));
  expect(within(three).getAllByRole("listitem")).toHaveLength(3);
  expect(within(three).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("share is read only from rows that are a whole: otherwise they stay ordinary rows", () => {
  expect(readShare(shareRows.items)).toEqual([27, 25, 20, 14, 14]);
  expect(readShare([{ label: "A", secondary: "40%", trailing: "S$1" }, { label: "B", secondary: "60%", trailing: "S$2" }])).toBeUndefined(); // not largest first
  expect(readShare([{ label: "A", secondary: "60%", trailing: "S$1" }, { label: "B", secondary: "20%", trailing: "S$2" }])).toBeUndefined(); // 80%
  expect(readShare([{ label: "A", secondary: "60%" }, { label: "B", secondary: "40%" }])).toBeUndefined(); // no amounts
  expect(readShare([{ label: "A", secondary: "60%", trailing: "x", mark: "pick" }, { label: "B", secondary: "40%", trailing: "y" }])).toBeUndefined();
  expect(readShare([{ label: "A", secondary: "100%", trailing: "S$1" }])).toBeUndefined(); // one row is not a share
  expect(readShare([{ label: "A", secondary: "33%", trailing: "1" }, { label: "B", secondary: "33%", trailing: "1" }, { label: "C", secondary: "33%", trailing: "1" }])).toEqual([33, 33, 33]); // rounding
  const { card } = renderDoc(doc([{ kind: "rows", items: [{ label: "Up", secondary: "+4%", trailing: "S$1" }, { label: "Down", secondary: "−2%", trailing: "S$2" }] }]));
  expect(card.querySelector(".hkc-output-share")).toBeNull();
  expect(card.querySelectorAll(".hkc-output-card-row")).toHaveLength(2);
});

// ---- table ----

test("table: header row, numeric columns right-aligned, Total last and set apart, row headers for screen readers", () => {
  const { card } = renderDoc(doc([regionTable], { header: { title: "Sales by region · Q2" } }));
  expect(card).not.toHaveAttribute("data-fallback");
  const scroller = within(card).getByRole("region", { name: "Sales by region · Q2 · table" });
  expect(scroller).toHaveAttribute("tabindex", "0");
  const table = within(scroller).getByRole("table");
  expect(within(table).getAllByRole("columnheader").map(cell => [cell.textContent, cell.getAttribute("data-align")]))
    .toEqual([["Region", "start"], ["Revenue", "end"], ["vs Q1", "end"]]);
  const rows = within(table).getAllByRole("row");
  expect(rows.map(row => row.textContent)).toEqual(["RegionRevenuevs Q1", "CentralS$182,400+4%", "EastS$96,300+18%", "WestS$71,900−2%", "TotalS$350,600+6%"]);
  expect(rows[4]).toHaveClass("hkc-output-table-total");
  expect(within(table).getAllByRole("rowheader").map(cell => cell.textContent)).toEqual(["Central", "East", "West", "Total"]);
  // Three body rows fit the three-row budget and the Total row is not counted against it: nothing is hidden.
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("table: total_count overflows to View all; rows share one budget with rows blocks", () => {
  const standings: chat.HarsoOutputTableBlock = { kind: "table", total_count: 20, columns: [{ label: "Pos" }, { label: "Team" }, { label: "Played", align: "end" }, { label: "Pts", align: "end" }],
    rows: [{ cells: ["1", "Liverpool", "6", "16"] }, { cells: ["2", "Arsenal", "6", "14"] }] };
  const { card } = renderDoc(doc([standings], { header: { title: "Premier League table" } }));
  expect(within(card).getAllByRole("row")).toHaveLength(3);
  expect(within(card).getByRole("button", { name: "View all 20" })).toBeVisible();
  cleanup();
  const { card: mixed } = renderDoc(doc([{ kind: "rows", items: [{ label: "A" }, { label: "B" }] }, regionTable], { header: { title: "Mixed" } }));
  expect(mixed.querySelectorAll(".hkc-output-card-row")).toHaveLength(2);
  expect(within(mixed).getAllByRole("row").map(row => row.textContent)).toEqual(["RegionRevenuevs Q1", "CentralS$182,400+4%", "TotalS$350,600+6%"]);
  expect(within(mixed).getByRole("button", { name: "View all 5" })).toBeVisible();
});

test("table without a Total row keeps every row as body; tables the card cannot draw fall back", () => {
  const plain: chat.HarsoOutputTableBlock = { kind: "table", columns: [{ label: "Fact" }, { label: "Detail" }], rows: [{ cells: ["Tenure", "99 years"] }, { cells: ["Total floor area", "92 sqm"] }] };
  const { card } = renderDoc(doc([plain], { header: { title: "Facts" } }));
  // "Total floor area" is the last row, and it is labelled Total…: the contract's convention (G4) wins, so it is set apart.
  expect(card.querySelector(".hkc-output-table-total")!.textContent).toBe("Total floor area92 sqm");
  cleanup();
  for (const bad of [{ kind: "table", columns: [{ label: "A" }], rows: [{ cells: ["x"] }] }, { kind: "table", columns: [{ label: "A" }, { label: "B" }], rows: [{ cells: ["x"] }] },
    { kind: "table", columns: [{ label: "A" }, { label: "B" }], rows: [{ cells: ["x", "y"], status: "overdue" }] }]) {
    const { card: fallback } = renderDoc(doc([bad]));
    expect(fallback).toHaveAttribute("data-fallback", "true");
    cleanup();
  }
});

// ---- states: each block × each state ----

const blocks = [["chart", spendingBar], ["share", channelRows], ["table", regionTable]] as const;
const stateCases: chat.HarsoOutputBlockState[] = [
  { state: "loading" }, { state: "empty", message: "No spending to break down" }, { state: "partial", message: "3 of 4 weeks · 22–31 Aug still syncing" },
  { state: "stale", message: "As of 09:10 · couldn’t refresh" }, { state: "failed", message: "Couldn’t load the chart", reason: "The bank feed didn’t respond. Nothing was changed." }];

test.each(blocks.flatMap(([kind, block]) => [{ state: "ready" } as chat.HarsoOutputBlockState, ...stateCases].map(state => [kind, state.state, block, state] as const)))(
  "%s × %s renders as B0 draws it", (kind, name, block, state) => {
    const onRetry = vi.fn();
    const { card } = renderDoc(doc([block], { header: { title: "T" } }), { blockStates: { 0: { ...state, onRetry: name === "failed" ? onRetry : undefined } } });
    expect(card).not.toHaveAttribute("data-fallback");
    const drawn = card.querySelector(kind === "chart" ? ".hkc-output-chart" : kind === "share" ? ".hkc-output-share" : ".hkc-output-table");
    if (name === "ready" || name === "partial" || name === "stale") expect(drawn).not.toBeNull(); else expect(drawn).toBeNull();
    if (name === "loading") { expect(card.querySelector("[data-state=loading]")).toHaveAttribute("aria-busy", "true"); expect(within(card).getByText("Loading")).toBeInTheDocument(); }
    if (name === "empty") { expect(within(card).getByText("No spending to break down")).toBeVisible(); expect(card.querySelector(".hkc-output-block-ring")).not.toBeNull(); }
    if (name === "partial" || name === "stale") {
      const note = card.querySelector(".hkc-output-block-note")!;
      expect(note.textContent).toBe(state.message);
      // Note sits after the content, as in B0.
      expect(drawn!.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    if (name === "failed") {
      expect(within(card).getByText("Couldn’t load the chart")).toBeVisible();
      expect(within(card).getByText(/Nothing was changed/)).toBeVisible();
      expect(card.querySelector(".hkc-output-block-failed-glyph")).not.toBeNull();
      fireEvent.click(within(card).getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    }
    // A block showing no data adds no View all of its own.
    if (name === "loading" || name === "empty" || name === "failed") expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
  });

test("failed without a host retry shows no Try again (nothing that cannot act); states are per block", () => {
  const { card } = renderDoc(doc([spendingBar, regionTable], { header: { title: "Two" } }), { blockStates: { 0: { state: "failed" }, 1: { state: "stale", message: "As of 09:10" } } });
  expect(within(card).queryByRole("button", { name: "Try again" })).toBeNull();
  expect(within(card).getByText("Couldn’t load this")).toBeVisible();
  // Block 1 is untouched by block 0's failure: its table draws, with its own note.
  expect(within(card).getByRole("table")).toBeVisible();
  expect(within(card).getByText("As of 09:10")).toBeVisible();
  expect(card.querySelectorAll("[data-state=failed]")).toHaveLength(1);
});

// ---- the whole spending example, hostile text, copy text ----

test("the money-spending-month example renders numbers → bar → share with the page's View all", () => {
  const numbers: chat.HarsoOutputNumbersBlock = { kind: "numbers", items: [{ value: "S$720", label: "Left of S$5,000" }, { value: "S$4,280", label: "Spent" }] };
  const { card } = renderDoc(doc([numbers, spendingBar, shareRows], { more_label: "View all categories" }));
  const order = [...card.querySelectorAll(".hkc-output-card-numbers, .hkc-output-chart, .hkc-output-share")].map(node => node.className);
  expect(order).toEqual(["hkc-output-card-numbers", "hkc-output-chart", "hkc-output-share"]);
  expect(within(card).getByRole("button", { name: "View all categories" })).toBeVisible();
});

test("hostile text renders literally in axis, labels, cells and share rows", () => {
  const markup = "<img src=x onerror=alert(1)>";
  const chart: chat.HarsoOutputVisualBlock = { kind: "visual", visual: { kind: "chart", chart: "bar", unit: "<b>", x_labels: [markup, "长长长长长长长长长长长长长长长"], series: [{ label: markup, values: ["1", "2"] }], highlight_index: 0 } };
  const table: chat.HarsoOutputTableBlock = { kind: "table", columns: [{ label: markup }, { label: "Ω".repeat(40), align: "end" }], rows: [{ cells: [markup, "x".repeat(40)] }] };
  const rows: chat.HarsoOutputRowsBlock = { kind: "rows", items: [{ label: markup, secondary: "60%", trailing: "🙂" }, { label: "مرحبا", secondary: "40%", trailing: "" + markup }] };
  const { container } = render(<chat.HarsoOutputCard document={doc([chart, table, rows])} onViewAll={() => {}} />);
  expect(container.querySelector("img, b")).toBeNull();
  expect(screen.getAllByText(markup).length).toBeGreaterThanOrEqual(3);
});

test("plain text for Copy carries every value with its unit", () => {
  expect(chat.harsoOutputBlockPlainText(spendingBar)).toBe("Spent: 1–7 Aug S$980, 8–14 Aug S$1,040, 15–21 Aug S$1,460, 22–31 Aug S$800");
  expect(chat.harsoOutputBlockPlainText(partialLine)).toContain("25 Sep not reported");
  expect(chat.harsoOutputBlockPlainText(regionTable)).toBe("Region\tRevenue\tvs Q1\nCentral\tS$182,400\t+4%\nEast\tS$96,300\t+18%\nWest\tS$71,900\t−2%\nTotal\tS$350,600\t+6%");
  expect(chat.harsoOutputBlockPlainText(channelRows)).toBe("Online store · 60% · S$28,900\nInstagram shop · 25% · S$12,100\nWeekend markets · 15% · S$7,200");
  expect(chat.harsoOutputBlockPlainText({ kind: "status" })).toBeUndefined();
});

test("styles: tokens only, no borders or !important; tabular figures; header 500; hairline above View all; 28px bordered retry", () => {
  const source = chartStyles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line) && !line.startsWith("outline: 2px solid var(--hk-accent)"))).toEqual([]);
  expect(source).toMatch(/\.hkc-output-table thead th \{[^}]*font-weight: 500/);
  expect(source).toMatch(/\.hkc-output-table \{[^}]*font-variant-numeric: tabular-nums/);
  expect(source).toMatch(/\.hkc-output-table-scroll \{[^}]*overflow-x: auto/);
  expect(source).toMatch(/\.hk-button\.hkc-output-block-retry \{[^}]*min-height: 28px[^}]*box-shadow: inset 0 0 0 1px var\(--hk-control-line\)/);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-output-block-retry \{ min-height: 44px/);
  expect(source).toMatch(/\.hkc-output-block-failed-glyph \{[^}]*color: var\(--hk-attention\)/);
  expect(cardStyles).toMatch(/\.hkc-output-card-view-all::before \{[^}]*left: calc\(-1 \* var\(--hk-space-4\)\); right: calc\(-1 \* var\(--hk-space-4\)\); height: 1px;\s*background: var\(--hk-line\)/);
});
