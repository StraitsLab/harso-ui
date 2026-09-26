import { describe, expect, test } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { carriesData, checkPlaybookData, STATES } from "../scripts/check-output-playbook.mjs";
import examplesFile from "../docs/agent/output-playbook.examples.json";
import schemaFile from "../docs/agent/schema/output-blocks.v1.json";

// Regression (PR #14 round 2, reviewer F1): a state's name never earns an exemption on its own. Loading, failed and empty
// skip the data laws only when their document carries no data (a bare status, optionally an action); a data-bearing
// document in any state is held to every law. Reviewer probe /tmp/rv14-f0/probe-r2.mjs, kept here as tests.

const SCHEMA_SHA256 = "470aa1aec345587faaa4004ee00a499f3044540dfbde1126ff130072fdd68f87";
const schema = schemaFile as any;
type Doc = { header: { title: string; subtitle?: string }; blocks: Array<{ kind: string }>; details?: unknown; [key: string]: unknown };

function findingsWithState(id: string, state: string, document: Doc): string[] {
  const copy = structuredClone(examplesFile as any);
  const example = copy.examples.find((item: { id: string }) => item.id === id);
  example.states = { [state]: document };
  return checkPlaybookData(copy, schema, SCHEMA_SHA256).findings.filter((finding: string) => finding.startsWith(`example ${id}:`));
}
const example = (id: string) => structuredClone((examplesFile as any).examples.find((item: { id: string }) => item.id === id));

describe("state exemptions follow what the state carries, not its name", () => {
  test.each(STATES as string[])("data read at a moment without its 'as of' stamp is rejected in %s", state => {
    const document: Doc = structuredClone(example("money-portfolio").states.stale);
    document.header.subtitle = "IBKR";
    expect(findingsWithState("money-portfolio", state, document).join("\n")).toMatch(/as of HH:MM/);
  });

  test.each(STATES as string[])("weather data without its sources is rejected in %s", state => {
    const document: Doc = structuredClone(example("weather-week").document);
    delete document.details;
    expect(findingsWithState("weather-week", state, document).join("\n")).toMatch(/law 5/);
  });

  test("a bare status document (no data) keeps its loading / failed / empty exemptions", () => {
    const shipped = example("money-portfolio").states;
    for (const state of ["loading", "failed", "empty"]) {
      expect(carriesData(shipped[state])).toBe(false);
      expect(findingsWithState("money-portfolio", state, shipped[state])).toEqual([]);
    }
  });

  test("a status plus an action is still no data; any other block is data", () => {
    const status = { kind: "status", state: "failed", detail: "The broker did not answer." };
    expect(carriesData({ header: { title: "t" }, blocks: [status, { kind: "action" }] })).toBe(false);
    for (const kind of ["rows", "numbers", "table", "text", "visual"]) {
      expect(carriesData({ header: { title: "t" }, blocks: [status, { kind }] })).toBe(true);
    }
  });
});
