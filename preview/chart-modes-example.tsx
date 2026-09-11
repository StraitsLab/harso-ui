import { useState } from "react";
import { AreaChartCard, Checkbox, ComboChartCard, LineChartCard, Select, type ChartRow } from "@harso/ui";
import type { ExampleState } from "./examples";

const monthly = [{ label: "January", value: 2400, secondary: 3.2, referral: 800, paid: 400 }, { label: "February", value: 3200, secondary: 2.4, referral: 1200, paid: 500 }, { label: "March", value: 2800, secondary: 4.8, referral: 600, paid: 350 }, { label: "April", value: 4100, secondary: 3.6, referral: 1400, paid: 600 }];
const weekly = [{ label: "Monday", value: 320, secondary: 2.1, referral: 60, paid: 20 }, { label: "Tuesday", value: 480, secondary: 3.4, referral: 90, paid: 30 }, { label: "Wednesday", value: 240, secondary: 1.8, referral: 40, paid: 15 }];
const yearly = [{ label: "2024", value: 18200, secondary: 2.2, referral: 6200, paid: 1200 }, { label: "2025", value: 24700, secondary: 3.1, referral: 8700, paid: 2300 }];
const scenarios: Record<string, readonly ChartRow[]> = {
  zero: [{ label: "Zero", value: 0, secondary: 0, referral: 0 }],
  fractional: [{ label: "Zero", value: 0, secondary: 0, referral: 0 }, { label: "Half", value: .25, secondary: .1, referral: .2 }, { label: "Full", value: .5, secondary: .2, referral: .4 }],
  signed: [{ label: "Loss", value: -40, secondary: -2, referral: 20 }, { label: "Flat", value: 0, secondary: 0, referral: 0 }, { label: "Gain", value: 80, secondary: 4, referral: -30 }],
  missing: [{ label: "Known", value: 30, secondary: 2, referral: 15 }, { label: "Missing", value: NaN, secondary: 4 }, { label: "No rate", value: 60, referral: 20 }, { label: "Infinity", value: Infinity, secondary: -Infinity, referral: null }, { label: "Known again", value: 40, secondary: 3, referral: 10 }],
  extreme: [{ label: "Minimum", value: -Number.MAX_VALUE, secondary: -Number.MIN_VALUE, referral: 0 }, { label: "Zero", value: 0, secondary: 0, referral: 0 }, { label: "Maximum", value: Number.MAX_VALUE, secondary: Number.MIN_VALUE, referral: 0 }],
  empty: [],
};
const count = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const rate = (value: number) => `${count(value)}%`;

export function ChartModesExample({ component, state }: { component: string; state: ExampleState }) {
  const [variant, setVariant] = useState<"stacked" | "overlap" | "percent">("stacked");
  const [shape, setShape] = useState<"curved" | "sharp">("curved");
  const [range, setRange] = useState("monthly");
  const [scenario, setScenario] = useState("ready");
  const [hold, setHold] = useState(false);
  const [tiles, setTiles] = useState(true);
  const [request, setRequest] = useState("No period requested.");
  const area = component === "AreaChartCard";
  const combo = component === "ComboChartCard";
  const Card = area ? AreaChartCard : combo ? ComboChartCard : LineChartCard;
  const selected = scenarios[scenario];
  const ranges = [{ id: "weekly", label: "Weekly", data: selected ?? weekly }, { id: "monthly", label: "Monthly", data: selected ?? monthly }, { id: "yearly", label: "Yearly", data: selected ?? yearly }];
  const title = state === "long-content" ? "Long-term observations across independently supplied acquisition and conversion periods" : area ? "Traffic composition" : combo ? "Sessions and conversion" : "Revenue observations";
  return <div className="hk-chart-modes-example">
    <div className="hk-data-toolbar">
      {area && <label>Area mode<Select aria-label="Area mode" value={variant} onChange={event => setVariant(event.target.value as typeof variant)}>{["stacked", "overlap", "percent"].map(mode => <option key={mode}>{mode}</option>)}</Select></label>}
      <label>Curve shape<Select aria-label="Curve shape" value={shape} onChange={event => setShape(event.target.value as typeof shape)}><option value="curved">Curved</option><option value="sharp">Sharp</option></Select></label>
      <label>Chart scenario<Select aria-label="Chart scenario" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "fractional", "zero", "signed", "missing", "extreme", "empty", "loading", "disabled", "error"].map(name => <option key={name}>{name}</option>)}</Select></label>
      <Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} />
      <Checkbox label="Series tiles" checked={tiles} onChange={event => setTiles(event.target.checked)} />
    </div>
    <Card title={title} caption="Synthetic fixtures · each period supplied by this host; no fetched or generated period data" series={area ? [{ key: "value", label: "Organic" }, { key: "referral", label: "Referral" }, { key: selected ? "secondary" : "paid", label: "Paid" }] : undefined} bar={{ key: "value", label: "Sessions", format: count }} line={{ key: "secondary", label: "Conversion", format: rate }} variant={variant} shape={shape} ranges={ranges} range={range} onRangeChange={next => { setRequest(`${next} requested; ${hold ? "host refused" : "host accepted"}.`); if (!hold) setRange(next); }} format={count} tiles={tiles} disabled={state === "disabled" || scenario === "disabled"} loading={scenario === "loading"} error={state === "error" || scenario === "error" ? "Host data unavailable. Choose another scenario to retry." : undefined} />
    <p data-testid="chart-period-request">{request}</p>
  </div>;
}
