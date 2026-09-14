import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ActivityRingsCard, Button, Checkbox, DataTable, FinanceDashboard, HeatmapChartCard, Input, SankeyChartCard, ScatterChartCard, Select, type DataColumn, type DataSort } from "@harso/ui";
import type { ExampleState } from "./examples";

type Transaction = { id: string; merchant: string; category: string; date: string; amount: number };
const transactions: Transaction[] = [
  { id: "rent", merchant: "Studio rent", category: "Home", date: "2026-09-01", amount: -1200 },
  { id: "salary", merchant: "September salary", category: "Income", date: "2026-09-01", amount: 4200 },
  { id: "groceries", merchant: "Neighbourhood market", category: "Food", date: "2026-09-02", amount: -68 },
  { id: "train", merchant: "City transit", category: "Travel", date: "2026-09-03", amount: -24 },
  { id: "coffee", merchant: "Morning coffee", category: "Food", date: "2026-09-04", amount: -6 },
  { id: "internet", merchant: "Home internet", category: "Home", date: "2026-09-05", amount: -45 },
  { id: "lunch", merchant: "Lunch with friends", category: "Food", date: "2026-09-06", amount: -32 },
];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const portfolioNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function FinanceExample({ state }: { state: ExampleState }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<DataSort>(null);
  const [page, setPage] = useState(1);
  const [hold, setHold] = useState(false);
  const [loadState, setLoadState] = useState("ready");
  const [selected, setSelected] = useState<string[]>([]);
  const [section, setSection] = useState("Overview");
  const [request, setRequest] = useState("Synthetic USD data. No accounts connected.");
  const disabled = state === "disabled" || loadState === "disabled" || loadState === "disabled-error";
  const loading = loadState === "loading";
  const error = state === "error" || loadState === "error" || loadState === "disabled-error" ? "The host could not load transactions. Try again when the connection returns." : undefined;
  const filtered = (loadState === "empty" ? [] : transactions).filter(row => (category === "All" || row.category === category) && row.merchant.toLowerCase().includes(query.trim().toLowerCase()));
  const ordered = [...filtered].sort((first, second) => {
    if (!sort) return 0;
    const difference = sort.column === "amount" ? first.amount - second.amount : first.merchant.localeCompare(second.merchant);
    return sort.direction === "ascending" ? difference : -difference;
  });
  const pageCount = Math.max(1, Math.ceil(ordered.length / 3));
  const currentPage = Math.min(page, pageCount);
  const columns: DataColumn<Transaction>[] = [
    { id: "merchant", label: "Merchant", sortable: true, render: row => row.merchant },
    { id: "category", label: "Category", render: row => row.category },
    { id: "date", label: "Date", render: row => <time dateTime={row.date}>{row.date}</time> },
    { id: "amount", label: "Amount", sortable: true, align: "end", render: row => money.format(row.amount) },
  ];
  const change = (label: string, apply: () => void) => { if (disabled || loading || error) return; setRequest(`${label} requested${hold ? "; host retained its state" : ""}.`); if (!hold) apply(); };
  const overview = section === "Overview" && !loading && !error && loadState !== "empty";
  const chartData = [{ label: "Home", value: 1245 }, { label: "Food", value: 106 }, { label: "Travel", value: 24 }];
  return <div className="hkl-example-stack">
    <div className="hk-data-toolbar"><Checkbox label="Hold host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Transaction data<Select aria-label="Transaction data" value={loadState} onChange={event => { setLoadState(event.target.value); setSelected([]); setPage(1); }}><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option><option value="disabled">Disabled</option><option value="disabled-error">Disabled error</option></Select></label></div>
    <FinanceDashboard title={state === "long-content" ? "A clear view of your everyday finances and longer-term plans" : "Your finances"}
      navigation={["Overview", "Transactions"].map(label => <Button key={label} disabled={disabled} aria-current={section === label ? "page" : undefined} onClick={() => change(`${label} navigation`, () => setSection(label))}>{label}</Button>)}
      actions={<Button leadingIcon={<DownloadSimpleIcon size={16} />} disabled={disabled || loading || !!error} onClick={() => setRequest("Statement export requested. No file downloaded.")}>Export statement</Button>}
      stats={overview ? [{ id: "balance", label: "Available balance", value: "$8,420.00", caption: "Synthetic account" }, { id: "income", label: "Monthly income", value: "$4,200.00" }, { id: "spending", label: "Monthly spending", value: "$1,375.00" }] : []}
      cashFlow={overview ? <div className="hk-finance-flow"><SankeyChartCard disabled={disabled} title="Cash flow" caption="Synthetic allocation · USD" nodes={[{ name: "Income" }, { name: "Home" }, { name: "Food" }, { name: "Travel" }, { name: "Unspent" }]} links={[...chartData.map(item => ({ source: "Income", target: item.label, value: item.value })), { source: "Income", target: "Unspent", value: 2825 }]} format={value => money.format(value)} /><section className="hk-finance-allocation"><h3>Cash flow</h3><p>Income · $4,200.00</p><dl>{[...chartData, { label: "Unspent", value: 2825 }].map(item => <div key={item.label}><dt>{item.label}</dt><dd>{money.format(item.value)}</dd></div>)}</dl></section></div> : undefined}
      spending={overview ? <ActivityRingsCard disabled={disabled} title="Spending by category" caption="Share of $1,375 synthetic spending" targetLabel="Total spending" rings={chartData.map(item => ({ id: item.label, label: item.label, value: item.value, target: 1375, unit: "USD" }))} /> : undefined}
      portfolio={overview ? <ScatterChartCard disabled={disabled} title="Portfolio" caption="Illustrative observations, not investment advice" axisLabels={{ x: "Risk", y: "Return" }} format={value => portfolioNumber.format(value)} series={[{ label: "Samples", points: [{ label: "Sample A", x: 10, y: 20, z: 20 }, { label: "Sample B", x: 35, y: 40, z: 10 }, { label: "Sample C", x: 20, y: 32, z: 15 }] }]} /> : undefined}
      dailySpending={overview ? <div className="hk-finance-flow"><HeatmapChartCard disabled={disabled} title="Daily spending" caption="September 1–6 · Synthetic USD amounts" columns={["Sep 1", "Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6"]} rows={[{ label: "Home", values: [1200, 0, 0, 0, 45, 0] }, { label: "Food", values: [0, 68, 0, 6, 0, 32] }, { label: "Travel", values: [0, 0, 24, 0, 0, 0] }]} format={value => `$${Math.abs(value)}`} /><section className="hk-finance-allocation"><h3>Daily spending</h3><p>September 1–6 · USD</p>{[1, 2, 3, 4, 5, 6].map(day => <div key={day}><strong>Sep {day}</strong><dl>{["Home", "Food", "Travel"].map(category => <div key={category}><dt>{category}</dt><dd>{money.format(-transactions.filter(row => row.category === category && row.date === `2026-09-0${day}`).reduce((sum, row) => sum + row.amount, 0))}</dd></div>)}</dl></div>)}</section></div> : undefined}
      transactions={<DataTable caption="Transactions" columns={columns} rows={ordered.slice((currentPage - 1) * 3, currentPage * 3)} rowId={row => row.id} rowLabel={row => row.merchant} sort={sort} disabled={disabled} loading={loading} error={error} emptyMessage="No matching transactions."
        onSortChange={next => change("Sort", () => { setSort(next); setPage(1); })}
        selectedIds={selected} onSelectionChange={(ids, checked) => change("Selection", () => setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(id => !ids.includes(id))))}
        pagination={{ page: currentPage, pageCount, onPageChange: next => change(`Page ${next}`, () => setPage(next)) }}
        toolbar={<><label>Search transactions<Input disabled={disabled || loading || !!error} value={query} placeholder="Find a merchant" onChange={event => change("Search", () => { setQuery(event.target.value); setPage(1); })} /></label><label>Transaction category<Select disabled={disabled || loading || !!error} value={category} onChange={event => change("Category", () => { setCategory(event.target.value); setPage(1); })}>{["All", "Home", "Food", "Travel", "Income"].map(value => <option key={value}>{value}</option>)}</Select></label></>}
        footer={<span>{filtered.length} matching records · {selected.length} selected</span>} />}
    >{error && <Button disabled={disabled} onClick={() => { if (disabled) return; setRequest(`Retry requested${hold ? "; host retained state" : ""}.`); if (!hold) setLoadState("ready"); }}>Retry transactions</Button>}</FinanceDashboard>
    <output aria-label="Finance request">{request}</output>
    <p>Composition preview: chart families still need richer geometry and interaction parity. These sample charts are not a completed finance visualization system.</p>
  </div>;
}
