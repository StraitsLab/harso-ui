"use client";

import type { ReactNode } from "react";
import { Button } from "../../primitives";
import {
  HarsoOutputActionRow, readAction,
  type HarsoOutputActionBlock, type HarsoOutputDocument, type HarsoOutputRow, type HarsoOutputRowsBlock, type HarsoOutputTextBlock, type HarsoOutputTextSection
} from "../output-card";
import { HarsoOutputRowStatus, rowStatusOk } from "../output-card-charts";
import { V6Frame, V6Brand } from "./frame";
import type { V6Family, V6FamilyProps, V6Host, V6RenderBrand, V6Template, WidgetSize } from "./types";
import "./mail.css";

/*
 * WEV-3322 (P06): inbox-brief, deadlines-from-mail and reply-draft.
 *
 * Truth rules this file keeps:
 * - Unread is drawn only from `row.unread === true`. Importance is drawn only from the row's existing status.
 * - Deadline urgency is measured from an exact `due_at` against the document's saved `as_of`, never the device clock.
 *   A date-only due stays as the source's own words and gets no urgency.
 * - The draft is drawn whole. Nothing is clamped or hidden behind View all.
 * - The only controls are open_url links the host can open. Mark done, Send and every work or routine control are
 *   never drawn, whatever the document carries.
 */

const SIZES: Readonly<Partial<Record<V6Template, readonly WidgetSize[]>>> = {
  "inbox-brief": ["small", "medium"],
  "deadlines-from-mail": ["small", "medium"]
};
const MEDIUM_ROWS = 3;
/** Statuses that mean the mail matters to the person; done and paid are finished, in_progress is neither. */
const IMPORTANT = new Set(["needs_you", "overdue", "problem"]);

// ---- time: the saved snapshot against an exact due time ----

/** A real UTC minute/second stamp as epoch milliseconds; a rolled-over day (30 Feb) or a bare date is not one. */
function utcMs(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/.test(value)) return undefined;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString() === `${value.slice(0, 16)}:${value.length === 20 ? value.slice(17, 19) : "00"}.000Z` ? ms : undefined;
}

const HOUR = 3_600_000;
export type MailUrgency = "urgent" | "soon";
/**
 * Within 24 h of the snapshot is urgent, within 72 h is soon. Needs both an exact `due_at` and a real `as_of`; a due
 * date without a time, a past time or a far one has none. The device clock is never read.
 */
export function mailDueUrgency(dueAt: unknown, asOf: unknown): MailUrgency | undefined {
  const due = utcMs(dueAt), base = utcMs(asOf);
  if (due === undefined || base === undefined) return undefined;
  const ahead = due - base;
  return ahead < 0 ? undefined : ahead <= 24 * HOUR ? "urgent" : ahead <= 72 * HOUR ? "soon" : undefined;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Due 26 Sep 10:00 UTC": fixed words in UTC, so the iPhone, Mac and web say the same and no locale or zone decides. */
const dueWords = (utc: string) => `Due ${Number(utc.slice(8, 10))} ${MONTHS[Number(utc.slice(5, 7)) - 1]} ${utc.slice(11, 16)} UTC`;
const URGENCY_NOTE: Record<MailUrgency, string> = { urgent: "Due within 24 hours of the snapshot", soon: "Due within 72 hours of the snapshot" };

// ---- reading the document ----

type Parts = { rows: HarsoOutputRow[]; total?: number; texts: HarsoOutputTextBlock[]; actions: HarsoOutputActionBlock[] };

/** Only the blocks this family draws; any other block, row, status or shape sends the whole document to the generic card. */
function readParts(document: HarsoOutputDocument, template: V6Template): Parts | undefined {
  const wantsRows = template !== "reply-draft", wantsText = template !== "inbox-brief";
  const parts: Parts = { rows: [], texts: [], actions: [] };
  let rowBlocks = 0;
  for (const block of document.blocks ?? []) {
    if (block?.kind === "rows" && wantsRows && Array.isArray((block as HarsoOutputRowsBlock).items)) {
      const { items, total_count } = block as HarsoOutputRowsBlock;
      if (++rowBlocks > 1 || !items.every(item => item && typeof item.label === "string" && rowStatusOk(item.status))) return undefined;
      parts.rows = items;
      if (Number.isInteger(total_count) && total_count! > items.length) parts.total = total_count;
    } else if (block?.kind === "text" && wantsText && Array.isArray((block as HarsoOutputTextBlock).sections)) {
      parts.texts.push(block as HarsoOutputTextBlock);
    } else if (block?.kind === "action") {
      parts.actions.push(block as HarsoOutputActionBlock);
    } else return undefined;
  }
  if (wantsRows ? !parts.rows.length : !parts.texts.some(text => text.sections.length || text.summary)) return undefined;
  return parts;
}

/** Only an open_url the host can open survives; Send, Mark done, work and routine controls and replies are dropped. */
const linksOnly = (blocks: HarsoOutputActionBlock[]): HarsoOutputActionBlock[] => blocks.flatMap(block => {
  const keep = (spec: HarsoOutputActionBlock["primary"]) => (spec as { kind?: string } | undefined)?.kind === "open_url" ? spec : undefined;
  const primary = keep(block.primary), secondary = keep(block.secondary);
  return primary || secondary ? [{ kind: "action" as const, primary, secondary }] : [];
});

// ---- pieces ----

function Sender({ row, renderBrand, always }: { row: HarsoOutputRow; renderBrand: V6RenderBrand; always: boolean }) {
  // A task title is not a sender: a deadline row gets a mark only when the source named a brand, and its letter tile
  // comes from that brand's name, not from the task.
  if (!always && !row.brand) return null;
  const label = always ? row.label : row.brand!.split(".")[0];
  return <span className="hkc-mail-mark"><V6Brand domain={row.brand ?? ""} label={label} renderBrand={renderBrand} /></span>;
}

function RowLink({ row, host }: { row: HarsoOutputRow; host: V6Host }) {
  const action = readAction(row.action, host);
  return action ? <Button variant="ghost" size="small" className="hkc-mail-open" onClick={action.run}>{action.label}</Button> : null;
}

function Due({ row, urgency }: { row: HarsoOutputRow; urgency?: MailUrgency }) {
  const exact = utcMs(row.due_at) === undefined ? undefined : row.due_at;
  const words = row.trailing ?? (exact ? dueWords(exact) : undefined);
  if (!words) return null;
  return <p className="hkc-mail-dueline">
    <time className="hkc-mail-due" dateTime={exact} data-urgency={urgency}>{words}</time>
    {urgency && <span className="hkc-mail-due-note">{URGENCY_NOTE[urgency]}</span>}
  </p>;
}

function InboxRow({ row, host, renderBrand, compact }: { row: HarsoOutputRow; host: V6Host; renderBrand: V6RenderBrand; compact?: boolean }) {
  const unread = row.unread === true, important = row.status != null && IMPORTANT.has(row.status);
  return <li className="hkc-mail-row" data-mail-row="" data-row-id={row.id} data-unread={unread || undefined} data-important={important || undefined} data-compact={compact || undefined}>
    <span className="hkc-mail-lead">
      {unread && <i className="hkc-mail-unread" data-unread-dot="" aria-hidden="true" />}
      <Sender row={row} renderBrand={renderBrand} always />
    </span>
    <div className="hkc-mail-text">
      <p className="hkc-mail-sender">
        <span className="hkc-mail-name">{row.label}</span>
        {unread && <span className="hk-sr-only">Unread</span>}
        <HarsoOutputRowStatus status={row.status} status_label={row.status_label} />
      </p>
      {row.secondary && <p className="hkc-mail-secondary">{row.secondary}</p>}
      {!compact && <Due row={row} />}
    </div>
    {!compact && <RowLink row={row} host={host} />}
  </li>;
}

function DeadlineRow({ row, host, renderBrand, asOf, compact }: { row: HarsoOutputRow; host: V6Host; renderBrand: V6RenderBrand; asOf?: string; compact?: boolean }) {
  const urgency = mailDueUrgency(row.due_at, asOf);
  return <li className="hkc-mail-row" data-mail-row="" data-row-id={row.id} data-urgency={urgency} data-compact={compact || undefined}>
    <div className="hkc-mail-text">
      <p className="hkc-mail-title">{row.label}</p>
      <Due row={row} urgency={urgency} />
      {!compact && row.secondary && <p className="hkc-mail-secondary">{row.secondary}</p>}
      {row.status && <p className="hkc-mail-sender"><HarsoOutputRowStatus status={row.status} status_label={row.status_label} /></p>}
    </div>
    {!compact && <Sender row={row} renderBrand={renderBrand} always={false} />}
    {!compact && <RowLink row={row} host={host} />}
  </li>;
}

function Section({ section }: { section: HarsoOutputTextSection }): ReactNode {
  return <>
    {section.heading && <h3 className="hkc-mail-paper-heading">{section.heading}</h3>}
    {section.paragraphs?.map((text, index) => <p key={index} className="hkc-mail-paper-line">{text}</p>)}
    {!!section.bullets?.length && <ul className="hkc-mail-paper-list">{section.bullets.map((text, index) => <li key={index}>{text}</li>)}</ul>}
  </>;
}

/** The draft, whole: summary, then every section's heading, paragraphs and bullets in the order the document gave. */
function Draft({ texts }: { texts: HarsoOutputTextBlock[] }) {
  return <div className="hkc-mail-paper">
    {texts.map((text, block) => <div key={block} className="hkc-mail-paper-block">
      {text.summary && <p className="hkc-mail-paper-summary">{text.summary}</p>}
      {text.sections.map((section, index) => <Section key={index} section={section} />)}
    </div>)}
  </div>;
}

/** "Already passed" and its like: one closed disclosure per section, every word in the DOM. */
function Passed({ texts }: { texts: HarsoOutputTextBlock[] }) {
  return <>{texts.flatMap((text, block) => [
    text.summary ? <p key={`${block}s`} className="hkc-mail-note">{text.summary}</p> : null,
    ...text.sections.map((section, index) => <details key={`${block}-${index}`} className="hkc-mail-passed">
      <summary>{section.heading ?? "More"}</summary>
      <div className="hkc-mail-passed-body">{section.heading ? <Section section={{ ...section, heading: undefined }} /> : <Section section={section} />}</div>
    </details>)
  ])}</>;
}

// ---- the family ----

function renderFamily(props: V6FamilyProps): ReactNode | undefined {
  const { document, mode, widgetSize, host, renderBrand, onOpenDetails } = props;
  const template = document.template;
  if (template !== "inbox-brief" && template !== "deadlines-from-mail" && template !== "reply-draft") return undefined;
  if (widgetSize && !SIZES[template]?.includes(widgetSize)) return undefined;
  const parts = readParts(document, template);
  if (!parts) return undefined;
  const widget = widgetSize !== undefined;
  const asOf = document.as_of;
  const rows = widget ? parts.rows.slice(0, widgetSize === "small" ? 1 : MEDIUM_ROWS) : parts.rows;
  const rowView = (row: HarsoOutputRow, index: number) => template === "inbox-brief"
    ? <InboxRow key={row.id ?? index} row={row} host={host} renderBrand={renderBrand} compact={widget} />
    : <DeadlineRow key={row.id ?? index} row={row} host={host} renderBrand={renderBrand} asOf={asOf} compact={widget} />;
  const links = widget ? [] : linksOnly(parts.actions);

  // A pinned tile opens the card through its title and carries no Details toggle of its own.
  const body = <div className="hkc-mail-body" data-widget={widgetSize} data-template={template}>
    {template === "reply-draft"
      ? <Draft texts={parts.texts} />
      : <ul className="hkc-mail-rows" aria-label={document.header.title}>{rows.map(rowView)}</ul>}
    {!widget && parts.total !== undefined && <p className="hkc-mail-missing">Showing {parts.rows.length} of {parts.total}</p>}
    {!widget && template === "deadlines-from-mail" && <Passed texts={parts.texts} />}
    {links.map((block, index) => <div key={index} className="hkc-mail-links"><HarsoOutputActionRow block={block} host={host} /></div>)}
  </div>;

  return <V6Frame document={widget ? { ...document, details: undefined } : document} mode={widget ? "inline" : mode} host={host}
    onOpenDetails={widget ? undefined : onOpenDetails} renderBrand={renderBrand} className={`hkc-mail hkc-mail--${template}`}>
    {body}
  </V6Frame>;
}

export const family: V6Family = {
  renderFamily,
  supportedWidgetSizes: template => SIZES[template] ?? []
};
