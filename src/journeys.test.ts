// The kit has no @types/node; these run under vitest in node.
// @ts-expect-error - node module without type declarations here
import { execFileSync } from "node:child_process";
// @ts-expect-error - node module without type declarations here
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error - node module without type declarations here
import { tmpdir } from "node:os";
// @ts-expect-error - node module without type declarations here
import { join } from "node:path";
import { describe, expect, test } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { checkJourneys, checkJourneysData, gapIds, GAPS_PATH, JOURNEYS, JOURNEYS_PATH } from "../scripts/check-journeys.mjs";
// @ts-expect-error - plain ESM script without type declarations
import { buildPlaybook } from "../scripts/build-catalogue.mjs";

type Journey = { id: unknown; title: unknown; examples: unknown; note: unknown };
type Result = { findings: string[]; missing: string[]; covered: number; gaps: string[] };
const committed = JSON.parse(readFileSync(JOURNEYS_PATH, "utf8")) as { journeys: Journey[] };
const gapsText = readFileSync(GAPS_PATH, "utf8");
const exampleIds = new Set<string>(JSON.parse(buildPlaybook()).examples.map((example: { id: string }) => example.id));
const gaps = gapIds(gapsText) as Set<string>;
const GAPS: string[] = [];

const edited = (edit: (journeys: Journey[]) => void, from = committed) => {
  const copy = structuredClone(from);
  edit(copy.journeys);
  return copy;
};
const at = (journeys: Journey[], id: string) => journeys.find(item => item.id === id)!;
/** Every journey mapped to a real example; run with no gaps declared it is the clean control (exit 0). */
const covered = edited(journeys => { for (const journey of journeys) journey.examples = ["travel-flights"]; });
const fullyCovered = (edit: (journeys: Journey[]) => void = () => {}) => edited(edit, covered);
const check = (data: unknown, gapSet: Set<string> = gaps): Result => checkJourneysData(data, exampleIds, gapSet);

const scratch = mkdtempSync(join(tmpdir(), "journeys-"));
/** Runs the real CLI on a written copy; returns its exit status and output. */
function cli(data: unknown, gapsMarkdown = gapsText): { status: number; out: string } {
  const file = join(scratch, "journeys.json");
  const gapsFile = join(scratch, "gaps.md");
  writeFileSync(file, JSON.stringify(data));
  writeFileSync(gapsFile, gapsMarkdown);
  try {
    const node = (globalThis as unknown as { process: { execPath: string } }).process.execPath;
    const out = execFileSync(node, ["scripts/check-journeys.mjs", file, gapsFile], { encoding: "utf8", stdio: "pipe" });
    return { status: 0, out };
  } catch (error) {
    const failed = error as { status: number; stdout: string; stderr: string };
    return { status: failed.status, out: failed.stdout + failed.stderr };
  }
}

describe("every journey names its catalogue example", () => {
  test("the committed map: all 60 covered, no declared gaps", () => {
    const result = checkJourneys() as Result;
    expect(JOURNEYS).toHaveLength(60);
    expect(result.findings).toEqual([]);
    expect(result.covered).toBe(60);
    expect(result.missing).toEqual(GAPS);
    expect(result.gaps).toEqual(GAPS);
  });

  test("CLI: a fully covered map exits 0; missing coverage exits 1, declared or not", () => {
    expect(cli(fullyCovered(), "").status).toBe(0);
    const declared = cli(committed);
    expect(declared.status).toBe(0);
    expect(declared.out).toContain("60 of 60 journeys have an example; 0 missing; 0 finding(s)");
    const oneDeclared = cli(fullyCovered(journeys => { at(journeys, "S2").examples = []; }), "## S2\n");
    expect(oneDeclared.status).toBe(1);
    expect(oneDeclared.out).toContain("no example yet: S2");
    const undeclared = cli(fullyCovered(journeys => { at(journeys, "S2").examples = []; }), "");
    expect(undeclared.status).toBe(1);
    expect(undeclared.out).toContain("journey 2 (S2): no example, and not declared in catalogue/gaps/journeys.md");
  });

  test("CLI: a deleted row and an unknown example each exit 1", () => {
    const deleted = cli(fullyCovered(journeys => { journeys.splice(1, 1); }), "");
    expect(deleted.status).toBe(1);
    expect(deleted.out).toContain("journeys: 59 rows, JOURNEY-SPECS has 60");
    const unknown = cli(fullyCovered(journeys => { at(journeys, "T2").examples = ["travel-flights", "travel-flight"]; }), "");
    expect(unknown.status).toBe(1);
    expect(unknown.out).toContain("journey 9 (T2): names example travel-flight, which is not in the catalogue");
  });

  test("CLI: IDs are compared as strings, one by one, so a comma or an array cannot stand in for them", () => {
    const comma = cli(fullyCovered(journeys => { journeys[0].id = "S1,S2"; journeys.splice(1, 1); }), "");
    expect(comma.status).toBe(1);
    expect(comma.out).toContain('journey 1 (S1,S2): id is "S1,S2", JOURNEY-SPECS has "S1" here');
    const array = fullyCovered(journeys => { journeys[2].id = ["S3"]; journeys[2].title = "Not the specification title"; });
    const arrayRun = cli(array, "");
    expect(arrayRun.status).toBe(1);
    expect(arrayRun.out).toContain('journey 3: id must be a string, got ["S3"]');
  });

  test("every ID as an array fails every row and cannot satisfy a declared gap", () => {
    const allArrays = fullyCovered(journeys => { for (const journey of journeys) journey.id = [journey.id]; });
    const result = check(allArrays, new Set());
    expect(result.findings).toHaveLength(60);
    expect(result.covered).toBe(0);
    expect(cli(allArrays, "").status).toBe(1);
    expect(cli(edited(journeys => { for (const journey of journeys) journey.id = [journey.id]; })).out).toContain("journey 1: id must be a string");
  });

  test("the ID list must equal JOURNEY-SPECS: missing, extra, duplicate and reordered IDs each fail", () => {
    expect(check(edited(journeys => { journeys.pop(); })).findings).toEqual(["journeys: 59 rows, JOURNEY-SPECS has 60"]);
    expect(check(edited(journeys => { journeys.push({ id: "Z9", title: "Extra", examples: ["travel-flights"], note: "x" }); })).findings)
      .toEqual(["journeys: 61 rows, JOURNEY-SPECS has 60", 'journey 61 (Z9): id is "Z9", JOURNEY-SPECS has no journey here']);
    expect(check(edited(journeys => { journeys[1] = structuredClone(journeys[0]); })).findings[0]).toBe('journey 2 (S1): id is "S1", JOURNEY-SPECS has "S2" here');
    expect(check(edited(journeys => { [journeys[1], journeys[2]] = [journeys[2], journeys[1]]; })).findings.slice(0, 2))
      .toEqual(['journey 2 (S3): id is "S3", JOURNEY-SPECS has "S2" here', 'journey 3 (S2): id is "S2", JOURNEY-SPECS has "S3" here']);
  });

  test("a title that drifts from JOURNEY-SPECS fails", () => {
    expect(check(edited(journeys => { at(journeys, "K2").title = "Text someone"; })).findings)
      .toEqual(['journey 53 (K2): title is "Text someone", JOURNEY-SPECS says "Text / WhatsApp / iMessage someone"']);
  });

  test("examples must be a list of example id strings", () => {
    expect(check(edited(journeys => { at(journeys, "T2").examples = "travel-flights"; })).findings)
      .toEqual(["journey 9 (T2): examples must be a list of example ids"]);
    expect(check(edited(journeys => { at(journeys, "T2").examples = [["travel-flights"]]; })).findings)
      .toEqual(["journey 9 (T2): examples must be a list of example ids"]);
  });

  test("a declared gap that gains an example fails until its section is removed; unknown gap IDs fail", () => {
    expect(check(edited(journeys => { at(journeys, "C1").examples = ["prod-agenda"]; }), new Set([...gaps, "C1"])).findings)
      .toEqual(["journey 27 (C1): has examples, but catalogue/gaps/journeys.md still declares it a gap"]);
    expect(check(committed, new Set([...gaps, "Z9"])).findings).toEqual(["gaps: catalogue/gaps/journeys.md declares Z9, which is not a journey"]);
  });

  test("the gaps file declares a journey only by its own heading", () => {
    expect([...gapIds("## T5\n### C1\n## Q3 watch\nsee ## P2\n")]).toEqual(["T5", "Q3"]);
  });
});
