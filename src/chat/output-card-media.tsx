"use client";

import { CaretLeft, CaretRight, Play, WarningCircle } from "@phosphor-icons/react";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Button, IconButton } from "../primitives";
import { HarsoOutputNumberDelta } from "./output-card-charts";
import type { V6TrackingCondition } from "./v6/types";
import "./output-card-media.css";

/*
 * Packet 5c: status, progress, image, video poster and map blocks for the inline output card, drawn from the
 * published B0 v4 masters (`v4/macOS/<theme>/{status,progress,image,map}/<state>`). Local copy of the output-blocks.v1
 * subset these read. Where B0 draws more than the contract carries (status steps G16, progress target G9/G12), the
 * block is read by the shape the playbook tells the agent to send; nothing is invented.
 */

export type HarsoOutputStatusState = "working" | "needs_you" | "ready" | "needs_attention" | "stopped_by_you" | "failed" | "watching" | "scheduled" | "empty" | "tracking";
/** What a status is about, as the contract names it. The host owns the live state of each (a page watch turned off). */
export type HarsoOutputStatusSubject = { work_unit_id: string } | { routine_id: string } | { page_watch_id: string };
/** Every state but `tracking`: it may name its subject, and carries none of the tracking fields. */
export interface HarsoOutputSubjectStatusBlock {
  kind: "status";
  state: Exclude<HarsoOutputStatusState, "tracking">;
  detail?: string;
  subject?: HarsoOutputStatusSubject;
  label?: never; progress?: never; stages?: never; stage_index?: never; condition?: never;
}
/**
 * C3: a display-only status read from a source (a parcel, a flight), never a Work or routine. It has a label and no
 * subject, so no control can attach to it. Progress is the source's own percent; stages are its steps in order.
 */
export interface HarsoOutputTrackingStatusBlock {
  kind: "status";
  state: "tracking";
  label: string;
  detail?: string;
  subject?: never;
  /** Integer 0-100, only when the source said so. */
  progress?: number;
  /** 1-8 short steps in order. */
  stages?: string[];
  stage_index?: number;
  condition?: V6TrackingCondition;
}
export type HarsoOutputStatusBlock = HarsoOutputSubjectStatusBlock | HarsoOutputTrackingStatusBlock;
/** The host's live word for a status block's subject (a paused routine), drawn instead of the emitted snapshot. */
export interface HarsoOutputSubjectState { word: string; meaning?: HarsoOutputMeaning }
export interface HarsoOutputPlace { id: string; label: string; lat: string; lon: string; category?: string; photo?: HarsoOutputPhoto }
export interface HarsoOutputMap { kind: "map"; places: HarsoOutputPlace[]; selected_place_id?: string; route?: { mode: "walk" | "drive"; path?: string; minutes?: number; meters?: number } }
/** One photo: a row's thumbnail, or one photo of a gallery. */
export interface HarsoOutputPhoto { artifact: string; alt: string }
/** `images` (2..10) makes the image a gallery; `artifact`/`alt` stay photo 1 for readers that show one. */
export interface HarsoOutputImage { kind: "image"; artifact: string; alt: string; aspect?: "square" | "4:3" | "16:9" | "3:4"; images?: HarsoOutputPhoto[] }
export interface HarsoOutputVideo { kind: "video"; artifact: string; alt: string; poster?: string }
export type HarsoOutputMedia = HarsoOutputMap | HarsoOutputImage | HarsoOutputVideo;

/**
 * Artifact URLs are resolved by the host. Maps fetch public OpenFreeMap vector tiles directly.
 */
export interface HarsoOutputMediaHost {
  /** An `artifact:` URI to a URL the host serves (image, video, poster); undefined when it has none. */
  resolveArtifact?: (artifact: string) => string | undefined;

}

type AnyBlock = { kind: string };
type Row = { label: string; secondary?: string; trailing?: string; mark?: string; status?: string; thumbnail?: unknown };
type Number_ = { value: string; delta?: string; label: string };

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
  empty: { word: "Nothing found" },
  tracking: { word: "Tracking", meaning: "in_progress" }
};
const RUNNING = new Set<HarsoOutputStatusState>(["working", "watching", "scheduled"]);

const CONDITIONS: readonly unknown[] = ["on_time", "delayed", "unknown"];
const CONDITION_WORD = { on_time: "On time", delayed: "Delayed", unknown: undefined } as const;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** C3's own laws: a label, no subject, a whole 0-100 percent, 1-8 stages with an in-bounds index, a known condition. */
function trackingOk(status: Record<string, unknown>) {
  const { label, subject, progress, stages, stage_index: index, condition, detail } = status;
  return text(label) && subject === undefined && (detail === undefined || typeof detail === "string")
    && (progress === undefined || (Number.isInteger(progress) && (progress as number) >= 0 && (progress as number) <= 100))
    && (stages === undefined || (Array.isArray(stages) && stages.length >= 1 && stages.length <= 8 && stages.every(text)))
    && (index === undefined || (Array.isArray(stages) && Number.isInteger(index) && (index as number) >= 0 && (index as number) < stages.length))
    && (condition === undefined || CONDITIONS.includes(condition));
}

/** A status this card can say, or undefined (the whole card then falls back): never half a tracking status. */
export function readStatus(block: AnyBlock): HarsoOutputStatusBlock | undefined {
  if (block.kind !== "status") return undefined;
  const status = block as Record<string, unknown>;
  if (typeof status.state !== "string" || !Object.hasOwn(STATUS, status.state)) return undefined;
  return status.state !== "tracking" || trackingOk(status) ? status as unknown as HarsoOutputStatusBlock : undefined;
}

/** What follows the state word: a tracking status says its label, then a delay or on-time word only if the source gave one. */
function statusDetail(status: HarsoOutputStatusBlock) {
  if (status.state !== "tracking") return status.detail;
  return [status.label, status.condition && CONDITION_WORD[status.condition], status.detail].filter(Boolean).join(" · ");
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
  const { word, meaning: emitted } = live ?? STATUS[status.state];
  const meaning = !live && status.state === "tracking" && status.condition === "delayed" ? "attention" : emitted;
  // The emitted detail describes the emitted state ("since 26 Sep", "rings at 19:42"), so a live word drops it.
  const detail = live ? undefined : statusDetail(status);
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
    <p className="hkc-output-progress-note">{note}{progress.rest.delta && <> <HarsoOutputNumberDelta delta={progress.rest.delta} /></>}{progress.used.delta && <> · <HarsoOutputNumberDelta delta={progress.used.delta} /></>}</p>
  </div>;
}

// ---- media ----

export const ARTIFACT = /^artifact:[0-9a-f-]{36}$/;
export const MEDIA_URI = /^(?:artifact:[0-9a-f-]{36}|chat:[0-9a-f-]{36}\/[0-9a-f-]{36}\/[^/]+|https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?(?:\/\S*)?)$/;
/** A photo the card may draw (a row thumbnail, a gallery photo): a well-formed artifact, chat file or https URL and an alt. */
export const isPhoto = (photo: unknown): photo is HarsoOutputPhoto => !!photo && typeof photo === "object"
  && MEDIA_URI.test((photo as HarsoOutputPhoto).artifact ?? "") && typeof (photo as HarsoOutputPhoto).alt === "string";
/** 2..10 well-formed photos, photo 1 being the image's own artifact and alt (what a one-photo reader shows). */
const isGallery = (image: HarsoOutputImage): image is HarsoOutputImage & { images: HarsoOutputPhoto[] } => {
  const { images } = image;
  return Array.isArray(images) && images.length >= 2 && images.length <= 10 && images.every(isPhoto)
    && images[0].artifact === image.artifact && images[0].alt === image.alt;
};
/**
 * The image, video or map this card can draw, or undefined (the card then falls back to text). A video needs
 * `canOpen` (the card's `onOpenArtifact`): its poster is only a way to open the file. A well-formed gallery (2..10
 * photos, photo 1 = the image) needs only a resolving host; each photo's availability is its own tile's. Any other
 * `images` draw as the one photo old readers show.
 */
export function readMedia(block: AnyBlock, host: HarsoOutputMediaHost, canOpen = false): HarsoOutputMedia | undefined {
  if (block.kind !== "visual") return undefined;
  const visual = (block as { visual?: { kind?: string } }).visual as HarsoOutputMedia | undefined;
  if (!visual) return undefined;
  if (visual.kind === "image" || visual.kind === "video") {
    const uriOk = visual.kind === "image" ? MEDIA_URI.test(visual.artifact ?? "") : ARTIFACT.test(visual.artifact ?? "");
    if (!uriOk || typeof visual.alt !== "string") return undefined;
    // A well-formed gallery needs only a host that resolves artifacts: each photo it cannot resolve is its own quiet
    // tile, photo 1 included, and the others still browse.
    if (visual.kind === "image" && isGallery(visual)) return host.resolveArtifact ? visual : undefined;
    // No way to show the file (or, for a video, to open it) without the host: fall back rather than draw a dead frame.
    if (!host.resolveArtifact?.(visual.artifact) || (visual.kind === "video" && !canOpen)) return undefined;
    if (visual.kind === "video" || visual.images === undefined) return visual;
    const { images: _dropped, ...one } = visual;
    return one;
  }
  if (visual.kind === "map") {
    const places = Array.isArray(visual.places) ? visual.places : [];
    const ok = places.length > 0 && places.every(place => place && typeof place.id === "string" && typeof place.label === "string" && place.lat !== "" && place.lon !== "" && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon)) && Math.abs(Number(place.lat)) <= 85 && Math.abs(Number(place.lon)) <= 180 && (place.category === undefined || (typeof place.category === "string" && place.category.length <= 24)) && (place.photo === undefined || isPhoto(place.photo))) && (!visual.route || (places.length >= 2 && ["walk", "drive"].includes(visual.route.mode)));
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
  /*
   * The photo the newest button or key press is scrolling to, until the track gets there. Only the newest command
   * counts: scroll events on the way, and the end of an older scroll that command cut short, never move the counter
   * (the track is sent on to the target, a few times at most). A hand on the track (wheel, touch, pointer) cancels the
   * command, and from then on the counter follows the track and settles where it stops.
   */
  const target = useRef<number | undefined>(undefined), retries = useRef(0);
  const lastPosition = useRef(0);
  const select = (at: number) => {
    setIndex(at);
    setSeen(all => all.has(at - 1) && all.has(at) && all.has(at + 1) ? all : new Set([...all, at - 1, at, at + 1]));
  };
  const position = (element: HTMLElement) => Math.abs(element.scrollLeft) / element.clientWidth;
  const scrollTrack = (element: HTMLElement, at: number, instant = false) => {
    const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === "rtl";
    element.scrollTo({ left: (rtl ? -1 : 1) * at * element.clientWidth, behavior: instant ? "instant" : reducedMotion(element) ? "auto" : "smooth" });
  };
  const show = (to: number) => {
    const at = Math.max(0, Math.min(count - 1, to));
    select(at);
    const element = track.current;
    if (!element || !element.clientWidth) return;
    lastPosition.current = position(element);
    // Already there (an end pressed again, or a reversal before an older smooth scroll has got far): an older scroll may
    // still be on its way, so this is still a command. Pin the track instantly, then again on the next two frames: a
    // cut-short smooth scroll can take its first pixels and stop without a scrollend. A hand on the track wins.
    if (Math.abs(position(element) - at) < .02) {
      target.current = at;
      retries.current = 0;
      scrollTrack(element, at, true);
      const view = element.ownerDocument.defaultView;
      const pin = (frames: number) => view?.requestAnimationFrame(() => {
        if (target.current !== at) return;
        if (Math.abs(position(element) - at) * element.clientWidth > 1) scrollTrack(element, at, true);
        lastPosition.current = position(element);
        if (frames > 1) pin(frames - 1); else target.current = undefined;
      });
      pin(2);
      return;
    }
    target.current = at;
    retries.current = 0;
    scrollTrack(element, at);
  };
  const settle = (end: boolean) => {
    const element = track.current;
    if (!element?.clientWidth) return;
    const current = position(element), at = Math.round(current);
    // A host scrollTo has no pointer/wheel event. Movement away after reaching the
    // target's slide means takeover. Before then, an older scroll may still be
    // moving away from a newer reversing command; keep that command alive.
    if (target.current !== undefined && Math.abs(lastPosition.current - target.current) < .5
      && Math.abs(current - target.current) > Math.abs(lastPosition.current - target.current) + 1 / element.clientWidth) {
      target.current = undefined;
    }
    lastPosition.current = current;
    if (target.current !== undefined) {
      if (!end) return;
      // An older scroll the newest command cut short ended short of it: send the track on, never the counter back.
      // Checked exactly, not rounded: a few pixels an older scroll took before it was cut short count as short too.
      if (Math.abs(position(element) - target.current) * element.clientWidth > 1 && retries.current < 3) { retries.current++; scrollTrack(element, target.current); return; }
      target.current = undefined;
    }
    if (at !== index) select(at);
  };
  const takeOver = () => { target.current = undefined; };
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
      onWheel={takeOver} onTouchStart={takeOver} onPointerDown={takeOver}
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

const InteractiveMap = lazy(() => import("./output-map"));

/** MapLibre and its styles are fetched only when a map block is shown. */
export function HarsoOutputMapView({ map, host, listed }: { map: HarsoOutputMap; host: HarsoOutputMediaHost; listed?: boolean }) {
  return <Suspense fallback={<HarsoOutputMediaSkeleton kind="map" />}><InteractiveMap map={map} host={host} listed={listed} /></Suspense>;
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
  if (status) return [STATUS[status.state].word, statusDetail(status)].filter(Boolean).join(" · ");
  const visual = (block as { visual?: HarsoOutputMedia }).visual;
  if (block.kind !== "visual" || !visual) return undefined;
  if (visual.kind === "image") return `Image: ${visual.alt}`;
  if (visual.kind === "video") return `Video: ${visual.alt}`;
  if (visual.kind === "map" && Array.isArray(visual.places)) return `Map: ${visual.places.map(place => `${place.label}${place.id === visual.selected_place_id ? " (selected)" : ""}`).join(", ")}`;
  return undefined;
}
