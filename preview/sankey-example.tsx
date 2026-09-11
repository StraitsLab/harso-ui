import { useState } from "react";
import { Checkbox, SankeyChartCard, Select } from "@harso/ui";
import type { ExampleState } from "./examples";

const nodes = [{ name: "Salary" }, { name: "Freelance" }, { name: "Budget" }, { name: "Home" }, { name: "Everyday" }, { name: "Savings" }];
const monthLinks = [{ source: "Salary", target: "Budget", value: 2400 }, { source: "Freelance", target: "Budget", value: 600 }, { source: "Budget", target: "Home", value: 1200 }, { source: "Budget", target: "Everyday", value: 800 }, { source: "Budget", target: "Savings", value: 1000 }];
const weekLinks = monthLinks.map(link => ({ ...link, value: link.value / 4 }));
export function SankeyExample({ state }: { state: ExampleState }) {
  const [range, setRange] = useState("month");
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [request, setRequest] = useState("Synthetic flow; no accounts connected.");
  const links = scenario === "empty" ? [] : scenario === "cycle" ? [...monthLinks, { source: "Budget", target: "Salary", value: 1 }] : scenario === "invalid" ? [{ source: "Missing", target: "Budget", value: 1 }] : scenario === "zero" ? monthLinks.map(link => ({ ...link, value: 0 })) : range === "month" ? monthLinks : weekLinks;
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Sankey state<Select aria-label="Sankey state" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "zero", "cycle", "invalid", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label></div>
    <SankeyChartCard title="Where the money goes" caption="Synthetic USD flow · Follow a node or a connection" nodes={nodes} links={links} disabled={state === "disabled" || scenario === "disabled"} format={value => `$${value.toLocaleString("en-US")}`} range={range} ranges={[{ value: "month", label: "This month" }, { value: "week", label: "This week" }]} onRangeChange={next => { setRequest(`Range ${next} requested${hold ? "; host retained state" : ""}.`); if (!hold) setRange(next); }} />
    <output aria-label="Flow request">{request}</output>
  </div>;
}
