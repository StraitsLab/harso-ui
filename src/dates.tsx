import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button, Disclosure, Field, IconButton, Input, Select } from "./primitives";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "./navigation-surfaces";
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react";

export type DateRange = { start: string; end: string };
type DateLimits = { minDate?: string; maxDate?: string; disabled?: boolean; isDateUnavailable?: (date: string) => boolean };
type MonthOptions = DateLimits & { month?: string; defaultMonth?: string; onMonthChange?: (month: string) => void; today?: string; locale?: string; weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 };
const earliest = "0001-01-01";
const latest = "9999-12-31";
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < earliest || value > latest) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
function dateString(date: Date) { return date.toISOString().slice(0, 10); }
function localToday() {
  const now = new Date();
  return `${now.getFullYear().toString().padStart(4, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
}
function shifted(date: string, days: number, months = 0) {
  const target = parseDate(date)!;
  if (months) {
    const day = target.getUTCDate();
    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + months + 1);
    target.setUTCDate(0);
    target.setUTCDate(Math.min(day, target.getUTCDate()));
  }
  target.setUTCDate(target.getUTCDate() + days);
  return target.getUTCFullYear() < 1 ? earliest : target.getUTCFullYear() > 9999 ? latest : dateString(target);
}
function formatDate(value: string, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC", calendar: "gregory" }).format(parseDate(value)!);
}
function validateLimits({ minDate, maxDate }: DateLimits) {
  for (const date of [minDate, maxDate]) if (date !== undefined && !parseDate(date)) throw new RangeError("Date bounds require a valid date in YYYY-MM-DD format.");
  if (minDate && maxDate && minDate > maxDate) throw new RangeError("Minimum date must not follow maximum date.");
}
function selectable(date: string, limits: DateLimits) {
  return !!parseDate(date) && !limits.disabled && date >= (limits.minDate ?? earliest) && date <= (limits.maxDate ?? latest) && !limits.isDateUnavailable?.(date);
}
function monthDates(month: string, weekStartsOn: number) {
  const first = parseDate(`${month}-01`);
  if (!first) throw new RangeError("Month requires a valid YYYY-MM value.");
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const last = parseDate(shifted(`${month}-01`, -1, 1))!;
  const count = month === "9999-12" ? 31 : last.getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => index < offset || index >= offset + count ? null : `${month}-${(index - offset + 1).toString().padStart(2, "0")}`);
}
function MonthHeading({ month, onMonthChange, locale, limits }: { month: string; onMonthChange: (month: string) => void; locale: string; limits: DateLimits }) {
  const previous = shifted(`${month}-01`, 0, -1).slice(0, 7);
  const next = shifted(`${month}-01`, 0, 1).slice(0, 7);
  return <div className="hk-month-heading"><h3 aria-live="polite">{formatDate(`${month}-01`, locale, { month: "long", year: "numeric" })}</h3><div><IconButton label="Previous month" disabled={limits.disabled || previous === month || previous < (limits.minDate ?? earliest).slice(0, 7)} onClick={() => onMonthChange(previous)}>‹</IconButton><IconButton label="Next month" disabled={limits.disabled || next === month || next > (limits.maxDate ?? latest).slice(0, 7)} onClick={() => onMonthChange(next)}>›</IconButton></div></div>;
}

export function MonthPanel({ month, defaultMonth, onMonthChange, value, defaultValue = null, onValueChange, range, today = localToday(), locale = "en-US", weekStartsOn = 0, ...limits }: MonthOptions & { value?: string | null; defaultValue?: string | null; onValueChange?: (date: string) => void; range?: DateRange | null }) {
  validateLimits(limits);
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value === undefined ? localValue : value;
  const [localMonth, setLocalMonth] = useState(defaultMonth ?? (selected || today).slice(0, 7));
  const displayed = month ?? localMonth;
  const dates = monthDates(displayed, weekStartsOn);
  const [focused, setFocused] = useState(selected || today);
  const focusRequest = useRef<{ date: string; origin: HTMLElement } | null>(null);
  const grid = useRef<HTMLTableElement>(null);
  const tabDate = dates.includes(focused) ? focused : dates.includes(selected) ? selected : dates.find(date => date && selectable(date, limits)) ?? dates.find(Boolean);
  const changeMonth = (next: string) => { if (month === undefined) setLocalMonth(next); onMonthChange?.(next); };
  useLayoutEffect(() => {
    const request = focusRequest.current;
    if (!request) return;
    const destination = grid.current?.querySelector<HTMLButtonElement>(`[data-date="${request.date}"]`);
    const ownsFocus = document.activeElement === request.origin || (!request.origin.isConnected && document.activeElement === document.body);
    if (destination && ownsFocus) destination.focus();
    if (destination || !ownsFocus || !request.origin.isConnected) focusRequest.current = null;
  });
  return <section className="hk-month"><MonthHeading month={displayed} onMonthChange={changeMonth} locale={locale} limits={limits} />
    <table ref={grid} className="hk-month-grid" role="grid" aria-label={formatDate(`${displayed}-01`, locale, { month: "long", year: "numeric" })} onBlurCapture={() => { focusRequest.current = null; }} onKeyDown={event => {
      const target = event.target as HTMLButtonElement;
      const date = target.dataset.date;
      if (!date || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const weekday = (parseDate(date)!.getUTCDay() - weekStartsOn + 7) % 7;
      const days: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 7, ArrowUp: -7, Home: -weekday, End: 6 - weekday };
      let next = event.key in days ? shifted(date, days[event.key]) : event.key === "PageDown" ? shifted(date, 0, event.shiftKey ? 12 : 1) : event.key === "PageUp" ? shifted(date, 0, event.shiftKey ? -12 : -1) : null;
      if (!next) return;
      event.preventDefault();
      next = next < (limits.minDate ?? earliest) ? limits.minDate! : next > (limits.maxDate ?? latest) ? limits.maxDate! : next;
      setFocused(next); focusRequest.current = { date: next, origin: target };
      if (next.slice(0, 7) !== displayed) changeMonth(next.slice(0, 7));
    }}><thead><tr>{Array.from({ length: 7 }, (_, index) => <th scope="col" key={index} abbr={formatDate(shifted("2026-09-06", (index + weekStartsOn) % 7), locale, { weekday: "long" })}>{formatDate(shifted("2026-09-06", (index + weekStartsOn) % 7), locale, { weekday: "short" })}</th>)}</tr></thead><tbody>{Array.from({ length: dates.length / 7 }, (_, row) => <tr key={row}>{dates.slice(row * 7, row * 7 + 7).map((date, column) => {
      const inRange = !!date && !!range?.start && !!range.end && date >= range.start && date <= range.end;
      const endpoint = !!date && (date === selected || date === range?.start || date === range?.end);
      const unavailable = !!date && !selectable(date, limits);
      return <td key={date ?? column} aria-selected={!!date && (endpoint || inRange)} data-in-range={inRange || undefined}>{date && <button type="button" data-date={date} tabIndex={tabDate === date ? 0 : -1} disabled={limits.disabled} aria-disabled={unavailable || undefined} aria-pressed={endpoint} aria-current={date === today ? "date" : undefined} aria-label={`${formatDate(date, locale, { dateStyle: "full" })}${unavailable ? ", unavailable" : ""}`} onFocus={() => setFocused(date)} onClick={() => { if (!selectable(date, limits)) return; if (value === undefined) setLocalValue(date); onValueChange?.(date); }}>{Number(date.slice(-2))}</button>}</td>;
    })}</tr>)}</tbody></table>
  </section>;
}

function DatePopover({ label, trigger, disabled = false, onOpen, children }: { label: string; trigger: ReactNode; disabled?: boolean; onOpen?: () => void; children: (close: () => void) => ReactNode }) {
  const identity = useId();
  const anchor = `--hk-date-${identity.replace(/[^a-z0-9_-]/gi, "")}`;
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [available, setAvailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const close = () => {
    if (!panel.current || typeof panel.current.hidePopover !== "function" || !panel.current.matches(":popover-open")) return;
    const restore = panel.current.contains(document.activeElement);
    panel.current.hidePopover();
    if (restore) button.current?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => { setAvailable(typeof panel.current?.showPopover === "function"); if (disabled) close(); }, [disabled]);
  return <><Button ref={button} popoverTarget={identity} disabled={disabled || !available} aria-haspopup="dialog" aria-expanded={expanded} aria-controls={identity} title={!available ? "Requires native popover support" : undefined} style={{ anchorName: anchor } as CSSProperties}>{trigger}</Button>
    <div ref={panel} id={identity} popover="auto" role="dialog" aria-label={label} className="hk-date-popover" style={{ positionAnchor: anchor } as CSSProperties} onBeforeToggle={event => { if (event.newState === "open") onOpen?.(); }} onToggle={event => {
      const opened = event.newState === "open";
      setExpanded(opened);
      if (opened) panel.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }}><div className="hk-date-popover-heading"><h3>{label}</h3><IconButton label={`Close ${label}`} onClick={close}>×</IconButton></div>{children(close)}</div></>;
}

export type DatePreset = { label: string; value: DateRange };
type PickerProps = DateLimits & { label: string; locale?: string; today?: string; weekStartsOn?: MonthOptions["weekStartsOn"]; presets?: readonly DatePreset[] };
function selectionError(value: DateRange, range: boolean, limits: DateLimits) {
  if (!parseDate(value.start) || (range && !parseDate(value.end))) return "Choose valid dates.";
  if (!selectable(value.start, limits) || !selectable(range ? value.end : value.start, limits)) return "Choose available dates within the allowed range.";
  if (range && value.start > value.end) return "End date must be on or after start date.";
  if (range && limits.isDateUnavailable) {
    for (let date = value.start; date < value.end; date = shifted(date, 1)) if (!selectable(date, limits)) return "The range includes an unavailable date.";
  }
  return null;
}
function DateSelection({ label, locale = "en-US", today = localToday(), weekStartsOn, presets = [], value, defaultValue = null, onValueChange, range, ...limits }: PickerProps & { value?: DateRange | null; defaultValue?: DateRange | null; onValueChange?: (value: DateRange | null) => void; range: boolean }) {
  validateLimits(limits);
  const [localValue, setLocalValue] = useState(defaultValue);
  const committed = value === undefined ? localValue : value;
  const [draft, setDraft] = useState<DateRange>({ start: "", end: "" });
  const [month, setMonth] = useState(today.slice(0, 7));
  useLayoutEffect(() => {
    setDraft({ start: committed?.start ?? "", end: committed?.end ?? "" });
    if (committed?.start && parseDate(committed.start)) setMonth(committed.start.slice(0, 7));
  }, [committed?.start, committed?.end]);
  const error = selectionError(draft, range, limits);
  const summary = committed?.start && parseDate(committed.start) ? formatDate(committed.start, locale, { dateStyle: "medium" }) + (range && committed.end && parseDate(committed.end) ? ` – ${formatDate(committed.end, locale, { dateStyle: "medium" })}` : "") : "Choose dates";
  const secondMonth = shifted(`${month}-01`, 0, 1).slice(0, 7);
  const choose = (date: string) => setDraft(previous => !range ? { start: date, end: date } : !previous.start || previous.end || date < previous.start ? { start: date, end: "" } : { ...previous, end: date });
  return <div className="hk-date-selection"><span className="hk-date-label">{label}</span><DatePopover label={label} trigger={<><CalendarBlankIcon size={16} aria-hidden="true" /><span>{summary}</span><CaretDownIcon size={16} aria-hidden="true" /></>} disabled={limits.disabled} onOpen={() => { setDraft(committed ?? { start: "", end: "" }); setMonth((committed?.start && parseDate(committed.start) ? committed.start : today).slice(0, 7)); }}>{close => <>
    {!!presets.length && <div className="hk-date-presets" aria-label="Date presets">{presets.map(preset => <Button key={preset.label} size="small" disabled={!!selectionError(preset.value, range, limits)} onClick={() => { setDraft(preset.value); setMonth(preset.value.start.slice(0, 7)); }}>{preset.label}</Button>)}</div>}
    <div className="hk-date-inputs"><Field label={range ? "Start date" : "Date"}>{props => <Input {...props} type="date" value={draft.start} min={limits.minDate ?? earliest} max={limits.maxDate ?? latest} disabled={limits.disabled} onChange={event => { const start = event.target.value; setDraft(previous => ({ start, end: range ? previous.end : start })); if (parseDate(start)) setMonth(start.slice(0, 7)); }} />}</Field>{range && <Field label="End date">{props => <Input {...props} type="date" value={draft.end} min={draft.start || limits.minDate || earliest} max={limits.maxDate ?? latest} disabled={limits.disabled} onChange={event => setDraft(previous => ({ ...previous, end: event.target.value }))} />}</Field>}</div>
    <div className="hk-date-months"><MonthPanel {...limits} month={month} onMonthChange={setMonth} value={range ? draft.end || draft.start : draft.start} range={range ? draft : undefined} today={today} locale={locale} weekStartsOn={weekStartsOn} onValueChange={choose} />{range && secondMonth !== month && <MonthPanel {...limits} month={secondMonth} onMonthChange={next => setMonth(shifted(`${next}-01`, 0, -1).slice(0, 7))} value={draft.end || draft.start} range={draft} today={today} locale={locale} weekStartsOn={weekStartsOn} onValueChange={choose} />}</div>
    <p className="hk-date-validation" role="status">{error ?? (range ? "Range ready to apply." : "Date ready to apply.")}</p>
    <div className="hk-date-actions"><Button onClick={() => { if (value === undefined) setLocalValue(null); onValueChange?.(null); close(); }}>Clear</Button><Button onClick={close}>Cancel</Button><Button variant="primary" disabled={!!error} onClick={() => { if (selectionError(draft, range, limits)) return; if (value === undefined) setLocalValue(draft); onValueChange?.(draft); close(); }}>Apply</Button></div>
  </>}</DatePopover></div>;
}

export function DatePicker({ value, defaultValue, onValueChange, ...props }: Omit<PickerProps, "presets"> & { value?: string | null; defaultValue?: string | null; onValueChange?: (date: string | null) => void }) {
  return <DateSelection {...props} range={false} value={value === undefined ? undefined : value === null ? null : { start: value, end: value }} defaultValue={defaultValue ? { start: defaultValue, end: defaultValue } : null} onValueChange={date => onValueChange?.(date?.start ?? null)} />;
}
export function DateRangePicker(props: PickerProps & { value?: DateRange | null; defaultValue?: DateRange | null; onValueChange?: (range: DateRange | null) => void }) {
  return <DateSelection {...props} range />;
}

export type MeetingSlot = { id: string; startsAt: string; durationMinutes: number; disabled?: boolean };
export function MeetingScheduler({ label, description, slots, timeZones, timeZone, defaultTimeZone = "UTC", onTimeZoneChange, value, defaultValue = null, onValueChange, onConfirm, disabled = false, locale = "en-US", today = localToday() }: { label: string; description?: string; slots: readonly MeetingSlot[]; timeZones: readonly string[]; timeZone?: string; defaultTimeZone?: string; onTimeZoneChange?: (zone: string) => void; value?: string | null; defaultValue?: string | null; onValueChange?: (id: string) => void; onConfirm?: (slot: MeetingSlot) => void; disabled?: boolean; locale?: string; today?: string }) {
  const identity = useId();
  const [localZone, setLocalZone] = useState(defaultTimeZone);
  const zone = timeZone ?? localZone;
  const [hour12, setHour12] = useState(false);
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value === undefined ? localValue : value;
  const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: zone, calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit" });
  const localized = slots.map(slot => {
    if (!/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d\d:[0-5]\d)$/.test(slot.startsAt) || !parseDate(slot.startsAt.slice(0, 10)) || !Number.isFinite(Date.parse(slot.startsAt)) || !Number.isFinite(slot.durationMinutes) || slot.durationMinutes <= 0) throw new RangeError("Meeting slots require valid offset-qualified instants and a positive duration.");
    const parts = dateFormatter.formatToParts(new Date(slot.startsAt));
    const part = (name: string) => parts.find(entry => entry.type === name)!.value;
    return { slot, date: `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}` };
  });
  if (new Set(slots.map(slot => slot.id)).size !== slots.length) throw new RangeError("Meeting slot IDs must be unique.");
  const [day, setDay] = useState(today);
  const visible = localized.filter(entry => entry.date === day);
  const chosen = visible.find(entry => entry.slot.id === selected && !entry.slot.disabled)?.slot;
  const formattedTime = (slot: MeetingSlot) => new Intl.DateTimeFormat(locale, { timeZone: zone, hour: "numeric", minute: "2-digit", hour12, timeZoneName: "shortOffset" }).format(new Date(slot.startsAt));
  return <section className="hk-meeting" aria-label={label}><header><h3>{label}</h3>{description && <p>{description}</p>}</header>
    <div className="hk-meeting-controls"><Field label="Timezone">{props => <Select {...props} value={zone} disabled={disabled} onChange={event => { if (timeZone === undefined) setLocalZone(event.target.value); onTimeZoneChange?.(event.target.value); }}>{Array.from(new Set([zone, ...timeZones])).map(option => <option key={option}>{option}</option>)}</Select>}</Field><Button aria-pressed={hour12} disabled={disabled} onClick={() => setHour12(previous => !previous)}>{hour12 ? "12-hour clock" : "24-hour clock"}</Button></div>
    <div className="hk-meeting-body"><MonthPanel value={day} onValueChange={setDay} today={today} locale={locale} disabled={disabled} isDateUnavailable={date => !localized.some(entry => entry.date === date && !entry.slot.disabled)} /><fieldset disabled={disabled} className="hk-meeting-slots"><legend>{formatDate(day, locale, { dateStyle: "full" })}</legend>{visible.length ? visible.map(({ slot }) => <label className="hk-meeting-slot" key={slot.id}><input type="radio" name={identity} value={slot.id} checked={selected === slot.id} disabled={slot.disabled} onChange={() => { if (value === undefined) setLocalValue(slot.id); onValueChange?.(slot.id); }} /><span>{formattedTime(slot)}<small>{slot.durationMinutes} min{slot.disabled ? " · Unavailable" : ""}</small></span></label>) : <p role="status">No times supplied for this date.</p>}</fieldset></div>
    <Button variant="primary" disabled={disabled || !chosen || !onConfirm} onClick={() => { if (chosen && !disabled) onConfirm?.(chosen); }}>Confirm time</Button>
  </section>;
}

export type CalendarEvent = { id: string; date: string; title: string; timeLabel?: string; description?: string; attendees?: readonly string[]; actionLabel?: string; disabled?: boolean };
export function Calendar({ label, events, inbox = [], onEventAction, onInboxAction, month, defaultMonth, onMonthChange, locale = "en-US", today = localToday(), weekStartsOn = 0, ...limits }: MonthOptions & { label: string; events: readonly CalendarEvent[]; inbox?: readonly { id: string; title: string; detail?: string; disabled?: boolean }[]; onEventAction?: (event: CalendarEvent) => void; onInboxAction?: (id: string) => void }) {
  validateLimits(limits);
  for (const event of events) if (!parseDate(event.date)) throw new RangeError("Calendar events require a valid date in YYYY-MM-DD format.");
  if (new Set(events.map(event => event.id)).size !== events.length) throw new RangeError("Calendar event IDs must be unique.");
  const [localMonth, setLocalMonth] = useState(defaultMonth ?? today.slice(0, 7));
  const displayed = month ?? localMonth;
  const dates = monthDates(displayed, weekStartsOn);
  const change = (next: string) => { if (month === undefined) setLocalMonth(next); onMonthChange?.(next); };
  const eventView = (event: CalendarEvent) => <div className="hk-calendar-event" key={event.id}><DatePopover label={event.title} trigger={<><span>{event.title}</span>{event.timeLabel && <small>{event.timeLabel}</small>}</>} disabled={limits.disabled}>{close => <div className="hk-calendar-detail"><p>{formatDate(event.date, locale, { dateStyle: "full" })}{event.timeLabel && ` · ${event.timeLabel}`}</p>{event.description && <p>{event.description}</p>}{!!event.attendees?.length && <section><h4>Attendees</h4><ul>{event.attendees.map((attendee, index) => <li key={index}>{attendee}</li>)}</ul></section>}{event.actionLabel && <Button variant="primary" disabled={event.disabled || !onEventAction} onClick={() => { if (!event.disabled) onEventAction?.(event); close(); }}>{event.actionLabel}</Button>}</div>}</DatePopover></div>;
  return <section className="hk-calendar" aria-label={label}><header><h3>{label}</h3><Dropdown label="Calendar inbox" disabled={limits.disabled}><DropdownTrigger>Inbox · {inbox.length}</DropdownTrigger><DropdownPopover>{inbox.length ? inbox.map(item => <DropdownItem key={item.id} label={item.title} description={item.detail} disabled={item.disabled || !onInboxAction} onSelect={() => onInboxAction?.(item.id)} />) : <p>No calendar updates.</p>}</DropdownPopover></Dropdown></header>
    <MonthHeading month={displayed} onMonthChange={change} locale={locale} limits={limits} />
    <div className="hk-calendar-week" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index}>{formatDate(shifted("2026-09-06", (index + weekStartsOn) % 7), locale, { weekday: "short" })}</span>)}</div>
    <div className="hk-calendar-days">{dates.map((date, index) => {
      const daily = events.filter(event => event.date === date);
      return <section key={date ?? index} className="hk-calendar-day" data-empty={!date || undefined} aria-label={date ? formatDate(date, locale, { dateStyle: "full" }) : undefined}>{date && <><h4><time dateTime={date} aria-current={date === today ? "date" : undefined}><span className="hk-calendar-weekday">{formatDate(date, locale, { weekday: "short" })} </span>{Number(date.slice(-2))}</time></h4>{daily.slice(0, 2).map(eventView)}{daily.length > 2 && <Disclosure summary={`+${daily.length - 2} more`}><div>{daily.slice(2).map(eventView)}</div></Disclosure>}</>}</section>;
    })}</div>{!events.some(event => event.date.slice(0, 7) === displayed) && <p role="status">No events supplied for this month.</p>}
  </section>;
}
