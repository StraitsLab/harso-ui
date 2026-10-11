import axe from "axe-core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputCardProps, type HarsoOutputDocument } from "../output-card";
import styles from "./journeys.css?raw";
import theme from "../../theme.css?raw";
import { family } from "./journeys";
import type { V6FamilyProps } from "./types";

// WEV-3319 (P03): delivery and flight cards. One bar, drawn only from a progress the source gave; stages, route, gate,
// seat and the on-time/delayed word only from fields the document carries; no timer, no live badge.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const AS_OF = "2026-10-11T09:10Z";
const STAGES = ["Ordered", "Preparing", "On the way", "Delivered"];
const TIMELINE = [
  { label: "Picked up", secondary: "Ravi left Meghana Foods at 20:06", trailing: "20:06" },
  { label: "Ready", secondary: "Packed at the restaurant", trailing: "20:02" },
  { label: "Preparing", secondary: "Meghana Foods accepted", trailing: "19:51" }
];
const tracking = (extra: Record<string, unknown> = {}) => {
  const block: Record<string, unknown> = { kind: "status", state: "tracking", label: "On the way", progress: 72, stages: STAGES, stage_index: 2, condition: "on_time", ...extra };
  for (const key of Object.keys(block)) if (block[key] === undefined) delete block[key];
  return block as HarsoOutputDocument["blocks"][number];
};
const delivery = (status: Record<string, unknown> = {}, extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "delivery-tracking", as_of: AS_OF,
  header: { title: "Arriving in about 12 min", subtitle: "Ravi, 1.8 km away", brand: "swiggy.com" },
  blocks: [tracking(status), { kind: "rows", items: TIMELINE }],
  fallback_text: "FALLBACK", ...extra
});

const FLIGHT = {
  number: "SQ 638", origin_code: "SIN", destination_code: "NRT", origin_name: "Singapore", destination_name: "Tokyo Narita",
  scheduled_departure: "08:35", departure: "09:20", arrival: "17:25", departure_zone: "SGT", arrival_zone: "JST",
  terminal: "3", gate: "B6", previous_gate: "A12", boarding: "08:50", seat: "14A"
};
const MANAGE = { kind: "action", secondary: { kind: "open_url", label: "Manage booking", url: "https://www.singaporeair.com/booking" } };
const flight = (facts: Record<string, unknown> = {}, status: Record<string, unknown> | null = { label: "Awaiting departure", condition: "delayed", stages: undefined, stage_index: undefined, progress: undefined }, extra: Partial<HarsoOutputDocument> = {}, nowFlight?: Record<string, unknown>): HarsoOutputDocument => {
  const merged: Record<string, unknown> = { ...FLIGHT, ...facts };
  for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
  return {
    kind: "output_blocks", major: 1, template: "flight-status", as_of: AS_OF,
    header: { title: "SQ 638 departs 09:20", subtitle: "Delayed 45 min", brand: "singaporeair.com" },
    flight: merged as HarsoOutputDocument["flight"],
    blocks: [...(status ? [tracking(status)] : []), { kind: "rows", items: [{ label: "Was", trailing: "08:35" }, { label: "Now", secondary: "Gate changed from A12", trailing: "09:20 · B6", ...(nowFlight ? { flight: nowFlight } : {}) }] }, MANAGE as HarsoOutputDocument["blocks"][number]],
    fallback_text: "FALLBACK", ...extra
  };
};

const options = (rows?: Array<Record<string, unknown>>, extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "flight-options", as_of: AS_OF,
  header: { title: "Flights to Tokyo", subtitle: "12 Oct · 1 adult" },
  blocks: [{ kind: "rows", items: (rows ?? [
    { id: "a", label: "Singapore Airlines", secondary: "SQ 638 · 08:35 · 7h 05m direct", trailing: "S$612", mark: "pick", brand: "singaporeair.com",
      action: { kind: "open_url", label: "Book Singapore Airlines", url: "https://www.singaporeair.com/book" }, flight: { origin_code: "SIN", destination_code: "NRT", arrival: "16:40" } },
    { id: "b", label: "ANA", secondary: "NH 842 · 22:30 · 6h 55m direct", trailing: "S$548", brand: "ana.co.jp",
      action: { kind: "open_url", label: "Book ANA", url: "https://www.ana.co.jp/book" }, flight: { origin_code: "SIN", destination_code: "HND", arrival: "06:25", arrival_day_offset: 1 } },
    { id: "c", label: "ZIPAIR", secondary: "ZG 52 · 23:55", trailing: "S$326", brand: "zipair.net" }
  ]) as never }],
  fallback_text: "FALLBACK", ...extra
});

type Draw = Partial<HarsoOutputCardProps>;
function draw(document: HarsoOutputDocument, props: Draw = {}) {
  const onViewAll = vi.fn(), onOpenUrl = vi.fn();
  const view = render(<div className="harso-kit"><HarsoOutputCard document={document} onViewAll={onViewAll} onOpenUrl={onOpenUrl}
    families={{ "delivery-tracking": family, "flight-status": family, "flight-options": family }} {...props} /></div>);
  return { ...view, onViewAll, onOpenUrl: props.onOpenUrl ?? onOpenUrl };
}
const propsOf = (document: HarsoOutputDocument, extra: Partial<V6FamilyProps> = {}): V6FamilyProps =>
  ({ document, mode: "inline", host: { onViewAll: () => {} }, media: {}, renderBrand: () => undefined, ...extra });
const fills = (container: HTMLElement) => [...container.querySelectorAll("[data-progress]")].map(node => node.getAttribute("data-progress"));

// ---- delivery: progress 0, 100 and unknown ----

test("delivery: progress 0 is a value, drawn as an empty bar that says 0%", () => {
  draw(delivery({ progress: 0, stage_index: 0, condition: undefined }));
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("0");
  expect(bar.getAttribute("aria-valuetext")).toBe("On the way, 0%");
  expect((bar.firstElementChild as HTMLElement).style.width).toBe("0%");
});

test("delivery: progress 100 fills the bar", () => {
  draw(delivery({ progress: 100, label: "Delivered", stage_index: 3 }));
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
  expect((bar.firstElementChild as HTMLElement).style.width).toBe("100%");
});

test("delivery: no progress from the source means no bar and no number at all, only the stages and the label", () => {
  const { container } = draw(delivery({ progress: undefined }));
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(container.querySelector("[data-progress]")).toBeNull();
  expect(container.textContent).not.toMatch(/\d+\s?%/);
  expect(within(screen.getByRole("list", { name: "Stages" })).getAllByRole("listitem").map(li => li.textContent)).toEqual(STAGES);
  expect(screen.getByText("On the way", { selector: ".hkc-journey-status b" })).toBeTruthy();
});

test("delivery: the stage list keeps source order and marks only the given stage_index", () => {
  draw(delivery({ stage_index: 1 }));
  const items = within(screen.getByRole("list", { name: "Stages" })).getAllByRole("listitem");
  expect(items.map(li => li.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
  expect(items.map(li => li.getAttribute("data-state"))).toEqual(["done", "current", "next", "next"]);
});

test("delivery: no stage_index marks nothing (no guess from progress)", () => {
  draw(delivery({ stage_index: undefined, progress: 72 }));
  const items = within(screen.getByRole("list", { name: "Stages" })).getAllByRole("listitem");
  expect(items.every(li => !li.hasAttribute("aria-current") && !li.hasAttribute("data-state"))).toBe(true);
});

test("delivery: the condition is a word, and only when the source gave one", () => {
  const { unmount } = draw(delivery({ condition: "delayed" }));
  expect(screen.getByText("Delayed").getAttribute("data-condition")).toBe("delayed");
  unmount();
  draw(delivery({ condition: "on_time" }));
  expect(screen.getByText("On time").getAttribute("data-condition")).toBe("on_time");
  cleanup();
  const none = draw(delivery({ condition: "unknown" }));
  expect(none.container.querySelector("[data-condition]")).toBeNull();
});

test("delivery: the shop mark comes from the host's bundled lookup, else a letter tile; never a fetch", () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const renderBrand = vi.fn(() => <svg data-testid="mark" />);
  draw(delivery(), { renderBrand });
  expect(renderBrand).toHaveBeenCalledWith({ domain: "swiggy.com", label: "Arriving in about 12 min" });
  expect(screen.getByTestId("mark")).toBeTruthy();
  cleanup();
  const bare = draw(delivery());
  expect(bare.container.querySelector("[data-mark=letter]")).not.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

test("delivery: the timeline rows stay out of the glance card and open, in source order, in the full answer", () => {
  const inline = draw(delivery());
  expect(screen.queryByRole("list", { name: "Timeline" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Arriving in about 12 min/ }));
  expect(inline.onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  draw(delivery(), { mode: "full" });
  const rows = within(screen.getByRole("list", { name: "Timeline" })).getAllByRole("listitem");
  expect(rows.map(row => row.firstElementChild!.textContent)).toEqual(["Picked up", "Ready", "Preparing"]);
  expect(rows[0].textContent).toContain("Ravi left Meghana Foods at 20:06");
  expect(rows[0].textContent).toContain("20:06");
});

test("delivery: a document the family cannot draw in full returns undefined, so the generic card keeps every block", () => {
  const text = { kind: "text", sections: [{ paragraphs: ["Extra note"] }] } as never;
  expect(family.renderFamily(propsOf(delivery({}, { blocks: [tracking(), text] })))).toBeUndefined();
  expect(family.renderFamily(propsOf(delivery({}, { blocks: [{ kind: "rows", items: TIMELINE }] })))).toBeUndefined();
  expect(family.renderFamily(propsOf(delivery({ progress: 120 })))).toBeUndefined();
  expect(family.renderFamily(propsOf(delivery({ stage_index: 9 })))).toBeUndefined();
  expect(family.renderFamily(propsOf(delivery({ state: "working" } as never)))).toBeUndefined();
  draw(delivery({}, { blocks: [tracking(), text] }));
  expect(screen.getByText(/Extra note/)).toBeTruthy();
});

// ---- flight status ----

test("flight status: the route, times, zones and facts are the document's, as given", () => {
  const { container } = draw(flight());
  const card = screen.getByRole("region", { name: "SQ 638 departs 09:20" });
  for (const text of ["SIN", "NRT", "Singapore", "Tokyo Narita", "09:20", "17:25"]) expect(within(card).getAllByText(text, { exact: false }).length).toBeGreaterThan(0);
  expect(container.textContent).toContain("Departure · SGT");
  expect(container.textContent).toContain("Arrival · JST");
  const facts = [...container.querySelectorAll(".hkc-journey-facts > div")].map(div => div.textContent);
  expect(facts).toEqual(["Terminal3", "GateB6 Was A12", "Boarding08:50", "Seat14A"]);
});

test("flight status: delayed shows the old time struck and the old gate, with the word Delayed", () => {
  const { container } = draw(flight());
  expect(screen.getByText("Delayed").getAttribute("data-condition")).toBe("delayed");
  expect([...container.querySelectorAll(".hkc-journey-times s")].map(node => node.textContent)).toEqual(["Was 08:35"]);
});

test("flight status: an old time or gate equal to the new one is not shown as a change", () => {
  const { container } = draw(flight({ scheduled_departure: "09:20", previous_gate: "B6" }));
  expect(container.querySelector("s")).toBeNull();
});

test("flight status: in the air draws the sourced progress and the sourced remaining text, nothing counted locally", () => {
  vi.useFakeTimers();
  const { container } = draw(flight({ remaining: "2h 10m left", departure: "08:35" }, { label: "In the air", condition: "on_time", progress: 60 }));
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("60");
  expect(screen.getByText("In the air")).toBeTruthy();
  expect(screen.getByText("On time")).toBeTruthy();
  expect(container.querySelector(".hkc-journey-remaining")!.textContent).toBe("2h 10m left");
  const before = container.innerHTML;
  expect(vi.getTimerCount()).toBe(0);
  act(() => { vi.advanceTimersByTime(3_600_000); });
  expect(container.innerHTML).toBe(before);
});

test("flight status: no sourced remaining means no countdown line, and no progress means no bar", () => {
  const { container } = draw(flight());
  expect(container.querySelector(".hkc-journey-remaining")).toBeNull();
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(container.textContent).not.toMatch(/\d+\s?%/);
  expect(screen.getByText("Awaiting departure")).toBeTruthy();
});

test("flight status: a missing gate or seat is left out, not drawn as a dash or a sample", () => {
  const { container } = draw(flight({ gate: undefined, previous_gate: undefined, seat: undefined }));
  const names = [...container.querySelectorAll(".hkc-journey-facts dt")].map(node => node.textContent);
  expect(names).toEqual(["Terminal", "Boarding"]);
  expect(container.textContent).not.toMatch(/Gate|Seat|—|-{2}|TBD/);
});

test("flight status: a previous gate with no current gate is not drawn", () => {
  const { container } = draw(flight({ gate: undefined, seat: undefined }));
  expect(container.textContent).not.toContain("A12");
});

test("flight status: a next-day arrival from the Now row's flight facts shows +1 and a same-day one shows nothing", () => {
  // The contract carries arrival_day_offset only inside a row's own `flight` object, never on document.flight.
  const next = draw(flight({}, undefined, {}, { arrival_day_offset: 1 }));
  expect(next.container.querySelector(".hkc-journey-times sup")!.textContent).toBe("+1");
  cleanup();
  const same = draw(flight({}, undefined, {}, { arrival_day_offset: 0 }));
  expect(same.container.querySelector("sup")).toBeNull();
});

test("flight status: Manage booking goes through the host once, and is not drawn without the callback", () => {
  const { onOpenUrl } = draw(flight());
  fireEvent.click(screen.getByRole("button", { name: "Manage booking" }));
  expect(onOpenUrl).toHaveBeenCalledTimes(1);
  expect(onOpenUrl).toHaveBeenCalledWith("https://www.singaporeair.com/booking");
  cleanup();
  draw(flight(), { onOpenUrl: undefined });
  expect(screen.queryByRole("button", { name: "Manage booking" })).toBeNull();
});

test("flight status: the Was/Now rows open in the full answer in source order, not in the glance card", () => {
  draw(flight());
  expect(screen.queryByRole("list", { name: "Timeline" })).toBeNull();
  cleanup();
  draw(flight(), { mode: "full" });
  expect(within(screen.getByRole("list", { name: "Timeline" })).getAllByRole("listitem").map(li => li.firstElementChild!.textContent)).toEqual(["Was", "Now"]);
});

test("flight status: with no route in the document the generic card draws", () => {
  expect(family.renderFamily(propsOf(flight({ origin_code: undefined })))).toBeUndefined();
  expect(family.renderFamily(propsOf(flight({ destination_code: "tokyo" })))).toBeUndefined();
  expect(family.renderFamily(propsOf({ ...flight(), flight: undefined }))).toBeUndefined();
});

// ---- flight options ----

test("flight options: every row keeps source order, with its airline mark and one booking control", () => {
  const renderBrand = vi.fn(({ domain }: { domain: string }) => <svg data-testid={`mark-${domain}`} />);
  const { container, onOpenUrl } = draw(options(), { renderBrand });
  const rows = within(screen.getByRole("list", { name: "Flights" })).getAllByRole("listitem");
  expect(rows.map(row => row.querySelector(".hkc-journey-airline")!.textContent)).toEqual(["Singapore Airlines", "ANA", "ZIPAIR"]);
  expect(renderBrand.mock.calls.map(call => call[0].domain)).toEqual(["singaporeair.com", "ana.co.jp", "zipair.net"]);
  expect(container.querySelectorAll("[data-testid^=mark-]").length).toBe(3);
  expect(rows.map(row => row.querySelectorAll("button").length)).toEqual([1, 1, 0]);
  fireEvent.click(within(rows[1]).getByRole("button"));
  expect(onOpenUrl).toHaveBeenCalledTimes(1);
  expect(onOpenUrl).toHaveBeenCalledWith("https://www.ana.co.jp/book");
});

test("flight options: without the host callback no booking control is drawn", () => {
  draw(options(), { onOpenUrl: undefined });
  const rows = within(screen.getByRole("list", { name: "Flights" })).getAllByRole("listitem");
  expect(rows).toHaveLength(3);
  expect(rows.flatMap(row => [...row.querySelectorAll("button")])).toEqual([]);
});

test("flight options: next-day arrival shows +1; same-day and missing show no offset", () => {
  const { container } = draw(options());
  const arrivals = [...container.querySelectorAll(".hkc-journey-arrives")].map(node => node.textContent);
  expect(arrivals).toEqual(["Arrives 16:40 · SIN → NRT", "Arrives 06:25+1 · SIN → HND"]);
});

test("flight options: the pick is a word, price and secondary are the agent's own text", () => {
  const { container } = draw(options());
  expect(container.querySelectorAll("[data-pick]").length).toBe(1);
  expect(screen.getByText("Pick")).toBeTruthy();
  expect(screen.getByText("S$548")).toBeTruthy();
  expect(screen.getByText("SQ 638 · 08:35 · 7h 05m direct")).toBeTruthy();
});

test("flight options: inline shows three rows then says how many more; full shows all in order", () => {
  const many = Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, label: `Airline ${i}`, trailing: `S$${i}` }));
  const inline = draw(options(many));
  expect(within(screen.getByRole("list", { name: "Flights" })).getAllByRole("listitem")).toHaveLength(3);
  expect(inline.container.textContent).toContain("2 more");
  cleanup();
  draw(options(many), { mode: "full" });
  expect(within(screen.getByRole("list", { name: "Flights" })).getAllByRole("listitem").map(li => li.querySelector(".hkc-journey-airline")!.textContent)).toEqual(many.map(row => row.label));
});

test("flight options: a row with no brand gets a letter tile; a document with another block falls back", () => {
  const { container } = draw(options([{ label: "Mystery Air", trailing: "S$1" }]));
  expect(container.querySelector("[data-mark=letter]")!.textContent).toBe("M");
  expect(family.renderFamily(propsOf(options(undefined, { blocks: [{ kind: "text", sections: [{ paragraphs: ["x"] }] } as never] })))).toBeUndefined();
  expect(family.renderFamily(propsOf(options(undefined, { blocks: [tracking(), { kind: "rows", items: [{ label: "x" }] }] })))).toBeUndefined();
});

// ---- widgets ----

test("widget sizes: delivery and flight status small and medium; flight options none", () => {
  expect(family.supportedWidgetSizes("delivery-tracking")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("flight-status")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("flight-options")).toEqual([]);
  expect(family.supportedWidgetSizes("weather-now")).toEqual([]);
  for (const size of ["large", "extraLarge"] as const) expect(family.renderFamily(propsOf(delivery(), { widgetSize: size }))).toBeUndefined();
  expect(family.renderFamily(propsOf(options(), { widgetSize: "small" }))).toBeUndefined();
});

test("delivery widget: one open target, the bar only for a sourced progress, the snapshot time kept", () => {
  const small = draw(delivery({ progress: 0 }), { widgetSize: "small" });
  expect(fills(small.container)).toEqual(["0"]);
  expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(screen.getByText(/^As of /)).toBeTruthy();
  fireEvent.click(screen.getByRole("button"));
  expect(small.onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  const medium = draw(delivery({ progress: undefined }), { widgetSize: "medium" });
  expect(fills(medium.container)).toEqual([]);
  expect(within(medium.container).getAllByRole("button")).toHaveLength(1);
  expect(medium.container.textContent).toContain("Preparing");
});

test("flight widget: route, departure, gate or sourced remaining; no invented live state", () => {
  const small = draw(flight({ remaining: "2h 10m left" }, { label: "In the air", condition: "on_time", progress: 60 }), { widgetSize: "small" });
  expect(small.container.textContent).toContain("SQ 638");
  expect(small.container.textContent).toContain("On time");
  expect(small.container.textContent).toContain("2h 10m left");
  expect(fills(small.container)).toEqual(["60"]);
  cleanup();
  const medium = draw(flight(), { widgetSize: "medium" });
  expect(medium.container.textContent).toContain("SIN");
  expect(medium.container.textContent).toContain("Gate B6");
  expect(medium.container.textContent).not.toMatch(/\d+\s?%/);
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

// ---- layout, tokens ----

test("every pressable is legal and named, none nested, and axe finds no violation", async () => {
  for (const view of [draw(delivery({}, { details: { sources: [{ label: "Swiggy" }] } })), draw(flight()), draw(options())]) {
    const targets = [...view.container.querySelectorAll("button, a[href], [role=button]")];
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target.parentElement!.closest("button, a[href], [role=button]")).toBeNull();
      expect((target.textContent ?? "").trim() || target.getAttribute("aria-label")).toBeTruthy();
    }
    const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations.map(violation => violation.id)).toEqual([]);
    view.unmount();
  }
});

test("styles: tokens only (light and dark follow the theme), no hex, no borders, no !important, 44px touch targets", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line) && !line.startsWith("outline: 2px solid var(--hk-accent)"))).toEqual([]);
  const used = new Set([...source.matchAll(/var\((--hk-[a-z0-9-]+)/g)].map(m => m[1]));
  expect(used.size).toBeGreaterThan(5);
  for (const token of used) expect(theme, token).toContain(`${token}:`);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-journey-option[^}]*min-height: 44px/);
  expect(source).toMatch(/hkc-journey-option:focus-visible/);
  expect(source).toMatch(/hkc-journey-widget-open:focus-visible/);
});
