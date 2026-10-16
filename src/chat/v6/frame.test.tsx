import axe from "axe-core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputActionRow, type HarsoOutputDocument } from "../output-card";
import { V6Brand, V6Frame, type V6FrameProps } from "./frame";
import type { V6Host } from "./types";

// WEV-3303: the common frame every family draws through: a header whose open target and trailing area are siblings
// (never a button holding buttons), snapshot metadata that makes no live claim, a brand mark from the host's callback.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const AS_OF = "2026-10-11T09:10Z";
const doc = (extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, header: { title: "Acme Bank", subtitle: "Statement", brand: "acme.example" },
  blocks: [], fallback_text: "FALLBACK", as_of: AS_OF, ...extra
});
const hostOf = (extra: Partial<V6Host> = {}): V6Host => ({ onViewAll: vi.fn(), ...extra });
function frame(props: Partial<V6FrameProps> = {}) {
  const host = props.host ?? hostOf();
  const view = render(<div className="harso-kit"><V6Frame document={doc()} mode="inline" host={host} {...props} /></div>);
  return { host, view, card: screen.getByRole("region", { name: props.document?.header.title ?? "Acme Bank" }) };
}
const INTERACTIVE = "button, a[href], input, select, textarea, [role=button], [tabindex]";

test("the frame is a region named by its heading, with subtitle, snapshot and children in the order given", () => {
  const { card } = frame({ children: <><p>one</p><p>two</p></> });
  expect(card.querySelector("h2")!.textContent).toBe("Acme Bank");
  expect(within(card).getByText("Statement")).toBeTruthy();
  expect(within(card).getByText(/^As of /)).toBeTruthy();
  const body = [...card.querySelectorAll("p")].map(node => node.textContent);
  expect(body.slice(-2)).toEqual(["one", "two"]);
  expect(card.getAttribute("data-template")).toBeNull();
});

test("inline: the title is the open target and asks the host to open the whole answer once", () => {
  const { card, host } = frame();
  const open = within(card).getByRole("button", { name: "Acme Bank" });
  expect(open.closest("h2")).not.toBeNull();
  fireEvent.click(open);
  expect(host.onViewAll).toHaveBeenCalledTimes(1);
});

test("full: the answer is already open, so the title is a plain heading", () => {
  const { card } = frame({ mode: "full" });
  expect(within(card).queryByRole("button")).toBeNull();
  expect(within(card).getByRole("heading", { name: "Acme Bank" })).toBeTruthy();
});

test("the trailing area is a sibling of the open target; with nothing to put there it is not drawn", () => {
  const { card, view } = frame({ trailing: <button type="button">Menu</button> });
  const trailing = card.querySelector("[data-slot=trailing]")!;
  expect(trailing.contains(within(card).getByRole("button", { name: "Menu" }))).toBe(true);
  const open = within(card).getByRole("button", { name: "Acme Bank" });
  expect(open.contains(trailing)).toBe(false);
  expect(trailing.contains(open)).toBe(false);
  view.unmount();
  const bare = frame();
  expect(bare.card.querySelector("[data-slot=trailing]")).toBeNull();
});

test("every interactive target is legal: none sits inside another, each has a name, and axe finds no violation", async () => {
  const onOpenUrl = vi.fn();
  const { card, view } = frame({
    mode: "full",
    document: doc({ details: { sources: [{ label: "Acme API", url: "https://acme.example/api" }] }, blocks: [{ kind: "action", primary: { kind: "open_url", label: "Open Acme", url: "https://acme.example" } }] }),
    host: hostOf({ onOpenUrl }),
    trailing: <HarsoOutputActionRow block={{ kind: "action", primary: { kind: "open_url", label: "Open Acme", url: "https://acme.example" } }} host={{ onOpenUrl }} />,
    children: <p>Body</p>
  });
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  const targets = [...card.querySelectorAll(INTERACTIVE)];
  expect(targets.length).toBeGreaterThanOrEqual(3);
  for (const target of targets) {
    expect(target.parentElement!.closest(INTERACTIVE)).toBeNull();
    expect((target.textContent ?? "").trim() || target.getAttribute("aria-label") || target.getAttribute("title")).toBeTruthy();
  }
  const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

test("openArea=card stretches the one open target over the card and marks it; the default is the header", () => {
  const stretched = frame({ openArea: "card" });
  expect(stretched.card.getAttribute("data-open-area")).toBe("card");
  expect(within(stretched.card).getAllByRole("button")).toHaveLength(1);
  cleanup();
  expect(frame().card.getAttribute("data-open-area")).toBe("header");
});

test("Details hands off to the host when it can open them", () => {
  const onOpenDetails = vi.fn();
  const { card } = frame({ mode: "full", document: doc({ details: { disclaimers: ["Not advice."] } }), onOpenDetails });
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  expect(onOpenDetails).toHaveBeenCalledTimes(1);
  expect(within(card).queryByRole("region", { name: "Output details" })).toBeNull();
});

test("without a host hand-off Details discloses inline, Escape closes and returns focus, and only https sources open", () => {
  const onOpenUrl = vi.fn();
  const { card } = frame({
    mode: "full",
    document: doc({ details: { sources: [{ label: "Linked", url: "https://acme.example/a" }, { label: "Plain" }, { label: "Unsafe", url: "http://acme.example/b" }] } }),
    host: hostOf({ onOpenUrl })
  });
  const toggle = within(card).getByRole("button", { name: "Details" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(within(card).getByRole("button", { name: "Linked" }));
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith("https://acme.example/a");
  expect(within(card).queryByRole("button", { name: "Plain" })).toBeNull();
  expect(within(card).queryByRole("button", { name: "Unsafe" })).toBeNull();
  expect(within(card).getByText("Unsafe")).toBeTruthy();
  fireEvent.keyDown(within(card).getByRole("button", { name: "Linked" }), { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});

test("snapshot metadata: the saved UTC time and coverage are shown, with no live or up-to-date claim even when the clock equals the snapshot", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(AS_OF));
  const { card } = frame({ document: doc({ progress: { done: 2, total: 5, noun: "sources" } }) });
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(AS_OF));
  expect(within(card).getByText(`As of ${time} · 2 of 5 sources`)).toBeTruthy();
  expect(within(card).getByRole("meter", { name: "sources" }).getAttribute("aria-valuenow")).toBe("2");
  expect(card.textContent).not.toMatch(/\b(live|up to date|updated|just now|moments? ago|refreshed)\b/i);
});

test("the same snapshot read days later only gains its date; the frame never calls it stale, old or expired", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
  const { card } = frame();
  const meta = card.querySelector(".hkc-output-card-meta")!.textContent!;
  const day = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(AS_OF));
  expect(meta).toContain(`As of ${day}, `);
  expect(card.textContent).not.toMatch(/\b(stale|old|expired|outdated|ago)\b/i);
});

test.each(["2026-02-30T09:10Z", "yesterday", "2026-10-11 09:10", undefined])("an unusable as_of (%s) shows no snapshot line", as_of => {
  const { card } = frame({ document: doc({ as_of: as_of as string | undefined }) });
  expect(card.querySelector(".hkc-output-card-meta")).toBeNull();
});

test("brand: the host's renderBrand gets the domain and the header title and its mark is decorative", () => {
  const renderBrand = vi.fn(() => <svg data-testid="mark" />);
  const { card } = frame({ renderBrand });
  expect(renderBrand).toHaveBeenCalledExactlyOnceWith({ domain: "acme.example", label: "Acme Bank" });
  const brand = card.querySelector(".hkc-v6-brand")!;
  expect(brand.getAttribute("aria-hidden")).toBe("true");
  expect(within(brand as HTMLElement).getByTestId("mark")).toBeTruthy();
});

test("unknown brand: the callback declines, so a letter tile draws and nothing is fetched or loaded", () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("no network"));
  const renderBrand = vi.fn(() => undefined);
  const { card } = frame({ renderBrand });
  expect(renderBrand).toHaveBeenCalledTimes(1);
  expect(card.querySelector(".hkc-v6-brand")!.textContent).toBe("A");
  expect(card.querySelectorAll("img, link, script, iframe, source, video")).toHaveLength(0);
  expect(fetch).not.toHaveBeenCalled();
});

test("no renderBrand at all behaves like a decline", () => {
  const { card } = frame();
  expect(card.querySelector(".hkc-v6-brand")!.textContent).toBe("A");
});

test.each(["https://acme.example", "acme.example/path", "10.0.0.1", "localhost", "ACME.example", "user@acme.example", "acme .example", "a".repeat(254) + ".com", ""])
("a brand that is not a lowercase public host name (%s) never reaches the host's callback", domain => {
  const renderBrand = vi.fn(() => <svg />);
  const { card } = frame({ document: doc({ header: { title: "Acme Bank", brand: domain } }), renderBrand });
  expect(renderBrand).not.toHaveBeenCalled();
  expect(card.querySelector(".hkc-v6-brand")?.textContent ?? "A").toBe("A");
});

test("a header with no brand draws no mark and never asks the host", () => {
  const renderBrand = vi.fn(() => <svg />);
  const { card } = frame({ document: doc({ header: { title: "Acme Bank" } }), renderBrand });
  expect(renderBrand).not.toHaveBeenCalled();
  expect(card.querySelector(".hkc-v6-brand")).toBeNull();
});

test("V6Brand serves row brands too, with the row's own label", () => {
  const renderBrand = vi.fn(({ label }: { label: string }) => <i data-testid="row-mark">{label}</i>);
  render(<V6Brand domain="shop.example" label="Shop A" renderBrand={renderBrand} />);
  expect(renderBrand).toHaveBeenCalledExactlyOnceWith({ domain: "shop.example", label: "Shop A" });
  expect(screen.getByTestId("row-mark").textContent).toBe("Shop A");
});

test("an action whose host callback is missing is not drawn inside the frame (never a dead button)", () => {
  const block = { kind: "action", primary: { kind: "open_url", label: "Open", url: "https://acme.example" }, secondary: { kind: "page_watch_control", label: "Turn off", page_watch_id: "0192a3b4-5c6d-7e8f-9a0b-000000000a31", control: "disable" } } as const;
  const onPageWatchControl = vi.fn();
  const { card } = frame({ trailing: <HarsoOutputActionRow block={block} host={{ onPageWatchControl }} /> });
  expect(within(card).queryByRole("button", { name: "Open" })).toBeNull();
  act(() => within(card).getByRole("button", { name: "Turn off" }).click());
  expect(onPageWatchControl).toHaveBeenCalledExactlyOnceWith("disable", "0192a3b4-5c6d-7e8f-9a0b-000000000a31");
});

// WEV-3469: the approved V6 cards (explain.harso.dev/p/harso-v6) moved Details into the opened card and show one time.

test("inline: no Details button even with sources; the opened card keeps it", () => {
  const details = { sources: [{ label: "Acme API" }] };
  const inline = frame({ document: doc({ details }) });
  expect(within(inline.card).queryByRole("button", { name: "Details" })).toBeNull();
  expect(within(inline.card).getAllByRole("button").map(button => button.textContent)).toEqual(["Acme Bank"]);
  cleanup();
  const full = frame({ mode: "full", document: doc({ details }) });
  expect(within(full.card).getByRole("button", { name: "Details" })).toBeTruthy();
});

test("a subtitle that already says 'as of' gets no second time line; progress still shows", () => {
  const said = frame({ document: doc({ header: { title: "Acme Bank", subtitle: "Statement · as of 09:00" } }) });
  expect(said.card.textContent).not.toMatch(/As of /);
  cleanup();
  const progress = frame({ document: doc({ header: { title: "Acme Bank", subtitle: "Statement · As of 09:00" }, progress: { done: 2, total: 5, noun: "sources" } }) });
  expect(progress.card.querySelector(".hkc-output-card-meta")!.textContent).toBe("2 of 5 sources");
  cleanup();
  const silent = frame();
  expect(within(silent.card).getByText(/^As of /)).toBeTruthy();
});
