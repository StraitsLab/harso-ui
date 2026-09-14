import { useEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import { Button, Select } from "./primitives";
import { Tabs } from "./navigation";
import { MonthPanel } from "./dates";
import { InteractiveChart, type InteractiveChartProps } from "./interactive-charts";
export type { InteractiveChartProps, ChartRow, ChartSeries, ChartRange } from "./interactive-charts";

export type ChartDatum = { label: string; value: number; secondary?: number; color?: string; icon?: ReactNode; target?: number; unit?: string };
export type ChartCardProps = ComponentPropsWithRef<"article"> & { title: string; value?: ReactNode; caption?: ReactNode; data?: readonly ChartDatum[]; children?: ReactNode };
export type DataChartCardProps = ChartCardProps & {
  disabled?: boolean; loading?: boolean; error?: string; mono?: boolean; showIcons?: boolean;
  shape?: "eased" | "sharp"; range?: string; ranges?: readonly { value: string; label: string }[];
  onRangeChange?: (value: string) => void;
};
type ChartPlotProps = { data: readonly ChartDatum[]; title: string; active: number | null; inspect: (index: number) => ComponentPropsWithRef<"button">; onInspect: (index: number) => void; showIcons: boolean; limit?: number; display?: "value" | "share"; comparison?: boolean; tapered?: boolean; shape?: "eased" | "sharp" };
type RadarVariant = "filled" | "dots" | "lines" | "score";
type RadialLayout = "rings" | "labels" | "grid" | "gauge" | "solid" | "stacked";
type ChartAnatomyProps = { radarVariant?: RadarVariant; radialLayout?: RadialLayout; score?: number; showTiles?: boolean; anatomyControls?: ReactNode };
export type RadarChartCardProps = DataChartCardProps & { variant?: RadarVariant; defaultVariant?: RadarVariant; onVariantChange?: (variant: RadarVariant) => void; showVariantControl?: boolean; score?: number; showTiles?: boolean };
export type RadialChartCardProps = DataChartCardProps & { layout?: RadialLayout; defaultLayout?: RadialLayout; onLayoutChange?: (layout: RadialLayout) => void; showLayoutControl?: boolean; showTiles?: boolean };
function BarChart({ data, title, active, inspect, showIcons, comparison = false }: ChartPlotProps) {
  if (!data.length) return <div className="hk-chart-empty">No data</div>;
  const values = data.flatMap(item => comparison ? [item.value, item.secondary] : [item.value]).filter((item): item is number => typeof item === "number" && Number.isFinite(item));
  const scale = values.reduce((maximum, item) => Math.max(maximum, Math.abs(item)), 0) || 1;
  const [minimum, maximum] = values.reduce(([low, high], item) => [Math.min(low, item / scale), Math.max(high, item / scale)], [0, 0]);
  const range = maximum - minimum || 1;
  const baseline = -minimum / range * 100;
  return <>{comparison && <div className="hk-chart-comparison-legend" aria-label={`${title} series`}><span>Current</span><span>Previous</span></div>}<div className="hk-bar-canvas"><div className="hk-bar-guides" aria-hidden="true">{[1, .5, 0].map(level => <span key={level} style={{top: `${(1-level)*120}px`}}><b>{Number(((minimum + range * level) * scale).toPrecision(4))}</b></span>)}</div><div className="hk-chart-bars" role="group" tabIndex={0} aria-label={`${title} chart`}>{data.map((item, index) => {
    const valid = Number.isFinite(item.value);
    const height = valid ? Math.abs(item.value / scale) / range * 100 : 0;
    const priorHeight = Number.isFinite(item.secondary) ? Math.abs(item.secondary! / scale) / range * 100 : 0;
    return <button {...inspect(index)} className="hk-chart-bar-column" data-active={active === index} key={index}><span className={`hk-chart-bar-track${comparison ? " hk-chart-comparison-track" : ""}`} aria-hidden="true"><span className="hk-chart-zero" style={{ bottom: `${baseline}%` }} />{valid && <span className="hk-chart-bar" style={{ height: `${height}%`, bottom: `${item.value < 0 ? baseline - height : baseline}%`, background: item.color }} />}{comparison && Number.isFinite(item.secondary) && <span className="hk-chart-bar hk-chart-prior-bar" style={{ height: `${priorHeight}%`, bottom: `${item.secondary! < 0 ? baseline - priorHeight : baseline}%` }} />}</span><small>{showIcons && <span aria-hidden="true">{item.icon}</span>}{item.label}</small><span className="hk-chart-number"><span>{valid ? item.value : "Unavailable"}</span>{comparison && <span className="hk-chart-prior-number"> / {Number.isFinite(item.secondary) ? item.secondary : "—"}</span>}</span></button>;
  })}</div></div></>;
}
function FunnelChart({ data, title, active, inspect, showIcons, limit, display = "value", tapered = false, shape = "eased" }: ChartPlotProps) {
  if (!data.length) return <div className="hk-chart-empty">No data</div>;
  const maximum = data.reduce((largest, item) => Number.isFinite(item.value) && item.value >= 0 ? Math.max(largest, item.value) : largest, 0) || 1;
  const total = data.every(item => Number.isFinite(item.value) && item.value >= 0) ? data.reduce((sum, item) => sum + item.value / maximum, 0) : 0;
  return <div className="hk-chart-funnel" role="group" aria-label={`${title} chart`}><span className="hk-chart-domain">Max {maximum}</span>{data.slice(0, limit ?? data.length).map((item, index) => {
    const valid = Number.isFinite(item.value) && item.value >= 0;
    const formatted = display === "share" ? total > 0 ? `${Number((item.value / maximum / total * 100).toFixed(2))}%` : "Share unavailable" : valid ? item.value : "Unavailable";
    const interaction = inspect(index);
    const next = data[index + 1]?.value;
    const top = valid ? item.value / maximum * 100 : 0;
    const bottom = top === 0 ? 0 : Number.isFinite(next) && next! >= 0 ? next! / maximum * 100 : top;
    const outline = shape === "sharp" ? `M${100 - top} 0 H${100 + top} L${100 + bottom} 36 H${100 - bottom} Z` : `M${100 - top} 0 H${100 + top} C${100 + top} 18 ${100 + bottom} 18 ${100 + bottom} 36 H${100 - bottom} C${100 - bottom} 18 ${100 - top} 18 ${100 - top} 0 Z`;
    return <button {...interaction} aria-label={display === "share" ? `${interaction["aria-label"]} · ${formatted}` : interaction["aria-label"]} className="hk-chart-funnel-row" data-active={active === index} key={index}><span className="hk-chart-funnel-label"><span>{showIcons && <span aria-hidden="true">{item.icon}</span>}{item.label}</span><span className="hk-chart-number">{formatted}</span></span>{tapered ? valid && <svg className="hk-chart-funnel-shape" viewBox="0 0 200 36" preserveAspectRatio="none" aria-hidden="true"><path d={outline} style={{fill:item.color}} /></svg> : <span className="hk-chart-funnel-track" aria-hidden="true">{valid && <span className="hk-chart-funnel-bar" style={{ width: `${item.value / maximum * 100}%`, background: item.color }} />}</span>}</button>;
  })}</div>;
}
function ChartSvg({ data, kind, title, active, inspect, onInspect, radarVariant = "filled", radialLayout = "rings", score, showTiles = false }: ChartPlotProps & ChartAnatomyProps & { kind: string }) {
  if (!data.length) return <div className="hk-chart-empty">No data</div>;
  const valid = data.map(item => Number.isFinite(item.value) && item.value >= 0 && (kind !== "radial" || item.value <= 100));
  const maximum = data.reduce((largest, item, index) => valid[index] ? Math.max(largest, item.value) : largest, 0) || 1;
  const points = data.map((item, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / data.length;
    const radius = valid[index] ? item.value / maximum * 36 : 0;
    return { x: 54 + Math.cos(angle) * radius, y: 54 + Math.sin(angle) * radius, axisX: 54 + Math.cos(angle) * 43, axisY: 54 + Math.sin(angle) * 43 };
  });
  const metricList = <ul className={`hk-chart-metrics${showTiles ? " hk-chart-stat-tiles" : ""}`}>{data.map((item, index) => <li key={index}><button {...inspect(index)} data-active={active === index}><span>{kind === "radial" && <span className="hk-ring-position"><i style={{background: item.color ?? ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-faint)"][index % 3]}} />Ring {index + 1} · </span>}{kind === "radar" && !item.label.trim() ? "Unlabeled category" : item.label}</span><strong>{valid[index] ? kind === "radial" ? `${item.value}%` : item.value : "Unavailable"}</strong></button></li>)}</ul>;
  if (kind === "radar") return <>
    <div className="hk-radar-plot" data-variant={radarVariant}>
      <svg className="hk-chart-svg" viewBox="0 0 108 108" role="img" aria-label={`${title} chart`}>
        <title>{data.map((item, index) => `${item.label}: ${valid[index] ? item.value : "Unavailable"}`).join("; ")}</title>
        {[1/3, 2/3, 1].map(level => <path key={level} className="hk-radar-guide" d={`${points.map((point, index) => `${index ? "L" : "M"}${54 + (point.axisX - 54) * 36 / 43 * level},${54 + (point.axisY - 54) * 36 / 43 * level}`).join(" ")} Z`} />)}
        {points.map((point, index) => <line key={index} className="hk-radar-axis" data-active={active === index} x1="54" y1="54" x2={point.axisX} y2={point.axisY} onPointerEnter={() => onInspect(index)} onPointerDown={() => onInspect(index)} />)}
        {(radarVariant === "filled" || radarVariant === "score") && valid.every(Boolean) && <polygon className="hk-chart-radar" points={points.map(point => `${point.x},${point.y}`).join(" ")} onPointerEnter={() => onInspect(-1)} onPointerDown={() => onInspect(-1)} />}
        {radarVariant === "lines" && points.map((point, index) => {
          const next = (index + 1) % points.length;
          return points.length > 1 && valid[index] && valid[next] && <line key={index} className="hk-radar-edge" x1={point.x} y1={point.y} x2={points[next].x} y2={points[next].y} onPointerEnter={() => onInspect(index)} onPointerDown={() => onInspect(index)} />;
        })}
        {points.map((point, index) => valid[index] && <circle key={index} className="hk-chart-radar-point" data-active={active === index} cx={point.x} cy={point.y} r={active === index ? 4 : 2} onPointerEnter={() => onInspect(index)} onPointerDown={() => onInspect(index)} />)}
        
      </svg>
      {points.map((point,index) => <span key={index} className="hk-radar-axis-label" data-active={active === index} style={{left: `${point.axisX / 108 * 100}%`, top: `${point.axisY / 108 * 100}%`}} aria-hidden="true">{data[index].label.trim() || "Unlabeled category"}</span>)}
      
      {radarVariant === "score" && <div className="hk-radar-score"><small>Score</small><strong>{Number.isFinite(score) && score! >= 0 ? score : "Unavailable"}</strong></div>}
    </div>{metricList}
  </>;
  const separate = radialLayout === "grid" || radialLayout === "gauge" || radialLayout === "solid";
  const segment = 100 / data.length;
  const radial = (item: ChartDatum, index: number) => {
    const radius = separate || radialLayout === "stacked" ? 42 : 44 - index * 34 / data.length;
    const band = separate || radialLayout === "stacked" ? 9 : Math.min(9, 27 / data.length);
    const length = radialLayout === "gauge" ? 50 : radialLayout === "stacked" ? segment : 100;
    const offset = radialLayout === "stacked" ? -index * segment : 0;
    const rotation = radialLayout === "gauge" ? "rotate(180 54 54)" : "rotate(-90 54 54)";
    const color = item.color ?? ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-faint)"][index % 3];
    const angle = item.value / 100 * 2 * Math.PI - Math.PI / 2;
    const sector = !valid[index] || item.value === 0 ? "" : item.value === 100 ? "M54 12 A42 42 0 1 1 54 96 A42 42 0 1 1 54 12 Z" : `M54 54 L54 12 A42 42 0 ${item.value > 50 ? 1 : 0} 1 ${54 + Math.cos(angle) * 42} ${54 + Math.sin(angle) * 42} Z`;
    return <g key={index} className={valid[index] ? "hk-chart-radial" : undefined} style={{ color }} role="img" aria-label={data.length === 1 ? `${title} chart` : `${title} chart · ${item.label}: ${valid[index] ? `${item.value}%` : "Unavailable"}`} onPointerEnter={() => onInspect(index)} onPointerDown={() => onInspect(index)}>
      {radialLayout === "solid" ? <><circle className="hk-radial-track" cx="54" cy="54" r="42" />{valid[index] && <path className="hk-radial-value hk-radial-sector" data-value={item.value} data-active={active === index} d={sector} fill="currentColor" />}</> : <>
        <circle className="hk-radial-track" cx="54" cy="54" r={radius} pathLength="100" transform={rotation} strokeWidth={band} strokeDasharray={`${length} 100`} strokeDashoffset={offset} />
        {valid[index] && <circle className="hk-radial-value" data-value={item.value} data-active={active === index} cx="54" cy="54" r={radius} pathLength="100" transform={rotation} stroke="currentColor" strokeWidth={band} strokeDasharray={`${item.value / 100 * length} 100`} strokeDashoffset={offset} />}
      </>}
    </g>;
  };
  return <>
    <div className="hk-radial-plot" data-layout={radialLayout}>
      {separate ? data.map((item, index) => <div className="hk-radial-panel" key={index}><svg viewBox={radialLayout === "gauge" ? "0 0 108 60" : "0 0 108 108"}>{radial(item, index)}</svg><span>{item.label}</span></div>) : <svg viewBox="0 0 108 108">{data.map(radial)}</svg>}
      {radialLayout === "labels" && <ul className="hk-radial-labels" aria-hidden="true">{data.map((item, index) => <li className="hk-radial-label" key={index} data-active={active === index}>{item.label}: {valid[index] ? `${item.value}%` : "Unavailable"}</li>)}</ul>}
    </div>
    {radialLayout === "stacked" && <small className="hk-radial-scale">Equal segments; each metric uses its own 0–100% scale.</small>}
    {metricList}
  </>;
}
function SleepChart({ data, title, active, inspect, onInspect }: ChartPlotProps) {
  if (!data.length) return <div className="hk-chart-empty">No data</div>;
  const valid = (item: ChartDatum) => Number.isFinite(item.value) && item.value >= 0 && Number.isFinite(item.target ?? 100) && (item.target ?? 100) > 0;
  const segment = 50 / data.length;
  return <div className="hk-sleep-group"><svg className="hk-sleep-plot" viewBox="0 0 108 64" role="img" aria-label={`${title} chart`}>{data.map((item, index) => <g key={index} onPointerEnter={() => onInspect(index)} onPointerDown={() => onInspect(index)}><circle cx="54" cy="54" r="42" pathLength="100" transform="rotate(180 54 54)" fill="none" stroke="var(--hk-line)" strokeWidth="9" strokeDasharray={`${segment} 100`} strokeDashoffset={-index * segment} />{valid(item) && <circle className="hk-sleep-segment" data-active={active === index} cx="54" cy="54" r="42" pathLength="100" transform="rotate(180 54 54)" fill="none" stroke={item.color ?? ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-faint)"][index % 3]} strokeWidth="9" strokeDasharray={`${Math.min(1, item.value / (item.target ?? 100)) * segment} 100`} strokeDashoffset={-index * segment} />}</g>)}</svg><ul className="hk-chart-metrics">{data.map((item,index)=><li key={index}><button {...inspect(index)} data-active={active===index}><i className="hk-sleep-key" style={{background: item.color ?? ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-faint)"][index % 3]}} aria-hidden="true" />{item.label}: {valid(item) ? `${item.value} / ${item.target ?? 100}${item.unit ? ` ${item.unit}` : ""}` : "Unavailable"}</button></li>)}</ul></div>;
}
function comparisonSummary(data: readonly ChartDatum[]) {
  const total = (key: "value" | "secondary") => {
    const values = data.map(item => item[key]).filter((item): item is number => typeof item === "number" && Number.isFinite(item));
    const sum = values.reduce((sum, item) => sum + item, 0);
    return { amount: values.length && Number.isFinite(sum) ? sum : null, complete: values.length === data.length && data.length > 0 };
  };
  const current = total("value"), previous = total("secondary");
  const change = current.complete && previous.complete && current.amount !== null && previous.amount !== null && previous.amount > 0 ? (current.amount / previous.amount - 1) * 100 : NaN;
  return `Current${current.complete ? "" : " observed"}: ${current.amount ?? "Unavailable"} · Previous${previous.complete ? "" : " observed"}: ${previous.amount ?? "Unavailable"} · ${Number.isFinite(change) ? `Change: ${change >= 0 ? "+" : ""}${Number(change.toFixed(2))}%` : "Change unavailable"}`;
}
function ChartCard({ title, value, caption, data = [], children, className = "", disabled = false, loading = false, error, mono = false, showIcons = true, shape = "eased", range = "", ranges = [], onRangeChange, limit, display, radarVariant, radialLayout, score, showTiles, anatomyControls, ...props }: DataChartCardProps & ChartAnatomyProps & { limit?: number; display?: "value" | "share" }) {
  const kind = className.match(/hk-chart-card--([a-z-]+)/)?.[1] ?? "bar";
  const presentation = radarVariant ?? radialLayout ?? "";
  const [inspection, setInspection] = useState<{ data: readonly ChartDatum[]; range: string; presentation: string; index: number } | null>(null);
  const focused = useRef<typeof inspection>(null);
  useEffect(() => { setInspection(null); focused.current = null; }, [presentation]);
  const [expansion, setExpansion] = useState<{ data: readonly ChartDatum[]; range: string } | null>(null);
  const expanded = expansion?.data === data && expansion.range === range;
  const count = Number.isSafeInteger(limit) && limit! > 0 ? limit! : data.length;
  const blocked = disabled || loading || !!error;
  const active = !blocked && inspection?.data === data && inspection.range === range && inspection.presentation === presentation && (inspection.index === -1 || data[inspection.index]) ? inspection.index : null;
  const valid = (item: ChartDatum) => Number.isFinite(item.value) && (!["radar", "radial", "funnel", "bar-list", "stages", "sleep"].includes(kind) || item.value >= 0) && (kind !== "radial" || item.value <= 100) && (kind !== "sleep" || (Number.isFinite(item.target ?? 100) && (item.target ?? 100) > 0));
  const describe = (item: ChartDatum) => `${kind === "radar" && !item.label.trim() ? "Unlabeled category" : item.label}: ${valid(item) ? `${item.value}${kind === "sleep" ? ` / ${item.target ?? 100}${item.unit ? ` ${item.unit}` : ""}` : ""}` : "Unavailable"}${item.secondary === undefined && kind !== "orders" ? "" : ` · Previous: ${Number.isFinite(item.secondary) ? item.secondary : "Unavailable"}`}`;
  const inspect = (index: number): ComponentPropsWithRef<"button"> => ({ type: "button", disabled: blocked, "aria-label": describe(data[index]), onFocus: () => { if (!blocked) { focused.current = { data, range, presentation, index }; setInspection(focused.current); } }, onBlur: () => { focused.current = null; setInspection(null); }, onPointerEnter: () => { if (!blocked) setInspection({ data, range, presentation, index }); }, onPointerDown: () => { if (!blocked) setInspection({ data, range, presentation, index }); }, onClick: () => { if (!blocked) setInspection({ data, range, presentation, index }); } });
  const plot = { radarVariant, radialLayout, score, showTiles, data, title, active, inspect, showIcons, limit: expanded ? undefined : count, display, comparison: kind === "orders", tapered: kind === "funnel", shape, onInspect: (index: number) => { if (!blocked) setInspection({ data, range, presentation, index }); } };
  const summary = kind === "orders" ? comparisonSummary(data) : "Focus or touch a value to inspect";
  return <article {...props} className={`hk-chart-card ${className}`} data-mono={mono} data-shape={shape} data-inspecting={active !== null} aria-busy={loading} onKeyDown={event => { props.onKeyDown?.(event); if (!event.defaultPrevented && event.key === "Escape") { focused.current = null; setInspection(null); } }} onPointerLeave={event => { props.onPointerLeave?.(event); if (event.pointerType !== "touch") setInspection(focused.current); }}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{children != null && value !== undefined && <strong>{value}</strong>}{ranges.length > 0 && <Select aria-label={`${title} range`} value={range} disabled={blocked || !onRangeChange} onChange={event => { if (!blocked && event.target.value !== range) onRangeChange?.(event.target.value); }}>{!ranges.some(option => option.value === range) && <option value={range}>Select range</option>}{ranges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>}{anatomyControls}</header>
    {children ?? (error ? <p role="alert">{error}</p> : loading ? <p role="status">Loading data…</p> : <><output role="status" className="hk-chart-inspection">{active === -1 ? data.map(describe).join(" · ") : active !== null ? describe(data[active]) : typeof value === "number" && !Number.isFinite(value) ? "Unavailable" : value ?? (kind === "orders" || kind === "revenue" ? summary : "Focus or touch a value to inspect")}</output>{kind === "funnel" || kind === "bar-list" || kind === "stages" ? <FunnelChart {...plot} /> : kind === "sleep" ? <SleepChart {...plot} /> : kind === "radar" || kind === "radial" ? <ChartSvg {...plot} kind={kind} /> : <BarChart {...plot} />}{kind === "bar-list" && count < data.length && <Button disabled={blocked} aria-expanded={expanded} onClick={() => { if (!blocked) { setInspection(null); focused.current = null; setExpansion(expanded ? null : { data, range }); } }}>{expanded ? "Show less" : `Show all ${data.length}`}</Button>}</>)}
  </article>;
}
export type ActivityRing = { id: string; label: string; value: number; target: number; unit?: string; color?: string };
export type ActivityRingsProps = Omit<ChartCardProps, "data"> & { rings?: readonly ActivityRing[]; disabled?: boolean; calendar?: ReactNode; targetLabel?: string };
export function ActivityRingsCard({ title, caption, value, rings = [], disabled = false, calendar, targetLabel = "Goal", children, className = "", ...props }: ActivityRingsProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const invalidIds = rings.some(ring => !ring.id.trim()) || new Set(rings.map(ring => ring.id)).size !== rings.length;
  const valid = invalidIds ? [] : rings.filter(ring => Number.isFinite(ring.value) && ring.value >= 0 && Number.isFinite(ring.target) && ring.target > 0);
  const active = disabled ? undefined : valid.find(ring => ring.id === focused);
  const colors = ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-tertiary)"];
  const description = (ring: ActivityRing) => `${ring.label}: ${ring.value} / ${ring.target}${ring.unit ? ` ${ring.unit}` : ""}`;
  const percentage = (ring: ActivityRing) => { const percent = ring.value / ring.target * 100; return Number.isFinite(percent) ? `${Math.round(percent)}%` : "Above goal"; };
  const band = Math.min(22, 78 / Math.max(1, valid.length));
  return <article {...props} className={`hk-chart-card hk-activity-rings ${className}`} onKeyDown={event => { props.onKeyDown?.(event); if (!event.defaultPrevented && event.key === "Escape") setFocused(null); }}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{value !== undefined && <strong>{value}</strong>}</header>
    {children ?? <>
      <div className="hk-activity-rings-body">
        {valid.length > 0 && <svg viewBox="0 0 240 240" role="img" aria-label={`${title} chart`} className="hk-activity-rings-plot"><title>{valid.map(description).join("; ")}</title>{valid.map((ring, index) => {
          const radius = 106 - index * band;
          const progress = ring.value >= ring.target ? 100 : ring.value / ring.target * 100;
          return <g key={ring.id} opacity={active && active.id !== ring.id ? .28 : 1} onPointerEnter={() => { if (!disabled) setFocused(ring.id); }} onPointerLeave={event => { if (event.pointerType !== "touch") setFocused(null); }} onPointerDown={() => { if (!disabled) setFocused(ring.id); }}>
            <circle cx="120" cy="120" r={radius} fill="none" stroke="var(--hk-line)" strokeWidth={band * .7} />
            <circle className="hk-activity-ring-value" cx="120" cy="120" r={radius} fill="none" stroke={ring.color ?? colors[index % colors.length]} strokeWidth={band * .7} pathLength="100" strokeDasharray={`${progress} 100`} transform="rotate(-90 120 120)" />
          </g>;
        })}</svg>}
        <div className="hk-activity-ring-details"><output role="status">{active ? description(active) : `${valid.length} activity ${valid.length === 1 ? "metric" : "metrics"}`}</output>
          {invalidIds ? <p>Ring IDs must be unique and non-empty.</p> : !valid.length ? <p>No valid activity metrics.</p> : <ul aria-label={`${title} metrics`}>{valid.map((ring, index) => <li key={ring.id}><Button disabled={disabled} aria-pressed={active?.id === ring.id} onFocus={() => setFocused(ring.id)} onBlur={() => setFocused(null)} onPointerEnter={() => { if (!disabled) setFocused(ring.id); }} onPointerLeave={event => { if (event.pointerType !== "touch" && document.activeElement !== event.currentTarget) setFocused(null); }} onClick={() => setFocused(ring.id)}><span className="hk-activity-ring-key" style={{ background: ring.color ?? colors[index % colors.length] }} aria-hidden="true" /><span><strong>{ring.label}</strong><span>{ring.value} / {ring.target}{ring.unit ? ` ${ring.unit}` : ""}</span><small>{targetLabel} · {percentage(ring)}</small></span></Button></li>)}</ul>}
          {!invalidIds && valid.length !== rings.length && <p>{rings.length - valid.length} unavailable {rings.length - valid.length === 1 ? "metric" : "metrics"} omitted.</p>}
        </div>
      </div>
      {calendar != null && <div className="hk-activity-rings-calendar">{calendar}</div>}
    </>}
  </article>;
}
export function AreaChartCard(props: InteractiveChartProps) { return <InteractiveChart {...props} kind="area" />; }
export type BarListCardProps = DataChartCardProps & { limit?: number; display?: "value" | "share"; tabs?: readonly { value: string; label: string; data: readonly ChartDatum[] }[]; tab?: string; onTabChange?: (value: string) => void };
export function BarListCard({ tabs, tab, onTabChange, ...props }: BarListCardProps) {
  if (!tabs?.length || props.children != null) return <ChartCard {...props} className={`hk-chart-card--bar-list ${props.className ?? ""}`} />;
  if (tabs.some(item => !item.value.trim()) || new Set(tabs.map(item => item.value)).size !== tabs.length || (tab !== undefined && !tabs.some(item => item.value === tab))) return <ChartCard {...props} error="List IDs must be unique and select an available list." />;
  const blocked = props.disabled || props.loading || !!props.error || (tab !== undefined && !onTabChange);
  return <fieldset className="hk-chart-tabbed" disabled={blocked}><legend className="hk-sr-only">{props.title}</legend><Tabs label={`${props.title} lists`} value={tab} onValueChange={next => { if (!blocked) onTabChange?.(next); }} items={tabs.map(item => ({ value: item.value, label: item.label, content: <BarListCard {...props} data={item.data} /> }))} /></fieldset>;
}
export function ComboChartCard(props: InteractiveChartProps) { return <InteractiveChart {...props} kind="combo" />; }
export function EarningsChartCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--earnings ${props.className ?? ""}`} />; }
export function FunnelChartCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--funnel ${props.className ?? ""}`} />; }
export type HeatmapRow = { label: string; values: readonly (number | null)[] };
export type HeatmapChartProps = Omit<ChartCardProps, "data"> & {
  rows?: readonly HeatmapRow[]; columns?: readonly string[]; max?: number; color?: string;
  format?: (value: number) => string; delta?: ReactNode; disabled?: boolean;
  range?: string; ranges?: readonly { value: string; label: string }[]; onRangeChange?: (value: string) => void;
};
export function HeatmapChartCard({ title, caption, value, rows = [], columns = [], max, color = "var(--hk-accent)", format = String, delta, disabled = false, range = "", ranges = [], onRangeChange, children, className = "", ...props }: HeatmapChartProps) {
  const [inspection, setInspection] = useState<{ row: string; column: string } | null>(null);
  const [windowStart, setWindowStart] = useState(0);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { if (typeof window.matchMedia !== "function") return; const query = window.matchMedia("(max-width: 640px)"); const update = () => setNarrow(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  const firstColumn = narrow ? Math.min(windowStart, Math.max(0, columns.length - 2)) : 0;
  const visibleColumns = narrow ? columns.slice(firstColumn, firstColumn + 2) : columns;
  const focused = useRef<typeof inspection>(null);
  const unique = (labels: readonly string[]) => new Set(labels).size === labels.length && Array.from(labels).every(label => typeof label === "string" && label.trim());
  const values = rows.flatMap(row => Array.from(row.values));
  const total = values.reduce<number>((sum, item) => sum + (item ?? 0), 0);
  const missing = values.filter(item => item === null).length;
  const summary = values.length === missing ? "No observations supplied." : missing ? `Observed total: ${format(total)} · ${missing} missing` : `Total: ${format(total)}`;
  const error = !unique(columns) || !unique(rows.map(row => row.label)) ? "Axis labels must be unique and non-empty."
    : rows.some(row => row.values.length !== columns.length) || values.some(item => item !== null && (typeof item !== "number" || !Number.isFinite(item) || item < 0)) ? "Each row must match the columns with finite nonnegative values or null for missing data."
    : max !== undefined && (!Number.isFinite(max) || max <= 0) ? "Intensity ceiling must be finite and positive."
    : !Number.isFinite(total) ? "Matrix total exceeds the supported numeric range." : null;
  const ceiling = max ?? values.reduce<number>((highest, item) => Math.max(highest, item ?? 0), 0);
  const activeRow = !disabled && !error && inspection ? rows.find(row => row.label === inspection.row) : undefined;
  const activeColumn = inspection ? columns.indexOf(inspection.column) : -1;
  const active = activeRow && activeColumn >= 0 ? { row: activeRow.label, column: columns[activeColumn], value: activeRow.values[activeColumn] } : null;
  const describe = (row: string, column: string, item: number | null) => `${row} · ${column}: ${item === null ? "No data" : format(item)}`;
  const inspect = (row: string, column: string) => { if (!disabled) setInspection({ row, column }); };
  return <article {...props} className={`hk-chart-card hk-heatmap ${className}`} style={{ "--hk-heatmap-color": color, ...props.style } as CSSProperties} onKeyDown={event => { props.onKeyDown?.(event); if (!event.defaultPrevented && event.key === "Escape") setInspection(null); }}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{ranges.length > 0 && <Select aria-label={`${title} range`} value={range} disabled={disabled || !onRangeChange} onChange={event => { if (!disabled && event.target.value !== range) onRangeChange?.(event.target.value); }}>{!ranges.some(option => option.value === range) && <option value={range}>Select range</option>}{ranges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>}</header>
    {children ?? (error ? <p role="alert">{error}</p> : <>
      <div className="hk-heatmap-headline"><output role="status">{active ? describe(active.row, active.column, active.value) : value ?? summary}</output>{delta && <span>{delta}</span>}</div>
      {narrow && columns.length > 2 && <div className="hk-chart-pager"><Button aria-label="Previous time window" disabled={disabled || firstColumn === 0} onClick={() => setWindowStart(Math.max(0, firstColumn - 2))}>←</Button><span>{visibleColumns[0]} – {visibleColumns[visibleColumns.length - 1]}</span><Button aria-label="Next time window" disabled={disabled || firstColumn + 2 >= columns.length} onClick={() => setWindowStart(firstColumn + 2)}>→</Button></div>}
      {rows.length && columns.length ? <div className="hk-heatmap-scroll" role="region" aria-label={`${title} matrix`} tabIndex={0} onPointerLeave={event => { if (event.pointerType !== "touch") setInspection(focused.current); }}>
        <table aria-label={`${title} values`}><thead><tr><th scope="col">Series</th>{visibleColumns.map(column => <th key={column} scope="col" data-active={active?.column === column}>{column}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.label}><th scope="row" data-active={active?.row === row.label}>{row.label}</th>{row.values.map((item, index) => {
            if (narrow && (index < firstColumn || index >= firstColumn + 2)) return null;
            const intensity = item === null || ceiling === 0 ? 0 : item >= ceiling ? 1 : item / ceiling;
            const selected = active?.row === row.label && active.column === columns[index];
            return <td key={columns[index]} data-axis-active={active?.row === row.label || active?.column === columns[index]}><Button className="hk-heatmap-cell" aria-label={describe(row.label, columns[index], item)} disabled={disabled} data-intensity={intensity} data-missing={item === null} data-active={selected} style={{ "--hk-heatmap-intensity": `${8 + Math.round(intensity * 4) * 10}%` } as CSSProperties} onFocus={() => { if (!disabled) { focused.current = { row: row.label, column: columns[index] }; inspect(row.label, columns[index]); } }} onBlur={() => { focused.current = null; setInspection(null); }} onPointerEnter={() => inspect(row.label, columns[index])} onPointerDown={() => inspect(row.label, columns[index])} onClick={() => inspect(row.label, columns[index])}>{item === null ? "—" : format(item)}</Button></td>;
          })}</tr>)}</tbody>
        </table>
      </div> : <p>No matrix data supplied.</p>}
      {rows.length > 0 && columns.length > 0 && <div className="hk-heatmap-legend" aria-label="Intensity scale"><span>{format(0)}</span><span className="hk-heatmap-ramp" aria-hidden="true" /><span>{format(ceiling)}{max !== undefined ? "+" : ""}</span><span>— No data</span></div>}
    </>)}
  </article>;
}
export function LineChartCard(props: InteractiveChartProps) { return <InteractiveChart {...props} kind="line" />; }
export function OrdersChartCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--orders ${props.className ?? ""}`} />; }
export function RadarChartCard({ variant, defaultVariant = "filled", onVariantChange, showVariantControl = false, ...props }: RadarChartCardProps) {
  const [local, setLocal] = useState(defaultVariant);
  const selected = variant ?? local;
  const blocked = props.disabled || props.loading || !!props.error || (variant !== undefined && !onVariantChange);
  const variants: readonly RadarVariant[] = ["filled", "dots", "lines", "score"];
  const controls = showVariantControl && <Select aria-label={`${props.title} variant`} value={selected} disabled={blocked} onChange={event => {
    const next = variants.find(item => item === event.target.value);
    if (!blocked && next && next !== selected) { if (variant === undefined) setLocal(next); onVariantChange?.(next); }
  }}>{variants.map(item => <option key={item} value={item}>{item}</option>)}</Select>;
  return <ChartCard {...props} radarVariant={selected} anatomyControls={controls} className={`hk-chart-card--radar ${props.className ?? ""}`} />;
}
export function RadialChartCard({ layout, defaultLayout = "rings", onLayoutChange, showLayoutControl = false, ...props }: RadialChartCardProps) {
  const [local, setLocal] = useState(defaultLayout);
  const selected = layout ?? local;
  const blocked = props.disabled || props.loading || !!props.error || (layout !== undefined && !onLayoutChange);
  const layouts: readonly RadialLayout[] = ["rings", "labels", "grid", "gauge", "solid", "stacked"];
  const controls = showLayoutControl && <Select aria-label={`${props.title} layout`} value={selected} disabled={blocked} onChange={event => {
    const next = layouts.find(item => item === event.target.value);
    if (!blocked && next && next !== selected) { if (layout === undefined) setLocal(next); onLayoutChange?.(next); }
  }}>{layouts.map(item => <option key={item} value={item}>{item}</option>)}</Select>;
  return <ChartCard {...props} radialLayout={selected} anatomyControls={controls} className={`hk-chart-card--radial ${props.className ?? ""}`} />;
}
export function RevenueChartCard({ data = [], value, range = "", ranges = [], onRangeChange, shape = "eased", mono = false, showIcons: _showIcons, className = "", ...props }: DataChartCardProps) {
  return <InteractiveChart {...props} kind="line" className={`hk-chart-card--revenue ${className}`} data={data.map(item => ({label:item.label,value:item.value,secondary:item.secondary}))} series={[{key:"value",label:"Current"},{key:"secondary",label:"Previous",color:mono ? "var(--hk-accent)" : "var(--hk-secondary)"}]} value={typeof value === "number" && !Number.isFinite(value) ? "Unavailable" : value ?? comparisonSummary(data)} shape={shape === "eased" ? "curved" : "sharp"} range={range} ranges={onRangeChange ? ranges.map(item=>({id:item.value,label:item.label})) : []} onRangeChange={onRangeChange} />;
}
export type SankeyNode = { name: string; color?: string };
export type SankeyLink = { source: string | number; target: string | number; value: number };
export type SankeyChartProps = Omit<ChartCardProps, "data"> & { nodes?: readonly SankeyNode[]; links?: readonly SankeyLink[]; format?: (value: number) => string; range?: string; ranges?: readonly { value: string; label: string }[]; onRangeChange?: (value: string) => void; disabled?: boolean };

function sankeyLayout(inputNodes: readonly SankeyNode[], inputLinks: readonly SankeyLink[]) {
  const names = new Map(inputNodes.map((node, index) => [node.name, index]));
  if (names.size !== inputNodes.length || inputNodes.some(node => !node.name.trim())) return "Node names must be unique and non-empty.";
  const nodes = inputNodes.map((node, index) => ({ ...node, index, incoming: 0, outgoing: 0, depth: 0, x: 0, y: 0, height: 0 }));
  const endpoint = (value: string | number) => typeof value === "string" ? names.get(value) : Number.isInteger(value) && value >= 0 && value < nodes.length ? value : undefined;
  const links = [] as { original: SankeyLink; source: typeof nodes[number]; target: typeof nodes[number]; via: typeof nodes; width: number; start: number; end: number; path: string }[];
  const degrees = nodes.map(() => 0);
  for (const original of inputLinks) {
    const source = endpoint(original.source), target = endpoint(original.target);
    if (source === undefined || target === undefined || !Number.isFinite(original.value) || original.value < 0) return "Links require existing endpoints and finite nonnegative values.";
    nodes[source].outgoing += original.value;
    nodes[target].incoming += original.value;
    degrees[target]++;
    links.push({ original, source: nodes[source], target: nodes[target], via: [], width: 0, start: 0, end: 0, path: "" });
  }
  if (nodes.some(node => !Number.isFinite(node.incoming) || !Number.isFinite(node.outgoing))) return "Flow totals exceed the supported numeric range.";
  const queue = nodes.filter(node => degrees[node.index] === 0);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const link of links.filter(link => link.source === queue[cursor])) {
      link.target.depth = Math.max(link.target.depth, link.source.depth + 1);
      degrees[link.target.index]--;
      if (!degrees[link.target.index]) queue.push(link.target);
    }
  }
  if (queue.length !== nodes.length) return "Sankey flows require an acyclic directed graph.";
  const total = nodes.filter(node => node.incoming === 0).reduce((sum, node) => sum + node.outgoing, 0);
  const sinkTotal = nodes.filter(node => node.outgoing === 0).reduce((sum, node) => sum + node.incoming, 0);
  if (!Number.isFinite(total) || !Number.isFinite(sinkTotal)) return "Flow totals exceed the supported numeric range.";
  const depth = Math.max(1, nodes.reduce((maximum, node) => Math.max(maximum, node.depth), 0));
  for (const node of nodes) if (node.outgoing === 0 && node.incoming > 0) node.depth = depth;
  for (const link of links) for (let level = link.source.depth + 1; level < link.target.depth; level++) {
    link.via.push({ ...link.source, depth: level, incoming: link.original.value, outgoing: link.original.value });
  }
  const layoutNodes = [...nodes, ...links.flatMap(link => link.via)];
  const columns = Array.from({ length: depth + 1 }, (_, index) => layoutNodes.filter(node => node.depth === index));
  const height = Math.max(240, columns.reduce((maximum, column) => Math.max(maximum, column.length * 32), 0));
  const width = Math.max(600, (depth + 1) * 180);
  const maximumWeight = nodes.reduce((maximum, node) => Math.max(maximum, node.incoming, node.outgoing), 0);
  if (links.some(link => link.original.value > 0 && link.original.value / maximumWeight === 0)) return "Flow weights exceed the supported relative numeric range.";
  const weight = (node: typeof nodes[number]) => maximumWeight ? Math.max(node.incoming, node.outgoing) / maximumWeight : 0;
  const scale = columns.reduce((smallest, column) => { const sum = column.reduce((total, node) => total + weight(node), 0); return sum ? Math.min(smallest, (height - Math.max(0, column.length - 1) * 16) / sum) : smallest; }, height);
  for (const column of columns) {
    let offset = (height - column.reduce((sum, node) => sum + weight(node) * scale, 0) - Math.max(0, column.length - 1) * 16) / 2;
    for (const node of column) { node.x = 20 + node.depth / depth * (width - 52); node.y = offset; node.height = weight(node) * scale; offset += node.height + 16; }
  }
  const sourceOffsets = nodes.map(() => 0), targetOffsets = nodes.map(() => 0);
  for (const link of links) {
    link.width = maximumWeight ? link.original.value / maximumWeight * scale : 0;
    link.start = link.source.y + sourceOffsets[link.source.index] + link.width / 2;
    link.end = link.target.y + targetOffsets[link.target.index] + link.width / 2;
    sourceOffsets[link.source.index] += link.width;
    targetOffsets[link.target.index] += link.width;
    let previousX = link.source.x + 12, previousY = link.start;
    link.path = `M${previousX} ${previousY}`;
    for (const waypoint of [...link.via.map(node => ({ x: node.x, y: node.y + node.height / 2, via: true })), { x: link.target.x, y: link.end, via: false }]) {
      const middle = (previousX + waypoint.x) / 2;
      link.path += ` C${middle} ${previousY} ${middle} ${waypoint.y} ${waypoint.x} ${waypoint.y}`;
      previousX = waypoint.x;
      previousY = waypoint.y;
      if (waypoint.via) { previousX += 12; link.path += ` H${previousX}`; }
    }
  }
  return { nodes, links, total, sinkTotal, width, height };
}

export function SankeyChartCard({ title, caption, value, nodes = [], links = [], format = String, range = "", ranges = [], onRangeChange, disabled = false, children, className = "", ...props }: SankeyChartProps) {
  const [inspection, setInspection] = useState<string | SankeyLink | null>(null);
  const graph = sankeyLayout(nodes, links);
  const [compact, setCompact] = useState(false);
  useEffect(() => { if (typeof window.matchMedia !== "function") return; const query = window.matchMedia("(max-width: 640px)"); const update = () => setCompact(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  const active = !disabled && typeof graph !== "string" && (typeof inspection === "string" ? graph.nodes.some(node => node.name === inspection) : graph.links.some(link => link.original === inspection)) ? inspection : null;
  const focus = (next: string | SankeyLink | null) => { if (!disabled) setInspection(next); };
  const linkLabel = (link: Exclude<typeof graph, string>["links"][number]) => `${link.source.name} → ${link.target.name}: ${format(link.original.value)}`;
  const nodeLabel = (node: Exclude<typeof graph, string>["nodes"][number]) => `${node.name} · In: ${format(node.incoming)} · Out: ${format(node.outgoing)}`;
  const activeNode = typeof graph !== "string" && typeof active === "string" ? graph.nodes.find(node => node.name === active) : undefined;
  const activeLink = typeof graph !== "string" && typeof active === "object" ? graph.links.find(link => link.original === active) : undefined;
  return <article {...props} className={`hk-chart-card hk-sankey ${className}`} onKeyDown={event => { props.onKeyDown?.(event); if (!event.defaultPrevented && event.key === "Escape") setInspection(null); }}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{value !== undefined && <strong>{value}</strong>}{ranges.length > 0 && <Select aria-label={`${title} range`} disabled={disabled || !onRangeChange} value={range} onChange={event => { if (!disabled && event.target.value !== range) onRangeChange?.(event.target.value); }}>{!ranges.some(option => option.value === range) && <option value={range}>Select range</option>}{ranges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>}</header>
    {children ?? (typeof graph === "string" ? <p role="alert">{graph}</p> : <>
      <output role="status">{activeNode ? nodeLabel(activeNode) : activeLink ? linkLabel(activeLink) : `Source total: ${format(graph.total)} · Sink total: ${format(graph.sinkTotal)}`}</output>
      {graph.links.some(link => link.original.value > 0) ? <div className="hk-sankey-scroll" tabIndex={0} role="region" aria-label={`${title} diagram`}><svg viewBox={compact ? `-16 0 ${graph.height + 32} ${graph.width}` : `0 -16 ${graph.width} ${graph.height + 32}`} preserveAspectRatio="none" role="img" aria-label={`${title} chart`} onPointerLeave={event => { if (event.pointerType !== "touch") setInspection(null); }}>
        <title>{graph.links.map(linkLabel).join("; ")}</title><g transform={compact ? `translate(${graph.height} 0) rotate(90)` : undefined}>
        {graph.links.map((link, index) => link.original.value > 0 && <path key={index} className="hk-sankey-link" d={link.path} fill="none" stroke={active === link.original || active === link.source.name || active === link.target.name ? "var(--hk-accent-mark)" : "var(--hk-secondary)"} strokeWidth={link.width} opacity={!active || active === link.original || active === link.source.name || active === link.target.name ? .55 : .1} onPointerEnter={() => focus(link.original)} onPointerDown={() => focus(link.original)}><title>{linkLabel(link)}</title></path>)}
        {graph.nodes.map(node => <g key={node.name} onPointerEnter={() => focus(node.name)} onPointerDown={() => focus(node.name)}><rect x={node.x} y={node.y} width="12" height={node.height} fill={active === node.name || activeLink?.source.name === node.name || activeLink?.target.name === node.name ? "var(--hk-accent-mark)" : "var(--hk-secondary)"}><title>{nodeLabel(node)}</title></rect></g>)}
      </g></svg><div className="hk-sankey-labels" aria-hidden="true">{graph.nodes.map(node => <span key={node.name} style={{ left: `${compact ? (graph.height - node.y - node.height / 2 + 16) / (graph.height + 32) * 100 : (node.x + 6) / graph.width * 100}%`, top: `${compact ? (node.x + 6) / graph.width * 100 : (node.y + node.height / 2 + 16) / (graph.height + 32) * 100}%` }}>{node.name}</span>)}</div></div> : <p>No positive flows supplied.</p>}
      <div className="hk-sankey-details"><section aria-label="Flow nodes"><h4>Nodes</h4>{graph.nodes.map(node => <Button key={node.name} disabled={disabled} onFocus={() => focus(node.name)} onBlur={() => setInspection(null)} onClick={() => focus(node.name)}>{nodeLabel(node)}{node.outgoing === 0 && node.incoming > 0 && graph.sinkTotal > 0 ? ` · ${(node.incoming / graph.sinkTotal * 100).toFixed(1).replace(/\.0$/, "")}% of sinks` : ""}<span aria-hidden="true">↗</span></Button>)}</section><section aria-label="Flow links"><h4>Links</h4>{graph.links.map((link, index) => <Button key={index} disabled={disabled} onFocus={() => focus(link.original)} onBlur={() => setInspection(null)} onClick={() => focus(link.original)}>{linkLabel(link)}<span aria-hidden="true">↗</span></Button>)}</section></div>
    </>)}
  </article>;
}
export type ScatterPoint = { x: number; y: number; z?: number; label?: string };
export type ScatterSeries = { label: string; color?: string; points: readonly ScatterPoint[] };
export type ScatterChartProps = Omit<ChartCardProps, "data"> & {
  series?: readonly ScatterSeries[]; bubble?: boolean; tiles?: boolean;
  axisLabels?: { x: string; y: string }; format?: (value: number) => string; formatX?: (value: number) => string;
  ranges?: readonly { value: string; label: string }[]; range?: string; onRangeChange?: (value: string) => void; disabled?: boolean;
};
export function ScatterChartCard({ title, caption, value, series = [], bubble = true, tiles = true, axisLabels = { x: "X", y: "Y" }, format = String, formatX = String, ranges = [], range = "", onRangeChange, disabled = false, children, className = "", ...props }: ScatterChartProps) {
  const [inspection, setInspection] = useState<{ series: string; point: ScatterPoint } | null>(null);
  const groups = series.map(group => ({ ...group, points: group.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y) && (point.z === undefined || (Number.isFinite(point.z) && point.z >= 0))) }));
  const points = groups.flatMap(group => group.points);
  const active = !disabled && inspection && groups.some(group => group.label === inspection.series && group.points.includes(inspection.point)) ? inspection : null;
  const extent = (axis: "x" | "y") => points.reduce(([minimum, maximum], point) => [Math.min(minimum, point[axis]), Math.max(maximum, point[axis])], [Infinity, -Infinity]);
  const [minX, maxX] = extent("x");
  const [minY, maxY] = extent("y");
  const position = (value: number, minimum: number, maximum: number) => minimum === maximum ? .5 : Number.isFinite(maximum - minimum) ? (value - minimum) / (maximum - minimum) : (value / 2 - minimum / 2) / (maximum / 2 - minimum / 2);
  const maximumSize = points.reduce((maximum, point) => Math.max(maximum, point.z ?? 1), 0);
  const colors = ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-tertiary)"];
  const pointLabel = (group: string, point: ScatterPoint) => `${group}${point.label ? ` · ${point.label}` : ""} · ${axisLabels.x}: ${formatX(point.x)} · ${axisLabels.y}: ${format(point.y)}${point.z === undefined ? "" : ` · Size: ${point.z}`}`;
  return <article {...props} className={`hk-chart-card hk-scatter ${className}`}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{value !== undefined && <strong>{value}</strong>}
      {ranges.length > 0 && <Select aria-label={`${title} range`} value={range} disabled={disabled || !onRangeChange} onChange={event => { if (!disabled && event.target.value !== range) onRangeChange?.(event.target.value); }}>{!ranges.some(option => option.value === range) && <option value={range}>Select range</option>}{ranges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>}
    </header>
    {children ?? <>
      <output role="status" className="hk-scatter-inspection">{active ? pointLabel(active.series, active.point) : `${points.length} ${points.length === 1 ? "observation" : "observations"} · Focus or touch a point to inspect`}</output>
      {points.length ? <div className="hk-scatter-canvas"><svg viewBox="0 0 360 236" className="hk-scatter-plot" role="group" aria-label={`${title} chart`} onKeyDown={event => { if (event.key === "Escape") { setInspection(null); event.stopPropagation(); } }}>
        <path d="M48 18 V196 H336" className="hk-chart-grid" />
        {[0, .5, 1].map(level => <path key={level} className="hk-chart-grid" d={`M48 ${180 - level * 146} H336`} />)}
        {minY < 0 && maxY > 0 && <path className="hk-chart-grid hk-scatter-zero" d={`M48 ${180 - position(0, minY, maxY) * 146} H336`} />}
        {groups.map((group, groupIndex) => <g key={`${group.label}-${groupIndex}`} opacity={active && active.series !== group.label ? .3 : 1}>{group.points.map((point, pointIndex) => <circle key={`${point.label ?? "point"}-${pointIndex}`} cx={64 + position(point.x, minX, maxX) * 256} cy={180 - position(point.y, minY, maxY) * 146} r={bubble ? Math.sqrt(9 + (maximumSize ? (point.z ?? 1) / maximumSize : 0) * 135) : 5} fill={group.color ?? colors[groupIndex % colors.length]} role="img" aria-label={pointLabel(group.label, point)} tabIndex={disabled ? -1 : 0} onFocus={() => { if (!disabled) setInspection({ series: group.label, point }); }} onBlur={() => setInspection(null)} onPointerEnter={() => { if (!disabled) setInspection({ series: group.label, point }); }} onPointerLeave={event => { if (event.pointerType !== "touch" && document.activeElement !== event.currentTarget) setInspection(null); }} onPointerDown={() => { if (!disabled) setInspection({ series: group.label, point }); }}><title>{pointLabel(group.label, point)}</title></circle>)}</g>)}
      </svg><div className="hk-scatter-labels" aria-hidden="true"><span className="hk-scatter-x-title">{axisLabels.x}</span><span className="hk-scatter-y-title">{axisLabels.y}</span>{minY < 0 && maxY > 0 && <span className="hk-scatter-y-tick" style={{top: `${(180 - position(0, minY, maxY) * 146) / 236 * 100}%`}}>0</span>}{[0, .5, 1].map(level => <span className="hk-scatter-y-tick" key={level} style={{top: `${(180 - level * 146) / 236 * 100}%`}}>{format(minY + (maxY - minY) * level)}</span>)}{[0, .5, 1].map(level => <span className="hk-scatter-x-tick" key={level} style={{left: `${(64 + level * 256) / 360 * 100}%`}}>{formatX(minX + (maxX - minX) * level)}</span>)}</div></div> : <p className="hk-chart-empty">No valid observations.</p>}
      <ul className="hk-scatter-series" aria-label={`${title} series`}>{groups.map((group, index) => <li key={`${group.label}-${index}`}><span className="hk-scatter-key" style={{ background: group.color ?? colors[index % colors.length] }} aria-hidden="true" /><span>{group.label}</span>{tiles && <span>{group.points.length ? `${group.points.length} points · Mean ${axisLabels.y}: ${format(group.points.reduce((sum, point) => sum + point.y / group.points.length, 0))}` : "No observations"}</span>}</li>)}</ul>
    </>}
  </article>;
}
export type ActivityDay = { date: string; rings: readonly ActivityRing[] };
export type MostActiveDaysCardProps = DataChartCardProps & { days?: readonly ActivityDay[]; selectedDate?: string | null; onSelectedDateChange?: (date: string) => void; month?: string; onMonthChange?: (month: string) => void; months?: readonly string[]; today?: string };
export function MostActiveDaysCard({ days = [], data, selectedDate, onSelectedDateChange, month, onMonthChange, months, today, disabled = false, loading = false, error, children, ...props }: MostActiveDaysCardProps) {
  const [localDate, setLocalDate] = useState<string | null>(days[0]?.date ?? null);
  const [monthIndex, setMonthIndex] = useState(0);
  const shownMonth = months?.[Math.min(monthIndex, months.length - 1)];
  const selected = selectedDate === undefined ? localDate : selectedDate;
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "0001-01-01" && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
  const invalid = days.some(day => !validDate(day.date)) || new Set(days.map(day => day.date)).size !== days.length || (selected != null && !validDate(selected)) || (month !== undefined && !validDate(`${month}-01`)) || (months !== undefined && (!months.length || new Set(months).size !== months.length || months.some(item => !validDate(`${item}-01`)))) || (today !== undefined && !validDate(today));
  const active = !invalid && selected ? days.find(day => day.date === selected) : undefined;
  const select = (date: string) => { if (!disabled) { if (selectedDate === undefined) setLocalDate(date); onSelectedDateChange?.(date); } };
  const lastDate = (period: string) => { const date = new Date(`${period}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth()+1); date.setUTCDate(0); return date.toISOString().slice(0,10); };
  return <ChartCard {...props} disabled={disabled} loading={loading} error={error} className={`hk-chart-card--days ${props.className ?? ""}`}>{children ?? (error ? <p role="alert">{error}</p> : invalid ? <p role="alert">Activity records require valid unique dates and months.</p> : loading ? <p role="status">Loading activity…</p> : <>
    <div className="hk-active-days-scroll" role="region" aria-label={`${props.title} months`} tabIndex={0}>{months && shownMonth ? <><div className="hk-chart-pager"><Button aria-label="Previous activity month" disabled={disabled || monthIndex === 0} onClick={() => setMonthIndex(monthIndex - 1)}>←</Button><span>{shownMonth}</span><Button aria-label="Next activity month" disabled={disabled || monthIndex >= months.length - 1} onClick={() => setMonthIndex(monthIndex + 1)}>→</Button></div>{[shownMonth].map(period => <MonthPanel key={period} month={period} minDate={`${period}-01`} maxDate={lastDate(period)} value={selected} onValueChange={select} today={today} disabled={disabled || (selectedDate !== undefined && !onSelectedDateChange)} />)}</> : <MonthPanel month={month} defaultMonth={days[0]?.date.slice(0,7)} onMonthChange={onMonthChange} value={selected} onValueChange={select} today={today} disabled={disabled || (selectedDate !== undefined && !onSelectedDateChange)} />}</div>
    {active ? <ActivityRingsCard title={`${selected} activity`} rings={active.rings} disabled={disabled} /> : <p>{selected ? `No activity recorded for ${selected}.` : "Select a day to inspect activity."}</p>}
    {!days.length && <p>No dated activity supplied.</p>}{!!data?.length && !days.length && <p>Undated chart values cannot populate an activity calendar.</p>}
  </>)}</ChartCard>;
}
export function SleepScoreCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--sleep ${props.className ?? ""}`} />; }
export function StageBarsCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--stages ${props.className ?? ""}`} />; }
export function StepsCard(props: DataChartCardProps) { return <ChartCard {...props} className={`hk-chart-card--steps ${props.className ?? ""}`} />; }
