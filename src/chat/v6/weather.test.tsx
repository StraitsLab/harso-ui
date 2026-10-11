import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputDocument } from "../output-card";
import styles from "./weather.css?raw";
import { family, readWeather } from "./weather";
import type { V6Weather, V6WeatherCondition, WidgetSize } from "./types";

// WEV-3320 (P04): the weather-now family. Sky from weather.sky, glyph from current_condition, hourly rain aligned one
// to one with the chart x_labels, a daily range strip from weather.days. Only what the document carries is drawn.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const SKIES = ["clear-day", "clear-night", "cloudy", "rain", "storm"] as const;
const CONDITIONS = ["clear", "night", "partly", "cloudy", "rain", "storm"] as const;
const WORDS: Record<V6WeatherCondition, string> = { clear: "Clear", night: "Clear night", partly: "Partly cloudy", cloudy: "Cloudy", rain: "Rain", storm: "Thunderstorm" };
const LABELS = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const TEMPS: (string | null)[] = ["31", "32", "32", "28", "27", "27"];

const FULL: V6Weather = {
  sky: "storm", current_condition: "partly", high: "32", low: "26",
  hourly: [
    { condition: "partly", rain: 10 }, { condition: "partly", rain: 20 }, { condition: "cloudy", rain: 35 },
    { condition: "storm", rain: 70 }, { condition: "rain", rain: 70 }, { condition: "rain", rain: 60 }
  ],
  days: [
    { label: "Today", condition: "storm", low: "26", high: "32" }, { label: "Sun", condition: "rain", low: "26", high: "31" },
    { label: "Mon", condition: "partly", low: "25", high: "32" }, { label: "Tue", condition: "storm", low: "26", high: "30" },
    { label: "Wed", condition: "partly", low: "26", high: "33" }
  ]
};

type Opts = { weather?: V6Weather | null; values?: (string | null)[]; labels?: string[]; chart?: boolean; blocks?: HarsoOutputDocument["blocks"]; numbers?: boolean };
function doc({ weather = FULL, values = TEMPS, labels = LABELS, chart = true, blocks, numbers = true }: Opts = {}): HarsoOutputDocument {
  return {
    kind: "output_blocks", major: 1, template: "weather-now",
    header: { title: "Singapore", subtitle: "Thunderstorms later" },
    as_of: "2026-10-11T04:05Z",
    ...(weather ? { weather } : {}),
    blocks: blocks ?? [
      ...(numbers ? [{ kind: "numbers" as const, items: [{ value: "31°C", label: "Now" }, { value: "70%", label: "Rain after 3 pm" }] }] : []),
      ...(chart ? [{ kind: "visual" as const, visual: { kind: "chart" as const, chart: "line" as const, unit: "°C", x_labels: labels, series: [{ label: "Temperature", values }] } }] : [])
    ],
    details: { sources: [{ label: "NEA weather forecast", url: "https://www.nea.gov.sg/weather" }] },
    fallback_text: "FALLBACK"
  };
}
const families = { "weather-now": family };
function draw(document: HarsoOutputDocument, extra: { widgetSize?: WidgetSize; mode?: "inline" | "full"; onViewAll?: () => void } = {}) {
  const view = render(<div className="harso-kit"><HarsoOutputCard document={document} families={families} onViewAll={extra.onViewAll ?? vi.fn()} {...extra} /></div>);
  const card = view.container.querySelector<HTMLElement>(".hkc-v6-weather");
  return { view, card };
}
const slot = (card: HTMLElement, name: string) => card.querySelector<HTMLElement>(`[data-slot=${name}]`);
const slots = (card: HTMLElement, name: string) => [...card.querySelectorAll<HTMLElement>(`[data-slot=${name}]`)];
const glyph = (node: Element) => node.querySelector("svg")?.getAttribute("data-condition") ?? null;
const words = (node: Element) => node.querySelector("svg[role=img]")?.getAttribute("aria-label");

// ---- sky and condition values ----

test.each(SKIES)("sky %s picks the sky background", sky => {
  const { card } = draw(doc({ weather: { ...FULL, sky } }));
  expect(card!.getAttribute("data-sky")).toBe(sky);
  expect(styles).toContain(`[data-sky="${sky}"]`);
});

test("an unknown or missing sky leaves the card on its plain surface", () => {
  for (const weather of [{ ...FULL, sky: "foggy" as never }, { ...FULL, sky: undefined }]) {
    const { card } = draw(doc({ weather }));
    expect(card!.hasAttribute("data-sky")).toBe(false);
    cleanup();
  }
});

test.each(CONDITIONS)("condition %s draws its glyph in the hero, an hour and a day", condition => {
  const weather: V6Weather = { ...FULL, current_condition: condition, hourly: Array.from({ length: 6 }, () => ({ condition })), days: [{ label: "Today", condition, low: "26", high: "32" }] };
  const { card } = draw(doc({ weather }));
  expect(glyph(slot(card!, "hero")!)).toBe(condition);
  expect(slot(card!, "condition")!.textContent).toBe(WORDS[condition]);
  expect(slots(card!, "hour").map(glyph)).toEqual(Array(6).fill(condition));
  expect(slots(card!, "hour").map(words)).toEqual(Array(6).fill(WORDS[condition]));
  expect(slots(card!, "day").map(glyph)).toEqual([condition]);
});

test("an unknown condition draws no glyph rather than a guess", () => {
  const weather: V6Weather = { ...FULL, current_condition: "hail" as never, hourly: Array.from({ length: 6 }, () => ({ condition: "hail" as never, rain: 5 })) };
  const { card } = draw(doc({ weather }));
  expect(slot(card!, "hero")!.querySelector("svg")).toBeNull();
  expect(slot(card!, "condition")).toBeNull();
  expect(slots(card!, "hour").every(hour => hour.querySelector("svg") === null)).toBe(true);
  expect(slots(card!, "hour")[0].textContent).toContain("5%");
});

// ---- current versus future ----

test("the hero glyph is the current condition, never the later storm in the hours or the subtitle", () => {
  const { card } = draw(doc());
  expect(glyph(slot(card!, "hero")!)).toBe("partly");
  expect(glyph(slots(card!, "hour")[3])).toBe("storm");
  expect(screen.getByText("Thunderstorms later")).toBeTruthy();
});

test("with no current_condition the hero has no glyph, even though the hours carry a storm", () => {
  const { card } = draw(doc({ weather: { ...FULL, current_condition: undefined } }));
  expect(slot(card!, "hero")!.querySelector("svg")).toBeNull();
  expect(slot(card!, "condition")).toBeNull();
});

test("the first hour keeps the source label; no Now is invented", () => {
  const { card } = draw(doc());
  expect(slots(card!, "hour").map(hour => slot(hour, "time")!.textContent)).toEqual(LABELS);
});

// ---- hero ----

test("the hero shows the current temperature, high and low from the source", () => {
  const { card } = draw(doc());
  expect(slot(card!, "current")!.textContent).toBe("31°");
  expect(slot(card!, "range")!.textContent).toBe("H:32° L:26°");
});

test("high and low are each drawn only when present", () => {
  const onlyHigh = draw(doc({ weather: { ...FULL, low: undefined } }));
  expect(slot(onlyHigh.card!, "range")!.textContent).toBe("H:32°");
  cleanup();
  const none = draw(doc({ weather: { ...FULL, high: undefined, low: undefined } }));
  expect(slot(none.card!, "range")).toBeNull();
});

test("an inverted or non-decimal high and low is not drawn", () => {
  for (const weather of [{ ...FULL, high: "20", low: "26" }, { ...FULL, high: "hot", low: undefined }]) {
    const { card } = draw(doc({ weather }));
    expect(slot(card!, "range")).toBeNull();
    cleanup();
  }
});

test("equal high and low are drawn", () => {
  const { card } = draw(doc({ weather: { ...FULL, high: "28", low: "28" } }));
  expect(slot(card!, "range")!.textContent).toBe("H:28° L:28°");
});

// ---- hourly ----

test("hourly aligns one to one with the chart x_labels: time, condition, temperature, rain", () => {
  const { card } = draw(doc());
  const hours = slots(card!, "hour");
  expect(hours).toHaveLength(6);
  expect(hours.map(h => slot(h, "temp")!.textContent)).toEqual(["31°", "32°", "32°", "28°", "27°", "27°"]);
  expect(hours.map(h => slot(h, "rain")!.textContent)).toEqual(["10%", "20%", "35%", "70%", "70%", "60%"]);
});

test("a null chart point stays a gap: the hour is drawn, its temperature is not reported", () => {
  const { card } = draw(doc({ values: ["31", null, "32", "28", "27", "27"] }));
  const hours = slots(card!, "hour");
  expect(hours).toHaveLength(6);
  const gap = slot(hours[1], "temp")!;
  expect(gap.getAttribute("data-gap")).toBe("true");
  expect(gap.getAttribute("aria-label")).toBe("Temperature not reported");
  expect(gap.textContent).toBe("–");
  expect(slot(hours[1], "time")!.textContent).toBe("13:00");
  expect(slot(hours[1], "rain")!.textContent).toBe("20%");
  expect(slot(hours[0], "temp")!.hasAttribute("data-gap")).toBe(false);
  expect(slot(hours[2], "temp")!.textContent).toBe("32°");
});

test("an hour with no rain figure draws none (never 0%)", () => {
  const weather: V6Weather = { ...FULL, hourly: [{ condition: "clear" }, { rain: 150 }, { rain: -1 }, { rain: 2.5 }, {}, { rain: 0 }] };
  const { card } = draw(doc({ weather }));
  expect(slots(card!, "hour").map(h => slot(h, "rain")?.textContent ?? null)).toEqual([null, null, null, null, null, "0%"]);
});

test("hourly of a different length than the chart is not trusted: temperatures stay, nothing is mis-aligned", () => {
  const { card } = draw(doc({ weather: { ...FULL, hourly: FULL.hourly!.slice(0, 4) } }));
  const hours = slots(card!, "hour");
  expect(hours).toHaveLength(6);
  expect(hours.every(h => slot(h, "rain") === null && h.querySelector("svg") === null)).toBe(true);
  expect(hours.map(h => slot(h, "temp")!.textContent)).toEqual(["31°", "32°", "32°", "28°", "27°", "27°"]);
});

test("a chart with no hourly list draws times and temperatures only", () => {
  const { card } = draw(doc({ weather: { ...FULL, hourly: undefined } }));
  expect(slots(card!, "hour")).toHaveLength(6);
  expect(slots(card!, "rain")).toHaveLength(0);
});

test("hourly with no chart is not drawn: without the chart's x_labels no hour can be named", () => {
  const { card } = draw(doc({ chart: false }));
  expect(slot(card!, "hourly")).toBeNull();
  expect(slot(card!, "rain")).toBeNull();
});

test("neither chart nor hourly means no hourly strip", () => {
  const { card } = draw(doc({ chart: false, weather: { ...FULL, hourly: undefined } }));
  expect(slot(card!, "hourly")).toBeNull();
});

// ---- daily strip ----

test("days are drawn in source order with the bar scaled across the shown days", () => {
  const { card } = draw(doc());
  const days = slots(card!, "day");
  expect(days.map(d => slot(d, "label")!.textContent)).toEqual(["Today", "Sun", "Mon", "Tue", "Wed"]);
  expect(days.map(d => [slot(d, "low")!.textContent, slot(d, "high")!.textContent])).toEqual([["26°", "32°"], ["26°", "31°"], ["25°", "32°"], ["26°", "30°"], ["26°", "33°"]]);
  const bars = days.map(d => slot(d, "bar")!.style);
  expect([bars[0].left, bars[0].width]).toEqual(["12.5%", "75%"]);
  expect([bars[2].left, bars[2].width]).toEqual(["0%", "87.5%"]);
  expect([bars[4].left, bars[4].width]).toEqual(["12.5%", "87.5%"]);
});

test("equal low and high still draw a bar, and the CSS gives it a visible minimum", () => {
  const weather: V6Weather = { days: [{ label: "Sat", condition: "clear", low: "28", high: "28" }, { label: "Sun", condition: "rain", low: "26", high: "30" }] };
  const { card } = draw(doc({ weather }));
  const bar = slot(slots(card!, "day")[0], "bar")!;
  expect([bar.style.left, bar.style.width]).toEqual(["50%", "0%"]);
  expect(styles).toMatch(/hkc-v6-weather-bar[^{]*\{[^}]*min-width:\s*\d+px/);
});

test("every day equal: bars still draw (no divide by zero)", () => {
  const weather: V6Weather = { days: [{ label: "A", condition: "clear", low: "28", high: "28" }, { label: "B", condition: "clear", low: "28", high: "28" }] };
  const { card } = draw(doc({ weather }));
  const bars = slots(card!, "bar");
  expect(bars).toHaveLength(2);
  expect(bars.every(bar => bar.style.left === "0%" && bar.style.width === "0%" && !/NaN|Infinity/.test(bar.getAttribute("style")!))).toBe(true);
});

test("a negative range scales too", () => {
  const weather: V6Weather = { days: [{ label: "A", condition: "cloudy", low: "-10", high: "-2" }, { label: "B", condition: "cloudy", low: "-6", high: "6" }] };
  const { card } = draw(doc({ weather }));
  const bars = slots(card!, "bar").map(bar => [bar.style.left, bar.style.width]);
  expect(bars).toEqual([["0%", "50%"], ["25%", "75%"]]);
});

test("an inverted day, a non-decimal day or too many days: no daily strip at all, nothing invented", () => {
  const day = (low: string, high: string) => ({ label: "D", condition: "clear" as const, low, high });
  for (const days of [[day("26", "32"), day("30", "25")], [day("x", "32")], Array.from({ length: 8 }, () => day("20", "30"))]) {
    const { card } = draw(doc({ weather: { ...FULL, days } }));
    expect(slot(card!, "days")).toBeNull();
    expect(card!.textContent).toContain("Singapore");
    cleanup();
  }
});

test("missing days list means no daily strip", () => {
  for (const days of [undefined, []]) {
    const { card } = draw(doc({ weather: { ...FULL, days } }), { widgetSize: "large" });
    expect(slot(card!, "days")).toBeNull();
    cleanup();
  }
});

// ---- when the family declines ----

test("without a weather object the generic card draws the whole answer", () => {
  const { card, view } = draw(doc({ weather: null }));
  expect(card).toBeNull();
  expect(view.container.querySelector(".hkc-output-card")).not.toBeNull();
});

test("a weather object with nothing readable declines", () => {
  const { card } = draw(doc({ weather: { sky: "foggy" as never, high: "20", low: "26" } }));
  expect(card).toBeNull();
});

test("a block the card cannot draw sends the whole answer to the generic card", () => {
  const blocks = [...doc().blocks, { kind: "text" as const, sections: [{ paragraphs: ["Umbrella advised."] }] }];
  const { card } = draw(doc({ blocks }));
  expect(card).toBeNull();
  expect(screen.getByText("Umbrella advised.")).toBeTruthy();
});

test("an unreadable chart, or more than one series, declines", () => {
  const two = doc();
  (two.blocks[1] as { visual: { series: unknown[] } }).visual.series.push({ label: "Feels like", values: TEMPS });
  expect(draw(two).card).toBeNull();
  cleanup();
  expect(draw(doc({ labels: LABELS, values: ["1", "2"] })).card).toBeNull();
});

test("extraLarge is not a weather size: the generic card draws", () => {
  expect(draw(doc(), { widgetSize: "extraLarge" }).card).toBeNull();
});

test("supportedWidgetSizes: small, medium, large for weather-now and none for any other template", () => {
  expect(family.supportedWidgetSizes("weather-now")).toEqual(["small", "medium", "large"]);
  expect(family.supportedWidgetSizes("stock-quote")).toEqual([]);
});

test("readWeather is undefined for a plain document", () => {
  expect(readWeather({ ...doc(), weather: undefined })).toBeUndefined();
});

// ---- extra numbers, hero without temperature ----

test("further numbers draw as lines under the hero, in order", () => {
  const { card } = draw(doc());
  expect(slots(card!, "note").map(n => n.textContent)).toEqual(["Rain after 3 pm · 70%"]);
});

test("a number with a delta is not one this card can draw", () => {
  const blocks = [{ kind: "numbers" as const, items: [{ value: "31°C", label: "Now", delta: "+2" }] }];
  expect(draw(doc({ blocks })).card).toBeNull();
});

test("with no numbers block the hero has no temperature (none is taken from the chart)", () => {
  const { card } = draw(doc({ numbers: false }));
  expect(slot(card!, "current")).toBeNull();
  expect(slot(card!, "range")!.textContent).toBe("H:32° L:26°");
});

// ---- widget sizes ----

test("small: the hero only, no hours or days", () => {
  const { card } = draw(doc(), { widgetSize: "small" });
  expect(card!.getAttribute("data-widget")).toBe("small");
  expect(slot(card!, "hero")).not.toBeNull();
  expect(slot(card!, "hourly")).toBeNull();
  expect(slot(card!, "days")).toBeNull();
});

test("medium: the hero and the first five hours, no days", () => {
  const { card } = draw(doc(), { widgetSize: "medium" });
  expect(slots(card!, "hour").map(h => slot(h, "time")!.textContent)).toEqual(LABELS.slice(0, 5));
  expect(slot(card!, "days")).toBeNull();
});

test("large: the hero, five hours and the days", () => {
  const { card } = draw(doc(), { widgetSize: "large" });
  expect(slots(card!, "hour")).toHaveLength(5);
  expect(slots(card!, "day")).toHaveLength(5);
});

test("a widget has no Details toggle, but still shows the snapshot time and opens the answer once", () => {
  const onViewAll = vi.fn();
  const { card } = draw(doc(), { widgetSize: "medium", onViewAll });
  expect(within(card!).queryByRole("button", { name: "Details" })).toBeNull();
  expect(card!.textContent).toMatch(/As of /);
  fireEvent.click(within(card!).getByRole("button", { name: "Singapore" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
});

test("a card keeps every hour and its Details; the title opens the answer", () => {
  const onViewAll = vi.fn();
  const { card } = draw(doc(), { onViewAll });
  expect(within(card!).getByRole("button", { name: "Details" })).toBeTruthy();
  fireEvent.click(within(card!).getByRole("button", { name: "Singapore" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
  expect(slots(card!, "day")).toHaveLength(5);
});

test("full mode: the title is a plain heading", () => {
  const { card } = draw(doc(), { mode: "full" });
  expect(within(card!).queryByRole("button", { name: "Singapore" })).toBeNull();
});

// ---- truth ----

test("drawing makes no request and does not read the device clock for a live claim", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.useFakeTimers(); vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
  const { card } = draw(doc());
  vi.useRealTimers();
  expect(fetch).not.toHaveBeenCalled();
  expect(card!.textContent).not.toMatch(/live|just now|updated|ago/i);
});

test("the document is not changed", () => {
  const document = doc();
  const copy = structuredClone(document);
  draw(document, { widgetSize: "large" });
  expect(document).toEqual(copy);
});

// ---- access ----

test("axe finds no violation in the card, the widget and a sky-less card", async () => {
  for (const [document, widgetSize] of [[doc(), undefined], [doc(), "large"], [doc({ weather: { ...FULL, sky: undefined } }), undefined]] as const) {
    const { view } = draw(document, { widgetSize });
    const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map(v => v.id)).toEqual([]);
    cleanup();
  }
});

// ---- styles ----

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const hex = (value: string) => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
const lum = ([r, g, b]: number[]) => [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: number[], b: number[]) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const WHITE = [1, 1, 1];

test("styles: raw colours live only in --hkc-sky/--hkc-wx custom properties; no !important, no font-family", () => {
  const rest = strip(styles).replace(/--hkc-(?:sky|wx)[\w-]*:\s*[^;]+;/g, "");
  expect(rest).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(rest).not.toMatch(/!important/);
  expect(rest).not.toMatch(/font-family/);
});

test("styles: every sky has a light and a dark definition, and white text reads on every stop in both", () => {
  const source = strip(styles);
  const dark = source.slice(source.indexOf('[data-mode="dark"]'));
  const veil = /--hkc-sky-veil:\s*(\d*\.?\d+)/.exec(dark)?.[1];
  expect(veil, "the dark mode veil").toBeDefined();
  for (const sky of SKIES) {
    const stops = [...source.matchAll(new RegExp(`--hkc-sky-${sky}-(?:from|mid|to):\\s*(#[0-9a-f]{6})`, "gi"))].map(m => m[1]);
    expect(stops.length, `${sky} stops`).toBeGreaterThanOrEqual(2);
    for (const stop of stops) {
      expect(contrast(WHITE, hex(stop)), `${sky} ${stop} light`).toBeGreaterThanOrEqual(4.5);
      const veiled = hex(stop).map(c => c * (1 - Number(veil)));
      expect(contrast(WHITE, veiled), `${sky} ${stop} dark`).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(contrast(WHITE, hex(/--hkc-wx-rain:\s*(#[0-9a-f]{6})/i.exec(source)![1]))).toBeGreaterThan(1);
});

test("styles: the rain text colour reads on the lightest sky stop", () => {
  const source = strip(styles);
  const rain = hex(/--hkc-wx-rain:\s*(#[0-9a-f]{6})/i.exec(source)![1]);
  const stops = [...source.matchAll(/--hkc-sky-[\w-]+-(?:from|mid|to):\s*(#[0-9a-f]{6})/gi)].map(m => m[1]);
  for (const stop of stops) expect(contrast(rain, hex(stop)), stop).toBeGreaterThanOrEqual(4.5);
});

test("styles: a forced-colors rule and a visible focus ring for the scroll region", () => {
  expect(styles).toMatch(/forced-colors: active/);
  expect(styles).toMatch(/hkc-v6-weather-hours:focus-visible/);
});
