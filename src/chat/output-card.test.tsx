import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";
import cardStyles from "./output-card.css?raw";

afterEach(cleanup);

// Verbatim copies of the S0 examples 02-flights, 08-failed and 03-spending (output-blocks.v1 draft).
const flights: chat.HarsoOutputDocument = {
  "header": {
    "title": "Flights to Tokyo",
    "subtitle": "12 Oct · 1 adult · economy"
  },
  "blocks": [
    {
      "kind": "rows",
      "items": [
        {
          "label": "Singapore Airlines",
          "secondary": "SQ 638 · Dep 08:35 · 7h 05m direct",
          "trailing": "S$612",
          "mark": "pick"
        },
        {
          "label": "ANA",
          "secondary": "NH 842 · Dep 22:30 · 6h 55m direct",
          "trailing": "S$548"
        },
        {
          "label": "ZIPAIR",
          "secondary": "ZG 52 · Dep 23:55 · 7h 10m direct",
          "trailing": "S$326"
        }
      ]
    },
    {
      "kind": "action",
      "primary": {
        "kind": "reply",
        "label": "Choose SQ 638",
        "text": "Choose SQ 638 on 12 Oct (Singapore Airlines, dep 08:35)."
      }
    }
  ],
  "details": {
    "sources": [
      {
        "label": "Fare search, 23 Sep 2026 09:12 SGT (illustrative)"
      }
    ],
    "disclaimers": [
      "Fares change often. Nothing is booked until you confirm with the airline."
    ]
  },
  "fallback_text": "Flights to Tokyo, 12 Oct: Singapore Airlines SQ 638 08:35 S$612 (pick); ANA NH 842 22:30 S$548; ZIPAIR ZG 52 23:55 S$326."
};
const failed: chat.HarsoOutputDocument = {
  "header": {
    "title": "Couldn't check flight prices",
    "subtitle": "12 Oct · 1 adult · economy"
  },
  "blocks": [
    {
      "kind": "status",
      "state": "failed",
      "detail": "the fare site didn't respond"
    },
    {
      "kind": "action",
      "secondary": {
        "kind": "reply",
        "label": "Try again",
        "text": "Try checking the flight prices again."
      }
    }
  ],
  "fallback_text": "Couldn't check flight prices for 12 Oct: the fare site didn't respond."
};
const spending: chat.HarsoOutputDocument = {
  "header": {
    "title": "September spending",
    "subtitle": "1–30 Sep · all accounts"
  },
  "blocks": [
    {
      "kind": "numbers",
      "items": [
        {
          "value": "S$4,280",
          "label": "Spent"
        },
        {
          "value": "S$720",
          "label": "Left"
        },
        {
          "value": "S$5,000",
          "label": "Budget"
        }
      ]
    },
    {
      "kind": "visual",
      "visual": {
        "kind": "chart",
        "chart": "bar",
        "unit": "S$",
        "x_labels": [
          "1–7 Sep",
          "8–14",
          "15–21",
          "22–30"
        ],
        "series": [
          {
            "label": "Spent",
            "values": [
              "980",
              "1040",
              "1460",
              "800"
            ]
          }
        ],
        "highlight_index": 2
      }
    },
    {
      "kind": "rows",
      "items": [
        {
          "label": "Dining",
          "trailing": "S$1,160"
        },
        {
          "label": "Groceries",
          "trailing": "S$840"
        },
        {
          "label": "Transport",
          "trailing": "S$610"
        },
        {
          "label": "Shopping",
          "trailing": "S$590"
        }
      ]
    }
  ],
  "more_label": "View all transactions",
  "details": {
    "sources": [
      {
        "label": "Linked accounts, synced 23 Sep 2026 (illustrative)"
      }
    ],
    "assumptions": [
      "Transfers between your own accounts are excluded."
    ]
  },
  "fallback_text": "September spending: S$4,280 spent of S$5,000; S$720 left. Dining S$1,160, Groceries S$840, Transport S$610, Shopping S$590."
};

const renderCard = (props: Partial<chat.HarsoOutputCardProps> = {}) => {
  const onViewAll = props.onViewAll ?? vi.fn();
  const view = render(<div className="harso-kit"><chat.HarsoOutputCard document={flights} onViewAll={onViewAll} {...props} /></div>);
  return { ...view, onViewAll, card: screen.getByRole("region", { name: (props.document ?? flights).header.title }) };
};
const flightRows = (flights.blocks[0] as chat.HarsoOutputRowsBlock).items;
const extraRows: chat.HarsoOutputRow[] = [
  { label: "Scoot", secondary: "TR 808 · Dep 01:15", trailing: "S$298" },
  { label: "Japan Airlines", trailing: "S$655" },
  { label: "Delta", trailing: "S$590" },
  { label: "United", trailing: "S$604" },
];
const withRows = (items: chat.HarsoOutputRow[], extra: Partial<chat.HarsoOutputRowsBlock> = {}, doc: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ ...flights, ...doc, blocks: [{ kind: "rows", items, ...extra }, flights.blocks[1]] });

test("Flights renders title, subtitle, three rows with values and exactly one Pick", () => {
  const { card } = renderCard();
  expect(card.tagName).toBe("SECTION");
  expect(within(card).getByRole("heading", { name: "Flights to Tokyo" })).toBeVisible();
  expect(within(card).getByText("12 Oct · 1 adult · economy")).toBeVisible();
  const rows = within(within(card).getByRole("list")).getAllByRole("listitem");
  expect(rows).toHaveLength(3);
  expect(rows.map(row => row.textContent)).toEqual([
    "Singapore AirlinesPickSQ 638 · Dep 08:35 · 7h 05m directS$612",
    "ANANH 842 · Dep 22:30 · 6h 55m directS$548",
    "ZIPAIRZG 52 · Dep 23:55 · 7h 10m directS$326",
  ]);
  for (const [row, value] of [[0, "S$612"], [1, "S$548"], [2, "S$326"]] as const) expect(within(rows[row]).getByText(value)).toBeVisible();
  expect(within(card).getAllByText("Pick", { exact: true })).toHaveLength(1);
  expect(within(rows[0]).getByText("Pick", { exact: true })).toBeVisible();
  expect(within(card).queryByText(flights.fallback_text)).toBeNull();
});

test("display-only: a reply action (or any action) renders no button and no text, and never throws", () => {
  const { card } = renderCard();
  expect(within(card).getAllByRole("button").map(button => button.textContent)).toEqual(["Details"]);
  expect(within(card).queryByText(/Choose SQ 638/)).toBeNull();
  expect(within(card).queryByText("Not available here yet")).toBeNull();
  expect(card.textContent).not.toContain("Choose");
  cleanup();
  const odd = { ...flights, details: undefined, blocks: [flights.blocks[0],
    { kind: "action", primary: { kind: "open_url", label: "Open fares", url: "https://example.com/fares" }, secondary: { kind: "reply", label: "Try again", text: "again" } },
    { kind: "action" }] };
  const { card: second } = renderCard({ document: odd });
  expect(within(second).queryAllByRole("button")).toHaveLength(0);
  expect(second.textContent).not.toMatch(/Open fares|Try again|Not available/);
  expect(within(second).getAllByRole("listitem")).toHaveLength(3);
});

test.each([["failed status", failed], ["spending numbers/visual", spending]] as const)("unsupported block (%s) shows fallback_text and no rows or actions", (_, document) => {
  const onViewAll = vi.fn();
  const { card } = renderCard({ document, onViewAll });
  expect(within(card).getByRole("heading", { name: document.header.title })).toBeVisible();
  expect(within(card).getByText(document.header.subtitle!)).toBeVisible();
  expect(within(card).getByText(document.fallback_text)).toBeVisible();
  expect(within(card).queryByRole("list")).toBeNull();
  expect(within(card).queryByRole("listitem")).toBeNull();
  expect(within(card).queryByRole("button", { name: /Try again|Choose|View all/ })).toBeNull();
  expect(card.textContent).not.toMatch(/[{}[\]"]|kind|S\$1,160Dining|View all/);
  expect(onViewAll).not.toHaveBeenCalled();
});

test("an unknown kind anywhere in blocks falls back, even after supported blocks", () => {
  const document = { ...flights, blocks: [...flights.blocks, { kind: "hologram", payload: { raw: true } }] };
  const { card } = renderCard({ document });
  expect(within(card).getByText(flights.fallback_text)).toBeVisible();
  expect(within(card).queryByRole("listitem")).toBeNull();
  expect(within(card).queryByRole("button", { name: "Choose SQ 638" })).toBeNull();
});

test("caps respected: four rows in, three out in order; caps override is honoured", () => {
  const four = withRows([...flightRows, extraRows[0]]);
  const { card, rerender, onViewAll } = renderCard({ document: four });
  expect(chat.HARSO_OUTPUT_CARD_CAPS.maxRows).toBe(3);
  expect(within(card).getAllByRole("listitem").map(row => within(row).getAllByText(/./)[0].textContent)).toEqual(["Singapore Airlines", "ANA", "ZIPAIR"]);
  expect(within(card).queryByText("Scoot")).toBeNull();
  expect(within(card).getByRole("button", { name: "View all 4" })).toBeVisible();
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={four} onViewAll={onViewAll} caps={{ maxRows: 2 }} /></div>);
  expect(within(card).getAllByRole("listitem")).toHaveLength(2);
  expect(within(card).getByRole("button", { name: "View all 4" })).toBeVisible();
});

test("7 rows with cap 3: three rows plus one View all 7 row that calls onViewAll, with no side effect of its own", () => {
  const open = vi.spyOn(window, "open").mockImplementation(() => null);
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const before = window.location.href;
  try {
    const { card, onViewAll } = renderCard({ document: withRows([...flightRows, ...extraRows]) });
    expect(within(card).getAllByRole("listitem")).toHaveLength(3);
    const viewAll = within(card).getByRole("button", { name: "View all 7" });
    expect(viewAll.closest("ul")).toBeNull();
    expect(card.lastElementChild).toBe(viewAll);
    fireEvent.click(viewAll);
    expect(onViewAll).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(before);
  } finally {
    open.mockRestore();
    vi.unstubAllGlobals();
  }
});

test.each([[1], [2], [3]])("%i supplied row(s) under the cap show no View all row", count => {
  const { card } = renderCard({ document: withRows(flightRows.slice(0, count)) });
  expect(within(card).getAllByRole("listitem")).toHaveLength(count);
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
  expect(card.textContent).not.toContain("View all");
});

test("View all counts the agent's total_count, not just supplied rows, and uses more_label when given", () => {
  const { card, rerender, onViewAll } = renderCard({ document: withRows(flightRows, { total_count: 50 }) });
  expect(within(card).getAllByRole("listitem")).toHaveLength(3);
  expect(within(card).getByRole("button", { name: "View all 50" })).toBeVisible();
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={withRows(flightRows, { total_count: 50 }, { more_label: "View all 50 flights" })} onViewAll={onViewAll} /></div>);
  expect(within(card).getByRole("button", { name: "View all 50 flights" })).toBeVisible();
  // A total_count that agrees with the supplied rows adds nothing.
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={withRows(flightRows, { total_count: 3 }, { more_label: "View all flights" })} onViewAll={onViewAll} /></div>);
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
  // A total_count below the supplied rows never hides the supplied rows from the count.
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={withRows([...flightRows, ...extraRows], { total_count: 2 })} onViewAll={onViewAll} /></div>);
  expect(within(card).getByRole("button", { name: "View all 7" })).toBeVisible();
});

test("no element in the card has a non-zero border width (computed style)", () => {
  const { card } = renderCard();
  fireEvent.click(within(card).getByRole("button", { name: "Details" }));
  const nodes = [card, ...card.querySelectorAll("*")];
  expect(nodes.length).toBeGreaterThan(10);
  for (const node of nodes) {
    const style = getComputedStyle(node);
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const width = style.getPropertyValue(`border-${side.toLowerCase()}-width`);
      const lineStyle = style.getPropertyValue(`border-${side.toLowerCase()}-style`);
      expect(lineStyle === "" || lineStyle === "none" || parseFloat(width || "0") === 0, `${node.className} border-${side}`).toBe(true);
    }
  }
  // jsdom does not resolve custom properties; the browser spec asserts the resolved 12px.
  expect(getComputedStyle(card).borderRadius).toBe("var(--hk-radius-card)");
  // jsdom also drops `border`/`outline` shorthands containing var(), so pin the source too:
  // outside forced colors, the only border/outline declarations allowed are zero/none.
  const normal = cardStyles.replace(/\/\*[\s\S]*?\*\//g, "").split("@media (forced-colors: active)")[0];
  const declarations = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style|color))?)\s*:\s*([^;}]+)/g)].map(match => `${match[1]}: ${match[2].trim()}`);
  expect(declarations.length).toBeGreaterThan(0);
  expect(declarations.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line))).toEqual([]);
});

test("Details discloses sources/disclaimers inline when onOpenDetails is omitted; Escape closes and restores focus", () => {
  const outer = vi.fn();
  render(<div className="harso-kit" onKeyDown={outer}><chat.HarsoOutputCard document={flights} onViewAll={() => {}} /></div>);
  const trigger = screen.getByRole("button", { name: "Details" });
  const region = document.getElementById(trigger.getAttribute("aria-controls")!)!;
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(region).not.toBeVisible();
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(region).toHaveAccessibleName("Output details");
  expect(within(region).getByText("Fare search, 23 Sep 2026 09:12 SGT (illustrative)")).toBeVisible();
  expect(within(region).getByText(/Nothing is booked/)).toBeVisible();
  fireEvent.keyDown(region, { key: "Escape" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  expect(outer).not.toHaveBeenCalled();
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(outer).toHaveBeenCalledTimes(1);
});

test("onOpenDetails hands Details to the host without an inline region; no details means no trigger", () => {
  const onOpenDetails = vi.fn();
  const { rerender } = render(<chat.HarsoOutputCard document={flights} onViewAll={() => {}} onOpenDetails={onOpenDetails} />);
  const trigger = screen.getByRole("button", { name: "Details" });
  expect(trigger).not.toHaveAttribute("aria-expanded");
  fireEvent.click(trigger);
  expect(onOpenDetails).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("region", { name: "Output details" })).toBeNull();
  rerender(<chat.HarsoOutputCard document={{ ...flights, details: undefined }} onViewAll={() => {}} />);
  expect(screen.queryByRole("button", { name: "Details" })).toBeNull();
});

test("text is plain: markup-looking strings render literally, never as HTML", () => {
  const document = { ...flights, header: { title: "<b>Bold</b> & *stars*" }, fallback_text: "x", blocks: [{ kind: "rows", items: [{ label: "<img src=x onerror=alert(1)>", trailing: "**S$1**" }] }] };
  const { container } = render(<chat.HarsoOutputCard document={document as chat.HarsoOutputDocument} onViewAll={() => {}} />);
  expect(screen.getByRole("heading", { name: "<b>Bold</b> & *stars*" })).toBeVisible();
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
  expect(screen.getByText("**S$1**")).toBeVisible();
  expect(container.querySelector("b, img, strong, em")).toBeNull();
});

test("a row status word (overdue/paid), even beyond the visible cap, falls back instead of dropping the assertion", () => {
  for (const status of ["overdue", "paid"] as const) {
    const document = { ...flights, blocks: [{ kind: "rows", items: [{ label: "Pacific Freight", trailing: "S$1" }, { label: "Hidden", status }] }, flights.blocks[1]] };
    const { unmount } = render(<chat.HarsoOutputCard document={document as chat.HarsoOutputDocument} caps={{ maxRows: 1 }} onViewAll={() => {}} />);
    expect(screen.getByText(flights.fallback_text)).toBeVisible();
    expect(screen.queryByRole("listitem")).toBeNull();
    unmount();
  }
});

test("every text sink is plain text: fallback, subtitle, View-all label and Details never become markup", () => {
  const markup = "<img src=x onerror=alert(1)><b>x</b>";
  const fallbackDoc = { ...flights, header: { title: "T", subtitle: markup }, fallback_text: markup, blocks: [{ kind: "status", state: "failed" }] };
  const first = render(<chat.HarsoOutputCard document={fallbackDoc as chat.HarsoOutputDocument} onViewAll={() => {}} />);
  expect(first.container.querySelector("img, b")).toBeNull();
  expect(screen.getAllByText(markup)).toHaveLength(2);
  first.unmount();
  const moreDoc = { ...withRows([...flightRows, extraRows[0]], {}, { more_label: markup }), details: { disclaimers: [markup] } };
  const second = render(<chat.HarsoOutputCard document={moreDoc} onViewAll={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(second.container.querySelector("img, b")).toBeNull();
  expect(screen.getByRole("button", { name: markup })).toBeVisible();
});

// Packet 5a: key numbers and a short text block render as themselves.
const spendingNumbers = spending.blocks[0] as chat.HarsoOutputNumbersBlock;
const numbersDoc = (items: chat.HarsoOutputNumber[], extra: chat.HarsoOutputBlock[] = [], doc: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ ...spending, more_label: undefined, ...doc, blocks: [{ kind: "numbers", items }, ...extra] });
// Verbatim copy of the S0 example 05-research-brief (output-blocks.v1 draft).
const brief: chat.HarsoOutputDocument = {
  "header": { "title": "Singapore EV charging in 2026", "subtitle": "Research brief · September 2026" },
  "blocks": [
    {
      "kind": "text",
      "summary": "Public chargers passed 15,000, mostly in HDB car parks. Fast chargers are rare; charging at home costs about half.",
      "sections": [
        { "heading": "Where things stand", "paragraphs": ["Public chargers passed 15,000 points this year, most of them in HDB car parks. Coverage is now broad, but fast chargers remain scarce outside the big malls, so most drivers still top up slowly overnight."] },
        { "heading": "What it means for you", "paragraphs": ["Expect around S$0.60–0.75 per kWh at public points, versus about S$0.35 at home. If you live in an HDB flat without a nearby charger, check the car park's rollout date before you buy."] },
        { "heading": "Before you buy", "bullets": ["Check your car park's charger rollout date.", "Compare home and public per-kWh prices.", "Plan for slow overnight charging, not fast top-ups."] }
      ]
    },
    { "kind": "action", "secondary": { "kind": "open_artifact", "label": "Open as document", "artifact": "artifact:018f22e2-7c00-7a13-8a13-0000000000b2" } }
  ],
  "more_label": "Read brief",
  "fallback_text": "Singapore EV charging in 2026: 15,000+ public chargers, mostly HDB car parks; fast chargers rare; home charging about half the price."
};
const textDoc = (block: Omit<chat.HarsoOutputTextBlock, "kind">, doc: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ ...brief, more_label: undefined, ...doc, blocks: [{ kind: "text", ...block }] });
const longParagraph = "Home charging costs about half as much as public points, and most HDB car parks now have slow chargers. Fast chargers are still rare outside the big malls, so plan for overnight top-ups rather than quick stops. Grants for fast chargers continue into next year.";

test("two key numbers render as figures (value then label, one list item each), not as fallback text", () => {
  const { card } = renderCard({ document: numbersDoc(spendingNumbers.items.slice(0, 2)) });
  expect(card).not.toHaveAttribute("data-fallback");
  expect(within(card).queryByText(spending.fallback_text)).toBeNull();
  const figures = within(within(card).getByRole("list")).getAllByRole("listitem");
  expect(figures.map(figure => figure.textContent)).toEqual(["S$4,280Spent", "S$720Left"]);
  for (const [figure, value, label] of [[0, "S$4,280", "Spent"], [1, "S$720", "Left"]] as const) {
    const valueNode = within(figures[figure]).getByText(value);
    expect(valueNode).toHaveClass("hkc-output-card-number-value");
    // Screen-reader order = visual order: the value is read first, then its label, inside the same item.
    expect(valueNode.nextElementSibling).toBe(within(figures[figure]).getByText(label));
  }
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("a third key number stays off the card and counts toward View all N, with rows sharing the count", () => {
  const { card, onViewAll, rerender } = renderCard({ document: numbersDoc(spendingNumbers.items) });
  expect(within(card).getAllByRole("listitem").map(item => item.textContent)).toEqual(["S$4,280Spent", "S$720Left"]);
  expect(within(card).queryByText("S$5,000")).toBeNull();
  const viewAll = within(card).getByRole("button", { name: "View all 3" });
  fireEvent.click(viewAll);
  expect(onViewAll).toHaveBeenCalledTimes(1);
  // Two numbers + four rows: the numbers are all shown, one row is hidden.
  const rows = (spending.blocks[2] as chat.HarsoOutputRowsBlock);
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={numbersDoc(spendingNumbers.items.slice(0, 2), [rows])} onViewAll={onViewAll} /></div>);
  expect(within(card).getAllByRole("list")).toHaveLength(2);
  expect(within(card).getByRole("button", { name: "View all 6" })).toBeVisible();
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={numbersDoc(spendingNumbers.items, [rows], { more_label: "View all transactions" })} onViewAll={onViewAll} /></div>);
  expect(within(card).getByRole("button", { name: "View all transactions" })).toBeVisible();
  // A caps override is honoured for numbers too.
  rerender(<div className="harso-kit"><chat.HarsoOutputCard document={numbersDoc(spendingNumbers.items)} caps={{ maxNumbers: 3 }} onViewAll={onViewAll} /></div>);
  expect(within(card).getAllByRole("listitem")).toHaveLength(3);
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("short complete text renders as body prose with no View all", () => {
  const { card } = renderCard({ document: textDoc({ sections: [{ paragraphs: ["Mostly yes, if you can charge at home."] }] }) });
  expect(card).not.toHaveAttribute("data-fallback");
  const text = within(card).getByText("Mostly yes, if you can charge at home.");
  expect(text.tagName).toBe("P");
  expect(text).toHaveClass("hkc-output-card-text");
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("long text clamps to the inline budget on a word boundary and shows View all", () => {
  const { card, onViewAll } = renderCard({ document: textDoc({ sections: [{ paragraphs: [longParagraph] }] }) });
  const text = card.querySelector(".hkc-output-card-text")!;
  expect(Array.from(text.textContent!).length).toBeLessThanOrEqual(chat.HARSO_OUTPUT_CARD_CAPS.maxTextChars + 1);
  expect(text.textContent).toMatch(/\S…$/);
  expect(longParagraph.startsWith(text.textContent!.slice(0, -1))).toBe(true);
  expect(longParagraph[text.textContent!.length - 1]).toBe(" ");
  fireEvent.click(within(card).getByRole("button", { name: "View all" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
});

test("the research brief shows its summary inline, and Read brief because the sections live off the card", () => {
  const { card } = renderCard({ document: brief });
  expect(within(card).getByText((brief.blocks[0] as chat.HarsoOutputTextBlock).summary!)).toBeVisible();
  expect(within(card).queryByText("Where things stand")).toBeNull();
  expect(within(card).queryByText(/Check your car park/)).toBeNull();
  expect(within(card).getByRole("button", { name: "Read brief" })).toBeVisible();
  expect(within(card).queryByRole("button", { name: /Open as document/ })).toBeNull();
  // Headings or bullets also continue off the card even when the prose itself fits.
  cleanup();
  const { card: second } = renderCard({ document: textDoc({ sections: [{ heading: "Before you buy", bullets: ["Check the rollout date."] }] }) });
  expect(within(second).getByText("Check the rollout date.")).toBeVisible();
  expect(within(second).getByRole("button", { name: "View all" })).toBeVisible();
});

test("numbers and text keep agent order with rows and still fall back on any unsupported kind", () => {
  const rows = { kind: "rows", items: flightRows.slice(0, 1) } as chat.HarsoOutputRowsBlock;
  const mixed = { ...flights, details: undefined, blocks: [{ kind: "text", sections: [{ paragraphs: ["Short lead."] }] }, spendingNumbers, rows] } as chat.HarsoOutputDocument;
  const { card } = renderCard({ document: { ...mixed, blocks: [mixed.blocks[0], { kind: "numbers", items: spendingNumbers.items.slice(0, 2) }, rows] } });
  const order = [...card.querySelectorAll(".hkc-output-card-text, .hkc-output-card-numbers, .hkc-output-card-rows")].map(node => node.className);
  expect(order).toEqual(["hkc-output-card-text", "hkc-output-card-numbers", "hkc-output-card-rows"]);
  cleanup();
  for (const other of [{ kind: "table", columns: [], rows: [] }, { kind: "status", state: "failed" }, { kind: "visual", visual: {} }]) {
    const { card: fallback, unmount } = renderCard({ document: { ...mixed, blocks: [...mixed.blocks, other] } });
    expect(fallback).toHaveAttribute("data-fallback", "true");
    expect(within(fallback).getByText(flights.fallback_text)).toBeVisible();
    expect(fallback.querySelector(".hkc-output-card-numbers, .hkc-output-card-text, .hkc-output-card-rows")).toBeNull();
    unmount();
  }
});

test("numbers and text are plain text sinks: markup-looking strings render literally", () => {
  const markup = "<img src=x onerror=alert(1)><b>x</b>";
  const document = { ...spending, details: undefined, blocks: [{ kind: "numbers", items: [{ value: "<b>1</b>", label: markup }, { value: "**2**", label: "y" }] }, { kind: "text", summary: markup, sections: [{ paragraphs: ["z"] }] }] };
  const { container } = render(<chat.HarsoOutputCard document={document as chat.HarsoOutputDocument} onViewAll={() => {}} />);
  expect(container.querySelector("img, b, strong")).toBeNull();
  expect(screen.getAllByText(markup)).toHaveLength(2);
  expect(screen.getByText("<b>1</b>")).toBeVisible();
});
