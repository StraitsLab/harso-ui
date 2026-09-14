import { useState } from "react";
import { Button, Checkbox, DataTable, EarningsChartCard, Field, HeatmapChartCard, HomeDashboard, Input, LineChartCard, Select, Sidebar, SidebarItem, Textarea } from "@harso/ui";
import type { DataColumn, DataSort } from "@harso/ui";
import type { ExampleState } from "./examples";

const initialCustomers = ["Aster Studio", "Birch Works", "Cedar Labs", "Dawn Collective", "Elm Design", "Fern House", "Grove Systems"].map((name, index) => ({ id: String(index), name, product: index % 2 ? "Studio" : "Team", amount: (index + 1) * 80, active: index !== 2 }));
const colleagues = [{ name: "Mira Chen", role: "Product designer", joined: "2026-09-07" }, { name: "Noah Rivera", role: "Engineer", joined: "2026-09-05" }, { name: "Sam Patel", role: "Customer operations", joined: "2026-09-03" }];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
type Panel = "navigation" | "notifications" | "ticket" | null;

export function HomeDashboardExample({ state }: { state: ExampleState }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("All");
  const [price, setPrice] = useState("All");
  const [sort, setSort] = useState<DataSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [period, setPeriod] = useState("Weekly");
  const [section, setSection] = useState("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [hire, setHire] = useState(0);
  const [unread, setUnread] = useState(true);
  const [ticket, setTicket] = useState("");
  const [tickets, setTickets] = useState(0);
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [request, setRequest] = useState("Synthetic workspace only. No data connected or changes sent.");
  const disabled = state === "disabled" || scenario === "disabled" || scenario === "disabled-error";
  const loading = scenario === "loading";
  const error = state === "error" || scenario === "error" || scenario === "disabled-error";
  const unavailable = disabled || loading || error;
  const act = (label: string, change: () => void) => { if (unavailable) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const source = scenario === "empty" ? [] : customers;
  const filtered = source.filter(row => row.name.toLowerCase().includes(query.trim().toLowerCase()) && (product === "All" || row.product === product) && (price === "All" || (price === "Under $300" ? row.amount < 300 : row.amount >= 300)));
  const ordered = [...filtered].sort((first, second) => { if (!sort) return 0; const delta = sort.column === "amount" ? first.amount - second.amount : first.name.localeCompare(second.name); return sort.direction === "ascending" ? delta : -delta; });
  const pageCount = Math.max(1, Math.ceil(ordered.length / 3));
  const currentPage = Math.min(page, pageCount);
  const multiplier = period === "Weekly" ? 1 : period === "Monthly" ? 4 : 48;
  const revenue = source.reduce((sum, row) => sum + row.amount, 0) * multiplier;
  const earnings = source.map(row => ({ label: row.name.split(" ")[0], value: row.amount * multiplier * .75 }));
  const maximum = Math.max(1, ...earnings.map(item => item.value));
  const columns: DataColumn<typeof initialCustomers[number]>[] = [
    { id: "name", label: "Customer", sortable: true, render: row => row.name },
    { id: "product", label: "Product", render: row => row.product },
    { id: "amount", label: "Amount", sortable: true, render: row => money.format(row.amount) },
    { id: "status", label: "Status", render: row => <Button disabled={unavailable} aria-label={`${row.active ? "Pause" : "Activate"} ${row.name}`} onClick={() => act("Customer status requested", () => setCustomers(previous => previous.map(item => item.id === row.id ? { ...item, active: !item.active } : item)))}>{row.active ? "Active" : "Paused"}</Button> },
  ];
  const navigation = <div className="hk-home-navigation"><Sidebar label="Workspace" collapsed={collapsed} onCollapsedChange={next => act("Sidebar collapse requested", () => setCollapsed(next))}>{["Overview", "Customers"].map(name => <SidebarItem key={name} label={name} disabled={unavailable} selected={section === name} onSelect={() => act("Navigation requested", () => { setSection(name); setPanel(null); })} />)}</Sidebar></div>;
  const notifications = <div><p>{unread ? "Unread: Your workspace summary is ready." : "Your workspace summary is read."}</p><Button disabled={unavailable || !unread} onClick={() => act("Mark notification read", () => setUnread(false))}>Mark as read</Button></div>;
  const ticketForm = <form className="hk-home-ticket" onSubmit={event => { event.preventDefault(); if (!ticket.trim()) return; act("Local ticket created", () => { setTickets(count => count + 1); setTicket(""); setPanel(null); }); }}><p>This creates a local example only; it is not submitted to support.</p><Checkbox label="Hold dashboard host state" checked={hold} onChange={event => setHold(event.target.checked)} /><Field label="Ticket description" required>{props => <Textarea {...props} required maxLength={500} disabled={unavailable} value={ticket} onChange={event => setTicket(event.target.value)} />}</Field><Button type="submit" disabled={unavailable || !ticket.trim()}>Create local ticket</Button><Button onClick={() => { setTicket(""); setPanel(null); }}>Cancel ticket</Button></form>;
  const overview = section === "Overview" && !loading && !error;
  return <div className="hkl-example-stack" style={{ maxWidth: "none" }}>
    <div className="hk-data-toolbar"><Checkbox label="Hold dashboard host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Dashboard data<Select aria-label="Dashboard data" value={scenario} onChange={event => { setScenario(event.target.value); setSelected([]); setPage(1); }}>{["ready", "loading", "error", "empty", "disabled", "disabled-error"].map(value => <option key={value}>{value}</option>)}</Select></label></div>
    <HomeDashboard title={state === "long-content" ? "A calm overview of your people, customers and everyday operations" : "Your workspace"} navigation={navigation}
      breadcrumb={<p>Workspace / {section}</p>} search={<label>Search customers<Input disabled={unavailable} value={query} onChange={event => act("Search requested", () => { setQuery(event.target.value); setPage(1); setSection("Customers"); })} /></label>}
      actions={<><Button disabled={unavailable} onClick={() => act("Navigation opened", () => setPanel("navigation"))}>Navigate</Button><Button disabled={unavailable} onClick={() => act("Notifications opened", () => setPanel("notifications"))}>Notifications{unread ? " · 1 unread" : ""}</Button><Button disabled={unavailable} onClick={() => act("Ticket opened", () => { setTicket(""); setPanel("ticket"); })}>Create ticket</Button></>}
      panel={panel ? { title: panel === "navigation" ? "Workspace navigation" : panel === "notifications" ? "Notifications" : "Create ticket", content: panel === "navigation" ? navigation : panel === "notifications" ? notifications : ticketForm, onClose: () => { setPanel(null); setTicket(""); } } : null}
      hires={overview && <div className="hk-home-hires"><h3>Recent hires</h3><div><strong>{colleagues[hire].name}</strong><p>{colleagues[hire].role} · Joined <time dateTime={colleagues[hire].joined}>{colleagues[hire].joined}</time></p></div><Button disabled={disabled || hire === 0} onClick={() => act("Previous hire", () => setHire(index => index - 1))}>Previous hire</Button><Button disabled={disabled || hire === colleagues.length - 1} onClick={() => act("Next hire", () => setHire(index => index + 1))}>Next hire</Button></div>}
      stats={overview ? [{ id: "customers", label: "Customers", value: source.length }, { id: "active", label: "Active customers", value: source.filter(row => row.active).length }, { id: "revenue", label: `${period} revenue`, value: money.format(revenue) }, { id: "tickets", label: "Local tickets", value: tickets }] : []}
      earnings={overview && <EarningsChartCard title="Earnings" value={money.format(revenue * .75)} caption="Synthetic net amounts by customer"><label>Period<Select aria-label="Dashboard period" disabled={disabled} value={period} onChange={event => act("Period requested", () => setPeriod(event.target.value))}>{["Weekly", "Monthly", "Yearly"].map(value => <option key={value}>{value}</option>)}</Select></label>{earnings.length ? <div className="hk-home-series" role="region" aria-label="Earnings by customer" tabIndex={0}><div className="hk-chart-bars">{earnings.map(item => <div className="hk-chart-bar-column" key={item.label}><span className="hk-chart-bar" style={{ minHeight: 0, height: `${item.value / maximum * 100}%` }} /><small>{item.label}</small></div>)}</div><details><summary>Inspect earnings</summary><ul>{earnings.map(item => <li key={item.label}>{item.label}: {money.format(item.value)}</li>)}</ul></details></div> : <p>No earnings</p>}</EarningsChartCard>}
      revenue={overview && <LineChartCard disabled={disabled} title="Revenue by customer" value={money.format(revenue)} caption="Synthetic gross amounts, same period" data={source.map(row => ({ label: row.name.split(" ")[0], value: row.amount * multiplier }))} />}
      contributions={overview && <HeatmapChartCard title="Contributions" caption="Synthetic customer activity" disabled={disabled} columns={["Week 1", "Week 2", "Week 3"]} rows={source.map((row, index) => ({ label: row.name, values: [index, index + 1, index + 2] }))} />}
      customers={<DataTable caption="Customers" rows={ordered.slice((currentPage - 1) * 3, currentPage * 3)} columns={columns} rowId={row => row.id} rowLabel={row => row.name} disabled={disabled} loading={loading} error={error ? "Customer data is unavailable." : undefined} emptyMessage="No matching customers." sort={sort} onSortChange={next => act("Sort requested", () => { setSort(next); setPage(1); })} selectedIds={selected} onSelectionChange={(ids, checked) => act("Selection requested", () => setSelected(previous => checked ? [...new Set([...previous, ...ids])] : previous.filter(id => !ids.includes(id))))} pagination={{ page: currentPage, pageCount, onPageChange: next => act("Page requested", () => setPage(next)) }} toolbar={<><label>Product<Select disabled={unavailable} value={product} onChange={event => act("Product filter", () => { setProduct(event.target.value); setPage(1); })}>{["All", "Team", "Studio"].map(value => <option key={value}>{value}</option>)}</Select></label><label>Price<Select disabled={unavailable} value={price} onChange={event => act("Price filter", () => { setPrice(event.target.value); setPage(1); })}>{["All", "Under $300", "$300 and above"].map(value => <option key={value}>{value}</option>)}</Select></label></>} footer={<span>{filtered.length} results · {selected.length} selected</span>} />}
    >{loading && <p role="status">Loading dashboard…</p>}{error && <Button disabled={disabled} onClick={() => { if (disabled) return; setRequest(`Retry requested${hold ? "; host retained state" : ""}.`); if (!hold) setScenario("ready"); }}>Retry dashboard</Button>}</HomeDashboard>
    <output aria-label="Dashboard request">{request}</output>
  </div>;
}
