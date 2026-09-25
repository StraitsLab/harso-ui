import { describe, expect, test } from "vitest";
import theme from "./theme.css?raw";

// The kit is the one font authority: theme.css names the faces once; every other stylesheet reads the tokens.
const sheets = import.meta.glob<string>(["./**/*.css", "!./theme.css"], { query: "?raw", import: "default", eager: true });
const familyValues = (css: string) => [...css.matchAll(/font-family\s*:\s*([^;}]+)/g)].map(match => match[1].trim());
const shorthandValues = (css: string) => [...css.matchAll(/(?<![-\w])font\s*:\s*([^;}]+)/g)].map(match => match[1].trim());

describe("type authority", () => {
  test("theme.css bundles Instrument Sans and Geist Mono and points both tokens at them", () => {
    expect(theme).toContain('@import "@fontsource-variable/instrument-sans/wght.css";');
    expect(theme).toContain('@import "@fontsource-variable/geist-mono/wght.css";');
    expect(theme).toMatch(/--hk-font:\s*"Instrument Sans Variable", sans-serif;/);
    expect(theme).toMatch(/--hk-mono:\s*"Geist Mono Variable", ui-monospace, monospace;/);
    expect(theme).not.toMatch(/-apple-system|BlinkMacSystemFont|"Inter"|SFMono|JetBrains/);
  });

  test("no other kit stylesheet names a face", () => {
    expect(Object.keys(sheets).length).toBeGreaterThan(20);
    const offenders = Object.entries(sheets).flatMap(([path, css]) => [
      ...familyValues(css).filter(value => !/^(var\(--hk-(font|mono)\)|inherit)$/.test(value)),
      ...shorthandValues(css).filter(value => value !== "inherit" && !/var\(--hk-(font|mono)\)$/.test(value)),
    ].map(value => `${path}: ${value}`));
    expect(offenders).toEqual([]);
  });
});
