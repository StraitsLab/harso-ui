import { describe, expect, test } from "vitest";
import { load, renderKotlin, renderSwift, renderTheme, staleOutputs } from "../scripts/gen-tokens.mjs";
import source from "../tokens/harso.tokens.json";
import swiftFile from "../tokens/generated/HarsoTokens.swift?raw";
import kotlinFile from "../tokens/generated/HarsoTokens.kt?raw";
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

// The natives are read back from their generated text and compared with what the desktop resolves, per appearance and
// role, so a generator that writes the right values under the wrong mode, palette or role fails. Colours are
// normalised to rrggbb plus alpha as an 8-bit byte (Compose stores alpha that way; Swift's 3-decimal alpha rounds to
// the same byte).
type Rgba = string;
const byte = (alpha: number) => Math.round(alpha * 255).toString(16).padStart(2, "0");
const cssColor = (value: string): Rgba => {
  let found;
  if ((found = /^#([0-9a-f]{6})$/.exec(value))) return `${found[1]}/ff`;
  if ((found = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value))) {
    return `${found.slice(1, 4).map(channel => Number(channel).toString(16).padStart(2, "0")).join("")}/${byte(Number(found[4]))}`;
  }
  if ((found = /^color-mix\(in srgb, (#[0-9a-f]{6}|rgb\([^)]*\)) (\d+)%, transparent\)$/.exec(value))) {
    const [rgb, alpha] = cssColor(found[1]).split("/");
    return `${rgb}/${byte(parseInt(alpha, 16) / 255 * Number(found[2]) / 100)}`;
  }
  throw new Error(`test cannot read colour ${value}`);
};
const swiftPart = (rgb: string, alpha?: string) => `${rgb}/${byte(alpha === undefined ? 1 : Number(alpha))}`;
const SWIFT_COLOR = /Color\(harsoLight: 0x([0-9a-f]{6})(?:, ([\d.]+))?, dark: 0x([0-9a-f]{6})(?:, ([\d.]+))?\)/;
const swiftColor = (text: string) => {
  const found = SWIFT_COLOR.exec(text);
  if (!found) throw new Error(`no Swift colour in ${text}`);
  return { light: swiftPart(found[1], found[2]), dark: swiftPart(found[3], found[4]) };
};
const kotlinColor = (text: string): Rgba => {
  const found = /^Color\(0x([0-9A-F]{2})([0-9A-F]{6})\)$/.exec(text.trim());
  if (!found) throw new Error(`not a Compose ARGB colour: ${text}`);
  return `${found[2].toLowerCase()}/${found[1].toLowerCase()}`;
};
const camel = (name: string) => name.replace(/-([a-z0-9])/g, (_, next: string) => next.toUpperCase());
const pascal = (name: string) => camel(name).replace(/^./, first => first.toUpperCase());
const block = (text: string, opening: string, closing = "\n)") => {
  const start = text.indexOf(opening);
  if (start < 0) throw new Error(`missing ${opening}`);
  return text.slice(start + opening.length, text.indexOf(closing, start));
};
const COLOR_ROLES = Object.keys(source.color).filter(key => !key.startsWith("$"));
const TINT_ROLES = ["accent", "accent-mark", "accent-soft"] as const;
const TINTS = Object.keys(source.tint).filter(key => !key.startsWith("$"));
const desktopColors = (appearance: Appearance) => {
  const resolved = cascade(theme, appearance);
  return Object.fromEntries(COLOR_ROLES.map(role => [role, cssColor(resolved[`--hk-${role}`])]));
};

// Swift: palette -> role -> {light, dark}; tint -> role -> {light, dark}; enum -> constant -> number.
const readSwift = (swift: string) => {
  const palette = (name: string) => Object.fromEntries(block(swift, `public static let ${name} = Harso(\n`, "\n        )").split("\n")
    .map(line => { const [, role, rest] = /^\s*(\w+): (.*?),?$/.exec(line)!; return [role, swiftColor(rest)]; }));
  const tints: Record<string, Record<string, { light: Rgba; dark: Rgba }>> = {};
  for (const [, role, body] of swift.matchAll(/public var (\w+): Color \{\n\s*switch self \{\n([\s\S]*?)\n\s*\}\n\s*\}/g)) {
    for (const [, tint, rest] of body.matchAll(/case \.(\w+): (.*)/g)) (tints[tint] ??= {})[role] = swiftColor(rest);
  }
  const constants = (name: string) => Object.fromEntries([...block(swift, `public enum ${name} {`, "\n}").matchAll(/public static let (\w+): CGFloat = ([\d.]+)/g)]
    .map(([, key, value]) => [key, Number(value)]));
  return { palette, tints, constants };
};

// Kotlin: palette val -> role -> colour; tint -> mode -> role -> colour (argument order read from the declarations).
const readKotlin = (kotlin: string) => {
  const palette = (name: string) => Object.fromEntries(block(kotlin, `val ${name} = HarsoColors(\n`).split("\n")
    .map(line => { const [, role, rest] = /^\s*(\w+) = (.*?),?$/.exec(line)!; return [role, kotlinColor(rest)]; }));
  const params = (declaration: RegExp) => [...(declaration.exec(kotlin)?.[1] ?? "").matchAll(/val (\w+):/g)].map(([, name]) => name);
  const accentFields = params(/data class HarsoAccent\(([^)]*)\)/);
  const modes = params(/enum class HarsoTint\(([^)]*)\)/);
  const tints: Record<string, Record<string, Record<string, Rgba>>> = {};
  for (const [, tint, args] of block(kotlin, "enum class HarsoTint(", "\n    ;").matchAll(/^ {4}([A-Z]\w*)\((.*)\),$/gm)) {
    [...args.matchAll(/HarsoAccent\(((?:Color\(0x[0-9A-F]{8}\)(?:, )?)+)\)/g)].forEach(([, colours], index) => {
      const values = colours.split(", ").map(kotlinColor);
      (tints[tint] ??= {})[modes[index]] = Object.fromEntries(accentFields.map((field, at) => [field, values[at]]));
    });
  }
  const constants = (name: string) => Object.fromEntries([...block(kotlin, `object ${name} {`, "\n}").matchAll(/val (\w+) = ([\d.]+)\.(dp|sp|em)/g)]
    .map(([, key, value, unit]) => [key, `${Number(value)}${unit}`]));
  return { palette, tints, constants };
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

  // Each case edits one value; load() must refuse it before any output is written. A browser clamps or drops these
  // while a native would pack them into a different colour, so the generator fails closed.
  test.each([
    ["red channel 256 in a role", (s: typeof source) => { s.color.glass.dark = "rgb(256 0 0 / .5)"; }, /channel must be 0 to 255/],
    ["green channel 300 in a role", (s: typeof source) => { s.color.glass.light = "rgb(0 300 0 / .5)"; }, /channel must be 0 to 255/],
    ["blue channel 999 in a role", (s: typeof source) => { s.color.glass.darkCozy = "rgb(0 0 999 / .5)"; }, /channel must be 0 to 255/],
    ["channel 256 in a tint", (s: typeof source) => { s.tint.jade.dark.accent = "rgb(0 256 0 / 1)"; }, /channel must be 0 to 255/],
    ["opacity 150% on a reference", (s: typeof source) => { s.color.glass.dark = "{ink} / 150%"; }, /opacity must be 0% to 100%/],
    ["opacity 101% on a reference", (s: typeof source) => { s.color["field-tint"].cozy = "{ink} / 101%"; }, /opacity must be 0% to 100%/],
    ["a tint with a third mode", (s: typeof source) => { Object.assign(s.tint.jade, { cozy: s.tint.jade.light }); }, /tint jade must set exactly light, dark/],
    ["a tint missing its dark mode", (s: typeof source) => { delete (s.tint.jade as Partial<typeof s.tint.jade>).dark; }, /tint jade must set exactly light, dark/],
    ...(["type/text-body/14px", "type/caps-tracking/.06em", "space/space-1/4px", "radius/radius-card/12px"].map(path => {
      const [group, name, value] = path.split("/") as ["type" | "space" | "radius", string, string];
      return [`a per-appearance ${group} value (${name})`, (s: typeof source) => {
        (s[group] as Record<string, unknown>)[name] = { light: value, dark: value, cozy: value, darkCozy: value };
      }, new RegExp(`--hk-${name} is a native ${group} constant`)] as const;
    })),
  ] as const)("refuses %s", (_, edit, message) => {
    const edited = structuredClone(source);
    edit(edited);
    expect(() => load(edited)).toThrow(message);
  });

  test("accepts the edges of every colour range", () => {
    const edited = structuredClone(source);
    edited.color.glass = { light: "rgb(255 255 255 / 1)", dark: "rgb(0 0 0 / 0)", cozy: "{ink} / 100%", darkCozy: "{ink} / 0%" };
    edited.tint.jade.dark.accent = "rgb(255 0 255 / 1)";
    const tokens = load(edited);
    expect(readSwift(renderSwift(tokens)).palette("clean").glass).toEqual({ light: "ffffff/ff", dark: "000000/00" });
    expect(readKotlin(renderKotlin(tokens)).palette("HarsoCozyDarkColors").glass).toBe("f3ede3/00");
    expect(readKotlin(renderKotlin(tokens)).tints.Jade.dark.accent).toBe("ff00ff/ff");
  });

  // The committed native files, read back, against independent expectations: the desktop's resolved cascade (pinned by
  // the snapshots above) for palettes and dimensions, the JSON for tints (the desktop's tints live in weave-cloud).
  describe("the committed natives say what the desktop says, per appearance and role", () => {
    const swift = readSwift(swiftFile), kotlin = readKotlin(kotlinFile);
    const roles = (colors: Record<string, Rgba>) => Object.fromEntries(COLOR_ROLES.map(role => [camel(role), colors[role]]));

    test.each([["clean", "light", "dark"], ["cozy", "cozy", "darkCozy"]] as const)("Swift %s palette: light and dark per role", (palette, light, dark) => {
      const lights = desktopColors(light), darks = desktopColors(dark);
      expect(swift.palette(palette)).toEqual(Object.fromEntries(COLOR_ROLES.map(role => [camel(role), { light: lights[role], dark: darks[role] }])));
    });

    test.each([["HarsoLightColors", "light"], ["HarsoDarkColors", "dark"], ["HarsoCozyLightColors", "cozy"], ["HarsoCozyDarkColors", "darkCozy"]] as const)("Kotlin %s is the desktop's %s", (name, appearance) => {
      expect(kotlin.palette(name)).toEqual(roles(desktopColors(appearance)));
    });

    test("every Sea Glass tint gives light and dark accent, mark and soft to both natives", () => {
      expect(TINTS).toEqual(["grayscale", "jade", "ruby", "amber", "citrine", "lagoon", "blue", "violet"]);
      const tint = (name: string, mode: "light" | "dark") => Object.fromEntries(TINT_ROLES.map(role => [camel(role), cssColor((source.tint as unknown as Record<string, Record<string, Record<string, string>>>)[name][mode][role])]));
      expect(swift.tints).toEqual(Object.fromEntries(TINTS.map(name => [name,
        Object.fromEntries(TINT_ROLES.map(role => [camel(role), { light: tint(name, "light")[camel(role)], dark: tint(name, "dark")[camel(role)] }]))])));
      expect(kotlin.tints).toEqual(Object.fromEntries(TINTS.map(name => [pascal(name), { light: tint(name, "light"), dark: tint(name, "dark") }])));
    });

    test("a tint replaces exactly accent, mark and soft, each with its own role", () => {
      const swiftTinted = block(swiftFile, "public func tinted(_ tint: HarsoTint) -> Harso {", "\n        }");
      for (const role of COLOR_ROLES) expect(swiftTinted).toContain(`${camel(role)}: ${TINT_ROLES.includes(role as never) ? `tint.${camel(role)}` : camel(role)}`);
      expect(kotlinFile).toContain("copy(accent = accent.accent, accentMark = accent.accentMark, accentSoft = accent.accentSoft)");
    });

    test.each([["HarsoType", "type"], ["HarsoSpace", "space"], ["HarsoRadius", "radius"]] as const)("%s constants are the desktop's %s values", (name, group) => {
      const resolved = cascade(theme, "light");
      const names = Object.keys(source[group]).filter(key => !key.startsWith("$"));
      for (const appearance of Object.keys(appearances) as Appearance[]) {
        for (const token of names) expect(cascade(theme, appearance)[`--hk-${token}`]).toBe(resolved[`--hk-${token}`]);
      }
      const number = (token: string) => Number(resolved[`--hk-${token}`].replace(/px|em$/, ""));
      const unit = (token: string) => token === "caps-tracking" ? "em" : group === "type" ? "sp" : "dp";
      expect(swift.constants(name)).toEqual(Object.fromEntries(names.map(token => [camel(token), number(token)])));
      expect(kotlin.constants(name)).toEqual(Object.fromEntries(names.map(token => [pascal(token), `${number(token)}${unit(token)}`])));
    });
  });
});
