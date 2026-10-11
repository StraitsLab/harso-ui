"use client";

import type { ReactNode } from "react";
import { isHttps, readAction, type HarsoOutputActionHost, type HarsoOutputDocument, type HarsoOutputSource, type HarsoOutputTextBlock } from "../output-card";
import { V6Brand, V6Frame } from "./frame";
import type { V6Family, V6FamilyProps, V6RenderBrand } from "./types";
import "./research.css";

/*
 * WEV-3324 (P08): research-brief. The answer is the way in: the title is the one open target. It opens the document's
 * own artifact in the host's reader, or the full answer when there is none. No View all, no Open document.
 * Source marks come from details.sources: the host's bundled mark for the site, else a letter tile. Nothing is fetched.
 */

const MAX_MARKS = 4;
const isText = (block: { kind: string }): block is HarsoOutputTextBlock => block.kind === "text" && Array.isArray((block as HarsoOutputTextBlock).sections);

/** The site a source points at; undefined for a missing or non-https link, which gets a letter tile. */
const siteOf = (url?: string) => {
  if (!isHttps(url)) return undefined;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return undefined; }
};

/** The brief this family can draw whole, or undefined so the generic card draws every block. */
function readBrief(document: HarsoOutputDocument, host: HarsoOutputActionHost) {
  const texts = document.blocks.filter(isText);
  if (texts.length !== 1) return undefined;
  let open: (() => void) | undefined;
  for (const block of document.blocks) {
    if (isText(block)) continue;
    if (block.kind !== "action") return undefined;
    for (const spec of [(block as { primary?: unknown }).primary, (block as { secondary?: unknown }).secondary]) {
      if (spec === undefined) continue;
      if ((spec as { kind?: unknown }).kind !== "open_artifact") return undefined; // would be dropped
      open ??= readAction(spec, host)?.run;
    }
  }
  const [text] = texts;
  if (text.sections.some(section => section.date || section.thumbnail)) return undefined; // a fact this card does not draw
  return { summary: text.summary, sections: text.sections, open, sources: document.details?.sources ?? [] };
}

function Marks({ sources, renderBrand }: { sources: HarsoOutputSource[]; renderBrand: V6RenderBrand }) {
  const seen = new Set<string>();
  const marks = sources.flatMap((source, index) => {
    const site = siteOf(source.url), key = site ?? `#${index}`;
    return seen.has(key) ? [] : (seen.add(key), [<V6Brand key={key} domain={site ?? ""} label={source.label} renderBrand={renderBrand} />]);
  }).slice(0, MAX_MARKS);
  return <div className="hkc-research-sources">
    <span className="hkc-research-stack" aria-hidden="true">{marks}</span>
    <span>{sources.length} {sources.length === 1 ? "source" : "sources"}</span>
  </div>;
}

function Source({ source, onOpenUrl, renderBrand }: { source: HarsoOutputSource; onOpenUrl?: (url: string) => void; renderBrand: V6RenderBrand }) {
  const site = siteOf(source.url);
  const inner = <>
    <V6Brand domain={site ?? ""} label={source.label} renderBrand={renderBrand} />
    <span className="hkc-research-source-text">
      <span className="hkc-research-source-label">{source.label}</span>
      {site && <span className="hkc-research-source-site">{site}</span>}
    </span>
  </>;
  // A button, never an href: the host decides every open. No callback, no control.
  return <li>{onOpenUrl && isHttps(source.url)
    ? <button type="button" className="hkc-research-source" onClick={() => onOpenUrl(source.url!)}>{inner}</button>
    : <div className="hkc-research-source">{inner}</div>}</li>;
}

function renderFamily({ document, mode, widgetSize, host, renderBrand, onOpenDetails }: V6FamilyProps): ReactNode | undefined {
  if (widgetSize && widgetSize !== "medium") return undefined;
  const brief = readBrief(document, host);
  if (!brief) return undefined;
  const { summary, sections, open, sources } = brief;
  const full = mode === "full" && !widgetSize;
  // The sources are drawn by the card or the full view, so Details keeps only the notes. A widget has no disclosure.
  const { assumptions, disclaimers } = document.details ?? {};
  const framed: HarsoOutputDocument = { ...document, details: widgetSize ? undefined : { assumptions, disclaimers } };
  return <div className="hkc-research" data-widget={widgetSize}>
    <V6Frame document={framed} mode={full ? "full" : "inline"} host={{ ...host, onViewAll: open ?? host.onViewAll }} renderBrand={renderBrand}
      onOpenDetails={onOpenDetails} openArea="card" className="hkc-research-card">
      {summary && <p className="hkc-research-summary" data-full={full || undefined}>{summary}</p>}
      {full && sections.map((section, index) => <section key={index} className="hkc-research-section">
        {section.heading && <h3>{section.heading}</h3>}
        {section.paragraphs?.map((paragraph, at) => <p key={at}>{paragraph}</p>)}
        {!!section.bullets?.length && <ul>{section.bullets.map((bullet, at) => <li key={at}>{bullet}</li>)}</ul>}
      </section>)}
      {sources.length > 0 && !full && <Marks sources={sources} renderBrand={renderBrand} />}
      {sources.length > 0 && full && <section className="hkc-research-section">
        <h3>Sources <span className="hkc-research-count">{sources.length}</span></h3>
        <ul aria-label="Sources" className="hkc-research-list">
          {sources.map((source, index) => <Source key={index} source={source} onOpenUrl={host.onOpenUrl} renderBrand={renderBrand} />)}
        </ul>
      </section>}
    </V6Frame>
  </div>;
}

export const family: V6Family = { renderFamily, supportedWidgetSizes: () => ["medium"] };
