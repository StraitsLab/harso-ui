import { CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "../../primitives";
import { HarsoOutputActionRow, readAction, type HarsoOutputActionBlock, type HarsoOutputBlock, type HarsoOutputRow, type HarsoOutputRowsBlock } from "../output-card";
import { HarsoOutputStatusView, readStatus, readSteps, type HarsoOutputStatusBlock } from "../output-card-media";
import { V6Brand, V6Frame } from "./frame";
import { v6TemplateOf } from "./registry";
import type { V6CalendarColor, V6Family, V6FamilyProps, V6Template, WidgetSize } from "./types";
import "./schedule.css";

/*
 * WEV-3323 (P7): the calendar and routine cards. Agenda and meeting rows take their colour from `calendar_color` and
 * their start from `starts_at`, shown in the viewer's zone with the zone named once. A countdown counts from the saved
 * `as_of` only (never the device clock) and only for a timed event, so an all-day event has none. Pause and Resume
 * go through the host's routine control and are drawn only when the host can make them, for the routine the card's own
 * status names. What the host says about that routine (`subjectState`) replaces the emitted word; the card never
 * invents "paused". Anything this family cannot draw in full returns undefined, so the generic card draws every block.
 */

const SIZES: Readonly<Partial<Record<V6Template, readonly WidgetSize[]>>> = {
  "meeting-brief": ["medium", "large"], "day-agenda": ["small", "medium", "large"], "recurring-reminder": ["small"], "reply-watch": ["small"]
};
/** Events a widget shows: the next one for a small tile, then a few, then the day. A card (inline) shows three and View all. */
const WIDGET_EVENTS: Readonly<Record<string, number>> = { small: 1, medium: 3, large: 6 };
const MEETING_WIDGET_EVENTS: Readonly<Record<string, number>> = { medium: 1, large: 3 };
const INLINE_ROWS = 3;
const COLORS: readonly unknown[] = ["blue", "green", "orange", "red", "purple", "gray"];
/** Row fields this card would otherwise drop silently: a row carrying one is the generic card's to draw. */
const NOT_DRAWN = ["status", "status_label", "group", "thumbnail", "mark"] as const;

// ---- times: one formatter, one zone ----

/** Only a real UTC minute or second stamp; Date must not roll an impossible day forward. */
export function parseInstant(value: unknown): Date | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/.test(value)) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === `${value.slice(0, 16)}:${value.length === 20 ? value.slice(17, 19) : "00"}.000Z` ? date : undefined;
}

/** The one formatter every time on the card goes through, so a time and its zone cannot disagree. */
function parts(date: Date, timeZone?: string) {
  const found = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short"
  }).formatToParts(date).map(part => [part.type, part.value]));
  return found as Record<"weekday" | "year" | "month" | "day" | "hour" | "minute" | "timeZoneName", string>;
}

/** 24-hour clock time and the zone's name, in `timeZone` (the viewer's zone when absent). */
export function startText(date: Date, timeZone?: string) {
  const found = parts(date, timeZone);
  return { time: `${found.hour}:${found.minute}`, zone: found.timeZoneName };
}

/** "in 2 h from snapshot": the gap between the saved snapshot and the start, or nothing when it is not a plain upcoming gap. */
function countdown(asOf: Date, start: Date) {
  const minutes = Math.round((start.getTime() - asOf.getTime()) / 60_000);
  if (minutes < 1 || minutes >= 24 * 60) return undefined;
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return `in ${[hours && `${hours} h`, rest && `${rest} min`].filter(Boolean).join(" ")} from snapshot`;
}

// ---- reading the document ----

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** A rows block of plain rows: a label, optional secondary and trailing strings, and none of the fields this card cannot draw. */
function readRows(block: HarsoOutputBlock | undefined): HarsoOutputRowsBlock | undefined {
  if (block?.kind !== "rows") return undefined;
  const rows = block as HarsoOutputRowsBlock;
  if (!Array.isArray(rows.items) || !rows.items.length) return undefined;
  const ok = rows.items.every(row => !!row && typeof row === "object" && text(row.label)
    && (row.secondary === undefined || typeof row.secondary === "string") && (row.trailing === undefined || typeof row.trailing === "string")
    && NOT_DRAWN.every(key => row[key] == null));
  return ok ? rows : undefined;
}

type Routine = { status: HarsoOutputStatusBlock; subject: string; action?: HarsoOutputActionBlock };
type Shape = { rows?: HarsoOutputRowsBlock; routine?: Routine };

/** agenda: one rows block. meeting, reminder, reply watch: a routine status, then rows, then (maybe) its routine control; nothing else. */
function readShape(blocks: HarsoOutputBlock[], template: V6Template): Shape | undefined {
  if (!Array.isArray(blocks)) return undefined;
  if (template === "day-agenda") {
    const rows = blocks.length === 1 ? readRows(blocks[0]) : undefined;
    return rows && { rows };
  }
  const status = blocks[0] && readStatus(blocks[0]);
  const subject = status && status.state !== "tracking" && status.subject && "routine_id" in status.subject ? status.subject.routine_id : undefined;
  if (!status || !text(subject)) return undefined;
  let rows: HarsoOutputRowsBlock | undefined, action: HarsoOutputActionBlock | undefined;
  for (const block of blocks.slice(1)) {
    if (block.kind === "rows" && !rows && !action) { rows = readRows(block); if (!rows) return undefined; }
    else if (block.kind === "action" && !action) action = block as HarsoOutputActionBlock;
    else return undefined;
  }
  if (template === "meeting-brief" && !rows) return undefined;
  // No other controls: an action block may hold routine controls and nothing else.
  if (action && ![action.primary, action.secondary].every(spec => spec === undefined || (spec as { kind?: unknown })?.kind === "routine_control")) return undefined;
  return { rows, routine: { status, subject, action } };
}

type Calendar = { row: HarsoOutputRow; start?: Date; color?: V6CalendarColor; where?: string; prep?: string; clock?: string };

function readEvent(row: HarsoOutputRow, meeting: boolean): Calendar {
  const start = parseInstant(row.starts_at);
  const color = COLORS.includes(row.calendar_color) ? row.calendar_color : undefined;
  // A meeting's secondary line is "where · who · prep: note": the note gets its own place, the rest stays the agent's words.
  const pieces = (row.secondary ?? "").split(" · ");
  const prep = meeting ? pieces.find(piece => /^prep:\s*\S/i.test(piece)) : undefined;
  const where = (meeting ? pieces.filter(piece => piece !== prep) : pieces).join(" · ").trim() || undefined;
  return { row, start, color, where, prep: prep?.replace(/^prep:\s*/i, "").trim(), clock: start ? undefined : row.trailing?.trim() || undefined };
}

// ---- the card ----

/** The routine control, only as the host can make it, for the routine this card's own status names. */
function controlOf(routine: Routine, props: V6FamilyProps): ReactNode {
  const { onRoutineControl } = props.host;
  const { action, subject } = routine;
  if (!action || !onRoutineControl) return undefined;
  const host = { onRoutineControl }; // the host's other callbacks never stand in for a pause
  const keep = (["primary", "secondary"] as const).filter(slot => {
    const spec = action[slot] as { routine_id?: unknown } | undefined;
    return spec !== undefined && spec.routine_id === subject && readAction(spec, host);
  });
  if (!keep.length) return undefined;
  return <HarsoOutputActionRow block={{ kind: "action", ...Object.fromEntries(keep.map(slot => [slot, action[slot]])) } as HarsoOutputActionBlock} host={host} />;
}

const brandLabel = (domain: string) => { const name = domain.split(".")[0] ?? domain; return name.charAt(0).toUpperCase() + name.slice(1); };

function Events({ events, upNext, asOf, props, tile }: { events: Calendar[]; upNext: number; asOf?: Date; props: V6FamilyProps; tile?: boolean }) {
  return <ol className="hkc-sched-list" data-tile={tile || undefined}>
    {events.map(({ row, start, color, where: full, prep: note, clock }, index) => {
      // A small tile has room for the title and the first thing said about where; the rest is the card's.
      const where = tile ? full?.split(" · ")[0] : full, prep = tile ? undefined : note;
      const next = index === upNext;
      const gap = next && asOf && start ? countdown(asOf, start) : undefined;
      const shown = start && startText(start);
      return <li key={row.id ?? index} className="hkc-sched-event" data-color={color} data-next={next || undefined}>
        <span className="hkc-sched-when">
          {start && shown ? <time className="hkc-sched-start" dateTime={row.starts_at}>{shown.time}</time> : clock && <span className="hkc-sched-clock">{clock}</span>}
        </span>
        <div className="hkc-sched-main">
          <p className="hkc-sched-title">{row.label}</p>
          {where && <p className="hkc-sched-where">
            {row.brand && <V6Brand domain={row.brand} label={brandLabel(row.brand)} renderBrand={props.renderBrand} className="hkc-sched-brand" />}
            <span>{where}</span>
          </p>}
          {prep && <p className="hkc-sched-prep"><span className="hkc-sched-prep-tag">Prep</span> <span>{prep}</span></p>}
        </div>
        {next && <span className="hkc-sched-next"><span className="hkc-sched-next-word">Up next</span>{gap && <span className="hkc-sched-gap">{gap}</span>}</span>}
      </li>;
    })}
  </ol>;
}

function Plain({ rows }: { rows: HarsoOutputRow[] }) {
  return <ul className="hkc-sched-rows">
    {rows.map((row, index) => <li key={row.id ?? index} className="hkc-sched-row">
      <span className="hkc-sched-row-label">{row.label}</span>
      {row.secondary && <span className="hkc-sched-row-secondary">{row.secondary}</span>}
      {row.trailing && <span className="hkc-sched-row-time">{row.trailing}</span>}
    </li>)}
  </ul>;
}

function renderFamily(props: V6FamilyProps): ReactNode | undefined {
  const { document, mode, widgetSize, host } = props;
  const template = v6TemplateOf(document);
  const sizes = template && SIZES[template];
  if (!template || !sizes || (widgetSize && !sizes.includes(widgetSize))) return undefined;
  const shape = readShape(document.blocks, template);
  if (!shape) return undefined;
  const { rows, routine } = shape;
  const live = routine && host.subjectState?.(routine.status.subject!);
  const widget = !!widgetSize;
  const asOf = parseInstant(document.as_of);
  const frameDocument = widget ? { ...document, details: undefined } : document;
  const frame = (body: ReactNode, trailing?: ReactNode) => <V6Frame document={frameDocument} mode={widget ? "inline" : mode} host={host} onOpenDetails={props.onOpenDetails}
    renderBrand={props.renderBrand} trailing={trailing} openArea={widget ? "card" : "header"} className="hkc-sched">{body}</V6Frame>;

  // A routine card: its status (the host's word when it has one), what comes next, and the host's pause or resume.
  if (template !== "day-agenda" && template !== "meeting-brief") {
    const items = rows?.items ?? [];
    const steps = !live && routine && !widget ? readSteps(routine.status, items) : undefined;
    const cap = mode === "full" ? Infinity : INLINE_ROWS;
    const total = Math.max(items.length, Number.isInteger(rows?.total_count) && mode !== "full" ? rows!.total_count! : 0);
    const shownItems = items.slice(0, cap);
    return frame(<div className="hkc-sched-body">
      <HarsoOutputStatusView status={routine!.status} steps={steps?.slice(0, cap)} live={live} />
      {!widget && !steps && shownItems.length > 0 && <Plain rows={shownItems} />}
      {!widget && total > shownItems.length && <Button variant="ghost" className="hkc-output-card-view-all" onClick={host.onViewAll}
        trailingIcon={<CaretRight size={14} weight="bold" />}>{document.more_label ?? `View all ${total}`}</Button>}
    </div>, widget ? undefined : routine && controlOf(routine, props));
  }

  // Agenda and meeting: events in the document's order, coloured by their own calendar.
  const meeting = template === "meeting-brief";
  const all = rows!.items.map(row => readEvent(row, meeting));
  const timed = all.flatMap(event => event.start ? [event.start] : []);
  // "Up next": the earliest timed event not yet started at the saved snapshot. Without an as_of, or with only all-day events, nothing is.
  const upcoming = asOf ? timed.filter(start => start >= asOf).sort((a, b) => a.getTime() - b.getTime())[0] : undefined;
  const upNextAt = upcoming ? all.findIndex(event => event.start?.getTime() === upcoming.getTime()) : -1;
  const limit = widget ? (meeting ? MEETING_WIDGET_EVENTS : WIDGET_EVENTS)[widgetSize] ?? all.length : mode === "full" ? Infinity : INLINE_ROWS;
  // A small tile (or a medium meeting) is the next event alone: from the next one, else from the top of the document.
  const from = widget && limit === 1 && upNextAt > 0 ? upNextAt : 0;
  const slice = all.slice(from, from + limit);
  const total = Math.max(all.length, Number.isInteger(rows!.total_count) && mode !== "full" ? rows!.total_count! : 0);
  const zone = timed[0] && startText(timed[0]).zone;
  const days = new Set(timed.map(start => { const found = parts(start); return `${found.year}-${found.month}-${found.day}`; }));
  const first = timed[0] && parts(timed[0]);
  const hidden = widget ? all.length - slice.length : total - slice.length;

  return frame(<div className="hkc-sched-body">
    {routine && !widget && <HarsoOutputStatusView status={routine.status} live={live} />}
    {zone && <p className="hkc-sched-note">
      {first && days.size === 1 && <span className="hkc-sched-date">{`${first.weekday} ${first.day} ${first.month}`}</span>}
      <span className="hkc-sched-zone">Times in {zone}</span>
    </p>}
    <Events events={slice} upNext={upNextAt - from} asOf={asOf} props={props} tile={widgetSize === "small"} />
    {widget && hidden > 0 && <p className="hkc-sched-more">+{hidden} more</p>}
    {!widget && hidden > 0 && <Button variant="ghost" className="hkc-output-card-view-all" onClick={host.onViewAll}
      trailingIcon={<CaretRight size={14} weight="bold" />}>{document.more_label ?? `View all ${total}`}</Button>}
  </div>, widget || !routine ? undefined : controlOf(routine, props));
}

export const family: V6Family = {
  renderFamily,
  supportedWidgetSizes: template => (Object.hasOwn(SIZES, template) ? SIZES[template] : undefined) ?? []
};
