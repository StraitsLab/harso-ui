// Types for scripts/gen-tokens.mjs (the tests import it).
type Tint = { name: string; light: Record<"accent" | "accent-mark" | "accent-soft", string>; dark: Record<"accent" | "accent-mark" | "accent-soft", string> };
export type Tokens = { tints: Tint[] };
export function load(source?: unknown): Tokens;
export function renderTheme(tokens: Tokens, theme?: string): string;
export function renderSwift(tokens: Tokens): string;
export function renderKotlin(tokens: Tokens): string;
export function staleOutputs(): string[];
