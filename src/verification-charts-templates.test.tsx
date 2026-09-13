import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ActivityRingsCard, BarListCard, FunnelChartCard, RevenueChartCard, SankeyChartCard, ScatterChartCard, StageBarsCard } from "./chart-cards";
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    show: { configurable: true, value() { this.open = true; } },
    showModal: { configurable: true, value() { this.open = true; } },
    close: { configurable: true, value() { this.open = false; } },
  });
});
afterAll(() => {
  for (const method of ["show", "showModal", "close"]) Reflect.deleteProperty(HTMLDialogElement.prototype, method);
});
import { FinanceExample } from "../preview/finance-example";
import { MarketingDashboardExample } from "../preview/marketing-dashboard-example";
import { HomeDashboardExample } from "../preview/home-dashboard-example";
import { HrManagementExample } from "../preview/hr-management-example";
import { MedicalProfileExample } from "../preview/medical-profile-example";

vi.mock("../../../../apps/ui-preview/node_modules/react", async () => import("react"));

// Phase D: the AI Chat, AI Profile and Image Generation template cases left with their retired demos (the
// product conversation is src/chat; profile/image templates have no replacement). Chart and dashboard proofs remain.
describe("WEV-1492 exact chart and template proof", () => {
  it("ring pointer hover selects its metric, dims siblings and restores the aggregate on leave", () => {
    const view = render(<ActivityRingsCard title="Activity" rings={[{ id: "move", label: "Move", value: 25, target: 100, unit: "kcal" }, { id: "run", label: "Run", value: 10, target: 20, unit: "km" }]} />);
    const groups = view.container.querySelectorAll("svg > g");
    fireEvent.pointerEnter(groups[0]);
    expect(screen.getByRole("status")).toHaveTextContent("Move: 25 / 100 kcal");
    expect(groups[0]).toHaveAttribute("opacity", "1");
    expect(groups[1]).toHaveAttribute("opacity", "0.28");
    fireEvent.pointerLeave(groups[0]);
    expect(screen.getByRole("status")).toHaveTextContent("2 activity metrics");
    expect(groups[1]).toHaveAttribute("opacity", "1");
    fireEvent.pointerEnter(groups[1]);
    expect(screen.getByRole("status")).toHaveTextContent("Run: 10 / 20 km");
    expect(groups[0]).toHaveAttribute("opacity", "0.28");
  });

  it("Sankey node and link pointer hover isolate the correct flows and restore totals", () => {
    const view = render(<SankeyChartCard title="Budget" nodes={[{ name: "Income" }, { name: "Rent" }, { name: "Food" }]} links={[{ source: "Income", target: "Rent", value: 75 }, { source: "Income", target: "Food", value: 25 }]} />);
    const plot = screen.getByRole("img", { name: "Budget chart" });
    const rent = within(plot).getByText("Rent", { exact: true }).closest("g")!;
    const links = view.container.querySelectorAll(".hk-sankey-link");
    fireEvent.pointerEnter(rent);
    expect(screen.getByRole("status")).toHaveTextContent("Rent · In: 75 · Out: 0");
    expect(links[0]).toHaveAttribute("opacity", "0.55");
    expect(links[1]).toHaveAttribute("opacity", "0.1");
    fireEvent.pointerEnter(links[1]);
    expect(screen.getByRole("status")).toHaveTextContent("Income → Food: 25");
    expect(links[0]).toHaveAttribute("opacity", "0.1");
    expect(links[1]).toHaveAttribute("opacity", "0.55");
    fireEvent.pointerLeave(plot);
    expect(screen.getByRole("status")).toHaveTextContent("Source total: 100 · Sink total: 100");
    for (const link of links) expect(link).toHaveAttribute("opacity", "0.55");
  });

  it("scatter record hover updates the headline and dims only the other series", () => {
    render(<ScatterChartCard title="Portfolio" series={[{ label: "Research", points: [{ label: "Atlas", x: 2, y: 8 }, { label: "Birch", x: 3, y: 6 }] }, { label: "Delivery", points: [{ label: "Cedar", x: 9, y: 4 }] }]} />);
    const atlas = screen.getByRole("img", { name: "Research · Atlas · X: 2 · Y: 8" });
    const birch = screen.getByRole("img", { name: "Research · Birch · X: 3 · Y: 6" });
    const cedar = screen.getByRole("img", { name: "Delivery · Cedar · X: 9 · Y: 4" });
    fireEvent.pointerEnter(atlas);
    expect(screen.getByRole("status")).toHaveTextContent("Research · Atlas · X: 2 · Y: 8");
    expect(atlas.parentElement).toHaveAttribute("opacity", "1");
    expect(birch.parentElement).toHaveAttribute("opacity", "1");
    expect(cedar.parentElement).toHaveAttribute("opacity", "0.3");
    fireEvent.pointerLeave(atlas);
    expect(screen.getByRole("status")).toHaveTextContent("3 observations");
    expect(cedar.parentElement).toHaveAttribute("opacity", "1");
    fireEvent.pointerEnter(cedar);
    expect(screen.getByRole("status")).toHaveTextContent("Delivery · Cedar · X: 9 · Y: 4");
    expect(atlas.parentElement).toHaveAttribute("opacity", "0.3");
  });

  it.each([BarListCard, StageBarsCard])("%s supplied color follows updated proportional data without changing numeric inspection", Card => {
    const view = render(<Card title="Sources" data={[{ label: "A", value: 25, color: "red" }, { label: "B", value: 100, color: "blue" }]} />);
    const bars = () => [...view.container.querySelectorAll<HTMLElement>(".hk-chart-funnel-bar")];
    expect(bars().map(bar => bar.style.width)).toEqual(["25%", "100%"]);
    expect(bars().map(bar => bar.style.backgroundColor)).toEqual(["red", "blue"]);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "A: 25" }));
    expect(screen.getByRole("status")).toHaveTextContent("A: 25");
    view.rerender(<Card title="Sources" data={[{ label: "A", value: 50, color: "green" }, { label: "B", value: 0, color: "purple" }]} />);
    expect(bars().map(bar => bar.style.width)).toEqual(["100%", "0%"]);
    expect(bars().map(bar => bar.style.backgroundColor)).toEqual(["green", "purple"]);
    expect(screen.getByRole("button", { name: "B: 0" })).toHaveTextContent("0");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "A: 50" }));
    expect(screen.getByRole("status")).toHaveTextContent("A: 50");
  });

  it("funnel supplied colors retain exact proportional path geometry across host updates", () => {
    const view = render(<FunnelChartCard title="Acquisition" shape="sharp" data={[{ label: "Visits", value: 100, color: "red" }, { label: "Sales", value: 25, color: "blue" }]} />);
    const paths = () => [...view.container.querySelectorAll<SVGElement>(".hk-chart-funnel-shape path")];
    expect(paths().map(path => path.style.fill)).toEqual(["red", "blue"]);
    expect(paths()[0]).toHaveAttribute("d", "M0 0 H200 L125 36 H75 Z");
    expect(paths()[1]).toHaveAttribute("d", "M75 0 H125 L125 36 H75 Z");
    view.rerender(<FunnelChartCard title="Acquisition" shape="sharp" data={[{ label: "Visits", value: 40, color: "green" }, { label: "Sales", value: 0, color: "purple" }]} />);
    expect(paths().map(path => path.style.fill)).toEqual(["green", "purple"]);
    expect(paths()[0]).toHaveAttribute("d", "M0 0 H200 L100 36 H100 Z");
    expect(paths()[1]).toHaveAttribute("d", "M100 0 H100 L100 36 H100 Z");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Sales: 0" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sales: 0");
  });

  it("revenue empty loading error and disabled states suppress stale interaction and recover", () => {
    const request = vi.fn();
    const props = { title: "Revenue", data: [{ label: "January", value: 20, secondary: 10 }], range: "month", ranges: [{ value: "month", label: "Month" }, { value: "year", label: "Year" }], onRangeChange: request };
    const view = render(<RevenueChartCard {...props} data={[]} />);
    expect(screen.getByText("No data")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    view.rerender(<RevenueChartCard {...props} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading chart");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Inspect January/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Year" }));
    expect(screen.getByRole("button", { name: "Year" })).toBeDisabled();
    view.rerender(<RevenueChartCard {...props} error="Revenue host failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Revenue host failed");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year" })).toBeDisabled();
    view.rerender(<RevenueChartCard {...props} disabled />);
    const point = screen.getByRole("button", { name: /Inspect January/ });
    expect(point).toBeDisabled();
    fireEvent.pointerEnter(point);
    expect(screen.getByRole("status")).not.toHaveTextContent("January");
    fireEvent.click(screen.getByRole("button", { name: "Year" }));
    expect(request).not.toHaveBeenCalled();
    view.rerender(<RevenueChartCard {...props} />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: /Inspect January/ }));
    expect(screen.getByRole("status")).toHaveTextContent("January — Current: 20 · Previous: 10");
  });

  it("finance composes real Sankey rings scatter and heatmap with supplied financial values", () => {
    const view = render(<FinanceExample state="default" />);
    const flow = within(screen.getByRole("region", { name: "Cash flow" }));
    fireEvent.focus(flow.getByRole("button", { name: /Income → Home/ }));
    expect(flow.getByRole("status")).toHaveTextContent("Income → Home: $1,245");
    const links = view.container.querySelectorAll(".hk-sankey-link");
    expect(Number(links[0].getAttribute("stroke-width")) / Number(links[1].getAttribute("stroke-width"))).toBeCloseTo(11.7452830189);
    const spending = within(screen.getByRole("region", { name: "Spending by category" }));
    fireEvent.pointerEnter(spending.getByRole("button", { name: /Food/ }));
    expect(spending.getByRole("status")).toHaveTextContent("Food: 106 / 1375");
    expect(Number(view.container.querySelectorAll(".hk-activity-ring-value")[1].getAttribute("stroke-dasharray")!.split(" ")[0])).toBeCloseTo(7.7090909091);
    const portfolio = within(screen.getByRole("region", { name: "Portfolio" }));
    fireEvent.pointerEnter(portfolio.getByRole("img", { name: /Sample B/ }));
    expect(portfolio.getByRole("status")).toHaveTextContent("Sample B");
    expect(portfolio.getByRole("status")).toHaveTextContent("35");
    expect(portfolio.getByRole("status")).toHaveTextContent("40");
    expect(portfolio.getByRole("img", { name: /Sample B/ })).toHaveAttribute("cx", "336");
    expect(portfolio.getByRole("img", { name: /Sample B/ })).toHaveAttribute("cy", "18");
    const matrix = within(view.container.querySelector(".hk-heatmap")!);
    fireEvent.pointerEnter(matrix.getByRole("button", { name: "Home · Sep 5: $45" }));
    expect(matrix.getByRole("status")).toHaveTextContent("Home · Sep 5: $45");
    fireEvent.change(screen.getByRole("combobox", { name: "Transaction data" }), { target: { value: "disabled" } });
    expect(matrix.getByRole("button", { name: "Home · Sep 5: $45" })).toBeDisabled();
    expect(matrix.getByRole("status")).toHaveTextContent("Total: $1375");
  });

  it("marketing traffic tabs show distinct supplied datasets and follow the period", () => {
    render(<MarketingDashboardExample state="default" />);
    expect(screen.getByRole("tabpanel", { name: "Sessions" })).toHaveTextContent("Search42,000 sessions");
    fireEvent.click(screen.getByRole("tab", { name: "Channels" }));
    expect(screen.getByRole("tabpanel", { name: "Channels" })).toHaveTextContent("Referral4,200 sessions");
    fireEvent.click(screen.getByRole("tab", { name: "Landing pages" }));
    const landing = screen.getByRole("tabpanel", { name: "Landing pages" });
    expect(landing).toHaveTextContent("/home42,000 sessions");
    expect(landing).toHaveTextContent("/about4,200 sessions");
    fireEvent.change(screen.getByRole("combobox", { name: "Analytics period" }), { target: { value: "Aug" } });
    expect(landing).toHaveTextContent("/home5,500 sessions");
    fireEvent.click(screen.getByRole("tab", { name: "Campaigns" }));
    const campaigns = screen.getByRole("tabpanel", { name: "Campaigns" });
    expect(campaigns).toHaveTextContent("Quiet launch0 USD sample spend");
    expect(campaigns).toHaveTextContent("New horizons3,360 USD sample spend");
    expect(campaigns).not.toHaveTextContent("/home");
  });

  it("marketing allocation gauge uses cumulative channel shares and preserves a zero-spend period", () => {
    render(<MarketingDashboardExample state="default" />);
    const gauge = screen.getByRole("img", { name: "Spend by channel half gauge" });
    const segments = () => [...gauge.querySelectorAll("path[pathLength]")];
    expect(gauge).toHaveTextContent("$24,000");
    expect(segments().map(path => path.getAttribute("stroke-dasharray"))).toEqual(["50 100", "30 100", "15 100", "5 100"]);
    expect(segments().map(path => path.getAttribute("stroke-dashoffset"))).toEqual(["0", "-50", "-80", "-95"]);
    fireEvent.click(screen.getByRole("button", { name: "Search: $12,000" }));
    expect(screen.getByLabelText("Marketing request")).toHaveTextContent("Inspect Search: $12,000");
    fireEvent.change(screen.getByRole("combobox", { name: "Analytics period" }), { target: { value: "Aug" } });
    expect(gauge).toHaveTextContent("$0");
    expect(segments().map(path => path.getAttribute("stroke-dasharray"))).toEqual(["0 100", "0 100", "0 100", "0 100"]);
    expect(segments().map(path => path.getAttribute("stroke-dashoffset"))).toEqual(["0", "0", "0", "0"]);
  });

  it("marketing visitor areas retain the shared scale and zero paid traffic after filtering", () => {
    render(<MarketingDashboardExample state="default" />);
    const plot = screen.getByRole("img", { name: "Visitors by channel over time" });
    expect(plot.querySelectorAll("polygon")).toHaveLength(3);
    expect(plot.querySelectorAll("circle")).toHaveLength(15);
    expect(Number(plot.querySelector("g circle")!.getAttribute("cy"))).toBeCloseTo(94.6666666667);
    fireEvent.change(screen.getByRole("combobox", { name: "Analytics period" }), { target: { value: "Aug" } });
    const groups = plot.querySelectorAll("g");
    expect(plot.querySelectorAll("circle")).toHaveLength(3);
    expect(groups[0].querySelector("polyline")).toHaveAttribute("points", "65,84");
    expect(groups[1].querySelector("polyline")).toHaveAttribute("points", "65,180");
    expect(groups[1].querySelector("polygon")).toHaveAttribute("points", "65,180 65,180 65,180");
    expect(Number(groups[2].querySelector("circle")!.getAttribute("cy"))).toBeCloseTo(158.6666666667);
    fireEvent.click(screen.getByRole("button", { name: "Aug: organic 9000, paid 0, social 2000" }));
    expect(screen.getByLabelText("Marketing request")).toHaveTextContent("Inspect Aug: organic 9000, paid 0, social 2000");
  });

  it("home earnings bars and inspection amounts follow the selected period and empty data", () => {
    render(<HomeDashboardExample state="default" />);
    const earnings = screen.getByRole("region", { name: "Earnings" });
    const bars = () => [...earnings.querySelectorAll<HTMLElement>(".hk-chart-bar")];
    expect(bars()).toHaveLength(7);
    bars().forEach((bar, index) => expect(Number.parseFloat(bar.style.height)).toBeCloseTo((index + 1) * 100 / 7));
    fireEvent.click(within(earnings).getByText("Inspect earnings"));
    expect(within(earnings).getByText("Aster: $60")).toBeVisible();
    expect(within(earnings).getByText("Grove: $420")).toBeVisible();
    fireEvent.change(screen.getByRole("combobox", { name: "Dashboard period" }), { target: { value: "Monthly" } });
    expect(earnings).toHaveTextContent("$6,720");
    expect(within(earnings).getByText("Aster: $240")).toBeVisible();
    expect(within(earnings).getByText("Grove: $1,680")).toBeVisible();
    expect(bars()).toHaveLength(7);
    fireEvent.change(screen.getByRole("combobox", { name: "Dashboard data" }), { target: { value: "empty" } });
    expect(earnings).toHaveTextContent("No earnings");
    expect(bars()).toHaveLength(0);
  });

  it("home navigation and search change the actual customer view", () => {
    render(<HomeDashboardExample state="default" />);
    const navigation = within(screen.getByRole("navigation", { name: "Dashboard workspace" }));
    fireEvent.click(navigation.getByRole("button", { name: "Customers" }));
    expect(navigation.getByRole("button", { name: "Customers" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("region", { name: "Earnings" })).not.toBeInTheDocument();
    fireEvent.click(navigation.getByRole("button", { name: "Overview" }));
    expect(screen.getByRole("region", { name: "Earnings" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search customers" }), { target: { value: "Grove" } });
    const customers = within(screen.getByRole("table", { name: "Customers" }));
    expect(customers.getByText("Grove Systems")).toBeInTheDocument();
    expect(customers.queryByText("Aster Studio")).not.toBeInTheDocument();
    expect(navigation.getByRole("button", { name: "Customers" })).toHaveAttribute("aria-current", "page");
    fireEvent.change(screen.getByRole("textbox", { name: "Search customers" }), { target: { value: "missing-customer" } });
    expect(customers.getByText("No matching customers.")).toBeInTheDocument();
  });

  it("HR KPI values and recent hire ordering derive from the real roster and clear when empty", () => {
    render(<HrManagementExample state="default" />);
    const metrics = screen.getByLabelText("Your people metrics");
    const values = () => [...metrics.querySelectorAll(".hk-stat-value")].map(node => node.textContent);
    expect(values()).toEqual(["8", "3", "20 days", "2.0%"]);
    const hires = screen.getByRole("region", { name: "Recent hires" });
    expect([...hires.querySelectorAll("li strong")].map(node => node.textContent)).toEqual(["Mira Chen", "Drew Lane", "Noah Rivera", "Sam Patel"]);
    expect([...hires.querySelectorAll("time")].map(node => node.dateTime)).toEqual(["2026-09-07", "2026-09-07", "2026-09-06", "2026-09-05"]);
    expect(within(hires).getAllByRole("listitem")[0]).toHaveTextContent("Designer · Engineering");
    expect(within(hires).getAllByRole("listitem")[1]).toHaveTextContent("Team lead · Operations");
    fireEvent.change(screen.getByRole("combobox", { name: "HR data" }), { target: { value: "empty" } });
    expect(values()).toEqual(["0", "0", "No hires", "0.0%"]);
    expect(hires).toHaveTextContent("No recent hires");
    expect(within(hires).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("marketing KPI totals respond to period selection including zero spend and empty history", () => {
    render(<MarketingDashboardExample state="default" />);
    const values = () => [...screen.getByLabelText("Your reach metrics").querySelectorAll(".hk-stat-value")].map(node => node.textContent);
    expect(values()).toEqual(["$24,000", "84,000", "4,200", "3.63×"]);
    fireEvent.change(screen.getByRole("combobox", { name: "Analytics period" }), { target: { value: "Aug" } });
    expect(values()).toEqual(["$0", "11,000", "550", "—"]);
    fireEvent.change(screen.getByRole("combobox", { name: "Marketing scenario" }), { target: { value: "empty" } });
    expect(values()).toEqual(["$0", "0", "0", "—"]);
  });

  it("marketing inspection dispatches distinct exact funnel allocation return and visitor data", () => {
    render(<MarketingDashboardExample state="default" />);
    for (const label of ["Visits: 84,000", "Customers: 4,200", "Search: $12,000", "Apr: $4,000 · 3.00× ROAS", "Aug: $0 · ROAS unavailable (zero spend)", "Aug: organic 9000, paid 0, social 2000"]) {
      fireEvent.click(screen.getByText(label, { selector: "button" }));
      expect(screen.getByLabelText("Marketing request")).toHaveTextContent(`Inspect ${label}.`);
    }
    fireEvent.click(screen.getByRole("tab", { name: "Channels" }));
    expect(screen.getByRole("tabpanel", { name: "Channels" })).toHaveTextContent("Referral4,200 sessions");
    fireEvent.change(screen.getByRole("combobox", { name: "Marketing scenario" }), { target: { value: "disabled" } });
    expect(screen.getByText("Visits: 84,000", { selector: "button" })).toBeDisabled();
    fireEvent.click(screen.getByText("Visits: 84,000", { selector: "button" }));
    expect(screen.getByLabelText("Marketing request")).toHaveTextContent("Traffic tab requested.");
  });

  it("medical identity replaces every patient field when a different real profile is selected", () => {
    const view = render(<MedicalProfileExample state="default" />);
    const identity = () => view.container.querySelector(".hk-medical-identity")!;
    const values = () => [...identity().querySelectorAll("dd")].map(node => node.textContent);
    expect(identity().querySelector("h3")).toHaveTextContent("Alex Example");
    expect([...identity().querySelectorAll("dt")].map(node => node.textContent)).toEqual(["Date of birth", "Gender", "Blood type", "Doctor"]);
    expect(values()).toEqual(["1990-04-12", "Man", "O+", "Dr. Taylor Sample"]);
    fireEvent.change(screen.getByRole("combobox", { name: "Selected profile" }), { target: { value: "1" } });
    expect(identity().querySelector("h3")).toHaveTextContent("Mira Sample");
    expect(values()).toEqual(["1991-04-12", "Woman", "A+", "Dr. Taylor Sample"]);
    expect(screen.getByRole("combobox", { name: "Selected profile" })).toHaveValue("1");
  });

  it("HR team tabs expose roster distributions and chart details disclose their supplied observations", () => {
    render(<HrManagementExample state="default" />);
    expect(within(screen.getByRole("tabpanel", { name: "People" })).getAllByRole("listitem")).toHaveLength(8);
    for (const [tab, expected] of [
      ["Departments", ["Engineering2", "Design2", "Sales2", "Operations2"]],
      ["Hiring sources", ["Referral3", "Careers page3", "Recruiter2"]],
      ["Locations", ["Singapore3", "London3", "Remote2"]],
    ] as const) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expect(within(screen.getByRole("tabpanel", { name: tab })).getAllByRole("listitem").map(item => item.textContent)).toEqual(expected);
    }
    const engagement = screen.getByRole("region", { name: "Engagement" });
    fireEvent.click(within(engagement).getByText("Inspect engagement"));
    expect(within(engagement).getByText("Clarity: 80 / 100")).toBeVisible();
    expect(within(engagement).getByText("Autonomy: 76 / 100")).toBeVisible();
    const movement = screen.getByRole("region", { name: "Workforce movement" });
    fireEvent.click(within(movement).getByText("Inspect workforce movement"));
    expect(within(movement).getByText("Apr: 5 hires · 2% attrition")).toBeVisible();
    expect(within(movement).getByText("Aug: 0 hires · 0% attrition")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Offers" })).toHaveAttribute("value", "5");
    expect(screen.getByRole("progressbar", { name: "Offers" })).toHaveAttribute("max", "80");
    fireEvent.change(screen.getByRole("combobox", { name: "HR data" }), { target: { value: "empty" } });
    expect(screen.getByRole("tabpanel", { name: "Locations" })).toHaveTextContent("No people to summarize");
  });

  it("medical chart inspection requests carry the selected patients exact step and sleep readings", () => {
    render(<MedicalProfileExample state="default" />);
    for (const label of ["2026-09-01: 3,600 steps", "2026-09-03: 0 steps", "2026-09-07: 5,200 steps", "Duration: 44 / 50", "Timing: 24 / 30", "Continuity: 18 / 20"]) {
      fireEvent.click(screen.getByText(label, { selector: "button" }));
      expect(screen.getByLabelText("Medical request")).toHaveTextContent(`Inspect ${label}.`);
    }
    fireEvent.change(screen.getByRole("combobox", { name: "Selected profile" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "2026-09-01: 3,960 steps" }));
    expect(screen.getByLabelText("Medical request")).toHaveTextContent("Inspect 2026-09-01: 3,960 steps.");
    expect(screen.queryByRole("button", { name: "2026-09-01: 3,600 steps" })).not.toBeInTheDocument();
  });
});
