import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRow } from "../src/chat/output-card";
import { family } from "../src/chat/v6/finance";
import type { V6Registry, WidgetSize } from "../src/chat/v6/types";
import "../src/primitives.css";

// P01 (WEV-3317) fixture. Every name, price and date below is invented for this page: a labelled sample, never a live fact.
// No host mark is supplied, so each brand draws the kit's letter tile. The kit loads no image and makes no request.
const families: V6Registry = { "stock-quote": family, "bills-due": family, subscriptions: family };
const AS_OF = "2026-09-25T20:00Z";
const LABELS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const stock = (delta: string, values: string[], extra: Record<string, string> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "stock-quote", as_of: AS_OF, fallback_text: "Sample.",
  header: { title: "Sample Co · SMPL", subtitle: "Sample exchange", brand: "sample.example" },
  blocks: [
    { kind: "numbers", items: [{ value: "US$238.40", label: "Close", delta }] },
    { kind: "visual", visual: { kind: "chart", chart: "line", unit: "US$", x_labels: LABELS, series: [{ label: "SMPL", values }], ...extra } },
  ],
  details: { sources: [{ label: "Sample data, not a quote" }], disclaimers: ["Not financial advice."] },
});
const up = stock("+1.8%", ["234.2", "235.9", "236.4", "237.1", "237.8", "238.1", "238.4"], { range: "1D", baseline: "234.17" });
const down = stock("−2.3%", ["244.6", "243.9", "242.0", "241.2", "240.1", "239.0", "238.4"], { range: "1D", baseline: "244.01" });
const flat = stock("0.00%", ["238.4", "238.9", "238.1", "238.6", "238.2", "238.5", "238.4"], { range: "1D", baseline: "238.40" });
const bare = stock("+1.8%", ["234.2", "235.9", "236.4", "237.1", "237.8", "238.1", "238.4"]);

const bills: HarsoOutputRow[] = [
  { id: "b1", label: "Sample Power", secondary: "Was due 21 Sep", trailing: "S$212.40", status: "overdue", brand: "samplepower.example" },
  { id: "b2", label: "Sample Fibre", secondary: "Due 25 Sep · Autopay", trailing: "S$49.90", brand: "samplefibre.example" },
  { id: "b3", label: "Sample Life", trailing: "S$224.10", status: "paid", brand: "samplelife.example" },
];
const subs: HarsoOutputRow[] = [
  { id: "s1", label: "Sample Chat", secondary: "Renews 4 Oct · card A", trailing: "S$27.50", brand: "samplechat.example" },
  { id: "s2", label: "Sample Video", secondary: "Renews 21 Oct · card A", trailing: "S$25.98", brand: "samplevideo.example" },
  { id: "s3", label: "Sample Music", trailing: "S$11.98", brand: "samplemusic.example" },
];
const billsDoc: HarsoOutputDocument = { kind: "output_blocks", major: 1, template: "bills-due", as_of: AS_OF, fallback_text: "Sample.",
  header: { title: "Bills due this week", subtitle: "21–27 Sep · sample" }, blocks: [{ kind: "rows", items: bills }] };
const subsDoc: HarsoOutputDocument = { kind: "output_blocks", major: 1, template: "subscriptions", as_of: AS_OF, fallback_text: "Sample.",
  header: { title: "Subscriptions", subtitle: "3 found · sample" },
  blocks: [{ kind: "numbers", items: [{ value: "S$65.46", label: "Total" }, { value: "3", label: "Subscriptions" }] }, { kind: "rows", items: subs }] };

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";

function Tile({ id, document, size, wide }: { id: string; document: HarsoOutputDocument; size?: WidgetSize; wide?: boolean }) {
  return <figure style={{ margin: 0 }}>
    <small>{id}</small>
    <div className={`tile${wide ? " wide" : ""}`} data-testid={id} data-size={size}>
      <HarsoOutputCard document={document} families={families} widgetSize={size} onViewAll={() => {}} caps={size ? undefined : { maxRows: Infinity }} mode={size ? "inline" : "full"} />
    </div>
  </figure>;
}

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="finance-fixture">
    <main>
      <Tile id="stock-up-card" document={up} /><Tile id="stock-down-card" document={down} /><Tile id="stock-flat-card" document={flat} />
      <Tile id="stock-no-range-card" document={bare} />
      <Tile id="bills-card" document={billsDoc} /><Tile id="subscriptions-card" document={subsDoc} />
      <Tile id="stock-small" document={up} size="small" /><Tile id="stock-small-down" document={down} size="small" />
      <Tile id="stock-medium" document={up} size="medium" /><Tile id="stock-large" document={up} size="large" />
      <Tile id="bills-small" document={billsDoc} size="small" /><Tile id="bills-medium" document={billsDoc} size="medium" />
      <Tile id="subs-small" document={subsDoc} size="small" /><Tile id="subs-medium" document={subsDoc} size="medium" />
    </main>
  </KitProvider>
);
