import { useState } from "react";
import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools, Artifact, ArtifactAction, ArtifactActions, ArtifactClose, ArtifactContent, ArtifactDescription, ArtifactHeader, ArtifactTitle, Badge, Button, Checkbox, Field, Input, MessageResponse, Select, Source, Sources, SourcesContent, SourcesTrigger, Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolState } from "@harso/ui";
import type { ExampleState } from "./examples";

export const activityExports = ["Tool", "Agent", "Artifact", "Sources"] as const;
export type ActivityExport = typeof activityExports[number];
export const activityNotes: Record<ActivityExport, { behavior: string; example: string }> = {
  Tool: { behavior: "One quiet row for a supplied tool call, with seven readable states. Approval remains visible when collapsed. Status never opens the row or replaces your notes. JSON is plain text; shared syntax highlighting is still pending. This is presentation, not an SDK transport or executor.", example: '<Tool><ToolHeader type="tool-search" state="approval-requested" /><ToolContent><ToolInput input={input} /><ToolOutput output={result} errorText={error} /></ToolContent></Tool>' },
  Agent: { behavior: "Agent configuration, not a running-agent monitor. Instructions use our safe Markdown renderer; one supplied tool descriptor expands at a time, with host-owned selection. No tool executes and no schema is evaluated. Plain schema display is implemented; syntax highlighting is still pending.", example: '<Agent><AgentHeader name="Research partner" model={model} /><AgentContent><AgentInstructions>{instructions}</AgentInstructions><AgentTools><AgentTool value="search" tool={descriptor} /></AgentTools><AgentOutput schema={schemaText} /></AgentContent></Agent>' },
  Artifact: { behavior: "A result on the same continuous canvas, without a card around it. Labelled actions and tooltips reuse existing controls; closing is a request to the host, never hidden component state. Rich content is trusted host composition. CodeBlock integration remains a later composition.", example: '<Artifact><ArtifactHeader><ArtifactTitle>Research brief</ArtifactTitle><ArtifactActions><ArtifactClose onClick={requestClose} /></ArtifactActions></ArtifactHeader><ArtifactContent>{result}</ArtifactContent></Artifact>' },
  Sources: { behavior: "A compact disclosure for supplied sources. Titles and custom content are supported; only explicit absolute HTTP(S) links without credentials can navigate. No previews, images, tracking pings, referrers or automatic requests. The host owns the count, data selection and redaction.", example: '<Sources><SourcesTrigger count={sources.length} /><SourcesContent>{sources.map(source => <Source key={source.id} href={source.url} title={source.title} />)}</SourcesContent></Sources>' },
};

function ToolExample({ state }: { state: ExampleState }) {
  const [status, setStatus] = useState<ToolState>(state === "error" ? "output-error" : "input-available");
  const [open, setOpen] = useState(true);
  const [hold, setHold] = useState(false);
  const [locked, setLocked] = useState(false);
  const [updates, setUpdates] = useState(0);
  const [request, setRequest] = useState("No request sent.");
  const disabled = state === "disabled" || locked;
  const complete = status === "output-available";
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><label>Tool status<Select value={status} onChange={event => setStatus(event.target.value as ToolState)}>{["input-streaming", "input-available", "approval-requested", "approval-responded", "output-available", "output-error", "output-denied"].map(value => <option key={value}>{value}</option>)}</Select></label><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable tool controls" checked={locked} onChange={event => setLocked(event.target.checked)} /></div>
    <Tool open={open} onOpenChange={next => { setRequest(`Disclosure ${next ? "open" : "close"} requested.`); if (!hold) setOpen(next); }} disabled={disabled}>
      <ToolHeader type="dynamic-tool" toolName={state === "long-content" ? "Find firsthand observations and distinguish useful evidence from repeated assumptions" : "Gather the right evidence"} state={status} />
      <ToolContent><ToolInput input={{ query: "What makes a focused workspace feel effortless?", limit: 6 }} /><ToolOutput output={complete ? <MessageResponse>{`Found **${3 + updates} useful sources** in the synthetic sample. Keep the result close to the work, not inside another box.`}</MessageResponse> : undefined} errorText={status === "output-error" ? "The host could not reach the source. No result is available; retry remains a host decision." : undefined} /><Field label="Working notes">{control => <Input {...control} placeholder="A thought to keep…" disabled={disabled} />}</Field></ToolContent>
    </Tool>
    <div className="hk-data-footer"><span>{updates} supplied sample updates</span><div className="hk-artifact-actions"><Button onClick={() => setUpdates(value => value + 1)}>Append sample update</Button>{status === "approval-requested" && <Button variant="primary" disabled={disabled} onClick={() => setRequest("Review requested. Nothing approved or executed.")}>Review permission</Button>}</div></div><output aria-label="Activity request">{request}</output>
  </div>;
}

function AgentExample({ state }: { state: ExampleState }) {
  const [hold, setHold] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [request, setRequest] = useState("No schema request.");
  return <div className="hkl-example-stack"><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><Agent><AgentHeader name={state === "long-content" ? "A research partner for long-running questions with context that must not disappear" : "Your research partner"} model="Host-selected model" /><AgentContent>
    <AgentInstructions>{"Start with the question, not an answer.\n\n- Prefer **firsthand evidence**.\n- Keep uncertainty visible.\n- Ask before taking consequential action."}</AgentInstructions>
    <AgentTools value={selected} disabled={state === "disabled"} onValueChange={next => { setRequest("Schema visibility requested."); if (!hold) setSelected(next); }}><AgentTool value="search_evidence" tool={{ description: "Find sources worth reading", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }} /><AgentTool value="summarize_findings" tool={{ description: "Bring the useful parts together", inputSchema: { type: "object", properties: { sourceIds: { type: "array", items: { type: "string" } } } } }} disabled={state === "disabled"} /></AgentTools>
    <AgentOutput schema={'{\n  "summary": "string",\n  "sources": ["source-id"],\n  "uncertainties": ["string"]\n}'} />
  </AgentContent></Agent><output aria-label="Activity request">{request}</output></div>;
}

function ArtifactExample({ state }: { state: ExampleState }) {
  const [open, setOpen] = useState(true);
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("No artifact action.");
  const [kind, setKind] = useState("document");
  const [sample, setSample] = useState(state === "error" ? "error" : "ready");
  const disabled = state === "disabled" || sample === "disabled";
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><label>Artifact sample<Select value={sample} onChange={event => setSample(event.target.value)}>{["ready", "empty", "loading", "error", "replacement", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label><label>Artifact content<Select value={kind} onChange={event => setKind(event.target.value)}><option value="document">Document</option><option value="data">Structured result</option></Select></label><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /></div>{open ? <Artifact aria-busy={sample === "loading"}><ArtifactHeader><ArtifactTitle>{state === "long-content" ? "A quieter place to think, make decisions and keep the most important findings close" : "A quieter place to think"}</ArtifactTitle><ArtifactDescription>Research brief · Synthetic example</ArtifactDescription><ArtifactActions><ArtifactAction label="Save brief" tooltip="Request save" icon="↓" disabled={disabled} onClick={() => setRequest("Save requested. No file downloaded.")} /><ArtifactAction label="Share brief" tooltip="Request share" icon="↗" disabled={disabled} onClick={() => setRequest("Share requested. Nothing shared.")} /><ArtifactClose disabled={disabled} onClick={() => { setRequest("Close requested."); if (!hold) setOpen(false); }} /></ArtifactActions></ArtifactHeader><ArtifactContent><p role={sample === "error" ? "alert" : "status"}>Artifact sample: {sample}.</p>{sample === "empty" ? <p>No artifact supplied.</p> : sample === "loading" ? <p>Waiting for host artifact.</p> : sample === "error" ? <p role="alert">Host could not supply the artifact.</p> : sample === "replacement" ? <MessageResponse>Replacement brief supplied by host.</MessageResponse> : kind === "document" ? <MessageResponse>{"The best workspace leaves room for the work.\n\n### What stood out\nPeople want to see what matters now, with the detail one deliberate step away. Progress stays visible without taking over the conversation.\n\n### The next small step\nTry the calmer flow with one real task. Keep the decisions visible, and let the rest recede."}</MessageResponse> : <ToolInput label="Structured result" input={{ direction: "Calmer, closer to the work", decisions: ["Retain context", "Reveal detail on request"], confidence: "Needs user observation" }} />}</ArtifactContent></Artifact> : <Button onClick={() => setOpen(true)}>Reopen sample artifact</Button>}<output aria-label="Activity request">{request}</output></div>;
}

function SourcesExample({ state }: { state: ExampleState }) {
  const [open, setOpen] = useState(true);
  const [hold, setHold] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [sources, setSources] = useState<{ id: string; href?: string; title: string; primary?: boolean }[]>([
    { id: "interviews", href: "https://example.com/interviews", title: state === "long-content" ? "Firsthand observations from people working across many projects, environments and long-running conversations" : "Firsthand observations" },
    { id: "field-notes", href: "https://example.com/field-notes", title: "Field notes", primary: true },
    { id: "unsafe", href: "javascript:alert('not executed')", title: "Unavailable source (unsafe address)" },
  ]);
  const [request, setRequest] = useState("No source opened.");
  const disabled = state === "disabled" || unavailable;
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable source actions" checked={disabled} disabled={state === "disabled"} onChange={event => setUnavailable(event.target.checked)} /><Button onClick={() => setSources([])}>Empty sample sources</Button><Button onClick={() => setSources([{ id: "replacement", href: "https://example.com/replacement-research", title: "Replacement research" }, { id: "missing", title: "Unavailable source (missing address)" }])}>Replace sample sources</Button></div>
    <Sources open={open} disabled={disabled} onOpenChange={next => { setRequest("Source visibility requested."); if (!hold) setOpen(next); }}><SourcesTrigger count={sources.length} /><SourcesContent>{sources.length === 0 ? <p>No sources supplied.</p> : sources.map(source => <Source key={source.id} href={disabled ? undefined : source.href} title={source.title} onClick={event => { event.preventDefault(); setRequest(source.id === "unsafe" || source.id === "missing" ? "This must never fire" : "Open requested. Synthetic link kept local."); }} onAuxClick={event => event.preventDefault()}>{source.primary ? <span>{source.title} <Badge>Primary source</Badge></span> : undefined}</Source>)}</SourcesContent></Sources>
    <output aria-label="Activity request">{request}</output>
  </div>;
}

export function ActivityExample({ component, state }: { component: ActivityExport; state: ExampleState }) {
  if (component === "Tool") return <ToolExample state={state} />;
  if (component === "Agent") return <AgentExample state={state} />;
  if (component === "Artifact") return <ArtifactExample state={state} />;
  return <SourcesExample state={state} />;
}
