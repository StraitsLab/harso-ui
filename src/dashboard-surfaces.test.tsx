import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { ContributionsCard, FinanceDashboard, HomeDashboard, HrManagement, MarketingDashboard, MedicalProfile } from "./dashboard-surfaces";
import chartStyles from "./chart-cards.css?raw";
import dashboardStyles from "./dashboard-surfaces.css?raw";
import { KitProvider } from "./theme";

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    show: { configurable: true, value() { this.open = true; } },
    showModal: { configurable: true, value() { this.open = true; } },
    close: { configurable: true, value() { this.open = false; } },
  });
});
afterAll(() => { for (const method of ["show", "showModal", "close"]) Reflect.deleteProperty(HTMLDialogElement.prototype, method); });

test.each([HomeDashboard, HrManagement, MarketingDashboard, MedicalProfile])("dashboard section ref, editor and panel remain host controlled", Dashboard => {
  const ref = createRef<HTMLElement>(); const close = vi.fn();
  const fixture = (title: string, open = true) => <Dashboard ref={ref} title={title} panel={open ? { title: "Edit dashboard", content: <input aria-label="Editor draft" />, onClose: close } : null}><p>Host records</p></Dashboard>;
  const view = render(fixture("Initial"));
  const section = ref.current; const editor = screen.getByRole("textbox", { name: "Editor draft" });
  expect(section?.tagName).toBe("SECTION"); expect(section).toHaveClass("hk-dashboard-workspace");
  fireEvent.change(editor, { target: { value: "Keep edits" } });
  fireEvent.click(screen.getByRole("button", { name: "Close context panel" }));
  expect(close).toHaveBeenCalledOnce(); expect(screen.getByRole("dialog")).toBeVisible();
  view.rerender(fixture("Updated"));
  expect(ref.current).toBe(section); expect(screen.getByRole("textbox")).toBe(editor); expect(editor).toHaveValue("Keep edits");
  view.rerender(fixture("Updated", false)); expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("Host records")).toBeVisible();
});

test("contribution cells support inspection and approved palette control without overriding host state", () => {
  const inspect = vi.fn(); const palette = vi.fn();
  const items = [{ label: "Monday", value: 4 }, { label: "Tuesday", value: 0 }];
  const view = render(<KitProvider appearance="dark"><ContributionsCard items={items} view="cells" activeIndex={0} onActiveIndexChange={inspect} showPaletteControl palette="clean" onPaletteChange={palette} /></KitProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Tuesday: 0 contributions" }));
  expect(inspect).toHaveBeenCalledExactlyOnceWith(1);
  expect(screen.getByRole("status", { name: "Inspected contribution" })).toHaveTextContent("Monday: 4 contributions");
  fireEvent.change(screen.getByLabelText("Contribution palette"), { target: { value: "cozy" } });
  expect(palette).toHaveBeenCalledExactlyOnceWith("cozy");
  expect(screen.getByLabelText("Contribution palette")).toHaveValue("clean");
  expect(view.container.querySelectorAll('.harso-kit[data-mode="dark"]')).toHaveLength(2);
  view.rerender(<ContributionsCard items={items} activeIndex={1} disabled />);
  expect(screen.getByRole("status", { name: "Inspected contribution" })).toHaveTextContent("Tuesday: 0 contributions");
  expect(screen.getByRole("button", { name: "Monday: 4 contributions" })).toBeDisabled();
  view.unmount(); render(<ContributionsCard items={items} showPaletteControl />);
  fireEvent.click(screen.getByRole("button", { name: "Monday: 4 contributions" }));
  expect(screen.getByRole("status", { name: "Inspected contribution" })).toHaveTextContent("Monday: 4 contributions");
  fireEvent.change(screen.getByLabelText("Contribution palette"), { target: { value: "cozy" } });
  expect(screen.getByLabelText("Contribution palette")).toHaveValue("cozy");
});

test("contribution inspection clears on period/data resets and accepts a controlled clear", () => {
  const items = [{ label: "First", value: 1 }];
  const view = render(<ContributionsCard periods={{ weekly: items, monthly: [{ label: "Different period", value: 2 }] }} />);
  fireEvent.click(screen.getByRole("button", { name: "First: 1 contributions" }));
  expect(screen.getByRole("status")).toHaveTextContent("First");
  fireEvent.change(screen.getByLabelText("Contribution period"), { target: { value: "monthly" } });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  view.rerender(<ContributionsCard items={items} activeIndex={0} />);
  expect(screen.getByRole("status")).toHaveTextContent("First");
  view.rerender(<ContributionsCard items={items} activeIndex={null} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  view.unmount();
  const local = render(<ContributionsCard items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "First: 1 contributions" }));
  local.rerender(<ContributionsCard items={[]} />); local.rerender(<ContributionsCard items={items} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test.each([HomeDashboard, HrManagement, MarketingDashboard, MedicalProfile])("compact dashboards retain their navigation toggle", Dashboard => {
  const style = document.createElement("style");
  style.textContent = dashboardStyles;
  document.head.append(style);
  try {
    render(<Dashboard title="Workspace" navigation={<button>Host destination</button>} />);
    const toggle = screen.getByRole("button", { name: "Toggle workspace navigation" });
    expect(toggle).toBeVisible();
    fireEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "Host destination" })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Host destination" })).toBeVisible();
  } finally { style.remove(); }
});

test("home template bars stay in their grid cell instead of escaping the scroll region", () => {
  const style = document.createElement("style");
  style.textContent = chartStyles + dashboardStyles;
  document.head.append(style);
  try {
    const view = render(<HomeDashboard earnings={<div className="hk-home-series"><div className="hk-chart-bar-column"><span className="hk-chart-bar" /></div></div>} />);
    expect(getComputedStyle(view.container.querySelector(".hk-chart-bar")!).position).toBe("static");
  } finally { style.remove(); }
});

test("finance omits boolean content while home and HR preserve zero-valued slots", () => {
  const view = render(<FinanceDashboard title="Finance" cashFlow={false} transactions={false} />);
  expect(screen.queryAllByRole("region")).toHaveLength(0);
  view.rerender(<HomeDashboard title="Home" hires={0} earnings={0} customers={0} />);
  for (const name of ["Recent hires", "Earnings", "Customers"]) expect(screen.getByRole("region", { name })).toHaveTextContent("0");
  view.rerender(<HrManagement title="People" recentHires={0} team={0} employees={0} />);
  for (const name of ["Recent hires", "Team breakdown", "Employees"]) expect(screen.getByRole("region", { name })).toHaveTextContent("0");
});

test("contributions expose finite counts and truthful empty or unavailable data", () => {
  const view = render(<ContributionsCard items={[{ label: "Monday", value: 0 }, { label: "Tuesday", value: 7 }, { label: "Invalid", value: NaN }, { label: "Negative", value: -1 }]} />);
  expect(screen.getByRole("meter", { name: "Monday" })).toHaveAttribute("value", "0");
  expect(screen.getByRole("meter", { name: "Tuesday" })).toHaveAttribute("value", "7");
  expect(screen.queryByRole("meter", { name: "Invalid" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Unavailable")).toHaveLength(2);
  view.rerender(<ContributionsCard />);
  expect(screen.getByText("No contributions supplied.")).toBeVisible();
});

test.each(["weekly", "monthly", "yearly"] as const)("contributions render supplied %s data and accept replacement data", period => {
  const view = render(<ContributionsCard periods={{ [period]: [{ label: "Supplied activity", value: 5 }] }} period={period} />);
  expect(screen.getByRole("combobox")).toHaveValue(period);
  expect(screen.getByRole("meter", { name: "Supplied activity" })).toHaveAttribute("value", "5");
  view.rerender(<ContributionsCard periods={{ [period]: [{ label: "Supplied activity", value: 0 }] }} period={period} />);
  expect(screen.getByRole("meter", { name: "Supplied activity" })).toHaveAttribute("value", "0");
});

test("contributions select supplied periods and honor host refusal, updates and disabled state", () => {
  const periods = { weekly: [{ label: "This week", value: 3 }], monthly: [{ label: "This month", value: 8 }] };
  const request = vi.fn();
  const view = render(<ContributionsCard periods={periods} period="weekly" onPeriodChange={request} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Contribution period" }), { target: { value: "monthly" } });
  expect(request).toHaveBeenCalledExactlyOnceWith("monthly");
  expect(screen.getByRole("combobox")).toHaveValue("weekly");
  expect(screen.getByRole("meter", { name: "This week" })).toBeVisible();
  view.rerender(<ContributionsCard periods={periods} period="monthly" onPeriodChange={request} disabled />);
  expect(screen.getByRole("meter", { name: "This month" })).toBeVisible();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "yearly" } });
  expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("combobox")).toBeDisabled();
  view.rerender(<ContributionsCard periods={periods} period="yearly" />);
  expect(screen.getByText("No contributions supplied.")).toBeVisible();
  view.unmount();
  render(<ContributionsCard periods={periods} defaultPeriod="monthly" />);
  expect(screen.getByRole("combobox")).toHaveValue("monthly");
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "weekly" } });
  expect(screen.getByRole("meter", { name: "This week" })).toBeVisible();
});

test("medical profile composes patient and health regions with host actions", () => {
  const request = vi.fn();
  render(<MedicalProfile title="Health overview" actions={<button onClick={request}>File a report</button>} identity={<p>Sample patient</p>} steps={<p>Daily counts</p>} sleep={<p>Sleep breakdown</p>} calendar={<p>Active dates</p>} activity={<p>Activity goals</p>} alerts={<p>Record updates</p>} patients={<input aria-label="Find patient" />}><p>Host detail</p></MedicalProfile>);
  for (const name of ["Patient information", "Steps", "Sleep score", "Most active days", "Activity", "Important alerts", "Patients"]) expect(screen.getByRole("region", { name })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "File a report" }));
  expect(request).toHaveBeenCalledOnce();
  expect(screen.getByRole("textbox", { name: "Find patient" })).toBeVisible();
  expect(screen.getByText("Host detail")).toBeVisible();
});

test("medical profile omits absent and boolean slots", () => {
  render(<MedicalProfile title="Health overview" identity={false} steps={null} sleep={false} calendar={undefined} activity={false} alerts={false} patients={false} />);
  for (const name of ["Patient information", "Steps", "Sleep score", "Most active days", "Activity", "Important alerts", "Patients"]) expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
});

test("marketing composes acquisition, spending, traffic, performance and campaign regions", () => {
  const create = vi.fn();
  render(<MarketingDashboard title="Marketing" actions={<button onClick={create}>New campaign</button>} acquisition={<p>Visits to customers</p>} spending={<p>Channel allocation</p>} traffic={<p>Traffic sources</p>} performance={<p>Spend and ROAS</p>} visitors={<p>Visitors by channel</p>} campaigns={<input aria-label="Find campaign" />} stats={[{ id: "spend", label: "Ad spend", value: "$120" }]}><p>Host-owned details</p></MarketingDashboard>);
  for (const name of ["Acquisition funnel", "Spend by channel", "Traffic sources", "Ad spend and ROAS", "Visitors", "Campaigns"]) expect(screen.getByRole("region", { name })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "New campaign" }));
  expect(create).toHaveBeenCalledOnce();
  expect(screen.getByRole("textbox", { name: "Find campaign" })).toBeVisible();
  expect(screen.getByText("Host-owned details")).toBeVisible();
});

test("marketing omits absent and boolean slots without creating empty landmarks", () => {
  render(<MarketingDashboard title="Marketing" acquisition={false} spending={null} traffic={false} performance={undefined} visitors={false} campaigns={false} />);
  for (const name of ["Acquisition funnel", "Spend by channel", "Traffic sources", "Ad spend and ROAS", "Visitors", "Campaigns"]) expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
});

test("HR composes people regions without owning their actions", () => {
  const add = vi.fn();
  render(<HrManagement title="People" actions={<button onClick={add}>Add employee</button>} recentHires={<p>Newest colleagues</p>} pipeline={<p>Applications to hires</p>} engagement={<p>Survey scores</p>} movement={<p>Hires and attrition</p>} team={<p>Team breakdown</p>} employees={<input aria-label="Find employee" />} stats={[{ id: "people", label: "Headcount", value: 7 }]}><p>Host detail</p></HrManagement>);
  for (const name of ["Recent hires", "Hiring pipeline", "Engagement", "Workforce movement", "Team breakdown", "Employees"]) expect(screen.getByRole("region", { name })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
  expect(add).toHaveBeenCalledOnce();
  expect(screen.getByRole("textbox", { name: "Find employee" })).toBeVisible();
  expect(screen.getByText("Host detail")).toBeVisible();
});

test("HR omits false-valued chart slots rather than empty landmarks", () => {
  render(<HrManagement title="Employees" pipeline={false} engagement={false} movement={false} employees={<p>Employee records</p>} />);
  expect(screen.queryByRole("region", { name: "Hiring pipeline" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Engagement" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Workforce movement" })).not.toBeInTheDocument();
});

test("home composes the workspace and all dashboard slots", () => {
  const request = vi.fn();
  render(<HomeDashboard title="Home" navigation={<button onClick={request}>Customers</button>} breadcrumb={<p>Workspace / Home</p>} search={<input aria-label="Search dashboard" />} actions={<button>Notifications</button>} hires={<p>Recent colleagues</p>} earnings={<p>Earned amount</p>} revenue={<p>Revenue trend</p>} contributions={<p>Contribution history</p>} customers={<p>Customer records</p>} stats={[{ id: "orders", label: "Orders", value: 42 }]}><p>Host footer</p></HomeDashboard>);
  for (const name of ["Recent hires", "Earnings", "Revenue", "Contributions", "Customers"]) expect(screen.getByRole("region", { name })).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Search dashboard" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Customers" }));
  expect(request).toHaveBeenCalledOnce();
  expect(screen.getByText("Host footer")).toBeVisible();
});

test("renders reusable dashboard compositions with host-fed metrics", () => {
  render(<><FinanceDashboard title="Finance" stats={[{ id: "cash", label: "Cash", value: "$12k" }]} /><HomeDashboard title="Home" /><ContributionsCard items={[{ label: "Mon", value: 4 }]} /></>);
  expect(screen.getByText("Finance")).toBeInTheDocument();
  expect(screen.getByText("$12k")).toBeInTheDocument();
  expect(screen.getByText("Mon")).toBeInTheDocument();
});

test("finance composes all named regions without moving host state", () => {
  const request = vi.fn();
  const fixture = (title: string) => <FinanceDashboard title={title} navigation={<button onClick={request}>Accounts</button>} actions={<button>Export statement</button>} cashFlow={<p>Income to expenses</p>} spending={<p>Category allocation</p>} portfolio={<p>Risk and return</p>} dailySpending={<p>Daily amounts</p>} transactions={<input aria-label="Search transactions" />}><p>Host note</p></FinanceDashboard>;
  const view = render(fixture("Your finances"));
  for (const name of ["Cash flow", "Spending by category", "Portfolio", "Daily spending", "Transactions"]) expect(screen.getByRole("region", { name })).toBeVisible();
  expect(screen.getByRole("navigation", { name: "Finance navigation" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Accounts" }));
  expect(request).toHaveBeenCalledOnce();
  const search = screen.getByRole("textbox");
  fireEvent.change(search, { target: { value: "Rent" } });
  view.rerender(fixture("Updated finances"));
  expect(screen.getByRole("textbox")).toBe(search);
  expect(search).toHaveValue("Rent");
  expect(screen.getByText("Host note")).toBeVisible();
});

test("omitted finance regions do not create fake data or empty landmarks", () => {
  const view = render(<FinanceDashboard title="Finances" stats={[]} />);
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.queryAllByRole("region")).toHaveLength(0);
  expect(view.container.querySelectorAll("svg,table,button")).toHaveLength(0);
  expect(screen.getByRole("heading", { name: "Finances" })).toBeVisible();
});
