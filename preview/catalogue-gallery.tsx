import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KitProvider } from "../src";
import { Button } from "../src/primitives";
import { HarsoOutputCard, type HarsoOutputBlock, type HarsoOutputCardCaps, type HarsoOutputDocument, type HarsoOutputTextBlock } from "../src/chat/output-card";
import index from "../catalogue/index.json";
import "./catalogue-gallery.css";

/** One catalogue example as the vertical files hold it (catalogue/<vertical>.json). */
interface CatalogueExample {
  id: string;
  kind: "card" | "file" | "text";
  request: string;
  says?: string;
  reply?: string;
  document: HarsoOutputDocument | null;
  states?: Record<string, HarsoOutputDocument>;
}
interface CatalogueFile { vertical: string; examples: CatalogueExample[] }

const files = import.meta.glob<CatalogueFile>("../catalogue/*.json", { import: "default", eager: true });
export const catalogueVerticals: string[] = index.verticals;
const examplesOf = (vertical: string) => files[`../catalogue/${vertical}.json`]?.examples ?? [];
/** Inline chat width on iPhone, and the desktop output pane. */
const WIDTHS = [390, 420];
/** A Map, not an object: a mode from the URL must be one of these keys, never an inherited one (toString, __proto__). */
const MODES = new Map<string, Array<"light" | "dark">>([["light", ["light"]], ["dark", ["dark"]], ["both", ["light", "dark"]]]);

/** `#/catalogue` → the index; `#/catalogue/<vertical>` → that vertical; anything else is not a catalogue route. */
export function catalogueRouteFromHash(): { vertical?: string; mode: string } | undefined {
  const [path, query = ""] = window.location.hash.slice(1).split("?");
  const match = /^\/catalogue(?:\/([a-z_]+))?\/?$/.exec(path);
  if (!match) return undefined;
  const mode = new URLSearchParams(query).get("mode") ?? "both";
  return { vertical: match[1], mode: MODES.has(mode) ? mode : "both" };
}

/** No inline budget: every row and number, and the text unclipped (the line cap is a CSS clamp, so a finite number). */
const UNCAPPED: HarsoOutputCardCaps = { maxRows: Infinity, maxNumbers: Infinity, maxTextChars: Infinity, maxTextLines: 10_000 };
const isText = (block: HarsoOutputBlock): block is HarsoOutputTextBlock => block.kind === "text" && Array.isArray((block as HarsoOutputTextBlock).sections);

/**
 * The whole answer for View all, drawn by the same card with its inline caps lifted. The card draws one text run, so
 * every text block's words (summary, headings, paragraphs, bullets, in order) become that one run, word for word.
 */
function wholeAnswer(document: HarsoOutputDocument): HarsoOutputDocument {
  const words = document.blocks.filter(isText).flatMap(block => [
    ...(block.summary ? [block.summary] : []),
    ...block.sections.flatMap(section => [...(section.heading ? [section.heading] : []), ...section.paragraphs ?? [], ...section.bullets ?? []]),
  ]);
  const firstText = document.blocks.findIndex(isText);
  const blocks = document.blocks.flatMap((block, index): HarsoOutputBlock[] => !isText(block) ? [block]
    : index === firstText ? [{ kind: "text", sections: [{ paragraphs: words }] }] : []);
  return { ...document, blocks };
}

/** The card as the chat shows it; View all opens the whole answer in place, Show less or Escape closes it. */
function Answer({ example, document }: { example: CatalogueExample; document: HarsoOutputDocument | null }) {
  const [open, setOpen] = useState(false);
  const cell = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);
  useLayoutEffect(() => {
    if (open) cell.current?.querySelector<HTMLElement>(".hkl-cat-full")?.focus();
    else if (returnFocus.current) cell.current?.querySelector<HTMLElement>(".hkc-output-card-view-all")?.focus();
    returnFocus.current = false;
  }, [open]);
  const close = () => { returnFocus.current = true; setOpen(false); };
  if (!document) return <div className="hkl-cat-cell"><p className="hkl-cat-reply">{example.reply}</p></div>;
  return <div className="hkl-cat-cell" ref={cell}>
    {open
      ? <div className="hkl-cat-full" role="region" aria-label={`${document.header.title}, full answer`} tabIndex={-1}
        onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
        <HarsoOutputCard document={wholeAnswer(document)} caps={UNCAPPED} onViewAll={close} />
        <Button variant="ghost" size="small" className="hkl-cat-less" onClick={close}>Show less</Button>
      </div>
      : <HarsoOutputCard document={document} onViewAll={() => setOpen(true)} />}
  </div>;
}

/** One example: its request above; the answer at each width in each appearance; each state below. */
function ExampleRow({ example, modes }: { example: CatalogueExample; modes: Array<"light" | "dark"> }) {
  const rows: Array<[string, HarsoOutputDocument | null]> = [["", example.document], ...Object.entries(example.states ?? {})];
  return <article className="hkl-cat-example" data-example={example.id}>
    <header className="hkl-cat-request">
      <p className="hkl-cat-asked">{example.request}</p>
      <p className="hkl-cat-meta">{example.id} · {example.kind}{example.says ? ` · “${example.says}”` : ""}</p>
    </header>
    {rows.map(([state, document]) => <div key={state || "answer"} className="hkl-cat-state" data-state={state || undefined}>
      {state && <p className="hkl-cat-state-name">{state}</p>}
      <div className="hkl-cat-grid">
        {modes.flatMap(mode => WIDTHS.map(width => <KitProvider key={`${mode}-${width}`} appearance={mode}
          className="hkl-cat-frame" style={{ width }} data-width={width}>
          <Answer example={example} document={document} />
        </KitProvider>))}
      </div>
    </div>)}
  </article>;
}

export function CataloguePage({ vertical, mode }: { vertical?: string; mode: string }) {
  const modes = MODES.get(mode) ?? MODES.get("both")!;
  const known = vertical === undefined || catalogueVerticals.includes(vertical);
  useEffect(() => { document.title = `${vertical ? `${vertical} · ` : ""}Catalogue · Harso`; }, [vertical]);
  return <KitProvider appearance={modes.length === 1 ? modes[0] : "light"} className="hkl-cat-root">
    <header className="hkl-cat-header">
      <a className="hkl-chat-wordmark" href="#/catalogue">Harso<span>/</span>catalogue</a>
      {vertical && <h1 className="hkl-cat-title">{vertical}</h1>}
    </header>
    <main className="hkl-cat-stage" data-testid="catalogue" data-vertical={vertical}>
      {!known && <p>No vertical named {vertical}.</p>}
      {vertical === undefined && <ul className="hkl-cat-index">
        {catalogueVerticals.map(name => <li key={name}>
          <a href={`#/catalogue/${name}`}>{name}</a> <span className="hkl-cat-count">{examplesOf(name).length}</span>
        </li>)}
      </ul>}
      {vertical && known && examplesOf(vertical).map(example => <ExampleRow key={example.id} example={example} modes={modes} />)}
    </main>
  </KitProvider>;
}
