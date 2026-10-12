"use client";

import { MapPin, Star } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";
import { Button } from "../../primitives";
import { Tabs } from "../../navigation";
import { HarsoOutputCardMeta, readAction, type HarsoOutputActionBlock, type HarsoOutputDocument, type HarsoOutputRow, type HarsoOutputRowsBlock, type HarsoOutputTextBlock, type HarsoOutputTextSection } from "../output-card";
import { HarsoOutputMapView, HarsoOutputThumb, isPhoto, readMedia, type HarsoOutputMap, type HarsoOutputMediaHost } from "../output-card-media";
import { V6Brand, V6Frame } from "./frame";
import type { V6Family, V6FamilyProps, V6Host, V6RenderBrand, V6Registry, V6Template, WidgetSize } from "./types";
import "./places.css";

/*
 * WEV-3321 (P5): trip days and nearby places. Both are read straight from the document; a field it does not carry
 * leaves its part out (no zero, no sample, no "Unknown"). The device clock is never read: the day that is next is
 * decided from the supplied dates and the saved snapshot time. Anything this family cannot draw whole returns
 * undefined, so the generic card draws every block.
 */

// ---- dates (date-only strings, no time zone, no Date from the device) ----

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A real calendar day written YYYY-MM-DD; "2026-02-30" is not one. */
function realDay(value: unknown): [number, number, number] | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const at = new Date(Date.UTC(y, m - 1, d));
  return at.getUTCFullYear() === y && at.getUTCMonth() === m - 1 && at.getUTCDate() === d ? [y, m, d] : undefined;
}
/** "Wed 14 Oct": fixed English words, so the label reads the same on every device. */
function dayLabel(value: unknown): string | undefined {
  const day = realDay(value);
  return day && `${WEEKDAYS[new Date(Date.UTC(day[0], day[1] - 1, day[2])).getUTCDay()]} ${day[2]} ${MONTHS[day[1] - 1]}`;
}
/** The UTC calendar day of the saved snapshot, or undefined when the document has no readable one. */
function snapshotDay(asOf: unknown): string | undefined {
  if (typeof asOf !== "string" || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?Z$/.test(asOf)) return undefined;
  return realDay(asOf.slice(0, 10)) ? asOf.slice(0, 10) : undefined;
}
/**
 * The day to highlight: the earliest dated day on or after the snapshot's day, in whatever order the document lists
 * them (the first listed wins a tie). No snapshot, no dates, or every day past: none, so no false "Next" is drawn.
 */
export function nextDayIndex(sections: readonly { date?: string }[], asOf: unknown): number | undefined {
  const today = snapshotDay(asOf);
  if (!today) return undefined;
  let best: number | undefined;
  sections.forEach((section, index) => {
    if (!realDay(section.date) || section.date! < today) return;
    if (best === undefined || section.date! < sections[best].date!) best = index;
  });
  return best;
}

// ---- shared pieces ----

const rowsOf = (block: HarsoOutputRowsBlock) => Array.isArray(block.items) ? block.items : [];
const TIME = /^(\d{1,2}:\d{2})\s+(\S[\s\S]*)$/;

function Stop({ text }: { text: string }) {
  const match = TIME.exec(text);
  return <li className="hkc-stop">{match ? <><span className="hkc-stop-time">{match[1]}</span><span>{match[2]}</span></> : <span>{text}</span>}</li>;
}

/** The action block's controls, or undefined when the host can act on none of them (then nothing is drawn). */
function trailingOf(block: HarsoOutputActionBlock | undefined, host: V6Host): ReactNode | undefined {
  if (!block || ![block.primary, block.secondary].some(spec => readAction(spec, host))) return undefined;
  return <ActionButtons block={block} host={host} />;
}
function ActionButtons({ block, host }: { block: HarsoOutputActionBlock; host: V6Host }) {
  const actions = ([block.primary, block.secondary] as const).flatMap(spec => { const action = readAction(spec, host); return action ? [action] : []; });
  return <>{actions.map(({ label, run }, index) => <Button key={index} variant={index === 0 ? "primary" : "quiet"} size="small" title={label} onClick={run}>{label}</Button>)}</>;
}

/** The map when the host can draw it (tiles lent, every place readable), else undefined. */
function drawableMap(map: HarsoOutputMap | undefined, media: HarsoOutputMediaHost) {
  const block = { kind: "visual", visual: map };
  return map ? readMedia(block, media) as HarsoOutputMap | undefined : undefined;
}

/** One tile-sized card: its title is the single button that opens the whole answer. */
function Widget({ document, host, size, lead, children }: { document: HarsoOutputDocument; host: V6Host; size: WidgetSize; lead?: ReactNode; children: ReactNode }) {
  const id = useId();
  return <section className="hkc-v6-widget" data-size={size} aria-labelledby={id}>
    <div className="hkc-v6-widget-head">
      {lead}
      <h2 id={id} className="hkc-v6-widget-title"><button type="button" className="hkc-v6-widget-open" onClick={host.onViewAll}>{document.header.title}</button></h2>
    </div>
    {children}
    <HarsoOutputCardMeta document={document} />
  </section>;
}

// ---- nearby places ----

interface PlacesRead { rows: HarsoOutputRow[]; total: number; map?: HarsoOutputMap; action?: HarsoOutputActionBlock; places: HarsoOutputMap["places"]; selected?: string }

/** One rows block, at most one map and one action block. Anything else, or a row part this card does not draw, is the generic card's. */
function readPlaces(document: HarsoOutputDocument): PlacesRead | undefined {
  let rows: HarsoOutputRowsBlock | undefined, map: HarsoOutputMap | undefined, action: HarsoOutputActionBlock | undefined;
  for (const block of document.blocks) {
    if (block.kind === "rows" && !rows && Array.isArray((block as HarsoOutputRowsBlock).items)) rows = block as HarsoOutputRowsBlock;
    else if (block.kind === "visual" && !map && (block as { visual?: { kind?: string } }).visual?.kind === "map") map = (block as unknown as { visual: HarsoOutputMap }).visual;
    else if (block.kind === "action" && !action) action = block as HarsoOutputActionBlock;
    else return undefined;
  }
  const items = rows ? rowsOf(rows) : [];
  if (!rows || !items.length || items.some(row => row.group || row.thumbnail || row.status || row.status_label)) return undefined;
  return { rows: items, total: Math.max(rows.total_count ?? 0, items.length), map, action, places: Array.isArray(map?.places) ? map!.places : [], selected: map?.selected_place_id };
}

/** A rating the contract allows: a decimal 0 to 5. Anything else is not drawn. */
function ratingOf(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d(\.\d{1,2})?$/.test(value)) return undefined;
  const rating = Number(value);
  return rating <= 5 ? rating : undefined;
}
const MODES: Readonly<Record<string, string>> = { walk: "walk", drive: "drive", transit: "transit", cycle: "cycle" };
const travelOf = (row: HarsoOutputRow) => [row.trailing, typeof row.travel_mode === "string" && Object.hasOwn(MODES, row.travel_mode) ? MODES[row.travel_mode] : undefined].filter(Boolean).join(" ");
/** The words for hours: the document's own label, else Open/Closed for a known state, else nothing. */
function openOf(row: HarsoOutputRow): { words: string; state?: string } | undefined {
  const state = row.open_state === "open" || row.open_state === "closed" || row.open_state === "unknown" ? row.open_state : undefined;
  const label = typeof row.opening_label === "string" && row.opening_label.trim() ? row.opening_label.trim() : undefined;
  const words = label ?? (state === "open" ? "Open" : state === "closed" ? "Closed" : undefined);
  return words ? { words, state } : undefined;
}

function Stars({ rating }: { rating: number }) {
  const row = <>{[0, 1, 2, 3, 4].map(n => <Star key={n} size={11} weight="fill" />)}</>;
  return <span className="hkc-stars" aria-hidden="true"><span className="hkc-stars-back">{row}</span><span className="hkc-stars-fill" style={{ width: `${rating / 5 * 100}%` }}>{row}</span></span>;
}

function PlaceRow({ row, selected, host, renderBrand }: { row: HarsoOutputRow; selected: boolean; host: V6Host; renderBrand: V6RenderBrand }) {
  const name = useId();
  const rating = ratingOf(row.rating);
  const count = Number.isInteger(row.review_count) && row.review_count! >= 0 ? row.review_count : undefined;
  const reviews = count === undefined ? undefined : `${count} ${count === 1 ? "review" : "reviews"}`;
  const open = openOf(row), travel = travelOf(row), directions = readAction(row.action, host);
  const where = [row.secondary, row.distance].filter(Boolean).join(" · ");
  return <li className="hkc-place" aria-current={selected || undefined}>
    {row.brand && <V6Brand domain={row.brand} label={row.label} renderBrand={renderBrand} />}
    <div className="hkc-place-body">
      <div className="hkc-place-head">
        <b id={name} className="hkc-place-name">{row.label}</b>
        {row.mark === "pick" && <span className="hkc-place-pick">Pick</span>}
        {travel && <span className="hkc-place-travel">{travel}</span>}
      </div>
      {where && <p className="hkc-place-where">{where}</p>}
      {(rating !== undefined || reviews || row.category) && <p className="hkc-place-rating">
        {rating !== undefined
          ? <><span className="hkc-place-stars" role="img" aria-label={`Rated ${row.rating} out of 5${reviews ? `, ${reviews}` : ""}`}><Stars rating={rating} /></span>
            <span aria-hidden="true">{row.rating}</span>{count !== undefined && <span aria-hidden="true">({count})</span>}</>
          : reviews && <span>{reviews}</span>}
        {row.category && <span className="hkc-place-category">{row.category}</span>}
      </p>}
      {(open || directions) && <div className="hkc-place-foot">
        {open ? <span className="hkc-place-open" data-open-state={open.state}>{open.words}</span> : <span />}
        {directions && <button type="button" className="hkc-place-directions" aria-describedby={name} onClick={directions.run}>
          <MapPin size={12} weight="bold" aria-hidden="true" />{directions.label}
        </button>}
      </div>}
    </div>
  </li>;
}

function PlacesCard({ props, read }: { props: V6FamilyProps; read: PlacesRead }) {
  const { document, mode, host, media, renderBrand, onOpenDetails } = props;
  const shown = mode === "inline" ? read.rows.slice(0, 3) : read.rows;
  const map = drawableMap(read.map, media);
  // Map places no row carries are named in text when no map draws them: a stop is never lost with its picture.
  const joined = new Set(read.rows.map(row => row.id).filter(Boolean));
  const loose = map ? [] : read.places.filter(place => !joined.has(place.id));
  return <V6Frame document={document} mode={mode} host={host} onOpenDetails={onOpenDetails} renderBrand={renderBrand} trailing={trailingOf(read.action, host)}>
    <div className="hkc-places">
      {map && <HarsoOutputMapView map={map} host={media} />}
      <ul className="hkc-places-list" aria-label="Places">
        {shown.map((row, index) => <PlaceRow key={row.id ?? index} row={row} selected={!!row.id && row.id === read.selected} host={host} renderBrand={renderBrand} />)}
      </ul>
      {loose.length > 0 && <p className="hkc-places-loose">Also: {loose.map(place => place.label).join(", ")}</p>}
      {mode === "inline" && read.total > shown.length && <Button variant="quiet" size="small" className="hkc-places-more" onClick={host.onViewAll}>View all {read.total}</Button>}
    </div>
  </V6Frame>;
}

function PlacesWidget({ props, read, size }: { props: V6FamilyProps; read: PlacesRead; size: WidgetSize }) {
  const { document, host, renderBrand } = props;
  if (size === "small") {
    // The pick, else the row the map selects (joined by id), else the first.
    const row = read.rows.find(item => item.mark === "pick") ?? read.rows.find(item => !!item.id && item.id === read.selected) ?? read.rows[0];
    const open = openOf(row), travel = travelOf(row);
    return <Widget document={document} host={host} size={size} lead={row.brand && <V6Brand domain={row.brand} label={row.label} renderBrand={renderBrand} />}>
      <h3 className="hkc-widget-place">{row.label}</h3>
      {open && <span className="hkc-place-open" data-open-state={open.state}>{open.words}</span>}
      {travel && <p className="hkc-widget-travel">{travel}</p>}
    </Widget>;
  }
  return <Widget document={document} host={host} size={size}>
    <ul className="hkc-widget-list">
      {read.rows.slice(0, 3).map((row, index) => <li key={row.id ?? index}>
        {row.brand && <V6Brand domain={row.brand} label={row.label} renderBrand={renderBrand} />}
        <b>{row.label}</b>
        {travelOf(row) && <span>{travelOf(row)}</span>}
      </li>)}
    </ul>
  </Widget>;
}

// ---- trip itinerary ----

interface TripRead { sections: HarsoOutputTextSection[]; summary?: string; map?: HarsoOutputMap; action?: HarsoOutputActionBlock }

function readTrip(document: HarsoOutputDocument): TripRead | undefined {
  let text: HarsoOutputTextBlock | undefined, map: HarsoOutputMap | undefined, action: HarsoOutputActionBlock | undefined;
  for (const block of document.blocks) {
    if (block.kind === "text" && !text && Array.isArray((block as HarsoOutputTextBlock).sections)) text = block as HarsoOutputTextBlock;
    else if (block.kind === "visual" && !map && (block as { visual?: { kind?: string } }).visual?.kind === "map") map = (block as unknown as { visual: HarsoOutputMap }).visual;
    else if (block.kind === "action" && !action) action = block as HarsoOutputActionBlock;
    else return undefined;
  }
  if (!text?.sections.length) return undefined;
  return { sections: text.sections, summary: text.summary, map, action };
}

/** A day's photo, drawn only when the host can serve it; a photo that does not arrive leaves the quiet tile, and the text stays. */
function DayPhoto({ section, media }: { section: HarsoOutputTextSection; media: HarsoOutputMediaHost }) {
  return isPhoto(section.thumbnail) && media.resolveArtifact ? <HarsoOutputThumb photo={section.thumbnail} host={media} /> : null;
}

/** "Wed 14": the day tab's short date, in the same fixed words as the day label. */
function shortDay(value: unknown): string | undefined {
  return dayLabel(value)?.split(" ").slice(0, 2).join(" ");
}

/** Under the "Day 2" tab, "Day 2 · Arashiyama" reads "2. Arashiyama" (V6). A heading that names another day, or no day, is kept whole. */
function dayTitle(heading: string | undefined, index: number): string | undefined {
  const prefix = `Day ${index + 1} · `, area = heading?.startsWith(prefix) ? heading.slice(prefix.length).trim() : "";
  return area ? `${index + 1}. ${area}` : heading;
}

/** One day: with a photo, its date and "1. Area" sit on the photo (V6); without one, the same words lead the day. */
function TripDay({ section, index, next, media }: { section: HarsoOutputTextSection; index: number; next: boolean; media: HarsoOutputMediaHost }) {
  const label = dayLabel(section.date), title = dayTitle(section.heading, index);
  const head = (label || title || next) && <div className="hkc-day-head">
    {label && <time dateTime={section.date}>{label}</time>}
    {(title || next) && <div className="hkc-day-title">
      {title && <h3>{title}</h3>}
      {next && <span className="hkc-day-next">Next</span>}
    </div>}
  </div>;
  const photo = isPhoto(section.thumbnail) && media.resolveArtifact;
  return <div className="hkc-day" data-next={next || undefined}>
    {photo ? <div className="hkc-trip-hero"><DayPhoto section={section} media={media} />{head}</div> : head}
    {section.paragraphs?.map((line, n) => <p key={n} className="hkc-day-note">{line}</p>)}
    {!!section.bullets?.length && <ol className="hkc-stops">{section.bullets.map((stop, n) => <Stop key={n} text={stop} />)}</ol>}
  </div>;
}

/** The map's places when every one has a name and readable coordinates (at most 12), else undefined: the days still say where. */
function schematicPlaces(map: HarsoOutputMap | undefined) {
  const places = map?.places;
  if (!Array.isArray(places) || !places.length || places.length > 12) return undefined;
  const read = places.map(place => ({ label: place?.label, lat: Number(place?.lat), lon: Number(place?.lon) }));
  return read.every(place => typeof place.label === "string" && place.label.trim() !== "" && Number.isFinite(place.lat) && Number.isFinite(place.lon)
    && Math.abs(place.lat) <= 90 && Math.abs(place.lon) <= 180) ? read as { label: string; lat: number; lon: number }[] : undefined;
}

const PLANE = { width: 500, height: 110 };
/**
 * V6's offline map, for a host that lends no map tiles: each pin at its place's real position relative to the others
 * (west to east, north to south; not to scale), numbered in document order. The ground is a plain grid, never drawn
 * streets or rivers, so nothing on it claims a geography the document did not give. Screen readers get the places as a list.
 */
function SchematicMap({ map, days }: { map: HarsoOutputMap | undefined; days: number }) {
  const places = schematicPlaces(map);
  if (!places) return null;
  const lats = places.map(place => place.lat), lons = places.map(place => place.lon);
  const west = Math.min(...lons), east = Math.max(...lons), south = Math.min(...lats), north = Math.max(...lats);
  const x = (lon: number) => east === west ? PLANE.width / 2 : 26 + (lon - west) / (east - west) * (PLANE.width - 52);
  const y = (lat: number) => north === south ? PLANE.height / 2 : 20 + (north - lat) / (north - south) * (PLANE.height - 40);
  const byDay = places.length === days;
  return <figure className="hkc-trip-map" aria-label="Map of the trip, not to scale">
    <figcaption className="hkc-trip-map-legend">{byDay ? "Where each day is · pin number = day" : "Where the places are"}</figcaption>
    <svg className="hkc-trip-map-plane" viewBox={`0 0 ${PLANE.width} ${PLANE.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="hkc-trip-map-land" width={PLANE.width} height={PLANE.height} />
      <g className="hkc-trip-map-grid">{[100, 200, 300, 400].map(at => <line key={`x${at}`} x1={at} x2={at} y1={0} y2={PLANE.height} />)}{[37, 74].map(at => <line key={`y${at}`} x1={0} x2={PLANE.width} y1={at} y2={at} />)}</g>
      <text className="hkc-trip-map-scale" x={PLANE.width - 10} y={PLANE.height - 7} textAnchor="end">Schematic · not to scale</text>
      {places.map((place, index) => <g key={index} className="hkc-trip-pin" transform={`translate(${x(place.lon).toFixed(1)} ${y(place.lat).toFixed(1)})`}>
        <path d="M0 10C-5 3-10 0-10-6a10 10 0 0 1 20 0C10 0 5 3 0 10z" />
        <text y={-2} textAnchor="middle">{index + 1}</text>
      </g>)}
    </svg>
    <ol className="hk-sr-only">{places.map((place, index) => <li key={index}>{place.label}</li>)}</ol>
  </figure>;
}

function TripCard({ props, read }: { props: V6FamilyProps; read: TripRead }) {
  const { document, mode, host, media, renderBrand, onOpenDetails } = props;
  const next = nextDayIndex(read.sections, document.as_of);
  const map = drawableMap(read.map, media);
  const day = (section: HarsoOutputTextSection, index: number) => <TripDay key={index} section={section} index={index} next={next === index} media={media} />;
  return <V6Frame document={document} mode={mode} host={host} onOpenDetails={onOpenDetails} renderBrand={renderBrand} trailing={trailingOf(read.action, host)}>
    <div className="hkc-trip">
      {read.summary && <p className="hkc-trip-summary">{read.summary}</p>}
      {read.sections.length > 1
        ? <div className="hkc-trip-tabs">
          {/* V6 day tabs: one day at a time, opening on the next day. Every day stays mounted, so nothing is lost. */}
          <Tabs variant="pill" label="Days" defaultValue={String(next ?? 0)} items={read.sections.map((section, index) => {
            const short = shortDay(section.date);
            return { value: String(index), label: <><b>{`Day ${index + 1}`}</b>{short && <> <span>{short}</span></>}</>, content: day(section, index) };
          })} />
        </div>
        : day(read.sections[0], 0)}
      {map ? <HarsoOutputMapView map={map} host={media} /> : <SchematicMap map={read.map} days={read.sections.length} />}
    </div>
  </V6Frame>;
}

function TripWidget({ props, read, size }: { props: V6FamilyProps; read: TripRead; size: WidgetSize }) {
  const { document, host, media } = props;
  const sections = read.sections;
  if (size === "medium") {
    const next = nextDayIndex(sections, document.as_of);
    const day = sections[next ?? 0], label = dayLabel(day.date);
    return <Widget document={document} host={host} size={size}>
      <DayPhoto section={day} media={media} />
      {(label || day.heading) && <div className="hkc-widget-day">
        {label && <span className="hkc-widget-eyebrow">{next === undefined ? label : <>{"Next · "}{label}</>}</span>}
        {day.heading && <h3>{day.heading}</h3>}
      </div>}
      {!!day.bullets?.length && <ol className="hkc-stops">{day.bullets.slice(0, 2).map((stop, n) => <Stop key={n} text={stop} />)}</ol>}
    </Widget>;
  }
  const shown = sections.slice(0, 4);
  return <Widget document={document} host={host} size={size}>
    <ul className="hkc-widget-days">
      {shown.map((section, index) => <li key={index}>
        <DayPhoto section={section} media={media} />
        <div>
          {(section.heading || dayLabel(section.date)) && <small>{[section.heading, dayLabel(section.date)].filter(Boolean).join(" · ")}</small>}
          {section.bullets?.[0] && <span>{section.bullets[0]}</span>}
        </div>
      </li>)}
    </ul>
    {sections.length > shown.length && <p className="hkc-widget-more">+{sections.length - shown.length} more {sections.length - shown.length === 1 ? "day" : "days"}</p>}
  </Widget>;
}

// ---- the family ----

const SIZES: Readonly<Partial<Record<V6Template, readonly WidgetSize[]>>> = { "trip-itinerary": ["medium", "large"], "places-nearby": ["small", "medium"] };

export const family: V6Family = {
  renderFamily(props) {
    const { document, widgetSize } = props;
    if (document.template === "places-nearby") {
      const read = readPlaces(document);
      if (!read) return undefined;
      if (!widgetSize) return <PlacesCard props={props} read={read} />;
      return SIZES["places-nearby"]!.includes(widgetSize) ? <PlacesWidget props={props} read={read} size={widgetSize} /> : undefined;
    }
    if (document.template === "trip-itinerary") {
      const read = readTrip(document);
      if (!read) return undefined;
      if (!widgetSize) return <TripCard props={props} read={read} />;
      return SIZES["trip-itinerary"]!.includes(widgetSize) ? <TripWidget props={props} read={read} size={widgetSize} /> : undefined;
    }
    return undefined;
  },
  supportedWidgetSizes: template => SIZES[template] ?? []
};

/** The two entries the Lead adds to the registry. */
export const placesFamilies: V6Registry = Object.freeze({ "trip-itinerary": family, "places-nearby": family });
