"use client";

import { CaretRight } from "@phosphor-icons/react";
import { useId, useRef, useState } from "react";
import { Button } from "../primitives";
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

/** Any other block kind (visual, table, status, …) is carried opaquely and triggers the fallback. */
export interface HarsoOutputOtherBlock { kind: string; [key: string]: unknown }

export type HarsoOutputBlock = HarsoOutputRowsBlock | HarsoOutputNumbersBlock | HarsoOutputTextBlock | HarsoOutputActionBlock | HarsoOutputOtherBlock;

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

export interface HarsoOutputCardCaps { maxRows: number; maxNumbers: number; maxTextChars: number }

/**
 * Approved inline rule (founder, 23 Sep): at most three rows, two key numbers (2-up) and ~4 lines of text
 * (the contract's "first ~180 characters") inline. Anything beyond is reached through the View-all row.
 */
export const HARSO_OUTPUT_CARD_CAPS: Readonly<HarsoOutputCardCaps> = Object.freeze({ maxRows: 3, maxNumbers: 2, maxTextChars: 180 });

export interface HarsoOutputCardProps {
  document: HarsoOutputDocument;
  caps?: Partial<HarsoOutputCardCaps>;
  /** Called when the person asks for every row; the host opens the full output view. */
  onViewAll: () => void;
  /** When supplied, Details hands off to the host; otherwise Details discloses inline. */
  onOpenDetails?: () => void;
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
  | { kind: "text"; text: string };

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
 * Supported = only rows/numbers/text/action blocks, and no row field this card would otherwise drop silently.
 * Blocks render in agent order under one running budget per kind. Action blocks are skipped unread.
 * `total` counts every row and key number the agent says exists; `clamped` marks text that continues off the card.
 */
function readBlocks(blocks: HarsoOutputBlock[], caps: HarsoOutputCardCaps) {
  const parts: CardPart[] = [];
  let rowBudget = Math.max(0, caps.maxRows), numberBudget = Math.max(0, caps.maxNumbers);
  let total = 0, shown = 0, clamped = false, textShown = false;
  for (const block of blocks) {
    if (isRows(block)) {
      if (block.items.some(row => row.status != null)) return undefined;
      const items = block.items.slice(0, rowBudget);
      rowBudget -= items.length;
      total += Math.max(block.items.length, Number.isInteger(block.total_count) ? block.total_count! : 0);
      shown += items.length;
      if (items.length) parts.push({ kind: "rows", items });
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

export function HarsoOutputCard({ document, caps, onViewAll, onOpenDetails, className = "" }: HarsoOutputCardProps) {
  const id = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = readBlocks(document.blocks, { ...HARSO_OUTPUT_CARD_CAPS, ...caps });
  const details = hasDetails(document.details) ? document.details : undefined;
  const inlineDetails = details && !onOpenDetails;
  const hasMore = !!content && (content.hidden > 0 || content.clamped);
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
        {content.parts.map((part, partIndex) => part.kind === "rows"
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
            : <p key={partIndex} className="hkc-output-card-text">{part.text}</p>)}
        {hasMore && <Button variant="ghost" className="hkc-output-card-view-all" onClick={onViewAll}
          trailingIcon={<CaretRight size={14} weight="bold" />}>{viewAllLabel}</Button>}
      </>
      : <p className="hkc-output-card-fallback">{document.fallback_text}</p>}
  </section>;
}
