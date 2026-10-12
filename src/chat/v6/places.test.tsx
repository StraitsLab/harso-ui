import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoOutputCard, type HarsoOutputCardProps, type HarsoOutputDocument, type HarsoOutputRow, type HarsoOutputTextSection } from "../output-card";
import styles from "./places.css?raw";
import { family, placesFamilies } from "./places";
import type { V6FamilyProps } from "./types";

// WEV-3321 (P5): trip days with dates and photos, and nearby places with stars, open state, distance and a Directions
// link. Every part comes from a field the document carries; a missing field leaves its part out.

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const AS_OF = "2026-10-11T09:10Z";
const art = (n: number) => `artifact:0192a3b4-5c6d-7e8f-9a0b-${String(n).padStart(12, "0")}`;
const DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=1.3113,103.7960&travelmode=driving";
const media = { resolveArtifact: (artifact: string) => `https://photos.test/${artifact.slice(-4)}.jpg`, mapTile: (z: number, x: number, y: number) => `https://tiles.test/${z}/${x}/${y}.png` };

const draw = (document: HarsoOutputDocument, props: Partial<HarsoOutputCardProps> = {}) =>
  render(<div className="harso-kit"><HarsoOutputCard document={document} families={placesFamilies} onViewAll={vi.fn()} {...props} /></div>);

// ---- nearby places ----

const places = [
  { id: "c1", label: "Raffles Medical Holland V", lat: "1.3113", lon: "103.7960" },
  { id: "c2", label: "Fullerton Health Novena", lat: "1.3203", lon: "103.8436" },
  { id: "c3", label: "Parkway Shenton Bukit Timah", lat: "1.3294", lon: "103.8025" }
];
const clinics: HarsoOutputRow[] = [
  { id: "c1", label: "Raffles Medical", secondary: "Holland Village · walk-in", trailing: "8 min", mark: "pick", brand: "rafflesmedical.com",
    rating: "4.4", review_count: 128, category: "Medical clinic", opening_label: "Open 24 hours", open_state: "open", distance: "2.4 km", travel_mode: "drive",
    action: { kind: "open_url", label: "Directions", url: DIRECTIONS } },
  { id: "c2", label: "Fullerton Health", secondary: "Novena · walk-in", trailing: "12 min", brand: "fullertonhealth.com",
    rating: "4.2", review_count: 96, category: "Medical clinic", open_state: "closed", distance: "5.8 km", travel_mode: "drive",
    action: { kind: "open_url", label: "Directions", url: "https://www.google.com/maps/dir/?api=1&destination=1.3203,103.8436&travelmode=driving" } },
  { id: "c3", label: "Parkway Shenton", secondary: "Bukit Timah · call first", trailing: "15 min" }
];
const nearby = (rows: HarsoOutputRow[] = clinics, extra: Partial<HarsoOutputDocument> = {}, selected: string | undefined = "c1"): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "places-nearby", as_of: AS_OF,
  header: { title: "24-hour clinics near you", subtitle: "Open now" },
  blocks: [{ kind: "visual", visual: { kind: "map", places, ...(selected ? { selected_place_id: selected } : {}) } }, { kind: "rows", items: rows }],
  fallback_text: "FALLBACK", ...extra
});
const rowOf = (name: string) => within(document.querySelector<HTMLElement>(".hkc-places-list")!).getByText(name).closest("li")!;

test("the row for the selected place is found by id, even when the labels on the map and in the rows differ", () => {
  draw(nearby(clinics, {}, "c2"), { media });
  expect(rowOf("Fullerton Health").getAttribute("aria-current")).toBe("true");
  expect(rowOf("Raffles Medical").getAttribute("aria-current")).toBeNull();
});

test("a row whose label equals a place label but whose id differs is not joined to that place", () => {
  // The row's label is the selected place's label; its id is not the place's id, so it is not the selected row.
  const rows = [{ ...clinics[0], id: "x9", label: "Fullerton Health Novena" }, { ...clinics[1], label: "Other name" }];
  draw(nearby(rows, {}, "c2"), { media });
  expect(rowOf("Fullerton Health Novena").getAttribute("aria-current")).toBeNull();
  expect(rowOf("Other name").getAttribute("aria-current")).toBe("true");
});

test("rows keep source order and the label the document gave", () => {
  draw(nearby(), { media });
  expect([...document.querySelectorAll(".hkc-places-list > li")].map(li => li.querySelector("b")?.textContent)).toEqual(["Raffles Medical", "Fullerton Health", "Parkway Shenton"]);
});

test("a full row shows stars, review count, category, open words, distance and travel mode", () => {
  draw(nearby(), { media });
  const row = rowOf("Raffles Medical");
  expect(within(row).getByRole("img", { name: "Rated 4.4 out of 5, 128 reviews" })).toBeTruthy();
  expect(row.textContent).toContain("4.4");
  expect(row.textContent).toContain("(128)");
  expect(row.textContent).toContain("Medical clinic");
  expect(row.textContent).toContain("Open 24 hours");
  expect(row.textContent).toContain("2.4 km");
  expect(row.textContent).toContain("8 min drive");
  expect(row.querySelector("[data-open-state]")!.getAttribute("data-open-state")).toBe("open");
  expect(within(row).getByText("Pick")).toBeTruthy();
});

test("open state says a word even with no label, and the snapshot time is on the card", () => {
  draw(nearby(), { media });
  expect(within(rowOf("Fullerton Health")).getByText("Closed")).toBeTruthy();
  expect(screen.getByText(/^As of /)).toBeTruthy();
});

test("missing rating and hours stay absent: no stars, no zero, no Open, no Closed, no Unknown", () => {
  draw(nearby(), { media });
  const bare = rowOf("Parkway Shenton");
  expect(bare.querySelector("[role=img]")).toBeNull();
  expect(bare.querySelector("[data-open-state]")).toBeNull();
  expect(bare.textContent).not.toMatch(/\b0\b|Open|Closed|Unknown|reviews?/);
  expect(bare.querySelector("button")).toBeNull();
});

test("an unreadable rating is absent, an unknown state with no label is absent, and a count alone is not stars", () => {
  const rows: HarsoOutputRow[] = [
    { id: "a", label: "Too high", rating: "9", review_count: 3 },
    { id: "b", label: "Not a number", rating: "abc" },
    { id: "c", label: "Unknown state", open_state: "unknown" },
    { id: "d", label: "Count only", review_count: 12 }
  ];
  draw(nearby(rows, {}, undefined), { media, mode: "full" });
  for (const name of ["Too high", "Not a number", "Unknown state", "Count only"]) expect(rowOf(name).querySelector("[role=img]")).toBeNull();
  expect(rowOf("Unknown state").querySelector("[data-open-state]")).toBeNull();
  expect(rowOf("Too high").textContent).not.toContain("9");
  expect(rowOf("Count only").textContent).toContain("12 reviews");
});

test("Directions opens the exact URL the row supplied, and only that row's", () => {
  const onOpenUrl = vi.fn();
  draw(nearby(), { media, onOpenUrl });
  fireEvent.click(within(rowOf("Raffles Medical")).getByRole("button", { name: "Directions" }));
  expect(onOpenUrl).toHaveBeenCalledTimes(1);
  expect(onOpenUrl).toHaveBeenCalledWith(DIRECTIONS);
  expect(screen.getAllByRole("button", { name: "Directions" })).toHaveLength(2);
});

test("no host callback, no row action or a non-https link means no Directions control and no Call button", () => {
  const rows = [{ ...clinics[0], action: { kind: "open_url" as const, label: "Directions", url: "http://insecure.test/x" } }, clinics[2]];
  draw(nearby(rows), { media, onOpenUrl: vi.fn() });
  expect(screen.queryByRole("button", { name: /directions/i })).toBeNull();
  cleanup();
  draw(nearby(), { media });
  expect(screen.queryByRole("button", { name: /directions/i })).toBeNull();
  expect(screen.queryByText(/call/i, { selector: "button, a" })).toBeNull();
});

test("inline shows three rows and View all with the true total; full shows every row", () => {
  const many = Array.from({ length: 5 }, (_, n) => ({ id: `r${n}`, label: `Clinic ${n}` }));
  const onViewAll = vi.fn();
  draw(nearby(many, {}, undefined), { media, onViewAll });
  expect(document.querySelectorAll(".hkc-places-list > li")).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "View all 5" }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  draw(nearby(many, {}, undefined), { media, mode: "full" });
  expect(document.querySelectorAll(".hkc-places-list > li")).toHaveLength(5);
  expect(screen.queryByRole("button", { name: /view all/i })).toBeNull();
});

test("a map the host cannot draw, or whose tiles fail, leaves every place in the rows", () => {
  draw(nearby());
  expect(screen.queryByRole("figure")).toBeNull();
  for (const name of ["Raffles Medical", "Fullerton Health", "Parkway Shenton"]) expect(screen.getByText(name)).toBeTruthy();
  cleanup();
  const { container } = draw(nearby(), { media });
  container.querySelectorAll("img").forEach(img => fireEvent.error(img));
  for (const name of ["Raffles Medical", "Fullerton Health", "Parkway Shenton"]) expect(screen.getByText(name)).toBeTruthy();
});

test("a document the family cannot draw whole goes to the generic card, which keeps every block", () => {
  const doc = nearby();
  doc.blocks.push({ kind: "numbers", items: [{ value: "3", label: "Clinics" }] });
  draw(doc, { media });
  expect(screen.getByText("Clinics")).toBeTruthy();
  expect(document.querySelector(".hkc-places")).toBeNull();
  cleanup();
  const grouped = nearby([{ id: "g", label: "Grouped", group: "North" }]);
  draw(grouped, { media });
  expect(document.querySelector(".hkc-places")).toBeNull();
});

test("a row action block in the trailing area is drawn only when the host can act on it", () => {
  const doc = nearby(clinics, { blocks: [...nearby().blocks, { kind: "action", secondary: { kind: "open_artifact", label: "Open list", artifact: art(1) } }] });
  draw(doc, { media });
  expect(screen.queryByRole("button", { name: "Open list" })).toBeNull();
  cleanup();
  const onOpenArtifact = vi.fn();
  draw(doc, { media, onOpenArtifact });
  fireEvent.click(screen.getByRole("button", { name: "Open list" }));
  expect(onOpenArtifact).toHaveBeenCalledWith(art(1));
});

test("places widgets: small is the pick (else the first row), medium lists rows; one open target, no Directions", () => {
  const onViewAll = vi.fn();
  draw(nearby(), { media, onViewAll, onOpenUrl: vi.fn(), widgetSize: "small" });
  const small = document.querySelector<HTMLElement>(".hkc-v6-widget")!;
  expect(small.getAttribute("data-size")).toBe("small");
  expect(small.textContent).toContain("Raffles Medical");
  expect(small.textContent).toContain("8 min drive");
  expect(small.textContent).not.toContain("Fullerton");
  expect(small.querySelectorAll("a, button")).toHaveLength(1);
  expect(screen.queryByRole("button", { name: /directions/i })).toBeNull();
  fireEvent.click(small.querySelector("button")!);
  expect(onViewAll).toHaveBeenCalledTimes(1);
  cleanup();
  draw(nearby(), { media, widgetSize: "medium" });
  const medium = document.querySelector<HTMLElement>(".hkc-v6-widget")!;
  for (const name of ["Raffles Medical", "Fullerton Health", "Parkway Shenton"]) expect(medium.textContent).toContain(name);
  expect(medium.querySelectorAll("button")).toHaveLength(1);
  cleanup();
  draw(nearby(), { media, widgetSize: "large" });
  expect(document.querySelector(".hkc-v6-widget")).toBeNull();
  expect(screen.getByRole("region", { name: "24-hour clinics near you" })).toBeTruthy();
});

test("the places widget names the pick, not the first row, when a later row is the pick", () => {
  const rows = [{ ...clinics[1], mark: undefined }, { ...clinics[0], mark: "pick" as const }];
  draw(nearby(rows, {}, undefined), { widgetSize: "small" });
  expect(document.querySelector(".hkc-v6-widget")!.textContent).toContain("Raffles Medical");
});

test("the places card has no axe violation and every control has a name", async () => {
  const { container } = draw(nearby(), { media, onOpenUrl: vi.fn(), mode: "full" });
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

// ---- trip itinerary ----

const days: HarsoOutputTextSection[] = [
  { heading: "Day 1 · Higashiyama", date: "2026-10-14", thumbnail: { artifact: art(11), alt: "Higashiyama street" }, bullets: ["09:00 Kiyomizu-dera before the crowds", "12:30 Lunch on Ninenzaka", "16:00 Yasaka Shrine at dusk"] },
  { heading: "Day 2 · Arashiyama", date: "2026-10-15", thumbnail: { artifact: art(12), alt: "Bamboo grove" }, bullets: ["08:30 Bamboo grove", "11:00 Tenryu-ji garden"] },
  { heading: "Day 3 · Fushimi Inari", date: "2026-10-16", bullets: ["07:30 Walk the torii gates"], paragraphs: ["Bring water."] }
];
const trip = (sections = days, extra: Partial<HarsoOutputDocument> = {}): HarsoOutputDocument => ({
  kind: "output_blocks", major: 1, template: "trip-itinerary", as_of: AS_OF,
  header: { title: "Kyoto in 3 days", subtitle: "14–16 Oct" },
  blocks: [
    { kind: "visual", visual: { kind: "map", places: [{ id: "d1", label: "Higashiyama", lat: "34.9967", lon: "135.7850" }, { id: "d2", label: "Arashiyama", lat: "35.0094", lon: "135.6668" }] } },
    { kind: "text", sections }
  ],
  fallback_text: "FALLBACK", ...extra
});
// Every day stays mounted under its tab (a hidden panel keeps its place), so the DOM holds all of them in order.
const headings = () => [...document.querySelectorAll(".hkc-day h3")].map(h => h.textContent);
const shown = () => [...document.querySelectorAll<HTMLElement>(".hkc-day")].filter(day => !day.closest("[hidden]"));
const stops = (sections = days) => sections.flatMap(section => section.bullets ?? []);

test("one section per day, in document order, with the date as a plain label; \"Day 1 · Area\" reads \"1. Area\"", () => {
  draw(trip(), { media });
  expect(headings()).toEqual(["1. Higashiyama", "2. Arashiyama", "3. Fushimi Inari"]);
  const dates = [...document.querySelectorAll(".hkc-day time")];
  expect(dates.map(time => time.textContent)).toEqual(["Wed 14 Oct", "Thu 15 Oct", "Fri 16 Oct"]);
  expect(dates[0].getAttribute("datetime")).toBe("2026-10-14");
});

test("document order is kept even when the dates are out of order", () => {
  draw(trip([days[2], days[0], days[1]]), { media });
  // A heading that names another day than its place is kept whole, never renumbered.
  expect(headings()).toEqual(["Day 3 · Fushimi Inari", "Day 1 · Higashiyama", "Day 2 · Arashiyama"]);
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Day 1 Fri 16", "Day 2 Wed 14", "Day 3 Thu 15"]);
});

test("a day with no date or an impossible date shows no date; a day with no photo shows no photo", () => {
  const sections = [{ heading: "No date", bullets: ["10:00 Walk"] }, { heading: "Bad date", date: "2026-02-30", bullets: ["11:00 Tea"] }, days[0]];
  draw(trip(sections), { media });
  const [first, second, third] = [...document.querySelectorAll(".hkc-day")];
  expect(first.querySelector("time")).toBeNull();
  expect(second.querySelector("time")).toBeNull();
  expect(third.querySelector("time")).not.toBeNull();
  expect(first.querySelector("img, [role=img]")).toBeNull();
  expect(third.querySelector("img")!.getAttribute("alt")).toBe("Higashiyama street");
});

test("every stop is text: times are split out and nothing is dropped, photos or not", () => {
  draw(trip(), { media });
  for (const stop of stops()) {
    const [time, ...rest] = stop.split(" ");
    const item = screen.getByText(rest.join(" ")).closest("li")!;
    expect(item.textContent).toContain(time);
  }
  expect(screen.getByText("Bring water.")).toBeTruthy();
});

test("next day: the earliest dated day on or after the snapshot day, whatever the document order", () => {
  const scrambled = [days[2], days[0], days[1]]; // 16, 14, 15
  draw(trip(scrambled), { media });
  const next = document.querySelectorAll("[data-next]");
  expect(next).toHaveLength(1);
  expect(next[0].querySelector("h3")!.textContent).toBe("Day 1 · Higashiyama");
  expect(within(next[0] as HTMLElement).getByText("Next")).toBeTruthy();
  // The card opens on the next day's tab.
  expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Day 2 Wed 14");
  expect(shown().map(day => day.querySelector("h3")!.textContent)).toEqual(["Day 1 · Higashiyama"]);
  cleanup();
  draw(trip(scrambled, { as_of: "2026-10-15T23:59Z" }), { media });
  expect(document.querySelector("[data-next] h3")!.textContent).toBe("Day 2 · Arashiyama");
  cleanup();
  draw(trip(scrambled, { as_of: "2026-10-16T00:00:00Z" }), { media });
  expect(document.querySelector("[data-next] h3")!.textContent).toBe("Day 3 · Fushimi Inari");
});

test("next day: none when every day is past, when no day has a date, or when the card has no snapshot time", () => {
  draw(trip(days, { as_of: "2026-10-17T00:00Z" }), { media });
  expect(document.querySelector("[data-next]")).toBeNull();
  cleanup();
  draw(trip(days.map(({ date: _date, ...section }) => section)), { media });
  expect(document.querySelector("[data-next]")).toBeNull();
  cleanup();
  const { as_of: _asOf, ...unsaved } = trip();
  draw(unsaved, { media });
  expect(document.querySelector("[data-next]")).toBeNull();
});

test("the device clock never moves the next day", () => {
  vi.useFakeTimers();
  for (const now of ["2020-01-01T00:00:00Z", "2026-10-16T12:00:00Z", "2031-05-05T00:00:00Z"]) {
    vi.setSystemTime(new Date(now));
    draw(trip(), { media });
    expect(document.querySelector("[data-next] h3")!.textContent).toBe("1. Higashiyama");
    cleanup();
  }
});

test("photos or map that fail leave every day, date and stop as text", () => {
  const { container } = draw(trip(), { media });
  container.querySelectorAll("img").forEach(img => fireEvent.error(img));
  expect(headings()).toHaveLength(3);
  for (const stop of stops()) expect(container.textContent).toContain(stop.slice(6));
  cleanup();
  const bare = draw(trip());
  expect(bare.container.querySelector("img")).toBeNull();
  expect(headings()).toHaveLength(3);
  for (const stop of stops()) expect(bare.container.textContent).toContain(stop.slice(6));
});

test("the trip's plan action is drawn only when the host can open the artifact", () => {
  const doc = trip(days, { blocks: [...trip().blocks, { kind: "action", secondary: { kind: "open_artifact", label: "Open plan", artifact: art(5) } }] });
  draw(doc, { media });
  expect(screen.queryByRole("button", { name: "Open plan" })).toBeNull();
  cleanup();
  const onOpenArtifact = vi.fn();
  draw(doc, { media, onOpenArtifact });
  fireEvent.click(screen.getByRole("button", { name: "Open plan" }));
  expect(onOpenArtifact).toHaveBeenCalledWith(art(5));
});

test("trip documents the family cannot draw whole go to the generic card", () => {
  for (const blocks of [
    [{ kind: "text" as const, sections: [] }],
    [...trip().blocks, { kind: "rows" as const, items: [{ label: "Extra" }] }],
    [trip().blocks[1], trip().blocks[1]]
  ]) {
    draw({ ...trip(), blocks }, { media });
    expect(document.querySelector(".hkc-trip")).toBeNull();
    cleanup();
  }
});

test("V6 day tabs: one day shown at a time, Day n over its short date, arrow keys move between days", () => {
  draw(trip(days, { as_of: "2026-10-01T09:00Z" }), { media });
  const tabs = screen.getAllByRole("tab");
  expect(tabs.map(tab => tab.textContent)).toEqual(["Day 1 Wed 14", "Day 2 Thu 15", "Day 3 Fri 16"]);
  expect(screen.getByRole("tablist", { name: "Days" })).toBeTruthy();
  expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  expect(shown().map(day => day.querySelector("h3")!.textContent)).toEqual(["1. Higashiyama"]);
  fireEvent.click(tabs[1]);
  expect(shown().map(day => day.querySelector("h3")!.textContent)).toEqual(["2. Arashiyama"]);
  fireEvent.keyDown(tabs[1], { key: "ArrowRight" });
  expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Day 3 Fri 16");
  expect(shown()[0].textContent).toContain("Bring water.");
  cleanup();
  // A one-day trip needs no tabs.
  draw(trip([days[0]]), { media });
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(headings()).toEqual(["1. Higashiyama"]);
});

test("V6 hero: the photo carries the day's date and title; without a photo the same words lead the day", () => {
  draw(trip(), { media });
  const first = document.querySelectorAll<HTMLElement>(".hkc-day")[0];
  const hero = first.querySelector<HTMLElement>(".hkc-trip-hero")!;
  expect(hero.querySelector("img")!.getAttribute("alt")).toBe("Higashiyama street");
  expect(hero.querySelector("time")!.textContent).toBe("Wed 14 Oct");
  expect(hero.querySelector("h3")!.textContent).toBe("1. Higashiyama");
  const third = document.querySelectorAll<HTMLElement>(".hkc-day")[2];
  expect(third.querySelector(".hkc-trip-hero")).toBeNull();
  expect(third.querySelector(".hkc-day-head h3")!.textContent).toBe("3. Fushimi Inari");
  cleanup();
  // A host that serves no photos draws no hero at all, and no white words over nothing.
  draw(trip());
  expect(document.querySelector(".hkc-trip-hero")).toBeNull();
  expect(headings()).toEqual(["1. Higashiyama", "2. Arashiyama", "3. Fushimi Inari"]);
});

test("V6 schematic map: with no map tiles, numbered pins placed west to east and north to south, named for screen readers", () => {
  const four = [...days, { heading: "Day 4 · Nishiki and Gion", date: "2026-10-17", bullets: ["10:00 Nishiki Market"] }];
  const pinsAt = [{ id: "d1", label: "Higashiyama", lat: "34.9967", lon: "135.7850" }, { id: "d2", label: "Arashiyama", lat: "35.0094", lon: "135.6668" },
    { id: "d3", label: "Fushimi Inari", lat: "34.9671", lon: "135.7727" }, { id: "d4", label: "Nishiki and Gion", lat: "35.0050", lon: "135.7650" }];
  const doc = trip(four, { blocks: [{ kind: "visual", visual: { kind: "map", places: pinsAt } }, { kind: "text", sections: four }] });
  draw(doc, { media: { resolveArtifact: media.resolveArtifact } });
  const map = screen.getByRole("figure", { name: "Map of the trip, not to scale" });
  expect(map.textContent).toContain("Where each day is · pin number = day");
  expect(map.textContent).toContain("Schematic · not to scale");
  const pins = [...map.querySelectorAll(".hkc-trip-pin")];
  expect(pins.map(pin => pin.textContent)).toEqual(["1", "2", "3", "4"]);
  const xy = pins.map(pin => /translate\(([\d.]+) ([\d.]+)\)/.exec(pin.getAttribute("transform")!)!.slice(1).map(Number));
  // Arashiyama (2) is furthest west, Higashiyama (1) furthest east; Fushimi Inari (3) is furthest south.
  expect(xy[1][0]).toBeLessThan(xy[3][0]);
  expect(xy[3][0]).toBeLessThan(xy[2][0]);
  expect(xy[2][0]).toBeLessThan(xy[0][0]);
  expect(Math.max(...xy.map(([, y]) => y))).toBe(xy[2][1]);
  expect([...map.querySelectorAll("ol li")].map(li => li.textContent)).toEqual(pinsAt.map(place => place.label));
  expect(map.querySelector("img")).toBeNull();
  cleanup();
  // With tiles lent, the real map is drawn instead; a place without coordinates draws no map at all.
  draw(doc, { media });
  expect(screen.queryByRole("figure", { name: "Map of the trip, not to scale" })).toBeNull();
  expect(screen.getByRole("figure", { name: "Map" })).toBeTruthy();
  cleanup();
  const broken = trip(four, { blocks: [{ kind: "visual", visual: { kind: "map", places: [{ id: "d1", label: "Higashiyama", lat: "north", lon: "135.7850" }] } }, { kind: "text", sections: four }] });
  draw(broken, { media: { resolveArtifact: media.resolveArtifact } });
  expect(screen.queryByRole("figure")).toBeNull();
  expect(headings()).toHaveLength(4);
});

test("the schematic legend says pin = day only when there is one place per day", () => {
  draw(trip(), { media: { resolveArtifact: media.resolveArtifact } });
  expect(screen.getByRole("figure", { name: "Map of the trip, not to scale" }).textContent).toContain("Where the places are");
});

test("trip widgets: medium is the next day with its photo and two stops; large lists the days; small is not offered", () => {
  draw(trip([days[2], days[0], days[1]]), { media, widgetSize: "medium" });
  const medium = document.querySelector<HTMLElement>(".hkc-v6-widget")!;
  expect(medium.textContent).toContain("Next · Wed 14 Oct");
  expect(medium.textContent).toContain("Day 1 · Higashiyama");
  expect(medium.textContent).toContain("Kiyomizu-dera before the crowds");
  expect(medium.textContent).toContain("Lunch on Ninenzaka");
  expect(medium.textContent).not.toContain("Yasaka Shrine");
  expect(medium.querySelector("img")).not.toBeNull();
  cleanup();
  draw(trip(), { media, widgetSize: "large" });
  const large = document.querySelector<HTMLElement>(".hkc-v6-widget")!;
  for (const heading of ["Day 1 · Higashiyama", "Day 2 · Arashiyama", "Day 3 · Fushimi Inari"]) expect(large.textContent).toContain(heading);
  expect(large.querySelectorAll("button")).toHaveLength(1);
  cleanup();
  draw(trip(), { media, widgetSize: "small" });
  expect(document.querySelector(".hkc-v6-widget")).toBeNull();
});

test("the trip medium widget makes no 'Next' claim without a snapshot time and shows the first day", () => {
  const { as_of: _asOf, ...unsaved } = trip();
  draw(unsaved, { media, widgetSize: "medium" });
  const widget = document.querySelector<HTMLElement>(".hkc-v6-widget")!;
  expect(widget.textContent).toContain("Day 1 · Higashiyama");
  expect(widget.textContent).not.toContain("Next");
});

test("the trip card has no axe violation", async () => {
  const { container } = draw(trip(), { media, onOpenUrl: vi.fn(), mode: "full" });
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(violation => violation.id)).toEqual([]);
});

// ---- the family object ----

test("widget sizes: trip medium and large, places small and medium, nothing for other templates", () => {
  expect(family.supportedWidgetSizes("trip-itinerary")).toEqual(["medium", "large"]);
  expect(family.supportedWidgetSizes("places-nearby")).toEqual(["small", "medium"]);
  expect(family.supportedWidgetSizes("weather-now")).toEqual([]);
  expect(Object.keys(placesFamilies).sort()).toEqual(["places-nearby", "trip-itinerary"]);
});

test("another template, or no template, is declined", () => {
  const props = (document: HarsoOutputDocument): V6FamilyProps => ({ document, mode: "inline", host: { onViewAll: () => {} }, media: {}, renderBrand: () => undefined });
  expect(family.renderFamily(props({ ...nearby(), template: "weather-now" }))).toBeUndefined();
  const { template: _template, ...plain } = nearby();
  expect(family.renderFamily(props(plain))).toBeUndefined();
});

test("a brand mark comes only from the host's lookup; without one a letter tile, and none without a brand", () => {
  const renderBrand = vi.fn(({ domain }: { domain: string }) => <svg data-testid={`mark-${domain}`} />);
  draw(nearby(), { media, renderBrand });
  expect(screen.getByTestId("mark-rafflesmedical.com")).toBeTruthy();
  expect(new Set(renderBrand.mock.calls.map(([brand]) => brand.domain))).toEqual(new Set(["rafflesmedical.com", "fullertonhealth.com"]));
  expect(rowOf("Parkway Shenton").querySelector(".hkc-v6-brand")).toBeNull();
  cleanup();
  draw(nearby(), { media });
  expect(rowOf("Raffles Medical").querySelector(".hkc-v6-brand")!.getAttribute("data-mark")).toBe("letter");
});

test("styles: tokens only, no borders or !important, 44px targets on touch, visible focus", () => {
  const source = styles.replace(/\/\*[\s\S]*?\*\//g, "");
  const normal = source.split("@media (forced-colors: active)")[0];
  expect(normal).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  expect(normal).not.toMatch(/!important/);
  expect(normal).not.toMatch(/font-family/);
  const lines = [...normal.matchAll(/(?:^|[;{\s])((?:border|outline)(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?)\s*:\s*([^;}]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`);
  expect(lines.filter(line => !/^(border|outline)[a-z-]*: (0|none)$/.test(line) && !line.startsWith("outline: 2px solid var(--hk-accent)"))).toEqual([]);
  expect(source).toMatch(/pointer: coarse\) \{[^}]*hkc-place-directions[^}]*min-height: 44px/);
  expect(source).toMatch(/hkc-place-directions:focus-visible/);
  expect(source).toMatch(/hkc-v6-widget-open:focus-visible/);
  expect(source).toMatch(/prefers-reduced-motion/);
});
