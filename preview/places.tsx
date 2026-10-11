import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
import { placesFamilies } from "../src/chat/v6/places";
import type { WidgetSize } from "../src/chat/v6/types";
import "../src/primitives.css";

// P5 (WEV-3321) fixture: the Kyoto trip and the 24-hour clinics, as cards and as Home widgets. No transport. The
// kit's own preview has no photo or tile server, so the host here lends none: this shows the all-text state, which is
// what a failed photo or map leaves. ?mode=dark, ?widget=small|medium|large, ?doc=trip|places.
const AS_OF = "2026-10-11T09:10Z";
const place = (id: string, label: string, lat: string, lon: string) => ({ id, label, lat, lon });
const trip: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "trip-itinerary", as_of: AS_OF,
  header: { title: "Kyoto in 4 days", subtitle: "14–17 Oct · one area a day" },
  blocks: [
    { kind: "visual", visual: { kind: "map", places: [place("d1", "Higashiyama", "34.9967", "135.7850"), place("d2", "Arashiyama", "35.0094", "135.6668")] } },
    { kind: "text", sections: [
      { heading: "Day 1 · Higashiyama", date: "2026-10-14", bullets: ["09:00 Kiyomizu-dera before the crowds", "12:30 Lunch on Ninenzaka", "16:00 Yasaka Shrine at dusk"] },
      { heading: "Day 2 · Arashiyama", date: "2026-10-15", bullets: ["08:30 Bamboo grove", "11:00 Tenryu-ji garden", "14:00 Hozu river boat"] },
      { heading: "Day 3 · Fushimi Inari", date: "2026-10-16", bullets: ["07:30 Walk the torii gates to Yotsutsuji", "13:00 Tofuku-ji"] },
      { heading: "Day 4 · Nishiki and Gion", date: "2026-10-17", bullets: ["10:00 Nishiki Market", "15:00 Tea at Ippodo", "18:00 Gion evening walk"] }
    ] }
  ],
  fallback_text: "Kyoto in 4 days."
};
const maps = (id: string, lat: string, lon: string) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving#${id}`;
const places: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "places-nearby", as_of: AS_OF,
  header: { title: "24-hour clinics near you", subtitle: "Open now" },
  blocks: [
    { kind: "visual", visual: { kind: "map", selected_place_id: "c1", places: [place("c1", "Raffles Medical Holland V", "1.3113", "103.7960"), place("c2", "Fullerton Health Novena", "1.3203", "103.8436"), place("c3", "Parkway Shenton Bukit Timah", "1.3294", "103.8025")] } },
    { kind: "rows", items: [
      { id: "c1", label: "Raffles Medical", secondary: "Holland Village · walk-in", trailing: "8 min", mark: "pick", brand: "rafflesmedical.com", rating: "4.4", review_count: 128, category: "Medical clinic", opening_label: "Open 24 hours", open_state: "open", distance: "2.4 km", travel_mode: "drive", action: { kind: "open_url", label: "Directions", url: maps("c1", "1.3113", "103.7960") } },
      { id: "c2", label: "Fullerton Health", secondary: "Novena · walk-in", trailing: "12 min", brand: "fullertonhealth.com", rating: "4.2", review_count: 96, category: "Medical clinic", opening_label: "Open 24 hours", open_state: "open", distance: "5.8 km", travel_mode: "drive", action: { kind: "open_url", label: "Directions", url: maps("c2", "1.3203", "103.8436") } },
      { id: "c3", label: "Parkway Shenton", secondary: "Bukit Timah · call first", trailing: "15 min", brand: "parkwayshenton.com", category: "Medical clinic", distance: "6.2 km", travel_mode: "drive" }
    ] }
  ],
  fallback_text: "24-hour clinics."
};

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const only = params.get("doc");
const noop = () => {};
const draw = (document: HarsoOutputDocument, widgetSize?: WidgetSize) =>
  <HarsoOutputCard document={document} families={placesFamilies} widgetSize={widgetSize} mode={widgetSize ? undefined : "full"} onViewAll={noop} onOpenUrl={noop} />;
const widgets: [HarsoOutputDocument, WidgetSize[]][] = [[trip, ["medium", "large"]], [places, ["small", "medium"]]];

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="places-fixture">
    <main>
      {(only === null || only === "trip") && <div className="card" data-testid="trip">{draw(trip)}</div>}
      {(only === null || only === "places") && <div className="card" data-testid="places">{draw(places)}</div>}
      {widgets.flatMap(([doc, sizes]) => sizes.map(size => (only === null || only === "widgets") && <div key={`${doc.template}-${size}`} className={`tile ${size}`} data-testid={`${doc.template}-${size}`}>{draw(doc, size)}</div>))}
    </main>
  </KitProvider>
);
