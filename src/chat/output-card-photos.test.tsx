import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";

afterEach(cleanup);

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

test("a swipe that interrupts a button's scroll still settles the counter on where the track stopped", () => {
  const card = renderDoc(gallery(4));
  const track = card.querySelector<HTMLElement>(".hkc-output-gallery-track")!;
  Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
  track.scrollTo = vi.fn() as typeof track.scrollTo;
  fireEvent.click(within(card).getByRole("button", { name: "Next photo" }));
  // Mid-way the user swipes back: scroll events at 0 are ignored while the button's scroll is on its way ...
  track.scrollLeft = 0;
  fireEvent.scroll(track);
  expect(within(card).getByText("2 of 4")).toBeTruthy();
  // ... but when the scroll ends there, the counter follows the track.
  fireEvent(track, new Event("scrollend"));
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

test("View all (uncapped) shows the same gallery", () => {
  const card = renderDoc(chat.harsoOutputWholeAnswer(gallery(6)), { caps: chat.HARSO_OUTPUT_CARD_UNCAPPED });
  expect(within(card).getByRole("region", { name: "6 photos" })).toBeTruthy();
  expect(within(card).getByText("1 of 6")).toBeTruthy();
});
