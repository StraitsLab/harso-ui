"use client";

import { AirplaneTilt, ArrowSquareOut } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";
import { HARSO_OUTPUT_CARD_CAPS, HarsoOutputActionRow, HarsoOutputCardMeta, readAction,
  type HarsoOutputActionBlock, type HarsoOutputRow, type HarsoOutputRowsBlock } from "../output-card";
import { readStatus, type HarsoOutputTrackingStatusBlock } from "../output-card-media";
import { V6Brand, V6Frame } from "./frame";
import { v6TemplateOf } from "./registry";
import type { V6Family, V6FamilyProps, V6Host, V6RenderBrand, V6Template, WidgetSize } from "./types";
import "./journeys.css";

/*
 * WEV-3319 (P03): delivery-tracking, flight-status and flight-options.
 *
 * One honest bar: it exists only when the source gave `status.progress` (0 is a value and draws an empty bar). Stages,
 * route, gate, seat and the on-time or delayed word are drawn only from fields the document carries. Nothing here reads
 * the clock, runs a timer or says "live"; a countdown is the source's own `remaining` text. A document this family
 * cannot draw in full returns undefined, so the generic card draws every block.
 */

type Tracking = HarsoOutputTrackingStatusBlock;
const CONDITION: Partial<Record<string, string>> = { on_time: "On time", delayed: "Delayed" };
const AIRPORT = /^[A-Z]{3}$/;
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value : undefined;
const record = (value: unknown): Record<string, unknown> | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

// ---- reading the document ----

interface Parts { status?: Tracking; rows?: HarsoOutputRowsBlock; actions: HarsoOutputActionBlock[] }

/** At most one tracking status, one rows block and any action blocks, in the document's order. Anything else is none. */
function readParts(blocks: readonly { kind: string }[]): Parts | undefined {
  const parts: Parts = { actions: [] };
  for (const block of blocks) {
    if (block.kind === "status") {
      const status = readStatus(block);
      if (status?.state !== "tracking" || parts.status) return undefined;
      parts.status = status;
    } else if (block.kind === "rows" && Array.isArray((block as HarsoOutputRowsBlock).items) && !parts.rows) parts.rows = block as HarsoOutputRowsBlock;
    else if (block.kind === "action" && !parts.actions.length) parts.actions.push(block as HarsoOutputActionBlock);
    else return undefined;
  }
  return parts;
}

interface Facts { number?: string; originCode?: string; destinationCode: string; originName?: string; destinationName?: string;
  scheduled?: string; departure?: string; arrival?: string; departureZone?: string; arrivalZone?: string;
  terminal?: string; gate?: string; previousGate?: string; boarding?: string; seat?: string; remaining?: string }

/**
 * C9 as a flight card needs it: a real destination airport code, every other fact only when it is text. The origin code
 * is optional (WEV-3469): agent guidance leaves it out until a source proves it, so the origin's name starts the route.
 */
function readFlight(value: unknown): Facts | undefined {
  const f = record(value);
  const origin = text(f?.origin_code), destination = text(f?.destination_code);
  if (!f || !destination || !AIRPORT.test(destination)) return undefined;
  return { number: text(f.number), originCode: origin && AIRPORT.test(origin) ? origin : undefined, destinationCode: destination, originName: text(f.origin_name), destinationName: text(f.destination_name),
    scheduled: text(f.scheduled_departure), departure: text(f.departure), arrival: text(f.arrival), departureZone: text(f.departure_zone), arrivalZone: text(f.arrival_zone),
    terminal: text(f.terminal), gate: text(f.gate), previousGate: text(f.previous_gate), boarding: text(f.boarding), seat: text(f.seat), remaining: text(f.remaining) };
}

/** The contract keeps a row's flight facts in its own `flight` object (and `arrival_day_offset` only there). */
const rowFlight = (row: HarsoOutputRow) => record((row as { flight?: unknown }).flight);
/** Days after departure the plane lands: 1 to 3 as the source said, otherwise nothing (0 and bad values draw no mark). */
const dayOffset = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 3 ? value : undefined;

function trailingActions(actions: HarsoOutputActionBlock[], host: V6Host): ReactNode {
  const live = actions.some(block => readAction(block.primary, host) || readAction(block.secondary, host));
  return live ? actions.map((block, index) => <HarsoOutputActionRow key={index} block={block} host={host} />) : undefined;
}

// ---- pieces ----

/** The only bar. Callers draw it only for a sourced progress. */
function Bar({ progress, label, condition }: { progress: number; label: string; condition?: string }) {
  return <div className="hkc-journey-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
    aria-valuetext={`${label}, ${progress}%`} data-progress={progress} data-condition={CONDITION[condition ?? ""] ? condition : undefined}>
    <span style={{ width: `${progress}%` }} />
  </div>;
}
const BarOf = ({ tracking }: { tracking?: Tracking }) =>
  tracking?.progress === undefined ? null : <Bar progress={tracking.progress} label={tracking.label} condition={tracking.condition} />;

function StatusLine({ tracking, number, subtitle }: { tracking?: Tracking; number?: string; subtitle?: string }) {
  if (!tracking && !number) return null;
  // A flight's delay is already the subtitle's first clause ("Delayed 45 min"): the pill says it whole, as on iPhone.
  const lead = subtitle?.split(" · ")[0];
  const word = tracking?.condition === "delayed" && lead?.startsWith("Delayed") ? lead : CONDITION[tracking?.condition ?? ""];
  return <p className="hkc-journey-status">
    {number && <span className="hkc-journey-number">{number}</span>}
    {tracking && <b>{tracking.label}</b>}
    {word && <span className="hkc-journey-condition" data-condition={tracking!.condition} data-pill={subtitle !== undefined || undefined}>{word}</span>}
  </p>;
}

/** The stage list in source order; only the given `stage_index` is marked, never one guessed from progress. */
function Stages({ tracking }: { tracking: Tracking }) {
  const { stages, stage_index: index } = tracking;
  if (!stages) return null;
  return <ol className="hkc-journey-stages" aria-label="Stages">
    {stages.map((stage, i) => <li key={i} aria-current={i === index ? "step" : undefined}
      data-state={index === undefined ? undefined : i < index ? "done" : i === index ? "current" : "next"}><i aria-hidden="true" />{stage}</li>)}
  </ol>;
}

/** The source's own timeline rows (label, note, time), kept whole and in order. */
function Timeline({ rows }: { rows?: HarsoOutputRowsBlock }) {
  if (!rows) return null;
  return <ol className="hkc-journey-timeline" aria-label="Timeline">
    {rows.items.map((row, i) => <li key={row.id ?? i}>
      <b>{row.label}</b>{row.secondary && <span className="hkc-journey-note">{row.secondary}</span>}{row.trailing && <span className="hkc-journey-when">{row.trailing}</span>}
    </li>)}
  </ol>;
}

function Route({ flight, tracking }: { flight: Facts; tracking?: Tracking }) {
  const end = (code: string | undefined, name?: string) => <div>{code ? <><b>{code}</b>{name && <small>{name}</small>}</> : <b>{name}</b>}</div>;
  return <div className="hkc-journey-route">
    {(flight.originCode || flight.originName) && end(flight.originCode, flight.originName)}
    <div className="hkc-journey-track" data-condition={tracking?.condition}>
      {tracking?.progress === undefined ? <span className="hkc-journey-line" aria-hidden="true" /> : <BarOf tracking={tracking} />}
      <AirplaneTilt className="hkc-journey-plane" size={18} weight="fill" aria-hidden="true" style={{ insetInlineStart: `calc(${Math.min(100, Math.max(0, tracking?.progress ?? 0))}% - 9px)` }} />
    </div>
    {end(flight.destinationCode, flight.destinationName)}
  </div>;
}

function Times({ flight, offset }: { flight: Facts; offset?: number }) {
  if (!flight.departure && !flight.arrival) return null;
  const moved = flight.scheduled && flight.scheduled !== flight.departure ? flight.scheduled : undefined;
  return <div className="hkc-journey-times">
    {flight.departure && <div><strong>{flight.departure}</strong>{moved && <s>Was {moved}</s>}<span>Departure{flight.departureZone && ` · ${flight.departureZone}`}</span></div>}
    {flight.arrival && <div><strong>{flight.arrival}{offset && <sup>+{offset}</sup>}</strong><span>Arrival{flight.arrivalZone && ` · ${flight.arrivalZone}`}</span></div>}
  </div>;
}

function FactList({ flight }: { flight: Facts }) {
  const moved = flight.gate && flight.previousGate && flight.previousGate !== flight.gate ? flight.previousGate : undefined;
  const facts: [string, string | undefined, string | undefined][] = [["Terminal", flight.terminal, undefined], ["Gate", flight.gate, moved], ["Boarding", flight.boarding, undefined], ["Seat", flight.seat, undefined]];
  const shown = facts.filter(([, value]) => value);
  if (!shown.length) return null;
  return <dl className="hkc-journey-facts">
    {shown.map(([name, value, was]) => <div key={name}><dt>{name}</dt><dd>{value}{was && <> <s>Was {was}</s></>}</dd></div>)}
  </dl>;
}

/** A line of facts for a widget: the sourced remaining text first, then gate and terminal. */
const glance = (flight: Facts) => [flight.remaining, flight.gate && `Gate ${flight.gate}`, flight.terminal && `Terminal ${flight.terminal}`].filter(Boolean).join(" · ");

interface Shared { document: V6FamilyProps["document"]; host: V6Host; renderBrand: V6RenderBrand }

/** A Home widget: one open target (the title) stretched over the tile, the snapshot time, and no other control. */
function Widget({ document, host, renderBrand, size, children }: Shared & { size: WidgetSize; children: ReactNode }) {
  const id = useId();
  const { brand, title } = document.header;
  return <section className="hkc-output-card hkc-journey-widget" data-size={size} aria-labelledby={id}>
    <header className="hkc-journey-widget-head">
      {brand && <V6Brand domain={brand} label={title} renderBrand={renderBrand} />}
      <h2 id={id} className="hkc-journey-widget-title"><button type="button" className="hkc-journey-widget-open" onClick={host.onViewAll}>{title}</button></h2>
    </header>
    {children}
    <HarsoOutputCardMeta document={document} />
  </section>;
}

// ---- delivery-tracking ----

function delivery(props: V6FamilyProps) {
  const { document, mode, widgetSize, host, renderBrand, onOpenDetails } = props;
  const parts = readParts(document.blocks);
  const tracking = parts?.status;
  if (!parts || !tracking) return undefined;
  if (widgetSize) return <Widget document={document} host={host} renderBrand={renderBrand} size={widgetSize}>
    <StatusLine tracking={tracking} />
    <BarOf tracking={tracking} />
    {widgetSize === "medium" && <><Stages tracking={tracking} />{document.header.subtitle && <p className="hkc-journey-note">{document.header.subtitle}</p>}</>}
  </Widget>;
  return <V6Frame document={document} mode={mode} host={host} renderBrand={renderBrand} onOpenDetails={onOpenDetails} className="hkc-journey" trailing={trailingActions(parts.actions, host)}>
    <div className="hkc-journey-body">
      <StatusLine tracking={tracking} />
      <BarOf tracking={tracking} />
      <Stages tracking={tracking} />
      {mode === "full" && <Timeline rows={parts.rows} />}
    </div>
  </V6Frame>;
}

// ---- flight-status ----

function flightStatus(props: V6FamilyProps) {
  const { document, mode, widgetSize, host, renderBrand, onOpenDetails } = props;
  const parts = readParts(document.blocks);
  const flight = readFlight(document.flight);
  if (!parts || !flight) return undefined;
  const tracking = parts.status;
  if (widgetSize) return <Widget document={document} host={host} renderBrand={renderBrand} size={widgetSize}>
    <StatusLine tracking={tracking} number={flight.number} />
    {widgetSize === "medium" ? <Route flight={flight} tracking={tracking} /> : <BarOf tracking={tracking} />}
    {glance(flight) && <p className="hkc-journey-glance">{glance(flight)}</p>}
  </Widget>;
  // arrival_day_offset lives only on a row's own flight facts; the first row that carries one speaks for the landing.
  const offset = parts.rows?.items.map(row => dayOffset(rowFlight(row)?.arrival_day_offset)).find(Boolean);
  return <V6Frame document={document} mode={mode} host={host} renderBrand={renderBrand} onOpenDetails={onOpenDetails} className="hkc-journey" trailing={trailingActions(parts.actions, host)}>
    <div className="hkc-journey-body">
      <StatusLine tracking={tracking} number={flight.number} subtitle={document.header.subtitle ?? ""} />
      <Route flight={flight} tracking={tracking} />
      <Times flight={flight} offset={offset} />
      {flight.remaining && <p className="hkc-journey-remaining">{flight.remaining}</p>}
      <FactList flight={flight} />
      {mode === "full" && <Timeline rows={parts.rows} />}
    </div>
  </V6Frame>;
}

// ---- flight-options ----

function Option({ row, host, renderBrand }: { row: HarsoOutputRow; host: V6Host; renderBrand: V6RenderBrand }) {
  const action = row.action?.kind === "open_url" ? readAction(row.action, host) : undefined;
  const flight = rowFlight(row);
  const from = text(flight?.origin_code), to = text(flight?.destination_code), arrival = text(flight?.arrival);
  const route = from && to && AIRPORT.test(from) && AIRPORT.test(to) ? `${from} → ${to}` : undefined;
  const offset = dayOffset(flight?.arrival_day_offset);
  const content = <>
    <V6Brand domain={row.brand ?? ""} label={row.label} renderBrand={renderBrand} />
    <span className="hkc-journey-option-main">
      <span className="hkc-journey-option-name"><b className="hkc-journey-airline">{row.label}</b>{row.mark === "pick" && <span className="hkc-journey-pick" data-pick>Pick</span>}</span>
      {row.secondary && <span className="hkc-journey-note">{row.secondary}</span>}
      {(arrival || route) && <span className="hkc-journey-arrives">
        {arrival && <>Arrives {arrival}{offset && <sup>+{offset}</sup>}</>}{arrival && route && " · "}{route}
      </span>}
    </span>
    {row.trailing && <span className="hkc-journey-price">{row.trailing}</span>}
    {action && <><ArrowSquareOut className="hkc-journey-go" size={14} aria-hidden="true" /><span className="hk-sr-only">{action.label}</span></>}
  </>;
  return action
    ? <button type="button" className="hkc-journey-option" onClick={action.run}>{content}</button>
    : <div className="hkc-journey-option" data-static>{content}</div>;
}

function flightOptions(props: V6FamilyProps) {
  const { document, mode, widgetSize, host, renderBrand, onOpenDetails } = props;
  const parts = readParts(document.blocks);
  if (widgetSize || !parts?.rows || parts.status || parts.actions.length) return undefined;
  const rows = parts.rows.items;
  const shown = mode === "inline" ? rows.slice(0, HARSO_OUTPUT_CARD_CAPS.maxRows) : rows;
  const more = Math.max(parts.rows.total_count ?? 0, rows.length) - shown.length;
  return <V6Frame document={document} mode={mode} host={host} renderBrand={renderBrand} onOpenDetails={onOpenDetails} className="hkc-journey">
    <ul className="hkc-journey-options" aria-label="Flights">
      {shown.map((row, i) => <li key={row.id ?? i}><Option row={row} host={host} renderBrand={renderBrand} /></li>)}
    </ul>
    {more > 0 && <p className="hkc-journey-more">{more} more</p>}
  </V6Frame>;
}

// ---- the family ----

const WIDGETS: Partial<Record<V6Template, readonly WidgetSize[]>> = { "delivery-tracking": ["small", "medium"], "flight-status": ["small", "medium"] };

export const family: V6Family = {
  renderFamily(props) {
    if (props.widgetSize && props.widgetSize !== "small" && props.widgetSize !== "medium") return undefined;
    switch (v6TemplateOf(props.document)) {
      case "delivery-tracking": return delivery(props);
      case "flight-status": return flightStatus(props);
      case "flight-options": return flightOptions(props);
      default: return undefined;
    }
  },
  supportedWidgetSizes: template => WIDGETS[template] ?? []
};
