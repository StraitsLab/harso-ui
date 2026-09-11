import { useState } from "react";
import { ActivityRingsCard, Checkbox, MonthPanel, Select } from "@harso/ui";
import type { ExampleState } from "./examples";

const days: Record<string, number[]> = { "2026-09-05": [720, 40, 8], "2026-09-06": [0, 0, 0], "2026-09-07": [480, 24, 5] };
export function RingsExample({ state }: { state: ExampleState }) {
  const [day, setDay] = useState("2026-09-07");
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [request, setRequest] = useState("Synthetic activity; no health data accessed.");
  const disabled = state === "disabled" || scenario === "disabled";
  const amounts = days[day];
  const rings = scenario === "empty" ? [] : [
    { id: "move", label: "Move", value: scenario === "invalid" ? NaN : amounts[0], target: 600, unit: "kcal" },
    { id: "exercise", label: "Exercise", value: amounts[1], target: scenario === "invalid" ? 0 : 30, unit: "min" },
    { id: "running", label: "Running", value: amounts[2], target: 5, unit: "km" },
  ];
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Rings state<Select aria-label="Rings state" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "invalid", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label></div>
    <ActivityRingsCard title="Your activity" caption={<time dateTime={day}>{day}</time>} rings={rings} disabled={disabled} calendar={<section aria-label="Activity days"><h4>Activity days</h4><MonthPanel today="2026-09-07" defaultMonth="2026-09" minDate="2026-09-01" maxDate="2026-09-30" value={day} isDateUnavailable={date => !days[date]} disabled={disabled} onValueChange={next => { setRequest(`Day ${next} requested${hold ? "; host retained state" : ""}.`); if (!hold) setDay(next); }} /></section>} />
    <output aria-label="Activity day request">{request}</output>
  </div>;
}
