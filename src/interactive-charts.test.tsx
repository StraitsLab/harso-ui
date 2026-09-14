import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AreaChartCard, ComboChartCard, LineChartCard } from "./chart-cards";

const data = [{ label: "Jan", value: 20, secondary: 30 }, { label: "Feb", value: 60, secondary: 40 }];
const series = [{ key: "value", label: "Visits" }, { key: "secondary", label: "Referrals" }];

describe("bounded interactive charts", () => {
  it.each([LineChartCard, AreaChartCard])("single-series charts omit the redundant legend, multi-series tiles own individual totals", Card => {
    const view = render(<Card title="Traffic" data={data} series={[series[0]]} tiles />);
    expect(view.container.querySelector(".hk-interactive-legend")).toBeNull();
    view.rerender(<Card title="Traffic" data={data} series={series} tiles />);
    expect(screen.getByRole("status")).toHaveTextContent("Total: 150");
    expect(screen.getByRole("status")).not.toHaveTextContent("Visits");
    expect(screen.getByRole("list", { name: "Traffic series" })).toHaveTextContent("Visits · total: 80");
    expect(screen.getByRole("list", { name: "Traffic series" })).toHaveTextContent("Referrals · total: 70");
    view.rerender(<Card title="Traffic" data={data} series={series} tiles headline={500} />);
    expect(screen.getByRole("status")).toHaveTextContent("500");
  });
  it("insets combo endpoint bars and aligns category centers", () => {
    const view = render(<ComboChartCard title="Insets" data={data} />);
    const bars = view.container.querySelectorAll(".hk-interactive-bar");
    expect(Number(bars[0].getAttribute("x"))).toBe(66);
    expect(Number(bars[1].getAttribute("x")) + Number(bars[1].getAttribute("width"))).toBe(374);
    const buttons = view.container.querySelectorAll<HTMLButtonElement>(".hk-interactive-points button");
    expect(parseFloat(buttons[0].style.left)).toBeCloseTo(80 / 440 * 100);
    expect(parseFloat(buttons[1].style.left)).toBeCloseTo(360 / 440 * 100);
  });

  it("area stacks both series, changes geometry for overlap and normalizes percent", () => {
    const view = render(<AreaChartCard title="Traffic" data={data} series={series} shape="sharp" />);
    const second = () => view.container.querySelector('[data-series="secondary"] .hk-interactive-area')?.getAttribute("d");
    const stacked = second();
    expect(view.container.querySelectorAll(".hk-interactive-area")).toHaveLength(2);
    view.rerender(<AreaChartCard title="Traffic" data={data} series={series} variant="overlap" shape="sharp" />);
    expect(second()).not.toBe(stacked);
    view.rerender(<AreaChartCard title="Traffic" data={data} series={series} variant="percent" shape="sharp" />);
    fireEvent.focus(screen.getByRole("button", { name: /Inspect Jan/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Visits: 20 (40%)");
    expect(screen.getByRole("status")).toHaveTextContent("Referrals: 30 (60%)");
  });

  it("line curves, focuses active dot, navigates and clears with Escape", () => {
    const view = render(<LineChartCard title="Revenue" data={data} />);
    expect(view.container.querySelector(".hk-interactive-line")?.getAttribute("d")).toContain("C");
    const first = screen.getByRole("button", { name: /Inspect Jan/ });
    first.focus();
    fireEvent.focus(first);
    expect(screen.getByRole("status")).toHaveTextContent("Jan");
    expect(view.container.querySelectorAll(".hk-interactive-dot")).toHaveLength(1);
    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByRole("button", { name: /Inspect Feb/ })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(view.container.querySelectorAll(".hk-interactive-dot")).toHaveLength(0);
    view.rerender(<LineChartCard title="Revenue" data={data} shape="sharp" />);
    expect(view.container.querySelector(".hk-interactive-line")?.getAttribute("d")).not.toContain("C");
  });

  it("combo has independent signed axes, supplied series formatting and total/average tiles", () => {
    const view = render(<ComboChartCard title="Sessions" data={[{ label: "Jan", sessions: 10000, rate: 2 }, { label: "Feb", sessions: -5000, rate: 4 }]} bar={{ key: "sessions", label: "Sessions" }} line={{ key: "rate", label: "Conversion", format: value => `${value}%` }} tiles />);
    expect(screen.getByText("Sessions · total: 5000")).toBeVisible();
    expect(screen.getByText("Conversion · average: 3%")).toBeVisible();
    expect(view.container.querySelectorAll(".hk-interactive-bar")).toHaveLength(2);
    fireEvent.pointerDown(view.container.querySelector('[data-inspect="1"]')!, { pointerType: "touch" });
    expect(screen.getByRole("status")).toHaveTextContent("Sessions: -5000");
    expect(screen.getByRole("status")).toHaveTextContent("Conversion: 4%");
    expect(view.container.querySelector(".hk-interactive-dot")?.getAttribute("cy")).toBe("20");
  });

  it("periods are controlled when supplied and never synthesize data on host refusal", () => {
    const change = vi.fn();
    const ranges = [{ id: "year", label: "This year", data }, { id: "week", label: "This week", data: [{ label: "Mon", value: 7 }] }];
    const view = render(<LineChartCard title="Revenue" ranges={ranges} range="year" onRangeChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "This week" }));
    expect(change).toHaveBeenCalledWith("week");
    expect(screen.getByRole("button", { name: "This year" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Inspect Jan/ })).toBeVisible();
    view.rerender(<LineChartCard title="Revenue" ranges={ranges} range="week" onRangeChange={change} />);
    expect(screen.getByRole("button", { name: /Inspect Mon/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Inspect Jan/ })).toBeNull();
  });

  it.each([AreaChartCard, LineChartCard, ComboChartCard])("%s keeps finite, missing, zero and negative values truthful", Card => {
    const view = render(<Card title="Extremes" data={[{ label: "Loss", value: -Number.MAX_VALUE, secondary: 0 }, { label: "Missing", value: NaN, secondary: 5 }, { label: "Gain", value: Number.MAX_VALUE }]} />);
    expect(view.container.querySelector("svg")?.outerHTML).not.toMatch(/NaN|Infinity/);
    fireEvent.click(screen.getByRole("button", { name: /Inspect Missing/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Unavailable");
    expect(screen.getByRole("button", { name: /Inspect Gain/ })).toBeVisible();
    view.rerender(<Card title="Zero" data={[{ label: "Zero", value: 0, secondary: 0 }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect Zero/ }));
    expect(screen.getByRole("status")).toHaveTextContent(": 0");
    expect(view.container.querySelector("svg")?.outerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("percent rejects negative/missing shares and zero totals instead of inventing composition", () => {
    const view = render(<AreaChartCard title="Share" variant="percent" series={series} data={[{ label: "Zero", value: 0, secondary: 0 }, { label: "Loss", value: -1, secondary: 3 }, { label: "Missing", value: 2 }]} />);
    expect(view.container.querySelectorAll(".hk-interactive-area")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /Inspect Zero/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Share unavailable");
    fireEvent.click(screen.getByRole("button", { name: /Inspect Loss/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Visits: -1");
  });

  it("gaps do not bridge missing samples or fabricate the secondary series", () => {
    const view = render(<LineChartCard title="Gaps" data={[data[0], { label: "Missing", value: NaN }, data[1]]} />);
    expect(view.container.querySelectorAll(".hk-interactive-line")).toHaveLength(2);
    view.rerender(<ComboChartCard title="Single" data={[{ label: "Jan", value: 8 }]} />);
    expect(view.container.querySelectorAll('[data-series="secondary"] .hk-interactive-line')).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /Inspect Jan/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Rate: Unavailable");
  });

  it("resting area headline is the grand total and extreme summaries stay finite", () => {
    const view = render(<AreaChartCard title="Traffic" data={data} series={series} />);
    expect(screen.getByRole("status")).toHaveTextContent("Total: 150");
    view.rerender(<AreaChartCard title="Overflow" delta={Number.MAX_VALUE} data={[{ label: "First", value: Number.MAX_VALUE }, { label: "Second", value: Number.MAX_VALUE }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Unavailable");
    expect(view.container.textContent).not.toMatch(/Infinity|NaN/);
  });

  it("ordinary integer totals remain exact without arbitrary rounding; overflow average remains finite", () => {
    const view = render(<LineChartCard title="Total" data={[6, 4, 3, 1].map((value, index) => ({ label: String(index), value }))} />);
    expect(screen.getByRole("status").textContent).toBe("Total · total: 14");
    view.rerender(<LineChartCard title="Total" data={[10, -20, 30].map((value, index) => ({ label: String(index), value }))} />);
    expect(screen.getByRole("status").textContent).toBe("Total · total: 20");
    view.rerender(<ComboChartCard title="Average" data={[{ label: "First", value: 1, secondary: Number.MAX_VALUE }, { label: "Second", value: 1, secondary: Number.MAX_VALUE }]} />);
    expect(screen.getByRole("status")).toHaveTextContent(`Rate · average: ${Number.MAX_VALUE}`);
  });

  it("period changes reset inspection, while identical controlled data stays under the host", () => {
    const ranges = [{ id: "month", label: "Monthly", data }, { id: "week", label: "Weekly", data: [{ label: "Monday", value: 4 }] }];
    const view = render(<AreaChartCard title="Traffic" ranges={ranges} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect Feb/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "week" } });
    expect(screen.getByRole("status")).not.toHaveTextContent("Feb");
    expect(screen.getByRole("button", { name: /Inspect Monday/ })).toBeVisible();
    view.rerender(<AreaChartCard title="Traffic" ranges={ranges} range="unknown" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Period IDs");
    expect(view.container.querySelector("svg")).toBeNull();
  });

  it("touch inspection survives the blur from a previously focused category", () => {
    const view = render(<LineChartCard title="Revenue" data={data} />);
    const first = screen.getByRole("button", { name: /Inspect Jan/ });
    first.focus();
    const target = view.container.querySelector('[data-inspect="1"]')!;
    fireEvent.pointerDown(target, { pointerType: "touch" });
    fireEvent.blur(first, { relatedTarget: null });
    fireEvent.click(target);
    expect(screen.getByRole("status")).toHaveTextContent("Feb");
  });

  it("unavailable observations are labelled as partial totals and series IDs are validated", () => {
    const view = render(<LineChartCard title="Observed" data={[{ label: "Yes", value: 4 }, { label: "No", value: null }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("1/2 available");
    view.rerender(<AreaChartCard title="Invalid" data={data} series={[series[0], series[0]]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Series keys");
    expect(view.container.querySelector("svg")).toBeNull();
  });

  it("disabled/error/loading/children remove built-in interaction; empty stays empty", () => {
    const change = vi.fn();
    const view = render(<AreaChartCard title="Traffic" data={data} disabled ranges={[{ id: "a", label: "A" }]} onRangeChange={change} />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Inspect Jan/ })).toBeDisabled();
    fireEvent.pointerDown(view.container.querySelector('[data-inspect="0"]')!);
    expect(screen.getByRole("status")).not.toHaveTextContent("Jan");
    view.rerender(<AreaChartCard title="Traffic" data={data} error="Host data failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Host data failed");
    expect(view.container.querySelector("svg")).toBeNull();
    view.rerender(<AreaChartCard title="Traffic" data={data} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    view.rerender(<AreaChartCard title="Traffic" value="82%" data={data}><p>Host visualization</p></AreaChartCard>);
    expect(screen.getByText("82%")).toBeVisible();
    expect(screen.getByText("Host visualization")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    view.rerender(<AreaChartCard title="Traffic" />);
    expect(screen.getByText("No data")).toBeVisible();
  });
});
