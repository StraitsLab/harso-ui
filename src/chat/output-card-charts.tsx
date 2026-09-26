"use client";

import { Clock, Info, WarningCircle } from "@phosphor-icons/react";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../primitives";
import "./output-card-charts.css";

/*
 * Packet 5b: chart (bar, line), share and table blocks for the inline output card, drawn from the published B0 v4
 * masters (`v4/macOS/<theme>/{bar,line,share,table}/<state>`). Charts are hand-built SVG: axis baseline, the highlighted
 * datum labelled, direct labels, units on every axis figure. Local copy of the output-blocks.v1 subset these read.
 */

export interface HarsoOutputSeries { label: string; values: (string | null)[] }
export interface HarsoOutputChart { kind: "chart"; chart: "bar" | "line"; unit?: string; x_labels: string[]; series: HarsoOutputSeries[]; highlight_index?: number }
export interface HarsoOutputVisualBlock { kind: "visual"; visual: HarsoOutputChart | { kind: string; [key: string]: unknown } }
export interface HarsoOutputTableColumn { label: string; align?: "start" | "end" }
export interface HarsoOutputTableRow { cells: string[]; status?: string }
export interface HarsoOutputTableBlock { kind: "table"; columns: HarsoOutputTableColumn[]; rows: HarsoOutputTableRow[]; total_count?: number }

/**
 * Host-owned state of one block (the contract has no per-block state yet, G20). `ready` is the default.
 * `onRetry` is the only way a Try again button appears: nothing is shown that cannot act.
 */
export interface HarsoOutputBlockState {
  state: "ready" | "loading" | "empty" | "partial" | "stale" | "failed";
  /** Empty/partial/stale note or failed headline, e.g. "3 of 4 weeks · 22–30 Sep still syncing", "As of 09:10 · couldn't refresh". */
  message?: string;
  /** Failed only: what happened and what did not change. */
  reason?: string;
  onRetry?: () => void;
}

/** Any output block, read by shape (the host validates the document before it reaches the kit). */
type AnyBlock = { kind: string };
type Row = { label: string; secondary?: string; trailing?: string; mark?: string; status?: string };

const DECIMAL = /^-?\d{1,15}(\.\d{1,6})?$/;
const PERCENT = /^(\d{1,3}(?:\.\d{1,2})?)\s?%$/;

/** The chart this card can draw, or undefined (the card then falls back to text). Multi-series bars are not built. */
export function readChart(block: AnyBlock): HarsoOutputChart | undefined {
  if (block.kind !== "visual") return undefined;
  const chart = (block as Partial<HarsoOutputVisualBlock>).visual as HarsoOutputChart | undefined;
  if (!chart || chart.kind !== "chart" || (chart.chart !== "bar" && chart.chart !== "line")) return undefined;
  const count = Array.isArray(chart.x_labels) ? chart.x_labels.length : 0;
  if (count < 2 || !Array.isArray(chart.series) || !chart.series.length || (chart.chart === "bar" && chart.series.length > 1)) return undefined;
  const valid = chart.series.every(series => Array.isArray(series?.values) && series.values.length === count
    && series.values.every(value => value === null || (typeof value === "string" && DECIMAL.test(value))));
  return valid ? chart : undefined;
}

/**
 * Shares of a whole, as the playbook tells the agent to send them: every row has `N%` as its secondary and an amount
 * trailing, largest first, adding up to 100% (±1 point per two rows of rounding). Returns the shares, else undefined
 * (the rows then draw as ordinary rows).
 */
export function readShare(items: Row[]): number[] | undefined {
  if (items.length < 2) return undefined;
  const shares: number[] = [];
  for (const row of items) {
    const match = row.trailing && row.mark == null && row.status == null ? PERCENT.exec(row.secondary?.trim() ?? "") : null;
    if (!match) return undefined;
    shares.push(Number(match[1]));
  }
  if (shares.some((share, index) => index > 0 && share > shares[index - 1])) return undefined;
  const sum = shares.reduce((total, share) => total + share, 0);
  return Math.abs(sum - 100) <= Math.ceil(items.length / 2) ? shares : undefined;
}

/** The table this card can draw: 2+ columns, 1+ rows, every row as wide as the header, no row status words (they fall back). */
export function readTable(block: AnyBlock): HarsoOutputTableBlock | undefined {
  if (block.kind !== "table") return undefined;
  const table = block as Partial<HarsoOutputTableBlock> as HarsoOutputTableBlock;
  if (!Array.isArray(table.columns) || table.columns.length < 2 || !Array.isArray(table.rows) || !table.rows.length) return undefined;
  const ok = table.rows.every(row => Array.isArray(row?.cells) && row.cells.length === table.columns.length && row.status == null);
  return ok ? table : undefined;
}

/**
 * The playbook's total row (G4: no totals field yet): the last row labelled exactly "Total", or "Total · N" as the B0
 * table master draws it. Anything else ("Total Energies", "Total floor area") is an ordinary row.
 */
export const isTotalRow = (table: HarsoOutputTableBlock, index: number) =>
  index === table.rows.length - 1 && table.rows.length > 1 && /^Total(?: · \d+)?$/.test(table.rows[index].cells[0]?.trim() ?? "");

// ---- numbers and units ----
// Values are exact: a contract decimal (15 digits, 6 places) is held as BigInt millionths and printed from its digits.
// Floats are used only for pixel ratios.

const MINUS = "\u2212", MICRO = 1_000_000n;
function decimals(value: string) { return value.split(".")[1]?.length ?? 0; }
/** A contract decimal string as integer millionths: "-12.5" → -12500000n. */
export function toMicro(value: string): bigint {
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const micro = BigInt(whole) * MICRO + BigInt(fraction.padEnd(6, "0"));
  return value.startsWith("-") ? -micro : micro;
}

/** A figure with its unit where people expect it: S$1,160 · S$402.5k · 32% · 31°C · 7.8 hours. */
function attachUnit(sign: string, body: string, unit?: string) {
  const trimmed = unit?.trim();
  if (!trimmed) return sign + body;
  const money = /^([A-Z]{0,3}[$€£¥₹])(k|m|bn|K|M|B)?$/.exec(trimmed);
  if (money) return `${sign}${money[1]}${body}${money[2] ?? ""}`;
  if (/^(%|°C|°F|°|k|x|×)$/.test(trimmed)) return `${sign}${body}${trimmed}`;
  return `${sign}${body}\u00a0${trimmed}`;
}
/** Millionths printed with `places` decimals (0–6), grouped, with the unit. Exact for every contract value. */
export function formatMicro(micro: bigint, places: number, unit?: string) {
  const size = micro < 0n ? -micro : micro;
  const whole = (size / MICRO).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = places > 0 ? `.${(size % MICRO).toString().padStart(6, "0").slice(0, places)}` : "";
  return attachUnit(micro < 0n ? MINUS : "", whole + fraction, unit);
}
/** A contract value as the agent wrote it: every decimal it sent, none it did not. */
export const formatValue = (value: string, unit?: string) => formatMicro(toMicro(value), decimals(value), unit);

const LADDER = [10n, 15n, 20n, 25n, 30n, 40n, 50n]; // tenths: 1, 1.5, 2, 2.5, 3, 4, 5 × 10^k
function niceStep(raw: bigint) {
  for (let magnitude = 1n; ; magnitude *= 10n) for (const tenths of LADDER) {
    if (tenths * magnitude % 10n) continue;
    const step = tenths * magnitude / 10n;
    if (step >= raw) return step;
  }
}
const floorDiv = (a: bigint, b: bigint) => (a < 0n && a % b ? a / b - 1n : a / b);
const ceilDiv = (a: bigint, b: bigint) => (a > 0n && a % b ? a / b + 1n : a / b);

/**
 * Axis ticks in millionths. Bars always include zero (a bar needs its baseline); a line spans its data, and includes
 * zero when the data does. Two intervals, like the B0 masters (S$0 · S$1,000 · S$2,000). Ticks are exact multiples of
 * the step, so they are distinct and `places` shows each one without rounding.
 */
export function scale(values: string[], zero: boolean) {
  const micros = values.map(toMicro);
  let lo = micros.reduce((a, b) => (b < a ? b : a)), hi = micros.reduce((a, b) => (b > a ? b : a));
  if (zero) { lo = lo < 0n ? lo : 0n; hi = hi > 0n ? hi : 0n; }
  if (hi === lo) { const pad = (hi < 0n ? -hi : hi) || MICRO; if (zero && lo === 0n) hi = pad; else { lo -= pad / 2n; hi += (pad + 1n) / 2n; } }
  const step = niceStep(ceilDiv(hi - lo, 2n));
  const bottom = floorDiv(lo, step) * step, top = ceilDiv(hi, step) * step;
  const ticks: bigint[] = [];
  for (let tick = bottom; tick <= top; tick += step) ticks.push(tick);
  let places = 6;
  for (let rest = step; places > 0 && rest % 10n === 0n; rest /= 10n) places--;
  return { bottom, top, ticks, places };
}

/**
 * Equal day ranges read as equal weeks; a period of a different length says so ("22–31 Aug" + "10 days").
 * Only when every label is a day range in one month ("1–7", "8–14 Aug").
 */
export function periodNotes(labels: string[]) {
  const spans = labels.map(label => {
    const match = /^(\d{1,2})\s*[–-]\s*(\d{1,2})(?:\s+\p{L}+)?$/u.exec(label.trim());
    return match && Number(match[2]) >= Number(match[1]) ? Number(match[2]) - Number(match[1]) + 1 : undefined;
  });
  if (spans.some(span => span === undefined)) return labels.map(() => undefined);
  const counts = new Map<number, number>();
  spans.forEach(span => counts.set(span!, (counts.get(span!) ?? 0) + 1));
  const usual = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return spans.map(span => span !== usual ? `${span} days` : undefined);
}

// ---- drawing ----

const AXIS = 12, LINE_HEIGHT = 16, PLOT = 160, BAR_MAX = 36, DEFAULT_WIDTH = 480;
type Measure = (text: string) => number;
/** Without a laid-out font (jsdom, first render): wide characters (CJK, emoji) a full em, everything else 0.6em. */
const estimate: Measure = text => Array.from(text).reduce((width, char) => width + AXIS * (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]|\p{Extended_Pictographic}/u.test(char) ? 1 : .6), 0);

/**
 * Rendered width of chart text, measured by an SVG text node styled by the same rules as the chart's own text
 * (the kit's --hk-font and --hk-text-meta tokens, weight 500, tabular figures). No font is named here.
 */
function measurer(node: SVGTextElement | null): Measure {
  if (!node || typeof node.getComputedTextLength !== "function") return estimate;
  const cache = new Map<string, number>();
  return text => {
    let width = cache.get(text);
    if (width === undefined) {
      node.textContent = text;
      try { width = Math.ceil(node.getComputedTextLength()) + 1; } catch { width = estimate(text); }
      node.textContent = "";
      cache.set(text, width);
    }
    return width;
  };
}

function useWidth() {
  const node = useRef<HTMLDivElement>(null);
  const probe = useRef<SVGTextElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [fonts, setFonts] = useState(0);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = () => { if (element.clientWidth > 0) setWidth(Math.round(element.clientWidth)); };
    measure();
    // Draw again with the probe attached (the first render could only estimate), and once the web font has loaded.
    setFonts(value => value + 1);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    let live = true;
    globalThis.document?.fonts?.ready.then(() => { if (live) setFonts(value => value + 1); });
    return () => { live = false; observer?.disconnect(); };
  }, []);
  // A fresh measurer per font generation: widths cached before the font loaded are dropped.
  const measure = useMemo(() => fonts ? measurer(probe.current) : estimate, [fonts]);
  return { node, probe, width, fonts, measure };
}

/** The text, cut with an ellipsis if it is wider than `max` on its own (labels only; figures are never cut). */
function fitText(text: string, max: number, measure: Measure) {
  if (measure(text) <= max) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && measure(`${chars.join("")}…`) > max) chars.pop();
  return `${chars.join("").trimEnd()}…`;
}

type XLabel = { index: number; x: number; anchor: "start" | "middle" | "end"; lines: string[]; strong: boolean; tier: number };

/**
 * X labels. First, last, the highlighted period and any uneven period are required: when one would touch another it
 * drops to a row below (staggered), it is never removed. The rest are shown while they fit on the first row, 8px apart.
 * Returns the labels and the rows (in lines) they occupy.
 */
function placeLabels(labels: string[], notes: (string | undefined)[], xOf: (index: number) => number, plotWidth: number, highlight: number | undefined, sparse: boolean, measure: Measure) {
  const last = labels.length - 1;
  const extent = (index: number) => {
    const lines = ([labels[index], notes[index]].filter(Boolean) as string[]).map(line => fitText(line, plotWidth, measure));
    const width = Math.max(...lines.map(line => measure(line)));
    const x = xOf(index);
    const anchor: XLabel["anchor"] = index === 0 && x - width / 2 < 0 ? "start" : index === last && x + width / 2 > plotWidth ? "end" : "middle";
    const ax = anchor === "start" ? 0 : anchor === "end" ? plotWidth : Math.min(plotWidth - width / 2, Math.max(width / 2, x));
    const left = anchor === "start" ? 0 : anchor === "end" ? plotWidth - width : ax - width / 2;
    return { index, x: ax, anchor, lines, strong: index === highlight, tier: 0, left, right: left + width };
  };
  const inRange = (index: number | undefined): index is number => index !== undefined && index >= 0 && index <= last && !!labels[index]?.trim();
  const required = [...new Set([highlight, 0, last, ...notes.map((note, index) => note ? index : undefined)].filter(inRange))];
  const optional: number[] = [];
  if (!sparse || labels.length <= 7) for (let index = 1; index < last; index++) if (!required.includes(index) && inRange(index)) optional.push(index);
  const placed: ReturnType<typeof extent>[] = [];
  const clear = (box: ReturnType<typeof extent>, tier: number) => placed.every(other => other.tier !== tier || box.right + 8 <= other.left || box.left >= other.right + 8);
  for (const index of required) {
    const box = extent(index);
    while (!clear(box, box.tier)) box.tier++;
    placed.push(box);
  }
  for (const index of optional) {
    const box = extent(index);
    if (box.lines.length === 1 && clear(box, 0)) placed.push(box);
  }
  const tiers = Math.max(0, ...placed.map(box => box.tier)) + 1;
  const rows = Array.from({ length: tiers }, (_, tier) => Math.max(1, ...placed.filter(box => box.tier === tier).map(box => box.lines.length)));
  const labelsOut: XLabel[] = placed.map(({ index, x, anchor, lines, strong, tier }) => ({ index, x, anchor, lines, strong, tier })).sort((a, b) => a.index - b.index);
  return { labels: labelsOut, rows };
}

function XLabels({ labels, rows, y }: { labels: XLabel[]; rows: number[]; y: number }) {
  const offset = (tier: number) => rows.slice(0, tier).reduce((sum, lines) => sum + lines * LINE_HEIGHT, 0);
  return <>{labels.map(label => <text key={label.index} x={label.x} y={y + AXIS + offset(label.tier)} textAnchor={label.anchor}
    className={label.strong ? "hkc-chart-x hkc-chart-x--strong" : "hkc-chart-x"}>
    {label.lines.map((line, index) => <tspan key={index} x={label.x} dy={index ? LINE_HEIGHT : 0}
      className={index ? "hkc-chart-x-note" : undefined}>{line}</tspan>)}
  </text>)}</>;
}

function Axis({ ticks, y, width, plotWidth, unit, places, zeroLine }: { ticks: bigint[]; y: (value: bigint) => number; width: number; plotWidth: number; unit?: string; places: number; zeroLine: bigint }) {
  return <>
    {ticks.map(tick => <g key={tick.toString()}>
      {tick !== zeroLine && <line x1={0} x2={plotWidth} y1={Math.round(y(tick)) + .5} y2={Math.round(y(tick)) + .5} className="hkc-chart-grid" />}
      <text x={width} y={y(tick) + 4} textAnchor="end" className="hkc-chart-axis">{formatMicro(tick, places, unit)}</text>
    </g>)}
    <line x1={0} x2={plotWidth} y1={Math.round(y(zeroLine)) + .5} y2={Math.round(y(zeroLine)) + .5} className="hkc-chart-baseline" />
  </>;
}

const barPath = (x: number, top: number, width: number, height: number, down: boolean) => {
  const r = Math.min(4, width / 2, height);
  return down
    ? `M${x} ${top}h${width}v${height - r}q0 ${r} ${-r} ${r}h${-(width - 2 * r)}q${-r} 0 ${-r} ${-r}z`
    : `M${x} ${top + height}v${-(height - r)}q0 ${-r} ${r} ${-r}h${width - 2 * r}q${r} 0 ${r} ${r}v${height - r}z`;
};

function frame(chart: HarsoOutputChart, width: number, measure: Measure) {
  const numbers = chart.series.flatMap(series => series.values.filter((value): value is string => value !== null));
  const axis = scale(numbers.length ? numbers : ["0"], chart.chart === "bar" || numbers.some(value => toMicro(value) <= 0n));
  const labelWidth = Math.max(40, ...axis.ticks.map(tick => measure(formatMicro(tick, axis.places, chart.unit)))) + 8;
  const plotWidth = Math.max(80, width - labelWidth);
  const span = Number(axis.top - axis.bottom);
  /** Pixel offset of a value down from the axis top, over `height` px. */
  const ratio = (value: bigint) => Number(axis.top - value) / span;
  return { ...axis, labelWidth, plotWidth, ratio };
}

function BarChart({ chart, width, measure }: { chart: HarsoOutputChart; width: number; measure: Measure }) {
  const f = frame(chart, width, measure);
  const values = chart.series[0].values;
  const hi = chart.highlight_index != null && values[chart.highlight_index] != null ? chart.highlight_index : undefined;
  const slot = f.plotWidth / values.length, barWidth = Math.min(BAR_MAX, Math.round(slot * .56));
  const center = (index: number) => index * slot + slot / 2;
  // The highlighted figure: over (or under) its bar when it fits the plot; wider than the plot, it takes its own row
  // above the chart, clamped inside the card. A figure is never cut.
  const valueText = hi === undefined ? undefined : formatValue(values[hi]!, chart.unit);
  const valueWidth = valueText ? measure(valueText) : 0;
  const ownRow = valueWidth + 4 > f.plotWidth;
  const top = ownRow ? LINE_HEIGHT + 14 : LINE_HEIGHT + 6, below = f.bottom < 0n && !ownRow ? LINE_HEIGHT + 6 : 0;
  const y = (value: bigint) => top + PLOT * f.ratio(value);
  const zero = y(0n), plotBottom = top + PLOT + below;
  const notes = periodNotes(chart.x_labels);
  const { labels, rows } = placeLabels(chart.x_labels, notes, center, f.plotWidth, hi, false, measure);
  const height = plotBottom + 6 + LINE_HEIGHT * rows.reduce((sum, lines) => sum + lines, 0);
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="hkc-chart-svg">
    <Axis ticks={f.ticks} y={y} width={width} plotWidth={f.plotWidth} unit={chart.unit} places={f.places} zeroLine={0n} />
    {values.map((value, index) => {
      const x = Math.round(center(index) - barWidth / 2);
      if (value === null) return <rect key={index} x={Math.round(center(index) - 8)} y={zero - 2} width={16} height={2} rx={1} className="hkc-chart-missing" data-index={index} />;
      const n = toMicro(value), end = y(n), down = n < 0n, h = Math.abs(end - zero);
      const strong = index === hi;
      return <g key={index}>
        {h >= .5 && <path d={barPath(x, down ? zero : end, barWidth, h, down)} className={strong ? "hkc-chart-mark hkc-chart-mark--strong" : "hkc-chart-mark"} data-index={index} />}
        {strong && (ownRow
          ? <text x={Math.max(0, Math.min(width - valueWidth, center(index) - valueWidth / 2))} y={AXIS} className="hkc-chart-value">{valueText}</text>
          // Centred on its bar, but never past the plot's edges (a first or last bar in a narrow pane).
          : <text x={Math.min(f.plotWidth - valueWidth / 2, Math.max(valueWidth / 2, center(index)))} y={down ? end + LINE_HEIGHT : end - 5} textAnchor="middle" className="hkc-chart-value">{valueText}</text>)}
      </g>;
    })}
    <XLabels labels={labels} rows={rows} y={plotBottom + 6} />
  </svg>;
}

const DASH = [undefined, "6 4", "1.5 4"];
function LineChart({ chart, width, measure }: { chart: HarsoOutputChart; width: number; measure: Measure }) {
  const f = frame(chart, width, measure);
  const count = chart.x_labels.length, highlight = chart.highlight_index != null && chart.highlight_index < count ? chart.highlight_index : undefined;
  const top = LINE_HEIGHT + 4 + 12;
  const y = (value: bigint) => top + PLOT * f.ratio(value);
  const step = (f.plotWidth - 12) / (count - 1), x = (index: number) => 6 + index * step;
  const plotBottom = top + PLOT;
  const zeroLine = f.bottom <= 0n && f.top >= 0n ? 0n : f.bottom;
  const { labels, rows } = placeLabels(chart.x_labels, chart.x_labels.map(() => undefined), x, f.plotWidth, highlight, true, measure);
  const height = plotBottom + 6 + LINE_HEIGHT * rows.reduce((sum, lines) => sum + lines, 0);
  const points = highlight === undefined ? [] : chart.series.map(series => series.values[highlight]).filter((value): value is string => value !== null);
  // The pill sits above the plot and may use the card's full width. A single series shows "value · period"; when that
  // is too wide the period goes (it is the strong x label below), and the figure itself is never cut.
  let pill: string | undefined;
  if (highlight !== undefined && points.length) {
    if (chart.series.length > 1) pill = fitText(chart.x_labels[highlight], width - 12, measure);
    else {
      const value = formatValue(points[0], chart.unit), both = `${value} · ${chart.x_labels[highlight]}`;
      pill = measure(both) + 12 <= width ? both : value;
    }
  }
  const pillWidth = pill ? measure(pill) + 12 : 0;
  const pillX = highlight === undefined ? 0 : Math.max(0, Math.min(Math.max(f.plotWidth, pillWidth) - pillWidth, x(highlight) - pillWidth / 2));
  const highest = points.length ? Math.min(...points.map(value => y(toMicro(value)))) : 0;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="hkc-chart-svg">
    <Axis ticks={f.ticks} y={y} width={width} plotWidth={f.plotWidth} unit={chart.unit} places={f.places} zeroLine={zeroLine} />
    {chart.series.map((series, seriesIndex) => {
      const runs: [number, number][][] = [[]];
      series.values.forEach((value, index) => value === null ? runs.push([]) : runs[runs.length - 1].push([x(index), y(toMicro(value))]));
      return <g key={seriesIndex} className="hkc-chart-series" data-series={seriesIndex}>
        {runs.filter(run => run.length).map((run, runIndex) => run.length === 1
          ? <circle key={runIndex} cx={run[0][0]} cy={run[0][1]} r={2} className="hkc-chart-dot" />
          : <path key={runIndex} d={run.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ")}
            className="hkc-chart-line" strokeDasharray={DASH[seriesIndex]} />)}
      </g>;
    })}
    {chart.x_labels.map((_, index) => chart.series.every(series => series.values[index] === null)
      ? <rect key={index} x={Math.round(x(index)) - .5} y={plotBottom - 10} width={1} height={10} className="hkc-chart-missing" data-index={index} /> : null)}
    {pill && highlight !== undefined && <g className="hkc-chart-highlight">
      <line x1={Math.round(x(highlight)) + .5} x2={Math.round(x(highlight)) + .5} y1={LINE_HEIGHT + 4} y2={Math.max(LINE_HEIGHT + 4, highest - 7)} className="hkc-chart-leader" />
      <rect x={pillX} y={0} width={pillWidth} height={LINE_HEIGHT + 4} rx={6} className="hkc-chart-knockout" />
      <text x={pillX + 6} y={AXIS + 2} className="hkc-chart-value">{pill}</text>
      {chart.series.map((series, seriesIndex) => series.values[highlight] === null ? null : <g key={seriesIndex}>
        <circle cx={x(highlight)} cy={y(toMicro(series.values[highlight]!))} r={7} className="hkc-chart-halo" />
        <circle cx={x(highlight)} cy={y(toMicro(series.values[highlight]!))} r={4} className="hkc-chart-point" />
      </g>)}
    </g>}
    <XLabels labels={labels} rows={rows} y={plotBottom + 6} />
  </svg>;
}

/** The data behind the drawing, for screen readers: every value with its unit, the highlighted period named. */
function ChartTable({ chart }: { chart: HarsoOutputChart }) {
  // The sr-only clip is on a wrapper: a table ignores the 1px width and would widen the page while clipped.
  return <div className="hk-sr-only"><table>
    <caption>{chart.series.map(series => series.label).join(", ")}{chart.unit ? ` (${chart.unit})` : ""}</caption>
    <thead><tr><th scope="col">Period</th>{chart.series.map((series, index) => <th key={index} scope="col">{series.label}</th>)}</tr></thead>
    <tbody>{chart.x_labels.map((label, index) => <tr key={index}>
      <th scope="row">{label}{index === chart.highlight_index ? " (highlighted)" : ""}</th>
      {chart.series.map((series, seriesIndex) => <td key={seriesIndex}>{series.values[index] === null ? "Not reported" : formatValue(series.values[index]!, chart.unit)}</td>)}
    </tr>)}</tbody>
  </table></div>;
}

export function HarsoOutputChartView({ chart }: { chart: HarsoOutputChart }) {
  const { node, probe, width, fonts, measure } = useWidth();
  return <figure className="hkc-output-chart" data-chart={chart.chart} data-fonts={fonts}>
    <figcaption className="hkc-output-chart-caption">
      {chart.series.length === 1 ? chart.series[0].label
        : <ul className="hkc-output-chart-key">{chart.series.map((series, index) => <li key={index}>
          <svg width={20} height={8} aria-hidden="true" focusable="false"><line x1={1} x2={19} y1={4} y2={4} className="hkc-chart-line" strokeDasharray={DASH[index]} /></svg>
          {series.label}
        </li>)}</ul>}
    </figcaption>
    <div ref={node} className="hkc-output-chart-plot">{chart.chart === "bar" ? <BarChart chart={chart} width={width} measure={measure} /> : <LineChart chart={chart} width={width} measure={measure} />}</div>
    <svg className="hkc-chart-measure" aria-hidden="true" focusable="false"><text ref={probe} className="hkc-chart-measure-text" /></svg>
    <ChartTable chart={chart} />
  </figure>;
}

/** Segment and key tone: ink at 100% down to 55% over the card, so the lightest reaches >= 3:1 (lead ruling). */
const tone = (index: number, count: number) => ({ "--hkc-tone": `${count < 2 ? 100 : Math.round(100 - 45 * index / (count - 1))}%` } as CSSProperties);

export function HarsoOutputShareView({ items, shares, shown }: { items: Row[]; shares: number[]; shown: number }) {
  const sum = shares.reduce((total, share) => total + share, 0) || 1;
  return <div className="hkc-output-share">
    <div className="hkc-output-share-bar" aria-hidden="true">
      {shares.map((share, index) => <span key={index} className="hkc-output-share-segment" style={{ ...tone(index, shares.length), flexGrow: share / sum }} />)}
    </div>
    <ul className="hkc-output-share-rows">
      {items.slice(0, shown).map((row, index) => <li key={index} className="hkc-output-share-row">
        <span className="hkc-output-share-key" aria-hidden="true" style={tone(index, shares.length)} />
        <span className="hkc-output-share-label">{row.label}</span>
        <span className="hkc-output-share-percent">{row.secondary}</span>
        <span className="hkc-output-share-amount">{row.trailing}</span>
      </li>)}
    </ul>
  </div>;
}

export function HarsoOutputTableView({ table, shown, label }: { table: HarsoOutputTableBlock; shown: number; label: string }) {
  const total = isTotalRow(table, table.rows.length - 1) ? table.rows[table.rows.length - 1] : undefined;
  const body = (total ? table.rows.slice(0, -1) : table.rows).slice(0, shown);
  const align = (index: number) => table.columns[index].align === "end" ? "end" : "start";
  // Scrolls sideways inside the block when the columns outgrow the card; focusable so a keyboard can scroll it.
  return <div className="hkc-output-table-scroll" role="region" aria-label={`${label} · table`} tabIndex={0}>
    <table className="hkc-output-table">
      <thead><tr>{table.columns.map((column, index) => <th key={index} scope="col" data-align={align(index)}>{column.label}</th>)}</tr></thead>
      <tbody>
        {body.map((row, rowIndex) => <tr key={rowIndex}>{row.cells.map((cell, index) => index === 0
          ? <th key={index} scope="row" data-align={align(index)}>{cell}</th>
          : <td key={index} data-align={align(index)}>{cell}</td>)}</tr>)}
        {total && <tr className="hkc-output-table-total">{total.cells.map((cell, index) => index === 0
          ? <th key={index} scope="row" data-align={align(index)}>{cell}</th>
          : <td key={index} data-align={align(index)}>{cell}</td>)}</tr>}
      </tbody>
    </table>
  </div>;
}

function Skeleton({ kind }: { kind: "chart" | "share" | "table" }) {
  return <div className={`hkc-output-skeleton hkc-output-skeleton--${kind}`} aria-hidden="true">
    {kind === "chart" ? <span /> : <>
      {kind === "share" && <span className="hkc-output-skeleton-bar" />}
      {[0, 1, 2, 3].map(index => <span key={index} className="hkc-output-skeleton-row"><span /><span /></span>)}
    </>}
  </div>;
}

const NOTE_DEFAULT = { empty: "Nothing to show", partial: "Some of this is still coming in", stale: "Couldn’t refresh", failed: "Couldn’t load this" } as const;

/** B0 state wrapper: loading skeleton · empty ring + note · partial/stale content + note · failed amber glyph, reason, Try again. */
export function HarsoOutputBlockFrame({ state, kind, children }: { state?: HarsoOutputBlockState; kind: "chart" | "share" | "table"; children: ReactNode }) {
  const current = state?.state ?? "ready";
  if (current === "ready") return <>{children}</>;
  if (current === "loading") return <div className="hkc-output-block" data-state="loading" aria-busy="true">
    <Skeleton kind={kind} /><span className="hk-sr-only">Loading</span>
  </div>;
  if (current === "empty") return <p className="hkc-output-block-note hkc-output-block-note--empty" data-state="empty">
    <span className="hkc-output-block-ring" aria-hidden="true" />{state?.message || NOTE_DEFAULT.empty}
  </p>;
  if (current === "failed") return <div className="hkc-output-block-failed" data-state="failed">
    <WarningCircle className="hkc-output-block-failed-glyph" size={16} weight="bold" aria-hidden="true" />
    <div className="hkc-output-block-failed-text">
      <p className="hkc-output-block-failed-message">{state?.message || NOTE_DEFAULT.failed}</p>
      {state?.reason && <p className="hkc-output-block-failed-reason">{state.reason}</p>}
      {state?.onRetry && <Button variant="quiet" className="hkc-output-block-retry" onClick={state.onRetry}>Try again</Button>}
    </div>
  </div>;
  const Glyph = current === "partial" ? Info : Clock;
  return <div className="hkc-output-block" data-state={current}>
    {children}
    <p className="hkc-output-block-note"><Glyph size={14} weight="bold" aria-hidden="true" />{state?.message || NOTE_DEFAULT[current]}</p>
  </div>;
}

/** Plain text of one block for Copy: every value with its unit, rows as lines, tables tab-separated. */
export function harsoOutputBlockPlainText(block: AnyBlock): string | undefined {
  const chart = readChart(block);
  if (chart) return chart.series.map(series => `${series.label}: ${chart.x_labels.map((label, index) =>
    `${label} ${series.values[index] === null ? "not reported" : formatValue(series.values[index]!, chart.unit)}`).join(", ")}`).join("\n");
  const table = readTable(block);
  if (table) return [table.columns.map(column => column.label), ...table.rows.map(row => row.cells)].map(cells => cells.join("\t")).join("\n");
  const items = (block as { items?: unknown }).items;
  if (block.kind === "rows" && Array.isArray(items)) return (items as Row[])
    .map(row => [row.label, row.secondary, row.trailing].filter(Boolean).join(" · ")).join("\n");
  return undefined;
}
