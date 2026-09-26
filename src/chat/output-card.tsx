"use client";

import { CaretRight } from "@phosphor-icons/react";
import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../primitives";
import { HarsoOutputBlockFrame, HarsoOutputChartView, HarsoOutputShareView, HarsoOutputTableView, isTotalRow, readChart, readShare, readTable,
  type HarsoOutputBlockState, type HarsoOutputChart, type HarsoOutputTableBlock as HarsoOutputTable, type HarsoOutputVisualBlock } from "./output-card-charts";
import "./output-card.css";

/*
 * WEV-1851 S1: display-only inline card for an agent `output-blocks.v1` document.
 * The card only shows: choices go through the host's native question card, so it renders no actions.
 * Local copy of the subset this card reads. The contract is frozen elsewhere
 * (weave-cloud S0); the host validates the document before it reaches the kit.
 */

export interface HarsoOutputHeader { title: string; subtitle?: string }

export interface HarsoOutputRow {
  id?: string;
  label: string;
  secondary?: string;
  trailing?: string;
  mark?: "pick";
  /** Agent-asserted row word (Overdue/Paid). Not rendered by this card yet: the document falls back. */
  status?: string;
}

export interface HarsoOutputRowsBlock { kind: "rows"; items: HarsoOutputRow[]; total_count?: number }

/** One key figure: `value` is already formatted by the agent (e.g. "S$4,280"). */
export interface HarsoOutputNumber { value: string; label: string }

export interface HarsoOutputNumbersBlock { kind: "numbers"; items: HarsoOutputNumber[] }

export interface HarsoOutputTextSection { heading?: string; paragraphs?: string[]; bullets?: string[] }

export interface HarsoOutputTextBlock { kind: "text"; summary?: string; sections: HarsoOutputTextSection[] }

/** Still carried by the contract; this card renders no action of any kind (display-only). */
export interface HarsoOutputActionSpec { kind: string; label: string; text?: string; [key: string]: unknown }

export interface HarsoOutputActionBlock { kind: "action"; primary?: HarsoOutputActionSpec; secondary?: HarsoOutputActionSpec }

/** Any other block kind (map, image, status, …) is carried opaquely and triggers the fallback; charts and tables are read by shape. */
export interface HarsoOutputOtherBlock { kind: string; [key: string]: unknown }

export type HarsoOutputBlock = HarsoOutputRowsBlock | HarsoOutputNumbersBlock | HarsoOutputTextBlock | HarsoOutputActionBlock | HarsoOutputVisualBlock | HarsoOutputTable | HarsoOutputOtherBlock;

export interface HarsoOutputSource { label: string; url?: string }

export interface HarsoOutputDocumentDetails { sources?: HarsoOutputSource[]; assumptions?: string[]; disclaimers?: string[] }

export interface HarsoOutputDocument {
  kind?: "output_blocks";
  major?: 1;
  header: HarsoOutputHeader;
  blocks: HarsoOutputBlock[];
  details?: HarsoOutputDocumentDetails;
  more_label?: string;
  fallback_text: string;
}

export interface HarsoOutputCardCaps { maxRows: number; maxNumbers: number; maxTextChars: number; maxTextLines: number }

/**
 * Approved inline rule (founder, 23 Sep): at most three rows, two key numbers (2-up) and ~4 lines of text inline.
 * Text is held by both the contract's "first ~180 characters" and a rendered line clamp (`maxTextLines`), because
 * characters alone do not bound height across scripts and widths. Anything beyond is reached through the View-all row.
 */
export const HARSO_OUTPUT_CARD_CAPS: Readonly<HarsoOutputCardCaps> = Object.freeze({ maxRows: 3, maxNumbers: 2, maxTextChars: 180, maxTextLines: 4 });

export interface HarsoOutputCardProps {
  document: HarsoOutputDocument;
  caps?: Partial<HarsoOutputCardCaps>;
  /** Called when the person asks for every row; the host opens the full output view. */
  onViewAll: () => void;
  /** When supplied, Details hands off to the host; otherwise Details discloses inline. */
  onOpenDetails?: () => void;
  /**
   * Host-owned state per block, keyed by the block's index in `document.blocks` (the contract has no per-block state
   * yet, G20). Charts, shares and tables draw loading/empty/partial/stale/failed as B0 does; absent means ready.
   */
  blockStates?: Readonly<Record<number, HarsoOutputBlockState>>;
  className?: string;
}

const isRows = (block: HarsoOutputBlock): block is HarsoOutputRowsBlock =>
  block.kind === "rows" && Array.isArray((block as HarsoOutputRowsBlock).items);
const isNumbers = (block: HarsoOutputBlock): block is HarsoOutputNumbersBlock =>
  block.kind === "numbers" && Array.isArray((block as HarsoOutputNumbersBlock).items);
const isText = (block: HarsoOutputBlock): block is HarsoOutputTextBlock =>
  block.kind === "text" && Array.isArray((block as HarsoOutputTextBlock).sections);
const isAction = (block: HarsoOutputBlock): block is HarsoOutputActionBlock => block.kind === "action";

type CardPart =
  | { kind: "rows"; items: HarsoOutputRow[] }
  | { kind: "numbers"; items: HarsoOutputNumber[] }
  | { kind: "text"; text: string }
  | { kind: "chart"; chart: HarsoOutputChart; state?: HarsoOutputBlockState }
  | { kind: "share"; items: HarsoOutputRow[]; shares: number[]; shown: number; state?: HarsoOutputBlockState }
  | { kind: "table"; table: HarsoOutputTable; shown: number; state?: HarsoOutputBlockState };

/** A block in one of these states shows no data of its own, so it counts nothing toward View all. */
const withoutData = (state?: HarsoOutputBlockState) => state?.state === "loading" || state?.state === "empty" || state?.state === "failed";

/** First `max` code points, backed off to a word boundary when one is near, then an ellipsis. */
function clip(text: string, max: number) {
  const points = Array.from(text);
  if (points.length <= max) return text;
  if (max <= 0) return "";
  const cut = points.slice(0, max).join("");
  const space = cut.lastIndexOf(" ");
  return `${(space > cut.length * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * The inline text of a text block: its `summary`, else its paragraphs and bullets as one run of prose.
 * `complete` only when that inline text is the whole block (no summary, headings or bullets left behind).
 */
function readText(block: HarsoOutputTextBlock) {
  const body = block.sections.flatMap(section => [...section.paragraphs ?? [], ...section.bullets ?? []]).join(" ");
  const complete = block.summary == null && block.sections.every(section => !section.heading && !section.bullets?.length);
  return { text: block.summary ?? body, complete };
}

/**
 * Supported = rows/numbers/text/action blocks, bar and line charts, and tables, with no row field this card would
 * otherwise drop silently. Rows that are shares of a whole (N% secondary, largest first, adding to 100%) draw as a share.
 * Blocks render in agent order under one running budget per kind; table body rows share the row budget, and a
 * Total row always shows. Action blocks are skipped unread. `total` counts every row and key number the agent says
 * exists; `clamped` marks text that continues off the card.
 */
function readBlocks(blocks: HarsoOutputBlock[], caps: HarsoOutputCardCaps, states: Readonly<Record<number, HarsoOutputBlockState>> = {}) {
  const parts: CardPart[] = [];
  let rowBudget = Math.max(0, caps.maxRows), numberBudget = Math.max(0, caps.maxNumbers);
  let total = 0, shown = 0, clamped = false, textShown = false;
  for (const [index, block] of blocks.entries()) {
    const state = states[index];
    if (isRows(block)) {
      if (block.items.some(row => row.status != null)) return undefined;
      const shares = readShare(block.items);
      if (shares) {
        if (withoutData(state)) { parts.push({ kind: "share", items: [], shares, shown: 0, state }); continue; }
        const count = Math.min(block.items.length, rowBudget);
        rowBudget -= count;
        total += Math.max(block.items.length, Number.isInteger(block.total_count) ? block.total_count! : 0);
        shown += count;
        parts.push({ kind: "share", items: block.items, shares, shown: count, state });
        continue;
      }
      const items = block.items.slice(0, rowBudget);
      rowBudget -= items.length;
      total += Math.max(block.items.length, Number.isInteger(block.total_count) ? block.total_count! : 0);
      shown += items.length;
      if (items.length) parts.push({ kind: "rows", items });
    } else if (readChart(block)) {
      parts.push({ kind: "chart", chart: readChart(block)!, state });
    } else if (readTable(block)) {
      const table = readTable(block)!;
      if (withoutData(state)) { parts.push({ kind: "table", table, shown: 0, state }); continue; }
      // One unit: body rows. `total_count` counts the table's rows as the playbook checker does (the Total row
      // included), so a Total row is taken off it too.
      const totalRow = isTotalRow(table, table.rows.length - 1) ? 1 : 0;
      const body = table.rows.length - totalRow;
      const count = Math.min(body, rowBudget);
      rowBudget -= count;
      total += Math.max(body, Number.isInteger(table.total_count) ? table.total_count! - totalRow : 0);
      shown += count;
      parts.push({ kind: "table", table, shown: count, state });
    } else if (isNumbers(block)) {
      const items = block.items.slice(0, numberBudget);
      numberBudget -= items.length;
      total += block.items.length;
      shown += items.length;
      if (items.length) parts.push({ kind: "numbers", items });
    } else if (isText(block)) {
      // One text run inline (~4 lines); a second text block always continues off the card.
      if (textShown) { clamped = true; continue; }
      textShown = true;
      const { text, complete } = readText(block);
      const inline = clip(text, caps.maxTextChars);
      clamped ||= !complete || inline !== text;
      if (inline) parts.push({ kind: "text", text: inline });
    } else if (!isAction(block)) {
      return undefined;
    }
  }
  return { parts, total, hidden: total - shown, clamped };
}

/**
 * Inline body text, clamped to `lines` rendered lines by CSS. Reports whether the clamp is hiding text,
 * re-measured when the text, the line cap or the paragraph's width changes.
 */
function CardText({ text, lines, onClip }: { text: string; lines: number; onClip: (clipped: boolean) => void }) {
  const node = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = () => onClip(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    return () => { observer?.disconnect(); onClip(false); };
  }, [text, lines, onClip]);
  return <p ref={node} className="hkc-output-card-text" style={{ "--hkc-output-card-text-lines": Math.max(1, lines) } as CSSProperties}>{text}</p>;
}

function hasDetails(details: HarsoOutputDocumentDetails | undefined): details is HarsoOutputDocumentDetails {
  return !!details && [details.sources, details.assumptions, details.disclaimers].some(list => !!list?.length);
}

function DetailsContent({ details }: { details: HarsoOutputDocumentDetails }) {
  return <>
    {!!details.sources?.length && <ul className="hkc-output-card-details-list" aria-label="Sources">
      {details.sources.map((source, index) => <li key={index}>{source.label}</li>)}
    </ul>}
    {!!details.assumptions?.length && <ul className="hkc-output-card-details-list" aria-label="Assumptions">
      {details.assumptions.map((line, index) => <li key={index}>{line}</li>)}
    </ul>}
    {!!details.disclaimers?.length && <ul className="hkc-output-card-details-list" aria-label="Disclaimers">
      {details.disclaimers.map((line, index) => <li key={index}>{line}</li>)}
    </ul>}
  </>;
}

export function HarsoOutputCard({ document, caps, onViewAll, onOpenDetails, blockStates, className = "" }: HarsoOutputCardProps) {
  const id = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [textClipped, setTextClipped] = useState(false);
  const limits = { ...HARSO_OUTPUT_CARD_CAPS, ...caps };
  const content = readBlocks(document.blocks, limits, blockStates);
  const details = hasDetails(document.details) ? document.details : undefined;
  const inlineDetails = details && !onOpenDetails;
  const hasMore = !!content && (content.hidden > 0 || content.clamped || textClipped);
  const viewAllLabel = document.more_label?.trim() || (content?.hidden ? `View all ${content.total}` : "View all");
  const titleId = `${id}-title`, detailsId = `${id}-details`;

  return <section className={`hkc-output-card ${className}`.trim()} aria-labelledby={titleId}
    data-fallback={content ? undefined : "true"}
    onKeyDown={event => {
      if (event.key !== "Escape" || !detailsOpen) return;
      event.stopPropagation();
      setDetailsOpen(false);
      trigger.current?.focus();
    }}>
    <header className="hkc-output-card-header">
      <div className="hkc-output-card-heading">
        <h2 id={titleId} className="hkc-output-card-title">{document.header.title}</h2>
        {document.header.subtitle && <p className="hkc-output-card-subtitle">{document.header.subtitle}</p>}
      </div>
      {details && <Button ref={trigger} variant="ghost" size="small" className="hkc-output-card-details-toggle"
        aria-expanded={inlineDetails ? detailsOpen : undefined} aria-controls={inlineDetails ? detailsId : undefined}
        onClick={() => onOpenDetails ? onOpenDetails() : setDetailsOpen(open => !open)}>Details</Button>}
    </header>
    {inlineDetails && <div id={detailsId} className="hkc-output-card-details" role="region" aria-label="Output details" hidden={!detailsOpen}>
      <DetailsContent details={details} />
    </div>}
    {content
      ? <>
        {content.parts.map((part, partIndex) => part.kind === "chart"
          ? <HarsoOutputBlockFrame key={partIndex} kind="chart" state={part.state}><HarsoOutputChartView chart={part.chart} /></HarsoOutputBlockFrame>
          : part.kind === "share"
          ? <HarsoOutputBlockFrame key={partIndex} kind="share" state={part.state}><HarsoOutputShareView items={part.items} shares={part.shares} shown={part.shown} /></HarsoOutputBlockFrame>
          : part.kind === "table"
          ? <HarsoOutputBlockFrame key={partIndex} kind="table" state={part.state}><HarsoOutputTableView table={part.table} shown={part.shown} label={document.header.title} /></HarsoOutputBlockFrame>
          : part.kind === "rows"
          ? <ul key={partIndex} className="hkc-output-card-rows">
            {part.items.map((row, index) => <li key={row.id ?? index} className="hkc-output-card-row">
              <div className="hkc-output-card-row-main">
                <p className="hkc-output-card-row-line">
                  <span className="hkc-output-card-row-label">{row.label}</span>
                  {row.mark === "pick" && <span className="hkc-output-card-pick">Pick</span>}
                </p>
                {row.secondary && <p className="hkc-output-card-row-secondary">{row.secondary}</p>}
              </div>
              {row.trailing && <span className="hkc-output-card-row-value">{row.trailing}</span>}
            </li>)}
          </ul>
          : part.kind === "numbers"
            // Value above its label, in that DOM order, so a screen reader hears "S$4,280, Spent" as one item.
            ? <ul key={partIndex} className="hkc-output-card-numbers">
              {part.items.map((number, index) => <li key={index} className="hkc-output-card-number">
                <span className="hkc-output-card-number-value">{number.value}</span>
                <span className="hkc-output-card-number-label">{number.label}</span>
              </li>)}
            </ul>
            : <CardText key={partIndex} text={part.text} lines={limits.maxTextLines} onClip={setTextClipped} />)}
        {hasMore && <Button variant="ghost" className="hkc-output-card-view-all" onClick={onViewAll}
          trailingIcon={<CaretRight size={14} weight="bold" />}>{viewAllLabel}</Button>}
      </>
      : <p className="hkc-output-card-fallback">{document.fallback_text}</p>}
  </section>;
}
