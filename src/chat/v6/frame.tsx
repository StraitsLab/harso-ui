"use client";

import { CaretRight } from "@phosphor-icons/react";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "../../primitives";
import { DetailsContent, HarsoOutputCardMeta, hasDetails, type HarsoOutputDocument } from "../output-card";
import type { V6Host, V6Mode, V6RenderBrand } from "./types";
import "./frame.css";

/*
 * WEV-3303: the common frame every v6 family draws through, so a family writes its character and not its chrome.
 * It supplies the header (brand mark, title, subtitle, snapshot line), the open target, a trailing area, Details and the
 * Escape rule. It reuses the generic card's classes and tokens, so a family card sits in the same surface.
 *
 * Interactive layout: the open target is the title's own button and the trailing area is its SIBLING, never inside it.
 * A button holding buttons is not legal, so no part of the frame wraps another in one.
 */

/** A lowercase public DNS host name: dotted labels, a letter-first last label, at most 253 characters. No scheme, path, IP or credentials. */
const HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const isBrandDomain = (domain: unknown): domain is string => typeof domain === "string" && HOST.test(domain);

/**
 * A company mark: whatever the host's bundled lookup draws for the domain, else a letter tile. The kit loads nothing
 * itself, and a domain that is not a plain host name never reaches the host. Decorative: the name is always in the text.
 */
export function V6Brand({ domain, label, renderBrand, className = "" }: { domain: string; label: string; renderBrand?: V6RenderBrand; className?: string }) {
  const mark = isBrandDomain(domain) ? renderBrand?.({ domain, label }) : undefined;
  const letter = Array.from(label.trim())[0]?.toLocaleUpperCase() ?? "";
  return <span className={`hkc-v6-brand ${className}`.trim()} aria-hidden="true" data-mark={mark == null ? "letter" : "host"}>{mark ?? letter}</span>;
}

/** The subtitle already gives the snapshot time in the person's words ("· as of 09:00"): V6 shows it once, there. */
const saysWhen = (subtitle: string | undefined) => /\bas of\b/i.test(subtitle ?? "");

export interface V6FrameProps {
  document: HarsoOutputDocument;
  mode: V6Mode;
  host: V6Host;
  /** When the host can open Details elsewhere (a pane), the toggle hands off; otherwise Details discloses inline. */
  onOpenDetails?: () => void;
  renderBrand?: V6RenderBrand;
  /** The header's trailing area: an action or menu. A sibling of the open target, drawn only when there is something in it. */
  trailing?: ReactNode;
  /** Where the open target reaches: the header (default) or the whole card. Either way it is one button. */
  openArea?: "header" | "card";
  className?: string;
  children?: ReactNode;
}

export function V6Frame({ document, mode, host, onOpenDetails, renderBrand, trailing, openArea = "header", className = "", children }: V6FrameProps) {
  const id = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  // V6 (WEV-3469): an inline card is a glance; its sources and assumptions live in the opened card, never a header button.
  const details = mode === "full" && hasDetails(document.details) ? document.details : undefined;
  const inlineDetails = details && !onOpenDetails;
  const titleId = `${id}-title`, detailsId = `${id}-details`;
  const { brand, title, subtitle } = document.header;
  const hasTrailing = !!trailing || !!details;

  return <section className={`hkc-output-card hkc-v6-frame ${className}`.trim()} aria-labelledby={titleId} data-open-area={openArea} data-mode={mode}
    onKeyDown={event => {
      if (event.key !== "Escape" || !detailsOpen) return;
      event.stopPropagation();
      setDetailsOpen(false);
      toggle.current?.focus();
    }}>
    <header className="hkc-output-card-header hkc-v6-header">
      {brand && <V6Brand domain={brand} label={title} renderBrand={renderBrand} />}
      <div className="hkc-output-card-heading">
        <h2 id={titleId} className="hkc-output-card-title">
          {mode === "inline"
            ? <button type="button" className="hkc-v6-open" onClick={host.onViewAll}>{title}<CaretRight className="hkc-v6-open-glyph" size={14} weight="bold" aria-hidden="true" /></button>
            : title}
        </h2>
        {subtitle && <p className="hkc-output-card-subtitle">{subtitle}</p>}
        <HarsoOutputCardMeta document={saysWhen(subtitle) ? { ...document, as_of: undefined } : document} />
      </div>
      {hasTrailing && <div className="hkc-v6-trailing" data-slot="trailing">
        {trailing}
        {details && <Button ref={toggle} variant="ghost" size="small" className="hkc-output-card-details-toggle"
          aria-expanded={inlineDetails ? detailsOpen : undefined} aria-controls={inlineDetails ? detailsId : undefined}
          onClick={() => onOpenDetails ? onOpenDetails() : setDetailsOpen(open => !open)}>Details</Button>}
      </div>}
    </header>
    {inlineDetails && <div id={detailsId} className="hkc-output-card-details" role="region" aria-label="Output details" hidden={!detailsOpen}>
      <DetailsContent details={details} onOpenUrl={host.onOpenUrl} />
    </div>}
    {children}
  </section>;
}
