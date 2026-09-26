"use client";

import { Clock, Info, WarningCircle } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

/** A last row labelled "Total" (G4: the contract has no totals field; the playbook sends it as the last row). */
export const isTotalRow = (table: HarsoOutputTableBlock, index: number) =>
  index === table.rows.length - 1 && table.rows.length > 1 && /^total\b/i.test(table.rows[index].cells[0]?.trim() ?? "");

// ---- numbers and units ----

const MINUS = "\u2212";
function decimals(value: string) { return value.split(".")[1]?.length ?? 0; }
function group(value: number, places: number) {
  return Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places });
}

/** A figure with its unit where people expect it: S$1,160 · S$402.5k · 32% · 31°C · 7.8 hours. */
export function withUnit(value: number, places: number, unit?: string) {
  const sign = value < 0 ? MINUS : "";
  const body = group(value, places);
  const trimmed = unit?.trim();
  if (!trimmed) return sign + body;
  const money = /^([A-Z]{0,3}[$€£¥₹])(k|m|bn|K|M|B)?$/.exec(trimmed);
  if (money) return `${sign}${money[1]}${body}${money[2] ?? ""}`;
  if (/^(%|°C|°F|°|k|x|×)$/.test(trimmed)) return `${sign}${body}${trimmed}`;
  return `${sign}${body}\u00a0${trimmed}`;
}
const formatValue = (value: string, unit?: string) => withUnit(Number(value), decimals(value), unit);

const LADDER = [1, 1.5, 2, 2.5, 3, 4, 5, 10];
function niceStep(raw: number) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return LADDER.find(step => step * magnitude >= raw - 1e-9)! * magnitude;
}

/**
 * Axis ticks. Bars always include zero (a bar needs its baseline); a line spans its data, and includes zero when the
 * data does. Two intervals, like the B0 masters (S$0 · S$1,000 · S$2,000).
 */
export function scale(values: number[], zero: boolean) {
  let lo = Math.min(...values), hi = Math.max(...values);
  if (zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  if (hi === lo) { const pad = Math.abs(hi) || 1; if (zero && lo === 0) hi = pad; else { lo -= pad / 2; hi += pad / 2; } }
  const step = niceStep((hi - lo) / 2);
  const bottom = Math.floor(lo / step + 1e-9) * step, top = Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let tick = bottom; tick <= top + step / 1e6; tick += step) ticks.push(Number(tick.toPrecision(12)));
  const places = Math.max(0, ...ticks.map(tick => decimals(String(tick))));
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
/**
 * Rendered width of axis/label text: measured with a canvas in the kit's font when the browser has one, else an
 * estimate that counts wide (CJK, emoji) characters as a full em and everything else as 0.6em.
 */
let measurer: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, size = AXIS, weight = 500) {
  if (measurer === undefined) {
    try { measurer = typeof document === "undefined" || /jsdom/i.test(navigator.userAgent) ? null : document.createElement("canvas").getContext("2d"); } catch { measurer = null; }
  }
  if (measurer) {
    measurer.font = `${weight} ${size}px "Instrument Sans Variable", sans-serif`;
    // Canvas cannot apply tabular-nums; tabular digits are at most ~4% wider in Instrument Sans.
    return Math.ceil(measurer.measureText(text).width * 1.04) + 1;
  }
  return Array.from(text).reduce((width, char) => width + size * (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]|\p{Extended_Pictographic}/u.test(char) ? 1 : .6), 0);
}

function useWidth() {
  const node = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [fonts, setFonts] = useState(0);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = () => { if (element.clientWidth > 0) setWidth(Math.round(element.clientWidth)); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    // Label widths are measured in the web font; draw again once it has loaded.
    let live = true;
    globalThis.document?.fonts?.ready.then(() => { if (live) setFonts(value => value + 1); });
    return () => { live = false; observer?.disconnect(); };
  }, []);
  return [node, width, fonts] as const;
}

/** The text, cut with an ellipsis if it is wider than `max` on its own. */
function fitText(text: string, max: number) {
  if (textWidth(text) <= max) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && textWidth(`${chars.join("")}…`) > max) chars.pop();
  return `${chars.join("").trimEnd()}…`;
}

type XLabel = { index: number; x: number; anchor: "start" | "middle" | "end"; lines: string[]; strong: boolean };

/** First, last and the highlighted label always; the rest while they fit without touching (8px apart). */
function placeLabels(labels: string[], notes: (string | undefined)[], xOf: (index: number) => number, plotWidth: number, highlight: number | undefined, sparse: boolean) {
  const last = labels.length - 1;
  const extent = (index: number) => {
    const lines = ([labels[index], notes[index]].filter(Boolean) as string[]).map(line => fitText(line, plotWidth));
    const width = Math.max(...lines.map(line => textWidth(line)));
    const x = xOf(index);
    const anchor: XLabel["anchor"] = index === 0 && x - width / 2 < 0 ? "start" : index === last && x + width / 2 > plotWidth ? "end" : "middle";
    const ax = anchor === "start" ? 0 : anchor === "end" ? plotWidth : Math.min(plotWidth - width / 2, Math.max(width / 2, x));
    const left = anchor === "start" ? 0 : anchor === "end" ? plotWidth - width : ax - width / 2;
    return { label: { index, x: ax, anchor, lines, strong: index === highlight }, left, right: left + width };
  };
  const order = [...new Set([highlight, 0, last].filter((index): index is number => index !== undefined && index >= 0 && index <= last))];
  if (!sparse || labels.length <= 7) for (let index = 1; index < last; index++) if (!order.includes(index)) order.push(index);
  const placed: ReturnType<typeof extent>[] = [];
  for (const index of order) {
    const box = extent(index);
    if (!labels[index]?.trim()) continue;
    if (placed.every(other => box.right + 8 <= other.left || box.left >= other.right + 8)) placed.push(box);
  }
  return placed.map(box => box.label).sort((a, b) => a.index - b.index);
}

function XLabels({ labels, y }: { labels: XLabel[]; y: number }) {
  return <>{labels.map(label => <text key={label.index} x={label.x} y={y + AXIS} textAnchor={label.anchor}
    className={label.strong ? "hkc-chart-x hkc-chart-x--strong" : "hkc-chart-x"}>
    {label.lines.map((line, index) => <tspan key={index} x={label.x} dy={index ? LINE_HEIGHT : 0}
      className={index ? "hkc-chart-x-note" : undefined}>{line}</tspan>)}
  </text>)}</>;
}

function Axis({ ticks, y, width, plotWidth, unit, places, zeroLine }: { ticks: number[]; y: (value: number) => number; width: number; plotWidth: number; unit?: string; places: number; zeroLine: number }) {
  return <>
    {ticks.map(tick => <g key={tick}>
      {tick !== zeroLine && <line x1={0} x2={plotWidth} y1={Math.round(y(tick)) + .5} y2={Math.round(y(tick)) + .5} className="hkc-chart-grid" />}
      <text x={width} y={y(tick) + 4} textAnchor="end" className="hkc-chart-axis">{withUnit(tick, places, unit)}</text>
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

function frame(chart: HarsoOutputChart, width: number) {
  const numbers = chart.series.flatMap(series => series.values.filter((value): value is string => value !== null).map(Number));
  const axis = scale(numbers.length ? numbers : [0], chart.chart === "bar" || numbers.some(value => value <= 0));
  const labelWidth = Math.max(40, ...axis.ticks.map(tick => textWidth(withUnit(tick, axis.places, chart.unit)))) + 8;
  const plotWidth = Math.max(80, width - labelWidth);
  return { ...axis, labelWidth, plotWidth };
}

function BarChart({ chart, width }: { chart: HarsoOutputChart; width: number }) {
  const f = frame(chart, width);
  const values = chart.series[0].values;
  const hi = chart.highlight_index != null && values[chart.highlight_index] != null ? chart.highlight_index : undefined;
  const top = LINE_HEIGHT + 6, below = f.bottom < 0 ? LINE_HEIGHT + 6 : 0;
  const y = (value: number) => top + PLOT * (f.top - value) / (f.top - f.bottom);
  const zero = y(0), plotBottom = top + PLOT + below;
  const slot = f.plotWidth / values.length, barWidth = Math.min(BAR_MAX, Math.round(slot * .56));
  const center = (index: number) => index * slot + slot / 2;
  const notes = periodNotes(chart.x_labels);
  const labels = placeLabels(chart.x_labels, notes, center, f.plotWidth, hi, false);
  const lines = Math.max(1, ...labels.map(label => label.lines.length));
  const height = plotBottom + 6 + LINE_HEIGHT * lines;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="hkc-chart-svg">
    <Axis ticks={f.ticks} y={y} width={width} plotWidth={f.plotWidth} unit={chart.unit} places={f.places} zeroLine={0} />
    {values.map((value, index) => {
      const x = Math.round(center(index) - barWidth / 2);
      if (value === null) return <rect key={index} x={Math.round(center(index) - 8)} y={zero - 2} width={16} height={2} rx={1} className="hkc-chart-missing" data-index={index} />;
      const n = Number(value), end = y(n), down = n < 0, h = Math.abs(end - zero);
      const strong = index === hi;
      return <g key={index}>
        {h >= .5 && <path d={barPath(x, down ? zero : end, barWidth, h, down)} className={strong ? "hkc-chart-mark hkc-chart-mark--strong" : "hkc-chart-mark"} data-index={index} />}
        {strong && (() => {
          // Centred on its bar, but never past the plot's edges (a first or last bar in a narrow pane).
          const text = formatValue(value, chart.unit), half = textWidth(text) / 2 + 2; // +2: canvas ignores tabular-nums
          const labelX = Math.min(f.plotWidth - half, Math.max(half, center(index)));
          return <text x={labelX} y={down ? end + LINE_HEIGHT : end - 5} textAnchor="middle" className="hkc-chart-value">{text}</text>;
        })()}
      </g>;
    })}
    <XLabels labels={labels} y={plotBottom + 6} />
  </svg>;
}

const DASH = [undefined, "6 4", "1.5 4"];
function LineChart({ chart, width }: { chart: HarsoOutputChart; width: number }) {
  const f = frame(chart, width);
  const count = chart.x_labels.length, highlight = chart.highlight_index != null && chart.highlight_index < count ? chart.highlight_index : undefined;
  const top = LINE_HEIGHT + 4 + 12;
  const y = (value: number) => top + PLOT * (f.top - value) / (f.top - f.bottom);
  const step = (f.plotWidth - 12) / (count - 1), x = (index: number) => 6 + index * step;
  const plotBottom = top + PLOT;
  const zeroLine = f.bottom <= 0 && f.top >= 0 ? 0 : f.bottom;
  const labels = placeLabels(chart.x_labels, chart.x_labels.map(() => undefined), x, f.plotWidth, highlight, true);
  const height = plotBottom + 6 + LINE_HEIGHT;
  const points = highlight === undefined ? [] : chart.series.map(series => series.values[highlight]).filter((value): value is string => value !== null);
  const single = chart.series.length === 1;
  const rawPill = highlight === undefined || !points.length ? undefined
    : single ? `${formatValue(points[0], chart.unit)} · ${chart.x_labels[highlight]}` : chart.x_labels[highlight];
  const pill = rawPill && fitText(rawPill, f.plotWidth - 12);
  const pillWidth = pill ? textWidth(pill) + 12 : 0;
  const pillX = highlight === undefined ? 0 : Math.max(0, Math.min(f.plotWidth - pillWidth, x(highlight) - pillWidth / 2));
  const highest = points.length ? Math.min(...points.map(value => y(Number(value)))) : 0;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="hkc-chart-svg">
    <Axis ticks={f.ticks} y={y} width={width} plotWidth={f.plotWidth} unit={chart.unit} places={f.places} zeroLine={zeroLine} />
    {chart.series.map((series, seriesIndex) => {
      const runs: [number, number][][] = [[]];
      series.values.forEach((value, index) => value === null ? runs.push([]) : runs[runs.length - 1].push([x(index), y(Number(value))]));
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
        <circle cx={x(highlight)} cy={y(Number(series.values[highlight]))} r={7} className="hkc-chart-halo" />
        <circle cx={x(highlight)} cy={y(Number(series.values[highlight]))} r={4} className="hkc-chart-point" />
      </g>)}
    </g>}
    <XLabels labels={labels} y={plotBottom + 6} />
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
  const [node, width, fonts] = useWidth();
  return <figure className="hkc-output-chart" data-chart={chart.chart} data-fonts={fonts}>
    <figcaption className="hkc-output-chart-caption">
      {chart.series.length === 1 ? chart.series[0].label
        : <ul className="hkc-output-chart-key">{chart.series.map((series, index) => <li key={index}>
          <svg width={20} height={8} aria-hidden="true" focusable="false"><line x1={1} x2={19} y1={4} y2={4} className="hkc-chart-line" strokeDasharray={DASH[index]} /></svg>
          {series.label}
        </li>)}</ul>}
    </figcaption>
    <div ref={node} className="hkc-output-chart-plot">{chart.chart === "bar" ? <BarChart chart={chart} width={width} /> : <LineChart chart={chart} width={width} />}</div>
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
