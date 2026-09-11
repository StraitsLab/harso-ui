import { useState } from "react";
import { Checkbox, Select, InlineCitation, InlineCitationCard, InlineCitationCardBody, InlineCitationCardTrigger, InlineCitationCarousel, InlineCitationCarouselContent, InlineCitationCarouselHeader, InlineCitationCarouselIndex, InlineCitationCarouselItem, InlineCitationCarouselNext, InlineCitationCarouselPrev, InlineCitationQuote, InlineCitationSource, InlineCitationText } from "@harso/ui";
import type { ExampleState } from "./examples";

export const inlineCitationExports = ["InlineCitation"] as const;
export type InlineCitationExport = typeof inlineCitationExports[number];
export const inlineCitationNotes = { InlineCitation: { behavior: "A host-supplied source pill that reveals citation details on hover or focus. Sources remain explicit links and quotes remain text; no fetching or citation authority is added.", example: '<InlineCitation><InlineCitationText>Claim</InlineCitationText><InlineCitationCard><InlineCitationCardTrigger sources={[url]} /><InlineCitationCardBody>...</InlineCitationCardBody></InlineCitationCard></InlineCitation>' } };
const sources = [{ title: "Research overview", url: "https://example.com/research", quote: "Evidence supplied by the host." }, { title: "Project report", url: "https://example.com/report", quote: "The project report provides a second perspective." }];

export function InlineCitationExample({ state }: { state: ExampleState }) {
  const [hold, setHold] = useState(false);
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState("ready");
  const disabled = locked || state === "disabled";
  const current = state === "error" ? "error" : data;
  return <div className="hkl-example-stack">
    <div className="hkl-example-row"><label>Citation data<Select aria-label="Citation data" value={data} onChange={event => setData(event.target.value)}>{["ready", "empty", "loading", "error"].map(value => <option key={value}>{value}</option>)}</Select></label><Checkbox label="Hold citation navigation" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable citation" checked={locked} onChange={event => setLocked(event.target.checked)} /></div>
    {current !== "ready" ? <p role="status">{current === "empty" ? "No sources supplied." : current === "loading" ? "Sources are loading." : "Sources unavailable."}</p> : <div className="hkl-inline-citation-example">
      {state === "long-content" ? "A longer generated claim keeps its inline source reference readable across narrow layouts " : "The model-generated claim is supported by "}
      <InlineCitation><InlineCitationText>research</InlineCitationText><InlineCitationCard open={disabled ? false : undefined}>
        <InlineCitationCardTrigger sources={sources.map(source => source.url)} disabled={disabled} />
        <InlineCitationCardBody><InlineCitationCarousel><InlineCitationCarouselHeader>
          <InlineCitationCarouselPrev onClick={event => { if (hold) event.preventDefault(); }} /><InlineCitationCarouselIndex /><InlineCitationCarouselNext onClick={event => { if (hold) event.preventDefault(); }} />
        </InlineCitationCarouselHeader><InlineCitationCarouselContent>{sources.map(source => <InlineCitationCarouselItem key={source.url}><InlineCitationSource title={source.title} url={source.url} description="A concise source summary." /><InlineCitationQuote>{source.quote}</InlineCitationQuote></InlineCitationCarouselItem>)}</InlineCitationCarouselContent></InlineCitationCarousel></InlineCitationCardBody>
      </InlineCitationCard></InlineCitation>
    </div>}
  </div>;
}
