import { describe, expect, test } from "vitest";
import { load, renderKotlin, renderSwift, renderTheme, staleOutputs } from "../scripts/gen-tokens.mjs";
import source from "../tokens/harso.tokens.json";
import theme from "./theme.css?raw";

// What a person sees on desktop is the cascade of theme.css's .harso-kit rules for one appearance. This resolves that
// cascade independently of the generator (rules matched by their data attributes, later rule wins at equal weight,
// var() substituted), so a generator change that moves any --hk-* value in any appearance fails here.
const appearances = {
  light: { mode: "light", palette: "clean" },
  dark: { mode: "dark", palette: "clean" },
  cozy: { mode: "light", palette: "cozy" },
  darkCozy: { mode: "dark", palette: "cozy" },
} as const;
type Appearance = keyof typeof appearances;

const topLevelRules = (css: string) => {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: { selector: string; body: string }[] = [];
  let depth = 0, start = 0, selector = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") { if (depth++ === 0) { selector = text.slice(start, i).trim(); start = i + 1; } }
    else if (text[i] === "}") { if (--depth === 0) { rules.push({ selector, body: text.slice(start, i) }); start = i + 1; } }
    else if (depth === 0 && text[i] === ";") start = i + 1;
  }
  return rules;
};

const cascade = (css: string, appearance: Appearance) => {
  const { mode, palette } = appearances[appearance];
  const matched = topLevelRules(css).flatMap((rule, order) => {
    const found = /^\.harso-kit((?:\[data-(?:mode|palette)="[a-z]+"\])*)$/.exec(rule.selector);
    if (!found) return [];
    const attrs = [...found[1].matchAll(/\[data-(mode|palette)="([a-z]+)"\]/g)];
    const applies = attrs.every(([, key, value]) => (key === "mode" ? mode : palette) === value);
    return applies ? [{ weight: attrs.length, order, body: rule.body }] : [];
  }).sort((a, b) => a.weight - b.weight || a.order - b.order);
  const declared: Record<string, string> = {};
  for (const { body } of matched) {
    for (const [, name, value] of body.matchAll(/(--hk-[a-z0-9-]+)\s*:\s*([^;]+)/g)) declared[name] = value.trim().replace(/\s+/g, " ");
  }
  const resolve = (value: string, seen: string[]): string => value.replace(/var\((--hk-[a-z0-9-]+)\)/g, (_, name: string) => {
    if (seen.includes(name) || !(name in declared)) throw new Error(`unresolvable ${name} in ${appearance}`);
    return resolve(declared[name], [...seen, name]);
  });
  return Object.fromEntries(Object.keys(declared).sort().map(name => [name, resolve(declared[name], [name])]));
};

describe("design tokens", () => {
  test.each(Object.keys(appearances) as Appearance[])("theme.css resolves every --hk-* value unchanged in %s", appearance => {
    const resolved = cascade(theme, appearance);
    expect(Object.keys(resolved).length).toBeGreaterThan(60);
    expect(resolved).toMatchSnapshot();
  });

  test("every generated file matches tokens/harso.tokens.json (a hand edit or a stale file fails)", () => {
    expect(staleOutputs()).toEqual([]);
  });

  test("the generator's theme.css resolves to the values the JSON gives, in every appearance", () => {
    const tokens = load();
    const generated = renderTheme(tokens, theme);
    for (const appearance of Object.keys(appearances) as Appearance[]) {
      const resolved = cascade(generated, appearance);
      expect(resolved["--hk-canvas"]).toBe(source.color.canvas[appearance]);
      expect(resolved["--hk-accent"]).toBe(source.color.accent[appearance]);
    }
  });

  test("a changed value in one appearance reaches only that appearance's CSS and the natives", () => {
    const edited = structuredClone(source);
    edited.color.positive.darkCozy = "#00ff00";
    const tokens = load(edited);
    const generated = renderTheme(tokens, theme);
    expect(cascade(generated, "darkCozy")["--hk-positive"]).toBe("#00ff00");
    for (const other of ["light", "dark", "cozy"] as const) expect(cascade(generated, other)["--hk-positive"]).toBe(cascade(theme, other)["--hk-positive"]);
    expect(renderSwift(tokens)).toContain("positive: Color(harsoLight: 0x206636, dark: 0x00ff00)");
    expect(renderKotlin(tokens)).toMatch(/val HarsoCozyDarkColors = HarsoColors\([\s\S]*?positive = Color\(0xFF00FF00\)/);
  });

  test("hand-written rules outside the token regions survive generation", () => {
    const withRule = theme.replace(".hk-sr-only {", ".hk-probe { color: red; }\n.hk-sr-only {");
    expect(renderTheme(load(), withRule)).toContain(".hk-probe { color: red; }");
  });

  test("a token region moved out of its appearance's rule is refused", () => {
    const moved = theme.replace('.harso-kit[data-palette="cozy"] {', '.harso-kit[data-palette="warm"] {');
    expect(() => renderTheme(load(), moved)).toThrow(/cozy region must sit inside/);
  });

  test("a colour the native platforms cannot draw is refused", () => {
    const edited = structuredClone(source);
    edited.color.ink.dark = "hsl(0 0% 95%)";
    expect(() => renderSwift(load(edited))).toThrow(/not a colour/);
  });

  test("every Sea Glass tint gives light and dark accent, mark and soft to both natives", () => {
    const tokens = load();
    const swift = renderSwift(tokens), kotlin = renderKotlin(tokens);
    expect(tokens.tints.map(tint => tint.name)).toEqual(["grayscale", "jade", "ruby", "amber", "citrine", "lagoon", "blue", "violet"]);
    for (const tint of tokens.tints) {
      for (const role of ["accent", "accent-mark", "accent-soft"] as const) {
        expect(swift).toContain(`case .${tint.name}: Color(harsoLight: 0x${tint.light[role].slice(1)}, dark: 0x${tint.dark[role].slice(1)})`);
        expect(kotlin).toContain(`Color(0xFF${tint.light[role].slice(1).toUpperCase()})`);
      }
    }
  });
});
