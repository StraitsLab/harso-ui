import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRowsBlock } from "../src/chat/output-card";
import type { HarsoOutputBlockState } from "../src/chat/output-card-charts";
import type { HarsoOutputMediaHost } from "../src/chat/output-card-media";
import clipUrl from "./output-card-clip.mp4";
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
  blocks: [{ kind: "visual", visual: { kind: "chart", chart: "bar", unit: "S$", x_labels: ["1–7 Sep", "8–14 Sep", "15–21 Sep", "22–30 Sep"],
    series: [{ label: "Spent per week in September", values: ["1020", "880", "1570", "810"] }], highlight_index: 2 } }],
  fallback_text: "Spent per week in September: 1–7 Sep S$1,020, 8–14 Sep S$880, 15–21 Sep S$1,570 (highest), 22–30 Sep S$810."
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
// Packet 5c: status, progress, image, video and map. B0 master data (B0-blocks/.lane/data.js) sent the way the playbook
// tells the agent to send it (status + timed rows G16; the budget pair G9), plus verbatim playbook blocks.
const b0Status: HarsoOutputDocument = {
  header: { title: "SQ 638 to Tokyo", subtitle: "12 Oct · Changi T3" },
  blocks: [{ kind: "status", state: "working", detail: "Boarding · gate C19", subject: { work_unit_id: "0192a3b4-5c6d-7e8f-9a0b-000000000c01" } },
    { kind: "rows", items: [{ label: "Doors close", trailing: "08:20" }, { label: "Departs", trailing: "08:35" }] }],
  fallback_text: "SQ 638 is boarding at gate C19. Doors close 08:20, departs 08:35."
};
const watchReply: HarsoOutputDocument = {
  header: { title: "Reply from Nichol", subtitle: "WhatsApp" },
  blocks: [{ kind: "status", state: "watching", detail: "since 9:40 AM", subject: { routine_id: "0192a3b4-5c6d-7e8f-9a0b-000000000961" } },
    { kind: "rows", items: [{ label: "Stops after", trailing: "Fri 6 PM" }] },
    { kind: "action", primary: { kind: "routine_control", label: "Pause", routine_id: "0192a3b4-5c6d-7e8f-9a0b-000000000961", control: "pause" } }],
  fallback_text: "Watching for Nichol's reply on WhatsApp since 9:40 AM; stops after Fri 6 PM."
};
const meanings: HarsoOutputDocument = {
  header: { title: "Four meanings" },
  blocks: [{ kind: "status", state: "ready", detail: "14 files moved" }, { kind: "status", state: "working", detail: "112 of about 400 checked" },
    { kind: "status", state: "needs_you", detail: "sign in to Gmail" }, { kind: "status", state: "failed", detail: "The fare site didn't respond. Nothing was booked." }],
  fallback_text: "Done, working, needs you, couldn't finish."
};
const emptySearch: HarsoOutputDocument = {
  header: { title: "No 3-room HDB in Bishan under S$500k", subtitle: "As of 10:50 · PropertyGuru and 99.co" },
  blocks: [{ kind: "status", state: "empty", detail: "Cheapest listed now is S$588k" }],
  fallback_text: "No 3-room HDB in Bishan under S$500k. Cheapest listed now is S$588k."
};
const b0Progress: HarsoOutputDocument = {
  header: { title: "September budget", subtitle: "1–30 Sep · 4 days to go" },
  blocks: [{ kind: "numbers", items: [{ value: "S$4,280", label: "Spent of budget" }, { value: "S$720", label: "Left of S$5,000" }] }],
  fallback_text: "September: S$4,280 spent of S$5,000, S$720 left for 4 days."
};
const overBudget: HarsoOutputDocument = {
  header: { title: "September dining", subtitle: "1–30 Sep" },
  blocks: [{ kind: "numbers", items: [{ value: "S$1,510", label: "Spent" }, { value: "−S$310", label: "Left of S$1,200" }] }],
  fallback_text: "Dining: S$1,510 spent of S$1,200, over by S$310."
};
const b0Image: HarsoOutputDocument = {
  header: { title: "Crumb & Co logo", subtitle: "Direction 1 · wheat ear and ampersand" },
  blocks: [{ kind: "visual", visual: { kind: "image", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a31", alt: "Crumb & Co logo: a wheat ear forming an ampersand, warm brown on cream", aspect: "square" } },
    { kind: "action", primary: { kind: "download_artifact", label: "Download", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a31" } }],
  fallback_text: "Crumb & Co logo, direction 1: a wheat ear forming an ampersand."
};
const deck: HarsoOutputDocument = {
  header: { title: "EVs in Singapore, 2026", subtitle: "6 slides · PPTX and PDF" },
  blocks: [{ kind: "visual", visual: { kind: "image", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a2d", alt: "Title slide: EVs in Singapore, 2026, with a charger photo", aspect: "16:9" } }],
  fallback_text: "EVs in Singapore, 2026: 6 slides."
};
const video: HarsoOutputDocument = {
  header: { title: "Kitchen walkthrough", subtitle: "Renovation · 26 Sep" },
  blocks: [{ kind: "visual", visual: { kind: "video", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01", alt: "Walkthrough of the new kitchen", poster: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b02" } }],
  fallback_text: "Kitchen walkthrough video, 26 Sep."
};
const b0Map: HarsoOutputDocument = {
  header: { title: "Where to stay in Tokyo", subtitle: "6 nights in Oct · S$2,000 budget · as of 09:20" },
  blocks: [{ kind: "visual", visual: { kind: "map", places: [{ id: "ueno", label: "Ueno", lat: "35.7141", lon: "139.7774" }, { id: "asakusa", label: "Asakusa", lat: "35.7148", lon: "139.7967" }, { id: "shinjuku", label: "Shinjuku", lat: "35.6938", lon: "139.7034" }], selected_place_id: "ueno" } }],
  fallback_text: "Where to stay in Tokyo: Ueno (pick), Asakusa, Shinjuku."
};
const tampines: HarsoOutputDocument = {
  header: { title: "3-room HDB in Tampines", subtitle: "Under S$600k · as of 09:30" },
  blocks: [{ kind: "visual", visual: { kind: "map", selected_place_id: "p0", places: Array.from({ length: 12 }, (_, index) => ({ id: `p${index}`, label: `Blk ${800 + index * 7} Tampines St ${81 + index % 5}`, lat: (1.345 + (index * 37 % 17) / 1000).toFixed(4), lon: (103.93 + (index * 53 % 23) / 1000).toFixed(4) })) } }],
  fallback_text: "Twelve 3-room flats in Tampines."
};
// Synthetic hostile content for the new blocks: a 300-character word, CJK without spaces, RTL, emoji, huge figures.
const hostileMedia: HarsoOutputDocument = {
  header: { title: "长长长长长长长长长长长长长长长长长长长长", subtitle: "مرحبا بالعالم · 🙂" },
  blocks: [
    { kind: "status", state: "watching", detail: hostileWord.slice(0, 80) },
    // Schema maxima: label line48, trailing line24 (Latin with no break, CJK, RTL).
    { kind: "rows", items: [{ label: "长长长长长长长长长长长长长长长长长长长长长长长长", trailing: "星期五 18:00" }, { label: "مرحبا بالعالم", trailing: "🙂🙂🙂" },
      { label: "W".repeat(48), trailing: "W".repeat(24) }, { label: "Stops after", trailing: "星".repeat(24) }, { label: "Ends", trailing: "مرحبا بالعالم مرحبا بال" }] },
    { kind: "numbers", items: [{ value: "S$987,654,321", label: `${hostileWord.slice(0, 40)} of S$1,000,000,000` }, { value: "S$12,345,679", label: "Left" }] },
    { kind: "visual", visual: { kind: "map", selected_place_id: "a", places: [{ id: "a", label: hostileWord.slice(0, 40), lat: "1.3000", lon: "103.8000" }, { id: "b", label: "长长长长长长长长长长长长", lat: "1.3010", lon: "103.8012" }, { id: "c", label: "مرحبا بالعالم 🙂", lat: "1.2990", lon: "103.7990" }] } }
  ],
  fallback_text: "Hostile media probe."
};
// Synthetic maps at the edges of the world: two continents, the dateline, a pick with a 40-character label beside
// another pin, and two places no single still map can hold at a narrow pane.
const mapOf = (title: string, places: { id: string; label: string; lat: string; lon: string }[], selected = places[0].id): HarsoOutputDocument =>
  ({ header: { title }, blocks: [{ kind: "visual", visual: { kind: "map", places, selected_place_id: selected } }], fallback_text: title });
const worldMaps: Record<string, HarsoOutputDocument> = {
  world: mapOf("New York and Singapore", [{ id: "ny", label: "New York", lat: "40.7128", lon: "-74.0060" }, { id: "sg", label: "Singapore", lat: "1.3521", lon: "103.8198" }]),
  continents: mapOf("London, Sydney, Los Angeles", [{ id: "lon", label: "London", lat: "51.5072", lon: "-0.1276" }, { id: "syd", label: "Sydney", lat: "-33.8688", lon: "151.2093" }, { id: "la", label: "Los Angeles", lat: "34.0522", lon: "-118.2437" }], "syd"),
  dateline: mapOf("Either side of the dateline", [{ id: "east", label: "Taveuni", lat: "-16.8", lon: "179.9" }, { id: "west", label: "Vanua Balavu", lat: "-17.2", lon: "-179.9" }, { id: "apia", label: "Apia", lat: "-13.83", lon: "-171.76" }]),
  longpick: mapOf("A long name beside a neighbour", [{ id: "a", label: "W".repeat(40), lat: "1.3000", lon: "103.8000" }, { id: "b", label: "Other", lat: "1.3000", lon: "103.8200" }]),
  poles: mapOf("Svalbard and the Ross Sea", [{ id: "n", label: "Longyearbyen", lat: "78.2232", lon: "15.6267" }, { id: "s", label: "McMurdo", lat: "-77.8419", lon: "166.6863" }])
};
// Packet 5d: actions and linked sources. Verbatim catalogue examples (file-invoice-pdf, places-directions,
// prod-work-running, money-portfolio + a linked source from news-brief), and synthetic schema-maximum labels (line28).
const invoice: HarsoOutputDocument = { kind: "output_blocks", major: 1, header: { title: "INV-2042 · Acme Pte Ltd", subtitle: "Due 26 Oct · PDF" },
  blocks: [{ kind: "numbers", items: [{ value: "S$3,270.00", label: "Amount due" }, { value: "26 Oct", label: "Due" }] },
    { kind: "action", primary: { kind: "open_artifact", label: "Open invoice", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29" },
      secondary: { kind: "download_artifact", label: "Download PDF", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29" } }],
  fallback_text: "Invoice INV-2042 to Acme Pte Ltd for 20 hours of design at S$150, S$3,270.00 including 9% GST, due 26 Oct. Saved to your Library." };
const directions: HarsoOutputDocument = { kind: "output_blocks", major: 1, header: { title: "42 min to Jewel by MRT", subtitle: "From Tanjong Pagar · one change" },
  blocks: [{ kind: "rows", items: [{ label: "East–West line to Tanah Merah", secondary: "10 stops", trailing: "24 min" }, { label: "Change to Changi Airport line", secondary: "2 stops", trailing: "9 min" }, { label: "Walk to Jewel", secondary: "From Changi Airport MRT", trailing: "5 min" }] },
    { kind: "action", primary: { kind: "open_url", label: "Directions in Maps", url: "https://maps.apple.com/?daddr=Jewel+Changi+Airport&dirflg=r" } }],
  details: { sources: [{ label: "SMRT journey planner, 26 Sep 2026" }, { label: "LTA statement", url: "https://www.lta.gov.sg/content/ltagov/en/newsroom.html" }] },
  fallback_text: "Tanjong Pagar to Jewel by MRT: about 42 min. East–West line to Tanah Merah, change to the Changi Airport line, 5 min walk." };
const workRunning: HarsoOutputDocument = { kind: "output_blocks", major: 1, header: { title: "Filing receipts from Gmail", subtitle: "About 400 emails" },
  blocks: [{ kind: "status", state: "working", detail: "112 of about 400 checked", subject: { work_unit_id: "0192a3b4-5c6d-7e8f-9a0b-000000000962" } },
    { kind: "action", secondary: { kind: "work_control", label: "Stop", work_unit_id: "0192a3b4-5c6d-7e8f-9a0b-000000000962", control: "cancel" } }],
  fallback_text: "Filing receipts from Gmail: 112 of about 400 emails checked so far." };
const longActions: HarsoOutputDocument = { header: { title: "Longest labels" },
  blocks: [{ kind: "text", sections: [{ paragraphs: ["Two actions at the schema's 28-character maximum."] }] },
    { kind: "action", primary: { kind: "open_url", label: "W".repeat(28), url: "https://example.com/a" },
      secondary: { kind: "download_artifact", label: "长".repeat(28), artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29" } }],
  fallback_text: "Longest labels." };
const rtlActions: HarsoOutputDocument = { header: { title: "مرحبا بالعالم" },
  blocks: [{ kind: "text", sections: [{ paragraphs: ["مرحبا بالعالم"] }] },
    { kind: "action", primary: { kind: "open_url", label: "افتح في الخرائط", url: "https://example.com/b" }, secondary: { kind: "reply", label: "Choose", text: "Choose" } }],
  fallback_text: "RTL labels." };
// Synthetic: a block kind the card does not draw, so the whole card falls back to its text.
const unknown: HarsoOutputDocument = { ...failed, blocks: [{ kind: "hologram", payload: { raw: true } }] };
const documents: Record<string, HarsoOutputDocument> = { hostilemedia: hostileMedia, unknown, hostile, flights, failed, spending, more, numbers, brief, text, cjk, short, bar: b0Bar, line: b0Line, share: b0Share, table: b0Table, month, standings, wide,
  ...worldMaps, invoice, directions, work: workRunning, longactions: longActions, rtlactions: rtlActions, status: b0Status, watch: watchReply, meanings, empty: emptySearch, progress: b0Progress, over: overBudget, image: b0Image, deck, video, map: b0Map, tampines };

/* Fixture media host: artifacts are local drawings, map tiles a drawn street grid per tile (deterministic, offline:
   the browser suite never calls openstreetmap.org). `?imgfail=1` serves a missing image; `?imgslow=1` never resolves. */
const svg = (body: string, w = 400, h = 400) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;
const ART: Record<string, string> = {
  "0192a3b4-5c6d-7e8f-9a0b-000000000a31": svg(`<rect width="400" height="400" fill="#f4ede0"/><path d="M200 70c-40 60-40 120 0 160c40-40 40-100 0-160z" fill="#8a5a2b"/><path d="M200 230c-60 20-90 60-70 100c30 30 90 10 120-40" fill="none" stroke="#8a5a2b" stroke-width="18" stroke-linecap="round"/>`),
  "0192a3b4-5c6d-7e8f-9a0b-000000000a2d": svg(`<rect width="640" height="360" fill="#1f2a33"/><text x="40" y="170" font-family="sans-serif" font-size="40" fill="#fff">EVs in Singapore, 2026</text><rect x="40" y="200" width="160" height="6" fill="#3d8bf5"/>`, 640, 360),
  "0192a3b4-5c6d-7e8f-9a0b-000000000b02": svg(`<rect width="640" height="360" fill="#d9d2c5"/><rect x="60" y="200" width="520" height="120" fill="#b8ab96"/><rect x="100" y="60" width="160" height="120" fill="#efe9dd"/>`, 640, 360),
  "0192a3b4-5c6d-7e8f-9a0b-000000000b01": clipUrl
};
// Roads sit on a grid that continues across tile edges (so the plane reads as one map); a park on some tiles.
const tile = (z: number, x: number, y: number) => {
  const park = (x * 7 + y * 3 + z) % 4 === 0;
  return svg(`<rect width="256" height="256" fill="#ecebe6"/>${park ? `<rect x="150" y="30" width="80" height="56" rx="6" fill="#dde5d6"/>` : ""}`
    + `<path d="M0 96H256M0 208H256M72 0V256M184 0V256" stroke="#ffffff" stroke-width="6"/>`
    + `<path d="M0 150H256" stroke="#d3dde3" stroke-width="10"/>`, 256, 256);
};
// `?net=1` serves artifacts and tiles over HTTP paths the browser suite routes (fulfils, aborts or holds), so real
// transport failure and recovery are exercised, not a host-injected state. `?generation=` changes every tile URL.
const mediaHost = (): HarsoOutputMediaHost => ({
  resolveArtifact: artifact => query.has("imgfail") ? "/preview/missing-image.png" : query.has("imgslow") ? "/__never__/slow.png"
    : query.has("net") ? `/__media__/${artifact.slice(9)}` : ART[artifact.slice(9)],
  mapTile: query.has("net") ? (z, x, y) => `/__tiles__/${query.get("generation") ?? 0}/${z}/${x}/${y}.svg` : tile
});
// Per-block state for B0 state crops: ?state=partial etc. The B0 master copy for each kind (data.js).
const STATE_COPY: Record<string, Record<string, Omit<HarsoOutputBlockState, "state">>> = {
  bar: { empty: { message: "No spending recorded this month" }, partial: { message: "3 of 4 weeks · 22–30 Sep still syncing" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load the chart", reason: "The bank feed didn’t respond. Nothing was changed." } },
  status: { empty: { message: "No steps yet" }, partial: { message: "3 of 4 updates · departure time not confirmed" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t update the flight", reason: "The airline didn’t respond." } },
  progress: { empty: { message: "No budget set for September" }, partial: { message: "3 of 4 accounts counted" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load your budget", reason: "The source didn’t respond. Nothing was changed." } },
  image: { empty: { message: "No image yet" }, partial: { message: "Rendering · 1 of 2 sizes" }, stale: { message: "As of 09:10 · older version" }, failed: { message: "Couldn’t make the image", reason: "The image tool timed out. Nothing was charged." } },
  video: { empty: { message: "No video yet" }, partial: { message: "Processing · 1 of 2 sizes" }, stale: { message: "As of 09:10 · older version" }, failed: { message: "Couldn’t load the video", reason: "The file didn’t respond. Nothing was changed." } },
  map: { empty: { message: "No places to show" }, partial: { message: "3 of 5 places located" }, stale: { message: "As of 09:10 · couldn’t refresh" }, failed: { message: "Couldn’t load the map", reason: "The map service didn’t respond." } },
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
// Image aspect override for the geometry test: ?aspect=3:4 etc.
if (query.has("aspect")) (b0Image.blocks[0] as { visual: { aspect?: string } }).visual.aspect = query.get("aspect")!;

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
  // Every host callback the card can call, recorded in order (`opened` keeps the video tests' artifact list).
  // `?without=url,open,download,work,routine` leaves those callbacks out, as a host that cannot act on them would.
  const [opened, setOpened] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [media] = useState(mediaHost);
  const log = (entry: string) => setActions(list => [...list, entry]);
  const without = new Set((query.get("without") ?? "").split(","));
  const host = {
    onOpenUrl: without.has("url") ? undefined : (url: string) => log(`open_url ${url}`),
    onOpenArtifact: without.has("open") ? undefined : (artifact: string) => { setOpened(list => [...list, artifact]); log(`open_artifact ${artifact}`); },
    onDownloadArtifact: without.has("download") ? undefined : (artifact: string) => log(`download_artifact ${artifact}`),
    onWorkControl: without.has("work") ? undefined : (control: string, id: string) => log(`work_control ${control} ${id}`),
    onRoutineControl: without.has("routine") ? undefined : (control: string, id: string) => log(`routine_control ${control} ${id}`)
  };
  return <KitProvider appearance={appearance} palette={palette} className="output-card-fixture" style={query.has("width") ? { maxWidth: `${Number(query.get("width"))}px` } : undefined}>
    <main>
      <div className="output-card-transcript" data-testid="transcript">
        <p className="output-card-user">Flights to Tokyo on 12 Oct?</p>
        <p>Three direct options. SQ 638 has the best times for your morning start.</p>
        <HarsoOutputCard document={document} onViewAll={() => setViewAllOpened(value => value + 1)}
          onOpenDetails={query.has("hostDetails") ? () => setDetailsOpened(value => value + 1) : undefined} blockStates={blockStates} media={media} {...host} />
      </div>
      <output aria-label="Fixture callbacks">{JSON.stringify({ viewAllOpened, detailsOpened, retried, opened, actions })}</output>
    </main>
  </KitProvider>;
}

createRoot(window.document.getElementById("root")!).render(<Fixture />);
