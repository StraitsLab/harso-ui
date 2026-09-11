import { useId, useState, type ComponentPropsWithRef } from "react";
import { Button } from "./primitives";
import "./agent-limits.css";

export type AgentLimitsContext = {
  max: number;
  segments: readonly { label: string; tokens: number; color?: string; deferred?: boolean }[];
  groups?: readonly { label: string; tokens: number; items: readonly { label: string; tokens: number }[] }[];
};
export type AgentLimitsCardProps = ComponentPropsWithRef<"section"> & {
  context?: AgentLimitsContext;
  used?: number;
  maximum?: number;
  label?: string;
  plan?: string;
  planHref?: string;
  limits?: readonly { label: string; used: number; resets?: string }[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
};

const quantity = (value: number | undefined): number | null => value !== undefined && Number.isFinite(value) && value >= 0 ? value : null;
const percentage = (value: number | null, maximum: number | null) => value !== null && maximum !== null && maximum > 0 ? quantity(value / maximum * 100) : null;
const meter = (value: number | null, maximum: number | null) => value !== null && maximum !== null && maximum > 0 ? Math.min(1, value / maximum) * 100 : undefined;
const format = (value: number | null) => value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 1, notation: value >= 10_000 ? "compact" : "standard" });

export function AgentLimitsCard({ context, used, maximum, label = context ? "Context window" : "Context", plan, planHref, limits = [], expanded, defaultExpanded = false, onExpandedChange, disabled = false, loading = false, error, className = "", children, ...props }: AgentLimitsCardProps) {
  const [localExpanded, setExpanded] = useState(defaultExpanded);
  const open = expanded ?? localExpanded;
  const blocked = disabled || loading;
  const identity = useId();
  const capacity = quantity(context ? context.max : maximum);
  const segments: AgentLimitsContext["segments"] = context?.segments ?? [{ label, tokens: used ?? NaN }];
  const total = segments.reduce<number | null>((sum, segment) => {
    if (segment.deferred) return sum;
    const tokens = quantity(segment.tokens);
    return sum === null || tokens === null ? null : quantity(sum + tokens);
  }, 0);
  const percent = percentage(total, capacity);
  const free = capacity === null || total === null ? null : Math.max(0, capacity - total);
  let href: string | undefined;
  if (planHref && !blocked && !/[\s\\]/.test(planHref)) {
    try {
      const url = new URL(planHref, "https://local.invalid");
      if ((/^https?:\/\//i.test(planHref) || (planHref.startsWith("/") && !planHref.startsWith("//"))) && !url.username && !url.password && ["http:", "https:"].includes(url.protocol)) href = planHref;
    } catch { href = undefined; }
  }
  return <section {...props} className={`hk-agent-limits-card ${className}`} aria-busy={loading || undefined} aria-disabled={disabled || undefined}>
    <header className="hk-agent-limits-heading">
      <h3><Button aria-expanded={open} aria-controls={`${identity}-breakdown`} disabled={blocked} onClick={() => {
        if (expanded === undefined) setExpanded(!open);
        onExpandedChange?.(!open);
      }}>{label}<span aria-hidden="true">{open ? "−" : "+"}</span></Button></h3>
      <span>{format(total)} / {format(capacity)} ({format(percent)}%)</span>
      {total !== null && capacity !== null && total > capacity && <span>Over limit</span>}
    </header>
    <progress className="hk-agent-limits-meter" max={100} value={meter(total, capacity)} aria-label={`${label} usage`} />
    <div className="hk-agent-limits-segments" aria-hidden="true" data-unavailable={percent === null || undefined}>
      {total !== null && capacity !== null && capacity > 0 && segments.map((segment, index) => !segment.deferred && <span key={index} style={{ width: `${meter(quantity(segment.tokens), Math.max(capacity, total)) ?? 0}%`, backgroundColor: segment.color ?? `color-mix(in srgb, var(--hk-accent) ${100 - index % 5 * 12}%, var(--hk-surface))` }} />)}
    </div>
    <div id={`${identity}-breakdown`} hidden={!open}>
      <ul className="hk-agent-limits-breakdown">
        {segments.map((segment, index) => <li key={index}><span>{segment.label}</span><span>{format(quantity(segment.tokens))} {segment.deferred ? "—" : `(${format(percentage(quantity(segment.tokens), capacity))}%)`}</span></li>)}
        <li><span>Free space</span><span>{format(free)} ({format(percentage(free, capacity))}%)</span></li>
      </ul>
      {context?.groups?.map((group, index) => <details key={`${group.label}-${index}`} className="hk-agent-limits-group">
        <summary aria-disabled={blocked || undefined} tabIndex={blocked ? -1 : undefined} onClick={event => { if (blocked) event.preventDefault(); }} onKeyDown={event => { if (blocked && (event.key === "Enter" || event.key === " ")) event.preventDefault(); }}>
          <span>{group.label}</span> <span>{format(quantity(group.tokens))} · {group.items.length} items</span>
        </summary>
        <ul>{group.items.map((item, itemIndex) => <li key={itemIndex}><span>{item.label}</span><span>{format(quantity(item.tokens))}</span></li>)}</ul>
      </details>)}
    </div>
    {(plan || limits.length > 0) && <div className="hk-agent-limits-plan">
      <h3>Plan usage limits{plan && <> · {href ? <a href={href}>{plan}</a> : <span>{plan}</span>}</>}</h3>
      {limits.map((limit, index) => {
        const usage = percentage(quantity(limit.used), 1);
        return <div className="hk-agent-limits-limit" key={index}>
        <div><span>{limit.label}</span><span>{format(usage)}%</span></div>
        {quantity(limit.used) !== null && limit.used > 1 && <span>Over limit</span>}
        {limit.resets && <p>{limit.resets}</p>}
        <progress max={100} value={meter(quantity(limit.used), 1)} aria-label={`${limit.label} usage`} />
      </div>; })}
    </div>}
    {loading && <p role="status">Loading usage…</p>}
    {error && <p role="alert">{error}</p>}
    {children}
  </section>;
}
