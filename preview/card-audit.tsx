import { createRoot } from "react-dom/client";
import { useState } from "react";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, harsoOutputWholeAnswer, HARSO_OUTPUT_CARD_UNCAPPED, type HarsoOutputDocument, type HarsoOutputBlock } from "../src/chat/output-card";
import fixtures from "./card-audit-fixtures.json";
import { V6_FAMILIES } from "../src/chat/v6/registry";
import "../src/primitives.css";
import "./card-audit.css";

// Labelled sample data, never a live itinerary, quote, inbox or booking.
// Kyoto photo: Unsplash / Sorasak. Favicons: their respective brands. Route: OSRM/FOSSGIS, OSM data.
const photo = { artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000001", alt: "Kyoto street in the old town" };
const places = [
  { id: "p1", label: "Kiyomizu-dera", lat: "34.9949", lon: "135.7850", category: "Temple", photo },
  { id: "p2", label: "Yasaka Shrine", lat: "35.0037", lon: "135.7785", category: "Shrine", photo },
  { id: "p3", label: "Nishiki Market", lat: "35.0050", lon: "135.7649", category: "Market", photo },
  { id: "p4", label: "Nijō Castle", lat: "35.0142", lon: "135.7482", category: "Castle", photo }
];
export const generic: HarsoOutputDocument[] = [];
const add = (id: string, blocks: HarsoOutputBlock[], extra = {}) => generic.push({ kind: "output_blocks", major: 1, header: { title: id }, blocks, fallback_text: "Sample answer", ...extra });
add("Sections with photos, dates and tabs", [{ kind: "text", sections: [
  { heading: "Day 1 · Higashiyama", date: "2026-10-20", thumbnail: photo, paragraphs: ["Start early at Kiyomizu-dera, then walk the old lanes to Gion."], bullets: ["09:00 Temple visit", "12:30 Lunch on Ninenzaka"] },
  { heading: "Day 2 · Gardens", date: "2026-10-21", thumbnail: photo, paragraphs: ["Leave time for the gardens. Take the train west after breakfast."] },
  { heading: "Day 3 · Markets", date: "2026-10-22", thumbnail: photo, paragraphs: ["Pick up lunch at Nishiki Market and explore the castle gardens."] }
] }]);
add("Rows with photos, ratings, brands and status", [{ kind: "rows", items: [
  { label: "Kiyomizu-dera", thumbnail: photo, category: "Temple", rating: "4.6", review_count: 12000, status: "done", trailing: "12 min walk", secondary: "Higashiyama · hillside views", mark: "pick", action: { kind: "open_url", label: "Directions", url: "https://www.openstreetmap.org" } },
  { label: "Apple", thumbnail: photo, brand: "apple.com", secondary: "Official store", trailing: "S$349", status: "done" }
] }]);
add("Comparison table", [{ kind: "table", columns: [{ label: "Feature" }, { label: "Walk" }, { label: "Bus" }], rows: [{ cells: ["Time", "35 min", "15 min"], winner: 2 }, { cells: ["Cost", "Free", "¥230"], winner: 1 }, { cells: ["Best for", "Old lanes and photos", "Rainy afternoons"] }] }]);
add("Key numbers", [{ kind: "numbers", items: [{ label: "Budget left", value: "S$720", delta: "+4.2%" }, { label: "Days to go", value: "12" }, { label: "Per day", value: "S$60" }] }]);
for (const chart of ["bar", "line", "area"] as const) add(`Chart · ${chart}`, [{ kind: "visual", visual: { kind: "chart", chart, unit: "S$", x_labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], series: [{ label: "This week", values: ["120", "145", "132", "160", "151"] }, ...(chart === "bar" ? [] : [{ label: "Last week", values: ["110", "125", "135", "140", "130"] }])] } }]);
add("Photo", [{ kind: "visual", visual: { kind: "image", ...photo, aspect: "landscape" } }]);
add("Photo gallery", [{ kind: "visual", visual: { kind: "image", ...photo, images: [photo, { ...photo, alt: "Kyoto street, second view" }], aspect: "landscape" } }]);
add("Video preview", [{ kind: "visual", visual: { kind: "video", ...photo, poster: photo.artifact } }]);
add("Kyoto · 4 places with route", [{ kind: "visual", visual: { kind: "map", places, selected_place_id: "p1", route: { mode: "walk", path: "}|qtEkpw{X\\EF~@WTDlAo@jCQGWnAy@p@AtDcCrG_Bm@qFDiCzLkICkRr@w@`@i@CDmAAr@@s@EbBmA^Gt@z@rALzAGr\\Wr@VJFjMe@^?t@cCAFvCi@DLnFg@?BfM@~^wF?At@eZ?KvXG`AkA?e@pUeH??\\[?AzBs@Cn@lA?hByAx@aACOx@qABr@jAOrB", minutes: 76, meters: 5653 } } }]);
add("Kyoto · places without route", [{ kind: "visual", visual: { kind: "map", places, selected_place_id: "p2" } }]);
add("Status and steps", [{ kind: "status", state: "watching", detail: "since 9:40 AM" }, { kind: "rows", items: [{ label: "Stops after", trailing: "Fri 6 PM" }] }]);
add("Actions", [{ kind: "text", sections: [{ paragraphs: ["The itinerary is ready. Review the details before saving it."] }] }, { kind: "action", primary: { kind: "reply", label: "Save this plan", text: "Save this plan" }, secondary: { kind: "open_url", label: "Open source", url: "https://www.openstreetmap.org" } }]);
add("Form", [{ kind: "form", submit: "Plan trip", fields: [{ id: "city", label: "Destination", type: "text", value: "Kyoto", required: true }, { id: "date", label: "Departure", type: "date", value: "2026-10-20" }, { id: "travel", label: "Travel", type: "choice", value: "Train", options: ["Train", "Plane"] }] }]);
add("Three suggestion pills", [{ kind: "text", sections: [{ paragraphs: ["Take the east-side walk before the afternoon crowds."] }] }], { suggestions: ["Show the walking route", "Find somewhere for lunch", "What if it rains tomorrow?"] });
add("Empty state", [{ kind: "status", state: "empty", detail: "No places matched. Try a wider area." }]);

const params = new URLSearchParams(location.search), mode = params.get("mode") === "dark" ? "dark" : "light";
const full = params.get("view") === "opened", only = params.get("only");
const documents = [...fixtures as HarsoOutputDocument[], ...generic];
const idOf = (doc: HarsoOutputDocument) => doc.template ?? doc.header.title;
const brands = import.meta.glob("./assets/*.png", { eager: true, query: "?url", import: "default" });
const hostFor = (doc: HarsoOutputDocument) => ({ resolveArtifact: (uri: string) => {
  if (doc.template === "price-watch") return "/preview/assets/airpods.jpg";
  if (doc.template === "compare-products") return "/preview/assets/phone.jpg";
  if (doc.template === "product-shortlist") return "/preview/assets/vacuum.jpg";
  return "/preview/assets/kyoto.jpg";
} });
function Page() {
  const [log, setLog] = useState("");
  return <KitProvider appearance={mode} className="audit-root"><main><h1>Card quality matrix</h1><p>Sample content · {full ? "opened" : "inline"} · {mode} · product and place photos are sample images.</p>
    {documents.filter(doc => !only || idOf(doc) === only).map(doc => <section key={idOf(doc)} data-audit={idOf(doc)}><h2>{idOf(doc)}</h2>
      <HarsoOutputCard document={full ? harsoOutputWholeAnswer(doc) : doc} mode={full ? "full" : "inline"} caps={full ? HARSO_OUTPUT_CARD_UNCAPPED : undefined} families={V6_FAMILIES} media={hostFor(doc)}
        renderBrand={({ domain }) => brands[`./assets/${domain}.png`] ? <img src={brands[`./assets/${domain}.png`] as string} alt="" /> : undefined}
        onViewAll={() => setLog("View all requested")} onReply={setLog} onOpenUrl={setLog} onOpenArtifact={setLog} onRoutineControl={() => setLog("Routine control requested")} onPageWatchControl={() => setLog("Watch control requested")} />
    </section>)}<p role="status">{log}</p></main></KitProvider>;
}
createRoot(document.getElementById("root")!).render(<Page />);
