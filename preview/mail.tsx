import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRow } from "../src/chat/output-card";
import { family } from "../src/chat/v6/mail";
import type { WidgetSize } from "../src/chat/v6/types";
import "../src/primitives.css";

// P06 (WEV-3322) fixture: clearly labelled sample documents, never live mail. Same JSON for light and dark.
const row = (extra: HarsoOutputRow): HarsoOutputRow => extra;
const inbox: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "inbox-brief", as_of: "2026-09-26T00:00Z",
  header: { title: "Inbox · Sat 26 Sep", subtitle: "Sample · 3 need you" },
  blocks: [
    { kind: "rows", total_count: 18, items: [
      row({ id: "m1", label: "Mrs Tan", brand: "gmail.com", unread: true, status: "needs_you", secondary: "Lease renewal · wants Tue 29 or Wed 30 Sep", trailing: "Reply by Mon 28 Sep", action: { kind: "open_url", label: "Open Mrs Tan thread", url: "https://mail.google.com/mail/u/0/#inbox/sample1" } }),
      row({ id: "m2", label: "IRAS", brand: "iras.gov.sg", status: "needs_you", secondary: "Property tax bill · GIRO not set up", trailing: "Pay by Wed 30 Sep" }),
      row({ id: "m3", label: "Sam Lee", unread: true, secondary: "Tokyo trip restaurants · asked Thu 24 Sep", trailing: "Waiting 2 days" })
    ] },
    { kind: "action", secondary: { kind: "open_url", label: "Open inbox in Gmail", url: "https://mail.google.com/mail/u/0/#inbox" } }
  ],
  details: { sources: [{ label: "Sample Gmail inbox, 25 Sep 2026 08:00 to 26 Sep 2026 08:00" }] },
  fallback_text: "Sample inbox."
};
const deadlines: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "deadlines-from-mail", as_of: "2026-09-26T03:30Z",
  header: { title: "4 deadlines in the next 72 hours", subtitle: "Sample · soonest first" },
  blocks: [
    { kind: "rows", items: [
      row({ id: "d1", label: "Sign the lease renewal", brand: "docusign.com", secondary: "Nichol’s email 23 Sep · DocuSign", trailing: "by Sun 27 Sep" }),
      row({ id: "d2", label: "Return library books", brand: "nlb.gov.sg", secondary: "NLB reminder 25 Sep · 3 books", trailing: "by Sat 26 Sep, 18:00", due_at: "2026-09-26T10:00Z" }),
      row({ id: "d3", label: "Renew road tax", secondary: "LTA email 19 Sep", trailing: "by Mon 28 Sep, 09:00", due_at: "2026-09-28T01:00Z" }),
      row({ id: "d4", label: "Pay parking fine", secondary: "URA notice 24 Sep · S$50", trailing: "by Tue 29 Sep" })
    ] },
    { kind: "text", sections: [{ heading: "Already passed", bullets: ["Town council S&CC: GIRO form was due Fri 25 Sep (email 18 Sep)."] }] }
  ],
  details: { sources: [{ label: "Sample Gmail, read 26 Sep 2026 11:30" }] },
  fallback_text: "Sample deadlines."
};
const reply: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "reply-draft", as_of: "2026-09-26T03:30Z",
  header: { title: "Lease renewal · reply", subtitle: "To Mrs Tan · draft, not sent" },
  blocks: [
    { kind: "text", sections: [{ paragraphs: [
      "Dear Mrs Tan,",
      "Tuesday 29 Sep at 6:30 pm works for me. I'll bring the signed renewal form and a cheque for the deposit top-up. If the lift is out again that evening, I can come at 5:45 pm instead and wait in the lobby.",
      "Could you also confirm whether the parking label renews with the lease, or if I should apply for it separately at the management office?",
      "Best regards, Abhi"
    ] }] },
    { kind: "action", secondary: { kind: "open_url", label: "Open Gmail drafts", url: "https://mail.google.com/mail/u/0/#drafts" } }
  ],
  details: { assumptions: ["Written in the tone of your last 20 sent emails to Mrs Tan"] },
  fallback_text: "Sample draft."
};

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const host = { onOpenUrl: () => {}, onViewAll: () => {} };
const card = (document: HarsoOutputDocument, widgetSize?: WidgetSize) =>
  <HarsoOutputCard document={document} families={{ [document.template!]: family }} widgetSize={widgetSize} mode={widgetSize ? undefined : "full"} {...host} />;

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="mail-fixture">
    <main>
      <div className="slot" data-testid="inbox"><h2>Inbox brief</h2>{card(inbox)}</div>
      <div className="slot" data-testid="deadlines"><h2>Deadlines from mail</h2>{card(deadlines)}</div>
      <div className="slot" data-testid="reply"><h2>Reply draft</h2>{card(reply)}</div>
      <div className="slot small" data-testid="inbox-s"><h2>Inbox, small</h2>{card(inbox, "small")}</div>
      <div className="slot medium" data-testid="inbox-m"><h2>Inbox, medium</h2>{card(inbox, "medium")}</div>
      <div className="slot small" data-testid="deadlines-s"><h2>Deadlines, small</h2>{card(deadlines, "small")}</div>
      <div className="slot medium" data-testid="deadlines-m"><h2>Deadlines, medium</h2>{card(deadlines, "medium")}</div>
    </main>
  </KitProvider>
);
