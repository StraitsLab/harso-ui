import { useState } from "react";
import { EyeIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Badge, Button, IconButton, Checkbox, DataTable, Input, Select, StatCards, Table, type DataColumn, type DataSort, type StatItem } from "@harso/ui";
import type { ExampleState } from "./examples";

export const dataExports = ["Table", "DataTable", "StatCards"] as const;
export type DataExport = typeof dataExports[number];
export const dataNotes: Record<DataExport, { behavior: string; example: string }> = {
  Table: { behavior: "Native rows and columns, without another panel around them. A caption names the table and its keyboard-scrollable region. Medium and compact density share the same structure. Compose existing controls when the data needs sorting, selection or search.", example: '<Table caption="Evidence" size="sm"><thead>…</thead><tbody>…</tbody></Table>' },
  DataTable: { behavior: "A presentation of host-owned rows. Sorting, selection and pagination only emit requests; the host may refuse. Selected IDs are stable across reordering, and selection requests contain only the eligible visible IDs—not row objects or off-page content. The host owns search, order, pages and any custom cell actions. No hidden data store or fetching.", example: '<DataTable caption="Evidence" rows={pageRows} columns={columns} rowId={row => row.id} rowLabel={row => row.name} selectedIds={selected} onSelectionChange={requestSelection} sort={sort} onSortChange={requestSort} />' },
  StatCards: { behavior: "Numbers get room to breathe, not a wall of cards. Values, deltas and comparison captions are supplied by the host. Plain or footer layout, six subtle decorative accents and accessible hint controls. Color never invents a trend or replaces its label.", example: '<StatCards label="Research metrics" variant="footer" items={metrics} />' },
};

type RecordRow = { id: string; name: string; sources: number; status: "Ready" | "Review"; locked: boolean };
const records: RecordRow[] = ["Audience interviews", "Launch positioning", "Product comparisons", "A focused first week", "Support themes", "Search evidence", "Platform notes", "Onboarding paths", "Pricing research", "Navigation review", "Prototype feedback", "A quieter workspace"].map((name, index) => ({ id: `record-${index}`, name, sources: (index * 7 + 3) % 17, status: index % 3 ? "Ready" : "Review", locked: index === 4 }));

function RecordsExample({ component, state }: { component: "Table" | "DataTable"; state: ExampleState }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<DataSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [hold, setHold] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [updates, setUpdates] = useState(0);
  const [size, setSize] = useState<"md" | "sm">("md");
  const [action, setAction] = useState("No data action requested");
  const disabled = state === "disabled";
  const data = records.map((row, index) => ({ ...row, id: invalid && index === 1 ? records[0].id : row.id, sources: row.sources + updates, name: state === "long-content" && index === 0 ? "Detailed evidence from a cross-functional study of a much quieter and more considered first experience" : row.name }));
  const filtered = data.filter(row => row.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const ordered = [...filtered].sort((first, second) => !sort ? 0 : (sort.column === "sources" ? first.sources - second.sources : first.name.localeCompare(second.name)) * (sort.direction === "ascending" ? 1 : -1));
  const pageCount = Math.max(1, Math.ceil(ordered.length / 5));
  const currentPage = Math.min(page, pageCount);
  const columns: DataColumn<RecordRow>[] = [
    { id: "name", label: "Work", sortable: true, render: row => row.name },
    { id: "sources", label: "Sources", sortable: true, align: "end", render: row => row.sources },
    { id: "status", label: "Status", render: row => <Badge tone={row.status === "Ready" ? "positive" : "attention"}>{row.status}</Badge> },
    { id: "actions", label: "Action", align: "end", render: row => <IconButton disabled={disabled || row.locked} label={`Review ${row.name}`} onClick={() => setAction(`Review requested for ${row.name}. No file was opened.`)}><EyeIcon size={16} /></IconButton> },
  ];
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><label>Table density<Select value={size} onChange={event => setSize(event.target.value as "md" | "sm")}><option value="md">Medium</option><option value="sm">Compact</option></Select></label><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Loading sample" checked={loading} onChange={event => setLoading(event.target.checked)} /><Checkbox label="Duplicate ID sample" checked={invalid} onChange={event => setInvalid(event.target.checked)} /></div>
    {component === "Table" && <Table caption="A small evidence set" size={size} style={{ maxWidth: 560 }}><thead><tr><th scope="col">Source</th><th scope="col">Disposition</th></tr></thead><tbody><tr><td>Firsthand observations</td><td>Keep</td></tr><tr><td>Unverified assumptions</td><td>Revisit</td></tr></tbody></Table>}
    <DataTable caption="Work records" size={size} rows={ordered.slice((currentPage - 1) * 5, currentPage * 5)} columns={columns} rowId={row => row.id} rowLabel={row => row.name} isRowDisabled={row => row.locked} disabled={disabled} loading={loading} error={state === "error" ? "The host could not load this evidence. Existing actions remain unavailable." : undefined} selectedIds={selected} sort={sort} onSortChange={next => { setAction("Sort requested"); if (!hold) { setSort(next); setPage(1); } }} onSelectionChange={(ids, checked) => { setAction(`${checked ? "Select" : "Deselect"} requested for ${ids.join(", ")}`); if (!hold) setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(identity => !ids.includes(identity))); }} pagination={{ page: currentPage, pageCount, onPageChange: next => { setAction(`Page ${next} requested`); if (!hold) setPage(next); } }} toolbar={<label>Search records<Input value={query} disabled={disabled} placeholder="Find work records…" onChange={event => { if (!hold) { setQuery(event.target.value); setPage(1); } }} /></label>} footer={<span>{selected.length} selected · {filtered.length} sample records</span>} />
    <div className="hk-data-footer"><Button leadingIcon={<ArrowsClockwiseIcon size={16} />} onClick={() => setUpdates(value => value + 1)}>Update sample rows</Button><output aria-label="Data action">{action}</output></div>
  </div>;
}

function MetricsExample({ state }: { state: ExampleState }) {
  const [variant, setVariant] = useState<"plain" | "footer">("plain");
  const [tone, setTone] = useState<NonNullable<StatItem["tone"]> | "mixed">("mixed");
  const metrics: StatItem[] = [
    { id: "sources", label: "Sources reviewed", value: "12", delta: "+3 verified", trend: "positive", caption: "Compared with the earlier sample", hint: "All numbers are supplied synthetic data.", tone: "blue" },
    { id: "decisions", label: "Open decisions", value: "2", delta: "1 resolved", trend: "positive", caption: "Still visible, never hidden by progress", tone: "orange" },
    { id: "ready", label: "Ready to review", value: "5", delta: "No change", caption: "Provided by the sample host", tone: "purple" },
    { id: "missing", label: "Missing evidence", value: "0", delta: "None missing", caption: "A real zero, not a loading placeholder", tone: "pink" },
    { id: "notes", label: state === "long-content" ? "Notes that retain their full meaning across narrower and wider workspaces" : "Useful notes", value: "28", delta: "+4 notes", trend: "positive", caption: "From the current sample only", tone: "sky" },
    { id: "time", label: "Review time", value: "4m", delta: "+1m from the prior sample", trend: "negative", caption: "Elapsed time is supplied, not calculated", tone: "emerald" },
  ];
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><label>Metric layout<Select value={variant} onChange={event => setVariant(event.target.value as "plain" | "footer")}><option value="plain">Plain</option><option value="footer">Footer</option></Select></label><label>Metric accent<Select value={tone} onChange={event => setTone(event.target.value as typeof tone)}>{["mixed", "blue", "orange", "purple", "pink", "sky", "emerald"].map(value => <option key={value}>{value}</option>)}</Select></label></div><StatCards label="Research metrics" variant={variant} items={metrics.map(metric => ({ ...metric, tone: tone === "mixed" ? metric.tone : tone }))} /></div>;
}

export function DataExample({ component, state }: { component: DataExport; state: ExampleState }) {
  return component === "StatCards" ? <MetricsExample state={state} /> : <RecordsExample component={component} state={state} />;
}
