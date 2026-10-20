import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import InteractiveMap from "./output-map";
import type { HarsoOutputMap } from "./output-card-media";

// The Google surface talks to the Maps JavaScript API only through the official loader; fake it here.
const g = vi.hoisted(() => ({ options: [] as any[], maps: [] as any[], markers: [] as any[], lines: [] as any[], fail: false, listeners: {} as Record<string, () => void> }));
vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: (o: any) => g.options.push(o),
  importLibrary: async (name: string) => {
    if (g.fail) throw new Error("load failed");
    if (name === "maps") return {
      Map: class { constructor(_el: any, opts: any) { g.maps.push(opts); }
        addListener(event: string, cb: () => void) { g.listeners[event] = cb; if (event === "tilesloaded") queueMicrotask(cb); return { remove() {} }; }
        fitBounds() {} getZoom() { return 12; } setZoom() {} },
      Polyline: class { constructor(public opts: any) { g.lines.push(opts); } setMap() {} }
    };
    if (name === "marker") return { AdvancedMarkerElement: class { map: any; zIndex = 0; constructor(public opts: any) { this.map = opts.map; g.markers.push(this); } } };
    return { ColorScheme: { DARK: "DARK", LIGHT: "LIGHT" }, ControlPosition: { RIGHT_TOP: 7 },
      SymbolPath: { FORWARD_CLOSED_ARROW: 1 }, LatLngBounds: class { extend() {} } };
  }
}));
vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
vi.stubGlobal("matchMedia", () => ({ matches: true }));
afterEach(() => { cleanup(); g.options = []; g.maps = []; g.markers = []; g.lines = []; g.fail = false; g.listeners = {}; });

const map: HarsoOutputMap = { kind: "map", selected_place_id: "a", places: [
  { id: "a", label: "Royal Observatory", lat: "51.476853", lon: "-0.0005002" },
  { id: "b", label: "Cutty Sark", lat: "51.4828646", lon: "-0.0095917" }
], route: { mode: "walk", path: "_p~iF~ps|U_ulLnnqC", minutes: 20, meters: 1489 } };
const host = { googleMaps: { key: "test-key", mapId: "map-id" } };

test("host googleMaps draws one Google vector map with numbered pins, a street route and arrows", async () => {
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await waitFor(() => expect(document.querySelector("[data-provider=google]")?.getAttribute("data-state")).toBe("ready"));
  expect(g.options[0]).toMatchObject({ key: "test-key" });
  expect(g.maps).toHaveLength(1);
  expect(g.maps[0]).toMatchObject({ mapId: "map-id", gestureHandling: "cooperative", colorScheme: "LIGHT", clickableIcons: false });
  expect(g.markers.map(m => m.opts.title)).toEqual(["Royal Observatory", "Cutty Sark"]);
  const pins = g.markers.map(m => m.opts.content.querySelector(".hkc-map-pin") as HTMLButtonElement);
  expect(pins.map(p => p.textContent)).toEqual(["1", "2"]);
  expect(pins[0]).toHaveAttribute("aria-pressed", "true");
  // Only the selected stop carries a label: Google's own map already names landmarks.
  expect(g.markers.map(m => (m.opts.content.querySelector(".hkc-map-label-google") as HTMLElement).hidden)).toEqual([false, true]);
  const route = g.lines[1];
  expect(route.path).toHaveLength(2);
  expect(route.icons[0].icon.path).toBe(1);
  fireEvent.click(pins[1]);
  await waitFor(() => expect(pins[1]).toHaveAttribute("aria-pressed", "true"));
  expect(pins[0]).toHaveAttribute("aria-pressed", "false");
});

test("without googleMaps the open map is used; a failed Google load offers retry and keeps the list", async () => {
  g.fail = true;
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await screen.findByText("Map unavailable. Explore the places in the list below.");
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /Cutty Sark/ }).length).toBeGreaterThan(0);
});
