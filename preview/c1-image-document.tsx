import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KitProvider } from "../src/theme";
import { Button } from "../src/primitives";
import { HarsoOutputDetail, type HarsoOutputAction, type HarsoOutputPreviewState } from "../src/chat/output-detail";
import { HarsoWorkResult } from "../src/chat/work-result";
import "../src/primitives.css";
import "./c1-image-document.css";
import artwork from "./c1-original-art.png";

const query = new URLSearchParams(location.search);
const initialPreview = (query.get("preview") ?? "ready") as HarsoOutputPreviewState;
const initialAction = query.get("action") ?? "ready";

function Fixture() {
  const [kind, setKind] = useState<"image" | "document">(query.get("kind") === "document" ? "document" : "image");
  const [appearance, setAppearance] = useState<"light" | "dark">(query.get("mode") === "dark" ? "dark" : "light");
  const [previewState, setPreviewState] = useState(initialPreview);
  const [downloadState, setDownloadState] = useState(initialAction);
  const [counts, setCounts] = useState({ download: 0, expand: 0, openExternally: 0, close: 0, escape: 0, origin: 0 });
  const count = (key: keyof typeof counts) => setCounts(value => ({ ...value, [key]: value[key] + 1 }));
  const capability = (key: "download" | "expand" | "openExternally"): HarsoOutputAction | undefined => {
    if (initialAction === "omitted") return undefined;
    const state = key === "download" ? downloadState : initialAction === "disabled" || initialAction === "pending" ? initialAction : "ready";
    return {
      enabled: state !== "disabled", pending: state === "pending",
      unavailableReason: state === "disabled" ? "Host capability unavailable in this simulated fixture." : undefined,
      error: state === "error" ? "Could not download. Your preview is still here." : undefined,
      onInvoke: () => { count(key); if (key === "download") setDownloadState("pending"); },
    };
  };
  const long = query.has("long");
  const title = query.has("stress") ? "MeaningfulVeryLongTitle".repeat(30) : long ? "A very long output title with meaningful words — " + "unbrokenfilename".repeat(8) : kind === "image" ? "Blue and yellow" : "Colour note";
  const content = kind === "image"
    ? <img src={artwork} width={320} height={200} alt="A yellow rectangle centred on a blue background" />
    : <article className="c1-document">
      <h3>Blue and yellow</h3>
      <p className="c1-deck"><strong>A simple study in contrast.</strong></p>
      <p>Blue sets the background. A yellow rectangle sits at the centre, giving the composition one clear focal point.</p>
      <div role="region" aria-label="Colour table" tabIndex={0} className="c1-table-scroll"><table>
        <thead><tr><th scope="col">Element</th><th scope="col">Colour</th></tr></thead>
        <tbody><tr><td>Background</td><td>Blue</td></tr><tr><td>Rectangle</td><td>Yellow</td></tr></tbody>
      </table></div>
      {query.has("tall") && Array.from({ length: 16 }, (_, index) => <p key={index}>Additional document paragraph {index + 1}. Real documents grow naturally without clipped text.</p>)}
    </article>;
  return <KitProvider appearance={appearance} className="c1-fixture">
    <main onKeyDown={event => { if (event.key === "Escape") count("escape"); }}>
      <div className="c1-pane" data-testid="pane">
        <HarsoOutputDetail contentKey={kind} title={title} kind={kind} previewState={previewState}
          content={previewState === "ready" ? content : null} actions={{ download: capability("download"), expand: capability("expand"), openExternally: capability("openExternally") }}
          onClose={() => count("close")}
          details={<div className="c1-details-content"><h3>Details</h3><dl>
            <div><dt>File</dt><dd>{kind === "image" ? "blue-and-yellow.png" : "colour-note.md"}</dd></div>
            <div><dt>Source</dt><dd>Created in this chat, alongside the matching colour note.</dd></div>
            <div><dt>Simulated content</dt><dd>Local artwork and semantic document fixture. No real download, host expansion, native open or provenance claim.</dd></div>
          </dl><Button onClick={() => count("origin")}>Go to conversation</Button>
            {query.has("stress") && Array.from({ length: 80 }, (_, index) => <p key={index}>Long metadata row {index}</p>)}
          </div>} />
      </div>
      <section className="c1-controls" aria-label="Simulated fixture controls">
        <h1>C1 image/document — simulated content</h1>
        <HarsoWorkResult title="Two outputs" status="succeeded" summaryContent={<p>A small study in contrast, with a matching note.</p>}
          artifacts={[{ id: "legacy", name: "Legacy row must be replaced" }]}
          artifactContent={<div className="c1-selector"><Button aria-pressed={kind === "image"} variant={kind === "image" ? "primary" : "quiet"} onClick={() => setKind("image")}>Image</Button><Button aria-pressed={kind === "document"} variant={kind === "document" ? "primary" : "quiet"} onClick={() => setKind("document")}>Colour note</Button></div>} />
        <div className="c1-fixture-actions">
          <Button onClick={() => setAppearance(value => value === "light" ? "dark" : "light")}>Switch appearance</Button>
          <Button onClick={() => setDownloadState("error")}>Simulate download failure</Button>
          <Button onClick={() => setDownloadState("ready")}>Reset download</Button>
          <Button onClick={() => setPreviewState(value => value === "loading" ? "ready" : "loading")}>Toggle preview loading</Button>
        </div>
        <output aria-label="Fixture callback counts">{JSON.stringify(counts)}</output>
      </section>
    </main>
  </KitProvider>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
