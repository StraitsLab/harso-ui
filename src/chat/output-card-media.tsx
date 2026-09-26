"use client";

import { Play, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../primitives";
import "./output-card-media.css";

/*
 * Packet 5c: status, progress, image, video poster and map blocks for the inline output card, drawn from the
 * published B0 v4 masters (`v4/macOS/<theme>/{status,progress,image,map}/<state>`). Local copy of the output-blocks.v1
 * subset these read. Where B0 draws more than the contract carries (status steps G16, progress target G9/G12), the
 * block is read by the shape the playbook tells the agent to send; nothing is invented.
 */

export type HarsoOutputStatusState = "working" | "needs_you" | "ready" | "needs_attention" | "stopped_by_you" | "failed" | "watching" | "scheduled" | "empty";
export interface HarsoOutputStatusBlock {
  kind: "status";
  state: HarsoOutputStatusState;
  detail?: string;
  subject?: { work_unit_id: string } | { routine_id: string };
}
export interface HarsoOutputPlace { id: string; label: string; lat: string; lon: string }
export interface HarsoOutputMap { kind: "map"; places: HarsoOutputPlace[]; selected_place_id?: string }
export interface HarsoOutputImage { kind: "image"; artifact: string; alt: string; aspect?: "square" | "4:3" | "16:9" | "3:4" }
export interface HarsoOutputVideo { kind: "video"; artifact: string; alt: string; poster?: string }
export type HarsoOutputMedia = HarsoOutputMap | HarsoOutputImage | HarsoOutputVideo;

/**
 * What the host lends the card to draw media. The kit never fetches on its own: artifact URIs and map tiles come
 * from the host, and a control appears only when the host can act on it.
 */
export interface HarsoOutputMediaHost {
  /** An `artifact:` URI to a URL the host serves (image, video, poster); undefined when it has none. */
  resolveArtifact?: (artifact: string) => string | undefined;
  /** Opens a file (the video) in the host's viewer. Without it the poster is not a control. */
  onOpenArtifact?: (artifact: string) => void;
  /** OpenStreetMap raster tile URL for zoom/x/y. Without it a map block falls back to text: pins on nothing is not a map. */
  mapTile?: (z: number, x: number, y: number) => string;
}

type AnyBlock = { kind: string };
type Row = { label: string; secondary?: string; trailing?: string; mark?: string; status?: string };
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
  return items.every(row => row.label?.trim() && row.trailing?.trim() && !row.secondary && row.mark == null && row.status == null) ? items : undefined;
}

export function HarsoOutputStatusView({ status, steps }: { status: HarsoOutputStatusBlock; steps?: Row[] }) {
  const { word, meaning } = STATUS[status.state];
  if (status.state === "empty") return <p className="hkc-output-block-note hkc-output-block-note--empty" data-state="empty">
    <span className="hkc-output-block-ring" aria-hidden="true" />{status.detail || word}
  </p>;
  if (meaning === "problem") return <div className="hkc-output-block-failed" data-meaning="problem">
    <WarningCircle className="hkc-output-block-failed-glyph" size={16} weight="bold" aria-hidden="true" />
    <div className="hkc-output-block-failed-text"><p className="hkc-output-block-failed-message">{status.detail || word}</p></div>
  </div>;
  return <div className="hkc-output-status" data-meaning={meaning}>
    <p className="hkc-output-status-line">
      <span className="hkc-output-status-dot" aria-hidden="true" />
      <span className="hkc-output-status-word">{word}</span>
      {status.detail && <span className="hkc-output-status-detail"> · {status.detail}</span>}
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
  const plain = (label: string) => label.trim().replace(/\s+of\s+\S+$/, "");
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

const ARTIFACT = /^artifact:[0-9a-f-]{36}$/;
/** The image, video or map this card can draw, or undefined (the card then falls back to text). */
export function readMedia(block: AnyBlock, host: HarsoOutputMediaHost): HarsoOutputMedia | undefined {
  if (block.kind !== "visual") return undefined;
  const visual = (block as { visual?: { kind?: string } }).visual as HarsoOutputMedia | undefined;
  if (!visual) return undefined;
  if (visual.kind === "image" || visual.kind === "video") {
    // No way to show the file (or, for a video, to open it) without the host: fall back rather than draw a dead frame.
    const ok = ARTIFACT.test(visual.artifact ?? "") && typeof visual.alt === "string" && !!host.resolveArtifact?.(visual.artifact)
      && (visual.kind === "image" || !!host.onOpenArtifact);
    return ok ? visual : undefined;
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

function useWidth(fallback: number) {
  const node = useRef<HTMLDivElement>(null);
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
  const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const src = host.resolveArtifact?.(image.artifact);
  useEffect(() => setPhase("loading"), [src]);
  if (phase === "failed") return <div className="hkc-output-block-failed" data-state="failed">
    <WarningCircle className="hkc-output-block-failed-glyph" size={16} weight="bold" aria-hidden="true" />
    <div className="hkc-output-block-failed-text">
      <p className="hkc-output-block-failed-message">Couldn’t load the image</p>
      <p className="hkc-output-block-failed-reason">{image.alt}</p>
      <Button variant="quiet" className="hkc-output-block-retry" onClick={() => { setAttempt(value => value + 1); setPhase("loading"); }}>Try again</Button>
    </div>
  </div>;
  const aspect = ASPECT[image.aspect ?? "4:3"] ?? ASPECT["4:3"];
  return <div className="hkc-output-media" data-state={phase} aria-busy={phase === "loading" || undefined}
    style={{ "--hkc-media-aspect": aspect } as CSSProperties}>
    <img key={attempt} className="hkc-output-media-img" src={src} alt={image.alt} decoding="async" draggable={false}
      onLoad={() => setPhase("ready")} onError={() => setPhase("failed")} />
  </div>;
}

/** m:ss or h:mm:ss. */
export function duration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  const whole = Math.round(seconds), h = Math.floor(whole / 3600), m = Math.floor(whole % 3600 / 60), s = whole % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** A poster frame with its duration that opens the file in the host; never an inline player. */
export function HarsoOutputVideoView({ video, host }: { video: HarsoOutputVideo; host: HarsoOutputMediaHost }) {
  const [length, setLength] = useState<string>();
  const [posterFailed, setPosterFailed] = useState(false);
  const src = host.resolveArtifact?.(video.artifact);
  const poster = video.poster ? host.resolveArtifact?.(video.poster) : undefined;
  useEffect(() => {
    // Read only the file's metadata for its length; nothing plays and nothing is attached to the page.
    if (!src || typeof document === "undefined") return;
    const probe = document.createElement("video");
    let live = true;
    probe.preload = "metadata";
    probe.muted = true;
    probe.onloadedmetadata = () => { if (live) setLength(duration(probe.duration)); };
    probe.src = src;
    return () => { live = false; probe.onloadedmetadata = null; probe.removeAttribute("src"); probe.load?.(); };
  }, [src]);
  const open = host.onOpenArtifact;
  const body = <>
    {poster && !posterFailed ? <img className="hkc-output-media-img" src={poster} alt="" draggable={false} onError={() => setPosterFailed(true)} /> : null}
    {open && <span className="hkc-output-video-play" aria-hidden="true"><Play size={18} weight="fill" /></span>}
    {length && <span className="hkc-output-video-length" aria-hidden="true">{length}</span>}
  </>;
  const style = { "--hkc-media-aspect": ASPECT["16:9"] } as CSSProperties;
  const name = `${video.alt}${length ? `, ${length}` : ""}`;
  return open
    ? <button type="button" className="hkc-output-media hkc-output-video" style={style} aria-label={`Open video: ${name}`} onClick={() => open(video.artifact)}>{body}</button>
    : <div className="hkc-output-media hkc-output-video" style={style} role="img" aria-label={`Video: ${name}`}>{body}</div>;
}

// ---- map ----

const TILE = 256, PAD = 36, MIN_ZOOM = 2, MAX_ZOOM = 15;
const project = (lat: number, lon: number, zoom: number) => {
  const size = TILE * 2 ** zoom, sin = Math.sin(lat * Math.PI / 180);
  return { x: (lon + 180) / 360 * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
};

/** The highest zoom at which every place fits inside the frame with room for its pin. */
export function frameMap(places: HarsoOutputPlace[], width: number, height: number) {
  const points = places.slice(0, 12).map(place => ({ lat: Number(place.lat), lon: Number(place.lon) }));
  let zoom = MAX_ZOOM;
  for (; zoom > MIN_ZOOM; zoom--) {
    const xy = points.map(point => project(point.lat, point.lon, zoom));
    const spanX = Math.max(...xy.map(p => p.x)) - Math.min(...xy.map(p => p.x)), spanY = Math.max(...xy.map(p => p.y)) - Math.min(...xy.map(p => p.y));
    if (spanX <= width - 2 * PAD && spanY <= height - 2 * PAD) break;
  }
  const xy = points.map(point => project(point.lat, point.lon, zoom));
  const cx = (Math.max(...xy.map(p => p.x)) + Math.min(...xy.map(p => p.x))) / 2, cy = (Math.max(...xy.map(p => p.y)) + Math.min(...xy.map(p => p.y))) / 2;
  const left = cx - width / 2, top = cy - height / 2;
  return { zoom, left, top, pins: xy.map(p => ({ x: p.x - left, y: p.y - top })) };
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
    return Math.ceil(measurer.measureText(text).width) + 14;
  }
  return Math.ceil(Array.from(text).reduce((width, char) => width + LABEL * (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff00-\uff60]|\p{Extended_Pictographic}/u.test(char) ? 1 : .6), 0)) + 14;
}

/** A still map: OSM tiles when the host lends them, ≤12 pins, the pick larger and labelled first, attribution kept. */
export function HarsoOutputMapView({ map, host }: { map: HarsoOutputMap; host: HarsoOutputMediaHost }) {
  const [node, width] = useWidth(480);
  const height = Math.round(width * 13 / 24);
  const places = map.places.slice(0, 12);
  const frame = frameMap(places, width, height);
  const selected = places.findIndex(place => place.id === map.selected_place_id);
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
  // Labels: the pick first, then in order, while they fit inside the frame without touching.
  const indexes = places.map((_, index) => index);
  const order = selected >= 0 ? [selected, ...indexes.filter(index => index !== selected)] : indexes;
  const boxes: { index: number; left: number; right: number; top: number; bottom: number; flip: boolean }[] = [];
  for (const index of order) {
    const pin = frame.pins[index], w = Math.min(labelWidth(places[index].label, index === selected), width - 24), gap = index === selected ? 11 : 9;
    const flip = pin.x > width * .7;
    const box = { index, flip, left: flip ? pin.x - gap - w : pin.x + gap, right: flip ? pin.x - gap : pin.x + gap + w, top: pin.y - 11, bottom: pin.y + 11 };
    const inside = box.left >= 4 && box.right <= width - 4 && box.top >= 4 && box.bottom <= height - 34;
    if (inside && boxes.every(other => box.right + 4 <= other.left || box.left >= other.right + 4 || box.bottom + 2 <= other.top || box.top >= other.bottom + 2)) boxes.push(box);
  }
  const pinOrder = [...indexes].sort((a, b) => (a === selected ? 1 : 0) - (b === selected ? 1 : 0));
  return <figure className="hkc-output-map" aria-label="Map">
    <div ref={node} className="hkc-output-map-plane" style={{ height }} aria-hidden="true">
      {tiles.map(tile => <img key={tile.key} className="hkc-output-map-tile" src={tile.src} alt="" draggable={false}
        style={{ left: tile.x, top: tile.y }} onError={event => { event.currentTarget.style.visibility = "hidden"; }} />)}
      {pinOrder.map(index => <span key={index} className="hkc-output-map-pin" data-selected={index === selected || undefined}
        style={{ left: frame.pins[index].x, top: frame.pins[index].y }} />)}
      {boxes.map(box => <span key={box.index} className="hkc-output-map-label" data-selected={box.index === selected || undefined}
        style={{ left: box.left, top: box.top, width: box.right - box.left }}>{places[box.index].label}</span>)}
    </div>
    <small className="hkc-output-map-attribution">© OpenStreetMap contributors</small>
    <ul className="hk-sr-only" aria-label="Places">
      {places.map((place, index) => <li key={index}>{place.label}{index === selected ? " (selected)" : ""}</li>)}
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
