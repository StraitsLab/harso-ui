import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { HarsoOutputTextSection } from "../output-card";
import type { HarsoOutputTableBlock } from "../output-card-charts";
import styles from "./local-controls.css?raw";
import { LocalTable, compareCells, nextOrder } from "./local-table";
import { SectionTabs } from "./section-tabs";

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  delete (navigator as { sendBeacon?: unknown }).sendBeacon;
});

/** Any request a local control made: fetch, XHR or a beacon. Call the returned check after the interaction. */
function trapNetwork() {
  const fetch = vi.fn(), beacon = vi.fn(), open = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("XMLHttpRequest", class { constructor() { open(); } });
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
  return () => expect([fetch, beacon, open].map(spy => spy.mock.calls.length)).toEqual([0, 0, 0]);
}

/** Freeze deeply: a sort that touches the received document in place throws in strict mode. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}

const table = (rows: string[][], extra: Partial<HarsoOutputTableBlock> = {}): HarsoOutputTableBlock =>
  ({ kind: "table", columns: [{ label: "Item" }, { label: "Qty", align: "end" }], rows: rows.map(cells => ({ cells })), ...extra });
/** The first cell of every body row and the totals row, top to bottom (the status badge is not part of it). */
const order = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map(row => row.firstElementChild!.childNodes[0].textContent);
const header = (name: string) => screen.getByRole("button", { name });

const qty = table([["Bolts", "10"], ["Nuts", "9"], ["Washers", "10"], ["Screws", "2.5"]], { totals: { cells: ["Total", "31.5"] } });

// ---- the comparator, one documented order ----

test("canonical decimals compare exactly, not as floats", () => {
  // A double cannot tell these apart (21 significant digits); exact comparison can.
  expect(Math.sign(compareCells("999999999999998.999999", "999999999999999"))).toBe(-1);
  expect(Math.sign(compareCells("999999999999999", "999999999999998.999999"))).toBe(1);
  expect(compareCells("0.1", "0.10")).toBe(0);
  expect(compareCells("007", "7")).toBe(0);
  expect(compareCells("-0", "0")).toBe(0);
  expect(compareCells("-0.000000", "0")).toBe(0);
  const ascending = ["2", "-0.5", "0", "-1", "10", "-10", "0.25"].sort(compareCells);
  expect(ascending).toEqual(["-10", "-1", "-0.5", "0", "0.25", "2", "10"]);
});

test("only the contract's decimal shape counts as a number; everything else is text", () => {
  // 16 whole digits, 7 fraction digits, a bare dot, a plus sign, an exponent, a thousands comma, a unit: all text,
  // so each sorts after a real number however large that number is.
  for (const text of ["1234567890123456", "1.1234567", "5.", ".5", "+5", "1e3", "1,000", "5%", " 5", "5\n", "٣"]) {
    expect(compareCells(text, "999999999999999")).toBe(1);
    expect(compareCells("999999999999999", text)).toBe(-1);
  }
});

test("text compares by Unicode code point, so both platforms agree and no locale decides", () => {
  expect(["banana", "Apple", "apple", "Éclair", "zebra"].sort(compareCells)).toEqual(["Apple", "apple", "banana", "zebra", "Éclair"]);
  // U+FF5E sorts before U+1F600 by code point; a UTF-16 code unit sort would put the emoji first.
  expect(Math.sign(compareCells("\u{1F600}", "\uFF5E"))).toBe(1);
  expect(compareCells("same", "same")).toBe(0);
  expect(Math.sign(compareCells("ab", "abc"))).toBe(-1);
});

test("a number sorts before any text", () => {
  expect(compareCells("3", "n/a")).toBe(-1);
  expect(compareCells("n/a", "3")).toBe(1);
});

test("nextOrder cycles source, ascending, descending, source, and a new column starts ascending", () => {
  const ascending = nextOrder("source", 1);
  expect(ascending).toEqual({ column: 1, direction: "ascending" });
  const descending = nextOrder(ascending, 1);
  expect(descending).toEqual({ column: 1, direction: "descending" });
  expect(nextOrder(descending, 1)).toBe("source");
  expect(nextOrder(descending, 0)).toEqual({ column: 0, direction: "ascending" });
});

// ---- the table ----

test("a header tap cycles source, ascending, descending and back to source", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={qty} />);
  const button = header("Qty"), th = button.closest("th")!;
  expect(order()).toEqual(["Bolts", "Nuts", "Washers", "Screws", "Total"]);
  expect(th).not.toHaveAttribute("aria-sort");
  await user.click(button);
  expect(th).toHaveAttribute("aria-sort", "ascending");
  expect(order()).toEqual(["Screws", "Nuts", "Bolts", "Washers", "Total"]);
  await user.click(button);
  expect(th).toHaveAttribute("aria-sort", "descending");
  expect(order()).toEqual(["Bolts", "Washers", "Nuts", "Screws", "Total"]);
  await user.click(button);
  expect(th).not.toHaveAttribute("aria-sort");
  expect(order()).toEqual(["Bolts", "Nuts", "Washers", "Screws", "Total"]);
  expect(button).toHaveFocus();
});

test("only the sorted column says so, and a tap on another column starts at ascending", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={qty} />);
  await user.click(header("Qty"));
  await user.click(header("Item"));
  expect(header("Item").closest("th")).toHaveAttribute("aria-sort", "ascending");
  expect(header("Qty").closest("th")).not.toHaveAttribute("aria-sort");
  expect(order()).toEqual(["Bolts", "Nuts", "Screws", "Washers", "Total"]);
});

test("the keyboard sorts too: Enter and Space on a focused header", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={qty} />);
  header("Qty").focus();
  await user.keyboard("{Enter}");
  expect(order()[0]).toBe("Screws");
  await user.keyboard(" ");
  expect(order()[0]).toBe("Bolts");
});

test("equal cells keep their source order in both directions", async () => {
  const user = userEvent.setup();
  const tied = table([["E", "1"], ["A", "1"], ["D", "2"], ["B", "1"], ["C", "2"]]);
  render(<LocalTable table={tied} />);
  await user.click(header("Qty"));
  expect(order()).toEqual(["E", "A", "B", "D", "C"]);
  await user.click(header("Qty"));
  expect(order()).toEqual(["D", "C", "E", "A", "B"]);
});

test("a mixed column puts numbers first going up and text first going down, the exact reverse", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={table([["a", "n/a"], ["b", "3"], ["c", "S$5"], ["d", "10"]])} />);
  await user.click(header("Qty"));
  expect(order()).toEqual(["b", "d", "c", "a"]);
  await user.click(header("Qty"));
  expect(order()).toEqual(["a", "c", "d", "b"]);
});

test("money and dates are never parsed: they sort as the text they are", async () => {
  const user = userEvent.setup();
  // By code point "10 Oct" < "9 Oct" < "S$182,400" < "S$71,900" < "S$96,300". A card that guessed would order these by value.
  render(<LocalTable table={table([["x", "S$96,300"], ["y", "S$182,400"], ["z", "S$71,900"], ["w", "9 Oct"], ["v", "10 Oct"]])} />);
  await user.click(header("Qty"));
  expect(order()).toEqual(["v", "w", "y", "z", "x"]);
});

test("explicit totals never move", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={qty} />);
  for (let tap = 0; tap < 4; tap++) {
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows.at(-1)).toHaveClass("hkc-output-table-total");
    expect(order().at(-1)).toBe("Total");
    expect(rows.filter(row => row.classList.contains("hkc-output-table-total"))).toHaveLength(1);
    await user.click(header("Qty"));
  }
});

test("a last row named Total is pinned below the body when the document sends no totals", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={table([["Bolts", "10"], ["Nuts", "9"], ["Screws", "2.5"], ["Total", "21.5"]])} />);
  await user.click(header("Qty"));
  expect(order()).toEqual(["Screws", "Nuts", "Bolts", "Total"]);
  await user.click(header("Qty"));
  expect(order()).toEqual(["Bolts", "Nuts", "Screws", "Total"]);
  expect(within(screen.getByRole("table")).getAllByRole("row").at(-1)).toHaveClass("hkc-output-table-total");
});

test("an ordinary row whose name starts with Total sorts like any row when totals are explicit", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={table([["Total floor area", "90"], ["Garden", "20"]], { totals: { cells: ["Total", "110"] } })} />);
  await user.click(header("Qty"));
  expect(order()).toEqual(["Garden", "Total floor area", "Total"]);
});

test("every received row is sorted before the display cap is applied", async () => {
  const user = userEvent.setup();
  render(<LocalTable table={qty} shown={2} />);
  expect(order()).toEqual(["Bolts", "Nuts", "Total"]);
  await user.click(header("Qty"));
  expect(order()).toEqual(["Screws", "Nuts", "Total"]); // the two smallest of all four, not of the first two
  await user.click(header("Qty"));
  expect(order()).toEqual(["Bolts", "Washers", "Total"]);
});

test("a row keeps its own status word and cells when it moves", async () => {
  const user = userEvent.setup();
  const rows = [{ cells: ["Rent", "9"], status: "overdue" }, { cells: ["Power", "3"] }, { cells: ["Water", "5"], status_label: "Settled", status: "paid" }];
  render(<LocalTable table={{ kind: "table", columns: [{ label: "Bill" }, { label: "Due" }], rows }} />);
  await user.click(header("Due"));
  const table = screen.getByRole("table");
  expect(order()).toEqual(["Power", "Water", "Rent"]);
  expect(within(within(table).getAllByRole("row")[3]).getByText("Overdue")).toBeInTheDocument();
  expect(within(within(table).getAllByRole("row")[2]).getByText("Settled")).toBeInTheDocument();
  expect(within(within(table).getAllByRole("row")[1]).queryByText(/Overdue|Settled/)).toBeNull();
  const cells = within(within(table).getAllByRole("row")[3]).getAllByRole("cell");
  expect(cells.map(cell => cell.textContent)).toEqual(["9"]);
});

test("column alignment and the region name are kept", () => {
  render(<LocalTable table={qty} label="Stock" />);
  expect(screen.getByRole("region", { name: "Stock · table" })).toBeInTheDocument();
  expect(header("Qty").closest("th")).toHaveAttribute("data-align", "end");
  expect(header("Item").closest("th")).toHaveAttribute("data-align", "start");
});

test("a start order is honoured, and an order for a column the table no longer has falls back to source", () => {
  render(<LocalTable table={qty} initialOrder={{ column: 1, direction: "descending" }} />);
  expect(order()).toEqual(["Bolts", "Washers", "Nuts", "Screws", "Total"]);
  cleanup();
  render(<LocalTable table={qty} initialOrder={{ column: 7, direction: "ascending" }} />);
  expect(order()).toEqual(["Bolts", "Nuts", "Washers", "Screws", "Total"]);
  expect(document.querySelector("[aria-sort]")).toBeNull();
});

// ---- the narrow layout: a table too wide for its box is drawn as items, which have no header row to tap ----

test("a table too wide for its box is drawn as items and sorts from a Sort by bar, totals last", async () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) { return this.classList.contains("hkc-output-table-scroll") ? 316 : 0; });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) { return this.tagName === "TABLE" ? 711 : 0; });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const user = userEvent.setup();
  render(<LocalTable table={qty} />);
  const items = () => within(screen.getByRole("list")).getAllByRole("listitem").map(item => item.querySelector(".hkc-output-table-name")!.childNodes[0].textContent);
  const bar = screen.getByRole("group", { name: "Sort by" });
  expect(items()).toEqual(["Bolts", "Nuts", "Washers", "Screws", "Total"]);
  await user.click(within(bar).getByRole("button", { name: "Qty" }));
  expect(items()).toEqual(["Screws", "Nuts", "Bolts", "Washers", "Total"]);
  await user.click(within(bar).getByRole("button", { name: "Qty, ascending" }));
  expect(items()).toEqual(["Bolts", "Washers", "Nuts", "Screws", "Total"]);
  await user.click(within(bar).getByRole("button", { name: "Qty, descending" }));
  expect(items()).toEqual(["Bolts", "Nuts", "Washers", "Screws", "Total"]);
  expect(within(bar).getByRole("button", { name: "Qty" })).toHaveFocus();
});

test("sorting leaves the received document untouched and makes no request", async () => {
  const user = userEvent.setup();
  const received = deepFreeze(structuredClone(qty));
  const before = JSON.stringify(received);
  const noRequest = trapNetwork();
  render(<LocalTable table={received} />);
  await user.click(header("Qty"));
  await user.click(header("Qty"));
  await user.click(header("Item"));
  expect(JSON.stringify(received)).toBe(before);
  expect(received.rows.map(row => row.cells[0])).toEqual(["Bolts", "Nuts", "Washers", "Screws"]);
  noRequest();
});

// ---- the section tabs ----

const trip: HarsoOutputTextSection[] = [
  { heading: "Day 1 · Higashiyama", bullets: ["09:00 Kiyomizu-dera"] },
  { heading: "Day 2 · Arashiyama", bullets: ["08:30 Bamboo grove"] },
  { heading: "Day 3 · Fushimi", paragraphs: ["Walk the lower gates."] },
];
const show = (section: HarsoOutputTextSection, index: number) => <p data-testid={`section-${index}`}>{section.heading}: {section.bullets?.[0] ?? section.paragraphs?.[0]}</p>;

test("one tab per section, named by its heading, the first selected by default", () => {
  render(<SectionTabs sections={trip} renderSection={show} />);
  const tabs = screen.getAllByRole("tab");
  expect(tabs.map(tab => tab.textContent)).toEqual(["Day 1 · Higashiyama", "Day 2 · Arashiyama", "Day 3 · Fushimi"]);
  expect(tabs.map(tab => tab.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Day 1 · Higashiyama: 09:00 Kiyomizu-dera");
  expect(screen.getByRole("tablist")).toHaveAccessibleName("Sections");
});

test("initialIndex picks the starting tab; a bad index falls back to the first", () => {
  render(<SectionTabs sections={trip} initialIndex={2} renderSection={show} />);
  expect(screen.getByRole("tab", { name: /Day 3/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Walk the lower gates.");
  for (const bad of [-1, 3, 1.5, Number.NaN]) {
    cleanup();
    render(<SectionTabs sections={trip} initialIndex={bad} renderSection={show} />);
    expect(screen.getByRole("tab", { name: /Day 1/ })).toHaveAttribute("aria-selected", "true");
  }
});

test("a tap switches the section on the device, with no request", async () => {
  const user = userEvent.setup();
  const noRequest = trapNetwork();
  const received = deepFreeze(structuredClone(trip));
  const before = JSON.stringify(received);
  render(<SectionTabs sections={received} renderSection={show} />);
  await user.click(screen.getByRole("tab", { name: /Day 2/ }));
  expect(screen.getByRole("tab", { name: /Day 2/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Day 2 · Arashiyama: 08:30 Bamboo grove");
  expect(screen.getByTestId("section-0")).not.toBeVisible();
  expect(JSON.stringify(received)).toBe(before);
  noRequest();
});

test("every section stays mounted, so what a person typed in one is still there after a switch", async () => {
  const user = userEvent.setup();
  const render0 = vi.fn((section: HarsoOutputTextSection, index: number) => <label>Note {index}<input defaultValue="" /></label>);
  render(<SectionTabs sections={trip} renderSection={render0} />);
  const first = screen.getByLabelText("Note 0");
  await user.type(first, "keep me");
  await user.click(screen.getByRole("tab", { name: /Day 2/ }));
  await user.click(screen.getByRole("tab", { name: /Day 1/ }));
  expect(screen.getByLabelText("Note 0")).toBe(first);
  expect(first).toHaveValue("keep me");
  expect(render0.mock.calls.map(([, index]) => index).slice(0, 3)).toEqual([0, 1, 2]);
  expect(render0.mock.calls[1][0]).toBe(trip[1]);
});

test("focus stays on the tab: a tap keeps it there and the arrow keys move it with the selection", async () => {
  const user = userEvent.setup();
  render(<SectionTabs sections={trip} renderSection={show} />);
  const [one, two, three] = screen.getAllByRole("tab");
  await user.click(two);
  expect(two).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(three).toHaveFocus();
  expect(three).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{Home}");
  expect(one).toHaveFocus();
  expect(one).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{End}");
  expect(three).toHaveFocus();
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Walk the lower gates.");
});

test("two sections with the same heading are still two tabs", async () => {
  const user = userEvent.setup();
  render(<SectionTabs sections={[{ heading: "Notes", paragraphs: ["first"] }, { heading: "Notes", paragraphs: ["second"] }]} renderSection={show} />);
  const tabs = screen.getAllByRole("tab", { name: "Notes" });
  expect(tabs).toHaveLength(2);
  await user.click(tabs[1]);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("second");
});

test("a section without a heading is named by its place", () => {
  render(<SectionTabs sections={[{ paragraphs: ["a"] }, { heading: "Named", paragraphs: ["b"] }]} renderSection={show} />);
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Section 1", "Named"]);
});

test("one section needs no tabs, and none needs nothing", () => {
  const { container } = render(<SectionTabs sections={[trip[0]]} renderSection={show} />);
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(screen.getByTestId("section-0")).toBeVisible();
  cleanup();
  const empty = render(<SectionTabs sections={[]} renderSection={show} />);
  expect(empty.container).toBeEmptyDOMElement();
  expect(container).toBeTruthy();
});

// ---- styles ----

test("styles: tokens only, no borders or !important; 44px targets on touch; a visible focus ring", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line) && !line.startsWith("outline: 2px solid var(--hk-accent)"))).toEqual([]);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-local-sort[^}]*min-height: 44px/);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-section-tabs[^}]*min-height: 44px/);
  expect(source).toMatch(/hkc-local-sort:focus-visible/);
});
