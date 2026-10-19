import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";
import { duration, readProgress, readSteps } from "./output-card-media";

// Restore spies even when a test fails part-way, so a leaked createElement spy never nests into the next test.
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Verbatim blocks from docs/agent/output-playbook.examples.json: prod-watch-reply, prod-work-running, fail-fares,
// empty-search, money-spending-month (numbers), travel-stay-areas (map), file-logo (image).
const watch: chat.HarsoOutputStatusBlock = { kind: "status", state: "watching", detail: "since 9:40 AM", subject: { routine_id: "0192a3b4-5c6d-7e8f-9a0b-000000000961" } };
const stopsAfter: chat.HarsoOutputRowsBlock = { kind: "rows", items: [{ label: "Stops after", trailing: "Fri 6 PM" }] };
const working: chat.HarsoOutputStatusBlock = { kind: "status", state: "working", detail: "112 of about 400 checked", subject: { work_unit_id: "0192a3b4-5c6d-7e8f-9a0b-000000000962" } };
const failedFares: chat.HarsoOutputStatusBlock = { kind: "status", state: "failed", detail: "The fare site didn't respond. Nothing was booked." };
const emptySearch: chat.HarsoOutputStatusBlock = { kind: "status", state: "empty", detail: "Cheapest listed now is S$588k" };
const budget: chat.HarsoOutputNumbersBlock = { kind: "numbers", items: [{ value: "S$720", label: "Left of S$5,000" }, { value: "S$4,280", label: "Spent" }] };
const tokyoMap: chat.HarsoOutputMap = { kind: "map", places: [
  { id: "ueno", label: "Ueno", lat: "35.7141", lon: "139.7774" }, { id: "asakusa", label: "Asakusa", lat: "35.7148", lon: "139.7967" },
  { id: "shinjuku", label: "Shinjuku", lat: "35.6938", lon: "139.7034" }], selected_place_id: "ueno" };
const tokyo: chat.HarsoOutputBlock = { kind: "visual", visual: tokyoMap };
const logo = { kind: "visual", visual: { kind: "image", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000a31", alt: "Crumb & Co logo: a wheat ear forming an ampersand, warm brown on cream", aspect: "square" } } as chat.HarsoOutputBlock;
const clip = { kind: "visual", visual: { kind: "video", artifact: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01", alt: "Walkthrough of the new kitchen", poster: "artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b02" } } as chat.HarsoOutputBlock;

const host: chat.HarsoOutputMediaHost = {
  resolveArtifact: artifact => `https://files.test/${artifact.slice(9)}`
};
const doc = (blocks: chat.HarsoOutputBlock[], extra: Partial<chat.HarsoOutputDocument> = {}): chat.HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, header: { title: "Card" }, blocks, fallback_text: "FALLBACK", ...extra });
const renderDoc = (document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) => {
  render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} media={host} onOpenArtifact={vi.fn()} {...props} /></div>);
  return screen.getByRole("region", { name: document.header.title });
};

// ---- status ----

test.each([
  ["working", "Working", "in_progress"], ["watching", "Watching", "in_progress"], ["scheduled", "Scheduled", "in_progress"],
  ["needs_you", "Needs you", "attention"], ["needs_attention", "Needs attention", "attention"],
  ["ready", "Done", "done"], ["stopped_by_you", "Stopped", "done"]
] as const)("status %s: the app's word in its meaning colour, the agent's detail after it", (state, word, meaning) => {
  const card = renderDoc(doc([{ kind: "status", state, detail: "since 9:40 AM" }]));
  expect(card).not.toHaveAttribute("data-fallback");
  const status = card.querySelector(".hkc-output-status")!;
  expect(status).toHaveAttribute("data-meaning", meaning);
  expect(status.querySelector(".hkc-output-status-word")!.textContent).toBe(word);
  expect(status.textContent).toBe(`${word} · since 9:40 AM`);
});

// Meaning colours are measured in the browser suite (computed colour + contrast per theme).
test("a failed status is the amber problem state with the agent's detail and no button", () => {
  const card = renderDoc(doc([failedFares]));
  const failed = card.querySelector(".hkc-output-block-failed")!;
  expect(failed).toHaveAttribute("data-meaning", "problem");
  expect(failed.textContent).toBe("The fare site didn't respond. Nothing was booked.");
  expect(within(card).queryByRole("button")).toBeNull();
});

test("status empty draws the B0 ring and the agent's nearest useful fact", () => {
  const card = renderDoc(doc([emptySearch]));
  const note = card.querySelector(".hkc-output-block-note--empty")!;
  expect(note.querySelector(".hkc-output-block-ring")).not.toBeNull();
  expect(note.textContent).toBe("Cheapest listed now is S$588k");
});

test("timed steps after a running status draw on its rail as ordered steps, not as a second rows block (G16)", () => {
  const card = renderDoc(doc([watch, stopsAfter]));
  const steps = within(card).getByRole("list", { name: "Next" });
  expect(steps.tagName).toBe("OL");
  expect(within(steps).getAllByRole("listitem").map(item => item.textContent)).toEqual(["Stops afterFri 6 PM"]);
  expect(card.querySelector(".hkc-output-card-rows")).toBeNull();
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("steps take only rows shaped as label + time after a running status; anything else stays rows", () => {
  expect(readSteps(watch, stopsAfter.items)).toEqual(stopsAfter.items);
  expect(readSteps(failedFares, stopsAfter.items)).toBeUndefined();
  expect(readSteps({ kind: "status", state: "ready" }, stopsAfter.items)).toBeUndefined();
  expect(readSteps(watch, [{ label: "Looking for", secondary: "Design lead · Singapore" }])).toBeUndefined();
  expect(readSteps(watch, [{ label: "Target", secondary: "Now S$339", trailing: "Under S$300" }])).toBeUndefined();
  // jobs-alert: the rows stay rows under the status.
  const card = renderDoc(doc([watch, { kind: "rows", items: [{ label: "Looking for", secondary: "Design lead · Singapore · S$10k+/mo" }] }]));
  expect(card.querySelector(".hkc-output-status-steps")).toBeNull();
  expect(card.querySelector(".hkc-output-card-rows")).not.toBeNull();
});

test("steps share the inline row budget; the rest are counted into View all", () => {
  const many: chat.HarsoOutputRowsBlock = { kind: "rows", items: ["Mon", "Tue", "Wed", "Thu"].map(day => ({ label: `Check ${day}`, trailing: `${day} 8:00` })) };
  const card = renderDoc(doc([watch, many]));
  expect(within(within(card).getByRole("list", { name: "Next" })).getAllByRole("listitem")).toHaveLength(3);
  expect(within(card).getByRole("button", { name: "View all 4" })).toBeVisible();
});

// K2: the status block is the agent's snapshot; the host owns the subject's live state (a routine paused later).
test("a host subject state replaces the emitted word, detail and timed steps; the steps stay as ordinary rows", () => {
  const subjectState = vi.fn(() => ({ word: "Paused" }));
  const card = renderDoc(doc([watch, stopsAfter]), { subjectState });
  expect(subjectState).toHaveBeenCalledWith(watch.subject);
  const status = card.querySelector(".hkc-output-status")!;
  expect(status.textContent).toBe("Paused");
  expect(status).not.toHaveAttribute("data-meaning");
  expect(within(card).queryByRole("list", { name: "Next" })).toBeNull();
  expect(card.querySelector(".hkc-output-card-rows")!.textContent).toBe("Stops afterFri 6 PM");
  cleanup();
  const colored = renderDoc(doc([watch]), { subjectState: () => ({ word: "Scheduled", meaning: "in_progress" }) });
  expect(colored.querySelector(".hkc-output-status")).toHaveAttribute("data-meaning", "in_progress");
  cleanup();
  // A live word with the problem meaning takes the problem drawing, as an emitted failed state does.
  const broken = renderDoc(doc([watch]), { subjectState: () => ({ word: "Couldn’t resume", meaning: "problem" }) });
  expect(broken.querySelector(".hkc-output-block-failed")!.textContent).toBe("Couldn’t resume");
});

test("a subject state of undefined, or no subject on the block, keeps the emitted status exactly as without the prop", () => {
  // useId advances per render, so the title id is the one attribute allowed to differ.
  const html = (card: HTMLElement) => card.innerHTML.replace(/_r_\w+_/g, "ID");
  const plain = html(renderDoc(doc([watch, stopsAfter, working])));
  cleanup();
  const subjectState = vi.fn(() => undefined);
  expect(html(renderDoc(doc([watch, stopsAfter, working]), { subjectState }))).toBe(plain);
  expect(subjectState).toHaveBeenCalledTimes(2);
  cleanup();
  const never = vi.fn(() => ({ word: "Paused" }));
  expect(renderDoc(doc([failedFares]), { subjectState: never }).querySelector(".hkc-output-block-failed")!.textContent).toBe(failedFares.detail);
  expect(never).not.toHaveBeenCalled();
});

// ---- progress ----

test("progress: the budget pair (money-spending-month) reads as spent of target with the remainder", () => {
  expect(readProgress(budget.items)).toMatchObject({ used: budget.items[1], rest: budget.items[0], target: "S$5,000", ratio: 0.856 });
  const card = renderDoc(doc([budget]));
  const progress = card.querySelector(".hkc-output-progress")!;
  expect(progress.querySelector(".hkc-output-progress-head")!.textContent).toBe("SpentS$4,280 of S$5,000");
  expect(progress.querySelector(".hkc-output-progress-note")!.textContent).toBe("86% used · S$720 left");
  const meter = within(card).getByRole("meter", { name: "Spent" });
  expect(meter).toHaveAttribute("aria-valuenow", "86");
  expect(meter).toHaveAttribute("aria-valuetext", "S$4,280 of S$5,000, 86%");
  expect((progress.querySelector(".hkc-output-progress-fill") as HTMLElement).style.width).toBe("85.6%");
  expect(card.querySelector(".hkc-output-card-numbers")).toBeNull();
});

test("progress needs the pair to add up to the target in one unit; otherwise the numbers stay numbers", () => {
  expect(readProgress([{ value: "S$720", label: "Left of S$5,000" }, { value: "S$4,000", label: "Spent" }])).toBeUndefined();
  expect(readProgress([{ value: "US$720", label: "Left of S$5,000" }, { value: "S$4,280", label: "Spent" }])).toBeUndefined();
  expect(readProgress([{ value: "58 bpm", label: "This week" }, { value: "61 bpm", label: "Average" }])).toBeUndefined();
  expect(readProgress([{ value: "S$1", label: "Left of S$0" }, { value: "S$-1", label: "Spent" }])).toBeUndefined();
  // The target may sit on the used item too, and a unit suffix works.
  expect(readProgress([{ value: "S$1.2m", label: "Raised of S$2m" }, { value: "S$0.8m", label: "To go" }])).toMatchObject({ ratio: 0.6, target: "S$2m" });
  const card = renderDoc(doc([{ kind: "numbers", items: [{ value: "58 bpm", label: "This week" }, { value: "61 bpm", label: "Average" }] }]));
  expect(card.querySelector(".hkc-output-card-numbers")).not.toBeNull();
  expect(card.querySelector(".hkc-output-progress")).toBeNull();
});

test("progress over target: the bar is full, amber, and the note says by how much (never a negative left)", () => {
  const over = readProgress([{ value: "−S$350", label: "Left of S$5,000" }, { value: "S$5,350", label: "Spent" }])!;
  expect(over.over).toBe("S$350");
  const card = renderDoc(doc([{ kind: "numbers", items: [{ value: "−S$350", label: "Left of S$5,000" }, { value: "S$5,350", label: "Spent" }] }]));
  expect(card.querySelector(".hkc-output-progress-note")!.textContent).toBe("107% used · over by S$350");
  expect(card.querySelector(".hkc-output-progress-fill")).toHaveAttribute("data-over", "true");
  expect(within(card).getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
});

// ---- image ----

test("image: fixed aspect frame, alt text, shimmer until it loads, then the picture", () => {
  const card = renderDoc(doc([logo]));
  const frame = card.querySelector(".hkc-output-media")!;
  expect(frame).toHaveAttribute("data-state", "loading");
  expect(frame).toHaveAttribute("aria-busy", "true");
  expect((frame as HTMLElement).style.getPropertyValue("--hkc-media-aspect")).toBe("1");
  const img = within(card).getByRole("img", { name: /Crumb & Co logo/ });
  expect(img).toHaveAttribute("src", "https://files.test/0192a3b4-5c6d-7e8f-9a0b-000000000a31");
  fireEvent.load(img);
  expect(frame).toHaveAttribute("data-state", "ready");
  expect(frame).not.toHaveAttribute("aria-busy");
});

test.each([["4:3", 4 / 3], ["16:9", 16 / 9], ["3:4", 3 / 4], [undefined, 4 / 3]] as const)("image aspect %s holds its frame", (aspect, ratio) => {
  const block = { kind: "visual", visual: { ...(logo as { visual: object }).visual, aspect } } as chat.HarsoOutputBlock;
  const card = renderDoc(doc([block]));
  expect(Number((card.querySelector(".hkc-output-media") as HTMLElement).style.getPropertyValue("--hkc-media-aspect"))).toBeCloseTo(ratio);
});

test("image that fails to load shows the amber failed state and a Try again that reloads it", () => {
  const card = renderDoc(doc([logo]));
  fireEvent.error(within(card).getByRole("img"));
  expect(card.querySelector(".hkc-output-block-failed-message")!.textContent).toBe("Couldn’t load the image");
  fireEvent.click(within(card).getByRole("button", { name: "Try again" }));
  const again = within(card).getByRole("img");
  expect(card.querySelector(".hkc-output-media")).toHaveAttribute("data-state", "loading");
  fireEvent.load(again);
  expect(card.querySelector(".hkc-output-media")).toHaveAttribute("data-state", "ready");
});

test("an image, video or map the host cannot supply falls back to text instead of an empty frame", () => {
  for (const block of [logo, clip]) {
    // The same block draws when the host lends media, so the fallback below is the missing host and nothing else.
    expect(renderDoc(doc([block]))).not.toHaveAttribute("data-fallback");
    cleanup();
    const card = renderDoc(doc([block]), { media: undefined });
    expect(card).toHaveAttribute("data-fallback", "true");
    cleanup();
  }
  const noOpen = renderDoc(doc([clip]), { onOpenArtifact: undefined });
  expect(noOpen).toHaveAttribute("data-fallback", "true");
});

// ---- video ----

test("video: a poster frame that opens the file in the host; no inline player", () => {
  const onOpen = vi.fn();
  const card = renderDoc(doc([clip]), { onOpenArtifact: onOpen });
  expect(card.querySelector("video")).toBeNull();
  const poster = within(card).getByRole("button", { name: "Open video: Walkthrough of the new kitchen" });
  expect(poster.querySelector("img")).toHaveAttribute("src", "https://files.test/0192a3b4-5c6d-7e8f-9a0b-000000000b02");
  fireEvent.click(poster);
  expect(onOpen).toHaveBeenCalledExactlyOnceWith("artifact:0192a3b4-5c6d-7e8f-9a0b-000000000b01");
});

test("video duration is read from the file's metadata and shown on the poster and in its name", async () => {
  const create = document.createElement.bind(document);
  let probe: HTMLVideoElement | undefined;
  const spy = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    const element = create(tag);
    if (tag === "video") probe = element as HTMLVideoElement;
    return element;
  }) as typeof document.createElement);
  const card = renderDoc(doc([clip]));
  spy.mockRestore();
  expect(probe!.preload).toBe("metadata");
  Object.defineProperty(probe!, "duration", { value: 95.4 });
  await act(async () => { probe!.onloadedmetadata?.(new Event("loadedmetadata")); });
  expect(card.querySelector(".hkc-output-video-length")!.textContent).toBe("1:35");
  expect(within(card).getByRole("button", { name: "Open video: Walkthrough of the new kitchen, 1:35" })).toBeVisible();
});

test.each([[0, undefined], [NaN, undefined], [59.6, "1:00"], [3725, "1:02:05"], [5, "0:05"]] as const)("duration(%s) = %s", (seconds, text) => {
  expect(duration(seconds)).toBe(text);
});

// ---- map ----

// ---- states (each block × loading/empty/partial/stale/failed) ----

const kinds = [["status", [watch, stopsAfter], ".hkc-output-status"], ["progress", [budget], ".hkc-output-progress"], ["image", [logo], ".hkc-output-media-img"],
  ["video", [clip], ".hkc-output-video"]] as const;

test.each(kinds)("%s loading: its own B0 skeleton, busy, no content", (kind, blocks, selector) => {
  const card = renderDoc(doc([...blocks]), { blockStates: { 0: { state: "loading" } } });
  const loading = card.querySelector("[data-state='loading'][aria-busy='true']")!;
  expect(loading).not.toBeNull();
  expect(card.querySelector(selector)).toBeNull();
  expect(within(card).getByText("Loading")).toHaveClass("hk-sr-only");
  if (kind === "status") expect(loading.querySelectorAll(".hkc-output-skeleton-step")).toHaveLength(3);
  if (kind === "progress") expect(loading.querySelectorAll(".hkc-output-skeleton--progress > span")).toHaveLength(3);
});

test.each(kinds)("%s empty / partial / stale / failed: B0 note under the content, or amber failure with a working Try again", (_, blocks, selector) => {
  const onRetry = vi.fn();
  const cases = [
    [{ state: "empty", message: "No steps yet" }, "No steps yet", false],
    [{ state: "partial", message: "3 of 4 updates · departure time not confirmed" }, "3 of 4 updates · departure time not confirmed", true],
    [{ state: "stale", message: "As of 09:10 · couldn’t refresh" }, "As of 09:10 · couldn’t refresh", true],
    [{ state: "failed", message: "Couldn’t update the flight", reason: "The airline didn’t respond.", onRetry }, "Couldn’t update the flight", false]
  ] as const;
  for (const [state, text, content] of cases) {
    const card = renderDoc(doc([...blocks]), { blockStates: { 0: state } });
    expect(within(card).getByText(text)).toBeVisible();
    expect(!!card.querySelector(selector)).toBe(content);
    if (state.state === "failed") {
      expect(card.querySelector(".hkc-output-block-failed-glyph")).not.toBeNull();
      fireEvent.click(within(card).getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    }
    cleanup();
  }
});

// ---- plain text and hostile content ----

test("plain text for Copy: status word and detail, the image's alt, the video's alt, the map's places", () => {
  expect(chat.harsoOutputMediaPlainText(watch)).toBe("Watching · since 9:40 AM");
  expect(chat.harsoOutputMediaPlainText(working)).toBe("Working · 112 of about 400 checked");
  expect(chat.harsoOutputMediaPlainText(logo)).toBe("Image: Crumb & Co logo: a wheat ear forming an ampersand, warm brown on cream");
  expect(chat.harsoOutputMediaPlainText(clip)).toBe("Video: Walkthrough of the new kitchen");
  expect(chat.harsoOutputMediaPlainText(tokyo)).toBe("Map: Ueno (selected), Asakusa, Shinjuku");
  expect(chat.harsoOutputMediaPlainText(budget)).toBeUndefined();
});

test("hostile text renders literally in status, steps, alt, pin labels and progress", () => {
  const markup = "<img src=x onerror=alert(1)>";
  const card = renderDoc(doc([
    { kind: "status", state: "watching", detail: markup }, { kind: "rows", items: [{ label: markup, trailing: "长长长长长长长长长长" }] },
    { kind: "numbers", items: [{ value: "S$1", label: `${markup} of S$2` }, { value: "S$1", label: "Left" }] },
    { kind: "visual", visual: { kind: "map", places: [{ id: "a", label: markup, lat: "1.3", lon: "103.8" }, { id: "b", label: "مرحبا", lat: "1.31", lon: "103.81" }] } } as chat.HarsoOutputBlock
  ]));
  expect(card.querySelectorAll("img:not(.hkc-output-map-tile)")).toHaveLength(0);
  expect(within(card).getAllByText(markup, { exact: false }).length).toBeGreaterThanOrEqual(2);
});

// ---- rework round 1 (fix base 2410dad): each load belongs to its own URL; real load failures show; maps hold every
// place; progress keeps the card's caps. Variants per class in .lane/rework-r1.md.

const id = (n: number) => `artifact:0192a3b4-5c6d-7e8f-9a0b-${String(n).padStart(12, "0")}`;
const video = (n: number, poster = true) => doc([{ kind: "visual", visual: { kind: "video", artifact: id(n), alt: `Clip ${n}`, ...(poster ? { poster: id(n + 100) } : {}) } } as chat.HarsoOutputBlock]);
const url = (artifact: string) => `https://files.test/${artifact.slice(9)}`;
/** Renders with a spy on the metadata probes the video view creates (one per file and attempt). */
function renderVideo(document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) {
  const create = window.document.createElement.bind(window.document), probes: HTMLVideoElement[] = [];
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(window.document, "createElement").mockImplementation(((tag: string) => { const element = create(tag); if (tag === "video") probes.push(element as HTMLVideoElement); return element; }) as typeof window.document.createElement);
  const view = render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} media={host} onOpenArtifact={vi.fn()} {...props} /></div>);
  const rerender = (next: chat.HarsoOutputDocument) => view.rerender(<div className="harso-kit"><chat.HarsoOutputCard document={next} onViewAll={() => {}} media={host} onOpenArtifact={vi.fn()} {...props} /></div>);
  const metadata = async (probe: HTMLVideoElement, seconds: number) => { Object.defineProperty(probe, "duration", { value: seconds, configurable: true }); await act(async () => { probe.onloadedmetadata?.(new Event("loadedmetadata")); }); };
  return { view, probes, rerender, metadata };
}

test("F1 video: a new file shows no length until its own metadata arrives; the old file's late metadata is dropped", async () => {
  const { probes, rerender, metadata } = renderVideo(video(1));
  await metadata(probes[0], 95);
  expect(screen.getByRole("button", { name: "Open video: Clip 1, 1:35" })).toBeVisible();
  rerender(video(2));
  expect(screen.getByRole("button", { name: "Open video: Clip 2" })).toBeVisible();
  expect(document.querySelector(".hkc-output-video-length")).toBeNull();
  await metadata(probes[0], 30);
  expect(screen.getByRole("button", { name: "Open video: Clip 2" })).toBeVisible();
  await metadata(probes.at(-1)!, 62);
  expect(screen.getByRole("button", { name: "Open video: Clip 2, 1:02" })).toBeVisible();
  vi.restoreAllMocks();
});

test("F1 video: a failed poster does not keep the next file's poster from drawing", () => {
  const { view, rerender } = renderVideo(video(1));
  fireEvent.error(view.container.querySelector(".hkc-output-video img")!);
  expect(view.container.querySelector(".hkc-output-block-failed")).not.toBeNull();
  rerender(video(2));
  expect(view.container.querySelector(".hkc-output-video img")).toHaveAttribute("src", url(id(102)));
  expect(view.container.querySelector(".hkc-output-block-failed")).toBeNull();
  vi.restoreAllMocks();
});

test("F1 image (control): a replaced picture starts loading again rather than inheriting ready", () => {
  const image = (n: number) => doc([{ kind: "visual", visual: { kind: "image", artifact: id(n), alt: `Image ${n}` } } as chat.HarsoOutputBlock]);
  const view = render(<chat.HarsoOutputCard document={image(1)} onViewAll={() => {}} media={host} />);
  fireEvent.load(screen.getByRole("img"));
  expect(view.container.querySelector(".hkc-output-media")).toHaveAttribute("data-state", "ready");
  view.rerender(<chat.HarsoOutputCard document={image(2)} onViewAll={() => {}} media={host} />);
  expect(view.container.querySelector(".hkc-output-media")).toHaveAttribute("data-state", "loading");
});

test("F2 video: a failed preview says so, with Try again and a separate Open video that still opens the file", () => {
  const onOpen = vi.fn();
  const { view, probes } = renderVideo(video(1), { onOpenArtifact: onOpen });
  fireEvent.error(view.container.querySelector(".hkc-output-video img")!);
  act(() => { probes[0].onerror?.(new Event("error")); });
  expect(view.container.querySelector(".hkc-output-block-failed-message")!.textContent).toBe("Couldn’t load the video preview");
  fireEvent.click(screen.getByRole("button", { name: "Open video" }));
  expect(onOpen).toHaveBeenCalledExactlyOnceWith(id(1));
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  const poster = view.container.querySelector(".hkc-output-video img")!;
  expect(view.container.querySelector(".hkc-output-video")).toHaveAttribute("data-state", "loading");
  expect(probes.length).toBe(2);
  fireEvent.load(poster);
  expect(view.container.querySelector(".hkc-output-video")).toHaveAttribute("data-state", "ready");
  vi.restoreAllMocks();
});

test("F2 video: with no poster, a file that doesn't load is failed; metadata failing under a good poster only drops the length", () => {
  const bare = renderVideo(video(1, false));
  expect(bare.view.container.querySelector(".hkc-output-video")).toHaveAttribute("data-state", "loading");
  act(() => { bare.probes[0].onerror?.(new Event("error")); });
  expect(bare.view.container.querySelector(".hkc-output-block-failed-message")!.textContent).toBe("Couldn’t load the video");
  cleanup(); vi.restoreAllMocks();
  const posterOk = renderVideo(video(1));
  fireEvent.load(posterOk.view.container.querySelector(".hkc-output-video img")!);
  act(() => { posterOk.probes[0].onerror?.(new Event("error")); });
  expect(screen.getByRole("button", { name: "Open video: Clip 1" })).toHaveAttribute("data-state", "ready");
  vi.restoreAllMocks();
});

test.each([[0, 0, "View all 2"], [1, 1, "View all 2"], [2, 0, null]] as const)("F4 progress under maxNumbers=%s: the bar only when both numbers fit the cap, else %s number(s)", (max, numbers, more) => {
  const card = renderDoc(doc([budget]), { caps: { maxNumbers: max } });
  expect(!!within(card).queryByRole("meter")).toBe(max >= 2);
  expect(card.querySelectorAll(".hkc-output-card-number")).toHaveLength(numbers);
  if (more) expect(within(card).getByRole("button", { name: more })).toBeVisible();
  else expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test.each(["loading", "empty", "failed"] as const)("F4 progress %s shows no data, so it counts nothing toward View all", state => {
  const card = renderDoc(doc([budget]), { blockStates: { 0: { state, message: "Probe" } } });
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test.each(["partial", "stale"] as const)("F4 progress %s draws both numbers, so nothing is hidden (control)", state => {
  const card = renderDoc(doc([budget]), { blockStates: { 0: { state, message: "Probe" } } });
  expect(within(card).getByRole("meter")).toBeVisible();
  expect(within(card).queryByRole("button", { name: /View all/ })).toBeNull();
});

test("F4 a loading bar spends none of the cap: the numbers after it still draw", () => {
  const card = renderDoc(doc([budget, { kind: "numbers", items: [{ value: "12", label: "Days left" }, { value: "S$60", label: "A day" }] }]), { blockStates: { 0: { state: "loading" } } });
  expect([...card.querySelectorAll(".hkc-output-card-number-value")].map(node => node.textContent)).toEqual(["12", "S$60"]);
  cleanup();
  const ready = renderDoc(doc([budget, { kind: "numbers", items: [{ value: "12", label: "Days left" }] }]));
  expect(ready.querySelectorAll(".hkc-output-card-number")).toHaveLength(0);
  expect(within(ready).getByRole("button", { name: "View all 3" })).toBeVisible();
});

