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
  expect(css).toContain("background: var(--hkc-map-unselected, var(--hk-ink))");
  expect(css).toContain('hkc-map-pin[aria-pressed="true"] { background: var(--hk-accent)');
  expect(css).toContain("width: 38px; height: 38px");
});

test.each([
  ["light graphite", "#1f2226", "rgb(31, 34, 38)", "#5b6067", true],
  ["dark graphite", "#f1f2f3", "rgb(241, 242, 243)", "#a9adb2", true],
  ["coloured tint", "#1f2226", "#20745a", "#5b6067", false]
] as const)("%s pins use secondary only when resolved accent equals ink", async (_mode, ink, accent, secondary, graphite) => {
  const kit = document.createElement("div"); kit.className = "harso-kit";
  kit.style.setProperty("--hk-ink", ink);
  kit.style.setProperty("--hk-accent", accent);
  kit.style.setProperty("--hk-secondary", secondary);
  document.body.append(kit);
  const child = kit.appendChild(document.createElement("div"));
  const stop = watchMapColors(child, () => {});
  expect(child.style.getPropertyValue("--hkc-map-unselected")).toBe(graphite ? "var(--hk-secondary)" : "var(--hk-ink)");
  kit.style.setProperty("--hk-accent", "#20745a");
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(child.style.getPropertyValue("--hkc-map-unselected")).toBe("var(--hk-ink)");
  stop(); kit.remove();
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
