import { useState } from "react";
import { Badge, Button, Checkbox, Checkpoint, CheckpointIcon, CheckpointTrigger, Field, Input, Plan, PlanAction, PlanContent, PlanDescription, PlanFooter, PlanHeader, PlanTitle, PlanTrigger, Reasoning, ReasoningContent, ReasoningTrigger, Select, Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger, Textarea, useReasoning } from "@harso/ui";
import type { ExampleState } from "./examples";

export const workExports = ["Plan", "Task", "Reasoning", "Checkpoint"] as const;
export type WorkExport = typeof workExports[number];
export const workNotes: Record<WorkExport, { behavior: string; example: string }> = {
  Plan: { behavior: "An open canvas for a plan, not another card. Expand the steps without hiding required decisions. Streaming never changes your disclosure or notes; the host accepts or refuses requests. Nothing here executes the plan.", example: '<Plan open={open} onOpenChange={setOpen}><PlanHeader><PlanTitle>Start smaller.</PlanTitle><PlanTrigger /></PlanHeader><PlanContent>…</PlanContent><PlanFooter>Required decision</PlanFooter></Plan>' },
  Task: { behavior: "One compact work row. Status, counts, agents and file labels are supplied content, not separate runtime categories. Expand for individual steps. No invented progress, file reads, subscriptions or automatic actions.", example: '<Task><TaskTrigger title="Shape the launch brief" status="2 working" /><TaskContent><TaskItem status="Running">Research agent</TaskItem></TaskContent></Task>' },
  Reasoning: { behavior: "Only public progress summaries supplied by the host. No access to hidden model reasoning. The existing Markdown boundary rejects raw HTML, remote images and unsafe links. Open state stays put; finite elapsed seconds come from the host, never a fabricated clock.", example: '<Reasoning isStreaming={running} duration={elapsed}><ReasoningTrigger /><ReasoningContent>{publicSummary}</ReasoningContent></Reasoning>' },
  Checkpoint: { behavior: "A quiet history marker with an explicit review action. Local host-controlled samples show manual markers, supplied automatic records and isolated branch drafts. Selection can be refused. Checkpoint creation, authorization, restoration and conversation branching remain runtime responsibilities.", example: '<Checkpoint><CheckpointIcon /><CheckpointTrigger onClick={requestReview}>Before launch research</CheckpointTrigger></Checkpoint>' },
};

function PlanExample({ state, showRecords, loading }: { state: ExampleState; showRecords: boolean; loading: boolean }) {
  const [open, setOpen] = useState(true);
  const [refuse, setRefuse] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [audience, setAudience] = useState("");
  const [requests, setRequests] = useState(0);
  const disabled = state === "disabled";
  const updating = (streaming && showRecords) || loading;
  return <div className="hkl-example-stack">
    <Plan open={open} disabled={disabled} onOpenChange={next => { setRequests(count => count + 1); if (!refuse) setOpen(next); }} isStreaming={updating}>
      <PlanHeader><PlanTitle>{state === "long-content" ? "A quieter first experience, with room for everything that matters." : "Start smaller."}</PlanTitle><PlanDescription>One audience. One excellent first experience.</PlanDescription><PlanAction><Badge tone={updating ? "active" : "neutral"}>{updating ? "Updating" : showRecords ? "Draft plan" : "No plan supplied"}</Badge></PlanAction><PlanTrigger /></PlanHeader>
      <PlanContent><div hidden={!showRecords}><Task defaultOpen disabled={disabled}><TaskTrigger title="Three considered steps" /><TaskContent><TaskItem icon="✓" status="Complete">Understand the strongest need.</TaskItem><TaskItem icon="✦" status="Working">Shape one useful workflow.</TaskItem><TaskItem icon="·" status="Waiting">Test it with a small group.</TaskItem></TaskContent></Task></div><Field label="Notes on the plan">{props => <Textarea {...props} disabled={disabled} aria-label="Plan notes" placeholder="Keep your own thoughts here…" rows={2} />}</Field></PlanContent>
      <PlanFooter><span>{audience ? `Audience: ${audience}` : "A quick choice · Who are we speaking to?"}</span><div className="hkl-work-actions"><Button variant={audience === "Our team" ? "primary" : "outline"} disabled={disabled} aria-pressed={audience === "Our team"} onClick={() => setAudience("Our team")}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Our team</Button><Button variant={audience === "Everyone" ? "primary" : "outline"} disabled={disabled} aria-pressed={audience === "Everyone"} onClick={() => setAudience("Everyone")}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Everyone</Button></div></PlanFooter>
    </Plan>
    <div className="hk-data-toolbar"><Checkbox label="Streaming sample" checked={streaming} onChange={event => setStreaming(event.target.checked)} /><Checkbox label="Keep host disclosure" checked={refuse} onChange={event => setRefuse(event.target.checked)} /><Checkbox label="Show plan details" checked={open} onChange={event => setOpen(event.target.checked)} /><output aria-label="Disclosure requests">{requests} requests</output></div>
  </div>;
}

function TaskExample({ state, showRecords }: { state: ExampleState; showRecords: boolean }) {
  const [open, setOpen] = useState(true);
  const [refuse, setRefuse] = useState(false);
  const [requests, setRequests] = useState(0);
  const [complete, setComplete] = useState(false);
  const [request, setRequest] = useState("No file requested");
  const blocked = state === "error";
  const filename = state === "long-content" ? "launch/research/a-very-long-evidence-summary-with-important-details-that-must-remain-readable-and-never-open-itself.md" : "launch-brief.md";
  return <div className="hkl-example-stack"><Task open={open} onOpenChange={next => { setRequests(count => count + 1); if (!refuse) setOpen(next); }} disabled={state === "disabled"}>
    <TaskTrigger title="Shape the launch brief" status={blocked ? "Needs attention" : showRecords ? complete ? "Complete" : "2 working · 1 decision" : undefined} />
    <TaskContent><div hidden={!showRecords}><TaskItem icon="✦" status={complete ? "Complete" : blocked ? "Blocked" : "Working"}>Shaping the recommendation<div className="hk-task-summary">Writing agent</div></TaskItem><TaskItem icon="✦" status={complete ? "Complete" : "Working"}>Checking the evidence<div className="hk-task-summary">Research agent</div></TaskItem><TaskItem icon="✓" status="Reviewed"><Task disabled={state === "disabled"}><TaskTrigger title="Six sources reviewed" /><TaskContent><TaskItem>Original interview notes</TaskItem><TaskItem>Published product documentation</TaskItem></TaskContent></Task></TaskItem><TaskItem icon="↳" status={complete ? "Ready" : "Draft"}><Button disabled={state === "disabled"} onClick={() => setRequest(`Requested ${filename}. No file was opened.`)}><TaskItemFile>{filename}</TaskItemFile></Button></TaskItem></div><TaskItem><Field label="Task notes">{props => <Textarea {...props} disabled={state === "disabled"} rows={2} />}</Field></TaskItem></TaskContent>
  </Task><div className="hk-plan-footer"><span>{blocked ? "The host reported missing access. Review it before continuing." : !showRecords ? "No task records supplied." : complete ? "Ready for your review." : "A decision is needed before the final step."}</span><Button variant="primary" disabled={state === "disabled"} onClick={() => setRequest("Review requested. No runtime action was taken.")}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>Review decision</Button></div><div className="hk-data-toolbar"><Button onClick={() => setComplete(value => !value)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>{complete ? "Reset sample progress" : "Complete sample progress"}</Button><Checkbox label="Keep host disclosure" checked={refuse} onChange={event => setRefuse(event.target.checked)} /><output aria-label="Task disclosure requests">{requests} requests</output><output aria-label="Work action">{request}</output></div></div>;
}

function ReasoningState() {
  const { isOpen, isStreaming, duration } = useReasoning();
  return <span className="hk-task-summary">{isOpen ? "Expanded" : "Collapsed"} · {isStreaming ? "Receiving updates" : duration === undefined ? "No elapsed time supplied" : `${duration}s supplied by host`}</span>;
}

function ReasoningExample({ state, showRecords, loading }: { state: ExampleState; showRecords: boolean; loading: boolean }) {
  const [open, setOpen] = useState(true);
  const [refuse, setRefuse] = useState(false);
  const [requests, setRequests] = useState(0);
  const [streaming, setStreaming] = useState(true);
  const [hostile, setHostile] = useState(false);
  const [duration, setDuration] = useState("12");
  const [updates, setUpdates] = useState(0);
  const summary = hostile ? '<script>alert(1)</script>\n![Private tracker](https://private.example/pixel)\n[unsafe](javascript:alert%281%29) [private file](file:///etc/passwd) [relative](/private) [public reference](https://example.com/research)' : `The strongest signal is a **focused first experience**.\n\n- Compared the supplied interview notes.\n- Kept the recommendation grounded in the available evidence.${updates ? `\n\nReceived ${updates} additional sample update${updates === 1 ? "" : "s"}.` : ""}`;
  return <div className="hkl-example-stack"><Reasoning open={open} onOpenChange={next => { setRequests(count => count + 1); if (!refuse) setOpen(next); }} disabled={state === "disabled"} isStreaming={(streaming && showRecords) || loading} duration={showRecords && duration.trim() ? Number(duration) : undefined}><ReasoningTrigger getThinkingMessage={state === "long-content" ? () => "Comparing the evidence carefully while preserving every important qualification and uncertainty" : undefined} /><ReasoningContent>{showRecords ? summary : ""}</ReasoningContent><ReasoningState /></Reasoning><div className="hk-data-toolbar"><Checkbox label="Streaming sample" checked={streaming} onChange={event => setStreaming(event.target.checked)} /><Checkbox label="Untrusted summary sample" checked={hostile} onChange={event => setHostile(event.target.checked)} /><Field label="Host elapsed seconds" className="hk-reasoning-elapsed">{props => <Input {...props} value={duration} onChange={event => setDuration(event.target.value)} inputMode="decimal" />}</Field><Button onClick={() => setUpdates(count => count + 1)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>Append sample update</Button><Checkbox label="Keep host disclosure" checked={refuse} onChange={event => setRefuse(event.target.checked)} /><output aria-label="Reasoning disclosure requests">{requests} requests</output></div></div>;
}

function LocalCheckpointModes({ disabled, showRecords }: { disabled: boolean; showRecords: boolean }) {
  const [mode, setMode] = useState<"Manual" | "Automatic" | "Branching">("Manual");
  const [branch, setBranch] = useState<"Main" | "Alternative">("Main");
  const [refuse, setRefuse] = useState(false);
  const [feedback, setFeedback] = useState("No local selection requested");
  const [histories, setHistories] = useState<Record<string, { markers: string[]; selected: string | null; draft: string }>>({
    Manual: { markers: ["Manual marker 1"], selected: null, draft: "Manual draft" },
    Automatic: { markers: ["Automatic marker 1"], selected: null, draft: "Automatic draft" },
    Main: { markers: ["Main marker 1"], selected: null, draft: "Main draft" },
    Alternative: { markers: ["Alternative marker 1"], selected: null, draft: "Alternative draft" },
  });
  const historyKey = mode === "Branching" ? branch : mode;
  const history = histories[historyKey];
  function selectMarker(marker: string) {
    setFeedback(`${refuse ? "Refused" : "Accepted"} local selection: ${marker}. No runtime action.`);
    if (!refuse) setHistories(current => ({ ...current, [historyKey]: { ...current[historyKey], selected: marker } }));
  }
  return <section aria-label="Local checkpoint modes" className="hkl-example-stack">
    <h3>Local checkpoint modes</h3>
    <p>Presentation only. These in-memory samples do not save or restore runtime history, create conversations or send requests. Switching examples resets them.</p>
    <div role="group" aria-label="Checkpoint mode" className="hkl-work-actions" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", width: "100%", maxWidth: 400 }}>{(["Manual", "Automatic", "Branching"] as const).map(option => <Button style={{ paddingInline: 8, gap: 4 }} key={option} disabled={disabled} variant={mode === option ? "primary" : "outline"} aria-pressed={mode === option} onClick={() => setMode(option)}><svg style={{ visibility: mode === option ? "visible" : "hidden" }} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>{option}</Button>)}</div>
    {mode === "Branching" ? <><p>Two independent supplied branch samples, not a conversation fork.</p><div role="group" aria-label="Local branch" className="hkl-work-actions">{(["Main", "Alternative"] as const).map(option => <Button key={option} disabled={disabled} variant={branch === option ? "primary" : "outline"} aria-pressed={branch === option} onClick={() => setBranch(option)}><svg style={{ visibility: branch === option ? "visible" : "hidden" }} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>{option}</Button>)}</div></> : <p>{mode === "Manual" ? "Add a marker to the local manual sample explicitly." : "Automatic records are supplied by the sample host, not generated by a clock or runtime."}</p>}
    <Checkbox label="Refuse local checkpoint selection" disabled={disabled} checked={refuse} onChange={event => setRefuse(event.target.checked)} />
    <div role="group" aria-label={`${historyKey} checkpoint markers`}>{showRecords && history.markers.map(marker => <Checkpoint key={marker}><CheckpointIcon /><CheckpointTrigger disabled={disabled} aria-pressed={history.selected === marker} onClick={() => selectMarker(marker)}>{marker}</CheckpointTrigger></Checkpoint>)}</div>
    <Button style={{ justifySelf: "start" }} disabled={disabled || (mode === "Automatic" && history.markers.length === 2)} onClick={() => setHistories(current => ({ ...current, [historyKey]: { ...current[historyKey], markers: mode === "Automatic" ? ["Automatic marker 1", "Automatic marker 2"] : [...current[historyKey].markers, `${historyKey} marker ${current[historyKey].markers.length + 1}`] } }))}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>{mode === "Automatic" ? "Supply automatic sample records" : "Add local marker"}</Button>
    <Field label="Local branch or mode draft">{props => <Input {...props} disabled={disabled} value={history.draft} onChange={event => { const draft = event.target.value; setHistories(current => ({ ...current, [historyKey]: { ...current[historyKey], draft } })); }} />}</Field>
    <output aria-label="Local checkpoint selection">{historyKey}: {history.selected ?? "None selected"}</output>
    <output aria-label="Local checkpoint request" className="hkl-example-feedback">{feedback}</output>
  </section>;
}

function CheckpointExample({ state, showRecords }: { state: ExampleState; showRecords: boolean }) {
  const [request, setRequest] = useState("No checkpoint requested");
  return <div className="hkl-example-stack"><div hidden={!showRecords}><p>We explored a few directions. The strongest one was also the simplest.</p><Checkpoint><CheckpointIcon /><CheckpointTrigger tooltip="Review this point before requesting restoration" disabled={state === "disabled"} onClick={() => setRequest("Checkpoint review requested. Nothing was restored.")}>{state === "long-content" ? "Before the launch research and the first set of important audience decisions" : "Before launch research"}</CheckpointTrigger></Checkpoint><p>Start with the team. Learn from one real workflow, then widen the circle.</p><Checkpoint><CheckpointIcon>↗</CheckpointIcon><CheckpointTrigger disabled={state === "disabled"} onClick={() => setRequest("Branch review requested. No conversation was changed.")}>Explore another direction</CheckpointTrigger></Checkpoint></div><output className="hkl-example-feedback" aria-label="Checkpoint action">{request}</output><LocalCheckpointModes disabled={state === "disabled"} showRecords={showRecords} /></div>;
}

export function WorkExample({ component, state }: { component: WorkExport; state: ExampleState }) {
  const [sampleState, setSampleState] = useState(state === "disabled" || state === "error" ? state : "ready");
  const disabled = sampleState === "disabled" || sampleState === "empty" || sampleState === "loading";
  const props = { state: disabled ? "disabled" as const : sampleState === "error" ? "error" as const : state === "long-content" ? state : "default" as const, showRecords: sampleState === "ready" || sampleState === "disabled", loading: sampleState === "loading" };
  return <div className="hkl-example-stack">
    <Field label="Host sample state">{field => <Select {...field} value={sampleState} onChange={event => setSampleState(event.target.value)}>{["ready", "empty", "loading", "error", "disabled"].map(option => <option key={option} value={option}>{option}</option>)}</Select>}</Field>
    <output aria-label="Host sample status">{sampleState === "empty" ? "No records supplied." : sampleState === "loading" ? "Waiting for host records." : sampleState === "error" ? "Host reported missing access. No runtime action." : sampleState === "disabled" ? "Sample interactions disabled." : "Local sample ready."}</output>
    <fieldset disabled={disabled} aria-label={`${component} local sample`} aria-busy={props.loading} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {component === "Plan" ? <PlanExample {...props} /> : component === "Task" ? <TaskExample {...props} /> : component === "Reasoning" ? <ReasoningExample {...props} /> : <CheckpointExample {...props} />}
    </fieldset>
  </div>;
}
