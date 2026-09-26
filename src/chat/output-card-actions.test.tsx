import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";

// Packet 5d: a result card opens links and files, and controls the work or routine it shows, only through the host.
// Actions are the catalogue's (file-invoice-pdf, places-directions, prod-work-running, prod-watch-reply); a kind the
// host cannot act on is not drawn, and `reply` never is (choices use the native question card).

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const FILE = "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a29";
const WORK = "0192a3b4-5c6d-7e8f-9a0b-000000000962";
const ROUTINE = "0192a3b4-5c6d-7e8f-9a0b-000000000961";
const MAPS = "https://maps.apple.com/?daddr=Jewel+Changi+Airport&dirflg=r";
const actions = {
  open_url: { kind: "open_url", label: "Directions in Maps", url: MAPS },
  open_artifact: { kind: "open_artifact", label: "Open invoice", artifact: FILE },
  download_artifact: { kind: "download_artifact", label: "Download PDF", artifact: FILE },
  work_control: { kind: "work_control", label: "Stop", work_unit_id: WORK, control: "cancel" },
  routine_control: { kind: "routine_control", label: "Pause", routine_id: ROUTINE, control: "pause" },
  reply: { kind: "reply", label: "Choose SQ 638", text: "Choose SQ 638" }
} satisfies Record<string, chat.HarsoOutputActionSpec>;
type Kind = keyof typeof actions;

const rows: chat.HarsoOutputRowsBlock = { kind: "rows", items: [{ label: "East–West line to Tanah Merah", trailing: "24 min" }] };
const doc = (action: object | undefined, extra: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, header: { title: "Card" }, blocks: action ? [rows, { kind: "action", ...action }] : [rows], fallback_text: "FALLBACK", ...extra });
const hostOf = () => ({ onOpenUrl: vi.fn(), onOpenArtifact: vi.fn(), onDownloadArtifact: vi.fn(), onWorkControl: vi.fn(), onRoutineControl: vi.fn() });
const callbackOf: Record<Exclude<Kind, "reply">, keyof ReturnType<typeof hostOf>> = {
  open_url: "onOpenUrl", open_artifact: "onOpenArtifact", download_artifact: "onDownloadArtifact", work_control: "onWorkControl", routine_control: "onRoutineControl"
};
const expectedCall: Record<Exclude<Kind, "reply">, unknown[]> = {
  open_url: [MAPS], open_artifact: [FILE], download_artifact: [FILE], work_control: ["cancel", WORK], routine_control: ["pause", ROUTINE]
};
function renderCard(document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) {
  render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} {...props} /></div>);
  return screen.getByRole("region", { name: document.header.title });
}
const buttons = (card: HTMLElement) => within(card).queryAllByRole("button").map(button => button.getAttribute("title") ?? button.textContent);

test.each(Object.keys(callbackOf) as Array<Exclude<Kind, "reply">>)("%s draws one button that calls only its host callback, once, with its target", kind => {
  const host = hostOf();
  const card = renderCard(doc({ primary: actions[kind] }), host);
  const button = within(card).getByRole("button", { name: actions[kind].label });
  fireEvent.click(button);
  expect(host[callbackOf[kind]]).toHaveBeenCalledExactlyOnceWith(...expectedCall[kind]);
  for (const other of Object.values(callbackOf)) if (other !== callbackOf[kind]) expect(host[other]).not.toHaveBeenCalled();
});

test.each(Object.keys(callbackOf) as Array<Exclude<Kind, "reply">>)("%s is not drawn when the host did not supply its callback (never a dead button)", kind => {
  const host: Partial<ReturnType<typeof hostOf>> = hostOf();
  delete host[callbackOf[kind]];
  // The quiet slot carries an action the host can act on, so the row itself still draws: only this kind is missing.
  const card = renderCard(doc({ primary: actions[kind], secondary: kind === "open_url" ? actions.download_artifact : actions.open_url }), host);
  expect(within(card).queryByRole("button", { name: actions[kind].label })).toBeNull();
  expect(card.textContent).not.toContain(actions[kind].label);
  expect(buttons(card)).toHaveLength(1);
});

test("reply is never drawn, as primary or secondary, even with every callback supplied; the card still draws", () => {
  const host = hostOf();
  const card = renderCard(doc({ primary: actions.reply, secondary: actions.reply }), host);
  expect(card).not.toHaveAttribute("data-fallback");
  expect(within(card).queryAllByRole("button")).toHaveLength(0);
  expect(card.textContent).not.toContain("Choose SQ 638");
  expect(card.querySelector(".hkc-output-card-actions")).toBeNull();
  cleanup();
  const mixed = renderCard(doc({ primary: actions.reply, secondary: actions.open_url }), host);
  expect(buttons(mixed)).toEqual(["Directions in Maps"]);
});

test("no host callbacks: every action kind is left undrawn and the rest of the card is unchanged", () => {
  for (const kind of Object.keys(callbackOf) as Kind[]) {
    const card = renderCard(doc({ primary: actions[kind] }));
    expect(card).not.toHaveAttribute("data-fallback");
    expect(within(card).queryAllByRole("button")).toHaveLength(0);
    expect(within(card).getByText("East–West line to Tanah Merah")).toBeVisible();
    cleanup();
  }
});

test("primary is filled and first, secondary quiet and second, whatever order the object lists them in", () => {
  const card = renderCard(doc({ secondary: actions.download_artifact, primary: actions.open_artifact }), hostOf());
  const drawn = within(card).getAllByRole("button");
  expect(drawn.map(button => button.getAttribute("data-slot"))).toEqual(["primary", "secondary"]);
  expect(drawn.map(button => button.textContent)).toEqual(["Open invoice", "Download PDF"]);
  expect(drawn[0]).toHaveClass("hk-button--primary");
  expect(drawn[1]).toHaveClass("hk-button--quiet");
});

test("a lone secondary stays quiet (it is never promoted to filled)", () => {
  const card = renderCard(doc({ secondary: actions.work_control }), hostOf());
  const [button] = within(card).getAllByRole("button");
  expect(button).toHaveClass("hk-button--quiet");
  expect(button).toHaveAttribute("data-slot", "secondary");
});

test("the action row is drawn last, after View all, whatever block order the document sends", () => {
  const many: chat.HarsoOutputRowsBlock = { kind: "rows", items: Array.from({ length: 5 }, (_, index) => ({ label: `Row ${index}` })) };
  const document: chat.HarsoOutputDocument = { header: { title: "Card" }, fallback_text: "FALLBACK",
    blocks: [{ kind: "action", primary: actions.open_url }, many] };
  const card = renderCard(document, hostOf());
  const children = [...card.children];
  expect(children.at(-1)).toHaveClass("hkc-output-card-actions");
  expect(children.at(-2)).toHaveClass("hkc-output-card-view-all");
});

test("the label is the agent's, whole, as the button's name and title, even when the pill cuts it with an ellipsis", () => {
  const label = "长".repeat(28);
  const card = renderCard(doc({ primary: { ...actions.download_artifact, label } }), hostOf());
  const button = within(card).getByRole("button", { name: label });
  expect(button).toHaveAttribute("title", label);
  expect(button.querySelector(".hkc-output-card-action-label")!.textContent).toBe(label);
});

test("actions with a target the contract forbids are not drawn and never reach the host", () => {
  const host = hostOf();
  const bad = [
    { kind: "open_url", label: "Script", url: "javascript:alert(1)" },
    { kind: "open_url", label: "Plain http", url: "http://example.com/a" },
    { kind: "open_artifact", label: "Not a file", artifact: "https://example.com/file.pdf" },
    { kind: "download_artifact", label: "No file" },
    { kind: "work_control", label: "Explode", work_unit_id: WORK, control: "explode" },
    { kind: "routine_control", label: "No routine", control: "pause" },
    { kind: "open_url", label: "   ", url: MAPS },
    { kind: "hologram", label: "Unknown" }
  ];
  for (const action of bad) {
    const card = renderCard(doc({ primary: action }), host);
    expect(within(card).queryAllByRole("button"), JSON.stringify(action)).toHaveLength(0);
    cleanup();
  }
  for (const callback of Object.values(host)) expect(callback).not.toHaveBeenCalled();
});

test("a fallback card draws no actions", () => {
  const card = renderCard({ ...doc({ primary: actions.open_url }), blocks: [{ kind: "hologram" }, { kind: "action", primary: actions.open_url }] }, hostOf());
  expect(card).toHaveAttribute("data-fallback", "true");
  expect(within(card).queryAllByRole("button")).toHaveLength(0);
});

// ---- linked sources ----

const withSources: chat.HarsoOutputDocumentDetails = { sources: [
  { label: "SMRT journey planner, 26 Sep 2026" },
  { label: "LTA statement", url: "https://www.lta.gov.sg/content/ltagov/en/newsroom.html" },
  { label: "Unsafe", url: "javascript:alert(1)" }] };

test("a source with a url is a link that goes through onOpenUrl, label unchanged; without url (or unsafe) it stays text", () => {
  const onOpenUrl = vi.fn();
  const card = renderCard(doc(undefined, { details: withSources }), { onOpenUrl });
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  const sources = within(card).getByRole("list", { name: "Sources" });
  const links = within(sources).getAllByRole("link");
  expect(links.map(link => link.textContent)).toEqual(["LTA statement"]);
  expect(links[0]).toHaveAttribute("href", "https://www.lta.gov.sg/content/ltagov/en/newsroom.html");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  links[0].dispatchEvent(click);
  // The host opens it; the kit never navigates (the browser's own follow is cancelled).
  expect(click.defaultPrevented).toBe(true);
  expect(onOpenUrl).toHaveBeenCalledExactlyOnceWith("https://www.lta.gov.sg/content/ltagov/en/newsroom.html");
  // A middle click (a new tab in a browser) goes to the host too; a right click leaves the context menu alone.
  const middle = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
  links[0].dispatchEvent(middle);
  expect(middle.defaultPrevented).toBe(true);
  const right = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 2 });
  links[0].dispatchEvent(right);
  expect(right.defaultPrevented).toBe(false);
  expect(onOpenUrl).toHaveBeenCalledTimes(2);
  expect(within(sources).getAllByRole("listitem").map(item => item.textContent)).toEqual(["SMRT journey planner, 26 Sep 2026", "LTA statement", "Unsafe"]);
});

test("without onOpenUrl every source stays plain text", () => {
  const card = renderCard(doc(undefined, { details: withSources }));
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  expect(within(card).queryAllByRole("link")).toHaveLength(0);
  expect(within(within(card).getByRole("list", { name: "Sources" })).getAllByRole("listitem")).toHaveLength(3);
});

// ---- one authority for opening a file ----

test("the video poster and the Open action open files through the same onOpenArtifact", () => {
  // jsdom has no media loading; the poster reads the file's length through a detached <video>.
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  const onOpenArtifact = vi.fn();
  const clip = { kind: "visual", visual: { kind: "video", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01", alt: "Walkthrough" } } as chat.HarsoOutputBlock;
  const document: chat.HarsoOutputDocument = { header: { title: "Card" }, fallback_text: "FALLBACK", blocks: [clip, { kind: "action", primary: actions.open_artifact }] };
  const card = renderCard(document, { onOpenArtifact, media: { resolveArtifact: artifact => `https://files.test/${artifact.slice(9)}` } });
  fireEvent.click(within(card).getByRole("button", { name: /^Open video: Walkthrough/ }));
  fireEvent.click(within(card).getByRole("button", { name: "Open invoice" }));
  expect(onOpenArtifact.mock.calls).toEqual([["artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01"], [FILE]]);
});
