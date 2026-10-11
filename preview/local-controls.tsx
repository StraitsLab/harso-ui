import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import type { HarsoOutputTableBlock } from "../src/chat/output-card-charts";
import type { HarsoOutputTextSection } from "../src/chat/output-card";
import { LocalTable } from "../src/chat/v6/local-table";
import { SectionTabs } from "../src/chat/v6/section-tabs";
import "../src/primitives.css";

// P9 (WEV-3306) fixture: a bills table with a status word and explicit totals, and a three-day trip. No transport, no host.
const bills: HarsoOutputTableBlock = {
  kind: "table",
  columns: [{ label: "Bill" }, { label: "Due", align: "end" }, { label: "Amount", align: "end" }],
  rows: [
    { cells: ["Rent", "1 Nov", "2400.00"], status: "overdue" },
    { cells: ["Power", "14 Oct", "96.50"] },
    { cells: ["Water", "9 Oct", "31.20"], status: "paid" },
    { cells: ["Internet", "20 Oct", "49.00"] },
  ],
  totals: { cells: ["Total", "4 bills", "2576.70"] },
};
// A wider table for the 316px card (the real phone card width): too wide for its box, so it is drawn as items.
const wideBills: HarsoOutputTableBlock = {
  kind: "table",
  columns: [{ label: "Bill" }, { label: "Due", align: "end" }, { label: "Paid from" }, { label: "Reference" }, { label: "Amount", align: "end" }],
  rows: bills.rows.map((row, index) => ({ ...row, cells: [row.cells[0], row.cells[1], ["DBS Multiplier", "OCBC 360", "DBS Multiplier", "Cash"][index], `REF-${4821 + index}`, row.cells[2]] })),
  totals: { cells: ["Total", "4 bills", "—", "—", "2576.70"] },
};
const trip: HarsoOutputTextSection[] = [
  { heading: "Day 1 · Higashiyama", bullets: ["09:00 Kiyomizu-dera", "12:30 Lunch in Gion", "15:00 Yasaka Shrine"] },
  { heading: "Day 2 · Arashiyama", bullets: ["08:30 Bamboo grove", "11:00 Tenryu-ji", "14:00 Togetsukyo bridge"] },
  { heading: "Day 3 · Fushimi", paragraphs: ["Walk the lower gates before the crowds, then go up to the Yotsutsuji viewpoint."] },
];

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const sort = params.get("sort");
const [column, direction] = sort ? sort.split(":") : [];
const initialOrder = sort ? { column: Number(column), direction: direction as "ascending" | "descending" } : undefined;

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="local-controls-fixture">
    <main>
      <div className="card" data-testid="wide"><h2>Bills</h2><LocalTable table={bills} label="Bills" initialOrder={initialOrder} /></div>
      <div className="card narrow" data-testid="narrow"><h2>Bills, narrow</h2><LocalTable table={wideBills} label="Bills narrow" initialOrder={initialOrder} /></div>
      <div className="card" data-testid="tabs"><h2>Kyoto, 3 days</h2>
        <SectionTabs sections={trip} initialIndex={Number(params.get("tab") ?? 0)} renderSection={section => <>
          {section.bullets && <ul style={{ margin: 0, paddingInlineStart: 18 }}>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}
          {section.paragraphs?.map(text => <p key={text} style={{ margin: 0 }}>{text}</p>)}
        </>} />
      </div>
    </main>
  </KitProvider>
);
