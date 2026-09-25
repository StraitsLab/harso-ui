import { describe, expect, test } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { checkPlaybook, lawErrors, projectSurface, schemaErrors, semanticErrors, weekdayErrors } from "../scripts/check-output-playbook.mjs";
import examplesFile from "../docs/agent/output-playbook.examples.json";
import schemaFile from "../docs/agent/schema/output-blocks.v1.json";

type Example = { id: string; kind: string; vertical: string; surface: string; says?: string; document: any; [key: string]: unknown };
const schema = schemaFile as any;
const playbook = examplesFile as unknown as { examples: Example[] };
const byId = (id: string): Example => structuredClone(playbook.examples.find(example => example.id === id)!);
const allFindings = (example: Example): string[] => [
  ...(example.document ? schemaErrors(schema, example.document) : []),
  ...(example.document && schemaErrors(schema, example.document).length === 0 ? semanticErrors(example.document) : []),
  ...lawErrors(example),
];

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
    expect(checkPlaybook().schemaSha256).toBe("470aa1aec345587faaa4004ee00a499f3044540dfbde1126ff130072fdd68f87");
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
    ["truth: rows beyond reach", "home-listing-results", (e: Example) => { e.document.blocks.pop(); }, /truth/],
    ["stale: no as-of time", "sports-score", (e: Example) => { e.document.header.subtitle = "Full time · Premier League"; }, /stale/],
    ["voice: exclamation", "shop-delivery", (e: Example) => { e.says = "Great news!"; }, /voice/],
    ["voice: banned word", "docs-research-brief", (e: Example) => { e.document.blocks[0].summary = "Charging is now seamless."; }, /voice/],
    ["plain text: markdown", "edu-glossary", (e: Example) => { e.document.blocks[0].items[0].label = "**P/E ratio**"; }, /markup/],
    ["surface: page declared inline", "money-spending-month", (e: Example) => { e.surface = "inline"; }, /surface/],
    ["data: chart without unit", "data-kpis", (e: Example) => { delete e.document.blocks[1].visual.unit; }, /unit/],
  ])("catches %s", (_name, id, mutate, expected) => {
    const example = byId(id);
    expect(allFindings(example)).toEqual([]);
    mutate(example);
    expect(allFindings(example).join("\n")).toMatch(expected);
  });

  test("catches a weekday that does not match its date", () => {
    const year = Number((examplesFile as any).reference_date.slice(0, 4));
    const example = byId("home-viewing");
    expect(weekdayErrors(example, year)).toEqual([]);
    example.document.header.title = "Viewing Sat 27 Sep · 11:00";
    expect(weekdayErrors(example, year).join()).toMatch(/Sat 27 Sep is a Sun in 2026/);
  });

  test("the app surface follows the inline caps", () => {
    expect(projectSurface(byId("travel-flights").document)).toBe("inline");
    expect(projectSurface(byId("weather-week").document)).toBe("page");
    expect(projectSurface(byId("docs-research-brief").document)).toBe("page");
  });
});
