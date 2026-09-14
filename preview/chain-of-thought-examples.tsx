import { useState } from "react";
import { Button, Checkbox, Select, ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtImage, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults, ChainOfThoughtStep } from "@harso/ui";
import type { ExampleState } from "./examples";
export const chainOfThoughtExports = ["ChainOfThought"] as const;
export type ChainOfThoughtExport = typeof chainOfThoughtExports[number];
export const chainOfThoughtNotes = { ChainOfThought: { behavior: "A compact, conversation-scoped reasoning disclosure. Step state is supplied by the host; opening it never starts, stops, retries or stores execution.", example: '<ChainOfThought open={open} onOpenChange={setOpen}><ChainOfThoughtHeader /><ChainOfThoughtContent><ChainOfThoughtStep label="Search" status="complete" /><ChainOfThoughtSearchResults><ChainOfThoughtSearchResult>Docs</ChainOfThoughtSearchResult></ChainOfThoughtSearchResults></ChainOfThoughtContent></ChainOfThought>' } };
export function ChainOfThoughtExample({ state }: { state: ExampleState }) {
  const [open, setOpen] = useState(true);
  const [hold, setHold] = useState(false);
  const [localDisabled, setLocalDisabled] = useState(false);
  const [snapshot, setSnapshot] = useState("default");
  const [request, setRequest] = useState("");
  const disabled = state === "disabled" || localDisabled;
  const requestOpen = (next: boolean) => {
    setRequest(`Requested: ${next ? "open" : "closed"}`);
    if (!hold) setOpen(next);
  };
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><p>Authored sample work summaries, not hidden model reasoning. The host supplies each snapshot. Changing this local example never starts work, fetches data or retries anything.</p>
    <label>Supplied summary state<Select value={snapshot} onChange={event => setSnapshot(event.target.value)}>
      <option value="default">Supplied progress</option><option value="empty">Empty</option><option value="loading">Host loading</option><option value="error">Host error</option><option value="replacement">Replacement summary</option>
    </Select></label>
    <Checkbox label="Disable disclosure controls" checked={localDisabled} onChange={event => setLocalDisabled(event.target.checked)} />
    <Checkbox label="Hold disclosure state" checked={hold} onChange={event => setHold(event.target.checked)} />
    <Button size="small" disabled={disabled} onClick={() => requestOpen(!open)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7"/></svg>{open ? "Close supplied summary" : "Open supplied summary"}</Button>
    <output aria-label="Disclosure request">{request}</output></div>
    <ChainOfThought open={open} onOpenChange={requestOpen}>
      <ChainOfThoughtHeader disabled={disabled}>Supplied work summary</ChainOfThoughtHeader>
      <ChainOfThoughtContent aria-busy={snapshot === "loading"}>
        {snapshot === "empty" ? <p>No work summary supplied.</p> : snapshot === "loading" ? <ChainOfThoughtStep label="Waiting for the supplied summary" description="The host reports loading; this disclosure does not own a request." status="active" /> : snapshot === "error" ? <>
          <p role="alert">The host could not supply a work summary. No retry is started here.</p>
          <ChainOfThoughtStep label="Summary unavailable" description="Error feedback belongs to the host, not a new step status." status="pending" />
        </> : snapshot === "replacement" ? <ChainOfThoughtStep label="Replacement work summary" description="A new host-supplied result replaces the prior sample." status="complete" /> : <>
          <ChainOfThoughtStep label="Read the supplied work state" status="complete" />
          <ChainOfThoughtStep label="Assemble the result" description="Progress is supplied by the host." status="active" />
          <ChainOfThoughtSearchResults><ChainOfThoughtSearchResult>Harso</ChainOfThoughtSearchResult><ChainOfThoughtSearchResult>Vercel reference</ChainOfThoughtSearchResult></ChainOfThoughtSearchResults>
          {state === "long-content" && <ChainOfThoughtImage caption="Host-supplied reference image">No image supplied</ChainOfThoughtImage>}
        </>}
      </ChainOfThoughtContent>
    </ChainOfThought>
  </div>;
}
