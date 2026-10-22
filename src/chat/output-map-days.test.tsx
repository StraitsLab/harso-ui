import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { mapForDay, readMedia, type HarsoOutputMap } from "./output-card-media";
import { HarsoOutputCard, type HarsoOutputDocument } from "./output-card";

afterEach(cleanup);

const place = (id: string, day: number, lat: string) => ({ id, label: id.toUpperCase(), lat, lon: "103.85", day });
const trip: HarsoOutputMap = { kind: "map", selected_place_id: "c", places: [place("a", 1, "1.28"), place("b", 1, "1.29"), place("c", 2, "1.30"), place("d", 3, "1.31"), place("e", 3, "1.32")],
  route: { mode: "walk", days: [{ day: 1, path: "_p~iF~ps|U_ulLnnqC", minutes: 12, meters: 900 }, { day: 3, path: "_p~iF~ps|U", minutes: 7, meters: 500 }] } };

test("a trip map shows one day: its pins and its own route, never a line between days", () => {
  expect(mapForDay(trip, 1)).toEqual({ kind: "map", selected_place_id: undefined, places: [{ id: "a", label: "A", lat: "1.28", lon: "103.85" }, { id: "b", label: "B", lat: "1.29", lon: "103.85" }],
    route: { mode: "walk", path: "_p~iF~ps|U_ulLnnqC", minutes: 12, meters: 900 } });
  // One stop: nothing to walk between, and the selection stays on that day.
  expect(mapForDay(trip, 2)).toMatchObject({ selected_place_id: "c", places: [{ id: "c" }], route: undefined });
  expect(mapForDay(trip, 3)?.route).toEqual({ mode: "walk", path: "_p~iF~ps|U", minutes: 7, meters: 500 });
  expect(mapForDay(trip, 4)).toBeUndefined();
  // No day picked: every pin, no route, rather than one straight line through five stops.
  expect(mapForDay(trip)).toMatchObject({ places: trip.places, route: undefined });
  // A map without days is untouched, and its route still draws.
  const plain: HarsoOutputMap = { kind: "map", places: [{ id: "x", label: "X", lat: "1", lon: "2" }, { id: "y", label: "Y", lat: "1.1", lon: "2" }], route: { mode: "walk" } };
  expect(mapForDay(plain, 2)).toBe(plain);
});

test("a day that failed to route draws no straight line", () => {
  const failed = { ...trip, route: { mode: "walk" as const, days: [{ day: 3, path: "_p~iF~ps|U" }] } };
  expect(mapForDay(failed, 1)?.route).toBeUndefined();
});

test("readMedia keeps whole-number days and refuses anything else", () => {
  expect(readMedia({ kind: "visual", visual: trip } as any, {})).toBe(trip);
  expect(readMedia({ kind: "visual", visual: { ...trip, places: [{ ...trip.places[0], day: 1.5 }, trip.places[1]] } } as any, {})).toBeUndefined();
});

const at = "2026-10-22T08:00:00+08:00";
const day = (n: number, area: string, stops: string[]) => ({ heading: `Day ${n} · ${area}`, date: `2026-11-0${n}`, bullets: stops });
const card: HarsoOutputDocument = {
  kind: "output_blocks", major: 1, template: "trip-itinerary", as_of: at, header: { title: "Singapore in 2 days" },
  blocks: [
    { kind: "text", sections: [day(1, "Civic District", ["09:00 A", "11:00 B"]), day(2, "Bugis", ["09:00 D", "11:00 E"])] },
    { kind: "visual", visual: { kind: "map", places: [place("a", 1, "1.28"), place("b", 1, "1.29"), place("d", 2, "1.31"), place("e", 2, "1.32")],
      route: { mode: "walk", days: [{ day: 1, path: "_p~iF~ps|U_ulLnnqC", minutes: 12, meters: 900 }, { day: 2, path: "_p~iF~ps|U", minutes: 7, meters: 500 }] } } }
  ]
} as unknown as HarsoOutputDocument;

test("the trip card's map follows the open day tab", async () => {
  render(<div className="harso-kit"><HarsoOutputCard document={card} onViewAll={() => {}} /></div>);
  const places = () => [...document.querySelectorAll(".hkc-output-map-places b")].map(node => node.textContent);
  await waitFor(() => expect(places()).toEqual(["A", "B"]));
  expect(document.querySelector("figcaption")?.textContent).toContain("Walking route · 12 min");
  fireEvent.click(screen.getByRole("tab", { name: /Day 2/ }));
  await waitFor(() => expect(places()).toEqual(["D", "E"]));
  expect(document.querySelector("figcaption")?.textContent).toContain("Walking route · 7 min");
});
