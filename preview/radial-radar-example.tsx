import { useMemo, useState, type ComponentProps } from "react";
import { Checkbox, RadarChartCard, RadialChartCard, Select } from "@harso/ui";
import type { ExampleState } from "./examples";

const periods = {
  week: [{ label: "Speed", value: 0 }, { label: "Quality", value: .25 }, { label: "Care", value: 75 }, { label: "Reach", value: 100 }],
  month: [{ label: "Speed", value: 20 }, { label: "Quality", value: 45 }, { label: "Care", value: 80 }, { label: "Reach", value: 95 }],
};
const zero = [{ label: "Speed", value: 0 }, { label: "Quality", value: 0 }, { label: "Care", value: 0 }, { label: "Reach", value: 0 }];
const invalid = [{ label: "Missing", value: NaN }, { label: "Negative", value: -1 }, { label: "Infinite", value: Infinity }, { label: "Zero", value: 0 }];
const empty: typeof zero = [];
type RadarVariant = NonNullable<ComponentProps<typeof RadarChartCard>["variant"]>;
type RadialLayout = NonNullable<ComponentProps<typeof RadialChartCard>["layout"]>;

export function RadialRadarExample({ component, state = "default" }: { component: string; state?: ExampleState }) {
  const [variant, setVariant] = useState<RadarVariant>("filled");
  const [layout, setLayout] = useState<RadialLayout>("rings");
  const [range, setRange] = useState<keyof typeof periods>("week");
  const [scenario, setScenario] = useState("ready");
  const [score, setScore] = useState("82");
  const [tiles, setTiles] = useState(true);
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("No chart change requested.");
  const globalDisabled = state === "disabled";
  const effectiveScenario = globalDisabled ? "disabled" : state === "error" ? "error" : scenario;
  const supplied = effectiveScenario === "zero" ? zero : effectiveScenario === "invalid" ? invalid : effectiveScenario === "empty" ? empty : periods[range];
  const data = useMemo(() => state === "long-content" ? supplied.map(item => ({ ...item, label: `${item.label} — independently supplied observation across the example workspace` })) : supplied, [supplied, state]);
  if (component !== "RadarChartCard" && component !== "RadialChartCard") return <p role="status">No Radar/Radial example for this component.</p>;
  const radar = component === "RadarChartCard";
  const requestChange = (name: string, next: string, accept: () => void) => {
    if (globalDisabled) return;
    setRequest(`${name}: ${next} requested; ${hold ? "host refused" : "host accepted"}.`);
    if (!hold) accept();
  };
  const common = {
    title: state === "long-content" ? `Long-form ${radar ? "Radar" : "Radial"} observations across independently supplied workspace measurements` : radar ? "Radar observations" : "Radial observations",
    caption: "Synthetic host-supplied observations · no fetched data, inferred totals or generated scores.",
    data,
    showTiles: tiles,
    disabled: effectiveScenario === "disabled",
    loading: effectiveScenario === "loading",
    error: effectiveScenario === "error" ? state === "error" ? "Illustrative host error; restore the global Default example state to show supplied data." : "Illustrative host error; choose Ready to restore supplied data." : undefined,
    range,
    ranges: [{ value: "week", label: "Week" }, { value: "month", label: "Month" }],
    onRangeChange: (next: string) => {
      if (next === "week" || next === "month") requestChange("Period", next, () => setRange(next));
    },
  };
  return <div className="hkl-example-stack" data-testid="radial-radar-example">
    <div className="hk-data-toolbar">
      <label>Chart scenario<Select aria-label="Chart scenario" value={scenario} disabled={globalDisabled} onChange={event => { if (!globalDisabled) setScenario(event.target.value); }}>{["ready", "zero", "invalid", "empty", "loading", "error", "disabled"].map(item => <option key={item} value={item}>{item}</option>)}</Select></label>
      {radar && <label>Score sample<Select aria-label="Score sample" value={score} disabled={globalDisabled} onChange={event => { const next = event.target.value; requestChange("Score", next, () => setScore(next)); }}><option value="82">Supplied score: 82</option><option value="0">Supplied score: zero</option><option value="missing">No score supplied</option></Select></label>}
      <Checkbox label="Show stat tiles" checked={tiles} disabled={globalDisabled} onChange={event => { if (!globalDisabled) setTiles(event.target.checked); }} />
      <Checkbox label="Hold host state" checked={hold} disabled={globalDisabled} onChange={event => { if (!globalDisabled) setHold(event.target.checked); }} />
    </div>
    {radar ? <RadarChartCard {...common} variant={variant} showVariantControl score={score === "missing" ? undefined : Number(score)} onVariantChange={next => requestChange("Variant", next, () => setVariant(next))} /> : <RadialChartCard {...common} layout={layout} showLayoutControl onLayoutChange={next => requestChange("Layout", next, () => setLayout(next))} />}
    <output aria-label="Chart host request">{request}</output>
  </div>;
}
