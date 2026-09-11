import { useState } from "react";
import { Checkbox, HeatmapChartCard, Select } from "@harso/ui";
import type { ExampleState } from "./examples";

const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const regions = ["Singapore", "London", "New York"];
export function HeatmapExample({ state }: { state: ExampleState }) {
  const [range, setRange] = useState("week");
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [composition, setComposition] = useState("hours");
  const [ceiling, setCeiling] = useState("auto");
  const [accent, setAccent] = useState("default");
  const [request, setRequest] = useState("Synthetic matrix; no services connected.");
  const columns = composition === "hours" ? hours : ["January", "February", "March", "April", "May", "June"];
  const labels = composition === "hours" ? weekdays : regions;
  const rows = scenario === "empty" ? [] : labels.map((label, rowIndex) => ({ label, values: columns.map((_, columnIndex) => scenario === "zero" ? 0 : scenario === "invalid" ? NaN : scenario === "missing" && columnIndex === 1 ? null : (rowIndex + 1) * (columnIndex + 1) * (range === "week" ? 1 : 2)) }));
  return <div className="hkl-example-stack"><div className="hk-data-toolbar">
    <label>Matrix layout<Select aria-label="Matrix layout" value={composition} onChange={event => setComposition(event.target.value)}><option value="hours">Weekday × hour</option><option value="regions">Region × month</option></Select></label>
    <label>Heatmap state<Select aria-label="Heatmap state" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "zero", "missing", "invalid", "disabled", "loading", "error"].map(value => <option key={value}>{value}</option>)}</Select></label>
    <label>Intensity ceiling<Select aria-label="Intensity ceiling" value={ceiling} onChange={event => setCeiling(event.target.value)}><option value="auto">Automatic</option><option value="10">10</option><option value="100">100</option></Select></label>
    <label>Matrix accent<Select aria-label="Matrix accent" value={accent} onChange={event => setAccent(event.target.value)}><option value="default">Default</option><option value="green">Green</option></Select></label>
    <Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} />
  </div>
    <HeatmapChartCard title="Activity patterns" caption="Synthetic observations · Inspect any cell" rows={rows} columns={columns} max={ceiling === "auto" ? undefined : Number(ceiling)} color={accent === "green" ? "var(--hk-positive)" : undefined} delta="Compared periods supplied by the host" disabled={state === "disabled" || scenario === "disabled"} range={range} ranges={[{ value: "week", label: "Current period" }, { value: "previous", label: "Previous period" }]} onRangeChange={next => { setRequest(`Range ${next} requested${hold ? "; host retained state" : ""}.`); if (!hold) setRange(next); }}>
      {scenario === "loading" ? <p role="status" aria-busy="true">Loading matrix…</p> : scenario === "error" || state === "error" ? <p role="alert">Matrix unavailable. The host can retry.</p> : undefined}
    </HeatmapChartCard>
    <output aria-label="Matrix request">{request}</output>
  </div>;
}
