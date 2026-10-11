import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputCardProps, type HarsoOutputDocument } from "../output-card";
import styles from "./research.css?raw";
import theme from "../../theme.css?raw";
import { family } from "./research";
import type { V6FamilyProps } from "./types";

// WEV-3324 (P08): research-brief opens by tapping the answer. One open target (the title), source marks from the
// details sources (bundled mark or a letter tile, never a fetch), the real artifact in the host's reader.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const ARTIFACT = "artifact:0192a3b4-5c6d-7e8f-9a0b-0000000009c5";
const SOURCES = [
  { label: "LTA EV statistics", url: "https://www.lta.gov.sg/content/ev.html" },
  { label: "SP Group electricity tariffs", url: "https://www.spgroup.com.sg/tariff" },
  { label: "The Straits Times, EV charging price survey", url: "https://www.straitstimes.com/survey" },
  { label: "LTA EV Common Charger Grant", url: "https://www.lta.gov.sg/content/grant.html" },
  { label: "HDB EV charger rollout", url: "https://www.hdb.gov.sg/car-parks/ev" },
];
const doc = (extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "research-brief",
  header: { title: "EVs in Singapore, 2026", subtitle: "Research brief" },
  blocks: [
    { kind: "text", summary: "Charging is now broad but slow.", sections: [
      { heading: "Where things stand", paragraphs: ["Public chargers passed 15,000 points."] },
      { heading: "What it means for you", paragraphs: ["Public charging costs more than home.", "Check your car park."], bullets: ["Ask your MCST"] },
      { heading: "Last word", paragraphs: ["Wait for the rollout."] },
    ] },
    { kind: "action", secondary: { kind: "open_artifact", label: "Open as document", artifact: ARTIFACT } },
  ],
  details: { sources: SOURCES },
  as_of: "2026-10-11T09:10Z",
  fallback_text: "FALLBACK", ...extra,
});
const draw = (document: HarsoOutputDocument, props: Partial<HarsoOutputCardProps> = {}) => {
  const onViewAll = vi.fn(), onOpenArtifact = vi.fn(), onOpenUrl = vi.fn();
  const view = render(<div className="harso-kit"><HarsoOutputCard document={document} families={{ "research-brief": family }}
    onViewAll={onViewAll} onOpenArtifact={onOpenArtifact} onOpenUrl={onOpenUrl} {...props} /></div>);
  return { view, onViewAll, onOpenArtifact, onOpenUrl, card: screen.queryByRole("region", { name: document.header.title }) as HTMLElement };
};
const familyProps = (document: HarsoOutputDocument, extra: Partial<V6FamilyProps> = {}): V6FamilyProps =>
  ({ document, mode: "inline", host: { onViewAll: () => {} }, media: {}, renderBrand: () => undefined, ...extra });

// ---- one open target ----

test("inline: the title is the only control. No View all, no Open document, no Details for sources alone", () => {
  const { card } = draw(doc());
  const buttons = within(card).getAllByRole("button");
  expect(buttons.map(button => button.textContent)).toEqual(["EVs in Singapore, 2026"]);
  expect(buttons[0].closest("h2")).not.toBeNull();
  expect(card.textContent).not.toMatch(/view all|open as document|open document|details/i);
  expect(card.querySelectorAll("a[href]")).toHaveLength(0);
});

test("inline shows the title, the short summary and the source count, and nothing of the sections", () => {
  const { card } = draw(doc());
  expect(within(card).getByText("Research brief")).toBeTruthy();
  expect(within(card).getByText("Charging is now broad but slow.")).toBeTruthy();
  expect(within(card).getByText("5 sources")).toBeTruthy();
  expect(card.textContent).not.toContain("Where things stand");
});

test("tapping the title opens the real artifact in the host's reader, and not View all", () => {
  const { card, onOpenArtifact, onViewAll } = draw(doc());
  fireEvent.click(within(card).getByRole("button", { name: "EVs in Singapore, 2026" }));
  expect(onOpenArtifact).toHaveBeenCalledExactlyOnceWith(ARTIFACT);
  expect(onViewAll).not.toHaveBeenCalled();
});

test("with no artifact on the card the tap opens the full answer", () => {
  const { card, onOpenArtifact, onViewAll } = draw(doc({ blocks: [doc().blocks[0]] }));
  fireEvent.click(within(card).getByRole("button", { name: "EVs in Singapore, 2026" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
  expect(onOpenArtifact).not.toHaveBeenCalled();
});

test("a host with no artifact reader, or an artifact id the contract rejects, falls back to the full answer", () => {
  const noReader = draw(doc(), { onOpenArtifact: undefined });
  fireEvent.click(within(noReader.card).getByRole("button", { name: "EVs in Singapore, 2026" }));
  expect(noReader.onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  const bad = draw(doc({ blocks: [doc().blocks[0], { kind: "action", secondary: { kind: "open_artifact", label: "Open", artifact: "../etc/passwd" } }] }));
  fireEvent.click(within(bad.card).getByRole("button", { name: "EVs in Singapore, 2026" }));
  expect(bad.onOpenArtifact).not.toHaveBeenCalled();
  expect(bad.onViewAll).toHaveBeenCalledTimes(1);
});

// ---- keyboard and VoiceOver ----

test("keyboard: Tab reaches the title once, Enter and Space each open it", async () => {
  const user = userEvent.setup();
  const { card, onOpenArtifact } = draw(doc());
  await user.tab();
  const open = within(card).getByRole("button", { name: "EVs in Singapore, 2026" });
  expect(document.activeElement).toBe(open);
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
  expect(onOpenArtifact).toHaveBeenCalledTimes(2);
  await user.tab();
  expect(document.activeElement).toBe(document.body);
});

test("VoiceOver: one named button inside the heading, the chevron and the source marks are hidden, and axe finds nothing", async () => {
  const { card, view } = draw(doc());
  const open = within(card).getByRole("button", { name: "EVs in Singapore, 2026" });
  expect(open.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  expect(card.querySelector(".hkc-research-stack")!.getAttribute("aria-hidden")).toBe("true");
  expect(card.getAttribute("aria-labelledby")).toBe(open.closest("h2")!.id);
  const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

// ---- source marks ----

test("source marks: a bundled domain draws the host's mark, an unknown one a letter tile, and nothing is fetched", () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const renderBrand = vi.fn(({ domain }: { domain: string }) => domain === "lta.gov.sg" ? <svg data-testid="lta" /> : undefined);
  const { card } = draw(doc(), { renderBrand });
  const marks = [...card.querySelectorAll(".hkc-research-stack .hkc-v6-brand")];
  expect(marks.map(mark => mark.getAttribute("data-mark"))).toEqual(["host", "letter", "letter", "letter"]);
  expect(marks.map(mark => mark.textContent)).toEqual(["", "S", "T", "H"]);
  expect(renderBrand.mock.calls.map(call => (call[0] as { domain: string }).domain)).toEqual(["lta.gov.sg", "spgroup.com.sg", "straitstimes.com", "hdb.gov.sg"]);
  expect(card.querySelectorAll("img, link, script, iframe, source, video, object")).toHaveLength(0);
  expect(fetch).not.toHaveBeenCalled();
});

test("the stack shows at most four distinct sites in source order, while the count is every source", () => {
  const { card } = draw(doc());
  expect(card.querySelectorAll(".hkc-research-stack .hkc-v6-brand")).toHaveLength(4);
  expect(within(card).getByText("5 sources")).toBeTruthy();
  cleanup();
  const one = draw(doc({ details: { sources: [SOURCES[0]] } }));
  expect(within(one.card).getByText("1 source")).toBeTruthy();
});

test("a source with no url, or a link that is not https, gets a letter tile and never reaches the host's brand lookup", () => {
  const renderBrand = vi.fn(() => <svg />);
  const { card } = draw(doc({ details: { sources: [{ label: "Interview notes" }, { label: "Plain http", url: "http://old.example/a" }] } }), { renderBrand });
  expect(renderBrand).not.toHaveBeenCalled();
  expect([...card.querySelectorAll(".hkc-research-stack .hkc-v6-brand")].map(mark => mark.textContent)).toEqual(["I", "P"]);
  expect(within(card).getByText("2 sources")).toBeTruthy();
});

test("a document with no sources draws no stack and no count", () => {
  const { card } = draw(doc({ details: undefined }));
  expect(card.querySelector(".hkc-research-sources")).toBeNull();
  expect(card.textContent).not.toMatch(/source/i);
});

// ---- Details ----

test("sources are not repeated in Details; assumptions and disclaimers still reach it", () => {
  const { card } = draw(doc({ details: { sources: SOURCES, assumptions: ["Prices in SGD."], disclaimers: ["Not advice."] } }));
  const toggle = within(card).getByRole("button", { name: "Details" });
  fireEvent.click(toggle);
  const region = within(card).getByRole("region", { name: "Output details" });
  expect(within(region).getByText("Prices in SGD.")).toBeTruthy();
  expect(within(region).getByText("Not advice.")).toBeTruthy();
  expect(within(region).queryByRole("list", { name: "Sources" })).toBeNull();
});

// ---- full view ----

test("full view: sections and sources keep their order, the title is a plain heading, and there is no View all or Open", () => {
  const { card, onOpenUrl } = draw(doc(), { mode: "full" });
  expect(within(card).getByRole("heading", { level: 2, name: "EVs in Singapore, 2026" })).toBeTruthy();
  expect(within(card).queryByRole("button", { name: "EVs in Singapore, 2026" })).toBeNull();
  expect(within(card).getByText("Charging is now broad but slow.")).toBeTruthy();
  const headings = within(card).getAllByRole("heading", { level: 3 }).map(node => node.textContent);
  expect(headings).toEqual(["Where things stand", "What it means for you", "Last word", "Sources 5"]);
  const text = card.textContent!;
  for (const [a, b] of [["Public chargers passed", "Public charging costs"], ["Public charging costs", "Check your car park."], ["Check your car park.", "Ask your MCST"], ["Ask your MCST", "Wait for the rollout"]]) {
    expect(text.indexOf(a)).toBeGreaterThan(-1);
    expect(text.indexOf(a)).toBeLessThan(text.indexOf(b));
  }
  const list = within(card).getByRole("list", { name: "Sources" });
  const items = within(list).getAllByRole("listitem");
  expect(items.map(item => item.querySelector(".hkc-research-source-label")!.textContent)).toEqual(SOURCES.map(source => source.label));
  expect(within(card).queryByRole("button", { name: /view all|open (as )?document/i })).toBeNull();
  fireEvent.click(within(list).getByRole("button", { name: /Straits Times/ }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith("https://www.straitstimes.com/survey");
});

test("full view: each source shows its mark or letter tile and its site name; one without a link is text, not a button", () => {
  const sources = [SOURCES[0], { label: "Interview notes" }];
  const { card } = draw(doc({ details: { sources } }), { mode: "full", renderBrand: ({ domain }) => domain === "lta.gov.sg" ? <svg /> : undefined });
  const items = within(within(card).getByRole("list", { name: "Sources" })).getAllByRole("listitem");
  expect(items.map(item => item.querySelector(".hkc-v6-brand")!.getAttribute("data-mark"))).toEqual(["host", "letter"]);
  expect(items[0].querySelector(".hkc-research-source-site")!.textContent).toBe("lta.gov.sg");
  expect(items[1].querySelector(".hkc-research-source-site")).toBeNull();
  expect(within(items[0]).getAllByRole("button")).toHaveLength(1);
  expect(within(items[1]).queryByRole("button")).toBeNull();
});

test("full view without onOpenUrl draws sources as plain text (never a dead button)", () => {
  const { card } = draw(doc(), { mode: "full", onOpenUrl: undefined });
  expect(within(card).queryAllByRole("button")).toHaveLength(0);
  expect(within(card).getByText("LTA EV statistics")).toBeTruthy();
});

test("full view passes axe, with every control inside no other control", async () => {
  const { card, view } = draw(doc({ details: { sources: SOURCES, assumptions: ["Prices in SGD."] } }), { mode: "full" });
  for (const target of card.querySelectorAll("button, a[href], [role=button]")) expect(target.parentElement!.closest("button, a[href], [role=button]")).toBeNull();
  const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

// ---- truth: what the family will not draw ----

test.each([
  ["no text block", doc({ blocks: [{ kind: "action", secondary: { kind: "open_artifact", label: "Open", artifact: ARTIFACT } }] })],
  ["a rows block it cannot draw", doc({ blocks: [...doc().blocks, { kind: "rows", items: [{ label: "A" }] }] })],
  ["a section date it would drop", doc({ blocks: [{ kind: "text", sections: [{ heading: "H", paragraphs: ["P"], date: "2026-10-11" }] }] })],
  ["a section photo it would drop", doc({ blocks: [{ kind: "text", sections: [{ heading: "H", thumbnail: { artifact: ARTIFACT, alt: "x" } }] }] })],
  ["two text blocks", doc({ blocks: [doc().blocks[0], doc().blocks[0]] })],
  ["a download action it would drop", doc({ blocks: [doc().blocks[0], { kind: "action", primary: { kind: "download_artifact", label: "Save", artifact: ARTIFACT } }] })],
  ["a reply action it would drop", doc({ blocks: [doc().blocks[0], { kind: "action", primary: { kind: "reply", label: "Yes", text: "yes" } }] })],
])("%s: the family declines so the generic card draws every block", (_name, document) => {
  expect(family.renderFamily(familyProps(document))).toBeUndefined();
  expect(family.renderFamily(familyProps(document, { mode: "full" }))).toBeUndefined();
});

test("a declined document draws the generic card with its own controls", () => {
  const { card } = draw(doc({ blocks: [...doc().blocks, { kind: "rows", items: [{ label: "Row A" }] }] }));
  expect(within(card).getByText("Row A")).toBeTruthy();
  expect(card.classList.contains("hkc-v6-frame")).toBe(false);
});

test("a summary-less brief still draws its title and sources, and invents no summary", () => {
  const { card } = draw(doc({ blocks: [{ kind: "text", sections: [{ heading: "H", paragraphs: ["Body text"] }] }] }));
  expect(card.querySelector(".hkc-research-summary")).toBeNull();
  expect(card.textContent).not.toContain("Body text");
});

// ---- snapshot ----

test("shows the saved snapshot time only, with no live claim", () => {
  const { card } = draw(doc());
  expect(within(card).getByText(/^As of /)).toBeTruthy();
  expect(card.textContent).not.toMatch(/\b(live|up to date|just now|refreshed)\b/i);
});

// ---- widget ----

test("medium is the only widget size", () => {
  expect(family.supportedWidgetSizes("research-brief")).toEqual(["medium"]);
});

test("the medium widget is the same single open target; every other size is declined", () => {
  const { card, onOpenArtifact } = draw(doc(), { widgetSize: "medium" });
  expect(card.closest("[data-widget]")!.getAttribute("data-widget")).toBe("medium");
  const buttons = within(card).getAllByRole("button");
  expect(buttons).toHaveLength(1);
  fireEvent.click(buttons[0]);
  expect(onOpenArtifact).toHaveBeenCalledExactlyOnceWith(ARTIFACT);
  for (const widgetSize of ["small", "large", "extraLarge"] as const) {
    expect(family.renderFamily(familyProps(doc(), { widgetSize }))).toBeUndefined();
  }
});

// ---- styles ----

test("styles: tokens only, no borders or !important, a focus ring, 44px targets on touch, and every token exists in light and dark", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line) && !line.startsWith("outline: 2px solid var(--hk-accent)"))).toEqual([]);
  expect(source).toMatch(/hkc-research-source:focus-visible/);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-research-source[^}]*min-height: 44px/);
  const used = new Set([...source.matchAll(/var\((--hk-[a-z0-9-]+)/g)].map(match => match[1]));
  const root = theme.slice(0, theme.indexOf(".harso-kit[data-palette"));
  const dark = theme.slice(theme.indexOf('.harso-kit[data-mode="dark"] {'));
  for (const token of used) {
    expect(root, `${token} in light`).toContain(`${token}:`);
    // Dark either overrides a token or inherits the same one from the light block.
    expect(root + dark, `${token} in dark`).toContain(`${token}:`);
  }
  expect(used.size).toBeGreaterThan(3);
});
