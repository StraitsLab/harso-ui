import { createRoot } from "react-dom/client";
import { useState } from "react";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
import { family } from "../src/chat/v6/research";
import "../src/primitives.css";

// WEV-3324 (P08) fixture: the approved EV brief. ?mode=dark for dark, ?open=1 for the full view, ?widget=medium for the pinned size.
// Bundled marks are the host's job; this page lends two so the stack shows both a mark and a letter tile, with no network.
const doc: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "research-brief",
  header: { title: "EVs in Singapore, 2026", subtitle: "Research brief" },
  blocks: [
    { kind: "text", summary: "Charging is now broad but slow; the saving depends on charging near home.", sections: [
      { heading: "Where things stand", paragraphs: ["Public chargers passed 15,000 points this year, most in HDB car parks. Fast chargers remain scarce outside big malls."] },
      { heading: "What it means for you", paragraphs: ["Public charging cost about S$0.60–0.75 per kWh in an August survey, against about S$0.35 at home on the Jul–Sep tariff. Check your car park’s rollout date before you buy."] },
    ] },
    { kind: "action", secondary: { kind: "open_artifact", label: "Open as document", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-0000000009c5" } },
  ],
  details: { sources: [
    { label: "LTA EV statistics", url: "https://www.lta.gov.sg/content/ltagov/en/industry_innovations/technologies/electric_vehicles.html" },
    { label: "SP Group electricity tariffs", url: "https://www.spgroup.com.sg/our-services/utilities/tariff-information" },
    { label: "The Straits Times, EV charging price survey", url: "https://www.straitstimes.com/singapore/transport/ev-charging-prices-survey-2026" },
    { label: "LTA EV Common Charger Grant", url: "https://www.lta.gov.sg/content/ltagov/en/industry_innovations/technologies/electric_vehicles/ecc-grant.html" },
    { label: "HDB EV charger rollout", url: "https://www.hdb.gov.sg/car-parks/shortterm-parking/electric-vehicle-charging" },
  ] },
  as_of: "2026-10-11T09:10Z",
  fallback_text: "EVs in Singapore 2026.",
};

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const widgetSize = params.get("widget") === "medium" ? "medium" : undefined;
const mark = (fill: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill={fill} /></svg>;
const marks: Record<string, string> = { "lta.gov.sg": "#1f4e9c", "spgroup.com.sg": "#12a0a8" };

function Page() {
  const [log, setLog] = useState("");
  const say = (what: string) => () => setLog(what);
  return <main>
    <div className={widgetSize ? "widget" : "card"} data-testid="research">
      <HarsoOutputCard document={doc} mode={params.get("open") ? "full" : "inline"} widgetSize={widgetSize} families={{ "research-brief": family }}
        renderBrand={({ domain }) => marks[domain] ? mark(marks[domain]) : undefined}
        onViewAll={say("opened the full answer")} onOpenArtifact={id => setLog(`reader opened ${id}`)} onOpenUrl={url => setLog(`host opened ${url}`)} />
    </div>
    <p role="status" data-testid="log">{log}</p>
  </main>;
}

createRoot(document.getElementById("root")!).render(<KitProvider appearance={appearance} className="research-fixture"><Page /></KitProvider>);
