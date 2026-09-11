import { useState } from "react";
import { AgentLimitsCard, Select } from "@harso/ui";

export function AgentLimitsExample() {
  const [expanded, setExpanded] = useState(false);
  const [refuse, setRefuse] = useState(false);
  const [state, setState] = useState("ready");
  return <div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
      <label>Example state<Select aria-label="Limits example state" value={state} onChange={event => setState(event.target.value)}>{["ready", "empty", "loading", "error", "disabled", "over-limit"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <label><input type="checkbox" checked={refuse} onChange={event => setRefuse(event.target.checked)} />Host refuses expansion changes</label>
    </div>
    <AgentLimitsCard label="Context window" expanded={expanded} onExpandedChange={value => { if (!refuse) setExpanded(value); }} disabled={state === "disabled"} loading={state === "loading"} error={state === "error" ? "Usage is temporarily unavailable" : undefined}
      context={{ max: 8000, segments: state === "empty" ? [] : [{ label: "Messages", tokens: state === "over-limit" ? 9000 : 3200 }, { label: "Tools", tokens: 1000 }, { label: "Deferred tools", tokens: 1800, deferred: true }], groups: state === "empty" ? [] : [{ label: "Tools", tokens: 1000, items: [{ label: "Browser", tokens: 700 }, { label: "Search", tokens: 300 }] }, { label: "Deferred tools", tokens: 1800, items: [{ label: "Repository search", tokens: 1800 }] }] }}
      plan="Workspace" limits={[{ label: "Session budget", used: 0.38, resets: "Resets in 2 hours" }, { label: "Weekly budget", used: 0.05, resets: "Resets Tuesday" }]} />
  </div>;
}
