"use client";

import { CaretLeft, CaretRight, Info, Play, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Button, IconButton } from "../primitives";
import "./output-card-media.css";

/*
 * Packet 5c: status, progress, image, video poster and map blocks for the inline output card, drawn from the
 * published B0 v4 masters (`v4/macOS/<theme>/{status,progress,image,map}/<state>`). Local copy of the output-blocks.v1
 * subset these read. Where B0 draws more than the contract carries (status steps G16, progress target G9/G12), the
 * block is read by the shape the playbook tells the agent to send; nothing is invented.
 */

export type HarsoOutputStatusState = "working" | "needs_you" | "ready" | "needs_attention" | "stopped_by_you" | "failed" | "watching" | "scheduled" | "empty";
export type HarsoOutputStatusSubject = { work_unit_id: string } | { routine_id: string };
export interface HarsoOutputStatusBlock {
  kind: "status";
  state: HarsoOutputStatusState;
  detail?: string;
  subject?: HarsoOutputStatusSubject;
}
/** The host's live word for a status block's subject (a paused routine), drawn instead of the emitted snapshot. */
export interface HarsoOutputSubjectState { word: string; meaning?: HarsoOutputMeaning }
export interface HarsoOutputPlace { id: string; label: string; lat: string; lon: string }
export interface HarsoOutputMap { kind: "map"; places: HarsoOutputPlace[]; selected_place_id?: string }
/** One photo: a row's thumbnail, or one photo of a gallery. */
export interface HarsoOutputPhoto { artifact: string; alt: string }
/** `images` (2..10) makes the image a gallery; `artifact`/`alt` stay photo 1 for readers that show one. */
export interface HarsoOutputImage { kind: "image"; artifact: string; alt: string; aspect?: "square" | "4:3" | "16:9" | "3:4"; images?: HarsoOutputPhoto[] }
export interface HarsoOutputVideo { kind: "video"; artifact: string; alt: string; poster?: string }
export type HarsoOutputMedia = HarsoOutputMap | HarsoOutputImage | HarsoOutputVideo;

/**
 * What the host lends the card to draw media. The kit never fetches on its own: artifact URIs and map tiles come
 * from the host, and a control appears only when the host can act on it.
 */
export interface HarsoOutputMediaHost {
  /** An `artifact:` URI to a URL the host serves (image, video, poster); undefined when it has none. */
  resolveArtifact?: (artifact: string) => string | undefined;
  /** OpenStreetMap raster tile URL for zoom/x/y. Without it a map block falls back to text: pins on nothing is not a map. */
  mapTile?: (z: number, x: number, y: number) => string;
}

type AnyBlock = { kind: string };
type Row = { label: string; secondary?: string; trailing?: string; mark?: string; status?: string; thumbnail?: unknown };
type Number_ = { value: string; label: string };

// ---- status ----

/** The four meanings the app colours (playbook States); the agent never picks a colour. */
export type HarsoOutputMeaning = "done" | "in_progress" | "attention" | "problem";
const STATUS: Record<HarsoOutputStatusState, { word: string; meaning?: HarsoOutputMeaning }> = {
  working: { word: "Working", meaning: "in_progress" },
  watching: { word: "Watching", meaning: "in_progress" },
  scheduled: { word: "Scheduled", meaning: "in_progress" },
  needs_you: { word: "Needs you", meaning: "attention" },
  needs_attention: { word: "Needs attention", meaning: "attention" },
  ready: { word: "Done", meaning: "done" },
  stopped_by_you: { word: "Stopped", meaning: "done" },
  failed: { word: "Couldn’t finish", meaning: "problem" },
  empty: { word: "Nothing found" }
};
const RUNNING = new Set<HarsoOutputStatusState>(["working", "watching", "scheduled"]);

export function readStatus(block: AnyBlock): HarsoOutputStatusBlock | undefined {
  if (block.kind !== "status") return undefined;
  const status = block as Partial<HarsoOutputStatusBlock>;
  return typeof status.state === "string" && Object.hasOwn(STATUS, status.state) ? status as HarsoOutputStatusBlock : undefined;
}

/**
 * Timed steps beside a running status (G16: the playbook sends them as rows right after it, "Stops after · Fri 6 PM").
 * Only rows that are a label and a time, nothing else, and only after working/watching/scheduled: they are what comes
 * next. Anything else stays an ordinary rows block.
 */
export function readSteps<T extends Row>(status: HarsoOutputStatusBlock | undefined, items: T[]): T[] | undefined {
  if (!status || !RUNNING.has(status.state) || !items.length) return undefined;
  return items.every(row => row.label?.trim() && row.trailing?.trim() && !row.secondary && row.mark == null && row.status == null && row.thumbnail == null) ? items : undefined;
}

export function HarsoOutputStatusView({ status, steps, live }: { status: HarsoOutputStatusBlock; steps?: Row[]; live?: HarsoOutputSubjectState }) {
  const { word, meaning } = live ?? STATUS[status.state];
  // The emitted detail describes the emitted state ("since 26 Sep", "rings at 19:42"), so a live word drops it.
  const detail = live ? undefined : status.detail;
  if (!live && status.state === "empty") return <p className="hkc-output-block-note hkc-output-block-note--empty" data-state="empty">
    <span className="hkc-output-block-ring" aria-hidden="true" />{detail || word}
  </p>;
  if (meaning === "problem") return <div className="hkc-output-block-failed" data-meaning="problem">
    <WarningCircle className="hkc-output-block-failed-glyph" size={16} weight="bold" aria-hidden="true" />
    <div className="hkc-output-block-failed-text"><p className="hkc-output-block-failed-message">{detail || word}</p></div>
  </div>;
  return <div className="hkc-output-status" data-meaning={meaning}>
    <p className="hkc-output-status-line">
      <span className="hkc-output-status-dot" aria-hidden="true" />
      <span className="hkc-output-status-word">{word}</span>
      {detail && <span className="hkc-output-status-detail"> · {detail}</span>}
    </p>
    {steps && <ol className="hkc-output-status-steps" aria-label="Next">
      {steps.map((step, index) => <li key={index} className="hkc-output-status-step">
        <span className="hkc-output-status-ring" aria-hidden="true" />
        <span className="hkc-output-status-step-label">{step.label}</span>
        <span className="hkc-output-status-step-time">{step.trailing}</span>
      </li>)}
    </ol>}
  </div>;
}

// ---- progress ----

const MONEY = /^([−-])?([A-Z]{0,3}\$|[€£¥₹])?(\d{1,3}(?:,\d{3})*|\d+)(\.\d{1,2})?(k|m)?$/;
function amount(text: string) {
  const match = MONEY.exec(text.trim());
  if (!match) return undefined;
  const value = Number((match[3] + (match[4] ?? "")).replace(/,/g, ""));
  return { value: match[1] ? -value : value, unit: `${match[2] ?? ""}|${match[5] ?? ""}`, prefix: match[2] ?? "", suffix: match[5] ?? "" };
}
const REMAINDER = /^(left|remaining|to go)\b/i;

export interface HarsoOutputProgress { used: Number_; rest: Number_; target: string; ratio: number; over?: string }

/**
 * Progress against a target (G9: the playbook sends the target in a number label, "Left of S$5,000"). Two numbers:
 * one labelled "<word> of <target>", and the pair adds up to that target in the same unit. Otherwise undefined and the
 * numbers draw as numbers. The bar fills with the item that is not the remainder.
 */
export function readProgress(items: Number_[]): HarsoOutputProgress | undefined {
  if (items.length !== 2) return undefined;
  for (const [index, item] of items.entries()) {
    const match = /^(.+?)\s+of\s+(\S+)$/.exec(item.label.trim());
    const target = match && amount(match[2]), mine = amount(item.value), other = amount(items[1 - index].value);
    if (!target || !mine || !other || target.value <= 0 || mine.unit !== target.unit || other.unit !== target.unit) continue;
    if (Math.abs(mine.value + other.value - target.value) > 1e-6 * target.value) continue;
    const remainderFirst = REMAINDER.test(item.label.trim());
    const used = remainderFirst ? items[1 - index] : item, rest = remainderFirst ? item : items[1 - index];
    const usedValue = (remainderFirst ? other : mine).value, restValue = (remainderFirst ? mine : other).value;
    if (usedValue < 0) return undefined;
    const format = (value: number) => `${target.prefix}${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}${target.suffix}`;
    return { used, rest, target: match![2], ratio: usedValue / target.value, over: restValue < 0 ? format(restValue) : undefined };
  }
  return undefined;
}

/** B0 progress: "<used label> · <used> of <target>", a 6px track, then "86% used · S$720 left" (or "Over by S$350"). */
export function HarsoOutputProgressView({ progress }: { progress: HarsoOutputProgress }) {
  const percent = Math.round(progress.ratio * 100);
  // Drop only the " of <target>" the agent wrote to carry the target (G9); "Spent of budget" is the agent's own words.
  const plain = (label: string) => { const text = label.trim(), tail = ` of ${progress.target}`; return text.endsWith(tail) ? text.slice(0, -tail.length).trimEnd() : text; };
  const usedWord = plain(progress.used.label), restWord = plain(progress.rest.label).toLowerCase();
  const note = progress.over ? `${percent}% used · over by ${progress.over}` : `${percent}% used · ${progress.rest.value} ${restWord}`;
  return <div className="hkc-output-progress">
    <p className="hkc-output-progress-head">
      <span className="hkc-output-progress-label">{usedWord}</span>
      <span className="hkc-output-progress-value">{progress.used.value} of {progress.target}</span>
    </p>
    <div className="hkc-output-progress-track" role="meter" aria-label={usedWord} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.min(100, percent)} aria-valuetext={`${progress.used.value} of ${progress.target}, ${percent}%`}>
      <span className="hkc-output-progress-fill" data-over={progress.over ? "true" : undefined} style={{ width: `${Math.min(100, progress.ratio * 100)}%` }} />
    </div>
    <p className="hkc-output-progress-note">{note}</p>
  </div>;
}

// ---- media ----

export const ARTIFACT = /^artifact:[0-9a-f-]{36}$/;
/** A photo the card may draw (a row thumbnail, a gallery photo): a well-formed artifact and an alt. */
export const isPhoto = (photo: unknown): photo is HarsoOutputPhoto => !!photo && typeof photo === "object"
  && ARTIFACT.test((photo as HarsoOutputPhoto).artifact ?? "") && typeof (photo as HarsoOutputPhoto).alt === "string";
/**
 * The image, video or map this card can draw, or undefined (the card then falls back to text). A video needs
 * `canOpen` (the card's `onOpenArtifact`): its poster is only a way to open the file. An image's `images` stay only
 * when they are a well-formed gallery (2..10 photos); otherwise it draws as the one photo old readers show.
 */
export function readMedia(block: AnyBlock, host: HarsoOutputMediaHost, canOpen = false): HarsoOutputMedia | undefined {
  if (block.kind !== "visual") return undefined;
  const visual = (block as { visual?: { kind?: string } }).visual as HarsoOutputMedia | undefined;
  if (!visual) return undefined;
  if (visual.kind === "image" || visual.kind === "video") {
    // No way to show the file (or, for a video, to open it) without the host: fall back rather than draw a dead frame.
    const ok = ARTIFACT.test(visual.artifact ?? "") && typeof visual.alt === "string" && !!host.resolveArtifact?.(visual.artifact)
      && (visual.kind === "image" || canOpen);
    if (!ok) return undefined;
    if (visual.kind !== "image" || visual.images === undefined) return visual;
    const { images, ...one } = visual;
    return Array.isArray(images) && images.length >= 2 && images.length <= 10 && images.every(isPhoto)
      && images[0].artifact === visual.artifact && images[0].alt === visual.alt ? visual : one;
  }
  if (visual.kind === "map") {
    if (!host.mapTile) return undefined;
    const places = Array.isArray(visual.places) ? visual.places : [];
    const ok = places.length > 0 && places.every(place => place && typeof place.label === "string" && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon)) && Math.abs(Number(place.lat)) <= 85);
    return ok ? visual : undefined;
  }
  return undefined;
}

const ASPECT = { square: 1, "4:3": 4 / 3, "16:9": 16 / 9, "3:4": 3 / 4 } as const;

type Phase = "loading" | "ready" | "failed";
/**
 * What the browser made of each URL this block loads (picture, poster, video file, map tile), keyed by the URL and
 * the Try again attempt. A new URL starts at loading; nothing one URL did carries over to another. Elements carry
 * `key={loads.key(url)}` so a replaced source is a new element whose late events cannot land on the next one.
 */
function useLoads() {
  const [attempt, setAttempt] = useState(0);
  const [phases, setPhases] = useState<Readonly<Record<string, Phase>>>({});
  const key = (url: string) => `${attempt} ${url}`;
  return {
    attempt, key,
    phase: (url: string): Phase => phases[key(url)] ?? "loading",
    settle: (url: string, phase: Phase) => { const at = key(url); setPhases(all => all[at] === phase ? all : { ...all, [at]: phase }); },
    retry: () => { setAttempt(value => value + 1); setPhases({}); }
  };
}
type Loads = ReturnType<typeof useLoads>;

/** An `<img data-load>` already decoded (or failed) before React attached its listeners never fires again: read it. */
function useSettleComplete(root: RefObject<HTMLElement | null>, loads: Loads) {
  useLayoutEffect(() => {
    root.current?.querySelectorAll<HTMLImageElement>("img[data-load]").forEach(img => {
      const url = img.dataset.load!;
      if (img.complete && loads.phase(url) === "loading") loads.settle(url, img.naturalWidth > 0 ? "ready" : "failed");
    });
  });
}

/** B0 failed frame for a load the card itself made: amber glyph, what failed, the item, Try again (+ another action). */
function MediaFailed({ message, reason, onRetry, children }: { message: string; reason: string; onRetry: () => void; children?: ReactNode }) {
  return <div className="hkc-output-block-failed" data-state="failed">
    <WarningCircle className="hkc-output-block-failed-glyph" size={16} weight="bold" aria-hidden="true" />
    <div className="hkc-output-block-failed-text">
      <p className="hkc-output-block-failed-message">{message}</p>
      <p className="hkc-output-block-failed-reason">{reason}</p>
      <div className="hkc-output-media-actions">
        <Button variant="quiet" className="hkc-output-block-retry" onClick={onRetry}>Try again</Button>
        {children}
      </div>
    </div>
  </div>;
}

function useWidth(fallback: number) {
  const node = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = () => { if (element.clientWidth > 0) setWidth(Math.round(element.clientWidth)); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  return [node, width] as const;
}

/** Fixed aspect frame; a shimmer until the picture arrives; a failed state with a working Try again if it doesn't. */
export function HarsoOutputImageView({ image, host }: { image: HarsoOutputImage; host: HarsoOutputMediaHost }) {
  const src = host.resolveArtifact?.(image.artifact) ?? "";
  const loads = useLoads();
  const frame = useRef<HTMLDivElement>(null);
  useSettleComplete(frame, loads);
  const phase = loads.phase(src);
  if (phase === "failed") return <MediaFailed message="Couldn’t load the image" reason={image.alt} onRetry={loads.retry} />;
  const aspect = ASPECT[image.aspect ?? "4:3"] ?? ASPECT["4:3"];
  return <div ref={frame} className="hkc-output-media" data-state={phase} aria-busy={phase === "loading" || undefined}
    style={{ "--hkc-media-aspect": aspect } as CSSProperties}>
    <img key={loads.key(src)} data-load={src} className="hkc-output-media-img" src={src} alt={image.alt} decoding="async" draggable={false}
      onLoad={() => loads.settle(src, "ready")} onError={() => loads.settle(src, "failed")} />
  </div>;
}

const reducedMotion = (node: Element | null) => !!node?.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * One photo in a fixed box: the tinted box holds the space while it loads, the photo fades in, and a photo that does
 * not arrive (or that the host cannot resolve) leaves the quiet tile, named by its alt. Never a broken-image glyph.
 * `load` false keeps the tile without fetching (a gallery photo not yet near the one shown).
 */
function PhotoTile({ photo, host, className, load = true }: { photo: HarsoOutputPhoto; host: HarsoOutputMediaHost; className: string; load?: boolean }) {
  const src = load ? host.resolveArtifact?.(photo.artifact) : undefined;
  const loads = useLoads();
  const tile = useRef<HTMLSpanElement>(null);
  useSettleComplete(tile, loads);
  const phase = src ? loads.phase(src) : "failed";
  return <span ref={tile} className={className} data-state={load ? phase : "idle"}>
    {src && phase !== "failed"
      ? <img key={loads.key(src)} data-load={src} className="hkc-output-photo-img" src={src} alt={photo.alt} decoding="async" draggable={false}
        onLoad={() => loads.settle(src, "ready")} onError={() => loads.settle(src, "failed")} />
      : <span className="hkc-output-photo-empty" role="img" aria-label={photo.alt} />}
  </span>;
}

/** A row's square photo, leading the row (sized in CSS to the row's two lines). */
export function HarsoOutputThumb({ photo, host }: { photo: HarsoOutputPhoto; host: HarsoOutputMediaHost }) {
  return <PhotoTile photo={photo} host={host} className="hkc-output-thumb" />;
}

/**
 * A gallery in the single image's frame: swipe or trackpad-scroll with snap, prev/next on hover or focus, arrow keys
 * on the focused gallery, and a quiet "1 of 8". Only the photo shown and its neighbours load (and stay once loaded).
 * A photo that fails is the quiet tile; the others still browse.
 */
export function HarsoOutputGalleryView({ image, host }: { image: HarsoOutputImage & { images: HarsoOutputPhoto[] }; host: HarsoOutputMediaHost }) {
  const photos = image.images, count = photos.length;
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0, 1]));
  const track = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLButtonElement>(null), next = useRef<HTMLButtonElement>(null);
  // A button the edge removes hands focus to the other one, so the keyboard never drops to the page.
  const handoff = useRef<"prev" | "next" | undefined>(undefined);
  // While a button or key scrolls the track, the scroll position is on its way: the counter keeps the target.
  const target = useRef<number | undefined>(undefined);
  const show = (to: number) => {
    const at = Math.max(0, Math.min(count - 1, to));
    setIndex(at);
    setSeen(all => all.has(at - 1) && all.has(at) && all.has(at + 1) ? all : new Set([...all, at - 1, at, at + 1]));
    const element = track.current;
    if (!element || !element.clientWidth) return;
    target.current = at;
    const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === "rtl";
    element.scrollTo({ left: (rtl ? -1 : 1) * at * element.clientWidth, behavior: reducedMotion(element) ? "auto" : "smooth" });
  };
  const settle = (end: boolean) => {
    const element = track.current;
    if (!element?.clientWidth) return;
    const at = Math.round(Math.abs(element.scrollLeft) / element.clientWidth);
    // A swipe during a button's scroll ends somewhere else: the end of any scroll hands the counter back to the track.
    if (target.current !== undefined && !end && at !== target.current) return;
    target.current = undefined;
    if (at !== index) show(at);
  };
  const step = (by: number, from: "prev" | "next") => {
    const at = index + by;
    if (at <= 0 && from === "prev") handoff.current = "next";
    if (at >= count - 1 && from === "next") handoff.current = "prev";
    show(at);
  };
  useEffect(() => {
    const to = handoff.current;
    handoff.current = undefined;
    (to === "next" ? next : to === "prev" ? prev : undefined)?.current?.focus();
  }, [index]);
  const aspect = ASPECT[image.aspect ?? "4:3"] ?? ASPECT["4:3"];
  return <div className="hkc-output-media hkc-output-gallery" role="region" aria-roledescription="gallery" aria-label={`${count} photos`}
    style={{ "--hkc-media-aspect": aspect } as CSSProperties}>
    <div ref={track} className="hkc-output-gallery-track" tabIndex={0} aria-label="Photos. Left and right arrows move between them."
      onScroll={() => settle(false)} onScrollEnd={() => settle(true)}
      onKeyDown={event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        const rtl = event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget).direction === "rtl";
        const forward = (event.key === "ArrowRight") !== rtl;
        show(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : index + (forward ? 1 : -1));
      }}>
      {photos.map((photo, at) => <div key={at} className="hkc-output-gallery-slide" role="group" aria-roledescription="photo"
        aria-label={`${at + 1} of ${count}`} aria-hidden={at !== index || undefined}>
        <PhotoTile photo={photo} host={host} className="hkc-output-gallery-photo" load={seen.has(at)} />
      </div>)}
    </div>
    {index > 0 && <IconButton ref={prev} label="Previous photo" className="hkc-output-gallery-nav" data-side="start" onClick={() => step(-1, "prev")}>
      <CaretLeft weight="bold" />
    </IconButton>}
    {index < count - 1 && <IconButton ref={next} label="Next photo" className="hkc-output-gallery-nav" data-side="end" onClick={() => step(1, "next")}>
      <CaretRight weight="bold" />
    </IconButton>}
    <span className="hkc-output-gallery-count" aria-live="polite">{index + 1} of {count}</span>
  </div>;
}

/** m:ss or h:mm:ss. */
export function duration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  const whole = Math.round(seconds), h = Math.floor(whole / 3600), m = Math.floor(whole % 3600 / 60), s = whole % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** A poster frame with its duration that opens the file in the host; never an inline player. */
export function HarsoOutputVideoView({ video, host, onOpen }: { video: HarsoOutputVideo; host: HarsoOutputMediaHost; onOpen: (artifact: string) => void }) {
  const loads = useLoads();
  const frame = useRef<HTMLButtonElement>(null);
  useSettleComplete(frame, loads);
  const src = host.resolveArtifact?.(video.artifact) ?? "";
  const poster = video.poster ? host.resolveArtifact?.(video.poster) : undefined;
  // The length belongs to the file it was read from: another file shows none until its own metadata arrives.
  const [length, setLength] = useState<{ src: string; text?: string }>();
  const { attempt, settle } = loads;
  const fileKey = `file ${src}`;
  useEffect(() => {
    // Read only the file's metadata for its length; nothing plays and nothing is attached to the page.
    if (!src || typeof document === "undefined") return;
    const probe = document.createElement("video");
    let live = true;
    probe.preload = "metadata";
    probe.muted = true;
    probe.onloadedmetadata = () => { if (!live) return; setLength({ src, text: duration(probe.duration) }); settle(fileKey, "ready"); };
    probe.onerror = () => { if (live) settle(fileKey, "failed"); };
    probe.src = src;
    return () => { live = false; probe.onloadedmetadata = probe.onerror = null; probe.removeAttribute("src"); probe.load?.(); };
    // `settle` is keyed to this attempt; a Try again (new attempt) reads the file again.
  }, [src, attempt]);
  const time = length?.src === src ? length.text : undefined;
  const file = loads.phase(fileKey), picture = poster ? loads.phase(poster) : undefined;
  const open = () => onOpen(video.artifact);
  // Nothing to show in the frame: the poster failed, or there is no poster and the file itself didn't load. Opening
  // the file stays available beside Try again (the host's viewer may still reach it).
  if (picture === "failed" || (!poster && file === "failed")) return <MediaFailed
    message={picture === "failed" ? "Couldn’t load the video preview" : "Couldn’t load the video"} reason={video.alt} onRetry={loads.retry}>
    <Button variant="quiet" className="hkc-output-block-retry" onClick={open}>Open video</Button>
  </MediaFailed>;
  const phase = (picture ?? file) === "loading" ? "loading" : "ready";
  return <button ref={frame} type="button" className="hkc-output-media hkc-output-video" data-state={phase} aria-busy={phase === "loading" || undefined}
    style={{ "--hkc-media-aspect": ASPECT["16:9"] } as CSSProperties} aria-label={`Open video: ${video.alt}${time ? `, ${time}` : ""}`} onClick={open}>
    {poster && <img key={loads.key(poster)} data-load={poster} className="hkc-output-media-img" src={poster} alt="" draggable={false}
      onLoad={() => loads.settle(poster, "ready")} onError={() => loads.settle(poster, "failed")} />}
    <span className="hkc-output-video-play" aria-hidden="true"><Play size={18} weight="fill" /></span>
    {time && <span className="hkc-output-video-length" aria-hidden="true">{time}</span>}
  </button>;
}

// ---- map ----

const TILE = 256, PAD = 36, PIN_ROOM = 10, MAX_ZOOM = 15;
const project = (lat: number, lon: number, zoom: number) => {
  const size = TILE * 2 ** zoom, sin = Math.sin(lat * Math.PI / 180);
  return { x: (lon + 180) / 360 * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
};

/**
 * Longitudes moved into one run without the widest empty stretch of the globe inside it, so places either side of the
 * dateline (179.9 and -179.9) sit together rather than a world apart. Tiles wrap, so a longitude past 180 still draws.
 */
function unwrap(lons: number[]) {
  const sorted = [...lons].sort((a, b) => a - b);
  // The empty stretch across the dateline, then each gap between neighbours; the widest one is left outside the run.
  let gap = sorted[0] + 360 - sorted[sorted.length - 1], cut: number | undefined;
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index] - sorted[index - 1] > gap) { gap = sorted[index] - sorted[index - 1]; cut = sorted[index]; }
  }
  return cut === undefined ? lons : lons.map(lon => lon < cut ? lon + 360 : lon);
}

/**
 * The highest zoom at which every place fits inside the frame with room for its pin (down to the whole world).
 * `fits` is false when even the whole world can't hold them all inside this frame: the card then says so rather than
 * clip a place off the plane.
 */
export function frameMap(places: HarsoOutputPlace[], width: number, height: number) {
  const lats = places.slice(0, 12).map(place => Number(place.lat)), lons = unwrap(places.slice(0, 12).map(place => Number(place.lon)));
  const at = (zoom: number) => lats.map((lat, index) => project(lat, lons[index], zoom));
  const span = (xy: { x: number; y: number }[], axis: "x" | "y") => Math.max(...xy.map(p => p[axis])) - Math.min(...xy.map(p => p[axis]));
  const within = (zoom: number, pad: number) => { const xy = at(zoom); return span(xy, "x") <= width - 2 * pad && span(xy, "y") <= height - 2 * pad; };
  let zoom = MAX_ZOOM;
  while (zoom > 0 && !within(zoom, PAD)) zoom--;
  const fits = within(zoom, PAD) || within(zoom, PIN_ROOM);
  const xy = at(zoom);
  const cx = (Math.max(...xy.map(p => p.x)) + Math.min(...xy.map(p => p.x))) / 2, cy = (Math.max(...xy.map(p => p.y)) + Math.min(...xy.map(p => p.y))) / 2;
  const left = cx - width / 2, top = cy - height / 2;
  return { zoom, left, top, fits, pins: xy.map(p => ({ x: p.x - left, y: p.y - top })) };
}

const LABEL = 12;
let measurer: CanvasRenderingContext2D | null | undefined;
/** Capsule width for a pin label: the text measured in the kit font when a canvas exists, else an estimate, plus padding. */
function labelWidth(text: string, strong: boolean) {
  if (measurer === undefined) {
    try { measurer = typeof document === "undefined" || /jsdom/i.test(navigator.userAgent) ? null : document.createElement("canvas").getContext("2d"); } catch { measurer = null; }
  }
  if (measurer) {
    measurer.font = `${strong ? 500 : 400} ${LABEL}px "Instrument Sans Variable", sans-serif`;
    return Math.ceil(measurer.measureText(text).width) + 16;
  }
  return Math.ceil(Array.from(text).reduce((width, char) => width + LABEL * (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff00-\uff60]|\p{Extended_Pictographic}/u.test(char) ? 1 : .6), 0)) + 14;
}

/** A still map: OSM tiles when the host lends them, ≤12 pins, the pick larger and labelled first, attribution kept. */
export function HarsoOutputMapView({ map, host }: { map: HarsoOutputMap; host: HarsoOutputMediaHost }) {
  const [node, width] = useWidth(480);
  const loads = useLoads();
  useSettleComplete(node, loads);
  // Labels are measured in the web font: lay them out again once it has loaded.
  const [, setFonts] = useState(0);
  useEffect(() => {
    let live = true;
    globalThis.document?.fonts?.ready.then(() => { if (live) setFonts(value => value + 1); });
    return () => { live = false; };
  }, []);
  // B0: 260 at the 480 pane; never under the 160 compact map, so a narrow pane still reads as a map.
  const height = Math.max(160, Math.round(width * 13 / 24));
  const places = map.places.slice(0, 12);
  const frame = frameMap(places, width, height);
  const selected = places.findIndex(place => place.id === map.selected_place_id);
  const named = (place: HarsoOutputPlace, index: number) => `${place.label}${index === selected ? " (selected)" : ""}`;
  // Places no single still map can hold at this size (far north and far south together): say so and list them.
  if (!frame.fits) return <figure ref={node} className="hkc-output-map" aria-label="Map" data-state="unframed">
    <p className="hkc-output-block-note"><Info size={14} weight="bold" aria-hidden="true" />Too far apart to show on one map</p>
    <ul className="hkc-output-map-places">{places.map((place, index) => <li key={index}>{named(place, index)}</li>)}</ul>
  </figure>;
  const tiles: { key: string; src: string; x: number; y: number }[] = [];
  {
    const count = 2 ** frame.zoom;
    for (let ty = Math.floor(frame.top / TILE); ty <= Math.floor((frame.top + height) / TILE); ty++) {
      if (ty < 0 || ty >= count) continue;
      for (let tx = Math.floor(frame.left / TILE); tx <= Math.floor((frame.left + width) / TILE); tx++) {
        tiles.push({ key: `${tx}/${ty}`, src: host.mapTile!(frame.zoom, ((tx % count) + count) % count, ty), x: tx * TILE - frame.left, y: ty * TILE - frame.top });
      }
    }
  }
  // The plane is only as true as its tiles: loading until the first arrives (a resize that adds edge tiles never blanks
  // the ones already drawn), a note as soon as any tile is known to have failed (even while siblings are still loading),
  // and failed only once every tile has settled and none arrived.
  const phases = tiles.map(tile => loads.phase(tile.src));
  const failedTiles = phases.filter(phase => phase === "failed").length;
  const pending = phases.includes("loading"), drawn = phases.includes("ready");
  const phase = failedTiles && failedTiles === tiles.length ? "failed"
    : failedTiles ? "partial"
    : pending && !drawn ? "loading" : "ready";
  if (phase === "failed") return <figure ref={node} className="hkc-output-map" aria-label="Map">
    <MediaFailed message="Couldn’t load the map" reason={places.map(named).join(", ")} onRetry={loads.retry} />
  </figure>;
  // Labels: the pick first, then in order, while they fit inside the frame without touching.
  const indexes = places.map((_, index) => index);
  const order = selected >= 0 ? [selected, ...indexes.filter(index => index !== selected)] : indexes;
  // Each label tries beside its pin (the side with more room first), then above, then below; a label that fits nowhere
  // is left off the plane (the place is still pinned and listed for screen readers and in the rows).
  type Box = { index: number; left: number; right: number; top: number; bottom: number };
  const boxes: Box[] = [];
  const pinBoxes = frame.pins.map((pin, index) => { const r = index === selected ? 9 : 7; return { left: pin.x - r, right: pin.x + r, top: pin.y - r, bottom: pin.y + r }; });
  const inside = (box: Omit<Box, "index">) => box.left >= 4 && box.right <= width - 4 && box.top >= 4 && box.bottom <= height - 34;
  const overlaps = (box: Omit<Box, "index">, other: Omit<Box, "index">) => box.right > other.left && box.left < other.right && box.bottom > other.top && box.top < other.bottom;
  const clear = (box: Omit<Box, "index">, index: number) => inside(box)
    && boxes.every(other => box.right + 4 <= other.left || box.left >= other.right + 4 || box.bottom + 2 <= other.top || box.top >= other.bottom + 2)
    && pinBoxes.every((other, at) => at === index || !overlaps(box, other));
  // Slid into the plane (inside the 4px margin, above the attribution): how the pick stays named near an edge.
  const clamp = (box: Omit<Box, "index">) => {
    const w = box.right - box.left, h = box.bottom - box.top;
    const left = Math.max(4, Math.min(box.left, width - 4 - w)), top = Math.max(4, Math.min(box.top, height - 34 - h));
    return { left, right: left + w, top, bottom: top + h };
  };
  for (const index of order) {
    const pin = frame.pins[index], w = Math.min(labelWidth(places[index].label, index === selected), width - 24), gap = index === selected ? 11 : 9;
    const right = { left: pin.x + gap, right: pin.x + gap + w, top: pin.y - 11, bottom: pin.y + 11 };
    const left = { left: pin.x - gap - w, right: pin.x - gap, top: pin.y - 11, bottom: pin.y + 11 };
    const above = { left: pin.x - w / 2, right: pin.x + w / 2, top: pin.y - gap - 22, bottom: pin.y - gap };
    const below = { left: pin.x - w / 2, right: pin.x + w / 2, top: pin.y + gap, bottom: pin.y + gap + 22 };
    const sides = pin.x > width * .7 ? [left, right, above, below] : [right, left, above, below];
    // The pick is always named: clear of other pins if it can be, else over them (it is drawn on top), else slid into
    // the plane, keeping off its own pin where any slid position allows.
    const found = sides.find(box => clear(box, index)) ?? (index === selected
      ? sides.find(inside) ?? sides.map(clamp).find(box => !overlaps(box, pinBoxes[index])) ?? clamp(above) : undefined);
    if (found) boxes.push({ index, ...found });
  }
  const pinOrder = [...indexes].sort((a, b) => (a === selected ? 1 : 0) - (b === selected ? 1 : 0));
  return <figure ref={node} className="hkc-output-map" aria-label="Map" data-state={phase} aria-busy={phase === "loading" || undefined}>
    <div className="hkc-output-map-frame">
    <div className="hkc-output-map-plane" style={{ height }} aria-hidden="true">
      {tiles.map(tile => <img key={`${loads.key(tile.src)} @${tile.key}`} data-load={tile.src} className="hkc-output-map-tile" src={tile.src} alt="" draggable={false}
        data-state={loads.phase(tile.src)} style={{ left: tile.x, top: tile.y }}
        onLoad={() => loads.settle(tile.src, "ready")} onError={() => loads.settle(tile.src, "failed")} />)}
      {pinOrder.map(index => <span key={index} className="hkc-output-map-pin" data-selected={index === selected || undefined}
        style={{ left: frame.pins[index].x, top: frame.pins[index].y }} />)}
      {boxes.map(box => <span key={box.index} className="hkc-output-map-label" data-selected={box.index === selected || undefined}
        style={{ left: box.left, top: box.top, width: box.right - box.left }}>{places[box.index].label}</span>)}
    </div>
    <small className="hkc-output-map-attribution">© OpenStreetMap contributors</small>
    </div>
    {phase === "partial" && <p className="hkc-output-block-note"><Info size={14} weight="bold" aria-hidden="true" />Part of the map didn’t load</p>}
    <ul className="hk-sr-only" aria-label="Places">
      {places.map((place, index) => <li key={index}>{named(place, index)}</li>)}
    </ul>
  </figure>;
}

// ---- loading skeletons and Copy ----

export type HarsoOutputMediaKind = "status" | "progress" | "image" | "video" | "map";
export function HarsoOutputMediaSkeleton({ kind }: { kind: HarsoOutputMediaKind }) {
  if (kind === "status") return <div className="hkc-output-skeleton hkc-output-skeleton--status" aria-hidden="true">
    {[0, 1, 2].map(index => <span key={index} className="hkc-output-skeleton-step"><i /><span><span /><span /></span><span /></span>)}
  </div>;
  if (kind === "progress") return <div className="hkc-output-skeleton hkc-output-skeleton--progress" aria-hidden="true"><span /><span /><span /></div>;
  const aspect = kind === "map" ? 24 / 13 : kind === "video" ? 16 / 9 : 4 / 3;
  return <div className="hkc-output-media" data-state="loading" aria-hidden="true" style={{ "--hkc-media-aspect": aspect } as CSSProperties} />;
}

/** Plain text of a status, image, video or map block for Copy; undefined for any other kind. */
export function mediaPlainText(block: AnyBlock): string | undefined {
  const status = readStatus(block);
  if (status) return [STATUS[status.state].word, status.detail].filter(Boolean).join(" · ");
  const visual = (block as { visual?: HarsoOutputMedia }).visual;
  if (block.kind !== "visual" || !visual) return undefined;
  if (visual.kind === "image") return `Image: ${visual.alt}`;
  if (visual.kind === "video") return `Video: ${visual.alt}`;
  if (visual.kind === "map" && Array.isArray(visual.places)) return `Map: ${visual.places.map(place => `${place.label}${place.id === visual.selected_place_id ? " (selected)" : ""}`).join(", ")}`;
  return undefined;
}
