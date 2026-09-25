import { describe, expect, test } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { checkPlaybook, checkPlaybookData, FRESH_EXAMPLES, lawErrors, periodErrors, projectSurface, requestedPeriod, schemaErrors, semanticErrors, specificLink, TIME_SENSITIVE_COMPONENTS, weekdayErrors } from "../scripts/check-output-playbook.mjs";
import playbookMarkdown from "../docs/agent/output-playbook.md?raw";
import examplesFile from "../docs/agent/output-playbook.examples.json";
import schemaFile from "../docs/agent/schema/output-blocks.v1.json";

type Example = { id: string; kind: string; vertical: string; surface: string; request: string; says?: string; fresh?: boolean; components: string[]; document: any; [key: string]: unknown };
const schema = schemaFile as any;
const playbook = examplesFile as unknown as { reference_date: string; examples: Example[] };
const REFERENCE = playbook.reference_date;
const byId = (id: string): Example => structuredClone(playbook.examples.find(example => example.id === id)!);
const allFindings = (example: Example): string[] => [
  ...(example.document ? schemaErrors(schema, example.document) : []),
  ...(example.document && schemaErrors(schema, example.document).length === 0 ? semanticErrors(example.document) : []),
  ...lawErrors(example),
];

const SCHEMA_SHA256 = "470aa1aec345587faaa4004ee00a499f3044540dfbde1126ff130072fdd68f87";
/** Runs the whole-file checks on a copy of the examples with one example replaced (says, periods, weekdays). */
function fileFindings(example: Example): string[] {
  const copy = structuredClone(examplesFile as any);
  copy.examples = copy.examples.map((item: Example) => (item.id === example.id ? example : item));
  return checkPlaybookData(copy, schema, SCHEMA_SHA256).findings.filter((finding: string) => finding.startsWith(`example ${example.id}:`));
}

describe("agent output playbook examples", () => {
  test("every example validates against output-blocks.v1 and keeps every law", () => {
    const result = checkPlaybook();
    expect(result.findings).toEqual([]);
    expect(result.examples).toBeGreaterThanOrEqual(80);
    expect(result.text).toBeGreaterThanOrEqual(10);
    expect(result.file).toBeGreaterThanOrEqual(10);
  });

  test("the copied schema is the recorded weave-cloud contract", () => {
    expect(schema.$id).toBe("https://weave.cloud/contracts/output-blocks/v1");
    expect(checkPlaybook().schemaSha256).toBe(SCHEMA_SHA256);
  });

  // Each mutant breaks exactly one rule on a known-good example; the checker must name that rule.
  test.each([
    ["schema: styling field", "travel-flights", (e: Example) => { e.document.blocks[0].items[0].color = "red"; }, /unexpected field/],
    ["schema: title over 60", "travel-flights", (e: Example) => { e.document.header.title = "x".repeat(61); }, /too long \(61, max 60\)/],
    ["schema: trailing newline", "travel-flights", (e: Example) => { e.document.header.title = "Flights\n"; }, /wrong format|one line/],
    ["schema: unknown state", "fail-fares", (e: Example) => { e.document.blocks[0].state = "error"; }, /\$\.blocks\[0\]/],
    ["schema: one number", "money-mortgage", (e: Example) => { e.document.blocks[0].items.pop(); }, /at least 2/],
    ["contract: two picks", "travel-flights", (e: Example) => { e.document.blocks[0].items[1].mark = "pick"; }, /at most one row as 'pick'/],
    ["contract: two rows blocks", "money-bills-due", (e: Example) => { e.document.blocks.push(structuredClone(e.document.blocks[0])); }, /at most one 'rows' block/],
    ["contract: action not last", "places-directions", (e: Example) => { e.document.blocks.reverse(); }, /action block must be last/],
    ["contract: chart arity", "weather-now", (e: Example) => { e.document.blocks[1].visual.series[0].values.pop(); }, /needs exactly 6 values/],
    ["contract: status without subject", "shop-price-watch", (e: Example) => { delete e.document.blocks[0].subject; }, /needs a subject/],
    ["contract: local link", "travel-flight-status", (e: Example) => { e.document.blocks[1].secondary.url = "https://router.home.arpa/"; }, /public https/],
    ["contract: control on another subject", "prod-watch-reply", (e: Example) => { e.document.blocks[2].secondary.routine_id = "0192a3b4-5c6d-7e8f-9a0b-000000009999"; }, /routine_control must target/],
    ["law 3: reply button", "travel-flights", (e: Example) => { e.document.blocks.push({ kind: "action", primary: { kind: "reply", label: "Choose SQ 638", text: "Choose SQ 638" } }); }, /law 3/],
    ["law 4: 11 rows", "weather-week", (e: Example) => { e.document.blocks[0].items.push(...e.document.blocks[0].items.slice(0, 4)); }, /law 4/],
    ["law 4: 5 table columns", "data-table-small", (e: Example) => { e.document.blocks[0].columns.push({ label: "A" }, { label: "B" }); e.document.blocks[0].rows.forEach((r: any) => r.cells.push("1", "2")); }, /law 4/],
    ["law 5: link in visible text", "news-brief", (e: Example) => { e.document.blocks[0].summary = "Per https://lta.gov.sg trains are back."; }, /law 5/],
    ["law 5: news without details", "news-timeline", (e: Example) => { delete e.document.details; }, /law 5/],
    ["law 6: repeats the sentence", "travel-stay-areas", (e: Example) => { e.document.header.subtitle = e.says; }, /law 6/],
    ["law 1: plain-text answer with a card", "text-convert", (e: Example) => { e.document = byId("money-mortgage").document; }, /law 1/],
    ["file: no artifact action", "file-invoice-pdf", (e: Example) => { e.document.blocks.pop(); }, /file/],
    ["stale: no as-of time", "sports-score", (e: Example) => { e.document.header.subtitle = "Full time · Premier League"; }, /stale/],
    // Review round 1 counterexamples: each returned zero findings before the fix.
    ["stale: fresh flag and as-of both removed", "sports-score", (e: Example) => { delete e.fresh; e.document.header.subtitle = "Full time · Premier League"; }, /fresh must be true/],
    ["stale: fresh set false on a fare", "travel-flights", (e: Example) => { e.fresh = false; }, /Flight options is time-sensitive/],
    ["stale: as-of a date, not a time", "travel-flights", (e: Example) => { e.document.header.subtitle = "12 Oct · as of 26 Sep"; }, /as of HH:MM/],
    ["truth: table rows beyond reach", "sports-standings", (e: Example) => { e.document.blocks.pop(); }, /table rows beyond those sent/],
    ["truth: overflow link is a placeholder", "sports-standings", (e: Example) => { e.document.blocks.at(-1).secondary.url = "https://example.com/"; }, /table rows beyond those sent|home page/],
    ["truth: overflow link is a home page", "sports-standings", (e: Example) => { e.document.blocks.at(-1).secondary.url = "https://www.premierleague.com/"; }, /home page/],
    ["truth: rows advertised beyond those sent", "home-listing-results", (e: Example) => { e.document.blocks[1].items = e.document.blocks[1].items.slice(0, 3); e.document.blocks[1].total_count = 7; }, /rows beyond those sent/],
    ["truth: draft paraphrased in the fallback", "prod-email-draft", (e: Example) => { e.document.fallback_text = "Draft to Nichol: Tuesday works. Not sent."; }, /word for word/],
    ["truth: fallback drops a number", "money-mortgage", (e: Example) => { e.document.fallback_text = "About S$4,268 a month."; }, /fallback_text leaves out/],
    ["truth: cart contents missing", "shop-cart-summary", (e: Example) => { e.document.blocks.splice(1, 1); }, /list the contents/],
    ["data: categories do not add up to Spent", "money-spending-month", (e: Example) => { e.document.blocks[2].items.splice(4); }, /rows add up to S\$3200\.00, not the Spent of S\$4,280/],
    ["truth: live page promised in the pane", "file-calculator-page", (e: Example) => { e.says = "It opens in the pane."; }, /live pages do not open in the app yet/],
    ["turn: failed card with no final sentence", "fail-fares", (e: Example) => { e.says = ""; }, /ends the turn after present_output/],
    ["stale: freshness not declared", "money-mortgage", (e: Example) => { delete e.fresh; }, /declare fresh: true or false/],
    ["truth: forecast outside next week (whole-file check)", "weather-week", (e: Example) => { e.document.header.subtitle = "13–19 Oct · as of 09:00"; }, /outside "next week"/],
    // Review round 2 counterexamples: each returned zero findings before the fix.
    ["stale: open-now clinics flagged not fresh", "places-nearby-map", (e: Example) => { e.fresh = false; e.document.header.subtitle = "Open now"; }, /verdict for places-nearby-map is true/],
    ["stale: current menu prices flagged not fresh", "food-menu", (e: Example) => { e.fresh = false; }, /verdict for food-menu is true/],
    ["stale: current premiums flagged not fresh (generic Comparison)", "docs-compare-plans", (e: Example) => { e.fresh = false; }, /verdict for docs-compare-plans is true/],
    ["stale: a stable answer flagged fresh", "money-mortgage", (e: Example) => { e.fresh = true; e.document.header.subtitle += " · as of 10:00"; }, /verdict for money-mortgage is false/],
    ["stale: right-now wording on a stable card", "shop-refund", (e: Example) => { e.says = "It's currently on your card."; }, /"currently" is true only right now/],
    ["voice: exclamation", "shop-delivery", (e: Example) => { e.says = "Great news!"; }, /voice/],
    ["voice: banned word", "docs-research-brief", (e: Example) => { e.document.blocks[0].summary = "Charging is now seamless."; }, /voice/],
    ["plain text: markdown", "edu-glossary", (e: Example) => { e.document.blocks[0].items[0].label = "**P/E ratio**"; }, /markup/],
    ["surface: page declared inline", "money-spending-month", (e: Example) => { e.surface = "inline"; }, /surface/],
    ["data: chart without unit", "data-kpis", (e: Example) => { delete e.document.blocks[1].visual.unit; }, /unit/],
    // B0 v4 reconciliation (lead ruling 2026-09-26: no donut; a proportion bar above sorted rows).
    ["shares: not largest first", "data-channel-share", (e: Example) => { e.document.blocks[0].items.reverse(); }, /shares go largest first/],
    ["shares: do not add up to 100%", "money-spending-month", (e: Example) => { e.document.blocks[2].items[0].secondary = "40%"; }, /shares add up to 113%/],
    ["shares: a donut on the card", "data-channel-share", (e: Example) => { e.document.header.subtitle = "Donut by channel"; }, /no donut or pie/],
    ["partial: a missing day sent as zero", "partial-days", (e: Example) => { e.document.blocks[0].visual.series[0].values[13] = "0"; }, /not in yet is null, never 0/],
  ])("catches %s", (_name, id, mutate, expected) => {
    const example = byId(id);
    expect(allFindings(example)).toEqual([]);
    mutate(example);
    // "says" is checked in checkPlaybook, so run the whole file for the turn rule.
    const findings = [...allFindings(example), ...fileFindings(example)];
    expect(findings.join("\n")).toMatch(expected);
  });

  test("catches a weekday that does not match its date", () => {
    const year = Number((examplesFile as any).reference_date.slice(0, 4));
    const example = byId("home-viewing");
    expect(weekdayErrors(example, year)).toEqual([]);
    example.document.header.title = "Viewing Sat 27 Sep · 11:00";
    expect(weekdayErrors(example, year).join()).toMatch(/Sat 27 Sep is a Sun in 2026/);
  });

  test("relative periods are counted from the reference date", () => {
    expect(REFERENCE).toBe("2026-09-26"); // a Saturday
    const next = requestedPeriod("What's the weather in Tokyo next week?", REFERENCE);
    expect([next.from.toISOString().slice(0, 10), next.to.toISOString().slice(0, 10)]).toEqual(["2026-09-28", "2026-10-04"]);
    const week = requestedPeriod("Which bills are due this week?", REFERENCE);
    expect([week.from.toISOString().slice(0, 10), week.to.toISOString().slice(0, 10)]).toEqual(["2026-09-21", "2026-09-27"]);
    expect(requestedPeriod("What were my top sellers last month?", REFERENCE).month).toBe("August");
  });

  test("catches a forecast outside the week asked about (review round 1: 13–19 Oct for 'next week')", () => {
    const example = byId("weather-week");
    expect(periodErrors(example, REFERENCE)).toEqual([]);
    example.document.header.subtitle = "13–19 Oct · as of 09:00";
    expect(periodErrors(example, REFERENCE).join()).toMatch(/2026-10-13 is outside "next week" \(2026-09-28 to 2026-10-04/);
  });

  test("a dated 'as of' stamp is when the data was read, not the period (review round 2)", () => {
    const example = byId("weather-week");
    example.document.header.subtitle = "Mon 28 Sep–Sun 4 Oct · as of 26 Sep, 09:00";
    expect(periodErrors(example, REFERENCE)).toEqual([]);
    expect(fileFindings(example)).toEqual([]);
    // The stamp is ignored, the period is not: a wrong week with a dated stamp is still caught.
    example.document.header.subtitle = "Mon 5 Oct–Sun 11 Oct · as of 26 Sep, 09:00";
    expect(periodErrors(example, REFERENCE).join()).toMatch(/2026-10-05 is outside "next week"/);
    expect(periodErrors(example, REFERENCE).join()).not.toMatch(/2026-09-26 is outside/);
  });

  test("catches a finished-month question about a month that has not ended", () => {
    const example = byId("money-spending-month");
    expect(periodErrors(example, REFERENCE)).toEqual([]);
    example.request = "How did I do on spending in September?";
    expect(periodErrors(example, REFERENCE).join()).toMatch(/September 2026 has not ended/);
  });

  test("every card and file declares freshness, and every time-sensitive component is covered", () => {
    const cards = playbook.examples.filter(example => example.kind !== "text");
    expect(cards.every(example => typeof example.fresh === "boolean")).toBe(true);
    const used = new Set(cards.flatMap(example => example.components));
    for (const name of TIME_SENSITIVE_COMPONENTS) expect(used.has(name), name).toBe(true);
    for (const example of cards.filter(item => item.components.some(name => TIME_SENSITIVE_COMPONENTS.has(name)))) {
      expect(example.fresh, example.id).toBe(true);
    }
  });

  test("freshness is decided per example, independent of the component list (review round 2)", () => {
    const cards = playbook.examples.filter(example => example.kind !== "text");
    for (const example of cards) expect(example.fresh, example.id).toBe(FRESH_EXAMPLES.has(example.id));
    // The round-2 cases by name: current menu prices, current premiums, open-now clinics.
    for (const id of ["food-menu", "docs-compare-plans", "places-nearby-map", "places-cafe", "places-hours", "shop-compare-phones", "jobs-posting", "empty-search"]) {
      expect(FRESH_EXAMPLES.has(id), id).toBe(true);
    }
    // Some of them use only components outside TIME_SENSITIVE_COMPONENTS: the verdict list alone protects them.
    expect(byId("docs-compare-plans").components.some(name => TIME_SENSITIVE_COMPONENTS.has(name))).toBe(false);
    // An unknown id in the verdict list is a finding, so the list cannot rot.
    const copy = structuredClone(examplesFile as any);
    copy.examples = copy.examples.filter((item: Example) => item.id !== "food-menu");
    expect(checkPlaybookData(copy, schema, SCHEMA_SHA256).findings.join()).toMatch(/FRESH_EXAMPLES names food-menu/);
  });

  test("links open a specific page, never a home page or a placeholder", () => {
    expect(specificLink("https://www.premierleague.com/tables")).toBe(true);
    expect(specificLink("https://www.propertyguru.com.sg/")).toBe(false);
    expect(specificLink("https://shopee.sg")).toBe(false);
    expect(specificLink("https://example.com/results")).toBe(false);
  });

  test("the playbook teaches present_output first, then one closing sentence", () => {
    const doc = playbookMarkdown;
    expect(doc).toMatch(/call `present_output` once with the finished result, then end the turn with one short sentence/i);
    expect(doc).not.toMatch(/call `present_output`, and end/i);
    expect(doc).toMatch(/Until that ships, a live page is a file/i);
  });

  test("every weekday written in the playbook matches its date", () => {
    const year = Number(REFERENCE.slice(0, 4));
    expect(weekdayErrors({ text: playbookMarkdown }, year)).toEqual([]);
    expect(weekdayErrors({ text: "As of Fri 26 Sep close" }, year).join()).toMatch(/Fri 26 Sep is a Sat/);
  });

  test("the playbook names every published v4 block master and cites a real example for each (B0 reconciliation)", () => {
    const masters = ["header", "rows", "rowkinds", "numbers", "numbers4", "bar", "line", "share", "progress", "table", "text", "image", "map", "status", "action", "viewall", "details"];
    const section = playbookMarkdown.split("## The blocks the app draws")[1].split("\n## ")[0];
    const ids = new Set(playbook.examples.map(example => example.id));
    for (const master of masters) {
      const line = section.split("\n").find(row => row.startsWith(`| ${master} |`));
      expect(line, master).toBeDefined();
      const cited = [...line!.matchAll(/`([a-z0-9-]+)`/g)].map(match => match[1]).filter(id => id.includes("-"));
      for (const id of cited) expect(ids.has(id), `${master} cites ${id}`).toBe(true);
    }
    expect(playbookMarkdown).toMatch(/Never a donut or pie/);
  });

  test("the app surface follows the inline caps", () => {
    expect(projectSurface(byId("travel-flights").document)).toBe("inline");
    expect(projectSurface(byId("weather-week").document)).toBe("page");
    expect(projectSurface(byId("docs-research-brief").document)).toBe("page");
  });
});
