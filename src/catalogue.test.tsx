import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { buildPlaybook } from "../scripts/build-catalogue.mjs";
// @ts-expect-error - plain ESM script without type declarations
import { checkPlaybook, checkPlaybookData, EXAMPLES_PATH, lawErrors, projectSurface, SCHEMA_PATH } from "../scripts/check-output-playbook.mjs";
import { CataloguePage, catalogueRouteFromHash, catalogueVerticals } from "../preview/catalogue-gallery";
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

  // Review round 1 (F1): the playbook laws and the period check ran on `document` only, so each of these passed.
  const portfolio = (file: any) => file.examples.find((item: any) => item.id === "money-portfolio");
  test.each([
    ["fallback leaves out a figure", "stale", (s: any) => { s.fallback_text = "The portfolio has changed."; }, /states\.stale truth: fallback_text leaves out US\$84,210/],
    ["exclamation", "stale", (s: any) => { s.header.title = "Portfolio!"; }, /states\.stale voice: \$\.document\.header\.title uses an exclamation mark/],
    ["no as-of time on data read at a moment", "stale", (s: any) => { s.header.subtitle = "IBKR"; }, /states\.stale stale: time-sensitive data says "as of HH:MM"/],
    ["no as-of time on an empty read", "empty", (s: any) => { s.header.subtitle = "IBKR"; }, /states\.empty stale: time-sensitive data says "as of HH:MM"/],
    ["reply button", "stale", (s: any) => { s.blocks.push({ kind: "action", primary: { kind: "reply", label: "Refresh", text: "Refresh" } }); }, /states\.stale law 3: action\.primary is a reply button/],
    ["failed without detail", "failed", (s: any) => { delete s.blocks[0].detail; }, /states\.failed failure: \$\.blocks\[0\]: a failed card says what happened/],
    ["date outside \"this week\"", "stale", (s: any) => { s.header.title = "Portfolio 1 Jan"; }, /states\.stale truth: 2026-01-01 is outside "this week"/],
    ["rows advertised beyond those sent", "partial", (s: any) => { s.blocks[0].total_count = 9; }, /states\.partial truth: \$\.blocks\[0\]: rows beyond those sent must be reachable/],
    ["markup", "partial", (s: any) => { s.blocks[0].items[0].label = "**NVIDIA**"; }, /states\.partial plain text: .* contains markup/],
    ["source in visible text", "loading", (s: any) => { s.header.subtitle = "according to IBKR"; }, /states\.loading law 5: .*sources and links live in Details/],
    ["shares not largest first", "partial", (s: any) => { s.blocks[0].items = [{ label: "Cash", secondary: "20%" }, { label: "Stocks", secondary: "80%" }]; }, /states\.partial shares: .*shares go largest first/],
    ["eleven rows", "partial", (s: any) => { s.blocks[0].items = Array.from({ length: 11 }, (_, i) => ({ label: `Holding ${i}` })); }, /states\.partial law 4: .*send at most 10 rows/],
    ["a home-page link", "failed", (s: any) => { s.blocks.push({ kind: "action", secondary: { kind: "open_url", label: "Open IBKR", url: "https://www.interactivebrokers.com/" } }); }, /states\.failed truth: action "Open IBKR" opens a site's home page/],
  ])("a state is held to the document's laws: %s", (_name, state, edit, expected) => {
    const findings = check(buildWith("money.json", file => edit(portfolio(file).states[state]))).join("\n");
    expect(findings).toMatch(expected);
  });

  test("laws that need data do not apply to a state that carries none, and the main answer's own checks run once", () => {
    // Loading and failed read nothing: no "as of" stamp. The same subtitle on stale (data) is a finding above.
    const noStamp = check(buildWith("money.json", file => { for (const name of ["loading", "failed"]) portfolio(file).states[name].header.subtitle = "IBKR"; }));
    expect(noStamp).toEqual([]);
    // The main answer is declared "page"; its stale state fits inline. The declared surface is the main answer's alone.
    expect(projectSurface(portfolio(JSON.parse(readCatalogue("money.json"))).states.stale)).toBe("inline");
    expect(check(playbookText)).toEqual([]);
  });

  test("a status or row word is looked up as an own key, never an inherited one", () => {
    const example = structuredClone(portfolio(JSON.parse(readCatalogue("money.json"))));
    example.states.loading.blocks[0].state = "toString";
    expect(lawErrors(example, undefined, "loading").join("\n")).toMatch(/state toString is outside the closed set/);
    example.states.partial.blocks[0].items[0].status = "constructor";
    expect(lawErrors(example, undefined, "partial").join("\n")).toMatch(/row status constructor has no meaning/);
  });
});

describe("catalogue gallery overflow and routes", () => {
  afterEach(() => { window.location.hash = ""; });
  const exampleRow = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[data-example="${id}"]`)!;

  // Review round 1 (F2): View all did nothing, so rows, numbers and text the card held back were unreachable.
  test("View all opens the whole answer in place, and Show less and Escape close it with focus back on View all", () => {
    const { container } = render(<CataloguePage vertical="money" mode="light" />);
    const frame = exampleRow(container, "money-portfolio").querySelector<HTMLElement>(".hkl-cat-frame")!;
    expect(within(frame).queryByText("US Treasury bills")).toBeNull();
    fireEvent.click(within(frame).getByRole("button", { name: "View all 11" }));
    const full = within(frame).getByRole("region", { name: "Portfolio, full answer" });
    expect(full).toHaveFocus();
    for (const name of ["NVIDIA", "Vanguard S&P 500", "iShares Core MSCI World", "US Treasury bills"]) expect(within(full).getByText(name)).toBeVisible();
    expect(within(full).queryByRole("button", { name: /View all/ })).toBeNull();
    fireEvent.click(within(full).getByRole("button", { name: "Show less" }));
    expect(within(frame).queryByText("US Treasury bills")).toBeNull();
    expect(within(frame).getByRole("button", { name: "View all 11" })).toHaveFocus();
    fireEvent.click(within(frame).getByRole("button", { name: "View all 11" }));
    fireEvent.keyDown(within(frame).getByRole("region", { name: "Portfolio, full answer" }), { key: "Escape" });
    expect(within(frame).queryByRole("region", { name: /full answer/ })).toBeNull();
    expect(within(frame).getByRole("button", { name: "View all 11" })).toHaveFocus();
  }, 60_000);

  test.each(catalogueVerticals)("every View all in %s reaches every row, number and line of text the card held back", vertical => {
    const { container } = render(<CataloguePage vertical={vertical} mode="light" />);
    const examples = JSON.parse(readCatalogue(`${vertical}.json`)).examples;
    for (const example of examples) {
      const row = exampleRow(container, example.id);
      const documents = [example.document, ...Object.values(example.states ?? {})] as any[];
      [...row.querySelectorAll<HTMLElement>(".hkl-cat-state")].forEach((state, index) => {
        const frame = state.querySelector<HTMLElement>(".hkl-cat-frame")!;
        const viewAll = within(frame).queryByRole("button", { name: /View all/ });
        if (!viewAll) return;
        fireEvent.click(viewAll);
        const full = within(frame).getByRole("region", { name: /full answer/ });
        const text = full.textContent!;
        const expected = documents[index].blocks.flatMap((block: any) => block.kind === "rows" ? block.items.flatMap((item: any) => [item.label, item.secondary, item.trailing])
          : block.kind === "numbers" ? block.items.flatMap((item: any) => [item.value, item.label])
            : block.kind === "text" ? [block.summary, ...block.sections.flatMap((section: any) => [section.heading, ...section.paragraphs ?? [], ...section.bullets ?? []])] : []).filter(Boolean);
        for (const words of expected) expect(text, `${example.id} ${index}`).toContain(words);
        expect(within(full).queryByRole("button", { name: /View all/ }), example.id).toBeNull();
        fireEvent.click(within(full).getByRole("button", { name: "Show less" }));
      });
    }
  }, 60_000);

  // Review round 1 (F3): `mode in MODES` accepted inherited keys, and the page then crashed on them.
  test.each(["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf", "bogus"])("mode=%s falls back to both appearances", mode => {
    window.location.hash = `#/catalogue/money?mode=${mode}`;
    const route = catalogueRouteFromHash()!;
    expect(route).toEqual({ vertical: "money", mode: "both" });
    const { container } = render(<CataloguePage {...route} />);
    expect(container.querySelectorAll(".hkl-cat-example").length).toBeGreaterThan(0);
    // The page itself fails closed too, whatever it is handed.
    const direct = render(<CataloguePage vertical="money" mode={mode} />);
    const frames = [...direct.container.querySelectorAll(".hkl-cat-frame")].slice(0, 4).map(frame => frame.getAttribute("data-mode"));
    expect(frames).toEqual(["light", "light", "dark", "dark"]);
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
