import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRow } from "../output-card";
import { family, parseInstant, startText } from "./schedule";
import styles from "./schedule.css?raw";
import type { V6FamilyProps, V6Host, V6Template, WidgetSize } from "./types";

// WEV-3323 (P7): calendar colours from calendar_color, one time-zone format, no countdown for all-day events, and
// pause/resume only through the host's routine control, never drawn as confirmed before the host says so.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

// The viewer's zone is the process zone; the kit tsconfig has no node types, so reach it through globalThis.
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

const AS_OF = "2026-09-26T23:30Z"; // 07:30 on Sun 27 Sep in Singapore
const ROUTINE = "0192a3b4-5c6d-7e8f-9a0b-0000004ae001";
const OTHER = "0192a3b4-5c6d-7e8f-9a0b-0000004ae002";

const DESIGN: HarsoOutputRow = { id: "e1", label: "Design review", secondary: "Zoom · Mei Lin, Arjun Rao · prep: read Mei's 3 comments on v2", trailing: "09:30", starts_at: "2026-09-27T01:30Z", calendar_color: "blue", brand: "zoom.us" };
const LUNCH: HarsoOutputRow = { id: "e2", label: "Lunch with Sam", secondary: "Tiong Bahru Bakery", trailing: "12:00", starts_at: "2026-09-27T04:00Z", calendar_color: "purple" };
const VIEWING: HarsoOutputRow = { id: "e3", label: "Viewing at The Clift", secondary: "21 McCallum St", trailing: "13:00", starts_at: "2026-09-27T05:00Z", calendar_color: "orange" };
const HOLIDAY: HarsoOutputRow = { id: "e0", label: "Public holiday", trailing: "All day", calendar_color: "green" };

const doc = (template: V6Template, blocks: HarsoOutputDocument["blocks"], extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template, header: { title: "Tomorrow · Sun 27 Sep", subtitle: "events" }, blocks, fallback_text: "FALLBACK", as_of: AS_OF, ...extra
});
const agenda = (items: HarsoOutputRow[], extra: Partial<HarsoOutputDocument> = {}) => doc("day-agenda", [{ kind: "rows", items }], extra);
const pause = (id = ROUTINE) => ({ kind: "routine_control" as const, label: "Pause", routine_id: id, control: "pause" as const });
const routineDoc = (template: V6Template = "recurring-reminder", extra: Partial<HarsoOutputDocument> = {}, action: unknown = pause()) => doc(template, [
  { kind: "status", state: "scheduled", detail: "next on Sun 27 Sep, 8:00 am", subject: { routine_id: ROUTINE } },
  { kind: "rows", items: [{ label: "Then", trailing: "Wed 30 Sep 8:00" }, { label: "And", trailing: "Sun 4 Oct 8:00" }] },
  { kind: "action", secondary: action }
] as HarsoOutputDocument["blocks"], { header: { title: "Water the plants", subtitle: "Every Sun and Wed" }, ...extra });
const meeting = (items: HarsoOutputRow[] = [DESIGN, LUNCH], extra: Partial<HarsoOutputDocument> = {}) => doc("meeting-brief", [
  { kind: "status", state: "watching", detail: "every evening at 20:00", subject: { routine_id: ROUTINE } },
  { kind: "rows", items },
  { kind: "action", secondary: pause() }
] as HarsoOutputDocument["blocks"], extra);

const hostOf = (extra: Partial<V6Host> = {}): V6Host => ({ onViewAll: vi.fn(), ...extra });
const propsOf = (document: HarsoOutputDocument, extra: Partial<V6FamilyProps> = {}): V6FamilyProps =>
  ({ document, mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined, ...extra });
function Card(props: V6FamilyProps) { return <div className="harso-kit">{family.renderFamily(props)}</div>; }
const draw = (document: HarsoOutputDocument, extra: Partial<V6FamilyProps> = {}) => {
  const props = propsOf(document, extra);
  return { props, ...render(<Card {...props} />) };
};
const events = () => [...document.querySelectorAll<HTMLElement>(".hkc-sched-event")];
const titles = () => events().map(node => node.querySelector(".hkc-sched-title")!.textContent);
const colourOf = (title: string) => events().find(node => node.querySelector(".hkc-sched-title")!.textContent === title)!.getAttribute("data-color");

// ---- all-day events ----

test("an all-day event has no start time, no Up next and no countdown; the next timed event does", () => {
  draw(agenda([HOLIDAY, DESIGN, LUNCH]));
  const [holiday, design] = events();
  expect(within(holiday).getByText("All day")).toBeTruthy();
  expect(holiday.querySelector("time")).toBeNull();
  expect(within(holiday).queryByText(/Up next|snapshot/)).toBeNull();
  expect(within(design).getByText("Up next")).toBeTruthy();
  expect(within(design).getByText("in 2 h from snapshot")).toBeTruthy();
  expect(screen.getAllByText(/from snapshot/)).toHaveLength(1);
});

test("a day of only all-day events draws no countdown, no Up next and no zone note", () => {
  draw(agenda([HOLIDAY, { id: "e9", label: "Birthday", trailing: "All day" }]));
  expect(screen.queryByText(/Up next|snapshot|Times in/)).toBeNull();
  expect(document.querySelector(".hkc-sched-date")).toBeNull();
});

test("the countdown counts from the saved as_of, never from the device clock; no as_of means no countdown and no Up next", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
  const { unmount } = draw(agenda([DESIGN, LUNCH]));
  expect(screen.getByText("in 2 h from snapshot")).toBeTruthy();
  unmount();
  draw(agenda([DESIGN, LUNCH], { as_of: undefined }));
  expect(screen.queryByText(/Up next|snapshot/)).toBeNull();
  expect(titles()).toEqual(["Design review", "Lunch with Sam"]);
});

test("an event already started at the snapshot is not Up next and has no countdown", () => {
  draw(agenda([DESIGN, LUNCH], { as_of: "2026-09-27T02:00Z" }));
  const [design, lunch] = events();
  expect(within(design).queryByText(/Up next|snapshot/)).toBeNull();
  expect(within(lunch).getByText("Up next")).toBeTruthy();
  expect(within(lunch).getByText("in 2 h from snapshot")).toBeTruthy();
});

// ---- one time-zone format ----

test("the start time comes from starts_at and names its zone: the same formatter gives both", () => {
  expect(startText(new Date("2026-09-27T01:30:00Z"), "Asia/Singapore")).toEqual({ time: "09:30", zone: "GMT+8" });
  expect(startText(new Date("2026-09-27T01:30:00Z"), "America/New_York")).toEqual({ time: "21:30", zone: "EDT" });
  expect(startText(new Date("2026-09-27T16:30:00Z"), "UTC")).toEqual({ time: "16:30", zone: "UTC" });
  expect(startText(new Date("2026-09-26T16:00:00Z"), "Asia/Singapore").time).toBe("00:00");
});

test("every row is in the viewer's zone and the card says the zone once, matching the times", () => {
  const was = env.TZ;
  try {
    env.TZ = "Asia/Singapore";
    const first = draw(agenda([DESIGN, LUNCH, VIEWING]));
    expect(events().map(node => node.querySelector("time")!.textContent)).toEqual(["09:30", "12:00", "13:00"]);
    expect(screen.getAllByText(/Times in/)).toHaveLength(1);
    expect(screen.getByText("Times in GMT+8")).toBeTruthy();
    first.unmount();
    env.TZ = "America/New_York";
    draw(agenda([DESIGN, LUNCH]));
    expect(events().map(node => node.querySelector("time")!.textContent)).toEqual(["21:30", "00:00"]);
    expect(screen.getByText("Times in EDT")).toBeTruthy();
  } finally { if (was === undefined) delete env.TZ; else env.TZ = was; }
});

test("a time element carries the exact instant, and the agent's own clock text is not shown beside it", () => {
  draw(agenda([{ ...DESIGN, trailing: "9:30 pm" }]));
  const time = document.querySelector("time.hkc-sched-start")!;
  expect(time.getAttribute("datetime")).toBe("2026-09-27T01:30Z");
  expect(screen.queryByText("9:30 pm")).toBeNull();
});

test("only a real UTC minute is an instant", () => {
  expect(parseInstant("2026-09-27T01:30Z")?.toISOString()).toBe("2026-09-27T01:30:00.000Z");
  expect(parseInstant("2026-09-27T01:30:15Z")?.toISOString()).toBe("2026-09-27T01:30:15.000Z");
  for (const bad of ["2026-02-30T01:30Z", "2026-09-27T25:30Z", "2026-09-27", "2026-09-27T01:30+08:00", "tomorrow", 5, undefined]) expect(parseInstant(bad)).toBeUndefined();
  // A bad starts_at is a missing start: the row stays, as an event without a time.
  draw(agenda([{ ...DESIGN, starts_at: "2026-02-30T01:30Z" }]));
  expect(document.querySelector("time")).toBeNull();
});

// ---- colour ----

test("colour comes from calendar_color, not from the position in the list", () => {
  const rows = [DESIGN, LUNCH, VIEWING, HOLIDAY];
  const first = draw(agenda(rows), { mode: "full" });
  const forward = Object.fromEntries(rows.map(row => [row.label, colourOf(row.label)]));
  expect(forward).toEqual({ "Design review": "blue", "Lunch with Sam": "purple", "Viewing at The Clift": "orange", "Public holiday": "green" });
  first.unmount();
  draw(agenda([...rows].reverse()), { mode: "full" });
  expect(titles()).toEqual(["Public holiday", "Viewing at The Clift", "Lunch with Sam", "Design review"]);
  for (const row of rows) expect(colourOf(row.label)).toBe(forward[row.label]);
});

test("the same colour on two rows stays the same, and a row with no calendar_color gets none", () => {
  draw(agenda([{ ...DESIGN }, { ...LUNCH, calendar_color: "blue" }, { ...VIEWING, calendar_color: undefined }]));
  expect(events().map(node => node.getAttribute("data-color"))).toEqual(["blue", "blue", null]);
});

test("source order is kept even when the start times run backwards", () => {
  draw(agenda([LUNCH, DESIGN]));
  expect(titles()).toEqual(["Lunch with Sam", "Design review"]);
  expect(within(events()[1]).getByText("Up next")).toBeTruthy(); // marked where it is, never moved
});

test("light and dark tokens exist for every calendar colour", () => {
  for (const colour of ["blue", "green", "orange", "red", "purple", "gray"]) {
    expect(styles).toContain(`data-color="${colour}"`);
    expect(styles).toMatch(new RegExp(`\\.harso-kit \\.hkc-sched \\{[^}]*--hkc-sched-${colour}:`));
    expect(styles).toMatch(new RegExp(`\\.harso-kit\\[data-mode="dark"\\] \\.hkc-sched \\{[^}]*--hkc-sched-${colour}:`));
  }
});

// ---- meeting brief ----

test("meeting brief: where and who stay as text, prep is its own note, a brand mark is the host's", () => {
  const renderBrand = vi.fn(() => <svg data-testid="zoom-mark" />);
  draw(meeting(), { renderBrand });
  const design = events()[0];
  expect(within(design).getByText("Zoom · Mei Lin, Arjun Rao")).toBeTruthy();
  expect(within(design).getByText("read Mei's 3 comments on v2").closest(".hkc-sched-prep")!.textContent).toBe("Prep read Mei's 3 comments on v2");
  expect(renderBrand).toHaveBeenCalledWith({ domain: "zoom.us", label: "Zoom" });
  expect(within(events()[1]).queryByText("Prep")).toBeNull();
  expect(screen.queryByText(/prep:/i)).toBeNull();
});

test("the next event is first only if the document puts it first", () => {
  draw(meeting([LUNCH, DESIGN]));
  expect(titles()).toEqual(["Lunch with Sam", "Design review"]);
});

// ---- the routine control ----

test("Pause asks the host once with the exact routine id, and draws nothing as paused", () => {
  const onRoutineControl = vi.fn();
  draw(routineDoc(), { host: hostOf({ onRoutineControl }) });
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(onRoutineControl).toHaveBeenCalledTimes(1);
  expect(onRoutineControl).toHaveBeenCalledWith("pause", ROUTINE);
});

test("a failed pause stays unconfirmed: the card keeps the emitted state until the host says otherwise", () => {
  const onRoutineControl = vi.fn(); // the host's request failed: it reports no new state
  draw(routineDoc(), { host: hostOf({ onRoutineControl, subjectState: () => undefined }) });
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(screen.getByText("Scheduled")).toBeTruthy();
  expect(screen.queryByText(/Paused|Pausing|Stopped/)).toBeNull();
  expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
});

test("pending shows the host's pending word; confirmed shows the host's confirmed word; neither is invented", () => {
  const subjects: unknown[] = [];
  const pending = draw(routineDoc(), { host: hostOf({ onRoutineControl: vi.fn(), subjectState: subject => { subjects.push(subject); return { word: "Pausing…", meaning: "in_progress" }; } }) });
  expect(screen.getByText("Pausing…")).toBeTruthy();
  expect(screen.queryByText("Scheduled")).toBeNull();
  expect(subjects[0]).toEqual({ routine_id: ROUTINE });
  pending.unmount();
  draw(routineDoc(), { host: hostOf({ onRoutineControl: vi.fn(), subjectState: () => ({ word: "Paused", meaning: "done" }) }) });
  expect(screen.getByText("Paused")).toBeTruthy();
  expect(screen.queryByText(/next on Sun/)).toBeNull(); // the emitted detail described the old state
});

test("the host can offer Resume: the card draws the action the document carries, whatever it says", () => {
  const onRoutineControl = vi.fn();
  draw(routineDoc("reply-watch", {}, { kind: "routine_control", label: "Resume", routine_id: ROUTINE, control: "resume" }), { host: hostOf({ onRoutineControl }) });
  fireEvent.click(screen.getByRole("button", { name: "Resume" }));
  expect(onRoutineControl).toHaveBeenCalledWith("resume", ROUTINE);
});

test("stale scope: a card whose host lost its routine control draws no button, and an old callback is never called", () => {
  const stale = vi.fn(), fresh = vi.fn();
  const document_ = routineDoc();
  const view = render(<Card {...propsOf(document_, { host: hostOf({ onRoutineControl: stale }) })} />);
  expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  view.rerender(<Card {...propsOf(document_, { host: hostOf() })} />); // account or scope changed: the host no longer controls it
  expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  view.rerender(<Card {...propsOf(document_, { host: hostOf({ onRoutineControl: fresh }) })} />);
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(fresh).toHaveBeenCalledWith("pause", ROUTINE);
  expect(stale).not.toHaveBeenCalled();
});

test("a control that names another routine than the card's own status is not drawn", () => {
  const onRoutineControl = vi.fn();
  draw(routineDoc("recurring-reminder", {}, pause(OTHER)), { host: hostOf({ onRoutineControl }) });
  expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  expect(onRoutineControl).not.toHaveBeenCalled();
  expect(screen.getByText("Scheduled")).toBeTruthy(); // the status still reads
});

test("a pause the host cannot make is not drawn; the host's other callbacks never stand in for it", () => {
  draw(routineDoc(), { host: hostOf({ onOpenUrl: vi.fn(), onWorkControl: vi.fn(), onPageWatchControl: vi.fn() }) });
  expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  expect(document.querySelector('[data-slot="trailing"]')).toBeNull();
});

test("no other controls: a link or file action makes the family decline so the generic card draws every block", () => {
  const link = routineDoc("recurring-reminder", {}, { kind: "open_url", label: "Open", url: "https://example.com/" });
  expect(family.renderFamily(propsOf(link, { host: hostOf({ onOpenUrl: vi.fn(), onRoutineControl: vi.fn() }) }))).toBeUndefined();
  const work = routineDoc("recurring-reminder", {}, { kind: "work_control", label: "Cancel", work_unit_id: ROUTINE, control: "cancel" });
  expect(family.renderFamily(propsOf(work))).toBeUndefined();
  const both = doc("meeting-brief", [{ kind: "status", state: "watching", subject: { routine_id: ROUTINE } }, { kind: "rows", items: [DESIGN] },
    { kind: "action", primary: { kind: "open_url", label: "Open", url: "https://example.com/" }, secondary: pause() }] as HarsoOutputDocument["blocks"]);
  expect(family.renderFamily(propsOf(both))).toBeUndefined();
});

test("the only pressable things are the title, the pause, Details and View all; rows and events are not buttons or links", () => {
  draw(meeting([DESIGN, LUNCH, VIEWING, { ...VIEWING, id: "e4", label: "Dinner" }], { details: { sources: [{ label: "Calendar" }] } }), { host: hostOf({ onRoutineControl: vi.fn() }) });
  const names = [...document.querySelectorAll("button, a[href], [role=button], input")].map(node => (node.textContent ?? "").trim());
  expect(names).toEqual(["Tomorrow · Sun 27 Sep", "Pause", "Details", "View all 4"]);
});

test("an agenda has no controls but the title; an event row opens nothing", () => {
  const onOpenUrl = vi.fn();
  draw(agenda([{ ...DESIGN, action: { kind: "open_url", label: "Join", url: "https://zoom.us/j/1" } }, LUNCH]), { host: hostOf({ onOpenUrl, onRoutineControl: vi.fn() }) });
  expect([...document.querySelectorAll("button, a[href], [role=button]")].map(node => node.textContent)).toEqual(["Tomorrow · Sun 27 Sep"]);
});

// ---- reminder and reply watch ----

test("a reminder says its status, then what comes next, from the document's own rows", () => {
  draw(routineDoc());
  expect(screen.getByText("Scheduled")).toBeTruthy();
  expect(screen.getByText(/next on Sun 27 Sep, 8:00 am/)).toBeTruthy();
  expect(screen.getByRole("list", { name: "Next" }).textContent).toBe("ThenWed 30 Sep 8:00AndSun 4 Oct 8:00");
});

test("rows that are not plain timed steps stay ordinary rows, in order", () => {
  const document_ = routineDoc("reply-watch");
  (document_.blocks[1] as { items: HarsoOutputRow[] }).items = [{ label: "Stops after", secondary: "or when Nichol replies", trailing: "Fri 6 PM" }];
  draw(document_);
  expect(screen.queryByRole("list", { name: "Next" })).toBeNull();
  expect(screen.getByText("Stops after")).toBeTruthy();
  expect(screen.getByText("or when Nichol replies")).toBeTruthy();
});

test("a routine card with no routine status, or a tracking status, is not ours to draw", () => {
  const noStatus = routineDoc();
  noStatus.blocks.splice(0, 1);
  expect(family.renderFamily(propsOf(noStatus))).toBeUndefined();
  const tracking = routineDoc();
  tracking.blocks[0] = { kind: "status", state: "tracking", label: "On the way" } as HarsoOutputDocument["blocks"][number];
  expect(family.renderFamily(propsOf(tracking))).toBeUndefined();
});

// ---- widget sizes ----

test("each template supports exactly the widget sizes it is designed for", () => {
  const sizes = (template: V6Template) => family.supportedWidgetSizes(template);
  expect(sizes("meeting-brief")).toEqual(["medium", "large"]);
  expect(sizes("day-agenda")).toEqual(["small", "medium", "large"]);
  expect(sizes("recurring-reminder")).toEqual(["small"]);
  expect(sizes("reply-watch")).toEqual(["small"]);
  expect(sizes("weather-now")).toEqual([]);
});

test("a size the template does not support is declined, and so is a template this family does not draw", () => {
  const unsupported: [HarsoOutputDocument, WidgetSize][] = [[meeting(), "small"], [meeting(), "extraLarge"], [agenda([DESIGN]), "extraLarge"],
    [routineDoc(), "medium"], [routineDoc("reply-watch"), "large"]];
  for (const [document_, widgetSize] of unsupported) expect(family.renderFamily(propsOf(document_, { widgetSize }))).toBeUndefined();
  expect(family.renderFamily(propsOf({ ...agenda([DESIGN]), template: "weather-now" }))).toBeUndefined();
  expect(family.renderFamily(propsOf({ ...agenda([DESIGN]), template: undefined }))).toBeUndefined();
});

test("small agenda widget: the next event only, one open target over the card, no control", () => {
  draw(agenda([HOLIDAY, DESIGN, LUNCH]), { widgetSize: "small", host: hostOf({ onRoutineControl: vi.fn() }) });
  expect(titles()).toEqual(["Design review"]);
  expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(document.querySelector('[data-open-area="card"]')).not.toBeNull();
});

test("medium agenda shows three events; large shows the whole day; a widget has no View all", () => {
  const rows = [DESIGN, LUNCH, VIEWING, { ...VIEWING, id: "e4", label: "Dinner" }];
  const medium = draw(agenda(rows), { widgetSize: "medium" });
  expect(titles()).toEqual(["Design review", "Lunch with Sam", "Viewing at The Clift"]);
  expect(screen.queryByRole("button", { name: /View all/ })).toBeNull();
  medium.unmount();
  draw(agenda(rows), { widgetSize: "large" });
  expect(titles()).toHaveLength(4);
});

test("meeting widget: medium is the next meeting with its prep note and no Pause; reminder widget is small and has no button", () => {
  const medium = draw(meeting(), { widgetSize: "medium", host: hostOf({ onRoutineControl: vi.fn() }) });
  expect(titles()).toEqual(["Design review"]);
  expect(screen.getByText("read Mei's 3 comments on v2")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  medium.unmount();
  draw(routineDoc(), { widgetSize: "small", host: hostOf({ onRoutineControl: vi.fn() }) });
  expect(screen.getByText("Scheduled")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
});

// ---- inline and full ----

test("inline shows three events and a View all for the rest; full shows all and no View all", () => {
  const rows = [DESIGN, LUNCH, VIEWING, { ...VIEWING, id: "e4", label: "Dinner" }];
  const inline = draw(agenda(rows));
  expect(titles()).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "View all 4" }));
  expect((inline.props.host.onViewAll as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  inline.unmount();
  draw(agenda(rows), { mode: "full" });
  expect(titles()).toHaveLength(4);
  expect(screen.queryByRole("button")).toBeNull();
});

test("total_count the agent sent but did not include is counted in View all", () => {
  const document_ = agenda([DESIGN, LUNCH]);
  (document_.blocks[0] as { total_count?: number }).total_count = 5;
  draw(document_);
  expect(screen.getByRole("button", { name: "View all 5" })).toBeTruthy();
});

// ---- fallback ----

test("anything the family cannot draw in full goes to the generic card", () => {
  const ok = agenda([DESIGN]);
  expect(family.renderFamily(propsOf(ok))).toBeDefined();
  const declined = [
    { ...ok, blocks: [] },
    { ...ok, blocks: [{ kind: "rows", items: [] }] },
    { ...ok, blocks: [{ kind: "rows", items: [DESIGN] }, { kind: "rows", items: [LUNCH] }] },
    { ...ok, blocks: [{ kind: "rows", items: [DESIGN] }, { kind: "numbers", items: [{ value: "1", label: "x" }] }] },
    { ...ok, blocks: [{ kind: "rows", items: [DESIGN] }, { kind: "status", state: "watching", subject: { routine_id: ROUTINE } }] }, // an agenda has no status
    { ...ok, blocks: [{ kind: "rows", items: [{ ...DESIGN, label: "" }] }] }
  ] as HarsoOutputDocument[];
  for (const document_ of declined) expect(family.renderFamily(propsOf(document_))).toBeUndefined();
});

test("through the card: a registered family draws, and a declined document draws the generic card with every block", () => {
  const families = { "day-agenda": family };
  const { unmount } = render(<div className="harso-kit"><HarsoOutputCard document={agenda([DESIGN])} onViewAll={vi.fn()} families={families} /></div>);
  expect(document.querySelector(".hkc-sched")).not.toBeNull();
  unmount();
  const odd = { ...agenda([DESIGN]), blocks: [{ kind: "rows", items: [DESIGN] }, { kind: "numbers", items: [{ value: "3", label: "Free hours" }] }] } as HarsoOutputDocument;
  render(<div className="harso-kit"><HarsoOutputCard document={odd} onViewAll={vi.fn()} families={families} /></div>);
  expect(document.querySelector(".hkc-sched")).toBeNull();
  expect(screen.getByText("Free hours")).toBeTruthy();
});

test("the snapshot line is the saved as_of; the card never calls itself live", () => {
  draw(meeting());
  expect(screen.getByText(/^As of /)).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/\blive\b|updated just now/i);
});

// ---- accessibility ----

test("axe finds no violation in the meeting brief with its pause control, or in a small widget", async () => {
  const card = draw(meeting([DESIGN, LUNCH], { details: { sources: [{ label: "Calendar" }] } }), { host: hostOf({ onRoutineControl: vi.fn() }) });
  expect((await axe.run(card.container, { rules: { "color-contrast": { enabled: false } } })).violations.map(v => v.id)).toEqual([]);
  card.unmount();
  const widget = draw(agenda([DESIGN, LUNCH]), { widgetSize: "small" });
  expect((await axe.run(widget.container, { rules: { "color-contrast": { enabled: false } } })).violations.map(v => v.id)).toEqual([]);
});
