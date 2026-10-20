import openSource from "./output-map.tsx?raw";
import googleSource from "./output-map-google.tsx?raw";
import mapCss from "./output-map.css?raw";
import { expect, test } from "vitest";
import { vectorStyle } from "./output-map-style";
import { watchMapColors } from "./output-map-colors";
import light from "../../design/google-map-style.json";
import dark from "../../design/google-map-style.dark.json";
import tokens from "../../tokens/harso.tokens.json";

const sources: Record<string, string> = { "./output-map.tsx": openSource, "./output-map-google.tsx": googleSource, "./output-map.css": mapCss };
const source = (file: string) => sources[file];

test("both providers use token-only pin/route colours, no category palette or floating name", () => {
  for (const file of ["./output-map.tsx", "./output-map-google.tsx"]) {
    const code = source(file);
    expect(code).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(code).not.toMatch(/COLORS|--pin-color|hkc-map-label/);
    expect(code).toContain("watchMapColors");
  }
  const css = source("./output-map.css");
  expect(css).toContain("border: 2px solid var(--hk-surface)");
  expect(css).toContain("background: var(--hk-ink)");
  expect(css).toContain('hkc-map-pin[aria-pressed="true"] { background: var(--hk-accent)');
  expect(css).toContain("width: 38px; height: 38px");
});

test("open cartography reads the host's computed tokens", () => {
  const kit = document.createElement("div"); kit.className = "harso-kit";
  const values = { ink: "ink", accent: "accent", surface: "surface", canvas: "canvas", line: "line", "accent-soft": "water" };
  for (const [name, value] of Object.entries(values)) kit.style.setProperty(`--hk-${name}`, value);
  const child = kit.appendChild(document.createElement("div")); document.body.append(kit);
  let colors: any;
  const stop = watchMapColors(child, value => { colors = value; });
  const layers = vectorStyle(colors).layers as any[];
  expect(layers.find(l => l.id === "background").paint["background-color"]).toBe("canvas");
  expect(layers.find(l => l.id === "water").paint["fill-color"]).toBe("water");
  expect(layers.find(l => l.id === "main-roads").paint["line-color"]).toBe("surface");
  stop(); kit.remove();
});

test.each([["light", light], ["dark", dark]] as const)("%s cloud style blends kit colours with Google's retained detail", (mode, style) => {
  expect(style.variant).toBe(mode);
  expect(style.backgroundColor).toBe(tokens.color.canvas[mode]);
  const rule = (id: string) => style.styles.find(s => s.id === id) as any;
  expect(rule("natural.land").geometry.fillColor).toBe(tokens.color.canvas[mode]);
  expect(rule("infrastructure.roadNetwork").geometry.fillColor).toBe(tokens.color.surface[mode]);
  expect(rule("infrastructure.building").geometry.fillColor).toBe(tokens.color.line[mode]);
  expect(rule("pointOfInterest").label.visible).toBeUndefined();
  for (const id of ["pointOfInterest.landmark", "pointOfInterest.entertainment", "pointOfInterest.recreation.park", "infrastructure.transitStation"]) expect(rule(id).label.visible).toBe(true);
  for (const category of ["retail", "foodAndDrink", "service", "lodging"]) expect(rule(`pointOfInterest.${category}`).label.visible).toEqual({ z00: false, z15: true });
  expect(rule("infrastructure.roadNetwork.road.local").label.visible).toEqual({ z00: false, z14: true });
});
