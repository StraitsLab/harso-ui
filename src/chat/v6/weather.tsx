"use client";

import type { ReactNode } from "react";
import type { HarsoOutputDocument } from "../output-card";
import { readChart } from "../output-card-charts";
import { V6Frame } from "./frame";
import type { V6Family, V6FamilyProps, V6Sky, V6Weather, V6WeatherCondition, WidgetSize } from "./types";
import "./weather.css";

/*
 * WEV-3320 (P04): the weather-now family. The sky comes from weather.sky, the glyph from current_condition, the hours
 * from the carried chart (x_labels and values) joined one to one with weather.hourly, the days from weather.days.
 * Only what the document carries is drawn: a missing, unknown or out-of-range value leaves its part out, and a
 * document this card cannot draw in full goes back to the generic card.
 */

const SKIES: readonly V6Sky[] = ["clear-day", "clear-night", "cloudy", "rain", "storm"];
const WORDS: Readonly<Record<V6WeatherCondition, string>> = {
  clear: "Clear", night: "Clear night", partly: "Partly cloudy", cloudy: "Cloudy", rain: "Rain", storm: "Thunderstorm"
};
const DECIMAL = /^-?\d{1,15}(\.\d{1,6})?$/;
const SIZES: readonly WidgetSize[] = ["small", "medium", "large"];
/** What a widget shows: the hours (medium, large) and the days (large). */
const WIDGET_HOURS = 5, WIDGET_DAYS = 5, MAX_DAYS = 7, MAX_HOURS = 31;

const condition = (value: unknown): V6WeatherCondition | undefined =>
  typeof value === "string" && Object.hasOwn(WORDS, value) ? value as V6WeatherCondition : undefined;
const decimal = (value: unknown): value is string => typeof value === "string" && DECIMAL.test(value);
const percent = (value: unknown): number | undefined => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100 ? value : undefined;

interface Hour { condition?: V6WeatherCondition; rain?: number }
interface Day { label: string; condition: V6WeatherCondition; low: string; high: string }
interface Read {
  sky?: V6Sky; current?: V6WeatherCondition; high?: string; low?: string;
  /** Only when the chart and the list agree on how many hours there are. */
  hourly?: Hour[]; days?: Day[];
  now?: { label: string; value: string }; notes: string[];
  /** The chart's x_labels and values, one entry per hour; a null value is a gap. */
  times?: string[]; temps?: (string | null)[];
}

function readDays(value: unknown): Day[] | undefined {
  if (!Array.isArray(value) || !value.length || value.length > MAX_DAYS) return undefined;
  const days: Day[] = [];
  for (const entry of value as Partial<Day>[]) {
    const kind = condition(entry?.condition);
    // shortcut: one bad day drops the whole strip, because a range bar scaled across a partial list would mislead.
    if (!entry || typeof entry.label !== "string" || !entry.label.trim() || !kind || !decimal(entry.low) || !decimal(entry.high) || Number(entry.high) < Number(entry.low)) return undefined;
    days.push({ label: entry.label, condition: kind, low: entry.low, high: entry.high });
  }
  return days;
}

function readHours(value: unknown, count: number): Hour[] | undefined {
  if (!Array.isArray(value) || value.length !== count || count > MAX_HOURS) return undefined;
  return value.map((entry: Hour | null) => ({ condition: condition(entry?.condition), rain: percent(entry?.rain) }));
}

/** The facts this card can draw, or undefined when the document is not one it can draw in full. */
export function readWeather(document: HarsoOutputDocument): Read | undefined {
  const weather = document.weather as V6Weather | undefined;
  if (!weather || typeof weather !== "object" || Array.isArray(weather)) return undefined;

  let numbers: { label: string; value: string }[] | undefined, chart: ReturnType<typeof readChart>;
  for (const block of document.blocks) {
    if (block.kind === "numbers" && !numbers) {
      const items = (block as { items?: { label?: unknown; value?: unknown; delta?: unknown }[] }).items;
      if (!Array.isArray(items) || !items.every(item => typeof item?.label === "string" && typeof item.value === "string" && item.delta == null)) return undefined;
      numbers = items as { label: string; value: string }[];
    } else if (block.kind === "visual" && !chart) {
      chart = readChart(block);
      if (!chart || chart.series.length !== 1) return undefined;
    } else return undefined;
  }

  const sky = SKIES.includes(weather.sky as V6Sky) ? weather.sky : undefined;
  const range = decimal(weather.high) && decimal(weather.low) && Number(weather.high) < Number(weather.low) ? {} : { high: decimal(weather.high) ? weather.high : undefined, low: decimal(weather.low) ? weather.low : undefined };
  const hourly = chart ? readHours(weather.hourly, chart.x_labels.length) : undefined;
  const read: Read = {
    sky, current: condition(weather.current_condition), ...range, hourly, days: readDays(weather.days),
    now: numbers?.[0], notes: (numbers ?? []).slice(1).map(item => `${item.label} · ${item.value}`),
    times: chart?.x_labels, temps: chart?.series[0].values
  };
  return read.sky || read.current || read.high || read.low || read.hourly || read.days ? read : undefined;
}

// ---- glyphs: small SVGs drawn here, so nothing is fetched ----

function Glyph({ kind, label = true, className = "" }: { kind: V6WeatherCondition; label?: boolean; className?: string }) {
  const sun = <g className="hkc-wx-sun" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5M18.5 18.5 20 20M4 20l1.5-1.5M18.5 5.5 20 4" /><circle cx="12" cy="12" r="5" stroke="none" /></g>;
  const cloud = <path className="hkc-wx-cloud" d="M6 17a4.5 4.5 0 0 1-.6-9 6.3 6.3 0 0 1 12-1 5 5 0 1 1 .6 10z" />;
  const shape: ReactNode = kind === "clear" ? sun
    : kind === "night" ? <path className="hkc-wx-moon" d="M17 2a9 9 0 1 0 5 14A9 9 0 0 1 17 2" />
    : <>
      {kind === "partly" && <circle className="hkc-wx-sun" cx="17" cy="6" r="5" stroke="none" />}
      {cloud}
      {kind === "rain" && <path className="hkc-wx-drop" d="m7 20-1 2m6-2-1 2m6-2-1 2" strokeWidth="1.7" strokeLinecap="round" />}
      {kind === "storm" && <path className="hkc-wx-bolt" d="m12 13-4 7h4l-1 4 6-8h-4l2-3z" />}
    </>;
  return <svg className={`hkc-v6-weather-glyph ${className}`.trim()} data-condition={kind} viewBox="0 0 24 26"
    {...(label ? { role: "img", "aria-label": WORDS[kind] } : { "aria-hidden": true })}>{shape}</svg>;
}

// ---- parts ----

const degrees = (value: string) => `${value}°`;
/** "31°C" is drawn as the big "31°"; any other form of the source's value is drawn as given. */
const bigTemp = (value: string) => { const m = /^(-?\d+(?:\.\d+)?)\s*°\s*[CF]?$/i.exec(value.trim()); return m ? degrees(m[1]) : value; };
const pct = (value: number) => `${+value.toFixed(2)}%`;

function Hero({ read }: { read: Read }) {
  const hasRange = read.high != null || read.low != null;
  if (!read.now && !read.current && !hasRange) return null;
  return <div className="hkc-v6-weather-hero" data-slot="hero">
    <div className="hkc-v6-weather-now">
      {read.now && <><span className="hk-sr-only">{read.now.label} </span><p className="hkc-v6-weather-temp" data-slot="current">{bigTemp(read.now.value)}</p></>}
    </div>
    <div className="hkc-v6-weather-sky">
      {read.current && <><Glyph kind={read.current} label={false} className="hkc-v6-weather-hero-glyph" /><p data-slot="condition">{WORDS[read.current]}</p></>}
      {hasRange && <p data-slot="range">{[read.high != null && `H:${degrees(read.high)}`, read.low != null && `L:${degrees(read.low)}`].filter(Boolean).join(" ")}</p>}
    </div>
  </div>;
}

function Hours({ read, limit, scroll }: { read: Read; limit: number; scroll: boolean }) {
  const { times, temps, hourly } = read;
  if (!times?.length || !temps) return null;
  return <div className="hkc-v6-weather-hours" data-slot="hourly" role="region" aria-label="Hourly forecast" tabIndex={scroll ? 0 : undefined}>
    <ol>
      {times.slice(0, limit).map((time, index) => {
        const hour = hourly?.[index], temp = temps[index];
        return <li key={index} data-slot="hour">
          <span data-slot="time">{time}</span>
          {hour?.condition && <Glyph kind={hour.condition} />}
          {temp === null
            ? <span role="img" aria-label="Temperature not reported" data-slot="temp" data-gap="true">–</span>
            : <span data-slot="temp">{degrees(temp)}</span>}
          {hour?.rain != null && <><span className="hkc-v6-weather-rain" data-slot="rain">{hour.rain}%</span><span className="hk-sr-only"> chance of rain</span></>}
        </li>;
      })}
    </ol>
  </div>;
}

function Days({ days }: { days: Day[] }) {
  const lows = days.map(day => Number(day.low)), highs = days.map(day => Number(day.high));
  const min = Math.min(...lows), span = Math.max(...highs) - min;
  // Equal low and high keep a bar (the CSS gives it a minimum width); when every day is one value the span is 0.
  const at = (value: number) => span > 0 ? (value - min) / span * 100 : 0;
  return <ul className="hkc-v6-weather-days" data-slot="days" aria-label="Daily forecast">
    {days.map((day, index) => <li key={index} data-slot="day">
      <b data-slot="label">{day.label}</b>
      <Glyph kind={day.condition} />
      <span className="hk-sr-only">Low </span><span data-slot="low">{degrees(day.low)}</span>
      <i className="hkc-v6-weather-track" aria-hidden="true"><span className="hkc-v6-weather-lane">
        <em className="hkc-v6-weather-bar" data-slot="bar" style={{ left: pct(at(lows[index])), width: pct(at(highs[index]) - at(lows[index])) }} />
      </span></i>
      <span className="hk-sr-only">High </span><span data-slot="high">{degrees(day.high)}</span>
    </li>)}
  </ul>;
}

function Weather({ props, read }: { props: V6FamilyProps; read: Read }) {
  const { document, mode, host, onOpenDetails, renderBrand, widgetSize } = props;
  const widget = widgetSize !== undefined;
  // A widget is one tap target: no Details toggle. The card keeps it.
  const shown = widget ? { ...document, details: undefined } : document;
  return <div className="hkc-v6-weather" data-sky={read.sky} data-widget={widgetSize}>
    <V6Frame document={shown} mode={mode} host={host} onOpenDetails={onOpenDetails} renderBrand={renderBrand} openArea={widget ? "card" : "header"} className="hkc-v6-weather-frame">
      <Hero read={read} />
      {widgetSize !== "small" && <Hours read={read} limit={widget ? WIDGET_HOURS : Infinity} scroll={!widget} />}
      {!widget && read.notes.map((note, index) => <p key={index} className="hkc-v6-weather-note" data-slot="note">{note}</p>)}
      {(!widget || widgetSize === "large") && read.days && <Days days={widget ? read.days.slice(0, WIDGET_DAYS) : read.days} />}
    </V6Frame>
  </div>;
}

export const family: V6Family = {
  renderFamily(props) {
    if (props.widgetSize !== undefined && !SIZES.includes(props.widgetSize)) return undefined;
    const read = readWeather(props.document);
    return read ? <Weather props={props} read={read} /> : undefined;
  },
  supportedWidgetSizes: template => template === "weather-now" ? SIZES : []
};
