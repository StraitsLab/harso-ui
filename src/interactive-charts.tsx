import { useId, useRef, useState, type CSSProperties } from "react";
import type { ChartCardProps } from "./chart-cards";
import { Button, Select } from "./primitives";
import "./interactive-charts.css";

export type ChartRow = { label: string; [key: string]: string | number | null | undefined };
export type ChartSeries = { key: string; label: string; color?: string; format?: (value: number) => string };
export type ChartRange = { id: string; label: string; data?: readonly ChartRow[]; headline?: number; delta?: number };
export type InteractiveChartProps = Omit<ChartCardProps, "data"> & {
  data?: readonly ChartRow[]; series?: readonly ChartSeries[]; bar?: ChartSeries; line?: ChartSeries;
  variant?: "stacked" | "overlap" | "percent"; shape?: "curved" | "sharp";
  ranges?: readonly ChartRange[]; range?: string; onRangeChange?: (id: string) => void;
  headline?: number; delta?: number; format?: (value: number) => string; tiles?: boolean;
  disabled?: boolean; loading?: boolean; error?: string;
};
type Point = { x: number; y: number; base: number; index: number };
const empty: readonly ChartRow[] = [];
const colors = ["var(--hk-accent-mark)", "var(--hk-secondary)", "var(--hk-faint)", "var(--hk-ink)"];
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const read = (row: ChartRow, key: string) => finite(row[key]) ? row[key] as number : null;

function aggregate(values: readonly (number | null)[], average = false) {
  const valid = values.filter(finite);
  if (!valid.length) return null;
  const direct = valid.reduce((sum, value) => sum + value, 0);
  if (finite(direct)) return average ? direct / valid.length : direct;
  const scale = valid.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0) || 1;
  const total = valid.reduce((sum, value) => sum + value / scale / (average ? valid.length : 1), 0) * scale;
  return finite(total) ? total : null;
}

function path(points: readonly { x: number; y: number }[], curved: boolean) {
  return points.map((point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return curved ? `C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}` : `L${point.x},${point.y}`;
  }).join(" ");
}

function segments(points: readonly (Point | null)[]) {
  const result: Point[][] = [];
  points.forEach((point, index) => {
    if (point) {
      if (!index || !points[index - 1]) result.push([]);
      result[result.length - 1].push(point);
    }
  });
  return result;
}

export function InteractiveChart({ kind, title, value, caption, data = empty, series, bar, line, variant = "stacked", shape = "curved", ranges = [], range, onRangeChange, headline, delta, format = String, tiles = false, disabled = false, loading = false, error, children, className = "", ...props }: InteractiveChartProps & { kind: "area" | "line" | "combo" }) {
  const id = useId().replace(/:/g, "");
  const [localRange, setLocalRange] = useState(ranges[0]?.id ?? "");
  const selectedRange = range ?? (ranges.some(item => item.id === localRange) ? localRange : ranges[0]?.id ?? "");
  const period = ranges.find(item => item.id === selectedRange);
  const rows = period?.data ?? data;
  const groups = kind === "combo" ? [bar ?? { key: "value", label: "Volume" }, line ?? { key: "secondary", label: "Rate" }] : series ?? (kind === "area" && rows.some(row => "secondary" in row) ? [{ key: "value", label: "Primary" }, { key: "secondary", label: "Secondary" }] : [{ key: "value", label: title }]);
  const seriesColor = (index: number) => groups[index].color ?? (kind === "combo" ? index === 0 ? "var(--hk-secondary)" : "var(--hk-accent-mark)" : colors[index % colors.length]);
  const invalidSeries = !groups.length || groups.some(group => !group.key || group.key === "label") || new Set(groups.map(group => group.key)).size !== groups.length;
  const invalidRanges = ranges.some(item => !item.id) || new Set(ranges.map(item => item.id)).size !== ranges.length || (!!ranges.length && !period);
  const failure = error || (invalidSeries ? "Series keys must be unique, numeric fields." : invalidRanges ? "Period IDs must be unique and select an available period." : "");
  const blocked = disabled || loading || !!failure;
  const [inspection, setInspection] = useState<{ rows: readonly ChartRow[]; range: string; index: number } | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = !blocked && inspection?.rows === rows && inspection.range === selectedRange && rows[inspection.index] ? inspection.index : null;
  const values = groups.map(group => rows.map(row => read(row, group.key)));
  const scale = values.flat().reduce<number>((largest, item) => item === null ? largest : Math.max(largest, Math.abs(item)), 0) || 1;
  const stacked = kind === "area" && variant !== "overlap";
  const percent = stacked && variant === "percent";
  const complete = rows.map((_, index) => values.every(group => group[index] !== null));
  const shares = rows.map((_, index) => {
    const parts = values.map(group => group[index]);
    if (!complete[index] || parts.some(part => part! < 0)) return null;
    const largest = Math.max(...parts as number[]);
    if (!largest) return null;
    const total = parts.reduce<number>((sum, part) => sum + part! / largest, 0);
    return parts.map(part => part! / largest / total);
  });
  const positive = rows.map(() => 0);
  const negative = rows.map(() => 0);
  const normalized = values.map((group, seriesIndex) => {
    const ownScale = kind === "combo" ? group.reduce<number>((largest, item) => item === null ? largest : Math.max(largest, Math.abs(item)), 0) || 1 : scale;
    const points = group.map((raw, index) => {
      if (raw === null || (stacked && !complete[index]) || (percent && !shares[index])) return null;
      const amount = percent ? shares[index]![seriesIndex] : raw / ownScale;
      const base = stacked ? (amount < 0 ? negative[index] : positive[index]) : 0;
      if (stacked) { if (amount < 0) negative[index] += amount; else positive[index] += amount; }
      return { amount: base + amount, base };
    });
    return { points, scale: percent ? 100 : ownScale };
  });
  const domain = (indices: readonly number[]) => indices.reduce(([low, high], index) => normalized[index].points.reduce(([minimum, maximum], point) => point ? [Math.min(minimum, point.amount, point.base), Math.max(maximum, point.amount, point.base)] : [minimum, maximum], [low, high]), [0, percent ? 1 : 0]);
  const commonDomain = domain(groups.map((_, index) => index));
  const endpoint = kind === "combo" ? 80 : 44;
  const pointX = (index: number) => rows.length === 1 ? 220 : endpoint + index / (rows.length - 1) * (440 - endpoint * 2);
  const plots = normalized.map((group, index) => {
    const [minimum, maximum] = kind === "combo" ? domain([index]) : commonDomain;
    const y = (amount: number) => 184 - (amount - minimum) / (maximum - minimum || 1) * 164;
    return { minimum, maximum, scale: group.scale, zero: y(0), points: group.points.map((point, pointIndex) => point ? { x: pointX(pointIndex), y: y(point.amount), base: y(point.base), index: pointIndex } : null) };
  });
  const text = (number: number | null, group?: ChartSeries) => number === null || !finite(number) ? "Unavailable" : (group?.format ?? format)(number);
  const summaries = groups.map((group, index) => {
    const validCount = values[index].filter(finite).length;
    const average = kind === "combo" && index === 1;
    return `${group.label} · ${average ? "average" : "total"}${validCount < rows.length ? ` (${validCount}/${rows.length} available)` : ""}: ${text(aggregate(values[index], average), group)}`;
  });
  const describe = (index: number) => `${rows[index].label} — ${groups.map((group, groupIndex) => `${group.label}: ${text(values[groupIndex][index], group)}${percent && shares[index] ? ` (${Number((shares[index]![groupIndex] * 100).toFixed(2))}%)` : ""}`).join(" · ")}${percent && !shares[index] ? " · Share unavailable (requires complete non-negative values and a positive total)" : ""}`;
  const suppliedHeadline = period?.headline ?? headline;
  const resting = value !== undefined ? value : suppliedHeadline !== undefined ? text(suppliedHeadline) : kind === "area" ? <><strong>Total{complete.every(Boolean) ? "" : " (available values)"}: {text(aggregate(values.flat()))}</strong>{summaries.join(" · ")}</> : summaries.join(" · ");
  const activeTotal = active !== null && kind === "area" ? complete[active] ? text(aggregate(values.map(group => group[active]))) : "Unavailable" : null;
  const inspect = (index: number) => { if (!blocked) setInspection({ rows, range: selectedRange, index }); };
  const selectPeriod = (next: string) => {
    if (blocked || !ranges.some(item => item.id === next)) return;
    onRangeChange?.(next);
    if (range === undefined) { setLocalRange(next); setInspection(null); }
  };
  const deltaValue = period?.delta ?? delta;
  const hasPlot = plots.some(plot => plot.points.some(Boolean));
  return <article {...props} aria-busy={loading || undefined} className={`hk-chart-card hk-chart-card--${kind} hk-interactive-chart ${className}`}>
    <header><div><h3>{title}</h3>{caption && <p>{caption}</p>}</div>{children != null && value !== undefined && <strong>{value}</strong>}
      {children == null && !!ranges.length && (kind === "line" ? <div className="hk-interactive-periods" role="group" aria-label={`${title} period`}>{ranges.map((item, index) => <Button key={index} disabled={blocked} aria-pressed={selectedRange === item.id} onClick={() => selectPeriod(item.id)}>{item.label}</Button>)}</div> : <Select aria-label={`${title} period`} value={selectedRange} disabled={blocked} onChange={event => selectPeriod(event.target.value)}>{ranges.map((item, index) => <option key={index} value={item.id}>{item.label}</option>)}</Select>)}
      {children == null && !ranges.length && range && <span>{range}</span>}
    </header>
    {children ?? (failure ? <p role="alert">{failure}</p> : loading ? <p role="status">Loading chart…</p> : !rows.length ? <div className="hk-chart-empty">No data</div> : <>
      <output role="status" className="hk-interactive-headline">{active === null ? resting : <>{describe(active)}{activeTotal !== null && <strong>Total: {activeTotal}</strong>}</>}</output>
      {deltaValue !== undefined && <span className="hk-interactive-delta">{finite(deltaValue * 100) ? `${deltaValue >= 0 ? "+" : ""}${Number((deltaValue * 100).toFixed(2))}%` : "Change unavailable"}</span>}
      {!hasPlot && <p>No plottable values{percent ? "; shares require complete non-negative values and a positive total" : ""}.</p>}
      <div className="hk-interactive-axes">{plots.filter((_, index) => kind === "combo" || index === 0).map((_, index) => <span key={index}>{kind === "combo" ? groups[index].label : percent ? "Share" : "Value"}</span>)}</div>
      <div className="hk-interactive-canvas">
      <div className="hk-interactive-ticks" aria-hidden="true">{plots.filter((_, index) => kind === "combo" || index === 0).map((plot, index) => <div key={index} className={index ? "hk-axis-right" : "hk-axis-left"}>{[1, .5, 0].map(level => <span key={level} style={{top: `${(20 + (1 - level) * 164) / 212 * 100}%`}}>{percent ? `${level * 100}%` : text(Number(((plot.minimum + (plot.maximum - plot.minimum) * level) * plot.scale).toPrecision(4)), groups[index])}</span>)}</div>)}</div>
      <svg className="hk-interactive-plot" preserveAspectRatio="none" viewBox="0 0 440 212" role="img" aria-label={`${title} chart`} onPointerLeave={event => { if (event.pointerType !== "touch" && !buttons.current.includes(document.activeElement as HTMLButtonElement)) setInspection(null); }}>
        <defs>{groups.map((group, index) => <linearGradient key={index} id={`${id}-${index}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={seriesColor(index)} stopOpacity=".3" /><stop offset="1" stopColor={seriesColor(index)} stopOpacity=".04" /></linearGradient>)}</defs>
        <path className="hk-interactive-grid" d="M44 20H396 M44 102H396 M44 184H396" />
        {plots.map((plot, groupIndex) => <g key={groupIndex} data-series={groups[groupIndex].key} style={{ "--hk-series-color": seriesColor(groupIndex) } as CSSProperties}>
          <path className="hk-interactive-zero" d={`M44 ${plot.zero}H396`} />
          {kind === "combo" && groupIndex === 0 ? plot.points.map((point, index) => point && <rect key={index} className="hk-interactive-bar" data-active={active === null ? undefined : active === index} x={point.x - Math.min(14, 140 / rows.length)} y={Math.min(point.base, point.y)} width={Math.min(28, 280 / rows.length)} height={Math.abs(point.base - point.y)} rx="3" />) : segments(plot.points).map((part, index) => <g key={index}>
            {kind !== "combo" && <path className="hk-interactive-area" fill={`url(#${id}-${groupIndex})`} d={`${path(part, shape === "curved")} ${path([...part].reverse().map(point => ({ x: point.x, y: point.base })), shape === "curved").replace(/^M/, "L")} Z`} />}
            <path className="hk-interactive-line" d={path(part, shape === "curved")} />
            {part.length === 1 && <circle className="hk-interactive-sample" cx={part[0].x} cy={part[0].y} r="3" />}
          </g>)}
          {active !== null && plot.points[active] && !(kind === "combo" && groupIndex === 0) && <circle className="hk-interactive-dot" cx={plot.points[active]!.x} cy={plot.points[active]!.y} r="5" />}
        </g>)}
        {active !== null && <path className="hk-interactive-cursor" d={`M${pointX(active)} 20V184`} />}
        {rows.map((row, index) => <rect key={index} aria-hidden="true" data-inspect={index} x={rows.length === 1 ? 24 : 44 + index / (rows.length - 1) * 352 - 176 / (rows.length - 1)} y="12" width={rows.length === 1 ? 392 : 352 / (rows.length - 1)} height="180" fill="transparent" onPointerEnter={() => inspect(index)} onPointerDown={() => inspect(index)} onClick={() => inspect(index)} />)}
      </svg></div>
      <div className="hk-interactive-points" data-dense={rows.length > 4} role="group" aria-label={`${title} point inspection`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInspection(null); }}>
        {rows.map((row, index) => <Button key={index} style={{left: `${pointX(index) / 440 * 100}%`}} ref={element => { buttons.current[index] = element; }} disabled={blocked} aria-label={`Inspect ${describe(index)}`} aria-pressed={active === index} onFocus={() => inspect(index)} onPointerEnter={() => inspect(index)} onPointerLeave={event => { if (event.pointerType !== "touch" && document.activeElement !== event.currentTarget) setInspection(null); }} onClick={() => inspect(index)} onKeyDown={event => {
          if (blocked) return;
          if (event.key === "Escape") { event.preventDefault(); setInspection(null); return; }
          const next = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowRight" ? Math.min(rows.length - 1, index + 1) : event.key === "ArrowLeft" ? Math.max(0, index - 1) : null;
          if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
        }}><span className="hk-chart-category">{row.label}</span><span aria-hidden="true" className="hk-chart-inspect-icon">⌕</span></Button>)}
      </div>
      <ul className={`hk-interactive-legend${tiles ? " hk-interactive-tiles" : ""}`} aria-label={`${title} series`}>{groups.map((group, index) => <li key={index}><span aria-hidden="true" style={{ background: seriesColor(index) }} />{tiles ? summaries[index] : groups.length === 1 && group.label === title ? "Observed values" : group.label}</li>)}</ul>
    </>)}
  </article>;
}
