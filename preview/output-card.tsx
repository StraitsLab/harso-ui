import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRowsBlock } from "../src/chat/output-card";
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
const documents: Record<string, HarsoOutputDocument> = { flights, failed, spending, more, numbers, brief, text, cjk, short };

const query = new URLSearchParams(location.search);

function Fixture() {
  const [appearance] = useState<"light" | "dark">(query.get("mode") === "dark" ? "dark" : "light");
  const palette = query.get("palette") === "cozy" ? "cozy" : "clean";
  const document = documents[query.get("doc") ?? "flights"] ?? flights;
  const [viewAllOpened, setViewAllOpened] = useState(0);
  const [detailsOpened, setDetailsOpened] = useState(0);
  return <KitProvider appearance={appearance} palette={palette} className="output-card-fixture">
    <main>
      <div className="output-card-transcript" data-testid="transcript">
        <p className="output-card-user">Flights to Tokyo on 12 Oct?</p>
        <p>Three direct options. SQ 638 has the best times for your morning start.</p>
        <HarsoOutputCard document={document} onViewAll={() => setViewAllOpened(value => value + 1)}
          onOpenDetails={query.has("hostDetails") ? () => setDetailsOpened(value => value + 1) : undefined} />
      </div>
      <output aria-label="Fixture callbacks">{JSON.stringify({ viewAllOpened, detailsOpened })}</output>
    </main>
  </KitProvider>;
}

createRoot(window.document.getElementById("root")!).render(<Fixture />);
