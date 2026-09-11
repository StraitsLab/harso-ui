import { useState } from "react";
import { AgentProgress, AgentThinking, Button, Checkbox, Select, type ToolState } from "@harso/ui";

export function AgentProgressExample() {
  const [scenario, setScenario] = useState("active");
  const [expanded, setExpanded] = useState(true);
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playback, setPlayback] = useState<"host" | "timed">("host");
  const [runId, setRunId] = useState(0);
  const [finished, setFinished] = useState(0);
  const steps = scenario === "empty" ? [] : scenario === "long" ? ["Inspect the complete conversation and identify every requested change before editing", "Apply the smallest change to the shared presentation components", "Verify keyboard interaction, narrow layouts and error recovery"] : ["Understand the request", "Build the component", "Verify the result"];
  return <div>
    <div className="hk-data-toolbar">
      <label>Scenario<Select aria-label="Progress scenario" value={scenario} onChange={event => setScenario(event.target.value)}>{["active", "pending", "complete", "unknown", "empty", "loading", "error", "disabled", "long"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <label>Source<Select aria-label="Progress source" value={playback} onChange={event => setPlayback(event.target.value as typeof playback)}><option value="host">Host updates</option><option value="timed">Timed demo</option></Select></label>
      <Checkbox label="Refuse expansion changes" checked={hold} onChange={event => setHold(event.target.checked)} />
      <Checkbox label="Pause progress" checked={paused} onChange={event => setPaused(event.target.checked)} />
      <Button onClick={() => setRunId(value => value + 1)}>Restart demo</Button>
    </div>
    <p>{playback === "timed" ? "Timed demonstration only. No agent is executing these steps." : "Synthetic host updates. Time passing never completes these steps."}</p>
    <AgentProgress steps={steps} current={scenario === "complete" ? steps.length : scenario === "unknown" ? NaN : scenario === "pending" ? 0 : 1} progress={scenario === "unknown" ? undefined : 0.4} expanded={expanded} onExpandedChange={value => { if (!hold) setExpanded(value); }} playback={playback} runId={runId} stepDuration={500} completionDelay={300} onFinished={() => setFinished(value => value + 1)} paused={paused} loading={scenario === "loading"} disabled={scenario === "disabled"} error={scenario === "error" ? "Host progress unavailable" : undefined} />
    <p>Demo completion callbacks: <output aria-label="Demo completion callbacks">{finished}</output></p>
  </div>;
}

export function AgentThinkingExample() {
  const [variant, setVariant] = useState<"wave" | "spin" | "stars" | "infinity">("wave");
  const [tone, setTone] = useState<"subtle" | "accent">("accent");
  const [state, setState] = useState<ToolState>("input-available");
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(true);
  const [shimmer, setShimmer] = useState(true);
  const [runKey, setRunKey] = useState(0);
  return <div>
    <div className="hk-data-toolbar">
      <label>Indicator<Select aria-label="Thinking variant" value={variant} onChange={event => setVariant(event.target.value as typeof variant)}>{["wave", "spin", "stars", "infinity"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <label>Tone<Select aria-label="Thinking tone" value={tone} onChange={event => setTone(event.target.value as typeof tone)}><option value="accent">Accent</option><option value="subtle">Subtle</option></Select></label>
      <label>Host state<Select aria-label="Thinking state" value={state} onChange={event => setState(event.target.value as ToolState)}>{["input-streaming", "input-available", "approval-requested", "approval-responded", "output-available", "output-error", "output-denied"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <Checkbox label="Pause thinking" checked={paused} onChange={event => setPaused(event.target.checked)} />
      <Checkbox label="Show elapsed time" checked={timer} onChange={event => setTimer(event.target.checked)} />
      <Checkbox label="Shimmer label" checked={shimmer} onChange={event => setShimmer(event.target.checked)} />
      <Button onClick={() => setRunKey(value => value + 1)}>Restart timer</Button>
    </div>
    <p>The timer measures this indicator’s active display time, not server execution.</p>
    <AgentThinking variant={variant} tone={tone} state={state} paused={paused} showTimer={timer} shimmer={shimmer} runKey={runKey} label="Considering the next step" />
  </div>;
}
