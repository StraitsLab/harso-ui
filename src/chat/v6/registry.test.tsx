import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, harsoOutputWholeAnswer, type HarsoOutputCardProps, type HarsoOutputDocument } from "../output-card";
import { V6_FAMILIES, harsoV6WidgetSizes, v6TemplateOf } from "./registry";
import { V6_TEMPLATES, type V6Family, type V6FamilyProps, type V6Registry, type V6Template } from "./types";

// WEV-3303: the empty registry, the dispatch seam and the generic fallback. A family is any object with
// renderFamily + supportedWidgetSizes; the card picks it only from `document.template`, never from a title or blocks.

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const doc = (template?: unknown, extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, header: { title: "Quote" },
  blocks: [{ kind: "rows", items: [{ label: "Acme", trailing: "S$10" }] }],
  fallback_text: "FALLBACK", ...(template === undefined ? {} : { template } as object), ...extra,
});
const familyOf = (render: V6Family["renderFamily"], sizes: V6Family["supportedWidgetSizes"] = () => ["small", "medium"]): V6Family =>
  ({ renderFamily: render, supportedWidgetSizes: sizes });
const draw = (document: HarsoOutputDocument, families?: V6Registry, props: Partial<HarsoOutputCardProps> = {}) =>
  render(<div className="harso-kit"><HarsoOutputCard document={document} onViewAll={() => {}} families={families} {...props} /></div>);
/** useId values differ between two renders; everything else must be identical. */
const shape = (html: string) => html.replace(/\s(?:id|aria-labelledby|aria-controls)="[^"]*"/g, "");

test("the shipped registry is empty and frozen: a populated one is the Lead's later edit", () => {
  expect(Object.keys(V6_FAMILIES)).toEqual([]);
  expect(Object.isFrozen(V6_FAMILIES)).toBe(true);
});

test("the template enum is the 20 existing names", () => {
  expect(V6_TEMPLATES).toHaveLength(20);
  expect(new Set(V6_TEMPLATES).size).toBe(20);
  expect(V6_TEMPLATES).toContain("weather-now");
});

test.each([
  ["absent", undefined, undefined],
  ["known", "weather-now", "weather-now"],
  ["unknown name", "weather-later", undefined],
  ["a variant name the wire must never carry", "flight-status-inair", undefined],
  ["a prototype key", "constructor", undefined],
  ["__proto__", "__proto__", undefined],
  ["not a string", 7, undefined],
])("v6TemplateOf: %s", (_name, value, expected) => {
  expect(v6TemplateOf(doc(value))).toBe(expected);
});

test("a hinted document with no family registered draws exactly the generic card the unhinted one draws", () => {
  const plain = draw(doc()).container.innerHTML;
  cleanup();
  const hinted = draw(doc("stock-quote")).container.innerHTML;
  expect(shape(hinted)).toBe(shape(plain));
  expect(screen.getByRole("region", { name: "Quote" }).textContent).toContain("Acme");
});

test("a template hint never changes the generic card, even with unrelated families registered", () => {
  const other = vi.fn(() => <p>other</p>);
  const families: V6Registry = { "weather-now": familyOf(other) };
  const plain = draw(doc("stock-quote")).container.innerHTML;
  cleanup();
  const hinted = draw(doc("stock-quote"), families).container.innerHTML;
  expect(shape(hinted)).toBe(shape(plain));
  expect(other).not.toHaveBeenCalled();
});

test("the template passes through untouched: the family gets the same document object, the whole answer keeps the key", () => {
  const document = doc("stock-quote");
  const seen: V6FamilyProps[] = [];
  draw(document, { "stock-quote": familyOf(props => { seen.push(props); return <p>family</p>; }) });
  expect(seen[0].document).toBe(document);
  expect(seen[0].document.template).toBe("stock-quote");
  expect(harsoOutputWholeAnswer(document).template).toBe("stock-quote");
});

test("a registered family draws instead of the generic body and receives the frozen V6FamilyProps", () => {
  const props: Partial<HarsoOutputCardProps> = {
    onOpenUrl: vi.fn(), onOpenArtifact: vi.fn(), onDownloadArtifact: vi.fn(), onWorkControl: vi.fn(), onRoutineControl: vi.fn(),
    onPageWatchControl: vi.fn(), subjectState: vi.fn(), blockStates: { 0: { state: "stale" } }, media: { resolveArtifact: () => "x" },
    onOpenDetails: vi.fn(), widgetSize: "medium", renderBrand: () => "mark"
  };
  const onViewAll = vi.fn();
  const seen: V6FamilyProps[] = [];
  const document = doc("stock-quote");
  render(<HarsoOutputCard document={document} onViewAll={onViewAll} {...props}
    families={{ "stock-quote": familyOf(p => { seen.push(p); return <p>family body</p>; }) }} />);
  expect(screen.getByText("family body")).toBeTruthy();
  expect(screen.queryByText("Acme")).toBeNull();
  const got = seen[0];
  expect(got.mode).toBe("inline");
  expect(got.widgetSize).toBe("medium");
  expect(got.media).toBe(props.media);
  expect(got.onOpenDetails).toBe(props.onOpenDetails);
  expect(got.renderBrand).toBe(props.renderBrand);
  expect(got.host).toMatchObject({
    onViewAll, onOpenUrl: props.onOpenUrl, onOpenArtifact: props.onOpenArtifact, onDownloadArtifact: props.onDownloadArtifact,
    onWorkControl: props.onWorkControl, onRoutineControl: props.onRoutineControl, onPageWatchControl: props.onPageWatchControl,
    subjectState: props.subjectState, blockStates: props.blockStates
  });
});

test("optional props keep a callable shape: media is {} and renderBrand always exists; absent host callbacks stay absent", () => {
  const seen: V6FamilyProps[] = [];
  draw(doc("stock-quote"), { "stock-quote": familyOf(p => { seen.push(p); return <p>family</p>; }) });
  expect(seen[0].media).toEqual({});
  expect(typeof seen[0].renderBrand).toBe("function");
  expect(seen[0].host.onOpenUrl).toBeUndefined();
  expect(seen[0].host.onPageWatchControl).toBeUndefined();
  expect(seen[0].widgetSize).toBeUndefined();
  expect(seen[0].onOpenDetails).toBeUndefined();
});

test("mode is inline by default, full for the uncapped view, and an explicit mode wins", () => {
  const modes: string[] = [];
  const families: V6Registry = { "stock-quote": familyOf(p => { modes.push(p.mode); return <p>family</p>; }) };
  draw(doc("stock-quote"), families);
  cleanup();
  draw(doc("stock-quote"), families, { caps: { maxRows: Infinity } });
  cleanup();
  draw(doc("stock-quote"), families, { mode: "full" });
  cleanup();
  draw(doc("stock-quote"), families, { caps: { maxRows: Infinity }, mode: "inline" });
  expect(modes).toEqual(["inline", "full", "full", "inline"]);
});

test.each([["undefined", undefined], ["null", null]])("a family that returns %s leaves the generic card in place", (_name, result) => {
  const renderFamily = vi.fn(() => result as undefined);
  draw(doc("stock-quote"), { "stock-quote": familyOf(renderFamily) });
  expect(renderFamily).toHaveBeenCalled();
  expect(screen.getByText("Acme")).toBeTruthy();
});

test("a family's hooks are legal and keep their state while the document is replaced", () => {
  function Counter() {
    const [count, setCount] = useState(0);
    return <button type="button" onClick={() => setCount(count + 1)}>count {count}</button>;
  }
  const families: V6Registry = { "stock-quote": familyOf(() => <Counter />) };
  const { rerender } = draw(doc("stock-quote"), families);
  fireEvent.click(screen.getByRole("button", { name: "count 0" }));
  rerender(<div className="harso-kit"><HarsoOutputCard document={doc("stock-quote")} onViewAll={() => {}} families={families} /></div>);
  expect(screen.getByRole("button", { name: "count 1" })).toBeTruthy();
});

test("hooks called inside renderFamily belong to the boundary, and a family that starts declining still lets the card draw", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const families: V6Registry = { "stock-quote": familyOf(props => {
    const [seen] = useState(props.document.header.title);
    return props.document.blocks[0]?.kind === "rows" ? <p>family {seen}</p> : undefined;
  }) };
  const { rerender } = draw(doc("stock-quote"), families);
  expect(screen.getByText("family Quote")).toBeTruthy();
  // Data the family cannot draw: it declines and the card falls back to its generic fallback text.
  rerender(<div className="harso-kit"><HarsoOutputCard document={doc("stock-quote", { blocks: [{ kind: "future_block" }] })} onViewAll={() => {}} families={families} /></div>);
  expect(screen.getByText("FALLBACK")).toBeTruthy();
  expect(error).not.toHaveBeenCalled();
});

test("a family that throws never blanks the answer: the generic card draws", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  draw(doc("stock-quote"), { "stock-quote": familyOf(() => { throw new Error("family bug"); }) });
  expect(screen.getByRole("region", { name: "Quote" }).textContent).toContain("Acme");
});

test("changing the template swaps the family and does not carry state across", () => {
  const A = () => { const [n, set] = useState(0); return <button type="button" onClick={() => set(n + 1)}>A {n}</button>; };
  const B = () => { const [n] = useState(0); return <p>B {n}</p>; };
  const families: V6Registry = { "stock-quote": familyOf(() => <A />), "weather-now": familyOf(() => <B />) };
  const { rerender } = draw(doc("stock-quote"), families);
  fireEvent.click(screen.getByRole("button", { name: "A 0" }));
  rerender(<div className="harso-kit"><HarsoOutputCard document={doc("weather-now")} onViewAll={() => {}} families={families} /></div>);
  expect(screen.getByText("B 0")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /A / })).toBeNull();
});

test("an unknown or prototype template name never reaches a family", () => {
  const renderFamily = vi.fn(() => <p>family</p>);
  const families = { "stock-quote": familyOf(renderFamily) } as V6Registry;
  for (const template of ["nope", "constructor", "toString", "__proto__"]) { draw(doc(template), families); cleanup(); }
  expect(renderFamily).not.toHaveBeenCalled();
});

test("widget sizes come from the registered family for the document's template, else none", () => {
  const sizes = vi.fn((template: V6Template) => template === "stock-quote" ? (["small", "medium", "large"] as const) : []);
  const families: V6Registry = { "stock-quote": familyOf(() => <p>f</p>, sizes) };
  expect(harsoV6WidgetSizes(doc("stock-quote"), families)).toEqual(["small", "medium", "large"]);
  expect(sizes).toHaveBeenCalledWith("stock-quote");
  expect(harsoV6WidgetSizes(doc("weather-now"), families)).toEqual([]);
  expect(harsoV6WidgetSizes(doc(), families)).toEqual([]);
  expect(harsoV6WidgetSizes(doc("stock-quote"))).toEqual([]);
});

test("the generic card keeps its own region name and Details behaviour with a hint present", () => {
  const document = doc("stock-quote", { details: { disclaimers: ["Not advice."] } });
  draw(document);
  const card = screen.getByRole("region", { name: "Quote" });
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  expect(within(card).getByText("Not advice.")).toBeTruthy();
});
