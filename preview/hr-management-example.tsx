import { CompassIcon, UserPlusIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Button, Checkbox, ComboChartCard, DataTable, Field, HrManagement, Input, RadarChartCard, Select, StageBarsCard, Tabs } from "@harso/ui";
import type { DataColumn, DataSort } from "@harso/ui";
import type { ExampleState } from "./examples";

const departments = ["Engineering", "Design", "Sales", "Operations"];
const statuses = ["Active", "On leave", "Contract"];
const locations = ["Singapore", "London", "Remote"];
const sources = ["Referral", "Careers page", "Recruiter"];
type Employee = { id: string; name: string; role: string; department: string; status: string; salary: number; start: string; location: string; source: string };
const initialEmployees: Employee[] = ["Mira Chen", "Noah Rivera", "Sam Patel", "Ari Morgan", "Jules Park", "Robin Ellis", "Alex Reed", "Drew Lane"].map((name, index) => ({ id: String(index), name, role: ["Designer", "Engineer", "Specialist", "Team lead"][index % 4], department: departments[index % 4], status: statuses[index % 3], salary: 50000 + index * 15000, start: `2026-09-${String(7 - index % 7).padStart(2, "0")}`, location: locations[index % 3], source: sources[index % 3] }));
const pipeline = [{ label: "Applications", count: 80 }, { label: "Screens", count: 32 }, { label: "Interviews", count: 12 }, { label: "Offers", count: 5 }, { label: "Hires", count: 3 }];
const survey = [{ label: "Clarity", value: 80 }, { label: "Support", value: 72 }, { label: "Growth", value: 64 }, { label: "Belonging", value: 92 }, { label: "Autonomy", value: 76 }];
const movement = [{ month: "Apr", hires: 5, attrition: 2 }, { month: "May", hires: 8, attrition: 4 }, { month: "Jun", hires: 3, attrition: 1 }, { month: "Jul", hires: 6, attrition: 3 }, { month: "Aug", hires: 0, attrition: 0 }];
const emptyDraft = { name: "", role: "", department: "Engineering", status: "Active", salary: "", start: "2026-09-07", location: "Singapore", source: "Referral" };
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function HrManagementExample({ state }: { state: ExampleState }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [salary, setSalary] = useState("All");
  const [sort, setSort] = useState<DataSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState("Departments");
  const [section, setSection] = useState("Overview");
  const [panel, setPanel] = useState<"navigation" | "employee" | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [scenario, setScenario] = useState("ready");
  const [hold, setHold] = useState(false);
  const [request, setRequest] = useState("Synthetic employees and surveys only. No HR system connected.");
  const sequence = useRef(0);
  const disabled = state === "disabled" || scenario === "disabled" || scenario === "disabled-error";
  const loading = scenario === "loading";
  const error = state === "error" || scenario === "error" || scenario === "disabled-error";
  const blocked = disabled || loading || error;
  const available = scenario !== "empty";
  const roster = available ? employees : [];
  const stages = available ? pipeline : [];
  const scores = available ? survey : [];
  const history = available ? movement : [];
  const act = (label: string, change: () => void) => { if (blocked) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const filter = (change: () => void) => act("Filter requested", () => { change(); setPage(1); });
  const filtered = roster.filter(row => `${row.name} ${row.role}`.toLowerCase().includes(query.trim().toLowerCase()) && (department === "All" || row.department === department) && (status === "All" || row.status === status) && (salary === "All" || (salary === "Under $90,000" ? row.salary < 90000 : row.salary >= 90000)));
  const ordered = [...filtered].sort((first, second) => { if (!sort) return 0; const delta = sort.column === "salary" ? first.salary - second.salary : sort.column === "start" ? first.start.localeCompare(second.start) : first.name.localeCompare(second.name); return sort.direction === "ascending" ? delta : -delta; });
  const pageCount = Math.max(1, Math.ceil(ordered.length / 3));
  const currentPage = Math.min(page, pageCount);
  const columns: DataColumn<Employee>[] = [
    { id: "name", label: "Employee", sortable: true, render: row => <><strong>{row.name}</strong><p>{row.role}</p></> },
    { id: "status", label: "Status", render: row => <Select aria-label={`Status for ${row.name}`} disabled={blocked} value={row.status} onChange={event => act("Employee status requested", () => setEmployees(previous => previous.map(item => item.id === row.id ? { ...item, status: event.target.value } : item)))}>{statuses.map(value => <option key={value}>{value}</option>)}</Select> },
    { id: "department", label: "Department", render: row => row.department },
    { id: "start", label: "Start date", sortable: true, render: row => <time dateTime={row.start}>{row.start}</time> },
    { id: "salary", label: "Salary", sortable: true, render: row => money.format(row.salary) },
  ];
  const navigation = <div className="hk-hr-editor">{["Overview", "Employees"].map(name => <Button key={name} disabled={blocked} aria-current={section === name ? "page" : undefined} onClick={() => act("Navigation requested", () => { setSection(name); setPanel(null); })}>{name}</Button>)}</div>;
  const editor = <form className="hk-hr-editor" onSubmit={event => { event.preventDefault(); if (!draft.name.trim() || !draft.role.trim() || !draft.salary || !Number.isFinite(Number(draft.salary)) || Number(draft.salary) < 0 || !draft.start) return; act("Local employee added", () => { setEmployees(previous => [...previous, { ...draft, id: `new-${++sequence.current}`, name: draft.name.trim(), role: draft.role.trim(), salary: Number(draft.salary) }]); setDraft(emptyDraft); setPanel(null); setQuery(""); setDepartment("All"); setStatus("All"); setSalary("All"); setPage(1); setSort({ column: "start", direction: "descending" }); }); }}>
    <p>Local example only. No employee record or payroll change will be sent.</p>
    <Checkbox label="Hold HR host state" checked={hold} onChange={event => setHold(event.target.checked)} />
    {(["name", "role", "salary", "start"] as const).map(field => <Field key={field} label={{ name: "Employee name", role: "Role", salary: "Annual salary USD", start: "Start date" }[field]} required>{props => <Input {...props} disabled={blocked} type={field === "salary" ? "number" : field === "start" ? "date" : "text"} min={field === "salary" ? 0 : undefined} max={field === "salary" ? 10000000 : undefined} step={field === "salary" ? "0.01" : undefined} maxLength={field === "name" || field === "role" ? 80 : undefined} value={draft[field]} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} />}</Field>)}
    {([["department", departments], ["status", statuses], ["location", locations], ["source", sources]] as const).map(([field, options]) => <Field key={field} label={`Employee ${field}`}>{props => <Select {...props} disabled={blocked} value={draft[field]} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))}>{options.map(value => <option key={value}>{value}</option>)}</Select>}</Field>)}
    <Button type="submit" disabled={blocked || !draft.name.trim() || !draft.role.trim() || !draft.salary || !draft.start}>Add local employee</Button><Button onClick={() => { setDraft(emptyDraft); setPanel(null); }}>Cancel employee</Button>
  </form>;
  const breakdown = (field: "department" | "source" | "location") => {
    const counts = new Map<string, number>();
    for (const employee of roster) counts.set(employee[field], (counts.get(employee[field]) ?? 0) + 1);
    return <ul className="hk-hr-breakdown">{[...counts].map(([label, count]) => <li key={label}><span>{label}</span><strong>{count}</strong></li>)}</ul>;
  };
  const overview = section === "Overview" && !loading && !error;
  const score = scores.length ? scores.reduce((sum, item) => sum + item.value, 0) / scores.length : 0;
  const radarPoints = scores.map((item, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / scores.length; return `${120 + Math.cos(angle) * 70 * item.value / 100},${100 + Math.sin(angle) * 70 * item.value / 100}`; }).join(" ");
  const attrition = history.length ? history.reduce((sum, item) => sum + item.attrition, 0) / history.length : 0;
  return <div className="hkl-example-stack" style={{ maxWidth: "none" }}>
    <div className="hk-data-toolbar"><Checkbox label="Hold HR host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>HR data<Select aria-label="HR data" value={scenario} onChange={event => { setScenario(event.target.value); setSelected([]); setPage(1); }}>{["ready", "empty", "loading", "error", "disabled", "disabled-error"].map(value => <option key={value}>{value}</option>)}</Select></label></div>
    <HrManagement title={state === "long-content" ? "People, thoughtful hiring and the health of our growing team" : "Your people"} navigation={navigation}
      actions={<><Button leadingIcon={<CompassIcon size={16} />} disabled={blocked} onClick={() => act("Navigation opened", () => setPanel("navigation"))}>Navigate</Button><Button leadingIcon={<UserPlusIcon size={16} />} disabled={blocked} onClick={() => act("Employee form opened", () => { setDraft(emptyDraft); setPanel("employee"); })}>Add employee</Button></>}
      panel={panel ? { title: panel === "navigation" ? "People navigation" : "Add employee", content: panel === "navigation" ? navigation : editor, onClose: () => { setPanel(null); setDraft(emptyDraft); } } : null}
      stats={overview ? [{ id: "count", label: "Employees", value: roster.length }, { id: "roles", label: "Open roles", value: available ? 3 : 0, caption: "Synthetic requisitions" }, { id: "time", label: "Time to hire", value: available ? "20 days" : "No hires", caption: "Mean of three sample hires: 16, 24, 20 days" }, { id: "attrition", label: "Average attrition", value: `${attrition.toFixed(1)}%`, caption: "April–August monthly rate average" }] : []}
      recentHires={overview && <><h3>Recent hires</h3>{roster.length ? <ul className="hk-hr-hires">{[...roster].sort((first, second) => second.start.localeCompare(first.start)).slice(0, 4).map(person => <li key={person.id}><strong>{person.name}</strong><p>{person.role} · {person.department}</p><p>Started <time dateTime={person.start}>{person.start}</time></p></li>)}</ul> : <p>No recent hires</p>}</>}
      pipeline={overview && <StageBarsCard title="Hiring pipeline" value={stages[0]?.count ?? 0} caption="Synthetic applications · last 30 days"><div className="hk-hr-pipeline">{stages.map(stage => <label key={stage.label}>{stage.label}: {stage.count} ({Math.round(stage.count / pipeline[0].count * 100)}%)<progress max={pipeline[0].count} value={stage.count} aria-label={stage.label} /></label>)}{!stages.length && <p>No applications</p>}</div></StageBarsCard>}
      engagement={overview && <RadarChartCard title="Team engagement" value={scores.length ? `${score.toFixed(1)} / 100` : "No survey"} caption="Synthetic survey · fixed 0–100 scale">{scores.length > 0 && <svg className="hk-hr-chart" viewBox="0 0 240 210" role="img" aria-label="Engagement scores on a zero to one hundred scale">{[35, 70].map(radius => <circle key={radius} cx="120" cy="100" r={radius} fill="none" stroke="var(--hk-line)" />)}{scores.map((item, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / scores.length; return <text key={item.label} x={120 + Math.cos(angle) * 93} y={104 + Math.sin(angle) * 87} textAnchor="middle">{item.label}</text>; })}<polygon className="hk-chart-radar" points={radarPoints} /></svg>}<details><summary>Inspect engagement</summary><ul>{scores.map(item => <li key={item.label}>{item.label}: {item.value} / 100</li>)}</ul></details></RadarChartCard>}
      movement={overview && <ComboChartCard title="Hires and attrition" caption="Synthetic historical series, separate from the example roster" value={`${history.reduce((sum, item) => sum + item.hires, 0)} hires`}><p>Bars: hires (left, 0–10 people). Line: attrition (right, 0–5%).</p>{history.length ? <svg className="hk-hr-chart" viewBox="0 0 480 220" role="img" aria-label="Monthly hires and attrition with independent people and percent axes">{[0, 1, 2].map(tick => <g key={tick}><line x1="40" x2="440" y1={180 - tick * 70} y2={180 - tick * 70} stroke="var(--hk-line)" /><text x="8" y={184 - tick * 70}>{tick * 5}</text><text x="447" y={184 - tick * 70}>{tick * 2.5}%</text></g>)}{history.map((item, index) => <g key={item.month}><rect data-hires={item.hires} x={64 + index * 78} y={180 - item.hires * 14} width="24" height={item.hires * 14} fill="var(--hk-accent)" opacity=".5" /><text x={76 + index * 78} y="203" textAnchor="middle">{item.month}</text></g>)}<polyline points={history.map((item, index) => `${76 + index * 78},${180 - item.attrition * 28}`).join(" ")} fill="none" stroke="var(--hk-ink)" strokeWidth="2" /></svg> : <p>No historical data</p>}<details><summary>Inspect workforce movement</summary><ul>{history.map(item => <li key={item.month}>{item.month}: {item.hires} hires · {item.attrition}% attrition</li>)}</ul></details></ComboChartCard>}
      team={overview && <fieldset className="hk-hr-team" disabled={disabled}><legend className="hk-sr-only">Team breakdown controls</legend><Tabs label="Team breakdown" value={tab} onValueChange={value => act("Team tab selected", () => setTab(value))} items={[{ value: "People", label: "People", content: <ul className="hk-hr-breakdown">{roster.map(person => <li key={person.id}><span>{person.name}</span><span>{person.department}</span></li>)}</ul> }, { value: "Departments", label: "Departments", content: breakdown("department") }, { value: "Sources", label: "Hiring sources", content: breakdown("source") }, { value: "Locations", label: "Locations", content: breakdown("location") }].map(item => ({ ...item, content: roster.length ? item.content : <p>No people to summarize</p> }))} /></fieldset>}
      employees={<DataTable caption="Employees" columns={columns} rows={ordered.slice((currentPage - 1) * 3, currentPage * 3)} rowId={row => row.id} rowLabel={row => row.name} disabled={disabled} loading={loading} error={error ? "Employee data unavailable." : undefined} emptyMessage="No matching employees." sort={sort} onSortChange={value => act("Sort requested", () => { setSort(value); setPage(1); })} selectedIds={selected} onSelectionChange={(ids, checked) => act("Selection requested", () => setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(id => !ids.includes(id))))} pagination={{ page: currentPage, pageCount, onPageChange: value => act("Page requested", () => setPage(value)) }} toolbar={<><label>Search employees<Input disabled={blocked} value={query} onChange={event => filter(() => setQuery(event.target.value))} /></label><label>Department<Select aria-label="Department filter" disabled={blocked} value={department} onChange={event => filter(() => setDepartment(event.target.value))}>{["All", ...departments].map(value => <option key={value}>{value}</option>)}</Select></label><label>Status<Select aria-label="Status filter" disabled={blocked} value={status} onChange={event => filter(() => setStatus(event.target.value))}>{["All", ...statuses].map(value => <option key={value}>{value}</option>)}</Select></label><label>Salary<Select aria-label="Salary filter" disabled={blocked} value={salary} onChange={event => filter(() => setSalary(event.target.value))}>{["All", "Under $90,000", "$90,000 and above"].map(value => <option key={value}>{value}</option>)}</Select></label></>} footer={<span>{filtered.length} employees · {selected.length} selected</span>} />}
    >{error && <Button disabled={disabled} onClick={() => { if (disabled) return; setRequest(`Retry requested${hold ? "; host retained state" : ""}.`); if (!hold) setScenario("ready"); }}>Retry employees</Button>}</HrManagement>
    <output aria-label="HR request">{request}</output>
  </div>;
}
