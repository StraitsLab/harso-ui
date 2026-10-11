import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputDocument, type HarsoOutputRow } from "../output-card";
import styles from "./mail.css?raw";
import { family, mailDueUrgency } from "./mail";
import type { V6FamilyProps, V6Host, V6Template, WidgetSize } from "./types";

// WEV-3322 (P06): inbox-brief, deadlines-from-mail and reply-draft. Sender marks, true unread, exact-time urgency,
// a complete draft, and no Mark done or Send anywhere.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const AS_OF = "2026-10-11T04:00Z";
const GMAIL = "https://mail.google.com/mail/u/0/#inbox/FMfcgzQXKJwLrBtGXfkNKcBkqSpjxtsK";
const DRAFTS = "https://mail.google.com/mail/u/0/#drafts?compose=exact&x=1";

const row = (extra: Partial<HarsoOutputRow> = {}): HarsoOutputRow => ({ label: "Mrs Tan", secondary: "Lease renewal · wants Tue 29 Sep", trailing: "Reply by Mon 28 Sep", ...extra });
const doc = (template: V6Template, blocks: HarsoOutputDocument["blocks"], extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template, header: { title: "Inbox · Sat 26 Sep", subtitle: "3 need you" }, blocks, fallback_text: "FALLBACK", as_of: AS_OF, ...extra
});
const inbox = (items: HarsoOutputRow[], extra: Partial<HarsoOutputDocument> = {}) => doc("inbox-brief", [{ kind: "rows", items }], extra);
const deadlines = (items: HarsoOutputRow[], extra: Partial<HarsoOutputDocument> = {}) => doc("deadlines-from-mail", [{ kind: "rows", items }], extra);
const draft = (paragraphs: string[], extra: Partial<HarsoOutputDocument> = {}) =>
  doc("reply-draft", [{ kind: "text", sections: [{ paragraphs }] }, { kind: "action", secondary: { kind: "open_url", label: "Open Gmail drafts", url: DRAFTS } }], { header: { title: "Lease renewal · reply", subtitle: "To Mrs Tan · draft" }, ...extra });

const hostOf = (extra: Partial<V6Host> = {}): V6Host => ({ onViewAll: vi.fn(), onOpenUrl: vi.fn(), ...extra });
function draw(document: HarsoOutputDocument, props: Partial<V6FamilyProps> = {}) {
  const host = props.host ?? hostOf();
  const node = family.renderFamily({ document, mode: "inline", media: {}, renderBrand: () => undefined, ...props, host });
  const view = render(<div className="harso-kit">{node as ReactNode}</div>);
  return { host, view, node, card: node == null ? null : screen.getByRole("region") };
}
const marks = (card: HTMLElement) => [...card.querySelectorAll<HTMLElement>("[data-mail-row]")];
const unreadDot = (el: Element) => el.querySelector("[data-unread-dot]");

// ---- inbox: sender, unread, important ----

const THREE = [
  row({ id: "a", label: "Mrs Tan", unread: true, status: "needs_you", brand: "gmail.com" }),
  row({ id: "b", label: "IRAS", secondary: "Property tax bill", trailing: "Pay by Wed 30 Sep", status: "needs_you" }),
  row({ id: "c", label: "Sam Lee", secondary: "Tokyo restaurants", trailing: "Waiting 2 days", unread: true })
];

test("read-and-important and unread-not-important look different: the dot comes only from unread, the word only from status", () => {
  const { card } = draw(inbox(THREE));
  const [tan, iras, sam] = marks(card!);
  // Mrs Tan: unread and important. IRAS: read and important. Sam Lee: unread, not important.
  expect(unreadDot(tan)).not.toBeNull();
  expect(unreadDot(iras)).toBeNull();
  expect(unreadDot(sam)).not.toBeNull();
  expect(within(iras).getByText("Needs you")).toBeTruthy();
  expect(within(sam).queryByText("Needs you")).toBeNull();
  expect([tan, iras, sam].map(el => el.dataset.important)).toEqual(["true", "true", undefined]);
  expect([tan, iras, sam].map(el => el.dataset.unread)).toEqual(["true", undefined, "true"]);
  // The dot is announced, so unread never rests on colour or position alone.
  expect(within(sam).getByText("Unread")).toBeTruthy();
  expect(within(iras).queryByText("Unread")).toBeNull();
});

test("a missing or false unread draws no dot: unread is never guessed from importance, position or text", () => {
  const { card } = draw(inbox([row({ status: "needs_you" }), row({ label: "Ann", unread: false }), row({ label: "Bo" })]));
  expect(card!.querySelectorAll("[data-unread-dot]")).toHaveLength(0);
  expect(card!.textContent).not.toContain("Unread");
});

test("only needs_you, overdue and problem are important; done and paid are not, but still say their word", () => {
  const { card } = draw(inbox(["needs_you", "overdue", "problem", "done", "paid", "in_progress"].map(status => row({ label: status, status }))));
  expect(marks(card!).map(el => el.dataset.important === "true")).toEqual([true, true, true, false, false, false]);
  expect(within(marks(card!)[3]).getByText("Done")).toBeTruthy();
});

test("each row has a sender mark: the host's bundled logo for a real domain, a letter tile otherwise, and a bad domain never reaches the host", () => {
  const renderBrand = vi.fn(({ domain }: { domain: string }) => <i data-logo={domain} />);
  const { card } = draw(inbox([
    row({ label: "Mrs Tan", brand: "gmail.com" }), row({ label: "IRAS" }), row({ label: "Evil", brand: "https://evil.example/x" })
  ]), { renderBrand });
  const [tan, iras, evil] = marks(card!);
  expect(tan.querySelector("[data-logo=\"gmail.com\"]")).not.toBeNull();
  expect(iras.querySelector(".hkc-v6-brand")!.textContent).toBe("I");
  expect(evil.querySelector(".hkc-v6-brand")!.textContent).toBe("E");
  expect(renderBrand).toHaveBeenCalledTimes(1);
  // The sender's name is always in the text, whatever the mark.
  expect(within(tan).getByText("Mrs Tan")).toBeTruthy();
});

test("rows keep source order and ids; total_count that exceeds the rows is said, never filled in", () => {
  const document = doc("inbox-brief", [{ kind: "rows", items: THREE, total_count: 18 }]);
  const { card } = draw(document);
  expect(marks(card!).map(el => el.dataset.rowId ?? el.dataset.mailRow)).toEqual(["a", "b", "c"].map(id => id));
  expect(within(card!).getByText("Showing 3 of 18")).toBeTruthy();
  cleanup();
  expect(draw(inbox(THREE)).card!.textContent).not.toContain("Showing");
});

// ---- deadlines: exact times only ----

test("mailDueUrgency: only an exact due_at against the saved snapshot, never the device clock", () => {
  const at = (hours: number) => new Date(Date.parse(AS_OF) + hours * 3_600_000).toISOString().slice(0, 16) + "Z";
  expect(mailDueUrgency(at(3), AS_OF)).toBe("urgent");
  expect(mailDueUrgency(at(24), AS_OF)).toBe("urgent");
  expect(mailDueUrgency(at(25), AS_OF)).toBe("soon");
  expect(mailDueUrgency(at(72), AS_OF)).toBe("soon");
  expect(mailDueUrgency(at(73), AS_OF)).toBeUndefined();
  expect(mailDueUrgency(at(-1), AS_OF)).toBeUndefined();         // already past: the status word says so, not a colour
  expect(mailDueUrgency(undefined, AS_OF)).toBeUndefined();      // date-only due: no instant, no urgency
  expect(mailDueUrgency(at(3), undefined)).toBeUndefined();      // no snapshot to measure against
  expect(mailDueUrgency("2026-02-30T09:10Z", AS_OF)).toBeUndefined();
  expect(mailDueUrgency("2026-10-11", AS_OF)).toBeUndefined();   // a bare date is not an instant
  expect(mailDueUrgency(at(3), "yesterday")).toBeUndefined();
});

test("a date-only due stays text and gets no 24-hour urgency, even when the text names tomorrow", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-27T09:00Z"));
  const { card } = draw(deadlines([
    row({ label: "Sign the lease renewal", secondary: "Email 23 Sep", trailing: "by Sun 27 Sep" }),
    row({ label: "Return books", secondary: "NLB", trailing: "by Mon 28 Sep", due_at: "2026-10-11T07:30Z" }),
    row({ label: "Renew road tax", secondary: "LTA", trailing: "by Tue 29 Sep", due_at: "2026-10-13T04:00Z" }),
    row({ label: "Pay fine", secondary: "URA", trailing: "by Fri 2 Oct", due_at: "2026-10-30T04:00Z" })
  ]));
  const [dateOnly, urgent, soon, far] = marks(card!);
  expect(within(dateOnly).getByText("by Sun 27 Sep")).toBeTruthy();
  expect(dateOnly.dataset.urgency).toBeUndefined();
  expect(urgent.dataset.urgency).toBe("urgent");
  expect(soon.dataset.urgency).toBe("soon");
  expect(far.dataset.urgency).toBeUndefined();
  // Colour is never the only signal.
  expect(within(urgent).getByText("Due within 24 hours of the snapshot")).toBeTruthy();
  expect(within(soon).getByText("Due within 72 hours of the snapshot")).toBeTruthy();
  expect(within(dateOnly).queryByText(/Due within/)).toBeNull();
  expect(card!.textContent).not.toMatch(/\b(urgent|overdue|late)\b/i);
});

test("a deadline row has a mark only for a named brand, and its letter comes from the brand, not the task title", () => {
  const { card } = draw(deadlines([
    row({ label: "Return library books", brand: "nlb.gov.sg", trailing: "by Mon 28 Sep" }),
    row({ label: "Pay parking fine", trailing: "by Tue 29 Sep" })
  ]));
  const [withBrand, without] = marks(card!);
  expect(withBrand.querySelector(".hkc-v6-brand")!.textContent).toBe("N");
  expect(without.querySelector(".hkc-v6-brand")).toBeNull();
});

test("with no trailing text an exact due_at is shown as a time; a date-only or broken due_at shows nothing", () => {
  const { card } = draw(deadlines([
    row({ label: "Exact", trailing: undefined, due_at: "2026-10-11T07:30Z" }),
    row({ label: "Dateonly", trailing: undefined, due_at: "2026-10-12" }),
    row({ label: "Broken", trailing: undefined, due_at: "2026-02-30T07:30Z" })
  ]));
  const [exact, dateOnly, broken] = marks(card!);
  expect(exact.querySelector("time")!.textContent).toMatch(/^Due /);
  expect(exact.querySelector("time")!.getAttribute("datetime")).toBe("2026-10-11T07:30Z");
  expect(dateOnly.querySelector("time")).toBeNull();
  expect(broken.querySelector("time")).toBeNull();
});

test("the same card read at any later device time keeps the same urgency", () => {
  const document = deadlines([row({ trailing: "by Mon 12 Oct", due_at: "2026-10-11T07:30Z" })]);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T04:00Z"));
  const first = marks(draw(document).card!)[0].dataset.urgency;
  cleanup();
  vi.setSystemTime(new Date("2027-03-01T00:00Z"));
  expect(marks(draw(document).card!)[0].dataset.urgency).toBe(first);
  expect(first).toBe("urgent");
});

test("deadline rows carry no check circle, checkbox or completion control", () => {
  const { card } = draw(deadlines([row({ label: "Sign the lease", trailing: "by Sun 27 Sep" })]));
  expect(card!.querySelector("input[type=checkbox], [role=checkbox], [role=switch], [aria-checked]")).toBeNull();
  expect(within(card!).queryByRole("checkbox")).toBeNull();
});

test("the text block (already passed) is shown whole behind its own heading; nothing is dropped", () => {
  const document = doc("deadlines-from-mail", [
    { kind: "rows", items: [row({ label: "Sign the lease", trailing: "by Sun 27 Sep" })] },
    { kind: "text", sections: [{ heading: "Already passed", bullets: ["Town council GIRO form was due Fri 25 Sep (email 18 Sep)."] }] }
  ]);
  const { card } = draw(document);
  const passed = card!.querySelector("details")!;
  expect(within(passed).getByText("Already passed")).toBeTruthy();
  expect(passed.textContent).toContain("Town council GIRO form was due Fri 25 Sep (email 18 Sep).");
});

// ---- reply draft ----

const LONG = ["Dear Mrs Tan,", `Tuesday 29 Sep at 6:30 pm works for me. ${"I will bring the signed renewal form and a cheque for the deposit top-up. ".repeat(8).trim()}`, "Best regards, Abhi"];

test("the full draft is complete on open: every paragraph, whole, with no clamp or View all", () => {
  const { card } = draw(draft(LONG), { mode: "inline" });
  for (const paragraph of LONG) expect(within(card!).getByText(paragraph)).toBeTruthy();
  expect(LONG[1].length).toBeGreaterThan(180);
  expect(card!.textContent).not.toMatch(/…|View all|Show more|Read more/);
  expect(styles).not.toMatch(/line-clamp|text-overflow|-webkit-box/);
  expect(card!.querySelectorAll("p.hkc-mail-paper-line").length).toBe(3);
});

test("a draft with headings and bullets keeps all of them in order", () => {
  const document = doc("reply-draft", [{ kind: "text", summary: "Reply to Mrs Tan", sections: [{ heading: "Options", bullets: ["Tue 29 Sep", "Wed 30 Sep"] }, { paragraphs: ["Thanks."] }] }]);
  const { card } = draw(document);
  const text = card!.querySelector(".hkc-mail-paper")!.textContent!;
  expect(text.indexOf("Options")).toBeLessThan(text.indexOf("Tue 29 Sep"));
  expect(text.indexOf("Tue 29 Sep")).toBeLessThan(text.indexOf("Wed 30 Sep"));
  expect(text.indexOf("Wed 30 Sep")).toBeLessThan(text.indexOf("Thanks."));
  expect(text).toContain("Reply to Mrs Tan");
});

test("Open in Gmail hands the host the exact URL, once, and the draft is never sent from here", () => {
  const { card, host } = draw(draft(LONG));
  fireEvent.click(within(card!).getByRole("button", { name: "Open Gmail drafts" }));
  expect(host.onOpenUrl).toHaveBeenCalledExactlyOnceWith(DRAFTS);
});

test("without an open-url callback the Gmail button is not drawn (no dead button)", () => {
  const { card } = draw(draft(LONG), { host: { onViewAll: vi.fn() } });
  expect(within(card!).queryByRole("button", { name: "Open Gmail drafts" })).toBeNull();
});

test("a non-https link is never handed to the host", () => {
  const bad = draft(LONG);
  (bad.blocks[1] as { secondary: { url: string } }).secondary.url = "http://mail.google.com/mail/u/0/#drafts";
  const { card, host } = draw(bad);
  expect(within(card!).queryByRole("button", { name: "Open Gmail drafts" })).toBeNull();
  expect(host.onOpenUrl).not.toHaveBeenCalled();
});

test("an inbox row link (C2) and the inbox action both keep their exact URL", () => {
  const { card, host } = draw(doc("inbox-brief", [
    { kind: "rows", items: [row({ action: { kind: "open_url", label: "Open thread with Mrs Tan", url: GMAIL } })] },
    { kind: "action", secondary: { kind: "open_url", label: "Open inbox in Gmail", url: "https://mail.google.com/mail/u/0/#inbox" } }
  ]));
  fireEvent.click(within(card!).getByRole("button", { name: "Open thread with Mrs Tan" }));
  fireEvent.click(within(card!).getByRole("button", { name: "Open inbox in Gmail" }));
  expect((host.onOpenUrl as ReturnType<typeof vi.fn>).mock.calls).toEqual([[GMAIL], ["https://mail.google.com/mail/u/0/#inbox"]]);
});

// ---- no Mark done, no Send ----

test("no Mark done and no Send control, even when the document carries such actions and the host could run them", () => {
  const host = hostOf({ onWorkControl: vi.fn(), onRoutineControl: vi.fn(), onPageWatchControl: vi.fn() });
  const risky: HarsoOutputDocument["blocks"] = [
    { kind: "action", primary: { kind: "work_control", label: "Send", control: "retry", work_unit_id: "w1" } as never, secondary: { kind: "routine_control", label: "Mark done", control: "pause", routine_id: "r1" } as never }
  ];
  for (const document of [
    inbox(THREE, { blocks: [{ kind: "rows", items: THREE }, ...risky] }),
    deadlines([row({ trailing: "by Sun 27 Sep" })], { blocks: [{ kind: "rows", items: [row({ trailing: "by Sun 27 Sep" })] }, ...risky] }),
    draft(LONG, { blocks: [{ kind: "text", sections: [{ paragraphs: LONG }] }, ...risky] })
  ]) {
    const { card } = draw(document, { host });
    expect(within(card!).queryByRole("button", { name: /mark done|send|\bdone\b/i })).toBeNull();
    expect(card!.querySelector("button[data-slot=primary]")).toBeNull();
    cleanup();
  }
  expect(host.onWorkControl).not.toHaveBeenCalled();
  expect(host.onRoutineControl).not.toHaveBeenCalled();
});

test("a reply action is never drawn (choices belong to the question card)", () => {
  const document = draft(LONG, { blocks: [{ kind: "text", sections: [{ paragraphs: LONG }] }, { kind: "action", primary: { kind: "reply", label: "Send now", text: "send" } as never }] });
  const { card } = draw(document);
  expect(within(card!).queryByRole("button", { name: /send/i })).toBeNull();
});

// ---- fallback and sizes ----

test("what this family cannot draw falls back to the generic card (undefined)", () => {
  const rows = [row()];
  const results: Record<string, unknown> = {
    otherTemplate: family.renderFamily({ document: doc("stock-quote", [{ kind: "rows", items: rows }]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    noTemplate: family.renderFamily({ document: { ...inbox(rows), template: undefined }, mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    noRows: family.renderFamily({ document: doc("inbox-brief", []), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    emptyRows: family.renderFamily({ document: inbox([]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    twoRowBlocks: family.renderFamily({ document: doc("inbox-brief", [{ kind: "rows", items: rows }, { kind: "rows", items: rows }]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    unknownBlock: family.renderFamily({ document: doc("inbox-brief", [{ kind: "rows", items: rows }, { kind: "chart" }]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    unknownStatus: family.renderFamily({ document: inbox([row({ status: "starred" })]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    draftNoText: family.renderFamily({ document: doc("reply-draft", [{ kind: "rows", items: rows }]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined }),
    draftEmptyText: family.renderFamily({ document: doc("reply-draft", [{ kind: "text", sections: [] }]), mode: "inline", host: hostOf(), media: {}, renderBrand: () => undefined })
  };
  for (const [name, value] of Object.entries(results)) expect([name, value == null]).toEqual([name, true]);
});

test("supported widget sizes: inbox and deadlines small and medium, the draft none", () => {
  const sizes = (template: V6Template) => family.supportedWidgetSizes(template);
  expect(sizes("inbox-brief")).toEqual(["small", "medium"]);
  expect(sizes("deadlines-from-mail")).toEqual(["small", "medium"]);
  expect(sizes("reply-draft")).toEqual([]);
  expect(sizes("weather-now")).toEqual([]);
});

test.each<[V6Template, WidgetSize]>([["inbox-brief", "large"], ["inbox-brief", "extraLarge"], ["deadlines-from-mail", "large"], ["reply-draft", "small"], ["reply-draft", "medium"]])(
  "%s at %s is not a size this family draws", (template, widgetSize) => {
    const document = template === "reply-draft" ? draft(LONG) : doc(template, [{ kind: "rows", items: [row()] }]);
    expect(family.renderFamily({ document, mode: "inline", widgetSize, host: hostOf(), media: {}, renderBrand: () => undefined })).toBeUndefined();
  });

test("inbox small widget: the header, then the first sender with unread and status; no Details, no list", () => {
  const { card, host } = draw(inbox(THREE, { details: { sources: [{ label: "Gmail inbox" }] } }), { widgetSize: "small", mode: "inline" });
  expect(card!.querySelector("[data-widget]")!.getAttribute("data-widget")).toBe("small");
  expect(marks(card!)).toHaveLength(1);
  expect(within(card!).getByText("Mrs Tan")).toBeTruthy();
  expect(unreadDot(card!)).not.toBeNull();
  expect(within(card!).queryByRole("button", { name: "Details" })).toBeNull();
  fireEvent.click(within(card!).getByRole("button", { name: "Inbox · Sat 26 Sep" }));
  expect(host.onViewAll).toHaveBeenCalledTimes(1);
});

test("inbox medium widget: up to three compact rows in source order, unread dots kept", () => {
  const four = [...THREE, row({ id: "d", label: "Fourth" })];
  const { card } = draw(inbox(four), { widgetSize: "medium" });
  expect(card!.querySelector("[data-widget]")!.getAttribute("data-widget")).toBe("medium");
  expect(marks(card!).map(el => el.dataset.rowId)).toEqual(["a", "b", "c"]);
  expect(marks(card!).map(el => !!unreadDot(el))).toEqual([true, false, true]);
});

test("deadlines small widget leads with the first deadline; medium keeps urgency from exact times only", () => {
  const items = [
    row({ id: "1", label: "Sign the lease renewal", trailing: "by Sun 27 Sep" }),
    row({ id: "2", label: "Return books", trailing: "by Mon 28 Sep", due_at: "2026-10-11T07:30Z" }),
    row({ id: "3", label: "Road tax", trailing: "by Tue 29 Sep" }),
    row({ id: "4", label: "Fine", trailing: "by Tue 29 Sep" })
  ];
  const small = draw(deadlines(items), { widgetSize: "small" });
  expect(within(small.card!).getByText("Sign the lease renewal")).toBeTruthy();
  expect(marks(small.card!)).toHaveLength(1);
  cleanup();
  const medium = draw(deadlines(items), { widgetSize: "medium" });
  expect(marks(medium.card!).map(el => [el.dataset.rowId, el.dataset.urgency])).toEqual([["1", undefined], ["2", "urgent"], ["3", undefined]]);
});

// ---- through the card ----

test("HarsoOutputCard draws this family from the template hint and the generic card without it", () => {
  const document = inbox(THREE);
  const view = render(<div className="harso-kit"><HarsoOutputCard document={document} onViewAll={() => {}} families={{ "inbox-brief": family }} /></div>);
  expect(view.container.querySelector("[data-mail-row]")).not.toBeNull();
  view.unmount();
  const plain = render(<div className="harso-kit"><HarsoOutputCard document={{ ...document, template: undefined }} onViewAll={() => {}} families={{ "inbox-brief": family }} /></div>);
  expect(plain.container.querySelector("[data-mail-row]")).toBeNull();
  expect(plain.container.textContent).toContain("Mrs Tan");
});

// ---- accessibility and styles ----

test.each([
  ["inbox", () => inbox([{ ...THREE[0], action: { kind: "open_url", label: "Open thread", url: GMAIL } }, ...THREE.slice(1)], { details: { sources: [{ label: "Gmail inbox" }] } })],
  ["deadlines", () => doc("deadlines-from-mail", [{ kind: "rows", items: [row({ trailing: "by Sun 27 Sep" }), row({ label: "B", due_at: "2026-10-11T07:30Z" })] }, { kind: "text", sections: [{ heading: "Already passed", bullets: ["GIRO form"] }] }])],
  ["draft", () => draft(LONG)]
])("%s: every interactive target is legal, named, and axe finds no violation", async (_name, make) => {
  const { card, view } = draw(make());
  const INTERACTIVE = "button, a[href], input, select, textarea, [role=button], summary, [tabindex]";
  const targets = [...card!.querySelectorAll(INTERACTIVE)];
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    expect(target.parentElement!.closest(INTERACTIVE.replace(", summary", ""))).toBeNull();
    expect((target.textContent ?? "").trim() || target.getAttribute("aria-label")).toBeTruthy();
  }
  const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

test("styles: tokens only (so light and dark follow the theme), no raw colours, no !important, 44px touch targets, a focus ring", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|!important/);
  for (const [, name] of source.matchAll(/var\((--[a-z0-9-]+)/g)) expect(name).toMatch(/^--hk-/);
  expect(source).toMatch(/pointer: coarse[\s\S]*min-height: 44px/);
  expect(source).toMatch(/:focus-visible/);
  // Urgency, unread and importance are each drawn from a semantic token, not a hard-coded hue.
  expect(source).toMatch(/\[data-urgency="urgent"\][^}]*var\(--hk-negative\)/);
  expect(source).toMatch(/\[data-urgency="soon"\][^}]*var\(--hk-attention\)/);
  expect(source).toMatch(/hkc-mail-unread[^}]*var\(--hk-accent\)/);
});
