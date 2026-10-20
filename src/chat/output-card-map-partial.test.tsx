import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import InteractiveMap from "./output-map";
import { decodePolyline, mapCoordinates, mapBounds } from "./output-map-utils";
import { readMedia, type HarsoOutputMap } from "./output-card-media";

const calls = vi.hoisted(() => ({ options: [] as any[], sources: {} as Record<string, any>, layers: [] as any[], removed: 0, fail: false, decorationFail: false, fitted: false, loaded: false, autoLoad: true, events: {} as Record<string, (event?: any) => void> }));
vi.mock("maplibre-gl", () => ({
  setWorkerUrl() {},
  Map: class {
    constructor(options: any) { calls.options.push(options); if (calls.fail) throw new Error("No WebGL"); }
    touchZoomRotate = { disableRotation() {} };
    addControl() {} on(event: string, callback: () => void) { calls.events[event] = callback; if (event === "load" && calls.autoLoad) queueMicrotask(() => { calls.loaded = true; callback(); }); }
    loaded() { return calls.loaded; }
    getLayer() { return false; } setFilter() {} queryRenderedFeatures() { return []; }
    once(event: string, callback: () => void) { calls.events[event] = callback; } project() { return { x: 100, y: 100 }; }
    addSource(id: string, data: any) { calls.sources[id] = data; }
    addLayer(layer: any) { calls.layers.push(layer); }
    hasImage() { return false; }
    addImage() { if (calls.decorationFail) throw new Error("Decoration unavailable"); }
    fitBounds() { calls.fitted = true; } resize() {} triggerRepaint() {} remove() { calls.removed++; }
    getSource() { return { setData() {} }; }
  },
  Marker: class { constructor(private options: any) {} setLngLat() { return this; } addTo() { return this; } remove() {} getElement() { return this.options.element; } },
  AttributionControl: class {}, NavigationControl: class {}
}));
vi.stubGlobal("ImageData", class { data: Uint8ClampedArray; constructor(width: number, height: number) { this.data = new Uint8ClampedArray(width * height * 4); } });
vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
vi.stubGlobal("matchMedia", () => ({ matches: true }));
afterEach(() => { cleanup(); calls.options = []; calls.sources = {}; calls.layers = []; calls.fail = false; calls.decorationFail = false; calls.fitted = false; calls.autoLoad = true; calls.loaded = false; calls.events = {}; });
const map: HarsoOutputMap = { kind: "map", places: [
  { id: "a", label: "First place", lat: "38.5", lon: "-120.2", category: "Temple" },
  { id: "b", label: "Second place", lat: "40.7", lon: "-120.95", category: "Garden" }
], selected_place_id: "a", route: { mode: "walk", path: "_p~iF~ps|U_ulLnnqC_mqNvxq`@", minutes: 20, meters: 1800 } };

test("precision-five route decodes longitude first; malformed or unbounded paths never draw", () => {
  expect(decodePolyline(map.route!.path!)).toEqual([[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
  for (const bad of ["", "_", "abc!", "~".repeat(30), "?", "a".repeat(3001)]) expect(decodePolyline(bad)).toEqual([]);
});
test("dateline bounds take the short span and preserve place order", () => {
  const points = mapCoordinates({ kind: "map", places: [{ id: "e", label: "E", lat: "0", lon: "179.9" }, { id: "w", label: "W", lat: "0", lon: "-179.9" }] });
  expect(points).toEqual([[179.9, 0], [180.1, 0]]); expect(mapBounds(points)).toEqual([[179.9, 0], [180.1, 0]]);
});
test("maps require no host tile proxy and reject invalid coordinates or a one-place route", () => {
  expect(readMedia({ kind: "visual", visual: map } as any, {})).toBe(map);
  expect(readMedia({ kind: "visual", visual: { ...map, places: [map.places[0]] } } as any, {})).toBeUndefined();
  expect(readMedia({ kind: "visual", visual: { ...map, places: [{ ...map.places[0], lon: "181" }] } } as any, {})).toBeUndefined();
});
test("vector map uses cooperative gestures, decoded route and ordered list without floating labels", async () => {
  render(<div className="harso-kit"><InteractiveMap map={map} host={{}} /></div>);
  await waitFor(() => expect(calls.layers.some(l => l.id === "route")).toBe(true));
  expect(document.querySelector(".hkc-map-label")).toBeNull();
  expect(screen.queryByRole("button", { name: "Recenter" })).toBeNull();
  act(() => calls.events.movestart({ originalEvent: {} }));
  fireEvent.click(screen.getByRole("button", { name: "Recenter" }));
  expect(screen.queryByRole("button", { name: "Recenter" })).toBeNull();
  expect(calls.options[0]).toMatchObject({ scrollZoom: true, cooperativeGestures: true, dragRotate: false });
  expect(calls.sources.route.data.geometry.coordinates).toEqual(decodePolyline(map.route!.path!));
  const canvas = document.querySelector(".hkc-output-map-plane")!;
  const attribution = document.createElement("details"); attribution.className = "maplibregl-ctrl-attrib maplibregl-compact-show"; attribution.open = true; canvas.append(attribution);
  act(() => calls.events.idle());
  expect(attribution.open).toBe(true); // Later idle must not collapse a user's open attribution.

  expect(calls.layers.find(l => l.id === "route").paint["line-dasharray"]).toBeUndefined();
  expect(screen.getByText(/Walking route/).textContent).toContain("20 min · 1.8 km");
  const buttons = screen.getAllByRole("button", { name: /place/ });
  expect(buttons.map(b => b.textContent)).toEqual(["1First placeTemple", "2Second placeGarden"]);
  fireEvent.click(buttons[1]); expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByText("Straight lines, not streets")).toBeNull();
});
test("missing route path draws dashed ordered segments and the exact disclosure", async () => {
  render(<InteractiveMap map={{ ...map, route: { mode: "drive" } }} host={{}} />);
  await waitFor(() => expect(calls.sources.route).toBeTruthy());
  expect(calls.sources.route.data.geometry.coordinates).toEqual(mapCoordinates(map));
  expect(calls.layers.find(l => l.id === "route").paint["line-dasharray"]).toEqual([2, 2]);
  expect(screen.getByText("Straight lines, not streets")).toBeVisible();
});
test("tile and source errors after first load preserve the map", async () => {
  const { container } = render(<InteractiveMap map={map} host={{}} />);
  await waitFor(() => expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready'));
  act(() => calls.events.error({ tile: {}, sourceId: 'places' }));
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready');
  calls.loaded = false;
  act(() => calls.events.error({ error: new Error('Style unavailable') }));
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready');
  act(() => calls.events.sourcedata({ sourceId: 'places', sourceDataType: 'metadata' }));
  act(() => calls.events.error({ sourceId: 'places', error: new Error('Later source error') }));
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready');
});

test("a source failure reported after load still fails without basemap metadata", async () => {
  const { container } = render(<InteractiveMap map={map} host={{}} />);
  await waitFor(() => expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready'));
  act(() => calls.events.error({ sourceId: 'places', error: new Error('TileJSON unavailable') }));
  act(() => calls.events.idle());
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'failed');
});

test("route decoration failure still fits and readies the map", async () => {
  calls.decorationFail = true;
  const { container } = render(<InteractiveMap map={map} host={{}} />);
  await waitFor(() => expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'ready'));
  expect(calls.fitted).toBe(true);
  expect(calls.layers.some(l => l.id === "route")).toBe(true);
});

test.each([{}, { sourceId: 'openmaptiles' }])("startup style/source errors fail: %j", async event => {
  calls.autoLoad = false;
  const { container } = render(<InteractiveMap map={map} host={{}} />);
  await waitFor(() => expect(calls.events.error).toBeTypeOf('function'));
  // MapLibre marks its source loaded immediately before firing a startup error.
  calls.loaded = true;
  act(() => calls.events.error({ tile: {}, sourceId: 'openmaptiles' }));
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'loading');
  act(() => calls.events.error({ ...event, error: new Error('Startup unavailable') }));
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'failed');
  act(() => calls.events.idle());
  expect(container.querySelector('.hkc-map-surface')).toHaveAttribute('data-state', 'failed');
});

test("WebGL failure keeps readable selectable places, filtering and a working retry", async () => {
  calls.fail = true; render(<InteractiveMap map={map} host={{}} />);
  expect(await screen.findByText(/Map unavailable/)).toBeVisible();
  expect(screen.getByRole("button", { name: /First place/ })).toBeVisible();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Garden" } });
  expect(screen.queryByText("First place")).toBeNull(); expect(screen.getByText("Second place")).toBeVisible();
  const retry = await screen.findByRole("button", { name: "Try again" });
  calls.fail = false; fireEvent.click(retry);
  await waitFor(() => expect(screen.queryByText(/Map unavailable/)).toBeNull());
});
