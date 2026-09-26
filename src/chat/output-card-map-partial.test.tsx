import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";

// Regression (PR #12 round 2, reviewer F2): a map discloses a known failed tile immediately, even while sibling tiles
// are still loading; "Couldn't load the map" (full failure) is reserved for every tile settled and none drawn.
// Reviewer counterexample: real Chrome tiles [loading, ready, ready, failed] reported data-state=ready with no note.

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const host: chat.HarsoOutputMediaHost = {
  resolveArtifact: artifact => `https://files.test/${artifact.slice(9)}`,
  onOpenArtifact: vi.fn(),
  mapTile: (z, x, y) => `https://tile.test/${z}/${x}/${y}.png`
};
const tokyo: chat.HarsoOutputBlock = { kind: "visual", visual: { kind: "map", selected_place_id: "ueno", places: [
  { id: "ueno", label: "Ueno", lat: "35.7141", lon: "139.7774" }, { id: "asakusa", label: "Asakusa", lat: "35.7148", lon: "139.7967" },
  { id: "shinjuku", label: "Shinjuku", lat: "35.6938", lon: "139.7034" }] } };
const doc: chat.HarsoOutputDocument = { kind: "output_blocks", major: 1, header: { title: "Card" }, blocks: [tokyo], fallback_text: "FALLBACK" };

function mount() {
  const view = render(<chat.HarsoOutputCard document={doc} media={host} onViewAll={vi.fn()} />);
  const tiles = [...view.container.querySelectorAll<HTMLImageElement>(".hkc-output-map-tile")];
  const state = () => view.container.querySelector(".hkc-output-map")?.getAttribute("data-state");
  const note = () => screen.queryByText("Part of the map didn’t load");
  return { view, tiles, state, note };
}

test("ready + failed + still-loading tiles: the partial note shows at once, the drawn tiles stay", () => {
  const { tiles, state, note } = mount();
  expect(tiles.length).toBeGreaterThanOrEqual(3);
  fireEvent.load(tiles[0]); fireEvent.error(tiles[1]); // tiles[2..] still loading
  expect(state()).toBe("partial");
  expect(note()).toBeTruthy();
  expect(tiles[0].isConnected).toBe(true);
  expect(screen.queryByText("Couldn’t load the map")).toBeNull();
});

test("failed + still-loading (nothing drawn yet): disclose the failure, never the full-failure card", () => {
  const { tiles, state, note } = mount();
  fireEvent.error(tiles[0]);
  expect(state()).toBe("partial");
  expect(note()).toBeTruthy();
  expect(screen.queryByText("Couldn’t load the map")).toBeNull();
});

test("ready + loading with no failure is still ready (no premature note)", () => {
  const { tiles, state, note } = mount();
  fireEvent.load(tiles[0]);
  expect(state()).toBe("ready");
  expect(note()).toBeNull();
});

test("every tile settled and none drawn: the full failure card with Try again", () => {
  const { tiles } = mount();
  for (const tile of tiles) fireEvent.error(tile);
  expect(screen.getByText("Couldn’t load the map")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
});
