import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import InteractiveMap from "./output-map";
import { readMedia, type HarsoOutputMap } from "./output-card-media";
import { HarsoOutputCard, type HarsoOutputDocument } from "./output-card";

// The Google surface talks to the Maps JavaScript API only through the official loader; fake it here.
const g = vi.hoisted(() => ({ zoom: 12, zooms: [] as number[], options: [] as any[], maps: [] as any[], markers: [] as any[], lines: [] as any[], fail: false, listeners: {} as Record<string, () => void> }));
vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: (o: any) => g.options.push(o),
  importLibrary: async (name: string) => {
    if (g.fail) throw new Error("load failed");
    if (name === "maps") return {
      Map: class { constructor(_el: any, public opts: any) { g.maps.push(opts); }
        addListener(event: string, cb: () => void) { g.listeners[event] = cb; if (event === "tilesloaded") queueMicrotask(cb); return { remove() {} }; }
        setOptions(opts: any) { Object.assign(this.opts, opts); }
        fitBounds() {} getZoom() { return g.zoom; } setZoom(z: number) { g.zooms.push(z); } },
      Polyline: class { constructor(public opts: any) { g.lines.push(opts); } setMap() {} setOptions(opts: any) { Object.assign(this.opts, opts); } }
    };
    if (name === "marker") return { CollisionBehavior: { REQUIRED_AND_HIDES_OPTIONAL: "required-hides" }, AdvancedMarkerElement: class { map: any; zIndex = 0; constructor(public opts: any) { this.map = opts.map; g.markers.push(this); } } };
    return { ColorScheme: { DARK: "DARK", LIGHT: "LIGHT" }, CollisionBehavior: { REQUIRED_AND_HIDES_OPTIONAL: "required-hides" }, ControlPosition: { RIGHT_TOP: 7 },
      SymbolPath: { FORWARD_CLOSED_ARROW: 1 }, LatLngBounds: class { extend() {} } };
  }
}));
vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
vi.stubGlobal("matchMedia", () => ({ matches: true }));
afterEach(() => { cleanup(); g.zoom = 12; g.zooms = []; g.options = []; g.maps = []; g.markers = []; g.lines = []; g.fail = false; g.listeners = {}; });

test("one Google constructor survives filtering, expand/collapse, selection, tint and overlay changes", async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  const categorized = { ...map, places: map.places.map((p, i) => ({ ...p, category: i ? "Temple" : "Market" })) };
  const { container, rerender } = render(<div className="harso-kit"><InteractiveMap map={categorized} host={host} /></div>);
  await waitFor(() => expect(g.maps).toHaveLength(1));
  const surface = container.querySelector("[data-provider=google]");
  fireEvent.change(screen.getByLabelText("Filter places by category"), { target: { value: "Temple" } });
  await waitFor(() => expect(g.markers.filter(m => m.map)).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: "Expand map" }));
  await waitFor(() => expect(g.maps[0].cameraControl).toBe(true));
  expect(screen.getByRole("dialog").contains(surface)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Collapse map" }));
  await waitFor(() => expect(g.maps[0].cameraControl).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: /2.*Cutty Sark/ }));
  act(() => (container.firstChild as HTMLElement).style.setProperty("--hk-accent", "rgb(179, 60, 92)"));
  rerender(<div className="harso-kit"><InteractiveMap map={{ ...categorized, route: { mode: "drive" } }} host={host} /></div>);
  await waitFor(() => expect(g.lines.at(-1).strokeOpacity).toBe(0));
  expect(container.querySelector("[data-provider=google]")).toBe(surface);
  expect(g.maps).toHaveLength(1);
  act(() => (container.firstChild as HTMLElement).setAttribute("data-mode", "dark"));
  await waitFor(() => expect(g.maps.at(-1).colorScheme).toBe("DARK"));
  expect(g.maps).toHaveLength(2);
});

test("nearby pins and family rows share selection; the row name is keyboard selectable", async () => {
  const doc: HarsoOutputDocument = { template: "places-nearby", header: { title: "Nearby" }, blocks: [
    { kind: "visual", visual: map }, { kind: "rows", items: map.places.map(p => ({ id: p.id, label: p.label, thumbnail: { artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000001", alt: p.label } })) }
  ], fallback_text: "Nearby" };
  render(<HarsoOutputCard document={doc} onViewAll={() => {}} media={{ ...host, resolveArtifact: () => "https://photos.test/place.jpg" }} />);
  await waitFor(() => expect(g.markers).toHaveLength(2));
  fireEvent.click(g.markers[1].opts.content.querySelector("button"));
  expect(document.querySelector('.hkc-place[aria-current="true"]')).toHaveTextContent("Cutty Sark");
  fireEvent.click(screen.getByRole("button", { name: "Royal Observatory" }));
  expect(g.markers[0].opts.content.querySelector("button")).toHaveAttribute("aria-pressed", "true");
  expect(document.querySelector('.hkc-place[aria-current="true"]')).toHaveTextContent("Royal Observatory");
  fireEvent.click(screen.getByRole("button", { name: "Select Cutty Sark" }));
  expect(g.markers[1].opts.content.querySelector("button")).toHaveAttribute("aria-pressed", "true");
  expect(document.querySelector('.hkc-place[aria-current="true"]')).toHaveTextContent("Cutty Sark");
});

const map: HarsoOutputMap = { kind: "map", selected_place_id: "a", places: [
  { id: "a", label: "Royal Observatory", lat: "51.476853", lon: "-0.0005002" },
  { id: "b", label: "Cutty Sark", lat: "51.4828646", lon: "-0.0095917" }
], route: { mode: "walk", path: "_p~iF~ps|U_ulLnnqC", minutes: 20, meters: 1489 } };
const host = { googleMaps: { key: "test-key", mapId: "map-id" } };

test("host googleMaps draws one Google vector map with numbered pins, a street route and arrows", async () => {
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await waitFor(() => expect(document.querySelector("[data-provider=google]")?.getAttribute("data-state")).toBe("ready"));
  expect(g.options.every(option => option.key === "test-key")).toBe(true);
  expect(g.maps).toHaveLength(1);
  expect(g.maps[0]).toMatchObject({ mapId: "map-id", gestureHandling: "cooperative", colorScheme: "LIGHT", clickableIcons: false });
  expect(g.markers.map(m => m.opts.title)).toEqual(["Royal Observatory", "Cutty Sark"]);
  const pins = g.markers.map(m => m.opts.content.querySelector(".hkc-map-pin") as HTMLButtonElement);
  expect(pins.map(p => p.textContent)).toEqual(["1", "2"]);
  expect(pins[0]).toHaveAttribute("aria-pressed", "true");
  expect(g.markers.every(m => !m.opts.content.querySelector(".hkc-map-label"))).toBe(true);
  expect(g.markers.every(m => m.opts.collisionBehavior === "required-hides")).toBe(true);
  expect(document.querySelector("figcaption strong")?.textContent).toBe("Royal Observatory");
  const list = screen.getByRole("list", { name: "Places" });
  expect(list.tagName).toBe("OL");
  expect(list.querySelector(".hkc-map-place-icon")).toBeNull();
  expect(g.maps[0]).toMatchObject({ zoomControl: false, cameraControl: false, keyboardShortcuts: false });
  expect(screen.queryByRole("button", { name: "Recenter" })).toBeNull();
  act(() => g.listeners.dragstart());
  fireEvent.click(screen.getByRole("button", { name: "Recenter" }));
  expect(screen.queryByRole("button", { name: "Recenter" })).toBeNull();
  const route = g.lines[1];
  expect(route.path).toHaveLength(2);
  expect(route.icons[0].icon.path).toBe(1);
  fireEvent.click(pins[1]);
  await waitFor(() => expect(pins[1]).toHaveAttribute("aria-pressed", "true"));
  expect(pins[0]).toHaveAttribute("aria-pressed", "false");
  expect(document.querySelector("figcaption")?.textContent).toContain("Cutty Sark");
});

test("Google route colours follow computed kit tokens without creating another billed map", async () => {
  const { container } = render(<div className="harso-kit" style={{ "--hk-accent": "rgb(1, 121, 91)", "--hk-surface": "rgb(255, 255, 255)" } as React.CSSProperties}><InteractiveMap map={map} host={host} /></div>);
  await waitFor(() => expect(g.lines).toHaveLength(2));
  expect(g.lines[0].strokeColor).toBe("rgb(255, 255, 255)");
  expect(g.lines[1].strokeColor).toBe("rgb(1, 121, 91)");
  act(() => (container.firstChild as HTMLElement).style.setProperty("--hk-accent", "rgb(179, 60, 92)"));
  await waitFor(() => expect(g.lines[1].strokeColor).toBe("rgb(179, 60, 92)"));
  expect(g.maps).toHaveLength(1);
});

test("category changes glyph, never pin colour; fallback is dashed accent", async () => {
  render(<div className="harso-kit" style={{ "--hk-accent": "rgb(1, 121, 91)" } as React.CSSProperties}><InteractiveMap map={{ ...map, route: { mode: "walk" }, places: map.places.map((p, i) => ({ ...p, category: i ? "Temple" : "Market" })) }} host={host} /></div>);
  await waitFor(() => expect(g.markers).toHaveLength(2));
  expect(g.markers.every(m => !m.opts.content.querySelector("button").style.getPropertyValue("--pin-color"))).toBe(true);
  expect(g.lines[1]).toMatchObject({ strokeOpacity: 0, icons: [{ icon: { strokeColor: "rgb(1, 121, 91)" } }] });
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
  await waitFor(() => expect(g.maps.at(-1)).toMatchObject({ zoomControl: true, cameraControl: true, rotateControl: true, tiltInteractionEnabled: true, headingInteractionEnabled: true, clickableIcons: true, keyboardShortcuts: true }));
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

test("close places fit to street zoom 16 so neighbouring pins separate, never closer", async () => {
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await waitFor(() => expect(g.listeners.idle).toBeTypeOf("function"));
  g.zoom = 15.4; act(() => g.listeners.idle());
  expect(g.zooms).toEqual([]);
  cleanup(); g.listeners = {};
  render(<div className="harso-kit"><InteractiveMap map={map} host={host} /></div>);
  await waitFor(() => expect(g.listeners.idle).toBeTypeOf("function"));
  g.zoom = 19; act(() => g.listeners.idle());
  expect(g.zooms).toEqual([16]);
});

test("switching trip days keeps one billed Google map and draws only that day's route", async () => {
  const stop = (id: string, day: number, lat: string) => ({ id, label: id.toUpperCase(), lat, lon: "-0.0005", day });
  const trip: HarsoOutputMap = { kind: "map", places: [stop("a", 1, "51.47"), stop("b", 1, "51.48"), stop("c", 2, "51.49"), stop("d", 2, "51.50")],
    route: { mode: "walk", days: [{ day: 1, path: "_p~iF~ps|U_ulLnnqC", minutes: 12 }, { day: 2, path: "_p~iF~ps|U_ulLnnqC_mqNvxq`@", minutes: 7 }] } };
  const doc: HarsoOutputDocument = { template: "trip-itinerary", header: { title: "Two days" }, blocks: [
    { kind: "text", sections: [{ heading: "Day 1 · Greenwich", bullets: ["A", "B"] }, { heading: "Day 2 · Docklands", bullets: ["C", "D"] }] },
    { kind: "visual", visual: trip }], fallback_text: "Fallback" };
  render(<div className="harso-kit"><HarsoOutputCard document={doc} onViewAll={() => {}} media={host} /></div>);
  await waitFor(() => expect(g.markers.filter(m => m.map).map(m => m.opts.title)).toEqual(["A", "B"]));
  expect(g.lines.at(-1).path).toHaveLength(2);
  fireEvent.click(screen.getByRole("tab", { name: /Day 2/ }));
  await waitFor(() => expect(g.markers.filter(m => m.map).map(m => m.opts.title)).toEqual(["C", "D"]));
  expect(g.lines.at(-1).path).toHaveLength(3);
  expect(g.maps).toHaveLength(1);
});
