import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import InteractiveMap from "./output-map";
import { decodePolyline, mapCoordinates, mapBounds } from "./output-map-utils";
import { readMedia, type HarsoOutputMap } from "./output-card-media";

const calls = vi.hoisted(() => ({ options: [] as any[], sources: {} as Record<string, any>, layers: [] as any[], removed: 0, fail: false }));
vi.mock("maplibre-gl", () => ({
  setWorkerUrl() {},
  Map: class {
    constructor(options: any) { calls.options.push(options); if (calls.fail) throw new Error("No WebGL"); }
    touchZoomRotate = { disableRotation() {} };
    addControl() {} on(event: string, callback: () => void) { if (event === "load") queueMicrotask(callback); }
    once() {} project() { return { x: 100, y: 100 }; }
    addSource(id: string, data: any) { calls.sources[id] = data; }
    addLayer(layer: any) { calls.layers.push(layer); }
    fitBounds() {} resize() {} triggerRepaint() {} remove() { calls.removed++; }
    getSource() { return { setData() {} }; }
  },
  Marker: class { constructor(private options: any) {} setLngLat() { return this; } addTo() { return this; } remove() {} getElement() { return this.options.element; } },
  AttributionControl: class {}, NavigationControl: class {}
}));
vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
vi.stubGlobal("matchMedia", () => ({ matches: true }));
afterEach(() => { cleanup(); calls.options = []; calls.sources = {}; calls.layers = []; calls.fail = false; });
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
test("vector map uses cooperative gestures, decoded route, collision-managed labels and ordered list", async () => {
  render(<div className="harso-kit"><InteractiveMap map={map} host={{}} /></div>);
  await waitFor(() => expect(calls.layers.some(l => l.id === "route")).toBe(true));
  expect(calls.options[0]).toMatchObject({ scrollZoom: false, cooperativeGestures: true, dragRotate: false });
  expect(calls.sources.route.data.geometry.coordinates).toEqual(decodePolyline(map.route!.path!));
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
test("WebGL failure keeps readable selectable places, filtering and a working retry", async () => {
  calls.fail = true; render(<InteractiveMap map={map} host={{}} />);
  expect(await screen.findByText(/Map unavailable/)).toBeVisible();
  expect(screen.getByText("First place")).toBeVisible();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Garden" } });
  expect(screen.queryByText("First place")).toBeNull(); expect(screen.getByText("Second place")).toBeVisible();
  const retry = await screen.findByRole("button", { name: "Try again" });
  calls.fail = false; fireEvent.click(retry);
  await waitFor(() => expect(screen.queryByText(/Map unavailable/)).toBeNull());
});
