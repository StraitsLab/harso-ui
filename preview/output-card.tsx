import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
import "../src/primitives.css";

// WEV-1851 S1 fixture. Documents are verbatim copies of the output-blocks.v1 draft examples;
// all callbacks are simulated counters (no transport, no send).
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
const documents: Record<string, HarsoOutputDocument> = { flights, failed, spending };

const query = new URLSearchParams(location.search);

function Fixture() {
  const [appearance] = useState<"light" | "dark">(query.get("mode") === "dark" ? "dark" : "light");
  const palette = query.get("palette") === "cozy" ? "cozy" : "clean";
  const document = documents[query.get("doc") ?? "flights"] ?? flights;
  const [replies, setReplies] = useState<string[]>([]);
  const [detailsOpened, setDetailsOpened] = useState(0);
  return <KitProvider appearance={appearance} palette={palette} className="output-card-fixture">
    <main>
      <div className="output-card-transcript" data-testid="transcript">
        <p className="output-card-user">Flights to Tokyo on 12 Oct?</p>
        <p>Three direct options. SQ 638 has the best times for your morning start.</p>
        <HarsoOutputCard document={document} onReply={text => setReplies(value => [...value, text])}
          onOpenDetails={query.has("hostDetails") ? () => setDetailsOpened(value => value + 1) : undefined} />
      </div>
      <output aria-label="Fixture callbacks">{JSON.stringify({ replies, detailsOpened })}</output>
    </main>
  </KitProvider>;
}

createRoot(window.document.getElementById("root")!).render(<Fixture />);
