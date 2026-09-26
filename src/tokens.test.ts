import { describe, expect, test } from "vitest";
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

export const cascade = (css: string, appearance: Appearance) => {
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
});
