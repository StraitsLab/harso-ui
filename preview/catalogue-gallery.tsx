import { useEffect } from "react";
import { KitProvider, type Appearance } from "../src";
import { HarsoOutputCard, type HarsoOutputDocument } from "../src/chat/output-card";
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
const MODES: Record<string, Array<"light" | "dark">> = { light: ["light"], dark: ["dark"], both: ["light", "dark"] };

/** `#/catalogue` → the index; `#/catalogue/<vertical>` → that vertical; anything else is not a catalogue route. */
export function catalogueRouteFromHash(): { vertical?: string; mode: string } | undefined {
  const [path, query = ""] = window.location.hash.slice(1).split("?");
  const match = /^\/catalogue(?:\/([a-z_]+))?\/?$/.exec(path);
  if (!match) return undefined;
  const mode = new URLSearchParams(query).get("mode") ?? "both";
  return { vertical: match[1], mode: mode in MODES ? mode : "both" };
}

const ignore = () => {};

function Answer({ example, document }: { example: CatalogueExample; document: HarsoOutputDocument | null }) {
  return <div className="hkl-cat-cell">
    {document
      ? <HarsoOutputCard document={document} onViewAll={ignore} />
      : <p className="hkl-cat-reply">{example.reply}</p>}
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
        {modes.flatMap(mode => WIDTHS.map(width => <KitProvider key={`${mode}-${width}`} appearance={mode as Appearance}
          className="hkl-cat-frame" style={{ width }} data-width={width}>
          <Answer example={example} document={document} />
        </KitProvider>))}
      </div>
    </div>)}
  </article>;
}

export function CataloguePage({ vertical, mode }: { vertical?: string; mode: string }) {
  const modes = MODES[mode];
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
