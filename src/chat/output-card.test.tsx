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
