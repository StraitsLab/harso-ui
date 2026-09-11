import { useState } from "react";
import { Button, Select, TaskList, WebSearch } from "@harso/ui";
import type { ExampleState } from "./examples";

export function AgentTrailsExample({ component, state }: { component: "TaskList" | "WebSearch"; state: ExampleState }) {
  return <TrailExample key={`${component}-${state}`} component={component} state={state} />;
}
function TrailExample({ component, state }: { component: "TaskList" | "WebSearch"; state: ExampleState }) {
  const [revealed, setRevealed] = useState(0);
  const [timed, setTimed] = useState(false);
  const [run, setRun] = useState(0);
  const [complete, setComplete] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [paused, setPaused] = useState(false);
  const [collapse, setCollapse] = useState<"never" | "task" | "all">("never");
  const disabled = state === "disabled" || paused;
  const long = state === "long-content";
  const sources = [
    { title: "Accessible theme patterns", domain: "github.com", brand: "github", href: "https://github.com" },
    { title: "Design systems discussion", domain: "www.reddit.com", brand: "reddit", href: "https://www.reddit.com" },
    { title: "Teams sharing their process", domain: "www.linkedin.com", brand: "linkedin" },
    { title: "Design notes", domain: "x.com", brand: "x", href: "https://x.com" },
    { title: "A public reference", domain: "example.com", href: "https://example.com" },
    { title: "Another reference", domain: "example.org", href: "https://example.org" },
    { title: "Additional reference", domain: "example.net", href: "https://example.net" },
    { title: "Rejected unsafe URL", domain: "example.com", href: "javascript:alert('blocked')" },
  ];
  const tasks = [
    { id: "inspect", label: "Inspect the supplied references", steps: [{ label: "Read", chips: [{ label: long ? "a-very-long-resource-name-for-the-responsive-theme-contract-and-component-reference.tsx" : "agent-surfaces.tsx" }, { label: "theme.css" }] }, { label: "Compare the public behavior" }] },
    { id: "summarize", label: "Prepare a concise summary", steps: [{ label: "Draft the findings", chips: [{ label: "summary.md" }] }] },
  ];
  const steps = [
    { label: "Ran reference searches", heading: true, dwell: 700 },
    { label: "Searched for", query: long ? "accessible continuous-canvas research trails with very long resource names and semantic theme tokens" : "accessible theme patterns", meta: "8 references", brand: "github", dwell: 1200, sources },
    { label: "Read the supplied public notes", brand: "reddit", dwell: 400 },
  ];
  const total = component === "TaskList" ? 5 : 4;
  const reset = () => { setRevealed(0); setComplete(false); setRun(previous => previous + 1); };
  const playback = { revealed: timed ? undefined : revealed, startDelay: 320, stepInterval: 850, disabled, error: state === "error" ? "The host reported an interrupted trail. No success inferred." : undefined, onComplete: () => setComplete(true) };
  return <div className="hkl-example-stack" aria-label="Agent trails example">
    <p>Presentation fixture only. Advance supplied events or replay their timing; neither runs tools nor changes backend state.</p>
    <div className="hk-trail-example-controls">
      <label>Playback <Select aria-label="Trail playback" disabled={state === "disabled"} value={timed ? "timed" : "events"} onChange={event => { reset(); setTimed(event.target.value === "timed"); }}><option value="events">Controlled events</option><option value="timed">Timed presentation</option></Select></label>
      <Button disabled={disabled || timed || empty || revealed >= total || state === "error"} onClick={() => setRevealed(previous => previous + 1)}>Advance event</Button>
      <Button disabled={state === "disabled"} onClick={reset}>Restart trail</Button>
      <label><input type="checkbox" checked={paused} disabled={state === "disabled"} onChange={event => setPaused(event.target.checked)} /> Disable trail</label>
      <label><input type="checkbox" checked={empty} disabled={state === "disabled"} onChange={event => { reset(); setEmpty(event.target.checked); }} /> Empty trail</label>
      {component === "TaskList" && <label>Collapse <Select aria-label="Collapse policy" disabled={state === "disabled"} value={collapse} onChange={event => { reset(); setCollapse(event.target.value as typeof collapse); }}><option value="never">Keep expanded</option><option value="task">After each task</option><option value="all">After all tasks</option></Select></label>}
    </div>
    {component === "TaskList" ? <TaskList key={run} {...playback} tasks={empty ? [] : tasks} collapseOnComplete={collapse === "all" ? "all" : collapse === "task"} /> : <WebSearch key={run} {...playback} query="Public reference research" steps={empty ? [] : steps} working="Presenting supplied search steps" />}
    <output aria-label="Trail presentation">{complete ? "Presentation complete — no backend state changed." : timed ? "Timed presentation only." : `${revealed} of ${empty ? 0 : total} supplied units revealed.`}</output>
  </div>;
}
