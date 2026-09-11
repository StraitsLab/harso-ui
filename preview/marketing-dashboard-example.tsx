import { useRef, useState } from "react";
import { AreaChartCard, Button, Checkbox, ComboChartCard, DataTable, Field, FunnelChartCard, Input, MarketingDashboard, RadialChartCard, Select, Tabs } from "@harso/ui";
import type { DataColumn, DataSort } from "@harso/ui";
import type { ExampleState } from "./examples";

const channels = ["Search", "Social", "Email", "Referral"];
const objectives = ["Conversions", "Traffic", "Awareness"];
const deliveries = ["Active", "Paused", "Draft"];
type Campaign = { id: string; name: string; channel: string; objective: string; delivery: string; spend: number };
const initialCampaigns: Campaign[] = ["Quiet launch", "Studio notes", "Autumn stories", "Meet Harso", "Welcome home", "Field journal", "Small moments", "New horizons"].map((name, index) => ({ id: String(index), name, channel: channels[index % 4], objective: objectives[index % 3], delivery: deliveries[index % 3], spend: index === 0 ? 0 : index * 480 }));
const historical = [{ month: "Apr", spend: 4000, revenue: 12000, organic: 8000, paid: 4000, social: 2000 }, { month: "May", spend: 7000, revenue: 28000, organic: 10000, paid: 6000, social: 3000 }, { month: "Jun", spend: 5000, revenue: 15000, organic: 11000, paid: 5000, social: 2000 }, { month: "Jul", spend: 8000, revenue: 32000, organic: 12000, paid: 7000, social: 3000 }, { month: "Aug", spend: 0, revenue: 0, organic: 9000, paid: 0, social: 2000 }];
const emptyDraft = { name: "", channel: "Search", objective: "Conversions", spend: "" };
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const colors = ["var(--hk-accent)", "var(--hk-positive)", "var(--hk-secondary)", "var(--hk-ink)"];

export function MarketingDashboardExample({ state }: { state: ExampleState }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("All");
  const [objective, setObjective] = useState("All");
  const [spendFilter, setSpendFilter] = useState("All");
  const [sort, setSort] = useState<DataSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState("Sessions");
  const [period, setPeriod] = useState("All months");
  const [panel, setPanel] = useState<"navigation" | "campaign" | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [scenario, setScenario] = useState("ready");
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("Synthetic analytics only. No advertising account connected.");
  const sequence = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const disabled = state === "disabled" || scenario === "disabled" || scenario === "disabled-error";
  const loading = scenario === "loading";
  const error = state === "error" || scenario === "error" || scenario === "disabled-error";
  const blocked = disabled || loading || error;
  const rows = scenario === "empty" ? [] : campaigns;
  const history = scenario === "empty" ? [] : historical.filter(item => period === "All months" || item.month === period);
  const totalSpend = history.reduce((sum, item) => sum + item.spend, 0);
  const totalRevenue = history.reduce((sum, item) => sum + item.revenue, 0);
  const visits = history.reduce((sum, item) => sum + item.organic + item.paid + item.social, 0);
  const funnel = [ { label: "Visits", count: visits }, { label: "Sign-ups", count: Math.floor(visits * .4) }, { label: "Trials", count: Math.floor(visits * .15) }, { label: "Customers", count: Math.floor(visits * .05) } ];
  const allocation = channels.map((label, index) => ({ label, value: totalSpend * [0.5, 0.3, 0.15, 0.05][index] }));
  const act = (label: string, change: () => void) => { if (blocked) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const filter = (change: () => void) => act("Filter requested", () => { change(); setPage(1); });
  const filtered = rows.filter(row => row.name.toLowerCase().includes(query.trim().toLowerCase()) && (channel === "All" || row.channel === channel) && (objective === "All" || row.objective === objective) && (spendFilter === "All" || (spendFilter === "Under $1,000" ? row.spend < 1000 : row.spend >= 1000)));
  const ordered = [...filtered].sort((first, second) => { if (!sort) return 0; const delta = sort.column === "spend" ? first.spend - second.spend : first.name.localeCompare(second.name); return sort.direction === "ascending" ? delta : -delta; });
  const pageCount = Math.max(1, Math.ceil(ordered.length / 3));
  const currentPage = Math.min(page, pageCount);
  const columns: DataColumn<Campaign>[] = [
    { id: "name", label: "Campaign", sortable: true, render: row => <strong>{row.name}</strong> },
    { id: "delivery", label: "Delivery", render: row => <Select aria-label={`Delivery for ${row.name}`} disabled={blocked} value={row.delivery} onChange={event => act("Delivery requested", () => setCampaigns(previous => previous.map(item => item.id === row.id ? { ...item, delivery: event.target.value } : item)))}>{deliveries.map(value => <option key={value}>{value}</option>)}</Select> },
    { id: "channel", label: "Channel", render: row => row.channel },
    { id: "objective", label: "Objective", render: row => row.objective },
    { id: "spend", label: "Spend", sortable: true, render: row => money.format(row.spend) },
  ];
  const navigation = <div className="hk-marketing-editor">{["Analytics", "Campaigns"].map(label => <Button key={label} disabled={blocked} onClick={() => act(`${label} requested`, () => { setPanel(null); root.current?.querySelector(`.hk-marketing-workspace ${label === "Campaigns" ? '[aria-label="Campaigns"]' : '.hk-marketing-charts'}`)?.scrollIntoView({ block: "start" }); })}>{label}</Button>)}</div>;
  const editor = <form className="hk-marketing-editor" onSubmit={event => { event.preventDefault(); const spend = Number(draft.spend); if (!draft.name.trim() || !draft.spend || !Number.isFinite(spend) || spend < 0 || spend > 1000000) return; act("Local campaign added", () => { setCampaigns(previous => [{ id: `new-${++sequence.current}`, name: draft.name.trim(), channel: draft.channel, objective: draft.objective, delivery: "Draft", spend }, ...previous]); setDraft(emptyDraft); setPanel(null); setQuery(""); setChannel("All"); setObjective("All"); setSpendFilter("All"); setSort(null); setPage(1); }); }}>
    <p>Preview only. Creating this draft does not buy ads or allocate a real budget.</p>
    <Checkbox label="Retain campaign submission" checked={hold} onChange={event => setHold(event.target.checked)} />
    <Field label="Campaign name" required>{props => <Input {...props} disabled={blocked} maxLength={80} value={draft.name} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value }))} />}</Field>
    <Field label="Sample spend USD" required>{props => <Input {...props} disabled={blocked} type="number" min={0} max={1000000} step="0.01" value={draft.spend} onChange={event => setDraft(previous => ({ ...previous, spend: event.target.value }))} />}</Field>
    {([ ["channel", channels], ["objective", objectives] ] as const).map(([key, options]) => <Field key={key} label={`Campaign ${key}`}>{props => <Select {...props} disabled={blocked} value={draft[key]} onChange={event => setDraft(previous => ({ ...previous, [key]: event.target.value }))}>{options.map(value => <option key={value}>{value}</option>)}</Select>}</Field>)}
    <Button type="submit" disabled={blocked || !draft.name.trim() || !draft.spend}>Add local campaign</Button><Button onClick={() => { setDraft(emptyDraft); setPanel(null); }}>Cancel campaign</Button>
  </form>;
  const chartState = loading ? <p role="status">Loading analytics…</p> : error ? <p>Analytics unavailable.</p> : !history.length ? <p>No analytics for this period.</p> : null;
  const inspect = (label: string) => <Button disabled={blocked} onClick={() => act(`Inspect ${label}`, () => {})}>{label}</Button>;
  return <div ref={root} className="hk-marketing-example">
    <div className="hk-home-toolbar"><label>Marketing scenario<Select value={scenario} onChange={event => { setScenario(event.target.value); setSelected([]); setPage(1); setPanel(null); }}>{["ready", "empty", "loading", "error", "disabled", "disabled-error"].map(value => <option key={value}>{value}</option>)}</Select></label><Checkbox label="Host retains requests" checked={hold} onChange={event => setHold(event.target.checked)} /></div>
    <p>Historical sample analytics are separate from editable campaign records. Channel attribution uses an illustrative fixed split.</p>
    <MarketingDashboard title="Your reach" navigation={navigation} actions={<><Select aria-label="Analytics period" disabled={blocked} value={period} onChange={event => act("Period requested", () => setPeriod(event.target.value))}>{["All months", ...historical.map(item => item.month)].map(value => <option key={value}>{value}</option>)}</Select><Button disabled={blocked} onClick={() => act("Navigation opened", () => setPanel("navigation"))}>Navigate</Button><Button disabled={blocked} onClick={() => act("Campaign editor opened", () => setPanel("campaign"))}>New campaign</Button></>} panel={panel ? { title: panel === "navigation" ? "Marketing navigation" : "New campaign", content: panel === "navigation" ? navigation : editor, onClose: () => { setPanel(null); setDraft(emptyDraft); } } : null}
      stats={[{ id: "spend", label: "Ad spend", value: loading || error ? "—" : money.format(totalSpend) }, { id: "visits", label: "Visits", value: loading || error ? "—" : visits.toLocaleString("en-US") }, { id: "customers", label: "Customers", value: loading || error ? "—" : funnel[3].count.toLocaleString("en-US") }, { id: "roas", label: "Return on ad spend", value: loading || error || !totalSpend ? "—" : `${(totalRevenue / totalSpend).toFixed(2)}×` }]}
      acquisition={<FunnelChartCard title="From curiosity to customer" caption="Counts relative to visits">{chartState ?? <div className="hk-marketing-funnel">{funnel.map(item => <div key={item.label}>{inspect(`${item.label}: ${item.count.toLocaleString("en-US")}`)}<progress max={Math.max(1, visits)} value={item.count} aria-label={item.label} /></div>)}</div>}</FunnelChartCard>}
      spending={<RadialChartCard title="Where spend goes" caption="Channel allocation · USD">{chartState ?? <><svg className="hk-marketing-plot" viewBox="0 0 320 175" role="img" aria-label="Spend by channel half gauge"><path d="M 20 155 A 140 140 0 0 1 300 155" fill="none" stroke="var(--hk-line)" strokeWidth="18" />{allocation.map((item, index) => { const share = totalSpend ? item.value / totalSpend * 100 : 0; const offset = totalSpend ? allocation.slice(0, index).reduce((sum, part) => sum + part.value / totalSpend * 100, 0) : 0; return <path key={item.label} d="M 20 155 A 140 140 0 0 1 300 155" fill="none" stroke={colors[index]} strokeWidth="18" pathLength="100" strokeDasharray={`${share} 100`} strokeDashoffset={-offset} />; })}<text x="160" y="145" textAnchor="middle">{money.format(totalSpend)}</text></svg><ul className="hk-marketing-values">{allocation.map(item => <li key={item.label}>{inspect(`${item.label}: ${money.format(item.value)}`)}</li>)}</ul></>}</RadialChartCard>}
      traffic={<fieldset className="hk-marketing-tabs" disabled={blocked}><legend>Traffic breakdown</legend><Tabs label="Traffic sources" value={tab} onValueChange={value => act("Traffic tab requested", () => setTab(value))} items={["Sessions", "Channels", "Campaigns", "Landing pages"].map(name => ({ value: name, label: name, content: chartState ?? <ul className="hk-marketing-values">{(name === "Campaigns" ? rows.map(row => ({ label: row.name, value: row.spend, unit: "USD sample spend" })) : channels.map((label, index) => ({ label: name === "Landing pages" ? ["/home", "/journal", "/start", "/about"][index] : label, value: Math.floor(visits * [0.5, 0.3, 0.15, 0.05][index]), unit: "sessions" }))).map(item => <li key={item.label}>{item.label}<strong>{item.value.toLocaleString("en-US")} {item.unit}</strong></li>)}</ul> }))} /></fieldset>}
      performance={<ComboChartCard title="Investment and return" caption="Left: spend $0–$10k · right: ROAS 0–5×">{chartState ?? <><svg className="hk-marketing-plot" viewBox="0 0 440 220" role="img" aria-label="Monthly ad spend and ROAS"><path d="M 40 20 V 180 H 400 V 20" fill="none" stroke="var(--hk-line)" /><text x="4" y="22">$10k</text><text x="4" y="180">$0</text><text x="410" y="22">5×</text><text x="410" y="180">0×</text>{history.map((item, index) => { const horizontal = 65 + index * 320 / Math.max(1, history.length - 1); const ratio = item.spend ? item.revenue / item.spend : null; return <g key={item.month}><rect data-month={item.month} x={horizontal - 12} y={180 - item.spend / 10000 * 160} width="24" height={item.spend / 10000 * 160} fill="var(--hk-accent)" />{ratio !== null && <circle cx={horizontal} cy={180 - ratio / 5 * 160} r="5" fill="var(--hk-positive)" />}<text x={horizontal} y="204" textAnchor="middle">{item.month}</text></g>; })}</svg><ul className="hk-marketing-values">{history.map(item => <li key={item.month}>{inspect(`${item.month}: ${money.format(item.spend)} · ${item.spend ? `${(item.revenue / item.spend).toFixed(2)}× ROAS` : "ROAS unavailable (zero spend)"}`)}</li>)}</ul></>}</ComboChartCard>}
      visitors={<AreaChartCard title="People arriving" caption="Organic, paid and social · common 0–15,000 scale">{chartState ?? <><svg className="hk-marketing-plot" viewBox="0 0 440 220" role="img" aria-label="Visitors by channel over time"><path d="M 40 20 V 180 H 400" fill="none" stroke="var(--hk-line)" /><text x="0" y="22">15k</text><text x="18" y="180">0</text>{(["organic", "paid", "social"] as const).map((key, index) => { const points = history.map((item, position) => `${65 + position * 320 / Math.max(1, history.length - 1)},${180 - item[key] / 15000 * 160}`); return <g key={key}><polygon points={`65,180 ${points.join(" ")} ${65 + (history.length - 1) * 320 / Math.max(1, history.length - 1)},180`} fill={colors[index]} opacity=".12" /><polyline points={points.join(" ")} fill="none" stroke={colors[index]} strokeWidth="2" />{history.map((item, position) => <circle key={item.month} cx={65 + position * 320 / Math.max(1, history.length - 1)} cy={180 - item[key] / 15000 * 160} r="3" fill={colors[index]} />)}</g>; })}{history.map((item, index) => <text key={item.month} x={65 + index * 320 / Math.max(1, history.length - 1)} y="204" textAnchor="middle">{item.month}</text>)}</svg><ul className="hk-marketing-values">{history.map(item => <li key={item.month}>{inspect(`${item.month}: organic ${item.organic}, paid ${item.paid}, social ${item.social}`)}</li>)}</ul></>}</AreaChartCard>}
      campaigns={<DataTable caption="Campaigns" columns={columns} rows={ordered.slice((currentPage - 1) * 3, currentPage * 3)} rowId={row => row.id} rowLabel={row => row.name} disabled={disabled} loading={loading} error={error ? "Campaign data unavailable." : undefined} emptyMessage="No matching campaigns." sort={sort} onSortChange={value => act("Sort requested", () => { setSort(value); setPage(1); })} selectedIds={selected} onSelectionChange={(ids, checked) => act("Selection requested", () => setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(id => !ids.includes(id))))} pagination={{ page: currentPage, pageCount, onPageChange: value => act("Page requested", () => setPage(value)) }} toolbar={<><label>Search campaigns<Input disabled={blocked} value={query} onChange={event => filter(() => setQuery(event.target.value))} /></label>{([ ["Channel", channel, channels, setChannel], ["Objective", objective, objectives, setObjective], ["Spend", spendFilter, ["Under $1,000", "$1,000 and above"], setSpendFilter] ] as const).map(([label, value, options, update]) => <label key={label}>{label}<Select aria-label={`${label} filter`} disabled={blocked} value={value} onChange={event => filter(() => update(event.target.value))}>{["All", ...options].map(option => <option key={option}>{option}</option>)}</Select></label>)}</>} footer={<span>{filtered.length} campaigns · {selected.length} selected</span>} />}
    >{error && <Button disabled={disabled} onClick={() => { if (disabled) return; setRequest(`Retry requested${hold ? "; host retained state" : ""}.`); if (!hold) setScenario("ready"); }}>Retry campaigns</Button>}</MarketingDashboard>
    <output aria-label="Marketing request">{request}</output>
  </div>;
}
