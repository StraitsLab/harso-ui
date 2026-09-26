import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { buildPlaybook } from "../scripts/build-catalogue.mjs";
// @ts-expect-error - plain ESM script without type declarations
import { checkPlaybook, checkPlaybookData, EXAMPLES_PATH, SCHEMA_PATH } from "../scripts/check-output-playbook.mjs";
import { CataloguePage, catalogueVerticals } from "../preview/catalogue-gallery";
import schemaFile from "../docs/agent/schema/output-blocks.v1.json";
import playbookText from "../docs/agent/output-playbook.examples.json?raw";

const catalogueFiles = import.meta.glob<string>("../catalogue/*.json", { query: "?raw", import: "default", eager: true });

const SCHEMA_SHA256 = "470aa1aec345587faaa4004ee00a499f3044540dfbde1126ff130072fdd68f87";
const readCatalogue = (name: string) => catalogueFiles[`../catalogue/${name}`];
/** Builds the playbook from the catalogue with one file's parsed JSON edited in memory. */
function buildWith(name: string, edit: (file: any) => void) {
  return buildPlaybook((file: string) => {
    if (file !== name) return readCatalogue(file);
    const json = JSON.parse(readCatalogue(file));
    edit(json);
    return `${JSON.stringify(json, null, 2)}\n`;
  });
}
const check = (built: string) => checkPlaybookData(JSON.parse(built), schemaFile, SCHEMA_SHA256).findings as string[];

describe("the catalogue is the one source of the examples", () => {
  test("the generated playbook file is exactly what the catalogue builds, and each vertical round-trips", () => {
    const generated = playbookText;
    expect(buildPlaybook()).toBe(generated);
    const playbook = JSON.parse(generated);
    expect(playbook.verticals).toEqual(catalogueVerticals);
    for (const vertical of catalogueVerticals) {
      const file = JSON.parse(readCatalogue(`${vertical}.json`));
      // Every example is carried byte for byte (same key order, same text), in file order.
      expect(JSON.stringify(file.examples), vertical).toBe(JSON.stringify(playbook.examples.filter((example: any) => example.vertical === vertical)));
    }
    expect(playbook.examples).toHaveLength(catalogueVerticals.reduce((sum, vertical) => sum + JSON.parse(readCatalogue(`${vertical}.json`)).examples.length, 0));
  });

  test("the checker fails when a vertical changes without regenerating the playbook file", () => {
    expect(checkPlaybook(EXAMPLES_PATH, SCHEMA_PATH).findings).toEqual([]);
    const edited = buildWith("money.json", file => { file.examples[0].says = "You stayed under budget."; });
    expect(edited).not.toBe(playbookText);
    expect(checkPlaybook(EXAMPLES_PATH, SCHEMA_PATH, edited).findings).toEqual([expect.stringMatching(/output-playbook\.examples\.json is stale/)]);
  });

  test("a lane adds an example to its own vertical file without editing the checker", () => {
    const added = buildWith("sports.json", file => {
      const example = structuredClone(file.examples.find((item: any) => item.id === "sports-score"));
      example.id = "sports-score-copy";
      file.examples.push(example);
      file.fresh.push(example.id);
    });
    expect(check(added)).toEqual([]);
    // The verdict still binds: the same example left out of the vertical's fresh list is a finding.
    const undecided = buildWith("sports.json", file => {
      const example = structuredClone(file.examples.find((item: any) => item.id === "sports-score"));
      example.id = "sports-score-copy";
      file.examples.push(example);
    });
    expect(check(undecided).join("\n")).toMatch(/fresh is true, but the playbook's verdict for sports-score-copy is false/);
  });

  test("a flipped fresh flag in a vertical file is still a finding", () => {
    expect(check(buildWith("food.json", file => { file.examples.find((item: any) => item.id === "food-menu").fresh = false; })).join("\n"))
      .toMatch(/verdict for food-menu is true/);
  });

  test("a vertical file cannot hold another vertical's example or decide freshness for one it lacks", () => {
    expect(() => buildWith("news.json", file => { file.examples[0].vertical = "sports"; })).toThrow(/belongs to sports/);
    expect(() => buildWith("news.json", file => { file.fresh.push("sports-score"); })).toThrow(/fresh names sports-score/);
  });

  test("states are validated exactly like the document", () => {
    const states = JSON.parse(readCatalogue("money.json")).examples.find((item: any) => item.id === "money-portfolio").states;
    expect(Object.keys(states)).toEqual(["loading", "partial", "stale", "empty", "failed"]);
    const unknown = buildWith("money.json", file => { const e = file.examples.find((item: any) => item.id === "money-portfolio"); e.states.done = e.states.failed; });
    expect(check(unknown).join("\n")).toMatch(/states: done is not one of loading, partial, stale, empty, failed/);
    const styled = buildWith("money.json", file => { file.examples.find((item: any) => item.id === "money-portfolio").states.stale.header.color = "red"; });
    expect(check(styled).join("\n")).toMatch(/money-portfolio: states\.stale schema \$\.header\.color: unexpected field/);
    const twoNumbers = buildWith("money.json", file => {
      const stale = file.examples.find((item: any) => item.id === "money-portfolio").states.stale;
      stale.blocks.push(structuredClone(stale.blocks[0]));
    });
    expect(check(twoNumbers).join("\n")).toMatch(/states\.stale contract \$\.blocks: at most one 'numbers' block/);
    const onText = buildWith("money.json", file => { file.examples.find((item: any) => item.id === "text-convert").states = { failed: {} }; });
    expect(check(onText).join("\n")).toMatch(/text-convert: states: a card or file example's states are a map/);
  });
});

describe("catalogue gallery", () => {
  afterEach(() => { vi.restoreAllMocks(); window.location.hash = ""; });

  test("#/catalogue lists every vertical with its count", () => {
    render(<CataloguePage mode="both" />);
    for (const vertical of catalogueVerticals) {
      const count = JSON.parse(readCatalogue(`${vertical}.json`)).examples.length;
      expect(screen.getByRole("link", { name: vertical }).parentElement).toHaveTextContent(`${vertical} ${count}`);
    }
  });

  test.each(catalogueVerticals)("draws every %s example at 390 and 420 in light and dark, each state below, no console errors", vertical => {
    const errors = vi.spyOn(console, "error");
    const { container } = render(<CataloguePage vertical={vertical} mode="both" />);
    const examples = JSON.parse(readCatalogue(`${vertical}.json`)).examples;
    const drawn = container.querySelectorAll(".hkl-cat-example");
    expect(drawn).toHaveLength(examples.length);
    examples.forEach((example: any, index: number) => {
      const row = drawn[index];
      expect(row.querySelector(".hkl-cat-asked")).toHaveTextContent(example.request);
      const states = Object.keys(example.states ?? {});
      expect([...row.querySelectorAll("[data-state]")].map(node => node.getAttribute("data-state"))).toEqual(states);
      const frames = [...row.querySelectorAll(".hkl-cat-frame")];
      expect(frames).toHaveLength(4 * (1 + states.length));
      expect(frames.slice(0, 4).map(frame => `${frame.getAttribute("data-mode")}-${frame.getAttribute("data-width")}`)).toEqual(["light-390", "light-420", "dark-390", "dark-420"]);
      expect(row.querySelectorAll(".hkc-output-card")).toHaveLength(example.document ? frames.length : 4 * states.length);
    });
    expect(errors).not.toHaveBeenCalled();
  });
});
