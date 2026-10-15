import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import * as chat from "../index";
import type { HarsoOutputDocument, HarsoOutputRow } from "../output-card";
import type { HarsoOutputStatusBlock } from "../output-card-media";
import type { V6Flight, V6Weather } from "./types";
import { V6_FAMILIES as V6_FAMILIES_FOR_TEST } from "./registry";

// WEV-3303: C0-C10 are typed (checked by `npm run typecheck`: every @ts-expect-error below must still be an error) and
// are optional, so an old document is unchanged and a new one draws the same generic card until a family handles it.

afterEach(cleanup);

const PHOTO = { artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29", alt: "Photo" };
const PW = "0192a3b4-5c6d-7e8f-9a0b-000000000a31";
const shape = (html: string) => html.replace(/\s(?:id|aria-labelledby|aria-controls)="[^"]*"/g, "");
const html = (document: HarsoOutputDocument) => {
  const { container } = render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} /></div>);
  const out = shape(container.innerHTML);
  cleanup();
  return out;
};

const weather: V6Weather = {
  sky: "rain", current_condition: "rain", high: "31", low: "26",
  hourly: [{ condition: "cloudy", rain: 40 }, { rain: 0 }], days: [{ label: "Mon", condition: "storm", low: "25", high: "30" }]
};
const flight: V6Flight = {
  number: "SQ 638", origin_code: "SIN", destination_code: "NRT", origin_name: "Singapore", destination_name: "Tokyo Narita",
  scheduled_departure: "08:35", departure: "08:50", arrival: "16:40", departure_zone: "SGT", arrival_zone: "JST",
  terminal: "T3", gate: "B12", previous_gate: "B10", boarding: "08:05", seat: "34A", remaining: "About 2 h 10 min left"
};
const row = (extra: Partial<HarsoOutputRow> = {}): HarsoOutputRow => ({
  id: "r1", label: "Acme", secondary: "Detail", trailing: "S$10",
  brand: "acme.example", action: { kind: "open_url", label: "Open", url: "https://acme.example/a" },
  rating: "4.5", review_count: 120, noise_db: "42.5", category: "Cafe", opening_label: "Open until 22:00", open_state: "open",
  distance: "300 m", travel_mode: "walk", unread: true, due_at: "2026-10-12T09:00Z", starts_at: "2026-10-12T10:00:00Z", calendar_color: "blue",
  ...flight, arrival_day_offset: 1, ...extra
});
const rich: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "flight-status", as_of: "2026-10-11T09:10Z", weather, flight,
  header: { title: "Rich", subtitle: "All the optional fields", brand: "acme.example" },
  blocks: [
    { kind: "rows", items: [row(), row({ id: "r2", label: "Beta", calendar_color: "gray" })] },
    { kind: "table", columns: [{ label: "Spec" }, { label: "A", thumbnail: PHOTO }, { label: "B" }], rows: [{ cells: ["Noise", "40 dB", "45 dB"], winner: 1 }] },
    { kind: "visual", visual: { kind: "chart", chart: "line", x_labels: ["9", "10"], series: [{ label: "Price", values: ["1", "2"] }], range: "1D", baseline: "1.5" } },
    { kind: "text", sections: [{ heading: "Day 1", paragraphs: ["Walk."], date: "2026-10-12", thumbnail: PHOTO }] }
  ],
  fallback_text: "FALLBACK"
};
/** The same document without any C0-C10 field: what an old agent would have sent. */
function strip(document: HarsoOutputDocument): HarsoOutputDocument {
  const { template: _t, weather: _w, flight: _f, ...rest } = document;
  const { brand: _b, ...header } = rest.header;
  const dropRow = ({ brand: _1, action: _2, rating: _3, review_count: _4, noise_db: _5, category: _6, opening_label: _7, open_state: _8, distance: _9, travel_mode: _10,
    unread: _11, due_at: _12, starts_at: _13, calendar_color: _14, number: _15, origin_code: _16, destination_code: _17, origin_name: _18, destination_name: _19,
    scheduled_departure: _20, departure: _21, arrival: _22, departure_zone: _23, arrival_zone: _24, terminal: _25, gate: _26, previous_gate: _27, boarding: _28,
    seat: _29, remaining: _30, arrival_day_offset: _31, ...keep }: HarsoOutputRow) => keep;
  return { ...rest, header, blocks: rest.blocks.map(block => {
    if (block.kind === "rows") return { ...block, items: (block as chat.HarsoOutputRowsBlock).items.map(dropRow) };
    if (block.kind === "table") {
      const table = block as chat.HarsoOutputTableBlock;
      return { ...table, columns: table.columns.map(({ thumbnail: _t2, ...column }) => column), rows: table.rows.map(({ winner: _w2, ...r }) => r) };
    }
    if (block.kind === "visual") {
      const { range: _r, baseline: _bl, ...chart } = (block as chat.HarsoOutputVisualBlock).visual as chat.HarsoOutputChart;
      return { kind: "visual", visual: chart } satisfies chat.HarsoOutputVisualBlock;
    }
    if (block.kind === "text") return { ...block, sections: (block as chat.HarsoOutputTextBlock).sections.map(({ date: _d, thumbnail: _th, ...section }) => section) };
    return block;
  }) };
}

test("every C0-C10 field is optional: a document that carries all of them draws the same generic card as one that carries none", () => {
  expect(html(rich)).toBe(html(strip(rich)));
  expect(html(rich)).toContain("Acme");
});

test("old documents compile and draw unchanged: no template, no brand, plain subject, plain status", () => {
  const old: HarsoOutputDocument = { header: { title: "Old" }, blocks: [
    { kind: "status", state: "watching", subject: { routine_id: PW } }, { kind: "rows", items: [{ label: "One" }] }], fallback_text: "OLD" };
  render(<chat.HarsoOutputCard document={old} onViewAll={() => {}} />);
  expect(screen.getByText("Watching")).toBeTruthy();
  expect(screen.getByText("One")).toBeTruthy();
});

test("row identity and source order survive the new fields", () => {
  render(<chat.HarsoOutputCard document={rich} caps={chat.HARSO_OUTPUT_CARD_UNCAPPED} onViewAll={() => {}} />);
  const card = screen.getByRole("region", { name: "Rich" });
  expect([...card.querySelectorAll(".hkc-output-card-row-label")].map(node => node.textContent)).toEqual(["Acme", "Beta"]);
  expect(rich.blocks.map(block => block.kind)).toEqual(["rows", "table", "visual", "text"]);
});

const tracking = (extra: object = {}) => ({ kind: "status", state: "tracking", label: "Out for delivery", ...extra }) as HarsoOutputStatusBlock;
const withStatus = (status: object): HarsoOutputDocument => ({ header: { title: "Parcel" }, fallback_text: "FALLBACK TEXT", blocks: [status as chat.HarsoOutputBlock, { kind: "rows", items: [{ label: "Stop 1" }] }] });

test("a tracking status draws as a status line from its label, with the delay in words and without any control", () => {
  render(<chat.HarsoOutputCard document={withStatus(tracking({ progress: 60, stages: ["Packed", "Shipped", "Out", "Delivered"], stage_index: 2, condition: "delayed" }))} onViewAll={() => {}} onRoutineControl={() => {}} onWorkControl={() => {}} />);
  const card = screen.getByRole("region", { name: "Parcel" });
  expect(card.querySelector(".hkc-output-status-line")!.textContent).toBe("Tracking · Out for delivery · Delayed");
  expect(card.querySelector(".hkc-output-status")!.getAttribute("data-meaning")).toBe("attention");
  expect(within(card).queryAllByRole("button")).toHaveLength(0);
  expect(within(card).getByText("Stop 1")).toBeTruthy();
});

test.each([
  [{}, "Tracking · Out for delivery"],
  [{ condition: "unknown" }, "Tracking · Out for delivery"],
  [{ condition: "on_time" }, "Tracking · Out for delivery · On time"],
])("a tracking status with %o says only what the source said", (extra, words) => {
  render(<chat.HarsoOutputCard document={withStatus(tracking(extra))} onViewAll={() => {}} />);
  const card = screen.getByRole("region", { name: "Parcel" });
  expect(card.querySelector(".hkc-output-status-line")!.textContent).toBe(words);
  expect(card.querySelector(".hkc-output-status")!.getAttribute("data-meaning")).toBe("in_progress");
  expect(chat.harsoOutputMediaPlainText(tracking(extra))).toBe(words);
});

test.each([
  ["no label", { label: undefined }],
  ["blank label", { label: "  " }],
  ["a forged subject", { subject: { routine_id: PW } }],
  ["progress above 100", { progress: 101 }],
  ["negative progress", { progress: -1 }],
  ["fractional progress", { progress: 50.5 }],
  ["more than 8 stages", { stages: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] }],
  ["no stages", { stages: [] }],
  ["a stage index without stages", { stage_index: 0 }],
  ["a stage index out of bounds", { stages: ["A", "B"], stage_index: 2 }],
  ["an unknown condition", { condition: "late" }],
])("an unreadable tracking status (%s) sends the whole card to its fallback text, never half a status", (_name, extra) => {
  render(<chat.HarsoOutputCard document={withStatus(tracking(extra))} onViewAll={() => {}} />);
  const card = screen.getByRole("region", { name: "Parcel" });
  expect(card.textContent).toContain("FALLBACK TEXT");
  expect(within(card).queryByText("Tracking")).toBeNull();
});

test("the page-watch subject draws like the other subjects", () => {
  render(<chat.HarsoOutputCard document={withStatus({ kind: "status", state: "watching", subject: { page_watch_id: PW } })} onViewAll={() => {}} />);
  expect(screen.getByText("Watching")).toBeTruthy();
});

test("the v6 foundation is exported from the chat index under Harso names", () => {
  expect(chat.HARSO_V6_TEMPLATES).toHaveLength(20);
  expect(chat.HARSO_V6_FAMILIES).toBe(V6_FAMILIES_FOR_TEST);
  expect(chat.harsoV6WidgetSizes(rich)).toEqual(V6_FAMILIES_FOR_TEST["flight-status"]!.supportedWidgetSizes("flight-status"));
  for (const name of ["HarsoV6Frame", "HarsoV6Brand", "HarsoOutputActionRow"] as const) expect(typeof chat[name]).toBe("function");
});

// ---- compile-time: each line below must stay a type error, or typecheck fails on the unused directive ----
type Doc = HarsoOutputDocument;
export const typeChecks = () => {
  // A name outside the 20 is a valid card (drawn generically), so it type-checks; a non-string still does not.
  // @ts-expect-error a template is a string
  const a: Doc = { header: { title: "t" }, blocks: [], fallback_text: "f", template: 7 };
  // @ts-expect-error tracking needs its label
  const b: HarsoOutputStatusBlock = { kind: "status", state: "tracking" };
  // @ts-expect-error tracking never carries a subject
  const c: HarsoOutputStatusBlock = { kind: "status", state: "tracking", label: "x", subject: { routine_id: PW } };
  // @ts-expect-error the label and stages belong to tracking only
  const d: HarsoOutputStatusBlock = { kind: "status", state: "watching", label: "x" };
  // @ts-expect-error winner is a column index
  const e: chat.HarsoOutputTableRow = { cells: ["a"], winner: "1" };
  // @ts-expect-error open_state is a closed set
  const f: HarsoOutputRow = { label: "x", open_state: "maybe" };
  // @ts-expect-error the calendar palette is closed
  const g: HarsoOutputRow = { label: "x", calendar_color: "pink" };
  // @ts-expect-error a row action can only open a link
  const h: HarsoOutputRow = { label: "x", action: { kind: "reply", label: "x", text: "t" } };
  // @ts-expect-error the flight facts are a closed set
  const i: V6Flight = { number: "SQ 1", cabin: "J" };
  // @ts-expect-error a chart range is one of four
  const j: chat.HarsoOutputChart = { kind: "chart", chart: "line", x_labels: [], series: [], range: "5Y" };
  // @ts-expect-error the only page-watch control is disable
  const k: chat.HarsoOutputActionSpec = { kind: "page_watch_control", label: "x", page_watch_id: PW, control: "pause" };
  // @ts-expect-error a weather condition is closed
  const l: V6Weather = { current_condition: "fog" };
  // @ts-expect-error a day offset is 0-3
  const m: HarsoOutputRow = { label: "x", arrival_day_offset: 4 };
  // @ts-expect-error there is no free-form v6 bag
  const n: Doc = { header: { title: "t" }, blocks: [], fallback_text: "f", v6: { anything: 1 } };
  return [a, b, c, d, e, f, g, h, i, j, k, l, m, n];
};
