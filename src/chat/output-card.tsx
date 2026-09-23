"use client";

import { useId, useRef, useState } from "react";
import { Button } from "../primitives";
import "./output-card.css";

/*
 * WEV-1851 S1: display-only inline card for an agent `output-blocks.v1` document.
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

/** `reply` is the only kind this card can hand to the host; every other kind renders disabled. */
export interface HarsoOutputActionSpec { kind: string; label: string; text?: string; [key: string]: unknown }

export interface HarsoOutputActionBlock { kind: "action"; primary?: HarsoOutputActionSpec; secondary?: HarsoOutputActionSpec }

/** Any other block kind (visual, numbers, text, table, status, …) is carried opaquely and triggers the fallback. */
export interface HarsoOutputOtherBlock { kind: string; [key: string]: unknown }

export type HarsoOutputBlock = HarsoOutputRowsBlock | HarsoOutputActionBlock | HarsoOutputOtherBlock;

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

export interface HarsoOutputCardCaps { maxRows: number }

/** Approved inline rule (founder, 23 Sep): at most three rows inline. */
export const HARSO_OUTPUT_CARD_CAPS: Readonly<HarsoOutputCardCaps> = Object.freeze({ maxRows: 3 });

export interface HarsoOutputCardProps {
  document: HarsoOutputDocument;
  caps?: Partial<HarsoOutputCardCaps>;
  /** Called with the action's `text` (never its label). The host decides prefill vs send. */
  onReply: (text: string) => void;
  /** When supplied, Details hands off to the host; otherwise Details discloses inline. */
  onOpenDetails?: () => void;
  className?: string;
}

const UNAVAILABLE_REASON = "Not available here yet";

const isRows = (block: HarsoOutputBlock): block is HarsoOutputRowsBlock =>
  block.kind === "rows" && Array.isArray((block as HarsoOutputRowsBlock).items);
const isAction = (block: HarsoOutputBlock): block is HarsoOutputActionBlock => block.kind === "action";

/** Supported = only rows/action blocks, and no row field this card would otherwise drop silently. */
function readBlocks(blocks: HarsoOutputBlock[]) {
  const rows: HarsoOutputRow[] = [];
  let action: HarsoOutputActionBlock | undefined;
  for (const block of blocks) {
    if (isRows(block)) {
      if (block.items.some(row => row.status != null)) return undefined;
      rows.push(...block.items);
    } else if (isAction(block)) {
      action ??= block;
    } else {
      return undefined;
    }
  }
  return { rows, action };
}

function hasDetails(details: HarsoOutputDocumentDetails | undefined): details is HarsoOutputDocumentDetails {
  return !!details && [details.sources, details.assumptions, details.disclaimers].some(list => !!list?.length);
}

function CardAction({ block, onReply }: { block: HarsoOutputActionBlock; onReply: (text: string) => void }) {
  const reasonId = useId();
  const spec = block.primary ?? block.secondary;
  if (!spec) return null;
  const replyText = spec.kind === "reply" && typeof spec.text === "string" ? spec.text : undefined;
  const available = replyText !== undefined;
  return <div className="hkc-output-card-action">
    <Button variant={block.primary ? "primary" : "secondary"} disabled={!available}
      aria-describedby={available ? undefined : reasonId}
      onClick={available ? () => onReply(replyText) : undefined}>
      {spec.label}
    </Button>
    {!available && <p id={reasonId} className="hkc-output-card-reason">{UNAVAILABLE_REASON}</p>}
  </div>;
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

export function HarsoOutputCard({ document, caps, onReply, onOpenDetails, className = "" }: HarsoOutputCardProps) {
  const id = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const { maxRows } = { ...HARSO_OUTPUT_CARD_CAPS, ...caps };
  const content = readBlocks(document.blocks);
  const details = hasDetails(document.details) ? document.details : undefined;
  const inlineDetails = details && !onOpenDetails;
  const shownRows = content ? content.rows.slice(0, Math.max(0, maxRows)) : [];
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
        {shownRows.length > 0 && <ul className="hkc-output-card-rows">
          {shownRows.map((row, index) => <li key={row.id ?? index} className="hkc-output-card-row">
            <div className="hkc-output-card-row-main">
              <p className="hkc-output-card-row-line">
                <span className="hkc-output-card-row-label">{row.label}</span>
                {row.mark === "pick" && <span className="hkc-output-card-pick">Pick</span>}
              </p>
              {row.secondary && <p className="hkc-output-card-row-secondary">{row.secondary}</p>}
            </div>
            {row.trailing && <span className="hkc-output-card-row-value">{row.trailing}</span>}
          </li>)}
        </ul>}
        {content.action && <CardAction block={content.action} onReply={onReply} />}
      </>
      : <p className="hkc-output-card-fallback">{document.fallback_text}</p>}
  </section>;
}
