import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import InteractiveMap from "../src/chat/output-map";
import "../src/primitives.css";

// Local Google map check: ?key=<browser key>&mapId=<vector map id>&mode=dark&width=390
const q = new URLSearchParams(location.search);
const google = q.get("key") ? { key: q.get("key")!, mapId: q.get("mapId") ?? "DEMO_MAP_ID" } : undefined;
const greenwich = { kind: "map" as const, selected_place_id: "p1", places: [
  { id: "p1", label: "Royal Observatory Greenwich", lat: "51.476853", lon: "-0.0005002", category: "Museum" },
  { id: "p2", label: "National Maritime Museum", lat: "51.4810058", lon: "-0.0052262", category: "Museum" },
  { id: "p3", label: "Cutty Sark", lat: "51.4828646", lon: "-0.0095917", category: "Historical landmark" }],
  route: { mode: "walk" as const, minutes: 20, meters: 1489,
    path: "mbeyHjBGPMGw@n@KCa@LIHK]JIGu@HiBkA]e@Jk@`@m@p@iChA_Al@_DfCkA|@eAp@KEq@NQ\\cC~ANr@H@hCzKdA{@eAz@`@dBg@^^bBu@n@a@XgEpD}BhBx@bDVvAf@SBL" } };
const london = { kind: "map" as const, places: [
  { id: "a", label: "British Museum", lat: "51.5194133", lon: "-0.1269566", category: "Museum" },
  { id: "b", label: "National Gallery", lat: "51.508929", lon: "-0.128299", category: "Art gallery" },
  { id: "c", label: "Tate Modern", lat: "51.5075953", lon: "-0.0993564", category: "Art gallery" }] };
const dark = q.get("mode") === "dark";
createRoot(document.getElementById("root")!).render(
  <KitProvider appearance={dark ? "dark" : "light"} style={{ padding: 16, width: Number(q.get("width") ?? 560), boxSizing: "border-box", background: "var(--hk-canvas)", display: "grid", gap: 24 }}>
    <section className="hkc-output-card"><h2>Greenwich walk</h2><InteractiveMap map={greenwich} host={{ googleMaps: google }} /></section>
    <section className="hkc-output-card"><h2>London galleries</h2><InteractiveMap map={london} host={{ googleMaps: google }} /></section>
  </KitProvider>);
