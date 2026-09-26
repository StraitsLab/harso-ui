import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRowsBlock } from "../src/chat/output-card";
import type { HarsoOutputBlockState } from "../src/chat/output-card-charts";
import "../src/primitives.css";

// WEV-1851 S1 fixture. Documents are verbatim copies of the output-blocks.v1 draft examples;
// all callbacks are simulated counters (no transport, no send). `doc=more` is synthetic.
const flights: HarsoOutputDocument = {
  "header": {
    "title": "Flights to Tokyo",
    "subtitle": "12 Oct · 1 adult · economy"
  },
  "blocks": [
    {
      "kind": "rows",
      "items": [
        {
          "label": "Singapore Airlines",
          "secondary": "SQ 638 · Dep 08:35 · 7h 05m direct",
          "trailing": "S$612",
          "mark": "pick"
        },
        {
          "label": "ANA",
          "secondary": "NH 842 · Dep 22:30 · 6h 55m direct",
          "trailing": "S$548"
        },
        {
          "label": "ZIPAIR",
          "secondary": "ZG 52 · Dep 23:55 · 7h 10m direct",
          "trailing": "S$326"
        }
      ]
    },
    {
      "kind": "action",
      "primary": {
        "kind": "reply",
        "label": "Choose SQ 638",
        "text": "Choose SQ 638 on 12 Oct (Singapore Airlines, dep 08:35)."
      }
    }
  ],
  "details": {
    "sources": [
      {
        "label": "Fare search, 23 Sep 2026 09:12 SGT (illustrative)"
      }
    ],
    "disclaimers": [
      "Fares change often. Nothing is booked until you confirm with the airline."
    ]
  },
  "fallback_text": "Flights to Tokyo, 12 Oct: Singapore Airlines SQ 638 08:35 S$612 (pick); ANA NH 842 22:30 S$548; ZIPAIR ZG 52 23:55 S$326."
};
const failed: HarsoOutputDocument = {
  "header": {
    "title": "Couldn't check flight prices",
    "subtitle": "12 Oct · 1 adult · economy"
  },
  "blocks": [
    {
      "kind": "status",
      "state": "failed",
      "detail": "the fare site didn't respond"
    },
    {
      "kind": "action",
      "secondary": {
        "kind": "reply",
        "label": "Try again",
        "text": "Try checking the flight prices again."
      }
    }
  ],
  "fallback_text": "Couldn't check flight prices for 12 Oct: the fare site didn't respond."
};
const spending: HarsoOutputDocument = {
  "header": {
    "title": "September spending",
    "subtitle": "1–30 Sep · all accounts"
  },
  "blocks": [
    {
      "kind": "numbers",
      "items": [
        {
          "value": "S$4,280",
          "label": "Spent"
        },
        {
          "value": "S$720",
          "label": "Left"
        },
        {
          "value": "S$5,000",
          "label": "Budget"
        }
      ]
    },
    {
      "kind": "visual",
      "visual": {
        "kind": "chart",
        "chart": "bar",
        "unit": "S$",
        "x_labels": [
          "1–7 Sep",
          "8–14",
          "15–21",
          "22–30"
        ],
        "series": [
          {
            "label": "Spent",
            "values": [
              "980",
              "1040",
              "1460",
              "800"
            ]
          }
        ],
        "highlight_index": 2
      }
    },
    {
      "kind": "rows",
      "items": [
        {
          "label": "Dining",
          "trailing": "S$1,160"
        },
        {
          "label": "Groceries",
          "trailing": "S$840"
        },
        {
          "label": "Transport",
          "trailing": "S$610"
        },
        {
          "label": "Shopping",
          "trailing": "S$590"
        }
      ]
    }
  ],
  "more_label": "View all transactions",
  "details": {
    "sources": [
      {
        "label": "Linked accounts, synced 23 Sep 2026 (illustrative)"
      }
    ],
    "assumptions": [
      "Transfers between your own accounts are excluded."
    ]
  },
  "fallback_text": "September spending: S$4,280 spent of S$5,000; S$720 left. Dining S$1,160, Groceries S$840, Transport S$610, Shopping S$590."
};
// Synthetic (not an S0 example): seven supplied flights against the inline cap of three.
const more: HarsoOutputDocument = {
  ...flights,
  blocks: [{ kind: "rows", items: [
    ...(flights.blocks[0] as HarsoOutputRowsBlock).items,
    { label: "Scoot", secondary: "TR 808 · Dep 01:15 · 7h 25m direct", trailing: "S$298" },
    { label: "Japan Airlines", secondary: "JL 36 · Dep 06:10 · 7h 00m direct", trailing: "S$655" },
    { label: "Delta", secondary: "DL 280 · Dep 10:05 · 7h 15m direct", trailing: "S$590" },
    { label: "United", secondary: "UA 804 · Dep 11:40 · 7h 20m direct", trailing: "S$604" }
  ] }]
};
// Synthetic: the Spending example without its chart and rows (charts render in a later packet), so the key numbers show.
// Three numbers against the 2-up cap: Spent and Left inline, Budget behind View all transactions.
const numbers: HarsoOutputDocument = { ...spending, blocks: [spending.blocks[0]] };
// Verbatim copy of the S0 example 05-research-brief.
const brief: HarsoOutputDocument = {
  "header": {
    "title": "Singapore EV charging in 2026",
    "subtitle": "Research brief · September 2026"
  },
  "blocks": [
    {
      "kind": "text",
      "summary": "Public chargers passed 15,000, mostly in HDB car parks. Fast chargers are rare; charging at home costs about half.",
      "sections": [
        {
          "heading": "Where things stand",
          "paragraphs": [
            "Public chargers passed 15,000 points this year, most of them in HDB car parks. Coverage is now broad, but fast chargers remain scarce outside the big malls, so most drivers still top up slowly overnight."
          ]
        },
        {
          "heading": "What it means for you",
          "paragraphs": [
            "Expect around S$0.60–0.75 per kWh at public points, versus about S$0.35 at home. If you live in an HDB flat without a nearby charger, check the car park's rollout date before you buy."
          ]
        },
        {
          "heading": "Before you buy",
          "bullets": [
            "Check your car park's charger rollout date.",
            "Compare home and public per-kWh prices.",
            "Plan for slow overnight charging, not fast top-ups."
          ]
        }
      ]
    },
    {
      "kind": "action",
      "secondary": {
        "kind": "open_artifact",
        "label": "Open as document",
        "artifact": "artifact:018f22e2-7c00-7a13-8a13-0000000000b2"
      }
    }
  ],
  "more_label": "Read brief",
  "details": {
    "sources": [
      {
        "label": "LTA EV charging statistics (placeholder)",
        "url": "https://www.lta.gov.sg/"
      },
      {
        "label": "SP Group tariff page (placeholder)",
        "url": "https://www.spgroup.com.sg/"
      }
    ],
    "disclaimers": [
      "Figures are illustrative in this design test and are not verified."
    ]
  },
  "fallback_text": "Singapore EV charging in 2026: 15,000+ public chargers, mostly HDB car parks; fast chargers rare; home charging about half the price."
};
// Synthetic: one long paragraph, no summary, so the card clamps it and offers View all.
const text: HarsoOutputDocument = {
  header: { title: "Is an EV worth it now?", subtitle: "Singapore · September 2026" },
  blocks: [{ kind: "text", sections: [{ paragraphs: [
    "Mostly yes, if you can charge at home or in your car park. Home charging costs about half as much as public points, and most HDB car parks now have slow chargers. Fast chargers are still rare outside the big malls, so plan for overnight top-ups rather than quick stops."
  ] }] }],
  fallback_text: "Mostly yes, if you can charge at home or in your car park; home charging costs about half as much as public points."
};
// Synthetic: wide-script prose under the 180-character budget that still runs past four lines, so the line clamp holds it.
const cjk: HarsoOutputDocument = {
  header: { title: "电动车值得买吗？" },
  blocks: [{ kind: "text", sections: [{ paragraphs: ["公共充电设施持续增加家庭充电费用较低。".repeat(8)] }] }],
  fallback_text: "公共充电设施持续增加，家庭充电费用较低。"
};
// Synthetic: one short complete sentence; nothing is clipped, so no View all.
const short: HarsoOutputDocument = {
  header: { title: "Is an EV worth it now?" },
  blocks: [{ kind: "text", sections: [{ paragraphs: ["Mostly yes, if you can charge at home."] }] }],
  fallback_text: "Mostly yes, if you can charge at home."
};
// Packet 5b: chart, share and table documents. The B0 master data (Sketch `v4/macOS/*/{bar,line,share,table}/*`,
// B0-blocks/.lane/data.js) as contract blocks, so the fidelity crops compare like with like; plus verbatim playbook blocks.
const b0Bar: HarsoOutputDocument = {
  header: { title: "September spending", subtitle: "1–30 Sep · all accounts" },
  blocks: [{ kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$", x_labels: ["1–7", "8–14", "15–21", "22–30"],
    series: [{ label: "Spent per week in September", values: ["1020", "880", "1570", "810"] }], highlight_index: 2 } }],
  fallback_text: "Spent per week in September: 1–7 S$1,020, 8–14 S$880, 15–21 S$1,570 (highest), 22–30 S$810."
};
const b0Line: HarsoOutputDocument = {
  header: { title: "September sales", subtitle: "1–14 Sep · as of 10:30" },
  blocks: [{ kind: "visual", visual: { kind: "chart", chart: "line", unit: "S$",
    x_labels: Array.from({ length: 14 }, (_, index) => `${index + 1} Sep`),
    series: [{ label: "Daily revenue", values: ["1800", "2100", "1600", "2400", "2600", "1900", "0", "1700", "2200", "2500", "1800", "2300", "2800", "1300"] }], highlight_index: 6 } }],
  fallback_text: "Daily revenue 1–14 Sep; no sales on 7 Sep."
};
const b0Share: HarsoOutputDocument = {
  header: { title: "Spent by category", subtitle: "1–30 Sep · S$4,280" },
  blocks: [{ kind: "rows", items: [
    { label: "Dining", secondary: "27%", trailing: "S$1,160" }, { label: "Other", secondary: "25%", trailing: "S$1,080" },
    { label: "Groceries", secondary: "20%", trailing: "S$840" }, { label: "Transport", secondary: "14%", trailing: "S$610" },
    { label: "Shopping", secondary: "14%", trailing: "S$590" }] }],
  fallback_text: "Spent by category: Dining S$1,160 (27%), Other S$1,080 (25%), Groceries S$840 (20%), Transport S$610 (14%), Shopping S$590 (14%); total S$4,280."
};
const b0Table: HarsoOutputDocument = {
  header: { title: "Supplier invoices", subtitle: "Due this month" },
  blocks: [{ kind: "table", columns: [{ label: "Supplier" }, { label: "Due" }, { label: "Amount", align: "end" }], rows: [
    { cells: ["Pacific Freight", "22 Sep", "S$12,480.00"] }, { cells: ["Keppel Packaging", "27 Sep", "S$3,960.00"] },
    { cells: ["Lim Brothers", "29 Sep", "S$2,145.50"] }, { cells: ["Tan & Co", "30 Sep", "S$880.00"] }, { cells: ["Total · 4", "", "S$19,465.50"] }] }],
  fallback_text: "Supplier invoices due: Pacific Freight S$12,480.00 (22 Sep), Keppel Packaging S$3,960.00 (27 Sep), Lim Brothers S$2,145.50 (29 Sep), Tan & Co S$880.00 (30 Sep); total S$19,465.50."
};
// Verbatim playbook example money-spending-month (numbers → bar → share rows, page with View all categories).
const month: HarsoOutputDocument = {
  header: { title: "August spending", subtitle: "1–31 Aug · all accounts" },
  blocks: [
    { kind: "numbers", items: [{ value: "S$720", label: "Left of S$5,000" }, { value: "S$4,280", label: "Spent" }] },
    { kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$", x_labels: ["1–7 Aug", "8–14 Aug", "15–21 Aug", "22–31 Aug"], series: [{ label: "Spent", values: ["980", "1040", "1460", "800"] }], highlight_index: 2 } },
    b0Share.blocks[0]
  ],
  more_label: "View all categories",
  details: { sources: [{ label: "Linked accounts, synced 1 Sep 2026" }], assumptions: ["Transfers between your own accounts are excluded."] },
  fallback_text: "August: S$4,280 spent of S$5,000, S$720 left. Highest week 15–21 Aug (S$1,460)."
};
// Verbatim playbook example sports-standings table block (total_count 20 → View all), and a wide synthetic table that scrolls.
const standings: HarsoOutputDocument = {
  header: { title: "Premier League table", subtitle: "After matchweek 6 · as of 22:10" },
  blocks: [{ kind: "table", total_count: 20, columns: [{ label: "Pos" }, { label: "Team" }, { label: "Played", align: "end" }, { label: "Pts", align: "end" }],
    rows: [{ cells: ["1", "Liverpool", "6", "16"] }, { cells: ["2", "Arsenal", "6", "14"] }, { cells: ["3", "Man City", "6", "13"] }] }],
  fallback_text: "Premier League after matchweek 6: Liverpool 16, Arsenal 14, Man City 13."
};
const wide: HarsoOutputDocument = {
  header: { title: "Plans compared" },
  blocks: [{ kind: "table", columns: [{ label: "Plan" }, { label: "Monthly premium", align: "end" }, { label: "Hospital ward", align: "end" }, { label: "Annual deductible", align: "end" }, { label: "Co-insurance", align: "end" }, { label: "Panel", align: "end" }],
    rows: [{ cells: ["Prudential PRUShield Premier", "S$1,240.00", "Private", "S$3,500.00", "10%", "Yes"] }, { cells: ["Great Eastern Supreme", "S$1,180.00", "Private", "S$3,500.00", "10%", "Yes"] }] }],
  fallback_text: "Two plans compared."
};
// Synthetic hostile content: CJK without spaces, a 300-character word, emoji, RTL, negatives, large and zero values.
const hostileWord = "Supercalifragilistic".repeat(15);
const hostile: HarsoOutputDocument = {
  header: { title: "长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长", subtitle: "مرحبا بالعالم · 🙂" },
  blocks: [
    { kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$", x_labels: ["一月一月一月一月一月一月", hostileWord.slice(0, 16), "🙂🙂🙂", "مرحبا"],
      series: [{ label: hostileWord, values: ["-1200", "0", "987654321", "-0.5"] }], highlight_index: 0 } },
    { kind: "rows", items: [{ label: hostileWord, secondary: "70%", trailing: "S$987,654,321" }, { label: "مرحبا بالعالم", secondary: "30%", trailing: "(S$1,200)" }] },
    { kind: "table", columns: [{ label: hostileWord }, { label: "Δ", align: "end" }], rows: [{ cells: ["长长长长长长长长长长长长长长长长长长长长", "−S$1,200"] }, { cells: ["Total", "0"] }] }
  ],
  fallback_text: "Hostile content probe."
};
const documents: Record<string, HarsoOutputDocument> = { hostile, flights, failed, spending, more, numbers, brief, text, cjk, short, bar: b0Bar, line: b0Line, share: b0Share, table: b0Table, month, standings, wide };
// Per-block state for B0 state crops: ?state=partial etc. The B0 master copy for each kind (data.js).
const STATE_COPY: Record<string, Record<string, Omit<HarsoOutputBlockState, "state">>> = {
  bar: { empty: { message: "No spending recorded this month" }, partial: { message: "3 of 4 weeks · 22–30 Sep still syncing" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load the chart", reason: "The bank feed didn’t respond. Nothing was changed." } },
  line: { empty: { message: "No sales in this period" }, partial: { message: "12 of 14 days reported · 13–14 Sep still coming in" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load daily revenue", reason: "The shop didn’t respond. Nothing was changed." } },
  share: { empty: { message: "No spending to break down" }, partial: { message: "3 of 4 accounts categorised" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load categories", reason: "The source didn’t respond. Nothing was changed." } },
  table: { empty: { message: "No rows to show" }, partial: { message: "4 of 10 rows loaded" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load the table", reason: "The source didn’t respond. Nothing was changed." } }
};
// Partial data as B0 draws it: the missing week/days are null.
const PARTIAL: Record<string, HarsoOutputDocument> = {
  bar: { ...b0Bar, blocks: [{ kind: "visual", visual: { ...(b0Bar.blocks[0] as { visual: object }).visual, series: [{ label: "Spent per week in September", values: ["1020", "880", "1570", null] }] } }] },
  line: { ...b0Line, blocks: [{ kind: "visual", visual: { ...(b0Line.blocks[0] as { visual: object }).visual, series: [{ label: "Daily revenue", values: ["1800", "2100", "1600", "2400", "2600", "1900", "0", "1700", "2200", "2500", "1800", "2300", null, null] }] } }] }
};

const query = new URLSearchParams(location.search);

function Fixture() {
  const [appearance] = useState<"light" | "dark">(query.get("mode") === "dark" ? "dark" : "light");
  const palette = query.get("palette") === "cozy" ? "cozy" : "clean";
  const doc = query.get("doc") ?? "flights";
  const blockState = query.get("state") as HarsoOutputBlockState["state"] | null;
  // Tests may draw any document through `window.renderOutput` (hostile values and widths without a fixture per case).
  const [posted, setPosted] = useState<HarsoOutputDocument>();
  useEffect(() => { (window as unknown as { renderOutput: typeof setPosted }).renderOutput = setPosted; }, []);
  const document = posted ?? ((blockState === "partial" && PARTIAL[doc]) || (documents[doc] ?? flights));
  const [viewAllOpened, setViewAllOpened] = useState(0);
  const [retried, setRetried] = useState(0);
  const blockStates = blockState && blockState !== "ready"
    ? { 0: { state: blockState, ...STATE_COPY[doc]?.[blockState], onRetry: blockState === "failed" ? () => setRetried(value => value + 1) : undefined } } : undefined;
  const [detailsOpened, setDetailsOpened] = useState(0);
  return <KitProvider appearance={appearance} palette={palette} className="output-card-fixture" style={query.has("width") ? { maxWidth: `${Number(query.get("width"))}px` } : undefined}>
    <main>
      <div className="output-card-transcript" data-testid="transcript">
        <p className="output-card-user">Flights to Tokyo on 12 Oct?</p>
        <p>Three direct options. SQ 638 has the best times for your morning start.</p>
        <HarsoOutputCard document={document} onViewAll={() => setViewAllOpened(value => value + 1)}
          onOpenDetails={query.has("hostDetails") ? () => setDetailsOpened(value => value + 1) : undefined} blockStates={blockStates} />
      </div>
      <output aria-label="Fixture callbacks">{JSON.stringify({ viewAllOpened, detailsOpened, retried })}</output>
    </main>
  </KitProvider>;
}

createRoot(window.document.getElementById("root")!).render(<Fixture />);
