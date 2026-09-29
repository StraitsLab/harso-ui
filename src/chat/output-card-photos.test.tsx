import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
// @ts-expect-error - plain ESM script without type declarations
import { schemaErrors, semanticErrors } from "../../scripts/check-output-playbook.mjs";
import schema from "../../docs/agent/schema/output-blocks.v1.json";
import * as chat from "./index";

afterEach(cleanup);
/** The document is one the agent may send: the renderer's fallback is not what is under test. */
const valid = (document: chat.HarsoOutputDocument) => {
  expect(schemaErrors(schema, document)).toEqual([]);
  expect(semanticErrors(document)).toEqual([]);
  return document;
};

const id = (n: number) => `artifact:0192a3b4-5c6d-7e8f-9a0b-${String(n).padStart(12, "0")}`;
const url = (artifact: string) => `https://files.test/${artifact.slice(9)}`;
const host: chat.HarsoOutputMediaHost = { resolveArtifact: url };
const doc = (blocks: chat.HarsoOutputBlock[]): chat.HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, header: { title: "Card" }, blocks, fallback_text: "FALLBACK" });
const renderDoc = (document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) => {
  render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} media={host} {...props} /></div>);
  return screen.getByRole("region", { name: document.header.title });
};
const row = (n: number, photo = true): chat.HarsoOutputRow =>
  ({ label: `Option ${n}`, secondary: "Detail", trailing: `S$${n}`, ...(photo ? { thumbnail: { artifact: id(n), alt: `Photo of option ${n}` } } : {}) });
const rows = (...items: chat.HarsoOutputRow[]) => doc([{ kind: "rows", items }]);

// ---- row thumbnails ----

test("every row leads with its photo, resolved through the host, alt from the row", () => {
  const card = renderDoc(rows(row(1), row(2), row(3)));
  const photos = card.querySelectorAll<HTMLImageElement>(".hkc-output-thumb img");
  expect([...photos].map(img => [img.getAttribute("src"), img.alt])).toEqual([1, 2, 3].map(n => [url(id(n)), `Photo of option ${n}`]));
  // The photo comes before the row text, so it leads the row.
  const first = card.querySelector(".hkc-output-card-row")!;
  expect(first.firstElementChild!.classList.contains("hkc-output-thumb")).toBe(true);
});

test("rows without thumbnails draw exactly as before: no photo box", () => {
  const card = renderDoc(rows(row(1, false), row(2, false)));
  expect(card.querySelector(".hkc-output-thumb")).toBeNull();
  expect(card.querySelector("[data-photos]")).toBeNull();
});

test("all or none: one row without a photo draws the block without photos, never ragged", () => {
  const card = renderDoc(rows(row(1), row(2, false), row(3)));
  expect(card.querySelectorAll(".hkc-output-thumb")).toHaveLength(0);
  expect(within(card).getByText("Option 2")).toBeTruthy();
});

test("all or none counts the rows sent, not the ones shown: a row hidden by the cap without a photo still turns photos off", () => {
  const card = renderDoc(rows(row(1), row(2), row(3), row(4, false)));
  expect(card.querySelectorAll(".hkc-output-thumb")).toHaveLength(0);
});

test("a malformed thumbnail turns photos off for the block (the checker refuses it; the card stays calm)", () => {
  const bad = { ...row(2), thumbnail: { artifact: "https://cdn.test/x.png", alt: "x" } };
  const card = renderDoc(rows(row(1), bad));
  expect(card.querySelectorAll(".hkc-output-thumb")).toHaveLength(0);
});

test("a host that cannot resolve artifacts draws the rows without photo boxes", () => {
  const card = renderDoc(rows(row(1), row(2)), { media: {} });
  expect(card.querySelector(".hkc-output-thumb")).toBeNull();
});

test("a photo the host cannot resolve is the quiet tile named by its alt; the row still shows", () => {
  const card = renderDoc(rows(row(1), row(2)), { media: { resolveArtifact: artifact => (artifact === id(2) ? undefined : url(artifact)) } });
  const tiles = card.querySelectorAll(".hkc-output-thumb");
  expect(tiles).toHaveLength(2);
  expect(tiles[1].getAttribute("data-state")).toBe("failed");
  expect(tiles[1].querySelector("img")).toBeNull();
  expect(within(tiles[1] as HTMLElement).getByRole("img", { name: "Photo of option 2" })).toBeTruthy();
  expect(within(card).getByText("Option 2")).toBeTruthy();
});

test("a photo that fails to load becomes the quiet tile (no broken image), and loading holds the box first", () => {
  const card = renderDoc(rows(row(1), row(2)));
  const tile = card.querySelectorAll(".hkc-output-thumb")[0];
  expect(tile.getAttribute("data-state")).toBe("loading");
  act(() => { fireEvent.error(tile.querySelector("img")!); });
  expect(tile.getAttribute("data-state")).toBe("failed");
  expect(tile.querySelector("img")).toBeNull();
  expect(within(tile as HTMLElement).getByRole("img", { name: "Photo of option 1" })).toBeTruthy();
  const other = card.querySelectorAll(".hkc-output-thumb")[1];
  act(() => { fireEvent.load(other.querySelector("img")!); });
  expect(other.getAttribute("data-state")).toBe("ready");
});

test("the row photo box is a fixed square (no layout jump when the photo arrives)", () => {
  const card = renderDoc(rows(row(1), row(2)));
  const style = getComputedStyle(card.querySelector(".hkc-output-thumb")!);
  expect([style.width, style.height, style.flexShrink]).toEqual(["44px", "44px", "0"]);
});

test("a running status list with photo rows is not read as steps", () => {
  const document = doc([{ kind: "status", state: "working", detail: "Checking", subject: { work_unit_id: "0192a3b4-5c6d-7e8f-9a0b-000000000962" } },
    { kind: "rows", items: [{ ...row(1), secondary: undefined }, { ...row(2), secondary: undefined }] }]);
  const card = renderDoc(document);
  expect(card.querySelectorAll(".hkc-output-thumb")).toHaveLength(2);
});

// ---- explicit photos beat inferred row visuals (F3 class) ----

const fund = (share: number, n: number, photo = true): chat.HarsoOutputRow =>
  ({ label: `Fund ${n}`, secondary: `${share}%`, trailing: `S$${share}`, ...(photo ? { thumbnail: { artifact: id(n), alt: `Fund ${n} logo` } } : {}) });

test.each([
  ["two rows, 60/40", [60, 40]],
  ["three rows, 50/30/20", [50, 30, 20]]
])("rows shaped like shares (%s) that carry photos draw their photos, not a share bar", (_name, shares) => {
  const card = renderDoc(valid(doc([{ kind: "rows", items: shares.map((share, n) => fund(share, n + 1)) }])));
  expect(card.querySelectorAll(".hkc-output-thumb")).toHaveLength(shares.length);
  expect(card.querySelector(".hkc-output-share-bar")).toBeNull();
});

test("the same rows without photos are still read as shares (the inference is untouched)", () => {
  const card = renderDoc(valid(doc([{ kind: "rows", items: [fund(60, 1, false), fund(40, 2, false)] }])));
  expect(card.querySelector(".hkc-output-share-bar")).not.toBeNull();
  expect(card.querySelector(".hkc-output-thumb")).toBeNull();
});

// ---- gallery ----

const gallery = (count: number, extra: Partial<chat.HarsoOutputImage> = {}) => doc([{ kind: "visual", visual: {
  kind: "image", artifact: id(1), alt: "Photo 1", aspect: "4:3",
  images: Array.from({ length: count }, (_, n) => ({ artifact: id(n + 1), alt: `Photo ${n + 1}` })), ...extra } } as chat.HarsoOutputBlock]);
const loaded = (card: HTMLElement) => [...card.querySelectorAll<HTMLImageElement>(".hkc-output-gallery-photo img")].map(img => img.alt);

test("a gallery is one region of photos with a quiet counter; only the shown photo and its neighbour load", () => {
  const card = renderDoc(gallery(8));
  const region = within(card).getByRole("region", { name: "8 photos" });
  expect(region.getAttribute("aria-roledescription")).toBe("gallery");
  expect(within(region).getByText("1 of 8")).toBeTruthy();
  expect(loaded(card)).toEqual(["Photo 1", "Photo 2"]);
  // Every photo keeps its box (the frame never changes size), the rest wait unfetched.
  expect(card.querySelectorAll(".hkc-output-gallery-photo")).toHaveLength(8);
  // The frame is the single image's frame.
  expect(region.classList.contains("hkc-output-media")).toBe(true);
});

test("Next and Previous move the counter, load the new neighbours, and keep what loaded", () => {
  const card = renderDoc(gallery(5));
  expect(within(card).queryByRole("button", { name: "Previous photo" })).toBeNull();
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(within(card).getByText("3 of 5")).toBeTruthy();
  expect(loaded(card)).toEqual(["Photo 1", "Photo 2", "Photo 3", "Photo 4"]);
  fireEvent.click(within(card).getByRole("button", { name: "Previous photo" }));
  expect(within(card).getByText("2 of 5")).toBeTruthy();
  expect(loaded(card)).toEqual(["Photo 1", "Photo 2", "Photo 3", "Photo 4"]);
});

test("arrow keys, Home and End on the focused gallery move between photos; other keys are left alone", () => {
  const card = renderDoc(gallery(4));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  expect(track.tabIndex).toBe(0);
  fireEvent.keyDown(track, { key: "ArrowRight" });
  expect(within(card).getByText("2 of 4")).toBeTruthy();
  fireEvent.keyDown(track, { key: "End" });
  expect(within(card).getByText("4 of 4")).toBeTruthy();
  fireEvent.keyDown(track, { key: "ArrowRight" });
  expect(within(card).getByText("4 of 4")).toBeTruthy();
  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(within(card).getByText("3 of 4")).toBeTruthy();
  fireEvent.keyDown(track, { key: "Home" });
  expect(within(card).getByText("1 of 4")).toBeTruthy();
  const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  track.dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(false);
});

test("only the photo shown is exposed to a screen reader; each photo keeps its alt", () => {
  const card = renderDoc(gallery(3));
  const slides = card.querySelectorAll(".hkc-output-gallery-slide");
  expect([...slides].map(slide => slide.getAttribute("aria-hidden"))).toEqual([null, "true", "true"]);
  expect([...slides].map(slide => slide.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect([...slides].map(slide => slide.getAttribute("aria-hidden"))).toEqual(["true", null, "true"]);
});

test("reaching an end hands keyboard focus to the other button, never to the page", () => {
  const card = renderDoc(gallery(2));
  const next = within(card).getByRole("button", { name: "Next photo" });
  next.focus();
  fireEvent.click(next);
  expect(within(card).queryByRole("button", { name: "Next photo" })).toBeNull();
  expect(document.activeElement).toBe(within(card).getByRole("button", { name: "Previous photo" }));
  fireEvent.click(document.activeElement!);
  expect(document.activeElement).toBe(within(card).getByRole("button", { name: "Next photo" }));
});

test("a photo that fails is the quiet tile; the gallery still browses to the others", () => {
  const card = renderDoc(gallery(3));
  const first = card.querySelector(".hkc-output-gallery-photo")!;
  act(() => { fireEvent.error(first.querySelector("img")!); });
  expect(first.getAttribute("data-state")).toBe("failed");
  expect(within(first as HTMLElement).getByRole("img", { name: "Photo 1" })).toBeTruthy();
  expect(card.querySelector(".hkc-output-media-failed, [role=alert]")).toBeNull();
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(within(card).getByText("2 of 3")).toBeTruthy();
});

test("buttons scroll the track by whole photos, instantly under reduced motion", () => {
  const matchMedia = vi.fn((query: string) => ({ matches: query.includes("reduce"), media: query } as MediaQueryList));
  vi.stubGlobal("matchMedia", matchMedia);
  const card = renderDoc(gallery(3));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  const scrollTo = vi.fn();
  track.scrollTo = scrollTo as typeof track.scrollTo;
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 400, behavior: "auto" });
  matchMedia.mockImplementation((query: string) => ({ matches: false, media: query } as MediaQueryList));
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 800, behavior: "smooth" });
  vi.unstubAllGlobals();
});

test("a swipe (the track scrolled by hand) updates the counter when it settles", () => {
  const card = renderDoc(gallery(4));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  track.scrollTo = vi.fn() as typeof track.scrollTo;
  track.scrollLeft = 800;
  fireEvent.scroll(track);
  expect(within(card).getByText("3 of 4")).toBeTruthy();
  expect(loaded(card)).toContain("Photo 4");
});

test.each([
  ["wheel (trackpad)", "wheel"], ["touch", "touchStart"], ["pointer", "pointerDown"]
] as const)("a hand on the track (%s) during a button's scroll wins: the counter settles where the track stopped", (_name, gesture) => {
  const card = renderDoc(gallery(4));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  const scrollTo = vi.fn();
  track.scrollTo = scrollTo as typeof track.scrollTo;
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(scrollTo).toHaveBeenCalledTimes(1);
  // Mid-way the user swipes back: scroll events on the way never move the counter off the command ...
  track.scrollLeft = 0;
  fireEvent.scroll(track);
  expect(within(card).getByText("2 of 4")).toBeTruthy();
  // ... but the hand cancels the command, and where the track then stops is where the counter goes.
  fireEvent[gesture](track);
  fireEvent.scroll(track);
  fireEvent(track, new Event("scrollend"));
  expect(within(card).getByText("1 of 4")).toBeTruthy();
  expect(scrollTo).toHaveBeenCalledTimes(1);
});

test.each([
  // [what the newest command is, the key, where the older scroll's end lands, expected counter]
  ["Next then ArrowRight", "ArrowRight", 1.2, "3 of 8", 2],
  ["Next then End", "End", 1.2, "8 of 8", 7],
  ["Next then Home (going back)", "Home", 0.9, "1 of 8", 0]
] as const)("the end of an older scroll never undoes a newer command (%s): the track is sent on to it", (_name, key, stoppedAt, counter, target) => {
  const card = renderDoc(gallery(8));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  const scrollTo = vi.fn();
  track.scrollTo = scrollTo as typeof track.scrollTo;
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  // The button's smooth scroll has reached photo 2 (rounded) when the key lands ...
  track.scrollLeft = 400 * 0.8;
  fireEvent.scroll(track);
  fireEvent.keyDown(track, { key });
  expect(within(card).getByText(counter)).toBeTruthy();
  // ... then the first scroll's end arrives, short of the new photo (Chrome: offset 512 on the way to 840).
  track.scrollLeft = 400 * stoppedAt;
  fireEvent.scroll(track);
  fireEvent(track, new Event("scrollend"));
  expect(within(card).getByText(counter)).toBeTruthy();
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 400 * target, behavior: "smooth" });
  // When the track arrives, the command is done and a later swipe is followed again.
  track.scrollLeft = 400 * target;
  fireEvent(track, new Event("scrollend"));
  expect(within(card).getByText(counter)).toBeTruthy();
  fireEvent.wheel(track);
  track.scrollLeft = 400 * (target === 0 ? 1 : target - 1);
  fireEvent(track, new Event("scrollend"));
  expect(within(card).getByText(`${target === 0 ? 2 : target} of 8`)).toBeTruthy();
});

test("a command the track can never reach gives up after a few tries and follows the track (no endless loop)", () => {
  const card = renderDoc(gallery(4));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  const scrollTo = vi.fn();
  track.scrollTo = scrollTo as typeof track.scrollTo;
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  for (let end = 0; end < 5; end++) fireEvent(track, new Event("scrollend"));
  expect(scrollTo).toHaveBeenCalledTimes(4);
  expect(within(card).getByText("1 of 4")).toBeTruthy();
});

test.each([
  ["one photo", 1], ["eleven photos", 11]
])("a gallery of %s draws as the single image (photo 1), as an old reader would", (_name, count) => {
  const card = renderDoc(gallery(count));
  expect(card.querySelector(".hkc-output-gallery")).toBeNull();
  expect(card.querySelector<HTMLImageElement>(".hkc-output-media-img")!.alt).toBe("Photo 1");
});

test.each([
  ["artifact", (image: chat.HarsoOutputImage) => { image.artifact = id(2); }],
  ["alt", (image: chat.HarsoOutputImage) => { image.alt = "Another photo"; }],
  ["order", (image: chat.HarsoOutputImage) => { image.images!.reverse(); }]
] as const)("a gallery whose photo 1 disagrees with the image (%s) draws as the single image old readers show", (_name, mutate) => {
  const document = gallery(3);
  mutate((document.blocks[0] as unknown as { visual: chat.HarsoOutputImage }).visual);
  const card = renderDoc(document);
  expect(card.querySelector(".hkc-output-gallery")).toBeNull();
  const image = (document.blocks[0] as unknown as { visual: chat.HarsoOutputImage }).visual;
  const img = card.querySelector<HTMLImageElement>(".hkc-output-media-img")!;
  expect([img.getAttribute("src"), img.alt]).toEqual([url(image.artifact), image.alt]);
});

test("a gallery with a malformed photo draws as the single image", () => {
  const document = gallery(3);
  ((document.blocks[0] as unknown as { visual: chat.HarsoOutputImage }).visual.images![2] as { artifact: string }).artifact = "artifact:nope";
  const card = renderDoc(document);
  expect(card.querySelector(".hkc-output-gallery")).toBeNull();
  expect(card.querySelector(".hkc-output-media-img")).not.toBeNull();
});

test.each([
  ["first", 1], ["middle", 3], ["last", 5]
])("a valid gallery whose %s photo the host cannot resolve keeps that photo's quiet tile; every other photo browses", (_name, missing) => {
  const document = valid(gallery(5));
  const card = renderDoc(document, { media: { resolveArtifact: artifact => artifact === id(missing) ? undefined : url(artifact) } });
  const region = within(card).getByRole("region", { name: "5 photos" });
  const tiles = [...region.querySelectorAll(".hkc-output-gallery-photo")];
  const next = () => fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  for (let at = 2; at <= 5; at++) { next(); expect(within(card).getByText(`${at} of 5`)).toBeTruthy(); }
  expect(tiles[missing - 1].getAttribute("data-state")).toBe("failed");
  expect(within(tiles[missing - 1] as HTMLElement).getByRole("img", { name: `Photo ${missing}`, hidden: true }).tagName).toBe("SPAN");
  expect(loaded(card)).toEqual([1, 2, 3, 4, 5].filter(n => n !== missing).map(n => `Photo ${n}`));
  expect(card.textContent).not.toContain("FALLBACK");
});

test("photo 1 that resolves but fails to load is its own tile too; the gallery still browses", () => {
  const card = renderDoc(valid(gallery(3)));
  const first = card.querySelector(".hkc-output-gallery-photo")!;
  act(() => { fireEvent.error(first.querySelector("img")!); });
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  expect(within(card).getByText("2 of 3")).toBeTruthy();
});

test("without a host that resolves artifacts a gallery is text, as a single image is (unchanged)", () => {
  const galleryCard = renderDoc(valid(gallery(3)), { media: {} });
  expect(galleryCard.querySelector(".hkc-output-media")).toBeNull();
  expect(galleryCard.textContent).toContain("FALLBACK");
  cleanup();
  const single = doc([{ kind: "visual", visual: { kind: "image", artifact: id(1), alt: "Photo 1", aspect: "4:3" } } as chat.HarsoOutputBlock]);
  const singleCard = renderDoc(valid(single), { media: { resolveArtifact: () => undefined } });
  expect(singleCard.querySelector(".hkc-output-media")).toBeNull();
  expect(singleCard.textContent).toContain("FALLBACK");
});

test("View all (uncapped) shows the same gallery", () => {
  const card = renderDoc(chat.harsoOutputWholeAnswer(gallery(6)), { caps: chat.HARSO_OUTPUT_CARD_UNCAPPED });
  expect(within(card).getByRole("region", { name: "6 photos" })).toBeTruthy();
  expect(within(card).getByText("1 of 6")).toBeTruthy();
});

// ---- full-answer grid ----
test("uncapped photo rows default to grid, preserve metadata in List, and reset for a different answer", () => {
  const document = rows({ ...row(1), mark: "pick", status: "paid" }, row(2));
  const view = render(<chat.HarsoOutputCard document={document} caps={chat.HARSO_OUTPUT_CARD_UNCAPPED} media={host} onViewAll={() => {}} />);
  expect(view.container.querySelector('[data-layout="grid"]')).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "List", exact: true }));
  expect(view.container.querySelector('[data-layout="list"]')).toBeTruthy();
  for (const word of ["Pick", "paid", "Option 1", "S$1"]) expect(screen.getByText(word)).toBeTruthy();
  view.rerender(<chat.HarsoOutputCard document={rows(row(3))} caps={chat.HARSO_OUTPUT_CARD_UNCAPPED} media={host} onViewAll={() => {}} />);
  expect(view.container.querySelector('[data-layout="grid"]')).toBeTruthy();
});

for (const variant of ["missing", "malformed", "no-host", "empty", "visual", "second-block", "inline"]) {
  test(`no grid switch for ${variant}`, () => {
    const document = variant === "empty" ? rows() : rows(row(1), variant === "missing" ? row(2, false)
      : variant === "malformed" ? { ...row(2), thumbnail: { artifact: "bad", alt: "Bad" } } : row(2));
    if (variant === "visual") document.blocks.push({ kind: "image", artifact: id(9), alt: "Hero" });
    if (variant === "second-block") document.blocks.push({ kind: "rows", items: [row(3, false)] });
    const card = renderDoc(document, { caps: variant === "inline" ? undefined : chat.HARSO_OUTPUT_CARD_UNCAPPED,
      media: variant === "no-host" ? {} : host });
    expect(within(card).queryByRole("group", { name: "View layout" })).toBeNull();
    expect(card.querySelector('[data-layout="grid"]')).toBeNull();
  });
}
