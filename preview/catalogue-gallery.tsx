import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KitProvider } from "../src";
import { Button } from "../src/primitives";
import { HARSO_OUTPUT_CARD_UNCAPPED, HarsoOutputCard, harsoOutputWholeAnswer, type HarsoOutputCardProps, type HarsoOutputDocument } from "../src/chat/output-card";
import index from "../catalogue/index.json";
import { sampleArtifact, sampleTile } from "./sample-image";
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

type Host = Pick<HarsoOutputCardProps, "onOpenUrl" | "onOpenArtifact" | "onDownloadArtifact" | "onWorkControl" | "onRoutineControl" | "media">;
/**
 * The gallery stands in for the app: every action a reviewer presses is logged and flashed as what the app would do.
 * Nothing opens, downloads or controls anything here.
 */
function galleryHost(say: (text: string) => void): Host {
  const tell = (text: string) => { console.info(`[catalogue] ${text}`); say(text); };
  return {
    onOpenUrl: url => tell(`Would open ${url}`),
    onOpenArtifact: artifact => tell(`Would open ${artifact}`),
    onDownloadArtifact: artifact => tell(`Would download ${artifact}`),
    onWorkControl: (control, id) => tell(`Would ${control} work ${id}`),
    onRoutineControl: (control, id) => tell(`Would ${control} routine ${id}`),
    // Photos and map tiles are local drawings (deterministic, offline): the app resolves real files and tiles.
    media: { resolveArtifact: sampleArtifact, mapTile: sampleTile }
  };
}

/** The card as the chat shows it; View all opens the whole answer in place, Show less or Escape closes it. */
function Answer({ example, document }: { example: CatalogueExample; document: HarsoOutputDocument | null }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const [host] = useState(() => galleryHost(setFlash));
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(""), 2400);
    return () => clearTimeout(timer);
  }, [flash]);
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
        <HarsoOutputCard document={harsoOutputWholeAnswer(document)} caps={HARSO_OUTPUT_CARD_UNCAPPED} onViewAll={close} {...host} />
        <Button variant="ghost" size="small" className="hkl-cat-less" onClick={close}>Show less</Button>
      </div>
      : <HarsoOutputCard document={document} onViewAll={() => setOpen(true)} {...host} />}
    <p className="hkl-cat-flash" role="status">{flash}</p>
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
