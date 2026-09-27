import { describe, expect, test } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { checkJourneys, checkJourneysData, gapIds, JOURNEYS } from "../scripts/check-journeys.mjs";
// @ts-expect-error - plain ESM script without type declarations
import { buildPlaybook } from "../scripts/build-catalogue.mjs";
import journeysFile from "../catalogue/journeys.json";
import gapsText from "../catalogue/gaps/journeys.md?raw";

type Journey = { id: string; title: string; examples: string[]; note: string };
const exampleIds = new Set<string>(JSON.parse(buildPlaybook()).examples.map((example: { id: string }) => example.id));
const gaps = gapIds(gapsText) as Set<string>;
/** The findings for a copy of journeys.json with `edit` applied. */
function findingsAfter(edit: (journeys: Journey[]) => void, gapSet: Set<string> = gaps): string[] {
  const copy = structuredClone(journeysFile) as { journeys: Journey[] };
  edit(copy.journeys);
  return checkJourneysData(copy, exampleIds, gapSet).findings;
}
const journey = (journeys: Journey[], id: string) => journeys.find(item => item.id === id)!;

describe("every journey names its catalogue example", () => {
  test("the committed map is clean: 56 covered, the 4 declared gaps are exactly the empty ones", () => {
    const result = checkJourneys();
    expect(result.findings).toEqual([]);
    expect(JOURNEYS).toHaveLength(60);
    expect(result.covered).toBe(56);
    expect(result.gaps).toEqual(["T5", "C1", "Q3", "P2"]);
  });

  test("deleting one journey's mapping fails unless it is declared a gap", () => {
    expect(findingsAfter(journeys => { journey(journeys, "S1").examples = []; })).toEqual(["journey S1: no example, and not declared in catalogue/gaps/journeys.md"]);
  });

  test("an example that is not in the catalogue fails, including a renamed one", () => {
    expect(findingsAfter(journeys => { journey(journeys, "T2").examples = ["travel-flights", "travel-flight"]; })).toEqual(["journey T2: names example travel-flight, which is not in the catalogue"]);
  });

  test("the ID list must equal JOURNEY-SPECS: a missing, an extra and a reordered ID each fail", () => {
    expect(findingsAfter(journeys => { journeys.splice(journeys.findIndex(item => item.id === "H2"), 1); })[0]).toMatch(/^journeys: the IDs are .*,H1, but JOURNEY-SPECS has .*,H1,H2$/);
    expect(findingsAfter(journeys => { journeys.push({ id: "Z9", title: "Extra", examples: ["travel-flights"], note: "x" }); })[0]).toMatch(/^journeys: the IDs are .*,H2,Z9, but/);
    expect(findingsAfter(journeys => { [journeys[0], journeys[1]] = [journeys[1], journeys[0]]; })[0]).toMatch(/^journeys: the IDs are S2,S1,/);
  });

  test("a title that drifts from JOURNEY-SPECS fails", () => {
    expect(findingsAfter(journeys => { journey(journeys, "K2").title = "Text someone"; })).toEqual(['journey K2: title is "Text someone", JOURNEY-SPECS says "Text / WhatsApp / iMessage someone"']);
  });

  test("a declared gap that gains an example fails until the gap section is removed", () => {
    expect(findingsAfter(journeys => { journey(journeys, "C1").examples = ["prod-agenda"]; })).toEqual(["journey C1: has examples, but catalogue/gaps/journeys.md still declares it a gap"]);
    expect(findingsAfter(() => {}, new Set([...gaps, "Z9"]))).toEqual(["gaps: catalogue/gaps/journeys.md declares Z9, which is not a journey"]);
  });

  test("the gaps file declares a journey only by its own heading", () => {
    expect([...gapIds("## T5\n### C1\n## Q3 watch\nsee ## P2\n")]).toEqual(["T5", "Q3"]);
  });
});
