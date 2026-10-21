import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
// @ts-expect-error plain .mjs CI script, no type declarations
import { canonical, uploadable } from "../../scripts/map-style-sync.mjs";

test("uploaded style flattens zoom-keyed opacity to its z12 value, keeps zoom-keyed visibility", () => {
  const sheet = JSON.parse(uploadable(JSON.stringify({ styles: [
    { id: "a", label: { textFillOpacity: { z00: 0.5, z12: 0.8, z15: 1 }, visible: { z00: false, z14: true } } }] })));
  expect(sheet.styles[0].label).toEqual({ textFillOpacity: 0.8, visible: { z00: false, z14: true } });
});

test("both shipped design sheets upload with no zoom-keyed opacity left", () => {
  for (const file of ["design/google-map-style.json", "design/google-map-style.dark.json"])
    expect(uploadable(readFileSync(file, "utf8"))).not.toMatch(/Opacity":\{/);
});

test("a sheet Google re-ordered and stored as float32 compares equal; a real colour change does not", () => {
  const ours = JSON.stringify({ variant: "light", styles: [
    { id: "natural.land", geometry: { fillColor: "#fafafb" } }, { id: "infrastructure.building", geometry: { fillOpacity: 0.3 } }] });
  const google = JSON.stringify({ styles: [
    { geometry: { fillOpacity: 0.30000001 }, id: "infrastructure.building" }, { id: "natural.land", geometry: { fillColor: "#fafafb" } }],
    variant: "light" });
  expect(canonical(google)).toBe(canonical(ours));
  expect(canonical(google.replace("#fafafb", "#ffffff"))).not.toBe(canonical(ours));
});
