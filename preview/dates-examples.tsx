import { useState } from "react";
import { Calendar, Checkbox, DatePicker, DateRangePicker, Field, MeetingScheduler, MonthPanel, Select, type DateRange, type MeetingSlot } from "@harso/ui";
import type { ExampleState } from "./examples";

export const dateExports = ["DatePicker", "Calendar"] as const;
export type DateExport = typeof dateExports[number];
export const dateNotes: Record<DateExport, { behavior: string; example: string }> = {
  DatePicker: { behavior: "One shared Gregorian month panel powers single-date, two-month range and meeting compositions. Native date fields and popovers handle entry and disclosure. Apply commits a validated draft; Cancel and Escape discard it. The host may retain a controlled value. Range presets respect unavailable dates, including dates inside the range. Meeting slots are supplied offset-qualified instants, not invented availability; Intl renders their date and offset in the chosen timezone, including repeated daylight-saving hours. Confirmation is only a callback.", example: '<DateRangePicker label="Research window" value={range} onValueChange={setRange} minDate="2026-09-01" maxDate="2026-12-31" />\n<MonthPanel value={date} onValueChange={setDate} />\n<MeetingScheduler label="Review" slots={slots} timeZones={zones} onConfirm={requestMeeting} />' },
  Calendar: { behavior: "A quiet month layout with native event-detail popovers, supplied attendees and explicit action callbacks. Extra events disclose within their day; an inbox reuses the shared menu. Narrow containers show the same events as an agenda, not a compressed seven-column grid. Events use host-assigned civil dates and time labels; no external calendars, availability, conferencing or sync is accessed.", example: '<Calendar label="This month" events={events} inbox={updates} onEventAction={requestJoin} onInboxAction={inspectUpdate} />' },
};

const meetingSlots: readonly MeetingSlot[] = [
  { id: "morning", startsAt: "2026-09-06T09:00:00+08:00", durationMinutes: 30 },
  { id: "unavailable", startsAt: "2026-09-06T11:00:00+08:00", durationMinutes: 30, disabled: true },
  { id: "afternoon", startsAt: "2026-09-06T14:30:00+08:00", durationMinutes: 45 },
  { id: "tomorrow", startsAt: "2026-09-07T09:00:00+08:00", durationMinutes: 30 },
  { id: "fall-first", startsAt: "2026-11-01T01:30:00-04:00", durationMinutes: 30 },
  { id: "fall-second", startsAt: "2026-11-01T01:30:00-05:00", durationMinutes: 30 },
];

export function DatesExample({ component, state }: { component: DateExport; state: ExampleState }) {
  const [composition, setComposition] = useState("range");
  const [date, setDate] = useState<string | null>("2026-09-06");
  const [range, setRange] = useState<DateRange | null>({ start: "2026-09-07", end: "2026-09-11" });
  const [hold, setHold] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [action, setAction] = useState("");
  const disabled = state === "disabled";
  const title = state === "long-content" ? "A clearer direction for the whole team, with room to question every assumption and keep the evidence" : "A clearer direction";
  if (component === "Calendar") return <div className="hkld-stage" dir={rtl ? "rtl" : "ltr"}><div className="hkld-controls"><Checkbox label="Right to left" checked={rtl} onChange={event => setRtl(event.target.checked)} /><Checkbox label="Empty month" checked={empty} onChange={event => setEmpty(event.target.checked)} /></div><Calendar label="Space to focus" today="2026-09-06" disabled={disabled} weekStartsOn={1} events={empty ? [] : [
    { id: "brief", date: "2026-09-07", title, timeLabel: "09:00 · 30 min", description: "A sample review of the direction and the decisions that matter.", attendees: ["You", "Design team"], actionLabel: "Join review" },
    { id: "source", date: "2026-09-07", title: "Review the evidence", timeLabel: "11:00", description: "Read the linked findings before our next decision." },
    { id: "walk", date: "2026-09-07", title: "A little room to think", timeLabel: "14:00", description: "An intentionally quiet afternoon." },
    { id: "share", date: "2026-09-07", title: "Share a first look", timeLabel: "16:00", attendees: ["Research team"], actionLabel: "Open review", disabled: true },
    { id: "prototype", date: "2026-09-10", title: "Try the prototype", timeLabel: "10:30", actionLabel: "Open prototype" },
    { id: "reflect", date: "2026-09-22", title: "What did we learn?", timeLabel: "15:00" },
  ]} inbox={empty ? [] : [{ id: "time-change", title: "Review time updated", detail: "The team moved the review to09:00." }, { id: "notes", title: "Notes ready", detail: "Two decisions to review." }]} onEventAction={event => setAction(`Requested: ${event.id}`)} onInboxAction={id => setAction(`Inbox: ${id}`)} /><output aria-label="Calendar action">{action}</output></div>;
  const limits = { disabled, minDate: state === "error" ? "2026-09-08" : "2026-09-01", maxDate: "2026-12-31", isDateUnavailable: (day: string) => day === "2026-09-13" };
  return <div className="hkld-stage" dir={rtl ? "rtl" : "ltr"}><div className="hkld-controls"><Field label="Date composition">{props => <Select {...props} value={composition} onChange={event => setComposition(event.target.value)}><option value="range">Date range</option><option value="single">Single date</option><option value="uncontrolled">Uncontrolled range</option><option value="month">Inline month</option><option value="meeting">Meeting scheduler</option><option value="dst">Repeated-hour slots</option></Select>}</Field><Checkbox label="Keep host value" checked={hold} disabled={composition === "uncontrolled" || composition === "meeting" || composition === "dst"} onChange={event => setHold(event.target.checked)} /><Checkbox label="Right to left" checked={rtl} onChange={event => setRtl(event.target.checked)} /></div>
    {composition === "range" && <DateRangePicker {...limits} label="Research window" value={range} today="2026-09-06" presets={[{ label: "This workweek", value: { start: "2026-09-07", end: "2026-09-11" } }, { label: "Next workweek", value: { start: "2026-09-14", end: "2026-09-18" } }]} onValueChange={next => { setAction(`Requested range: ${next ? `${next.start} / ${next.end}` : "cleared"}`); if (!hold) setRange(next); }} />}
    {composition === "single" && <DatePicker {...limits} label="Review date" value={date} today="2026-09-06" onValueChange={next => { setAction(`Requested date: ${next ?? "cleared"}`); if (!hold) setDate(next); }} />}
    {composition === "uncontrolled" && <DateRangePicker {...limits} label="Local research window" defaultValue={{ start: "2026-09-07", end: "2026-09-11" }} today="2026-09-06" onValueChange={next => setAction(`Local range: ${next ? `${next.start} / ${next.end}` : "cleared"}`)} />}
    {composition === "month" && <MonthPanel {...limits} value={date} today="2026-09-06" onValueChange={next => { setAction(`Requested date: ${next}`); if (!hold) setDate(next); }} />}
    {(composition === "meeting" || composition === "dst") && <MeetingScheduler key={composition} label="Find a little time" description="Choose from the times supplied by your host. This example does not book anything." slots={empty ? [] : meetingSlots} today={composition === "dst" ? "2026-11-01" : "2026-09-06"} defaultTimeZone={composition === "dst" ? "America/New_York" : "Asia/Singapore"} timeZones={["Asia/Singapore", "Europe/London", "America/New_York", "UTC"]} disabled={disabled} onConfirm={slot => setAction(`Requested meeting: ${slot.id}`)} />}
    <output aria-label="Selected date">{date ?? "No date"}</output><output aria-label="Selected range">{range ? `${range.start} / ${range.end}` : "No range"}</output><output aria-label="Date action">{action}</output>
  </div>;
}
