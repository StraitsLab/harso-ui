import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import InteractiveMap from "./output-map";
import { readMedia, type HarsoOutputMap } from "./output-card-media";
import { HarsoOutputCard, type HarsoOutputDocument } from "./output-card";

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

test("selected place opens its encoded Google identity, then coordinates after list or pin selection", async () => {
  const onOpenUrl = vi.fn();
  const places = [{ ...map.places[0], label: "Royal & Café / Greenwich", place_id: "ChIJ_test-123" }, map.places[1]];
  render(<InteractiveMap map={{ ...map, places }} host={host} onOpenUrl={onOpenUrl} />);
  fireEvent.click(screen.getByRole("button", { name: "Open in Google Maps" }));
  expect(onOpenUrl).toHaveBeenLastCalledWith("https://www.google.com/maps/search/?api=1&query=Royal%20%26%20Caf%C3%A9%20%2F%20Greenwich&query_place_id=ChIJ_test-123");
  fireEvent.click(within(screen.getByRole("list", { name: "Places" })).getByRole("button", { name: /Cutty Sark/ }));
  fireEvent.click(screen.getByRole("button", { name: "Open in Google Maps" }));
  expect(onOpenUrl).toHaveBeenLastCalledWith("https://www.google.com/maps/search/?api=1&query=51.4828646,-0.0095917");
  await waitFor(() => expect(g.markers).toHaveLength(2));
  fireEvent.click(g.markers[0].opts.content.querySelector("button"));
  fireEvent.click(screen.getByRole("button", { name: "Open in Google Maps" }));
  expect(onOpenUrl).toHaveBeenCalledTimes(3);
  expect(onOpenUrl.mock.calls[2][0]).toContain("query_place_id=ChIJ_test-123");
});

test("Google open is hidden without a callback; open-provider maps keep their old selection-only list", async () => {
  const { rerender } = render(<InteractiveMap map={map} host={host} />);
  expect(screen.queryByRole("button", { name: "Open in Google Maps" })).toBeNull();
  rerender(<InteractiveMap map={map} host={{}} onOpenUrl={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Open in Google Maps" })).toBeNull();
});

test.each([undefined, "ChIJ_test-123", "x".repeat(512)])("map reader keeps a valid optional place_id (%s)", place_id => {
  const visual = { ...map, places: [{ ...map.places[0], place_id }, map.places[1]] };
  expect(readMedia({ kind: "visual", visual } as any, host)).toBe(visual);
});
test.each(["", "x".repeat(513), "bad&query=other", 123])("map reader rejects malformed place_id (%s)", place_id => {
  expect(readMedia({ kind: "visual", visual: { ...map, places: [{ ...map.places[0], place_id }, map.places[1]] } } as any, host)).toBeUndefined();
});

test.each([undefined, "trip-itinerary", "places-nearby"])("card %s forwards its URL callback to the map, including expanded view", async template => {
  const onOpenUrl = vi.fn();
  const doc: HarsoOutputDocument = { template, header: { title: "Places" }, blocks: [
    { kind: "visual", visual: map },
    ...(template === "trip-itinerary" ? [{ kind: "text" as const, sections: [{ heading: "Greenwich", bullets: ["Royal Observatory", "Cutty Sark"] }] }] : []),
    ...(template === "places-nearby" ? [{ kind: "rows" as const, items: [{ id: "a", label: "Royal Observatory" }] }] : [])
  ], fallback_text: "Fallback" };
  render(<HarsoOutputCard document={doc} onViewAll={() => {}} onOpenUrl={onOpenUrl} media={host} />);
  if (template) expect(document.querySelector(template === "trip-itinerary" ? ".hkc-trip" : ".hkc-places")).not.toBeNull();
  fireEvent.click(await screen.findByRole("button", { name: "Open in Google Maps" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith("https://www.google.com/maps/search/?api=1&query=51.476853,-0.0005002");
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  fireEvent.click(screen.getByRole("button", { name: "Expand map" }));
  const dialog = screen.getByRole("dialog", { name: "Expanded map" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Open in Google Maps" }));
  expect(onOpenUrl).toHaveBeenCalledTimes(2);
});

test("without googleMaps the open map is used; a failed Google load offers retry and keeps the list", async () => {
  g.fail = true;
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await screen.findByText("Map unavailable. Explore the places in the list below.");
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /Cutty Sark/ }).length).toBeGreaterThan(0);
});
