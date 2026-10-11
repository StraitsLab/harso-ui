import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import type { HarsoOutputDocument } from "../src/chat/output-card";
import { family } from "../src/chat/v6/schedule";
import type { V6Template, WidgetSize } from "../src/chat/v6/types";
import "../src/primitives.css";

// P7 (WEV-3323) fixture: clearly labelled sample data, the same JSON the answer templates carry. ?mode=dark for dark.
const ROUTINE = "0192a3b4-5c6d-7e8f-9a0b-0000004ae001";
const AS_OF = "2026-09-26T23:30Z";
const events = [
  { id: "e1", label: "Design review", secondary: "Zoom · Mei Lin, Arjun Rao · prep: read Mei's 3 comments on v2", trailing: "09:30", starts_at: "2026-09-27T01:30Z", calendar_color: "blue", brand: "zoom.us" },
  { id: "e2", label: "Lunch with Sam", secondary: "Tiong Bahru Bakery · Sam Lee · prep: bring the Tokyo restaurant list", trailing: "12:00", starts_at: "2026-09-27T04:00Z", calendar_color: "purple" },
  { id: "e3", label: "Viewing at The Clift", secondary: "21 McCallum St", trailing: "13:00", starts_at: "2026-09-27T05:00Z", calendar_color: "orange" }
];
const pause = { kind: "routine_control", label: "Pause", routine_id: ROUTINE, control: "pause" };
const base = (template: V6Template, title: string, blocks: unknown[]): HarsoOutputDocument => ({ kind: "output_blocks", major: 1, template, header: { title, subtitle: "Sample data" }, blocks, as_of: AS_OF, fallback_text: "Sample." } as HarsoOutputDocument);
const agenda = base("day-agenda", "Tomorrow · Sun 27 Sep", [{ kind: "rows", items: [{ id: "e0", label: "Public holiday", trailing: "All day", calendar_color: "green" }, ...events.map(event => ({ ...event, secondary: event.secondary.replace(/ · prep: .*/, "") }))] }]);
const meeting = base("meeting-brief", "Tomorrow · Sun 27 Sep", [{ kind: "status", state: "watching", detail: "every evening at 20:00", subject: { routine_id: ROUTINE } }, { kind: "rows", items: events.slice(0, 2) }, { kind: "action", secondary: pause }]);
const reminder = base("recurring-reminder", "Water the plants", [{ kind: "status", state: "scheduled", detail: "next on Sun 27 Sep, 8:00 am", subject: { routine_id: ROUTINE } }, { kind: "rows", items: [{ label: "Then", trailing: "Wed 30 Sep 8:00" }, { label: "And", trailing: "Sun 4 Oct 8:00" }] }, { kind: "action", secondary: pause }]);
const watch = base("reply-watch", "Reply from Nichol", [{ kind: "status", state: "watching", detail: "since 9:40 AM", subject: { routine_id: ROUTINE } }, { kind: "rows", items: [{ label: "Stops after", trailing: "Fri 6 PM" }] }, { kind: "action", secondary: pause }]);

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const host = { onViewAll: () => {}, onRoutineControl: () => {}, subjectState: params.get("state") === "pending" ? () => ({ word: "Pausing…", meaning: "in_progress" as const }) : undefined };
const draw = (document: HarsoOutputDocument, widgetSize?: WidgetSize) => family.renderFamily({ document, mode: "inline", widgetSize, host, media: {}, renderBrand: () => undefined });
const slot = (label: string, document: HarsoOutputDocument, widgetSize?: WidgetSize) =>
  <div className={`slot ${widgetSize === "small" ? "tile" : widgetSize ? "wide" : ""}`} key={label} data-testid={label}><small>{label}</small>{draw(document, widgetSize)}</div>;

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="schedule-fixture"><main>
    {slot("agenda card", agenda)}{slot("meeting card", meeting)}{slot("reminder card", reminder)}{slot("reply-watch card", watch)}
    {slot("agenda small", agenda, "small")}{slot("agenda medium", agenda, "medium")}{slot("meeting medium", meeting, "medium")}
    {slot("reminder small", reminder, "small")}{slot("reply-watch small", watch, "small")}
  </main></KitProvider>
);
