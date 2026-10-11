import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
import { family } from "../src/chat/v6/commerce";
import "../src/primitives.css";

// P02 (WEV-3318) fixture: the three shopping cards. The photos are flat SVG stand-ins resolved by a fixture host (the real
// host resolves saved artifacts); the shop logos come from the host's bundled marks, so here they are letter tiles.
const PW = "0192a3b4-5c6d-7e8f-9a0b-000000000709";
const art = (n: number) => `artifact:0192a3b4-5c6d-7e8f-9a0b-${String(n).padStart(12, "0")}`;
const swatch = (n: number) => {
  const hue = (n * 47) % 360;
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(${hue} 20% 94%)'/><rect x='30' y='14' width='40' height='72' rx='10' fill='hsl(${hue} 45% 55%)'/></svg>`)}`;
};
const media = { resolveArtifact: (uri: string) => swatch(Number(uri.slice(-4))) };
const photo = (n: number, alt: string) => ({ artifact: art(n), alt });

const watch: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "price-watch", as_of: "2026-09-26T02:30Z",
  header: { title: "AirPods Pro price watch", subtitle: "Apple, Lazada, Shopee" },
  blocks: [
    { kind: "status", state: "watching", detail: "since 26 Sep", subject: { page_watch_id: PW } },
    { kind: "visual", visual: { kind: "image", artifact: art(1), alt: "AirPods Pro in the open case" } },
    { kind: "rows", items: [
      { id: "apple", label: "Apple", brand: "apple.com", trailing: "S$349" },
      { id: "lazada", label: "Lazada", brand: "lazada.sg", trailing: "S$339", mark: "pick" },
      { id: "shopee", label: "Shopee", brand: "shopee.sg", trailing: "S$345" }] },
    { kind: "action", secondary: { kind: "page_watch_control", label: "Turn off", page_watch_id: PW, control: "disable" } }],
  fallback_text: "Watching AirPods Pro."
};
const compare: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "compare-products", as_of: "2026-09-26T02:05Z",
  header: { title: "iPhone 17 vs Pixel 11", subtitle: "Price and camera" },
  blocks: [{ kind: "table", columns: [{ label: "Camera" }, { label: "iPhone 17", thumbnail: photo(11, "iPhone 17") }, { label: "Pixel 11", thumbnail: photo(12, "Pixel 11") }], rows: [
    { cells: ["Price", "S$1,299", "S$1,249"], winner: 2 }, { cells: ["Zoom", "2x optical", "5x optical"], winner: 2 },
    { cells: ["Night photos", "Good", "Better"], winner: 2 }, { cells: ["Video", "4K 120 fps", "4K 60 fps"], winner: 1 }] }],
  fallback_text: "Pixel wins on price, zoom and night photos."
};
const shortlist: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "product-shortlist", as_of: "2026-09-26T02:05Z",
  header: { title: "Quiet stick vacuums under S$400", subtitle: "Sorted by noise" },
  blocks: [{ kind: "rows", items: [
    { id: "dyson", label: "Dyson V8 Origin", secondary: "72 dB · 40 min", trailing: "S$379", mark: "pick", rating: "4.6", review_count: 12394, thumbnail: photo(21, "Dyson V8 Origin"), action: { kind: "open_url", label: "Open at Courts", url: "https://shop.example/dyson" } },
    { id: "xiaomi", label: "Xiaomi G11", secondary: "74 dB · 60 min", trailing: "S$299", rating: "4.4", review_count: 3108, thumbnail: photo(22, "Xiaomi G11"), action: { kind: "open_url", label: "Open at Lazada", url: "https://shop.example/xiaomi" } },
    { id: "samsung", label: "Samsung Jet 60", secondary: "76 dB · 40 min", rating: "4.5", thumbnail: photo(23, "Samsung Jet 60") }] }],
  fallback_text: "Three quiet stick vacuums."
};

const params = new URLSearchParams(location.search);
const appearance = params.get("mode") === "dark" ? "dark" : "light";
const families = { "price-watch": family, "compare-products": family, "product-shortlist": family };
const draw = (document: HarsoOutputDocument, widgetSize?: "small" | "medium") => (
  <HarsoOutputCard document={document} families={families} media={media} widgetSize={widgetSize} onViewAll={() => {}} onOpenUrl={() => {}} onPageWatchControl={() => {}} />
);

createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={appearance} className="commerce-fixture">
    <main>
      <div data-testid="watch">{draw(watch)}</div>
      <div data-testid="compare">{draw(compare)}</div>
      <div data-testid="shortlist">{draw(shortlist)}</div>
      <div className="tile" data-testid="widget-small">{draw(watch, "small")}</div>
      <div className="tile medium" data-testid="widget-medium">{draw(watch, "medium")}</div>
    </main>
  </KitProvider>
);
