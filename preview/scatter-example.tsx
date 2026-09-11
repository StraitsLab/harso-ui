import { useState } from "react";
import { Checkbox, ScatterChartCard, Select } from "@harso/ui";
import type { ExampleState } from "./examples";

const series = [
  { label: "Research", points: [{ label: "Atlas", x: 12, y: 28, z: 12 }, { label: "Birch", x: 48, y: 42, z: 36 }, { label: "Cedar", x: 25, y: 10, z: 20 }] },
  { label: "Delivery", points: [{ label: "Delta", x: 62, y: 55, z: 50 }, { label: "Elm", x: 80, y: 36, z: 18 }, { label: "Fern", x: 40, y: -8, z: 9 }] },
];
export function ScatterExample({ state }: { state: ExampleState }) {
  const [bubble, setBubble] = useState(true);
  const [tiles, setTiles] = useState(true);
  const [hold, setHold] = useState(false);
  const [range, setRange] = useState("month");
  const [scenario, setScenario] = useState("ready");
  const [request, setRequest] = useState("Synthetic observations; no remote data.");
  const disabled = state === "disabled" || scenario === "disabled";
  const data = scenario === "empty" ? [] : scenario === "invalid" ? [{ label: "Invalid", points: [{ x: NaN, y: 2 }] }] : range === "week" ? series.map(group => ({ ...group, points: group.points.slice(0, 1) })) : series;
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><Checkbox label="Bubble sizing" checked={bubble} onChange={event => setBubble(event.target.checked)} /><Checkbox label="Series summaries" checked={tiles} onChange={event => setTiles(event.target.checked)} /><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Scatter state<Select aria-label="Scatter state" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "invalid", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label></div>
    <ScatterChartCard title={state === "long-content" ? "How effort and outcomes relate across different kinds of work" : "Effort and outcomes"} caption="Synthetic sample · Size represents observations" series={data} bubble={bubble} tiles={tiles} disabled={disabled} axisLabels={{ x: "Effort", y: "Outcome" }} format={value => value.toFixed(1)} formatX={value => value.toFixed(0)} range={range} ranges={[{ value: "week", label: "This week" }, { value: "month", label: "This month" }]} onRangeChange={next => { setRequest(`Range ${next} requested${hold ? "; host retained state" : ""}.`); if (!hold) setRange(next); }} />
    <output aria-label="Scatter request">{request}</output>
  </div>;
}
