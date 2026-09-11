import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { StatCards, type StatItem } from "./data";
import { Table, type DataColumn } from "./data";
import { AiChat, type AiChatProps } from "./agent-surfaces";
import { KitProvider, type Appearance, type Palette } from "./theme";

export type DashboardRow = Record<string, ReactNode> & { id: string };
export type DashboardProps = ComponentPropsWithRef<"section"> & { title: string; stats?: readonly StatItem[]; children?: ReactNode };
function Dashboard({ title, stats = [], children, className = "", ...props }: DashboardProps) { return <section {...props} className={`hk-dashboard ${className}`}><header><h2>{title}</h2></header>{stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}{children}</section>; }
export type FinanceDashboardProps = DashboardProps & { navigation?: ReactNode; actions?: ReactNode; cashFlow?: ReactNode; spending?: ReactNode; portfolio?: ReactNode; dailySpending?: ReactNode; transactions?: ReactNode };
export function FinanceDashboard({ title, stats = [], navigation, actions, cashFlow, spending, portfolio, dailySpending, transactions, children, className = "", ...props }: FinanceDashboardProps) {
  const sections = ([["Cash flow", cashFlow], ["Spending by category", spending], ["Portfolio", portfolio], ["Daily spending", dailySpending]] as const).filter(([, content]) => content != null && typeof content !== "boolean");
  return <section {...props} className={`hk-finance ${className}`}>
    {navigation && <nav aria-label="Finance navigation" className="hk-finance-navigation">{navigation}</nav>}
    <div className="hk-finance-main"><header className="hk-finance-header"><h2>{title}</h2>{actions && <div className="hk-finance-actions">{actions}</div>}</header>
      {stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}
      {sections.length > 0 && <div className="hk-finance-grid">{sections.map(([label, content]) => <section key={label} aria-label={label}>{content}</section>)}</div>}
      {transactions != null && typeof transactions !== "boolean" && <section aria-label="Transactions" className="hk-finance-transactions">{transactions}</section>}
      {children}
    </div>
  </section>;
}
export type HomeDashboardProps = AiChatProps & { stats?: readonly StatItem[]; breadcrumb?: ReactNode; search?: ReactNode; hires?: ReactNode; earnings?: ReactNode; revenue?: ReactNode; contributions?: ReactNode; customers?: ReactNode };
export function HomeDashboard({ title = "Home", stats = [], breadcrumb, search, hires, earnings, revenue, contributions, customers, children, className = "", ...props }: HomeDashboardProps) {
  const charts = ([["Earnings", earnings], ["Revenue", revenue], ["Contributions", contributions]] as const).filter(([, content]) => content != null && typeof content !== "boolean");
  return <AiChat {...props} title={title} className={`hk-home-workspace ${className}`}>
    {(breadcrumb || search) && <div className="hk-home-toolbar">{breadcrumb}{search}</div>}
    {hires != null && typeof hires !== "boolean" && <section aria-label="Recent hires">{hires}</section>}
    {stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}
    {charts.length > 0 && <div className="hk-home-charts">{charts.map(([label, content]) => <section key={label} aria-label={label}>{content}</section>)}</div>}
    {customers != null && typeof customers !== "boolean" && <section aria-label="Customers">{customers}</section>}
    {children}
  </AiChat>;
}
export type HrManagementProps = AiChatProps & { stats?: readonly StatItem[]; recentHires?: ReactNode; pipeline?: ReactNode; engagement?: ReactNode; movement?: ReactNode; team?: ReactNode; employees?: ReactNode };
export function HrManagement({ title = "People", stats = [], recentHires, pipeline, engagement, movement, team, employees, children, className = "", ...props }: HrManagementProps) {
  const charts = ([["Hiring pipeline", pipeline], ["Engagement", engagement], ["Workforce movement", movement]] as const).filter(([, content]) => content != null && typeof content !== "boolean");
  return <AiChat {...props} title={title} className={`hk-hr-workspace ${className}`}>
    {stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}
    {recentHires != null && typeof recentHires !== "boolean" && <section aria-label="Recent hires">{recentHires}</section>}
    {charts.length > 0 && <div className="hk-hr-charts">{charts.map(([label, content]) => <section key={label} aria-label={label}>{content}</section>)}</div>}
    {team != null && typeof team !== "boolean" && <section aria-label="Team breakdown">{team}</section>}
    {employees != null && typeof employees !== "boolean" && <section aria-label="Employees">{employees}</section>}
    {children}
  </AiChat>;
}
export type MarketingDashboardProps = AiChatProps & { stats?: readonly StatItem[]; acquisition?: ReactNode; spending?: ReactNode; traffic?: ReactNode; performance?: ReactNode; visitors?: ReactNode; campaigns?: ReactNode };
export function MarketingDashboard({ title = "Marketing", stats = [], acquisition, spending, traffic, performance, visitors, campaigns, children, className = "", ...props }: MarketingDashboardProps) {
  const charts = ([["Acquisition funnel", acquisition], ["Spend by channel", spending], ["Traffic sources", traffic], ["Ad spend and ROAS", performance], ["Visitors", visitors]] as const).filter(([, content]) => content != null && typeof content !== "boolean");
  return <AiChat {...props} title={title} className={`hk-marketing-workspace ${className}`}>
    {stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}
    {charts.length > 0 && <div className="hk-marketing-charts">{charts.map(([label, content]) => <section key={label} aria-label={label}>{content}</section>)}</div>}
    {campaigns != null && typeof campaigns !== "boolean" && <section aria-label="Campaigns">{campaigns}</section>}
    {children}
  </AiChat>;
}
export type MedicalProfileProps = AiChatProps & { stats?: readonly StatItem[]; identity?: ReactNode; steps?: ReactNode; sleep?: ReactNode; calendar?: ReactNode; activity?: ReactNode; alerts?: ReactNode; patients?: ReactNode };
export function MedicalProfile({ title = "Health overview", stats = [], identity, steps, sleep, calendar, activity, alerts, patients, children, className = "", ...props }: MedicalProfileProps) {
  const charts = ([["Steps", steps], ["Sleep score", sleep], ["Most active days", calendar], ["Activity", activity]] as const).filter(([, content]) => content != null && typeof content !== "boolean");
  return <AiChat {...props} title={title} className={`hk-medical-workspace ${className}`}>
    {identity != null && typeof identity !== "boolean" && <section aria-label="Patient information">{identity}</section>}
    {stats.length > 0 && <StatCards label={`${title} metrics`} items={stats} />}
    {charts.length > 0 && <div className="hk-medical-charts">{charts.map(([label, content]) => <section key={label} aria-label={label}>{content}</section>)}</div>}
    {alerts != null && typeof alerts !== "boolean" && <section aria-label="Important alerts">{alerts}</section>}
    {patients != null && typeof patients !== "boolean" && <section aria-label="Patients">{patients}</section>}
    {children}
  </AiChat>;
}
type ContributionPeriod = "weekly" | "monthly" | "yearly";
type ContributionItems = readonly { label: string; value: number }[];
export function ContributionsCard({ title = "Contributions", items = [], periods, period, defaultPeriod = "weekly", onPeriodChange, disabled = false, view = "bars", activeIndex, onActiveIndexChange, palette, defaultPalette = "clean", onPaletteChange, showPaletteControl = false, className = "", ...props }: ComponentPropsWithRef<"section"> & { title?: string; items?: ContributionItems; periods?: Partial<Record<ContributionPeriod, ContributionItems>>; period?: ContributionPeriod; defaultPeriod?: ContributionPeriod; onPeriodChange?: (period: ContributionPeriod) => void; disabled?: boolean; view?: "bars" | "cells"; activeIndex?: number | null; onActiveIndexChange?: (index: number | null) => void; palette?: Palette; defaultPalette?: Palette; onPaletteChange?: (palette: Palette) => void; showPaletteControl?: boolean }) {
  const [localPeriod, setLocalPeriod] = useState(defaultPeriod);
  const [localActive, setLocalActive] = useState<{ period: ContributionPeriod; index: number } | null>(null);
  const [localPalette, setLocalPalette] = useState(defaultPalette);
  const [appearance, setAppearance] = useState<Appearance>("system");
  const anchor = useRef<HTMLSpanElement>(null);
  const activePeriod = period ?? localPeriod;
  const displayedItems = periods ? periods[activePeriod] ?? [] : items;
  const selected = activeIndex === undefined ? localActive?.period === activePeriod ? localActive.index : null : activeIndex;
  const inspected = selected != null && Number.isInteger(selected) && selected >= 0 ? displayedItems[selected] : undefined;
  const activePalette = palette ?? localPalette;
  useEffect(() => { setLocalActive(null); }, [activePeriod]);
  useEffect(() => { if (localActive != null && localActive.index >= displayedItems.length) setLocalActive(null); }, [displayedItems.length, localActive]);
  useLayoutEffect(() => {
    const provider = anchor.current?.closest<HTMLElement>(".harso-kit");
    if (!provider) return;
    const update = () => setAppearance(provider.dataset.mode === "dark" ? "dark" : "light");
    update(); const observer = new MutationObserver(update);
    observer.observe(provider, { attributes: true, attributeFilter: ["data-mode"] });
    return () => observer.disconnect();
  }, []);
  const maximum = displayedItems.reduce((maximum, item) => Number.isFinite(item.value) ? Math.max(maximum, item.value) : maximum, 1);
  const content = <section {...props} className={`hk-contributions-card ${className}`}><h3>{title}</h3>
    {showPaletteControl && <label>Contribution palette<select value={activePalette} disabled={disabled || palette !== undefined && !onPaletteChange} onChange={event => { const next = event.currentTarget.value; if (disabled || palette !== undefined && !onPaletteChange || next === activePalette || next !== "clean" && next !== "cozy") return; if (palette === undefined) setLocalPalette(next); onPaletteChange?.(next); }}><option value="clean">Clean</option><option value="cozy">Cozy</option></select></label>}
    {periods && <label>Contribution period<select value={activePeriod} disabled={disabled || period !== undefined && !onPeriodChange} onChange={event => {
      const next = event.currentTarget.value;
      if (disabled || next === activePeriod || next !== "weekly" && next !== "monthly" && next !== "yearly" || period !== undefined && !onPeriodChange) return;
      if (period === undefined) setLocalPeriod(next);
      onPeriodChange?.(next);
    }}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>}
    {displayedItems.length ? <div className="hk-contributions-activity" data-view={view}>{displayedItems.map((item, index) => <div key={`${item.label}-${index}`} className="hk-contribution"><button type="button" aria-label={`${item.label}: ${Number.isFinite(item.value) && item.value >= 0 ? `${item.value} contributions` : "Unavailable"}`} aria-pressed={selected === index} disabled={disabled || activeIndex !== undefined && !onActiveIndexChange} onClick={() => { if (disabled || activeIndex !== undefined && !onActiveIndexChange || selected === index) return; if (activeIndex === undefined) setLocalActive({ period: activePeriod, index }); onActiveIndexChange?.(index); }}>{item.label}</button>{Number.isFinite(item.value) && item.value >= 0 ? <><meter aria-label={item.label} min={0} max={maximum} value={item.value} /><b>{item.value}</b></> : <span>Unavailable</span>}</div>)}</div> : <p>No contributions supplied.</p>}
    {inspected && <output role="status" aria-label="Inspected contribution">{inspected.label}: {Number.isFinite(inspected.value) && inspected.value >= 0 ? `${inspected.value} contributions` : "Unavailable"}</output>}
  </section>;
  return <><span hidden ref={anchor} />{showPaletteControl || palette !== undefined ? <KitProvider appearance={appearance} palette={activePalette} className="hk-contributions-theme">{content}</KitProvider> : content}</>;
}
export function AgentProfile(props: DashboardProps) { return <Dashboard {...props} className={`hk-dashboard--agent ${props.className ?? ""}`} />; }
export function DashboardTable<Row extends DashboardRow>({ caption, rows, columns, className = "", ...props }: ComponentPropsWithRef<"div"> & { caption: string; rows: readonly Row[]; columns: readonly DataColumn<Row>[] }) { return <div {...props} className={`hk-dashboard-table ${className}`}><Table caption={caption}>{<><thead><tr>{columns.map(column => <th key={column.id}>{column.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{columns.map(column => <td key={column.id}>{column.render(row)}</td>)}</tr>)}</tbody></>}</Table></div>; }
