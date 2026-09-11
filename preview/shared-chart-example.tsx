import { useState } from "react";
import { BarListCard, Checkbox, EarningsChartCard, FunnelChartCard, MostActiveDaysCard, OrdersChartCard, RevenueChartCard, Select, SleepScoreCard, StageBarsCard, StepsCard } from "@harso/ui";
import type { ExampleState } from "./examples";

const cards = { BarListCard, EarningsChartCard, FunnelChartCard, MostActiveDaysCard, OrdersChartCard, RevenueChartCard, SleepScoreCard, StageBarsCard, StepsCard };
export const sharedChartExports = Object.keys(cards);
export function SharedChartExample({ component, state }: { component: string; state: ExampleState }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState("week");
  const [date, setDate] = useState<string | null>("2026-09-01");
  const [hold, setHold] = useState(false);
  const scenario = selected ?? (state === "error" ? "invalid" : "fractional");
  const Card = cards[component as keyof typeof cards];
  const values = scenario === "empty" ? [] : scenario === "zero" ? [0, 0, 0] : scenario === "signed" ? [-2, 0, 3] : scenario === "invalid" ? [NaN, Infinity, .5] : scenario === "extreme" ? [-Number.MAX_VALUE, 0, Number.MAX_VALUE] : scenario === "many" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, .25, .5];
  const data = values.map((value, index) => ({ label: state === "long-content" ? `Stage ${index + 1} with a longer descriptive label` : `Stage ${index + 1}`, value, secondary: value / 2, target: 1 }));
  const title = component.replace(/([a-z])([A-Z])/g, "$1 $2");
  const disabled = state === "disabled";
  return <div className="hk-shared-chart-example"><label>Sample data<Select aria-label="Chart scenario" value={scenario} disabled={disabled} onChange={event => setSelected(event.target.value)}><option value="fractional">Zero and fractional</option><option value="zero">All zero</option><option value="signed">Signed values</option><option value="invalid">Missing values</option><option value="extreme">Finite extremes</option><option value="many">Eight stages</option><option value="empty">Empty</option></Select></label><Checkbox label="Keep supplied chart selection" checked={hold} disabled={disabled} onChange={event => setHold(event.target.checked)} />{component === "MostActiveDaysCard" ? <MostActiveDaysCard title={title} caption="Illustrative dated activity" days={data.map((item, index) => ({ date: `2026-09-${String(index + 1).padStart(2, "0")}`, rings: [{ id: "activity", label: item.label, value: item.value, target: 1 }] }))} selectedDate={date} onSelectedDateChange={next => { if (!hold) setDate(next); }} months={["2026-09", "2026-10"]} today="2026-09-08" disabled={disabled} /> : <Card title={title} caption="Illustrative host values · no inferred totals" data={data} disabled={disabled} range={range} ranges={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} onRangeChange={next => { if (!hold) setRange(next); }} />}</div>;
}
