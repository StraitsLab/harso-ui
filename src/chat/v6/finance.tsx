"use client";

import type { ReactNode } from "react";
import { Button } from "../../primitives";
import { HarsoOutputActionRow, readAction, type HarsoOutputActionBlock, type HarsoOutputDocument, type HarsoOutputNumber, type HarsoOutputRow } from "../output-card";
import { HarsoOutputRowStatus, formatValue, readChart, rowStatusOk, toMicro, type HarsoOutputChart } from "../output-card-charts";
import { V6Brand, V6Frame } from "./frame";
import type { V6Family, V6FamilyProps, V6RenderBrand, V6Template, WidgetSize } from "./types";
import "./finance.css";

/*
 * WEV-3317 (P01): the money cards: stock-quote, bills-due, subscriptions. Every figure, word and date is the document's
 * own. A missing optional field leaves its part out: no zero, no sample series, no range button with no data behind it.
 * The family returns undefined for any document or size it cannot draw whole, and the generic card then draws it.
 */

const SIZES: Readonly<Partial<Record<V6Template, readonly WidgetSize[]>>> = {
  "stock-quote": ["small", "medium", "large"], "bills-due": ["small", "medium"], subscriptions: ["small", "medium"]
};
/** Inline rows before View all (the approved subscriptions card shows six). Widgets show a fixed few; full shows all. */
const INLINE_ROWS = 6;
const WIDGET_ROWS: Readonly<Partial<Record<WidgetSize, number>>> = { small: 1, medium: 3 };

// ---- reading the document ----

interface Shape { numbers?: HarsoOutputNumber[]; rows?: HarsoOutputRow[]; total: number; chart?: HarsoOutputChart; action?: HarsoOutputActionBlock }
const DECIMAL = /^-?\d{1,15}(\.\d{1,6})?$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/;
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** A real UTC instant (an impossible day is not rolled forward), else undefined: a bad due_at is a missing one. */
function instant(value: unknown): Date | undefined {
  if (typeof value !== "string" || !INSTANT.test(value)) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value.slice(0, 16) ? date : undefined;
}

const plotted = (chart: HarsoOutputChart) => chart.series[0].values.filter(value => value !== null).length;

/** The blocks this family can draw, once each, or undefined. An unknown block, a second list or a bad row means the generic card. */
function read(document: HarsoOutputDocument, template: V6Template): Shape | undefined {
  const shape: Shape = { total: 0 };
  for (const block of document.blocks) {
    if (block.kind === "numbers" && !shape.numbers) {
      const items = (block as { items?: HarsoOutputNumber[] }).items;
      if (!Array.isArray(items) || !items.length || !items.every(item => text(item?.value) && text(item?.label))) return undefined;
      shape.numbers = items;
    } else if (block.kind === "rows" && template !== "stock-quote" && !shape.rows) {
      const { items, total_count: count } = block as { items?: HarsoOutputRow[]; total_count?: number };
      if (!Array.isArray(items) || !items.length || !items.every(row => text(row?.label) && rowStatusOk(row.status))) return undefined;
      shape.rows = items;
      shape.total = Math.max(items.length, Number.isInteger(count) ? count! : 0);
    } else if (block.kind === "visual" && template === "stock-quote" && !shape.chart) {
      const chart = readChart(block);
      if (!chart || chart.chart !== "line" || chart.series.length !== 1 || plotted(chart) < 2) return undefined;
      shape.chart = chart;
    } else if (block.kind === "action" && !shape.action) shape.action = block as HarsoOutputActionBlock;
    else return undefined;
  }
  return (template === "stock-quote" ? shape.numbers : shape.rows) ? shape : undefined;
}

// ---- signed change ----

type Direction = "up" | "down" | "flat" | "none";
/** The sign the agent wrote, read as written: + is up, − or - is down, no non-zero digit is flat. No digit at all is no change. */
function readChange(delta: string | undefined): { direction: Direction; magnitude: string } | undefined {
  const value = delta?.trim();
  if (!value || !/\d/.test(value)) return undefined;
  const sign = value[0];
  const direction: Direction = !/[1-9]/.test(value) ? "flat" : sign === "+" ? "up" : sign === "−" || sign === "-" ? "down" : "none";
  return { direction, magnitude: value.replace(/^[+−-]\s*/, "") };
}

const WORD = { up: "Up", down: "Down", flat: "Unchanged" } as const;
function Change({ delta, change }: { delta: string; change: NonNullable<ReturnType<typeof readChange>> }) {
  const { direction, magnitude } = change;
  const spoken = direction === "none" ? undefined : direction === "flat" ? WORD.flat : `${WORD[direction]} ${magnitude}`;
  return <span className="hkc-fin-change" data-direction={direction}>
    <span aria-hidden={spoken ? "true" : undefined}>{direction === "up" ? "▲ " : direction === "down" ? "▼ " : ""}{delta}</span>
    {spoken && <span className="hk-sr-only">{spoken}</span>}
  </span>;
}

// ---- sparkline ----

const W = 300, H = 80, PAD = 4;
const round = (value: number) => Math.round(value * 100) / 100;
const real = (value: string) => Number(toMicro(value)) / 1_000_000; // a pixel ratio only: the labels print the exact decimals

/** The carried points as one line (a gap breaks it, never a zero) and, when supplied, a dashed line at the exact baseline. */
function Spark({ chart, direction, baseline }: { chart: HarsoOutputChart; direction: Direction; baseline?: string }) {
  const { values } = chart.series[0], last = values.length - 1;
  const points = values.map(value => value === null ? null : real(value));
  const base = baseline === undefined ? undefined : real(baseline);
  const seen = [...points.filter((value): value is number => value !== null), ...(base === undefined ? [] : [base])];
  const high = Math.max(...seen), low = Math.min(...seen), span = high - low || 1;
  const y = (value: number) => round(PAD + (high - value) / span * (H - 2 * PAD));
  let line = "", drawing = false;
  points.forEach((value, index) => {
    if (value === null) { drawing = false; return; }
    line += `${drawing ? "L" : "M"}${round(index / last * W)} ${y(value)} `;
    drawing = true;
  });
  const seenText = values.filter((value): value is string => value !== null), first = seenText[0], final = seenText[seenText.length - 1];
  return <svg className="hkc-fin-spark" data-direction={direction} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
    aria-label={`${chart.series[0].label} line, ${chart.x_labels[0]} to ${chart.x_labels[last]}, ${formatValue(first, chart.unit)} to ${formatValue(final, chart.unit)}`}>
    {base !== undefined && <line className="hkc-fin-baseline" data-value={baseline} x1={0} x2={W} y1={y(base)} y2={y(base)} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
    <path className="hkc-fin-line" d={line.trim()} vectorEffect="non-scaling-stroke" />
  </svg>;
}

// ---- parts ----

function Stats({ items }: { items: HarsoOutputNumber[] }) {
  return <p className="hkc-fin-stats">{items.map((item, index) => <span key={index} className="hkc-fin-stat">
    <strong>{item.value}</strong><span>{item.label}</span>{item.delta && <span>{item.delta}</span>}
  </span>)}</p>;
}

const day = (date: Date) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);

function Rows({ rows, verb, renderBrand }: { rows: HarsoOutputRow[]; verb: string; renderBrand: V6RenderBrand }) {
  return <ul className="hkc-fin-rows">{rows.map((row, index) => {
    // The agent's own words win. Only with none does an exact due_at give a date, and a row with neither has none.
    const date = instant(row.due_at);
    const when = row.secondary ? row.secondary : date ? <time dateTime={row.due_at}>{`${verb} ${day(date)}`}</time> : undefined;
    return <li key={index} className="hkc-fin-row" data-row-id={row.id} data-status={row.status}>
      <V6Brand domain={row.brand ?? ""} label={row.label} renderBrand={renderBrand} />
      <div className="hkc-fin-main">
        <p className="hkc-fin-name"><span>{row.label}</span><HarsoOutputRowStatus status={row.status} status_label={row.status_label} /></p>
        {when && <p className="hkc-fin-when">{when}</p>}
      </div>
      {row.trailing && <span className="hkc-fin-amount">{row.trailing}</span>}
    </li>;
  })}</ul>;
}

// ---- the family ----

function renderFamily({ document, mode, widgetSize, host, renderBrand, onOpenDetails }: V6FamilyProps): ReactNode | undefined {
  const template = document.template;
  if (template !== "stock-quote" && template !== "bills-due" && template !== "subscriptions") return undefined;
  if (widgetSize && !SIZES[template]!.includes(widgetSize)) return undefined;
  // A block the host marks loading, empty, partial, stale or failed is drawn with its state by the generic card.
  if (Object.values(host.blockStates ?? {}).some(state => state.state !== "ready")) return undefined;
  const shape = read(document, template);
  if (!shape) return undefined;

  const size = widgetSize ?? "card";
  // A medium widget has the room for one figure: the first number (a total) sits at the title's right, as in the approved tile.
  const total = widgetSize === "medium" && template !== "stock-quote" ? shape.numbers?.[0] : undefined;
  const action = !widgetSize && shape.action && (readAction(shape.action.primary, host) || readAction(shape.action.secondary, host)) ? shape.action : undefined;
  // A widget is a glance: the whole answer, with its Details, opens from the title.
  const frameDocument = widgetSize ? { ...document, details: undefined } : document;
  let body: ReactNode;

  if (template === "stock-quote") {
    const [price, ...more] = shape.numbers!;
    const rest = widgetSize === "large" || !widgetSize ? more : []; // a small or medium widget is a glance: price, change, chart
    const change = readChange(price.delta);
    const { chart } = shape;
    const baseline = chart?.baseline !== undefined && DECIMAL.test(chart.baseline) ? chart.baseline : undefined;
    const quiet = size === "small" || size === "medium"; // the large tile and the card carry the axis and the range note
    body = <div className="hkc-fin" data-size={size}>
      <p className="hkc-fin-quote">
        <strong className="hkc-fin-price">{price.value}</strong>
        {change && <Change delta={price.delta!} change={change} />}
        <span className="hkc-fin-label">{price.label}</span>
      </p>
      {rest.length > 0 && <Stats items={rest} />}
      {chart && <>
        <Spark chart={chart} direction={change?.direction ?? "none"} baseline={baseline} />
        {!quiet && <p className="hkc-fin-axis"><span>{chart.x_labels[0]}</span><span>{chart.x_labels[chart.x_labels.length - 1]}</span></p>}
        {!quiet && (chart.range || baseline) && <p className="hkc-fin-chartnote">
          {chart.range && <span className="hkc-fin-range">{chart.range}</span>}
          {baseline && <span className="hkc-fin-prev">{`${!chart.range || chart.range === "1D" ? "Previous close" : "Baseline"} ${formatValue(baseline, chart.unit)}`}</span>}
        </p>}
      </>}
    </div>;
  } else {
    const rows = shape.rows!;
    const shown = widgetSize ? WIDGET_ROWS[widgetSize]! : mode === "full" ? rows.length : INLINE_ROWS;
    const hidden = Math.max(0, rows.length - shown);
    const label = document.more_label?.trim() || `View all ${shape.total}`;
    body = <div className="hkc-fin" data-size={size}>
      {shape.numbers && !widgetSize && <Stats items={shape.numbers} />}
      <Rows rows={rows.slice(0, shown)} verb={template === "bills-due" ? "Due" : "Renews"} renderBrand={renderBrand} />
      {widgetSize
        ? hidden > 0 && <p className="hkc-fin-note">{`+${hidden} more`}</p>
        : <>
          {hidden > 0 && mode === "inline" && <Button variant="ghost" className="hkc-fin-more" onClick={host.onViewAll}>{label}</Button>}
          {shape.total > rows.length && <p className="hkc-fin-note">{`Showing ${rows.length} of ${shape.total}`}</p>}
        </>}
    </div>;
  }

  return <V6Frame document={frameDocument} mode={mode} host={host} onOpenDetails={onOpenDetails} renderBrand={renderBrand}
    className={`hkc-fin-card hkc-fin-card--${size}`}
    trailing={total ? <span className="hkc-fin-total"><strong>{total.value}</strong> {total.label}</span> : action && <HarsoOutputActionRow block={action} host={host} />}>
    {body}
  </V6Frame>;
}

export const family: V6Family = {
  renderFamily,
  supportedWidgetSizes: template => SIZES[template] ?? []
};
