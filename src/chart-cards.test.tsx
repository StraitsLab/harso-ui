import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import chartStyles from "./chart-cards.css?raw";
import { ActivityRingsCard, AreaChartCard, BarListCard, EarningsChartCard, FunnelChartCard, HeatmapChartCard, MostActiveDaysCard, OrdersChartCard, RadialChartCard, RadarChartCard, RevenueChartCard, SankeyChartCard, ScatterChartCard, SleepScoreCard, StageBarsCard, StepsCard } from "./chart-cards";

describe("chart cards", () => {
  it.each(["filled", "dots", "lines", "score"] as const)("radar %s persistently maps numbered axes to category labels without inspection", variant => {
    const data = [{ label: "Speed", value: 0 }, { label: "A long category with context", value: 40 }, { label: "", value: NaN }];
    const view = render(<RadarChartCard title="Mapped axes" data={data} variant={variant} />);
    expect(Array.from(view.container.querySelectorAll(".hk-radar-axis-label"), label => label.textContent)).toEqual(["1", "2", "3"]);
    expect(Array.from(view.container.querySelectorAll(".hk-radar-category-number"), label => label.textContent)).toEqual(["1 · ", "2 · ", "3 · "]);
    expect(screen.getByRole("button", { name: "Unlabeled category: Unavailable" })).toHaveTextContent("3 · Unlabeled category");
    expect(screen.getByRole("status")).toHaveTextContent("Focus or touch a value to inspect");
    view.rerender(<RadarChartCard title="Mapped axes" data={[]} variant={variant} />);
    expect(view.container.querySelectorAll(".hk-radar-axis-label")).toHaveLength(0);
    expect(view.container.querySelectorAll(".hk-radar-category-number")).toHaveLength(0);
    expect(screen.getByText("No data")).toBeVisible();
  });

  it.each(["filled", "dots", "lines", "score"] as const)("radar %s has distinct truthful anatomy and linked axis inspection", variant => {
    const data = [{ label: "Speed", value: 0 }, { label: "Quality", value: 40 }, { label: "Care", value: 80 }];
    const view = render(<RadarChartCard title="Radar anatomy" data={data} variant={variant} score={0} showTiles />);
    expect(view.container.querySelector(".hk-radar-plot")).toHaveAttribute("data-variant", variant);
    expect(view.container.querySelectorAll(".hk-radar-axis")).toHaveLength(3);
    expect(view.container.querySelectorAll(".hk-chart-radar-point")).toHaveLength(3);
    expect(view.container.querySelectorAll(".hk-chart-radar")).toHaveLength(variant === "filled" || variant === "score" ? 1 : 0);
    expect(view.container.querySelectorAll(".hk-radar-edge")).toHaveLength(variant === "lines" ? 3 : 0);
    expect(view.container.querySelector(".hk-chart-stat-tiles")).not.toBeNull();
    if (variant === "score") expect(view.container.querySelector(".hk-radar-score")).toHaveTextContent("0");
    fireEvent.pointerEnter(view.container.querySelectorAll(".hk-radar-axis")[1]);
    expect(screen.getByRole("status")).toHaveTextContent("Quality: 40");
    const tile = screen.getByRole("button", { name: "Care: 80" });
    fireEvent.focus(tile);
    expect(view.container.querySelectorAll(".hk-chart-radar-point")[2]).toHaveAttribute("data-active", "true");
    fireEvent.keyDown(tile, { key: "Escape" });
    expect(screen.getByRole("status")).not.toHaveTextContent("Care: 80");
  });

  it("radar lines retain missing axes, zero geometry and host-supplied score only", () => {
    const data = [{ label: "Zero", value: 0 }, { label: "Missing", value: NaN }, { label: "Finite", value: .25 }, { label: "Last", value: .5 }];
    const view = render(<RadarChartCard title="Gaps" data={data} variant="lines" />);
    expect(view.container.querySelectorAll(".hk-radar-edge")).toHaveLength(2);
    expect(view.container.querySelectorAll(".hk-radar-axis")).toHaveLength(4);
    expect(view.container.querySelector(".hk-chart-radar-point")).toHaveAttribute("cy", "54");
    view.rerender(<RadarChartCard title="Gaps" data={data} variant="score" score={Infinity} />);
    expect(view.container.querySelector(".hk-radar-score")).toHaveTextContent("Unavailable");
    expect(view.container.querySelector("polygon")).toBeNull();
    expect(view.container.innerHTML).not.toMatch(/(?:NaN|Infinity)/);
  });

  it("radar series hover describes the complete supplied series, not an arbitrary axis", () => {
    const view = render(<RadarChartCard title="Series" data={[{ label: "One", value: 2 }, { label: "Two", value: 4 }]} />);
    fireEvent.pointerEnter(view.container.querySelector("polygon")!);
    expect(screen.getByRole("status")).toHaveTextContent("One: 2 · Two: 4");
    fireEvent.pointerLeave(view.container.querySelector("article")!);
    expect(screen.getByRole("status")).not.toHaveTextContent("One: 2");
  });

  it.each([RadarChartCard, RadialChartCard])("%s blocks anatomy controls and inspection for loading/error/disabled", Card => {
    const data = [{ label: "A", value: 0 }];
    const fixture = (state: { loading?: boolean; disabled?: boolean; error?: string }) => <Card title="Blocked" data={data} showTiles {...state} />;
    const view = render(fixture({ loading: true }));
    expect(screen.queryByRole("button", { name: "A: 0" })).toBeNull();
    view.rerender(fixture({ error: "Host failed" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Host failed");
    expect(view.container.querySelector("svg")).toBeNull();
    view.rerender(fixture({ disabled: true }));
    expect(screen.getByRole("button", { name: "A: 0" })).toBeDisabled();
    fireEvent.pointerDown(view.container.querySelector("svg")!.querySelector(".hk-radar-axis, .hk-chart-radial")!);
    expect(screen.getByRole("status")).not.toHaveTextContent("A: 0");
  });

  it.each(["rings", "labels", "grid", "gauge", "solid", "stacked"] as const)("radial %s preserves independent percentages, invalid slots and linked tiles", layout => {
    const data = [{ label: "Zero", value: 0 }, { label: "Fraction", value: .25 }, { label: "Full", value: 100 }, { label: "Bad", value: 101 }];
    const view = render(<RadialChartCard title="Radial anatomy" data={data} layout={layout} showTiles />);
    expect(view.container.querySelector(".hk-radial-plot")).toHaveAttribute("data-layout", layout);
    expect(view.container.querySelectorAll(".hk-radial-value")).toHaveLength(3);
    expect(view.container.querySelector(".hk-radial-value")).toHaveAttribute("data-value", "0");
    expect(view.container.querySelector(".hk-chart-stat-tiles")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Bad: Unavailable" })).toBeVisible();
    fireEvent.focus(screen.getByRole("button", { name: "Fraction: 0.25" }));
    expect(view.container.querySelectorAll(".hk-radial-value")[1]).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Fraction: 0.25");
    if (layout === "gauge") expect(view.container.querySelector(".hk-radial-value")).toHaveAttribute("stroke-dasharray", "0 100");
    if (layout === "solid") expect(view.container.querySelectorAll(".hk-radial-sector")).toHaveLength(3);
    if (layout === "labels") expect(view.container.querySelectorAll(".hk-radial-label")).toHaveLength(4);
    if (layout === "stacked") expect(screen.getByText(/Equal segments/)).toBeVisible();
    expect(view.container.innerHTML).not.toMatch(/(?:NaN|Infinity)/);
  });

  it("radial segment math does not pool independent percentages or fill zero sectors", () => {
    const data = [{ label: "Empty", value: 0 }, { label: "Half", value: 50 }, { label: "Full", value: 100 }, { label: "Missing", value: NaN }];
    const view = render(<RadialChartCard title="Math" layout="stacked" data={data} />);
    const segments = view.container.querySelectorAll(".hk-radial-value");
    expect(segments[0]).toHaveAttribute("stroke-dasharray", "0 100");
    expect(segments[1]).toHaveAttribute("stroke-dasharray", "12.5 100");
    expect(segments[2]).toHaveAttribute("stroke-dashoffset", "-50");
    view.rerender(<RadialChartCard title="Math" layout="solid" data={data} />);
    expect(view.container.querySelector(".hk-radial-sector")).toHaveAttribute("d", "");
  });

  it("radial color values cannot introduce SVG paint-server URLs", () => {
    const data = [{ label: "Color", value: 50, color: "url(https://example.invalid/paint.svg#color)" }];
    const view = render(<RadialChartCard title="Colors" layout="solid" data={data} />);
    expect(view.container.querySelector(".hk-radial-sector")).toHaveAttribute("fill", "currentColor");
    view.rerender(<RadialChartCard title="Colors" layout="rings" data={data} />);
    expect(view.container.querySelector(".hk-radial-value")).toHaveAttribute("stroke", "currentColor");
  });

  it("radar variant selection supports local changes, controlled refusal and disabled state", () => {
    const data = [{ label: "A", value: 1 }], request = vi.fn();
    const view = render(<RadarChartCard title="Modes" data={data} showVariantControl />);
    fireEvent.change(screen.getByRole("combobox", { name: "Modes variant" }), { target: { value: "dots" } });
    expect(view.container.querySelector(".hk-radar-plot")).toHaveAttribute("data-variant", "dots");
    view.rerender(<RadarChartCard title="Modes" data={data} variant="lines" onVariantChange={request} showVariantControl />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "score" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("score");
    expect(screen.getByRole("combobox")).toHaveValue("lines");
    view.rerender(<RadarChartCard title="Modes" data={data} variant="lines" showVariantControl disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("radial layout selection exposes exactly six choices, resets inspection and respects host refusal", () => {
    const data = [{ label: "A", value: 1 }], request = vi.fn();
    const view = render(<RadialChartCard title="Layouts" data={data} showLayoutControl />);
    expect(screen.getAllByRole("option").map(option => option.getAttribute("value"))).toEqual(["rings", "labels", "grid", "gauge", "solid", "stacked"]);
    fireEvent.focus(screen.getByRole("button", { name: "A: 1" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "gauge" } });
    expect(screen.getByRole("status")).not.toHaveTextContent("A: 1");
    expect(view.container.querySelector(".hk-radial-plot")).toHaveAttribute("data-layout", "gauge");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "rings" } });
    expect(screen.getByRole("status")).not.toHaveTextContent("A: 1");
    view.rerender(<RadialChartCard title="Layouts" data={data} layout="rings" onLayoutChange={request} showLayoutControl />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "grid" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("grid");
    expect(screen.getByRole("combobox")).toHaveValue("rings");
    view.rerender(<RadialChartCard title="Layouts" data={data} layout="rings" showLayoutControl />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
  it("active days composes the native calendar with selected-day rings and host refusal", () => {
    const request = vi.fn();
    const days = [{ date: "2026-09-08", rings: [{ id: "move", label: "Move", value: 20, target: 100 }] }, { date: "2026-09-09", rings: [{ id: "move", label: "Move", value: 80, target: 100 }] }];
    const view = render(<MostActiveDaysCard title="Days" days={days} month="2026-09" selectedDate="2026-09-08" onSelectedDateChange={request} today="2026-09-08" />);
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Wednesday, September 9, 2026/ }));
    expect(request).toHaveBeenCalledExactlyOnceWith("2026-09-09");
    expect(screen.getByRole("button", { name: /Move:|Move 20/ })).toHaveTextContent("20 / 100");
    view.rerender(<MostActiveDaysCard title="Days" days={days} month="2026-09" selectedDate="2026-09-09" today="2026-09-08" />);
    expect(screen.getByRole("button", { name: /Move 80/ })).toBeVisible();
    view.rerender(<MostActiveDaysCard title="Days" days={[]} month="2026-09" selectedDate="2026-09-09" today="2026-09-08" />);
    expect(screen.getByText("No activity recorded for 2026-09-09.")).toBeVisible();
  });

  it("active days rejects duplicate dates and supports a scrollable supplied month window", () => {
    const view = render(<MostActiveDaysCard title="Days" months={["2026-08", "2026-09"]} today="2026-09-08" days={[]} />);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Days months" })).toHaveAttribute("tabindex", "0");
    view.rerender(<MostActiveDaysCard title="Days" days={[{ date: "2026-02-30", rings: [] }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("valid unique dates");
    view.rerender(<MostActiveDaysCard title="Days" days={[{ date: "2026-09-08", rings: [] }, { date: "2026-09-08", rings: [] }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("valid unique dates");
  });

  it("orders plots current and prior years against one signed scale without filling missing bars", () => {
    const view = render(<OrdersChartCard title="Orders" data={[{ label: "Jan", value: 20, secondary: 10 }, { label: "Feb", value: -20 }, { label: "Mar", value: 0, secondary: 0 }]} />);
    expect(view.container.querySelectorAll(".hk-chart-prior-bar")).toHaveLength(2);
    const first = view.container.querySelectorAll<HTMLElement>(".hk-chart-bar-track")[0];
    expect(first.querySelector<HTMLElement>(".hk-chart-bar:not(.hk-chart-prior-bar)")!.style.height).toBe("50%");
    expect(first.querySelector<HTMLElement>(".hk-chart-prior-bar")!.style.height).toBe("25%");
    fireEvent.focus(screen.getByRole("button", { name: /Feb/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Previous: Unavailable");
  });

  it("revenue reuses gap-safe paired lines with current area and host-owned periods", () => {
    const request = vi.fn();
    const data = [{ label: "Jan", value: 10, secondary: 5 }, { label: "Feb", value: NaN }, { label: "Mar", value: 30, secondary: 15 }];
    const view = render(<RevenueChartCard title="Revenue" data={data} range="year" ranges={[{value:"year",label:"Year"},{value:"quarter",label:"Quarter"}]} onRangeChange={request} />);
    expect(view.container.querySelectorAll('[data-series="value"] .hk-interactive-line')).toHaveLength(2);
    expect(view.container.querySelectorAll('[data-series="secondary"] .hk-interactive-line')).toHaveLength(2);
    expect(view.container.querySelectorAll(".hk-chart-bar")).toHaveLength(0);
    fireEvent.focus(screen.getByRole("button", {name:/Inspect Feb/}));
    expect(screen.getByRole("status")).toHaveTextContent("Current: Unavailable · Previous: Unavailable");
    expect(screen.getByRole("status")).not.toHaveTextContent("Total:");
    fireEvent.click(screen.getByRole("button", {name:"Quarter"}));
    expect(request).toHaveBeenCalledExactlyOnceWith("quarter");
    expect(screen.getByRole("button", {name:"Year"})).toHaveAttribute("aria-pressed","true");
  });

  it("funnels taper between actual stage widths in sharp and eased modes", () => {
    const data = [{label:"Start",value:100},{label:"Middle",value:50},{label:"End",value:0},{label:"Unknown",value:NaN}];
    const view = render(<FunnelChartCard title="Flow" data={data} shape="sharp" />);
    expect(view.container.querySelectorAll(".hk-chart-funnel-shape")).toHaveLength(3);
    expect(view.container.querySelector(".hk-chart-funnel-shape path")).toHaveAttribute("d", "M0 0 H200 L150 36 H50 Z");
    view.rerender(<FunnelChartCard title="Flow" data={data} shape="eased" />);
    expect(view.container.querySelector(".hk-chart-funnel-shape path")!.getAttribute("d")).toContain("C");
    expect(screen.getByRole("button",{name:"Unknown: Unavailable"})).toBeVisible();
    expect(view.container.querySelector("svg")!.outerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("sleep metrics drive independent goal-normalized arc segments and inspect with focus", () => {
    const view = render(<SleepScoreCard title="Sleep" value="Overall" data={[{label:"Duration",value:6,target:8,unit:"hours"},{label:"Quality",value:80},{label:"Consistency",value:NaN}]} />);
    expect(view.container.querySelectorAll(".hk-sleep-segment")).toHaveLength(2);
    expect(view.container.querySelectorAll(".hk-chart-bar")).toHaveLength(0);
    fireEvent.focus(screen.getByRole("button", {name:/Duration: 6/}));
    expect(screen.getByRole("status")).toHaveTextContent("Duration: 6 / 8 hours");
    expect(view.container.querySelector('.hk-sleep-segment[data-active="true"]')).toBeTruthy();
    expect(screen.getByRole("button",{name:"Consistency: Unavailable"})).toBeVisible();
  });

  it("inspection never dims readable labels along with chart geometry", () => {
    const style=document.createElement("style");style.textContent=chartStyles;document.head.append(style);
    try {
      render(<SleepScoreCard title="Sleep" data={[{label:"A",value:50},{label:"B",value:80}]} />);
      fireEvent.focus(screen.getByRole("button",{name:"A: 50 / 100"}));
      expect(getComputedStyle(screen.getByRole("button",{name:"B: 80 / 100"})).opacity).not.toBe("0.4");
    } finally {style.remove();}
  });
  it("calendar loading, error and disabled states suppress day changes without fabricated activity", () => {
    const request = vi.fn();
    const props = { title: "Days", month: "2026-09", today: "2026-09-08", days: [{ date: "2026-09-08", rings: [{ id: "move", label: "Move", value: 20, target: 100 }] }], onSelectedDateChange: request };
    const view = render(<MostActiveDaysCard {...props} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading activity");
    expect(screen.queryByRole("grid")).toBeNull();
    view.rerender(<MostActiveDaysCard {...props} error="Offline" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Offline");
    expect(screen.queryByRole("grid")).toBeNull();
    view.rerender(<MostActiveDaysCard {...props} disabled />);
    const day = screen.getByRole("button", { name: /Wednesday, September 9, 2026/ });
    expect(day).toBeDisabled();
    fireEvent.click(day);
    expect(request).not.toHaveBeenCalled();
  });

  it("sleep keeps periods host owned and suppresses stale arcs in blocked states", () => {
    const request = vi.fn();
    const props = { title: "Sleep", value: "Summary", data: [{ label: "Duration", value: 6, target: 8 }], range: "week", ranges: [{ value: "week", label: "Week" }, { value: "month", label: "Month" }], onRangeChange: request };
    const view = render(<SleepScoreCard {...props} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "month" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("month");
    expect(screen.getByRole("combobox")).toHaveValue("week");
    const metric = screen.getByRole("button", { name: "Duration: 6 / 8" });
    fireEvent.focus(metric);
    fireEvent.keyDown(metric, { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("Summary");
    view.rerender(<SleepScoreCard {...props} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Duration: 6 / 8" })).toBeDisabled();
    view.rerender(<SleepScoreCard {...props} loading />);
    expect(view.container.querySelector(".hk-sleep-plot")).toBeNull();
    view.rerender(<SleepScoreCard {...props} error="Offline" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Offline");
    expect(view.container.querySelector(".hk-sleep-plot")).toBeNull();
    view.rerender(<SleepScoreCard {...props} data={[]} />);
    expect(screen.getByText("No data")).toBeVisible();
  });
  it.each([ActivityRingsCard, BarListCard, EarningsChartCard, FunnelChartCard, HeatmapChartCard, MostActiveDaysCard, OrdersChartCard, RadarChartCard, RadialChartCard, RevenueChartCard, SankeyChartCard, ScatterChartCard, SleepScoreCard, StageBarsCard, StepsCard])("%s exports an empty host-fed family without invented data", Card => {
    render(<Card title="Empty family" />);
    expect(screen.getByRole("heading", { name: "Empty family" })).toBeVisible();
  });

  it.each([BarListCard, StageBarsCard])("%s renders horizontal fractional, zero and missing stages", Card => {
    const view = render(<Card title="Widths" data={[{ label: "Zero", value: 0 }, { label: "Half", value: .25 }, { label: "Full", value: .5 }, { label: "Missing", value: Infinity }]} />);
    expect(Array.from(view.container.querySelectorAll<HTMLElement>(".hk-chart-funnel-bar")).map(bar => bar.style.width)).toEqual(["0%", "50%", "100%"]);
    expect(screen.getByRole("button", { name: "Missing: Unavailable" })).toBeVisible();
  });
  it("direct-child bars stay in grid flow while signed tracks retain absolute geometry", () => {
    const style = document.createElement("style");
    style.textContent = chartStyles;
    document.head.append(style);
    try {
      const view = render(<div className="hk-chart-bars"><div className="hk-chart-bar-column"><span className="hk-chart-bar" style={{ height: "50%" }} /></div><div className="hk-chart-bar-column"><span className="hk-chart-bar-track"><span className="hk-chart-bar" style={{ height: "50%", bottom: "50%" }} /></span></div></div>);
      const bars = view.container.querySelectorAll(".hk-chart-bar");
      expect(getComputedStyle(bars[0]).position).toBe("static");
      expect(getComputedStyle(bars[0]).alignSelf).toBe("end");
      expect(getComputedStyle(bars[1]).position).toBe("absolute");
      expect(getComputedStyle(view.container.firstElementChild!).overflowX).toBe("visible");
      view.rerender(<div className="hk-chart-bars" tabIndex={0} />);
      expect(getComputedStyle(view.container.firstElementChild!).overflowX).toBe("auto");
    } finally { style.remove(); }
  });
  it.each([BarListCard, EarningsChartCard, FunnelChartCard, OrdersChartCard, RadarChartCard, RadialChartCard, StageBarsCard, StepsCard])("%s inspects with keyboard/pointer, resets, and keeps ranges host owned", Card => {
    const request = vi.fn();
    const data = [{ label: "Monday", value: 12.5, secondary: 8 }, { label: "Tuesday", value: 25 }];
    const fixture = (disabled = false, rows = data, range = "week") => <Card title="Inspect" value="Baseline" data={rows} range={range} ranges={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} onRangeChange={request} disabled={disabled} />;
    const view = render(fixture());
    const monday = screen.getByRole("button", { name: /Monday: 12.5/ });
    fireEvent.focus(monday);
    expect(screen.getByRole("status")).toHaveTextContent("Monday: 12.5 · Previous: 8");
    fireEvent.keyDown(monday, { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("Baseline");
    fireEvent.pointerDown(monday, { pointerType: "touch" });
    expect(screen.getByRole("status")).toHaveTextContent("Monday: 12.5");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "month" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("month");
    expect(screen.getByRole("combobox")).toHaveValue("week");
    view.rerender(fixture(false, data, "month"));
    expect(screen.getByRole("status")).toHaveTextContent("Baseline");
    fireEvent.focus(screen.getByRole("button", { name: /Monday: 12.5/ }));
    view.rerender(fixture(true));
    expect(screen.getByRole("status")).toHaveTextContent("Baseline");
    expect(screen.getByRole("button", { name: /Monday: 12.5/ })).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    fireEvent.pointerEnter(screen.getByRole("button", { name: /Monday: 12.5/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Baseline");
    view.rerender(fixture(false, []));
    expect(screen.getByText("No data")).toBeVisible();
  });

  it("loading and error suppress stale chart data and range changes", () => {
    const data = [{ label: "Old", value: 20 }];
    const view = render(<StepsCard title="Steps" data={data} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading data");
    expect(screen.queryByRole("button", { name: /Old/ })).toBeNull();
    view.rerender(<StepsCard title="Steps" data={data} error="Host unavailable" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Host unavailable");
    expect(view.container.querySelector(".hk-chart-bar")).toBeNull();
  });

  it("radar preserves missing axes instead of joining or rescaling around them", () => {
    const view = render(<RadarChartCard title="Metrics" data={[{ label: "A", value: .25 }, { label: "B", value: NaN }, { label: "C", value: .5 }]} />);
    expect(view.container.querySelector("polygon")).toBeNull();
    expect(screen.getByRole("button", { name: "B: Unavailable" })).toBeVisible();
    expect(view.container.querySelectorAll(".hk-chart-radar-point")).toHaveLength(2);
    expect(view.container.innerHTML).not.toMatch(/(?:NaN|Infinity)/);
  });

  it("radial shows every fractional metric and rejects out-of-domain percentages", () => {
    const view = render(<RadialChartCard title="Progress" data={[{ label: "A", value: .25 }, { label: "B", value: 70 }, { label: "Bad", value: 101 }, { label: "Negative", value: -1 }]} />);
    expect(view.container.querySelectorAll(".hk-chart-radial")).toHaveLength(2);
    expect(screen.getByText("0.25%")).toBeVisible();
    expect(screen.getByText("70%")).toBeVisible();
    expect(screen.getByRole("button", { name: "Bad: Unavailable" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Negative: Unavailable" })).toBeVisible();
  });

  it("stage and funnel treatments retain values while exposing icons and mono", () => {
    const data = [{ label: "Done", value: 20, icon: <span>✓</span>, color: "red" }];
    const view = render(<StageBarsCard title="Stages" data={data} mono showIcons={false} />);
    expect(screen.queryByText("✓")).toBeNull();
    expect(view.container.querySelector(".hk-chart-card")).toHaveAttribute("data-mono", "true");
    view.rerender(<StageBarsCard title="Stages" data={data} />);
    expect(screen.getByText("✓")).toBeVisible();
    view.rerender(<FunnelChartCard title="Stages" data={data} shape="sharp" />);
    expect(view.container.querySelector(".hk-chart-card")).toHaveAttribute("data-shape", "sharp");
  });

  it("bar lists expand without losing the full-list share denominator", () => {
    const view = render(<BarListCard title="Sources" display="share" limit={1} data={[{ label: "A", value: 25 }, { label: "B", value: 75 }]} />);
    expect(screen.getByText("25%")).toBeVisible();
    expect(screen.getByRole("button", { name: "A: 25 · 25%" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /B: 75/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show all 2" }));
    expect(screen.getByRole("button", { name: /B: 75/ })).toBeVisible();
    expect(screen.getByText("75%")).toBeVisible();
    expect(Array.from(view.container.querySelectorAll<HTMLElement>(".hk-chart-funnel-bar")).map(bar => bar.style.width)).toEqual(["33.33333333333333%", "100%"]);
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByRole("button", { name: /B: 75/ })).toBeNull();
    view.rerender(<BarListCard title="Sources" display="share" data={[{ label: "A", value: 0 }, { label: "B", value: NaN }]} />);
    expect(screen.queryByText("0%")).toBeNull();
    expect(screen.getAllByText("Share unavailable")).toHaveLength(2);
  });

  it("earnings exposes all host-defined periods and does not select a refused year", () => {
    const request = vi.fn();
    const ranges = ["Weekly", "Monthly", "Yearly"].map(label => ({ label, value: label }));
    const view = render(<EarningsChartCard title="Earnings" data={[{ label: "Sales", value: 5 }]} range="Weekly" ranges={ranges} onRangeChange={request} />);
    expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual(["Weekly", "Monthly", "Yearly"]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Yearly" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("Yearly");
    expect(screen.getByRole("combobox")).toHaveValue("Weekly");
    view.rerender(<EarningsChartCard title="Earnings" range="Weekly" ranges={ranges} />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("bar list tabs use native keyboard behavior and respect host refusal", () => {
    const request = vi.fn();
    const tabs = [{ value: "one", label: "One", data: [{ label: "A", value: 1 }] }, { value: "two", label: "Two", data: [{ label: "B", value: 2 }] }];
    const view = render(<BarListCard title="Lists" tabs={tabs} tab="one" onTabChange={request} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "One" }), { key: "ArrowRight" });
    expect(request).toHaveBeenCalledWith("two");
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "A: 1" })).toBeVisible();
    view.rerender(<BarListCard title="Lists" tabs={tabs} tab="two" onTabChange={request} />);
    expect(screen.getByRole("button", { name: "B: 2" })).toBeVisible();
    view.rerender(<BarListCard title="Lists" tabs={tabs} tab="two" onTabChange={request} disabled />);
    expect(screen.getByRole("tab", { name: "One" })).toBeDisabled();
  });

  it.each([OrdersChartCard, RevenueChartCard])("%s derives observed totals and refuses misleading deltas", Card => {
    const view = render(<Card title="Comparison" data={[{ label: "Jan", value: 10, secondary: 5 }, { label: "Feb", value: 20, secondary: 10 }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Current: 30 · Previous: 15 · Change: +100%");
    view.rerender(<Card title="Comparison" data={[{ label: "Jan", value: 10, secondary: 0 }, { label: "Feb", value: NaN }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Current observed: 10 · Previous observed: 0 · Change unavailable");
    view.rerender(<Card title="Comparison" data={[{ label: "Jan", value: Number.MAX_VALUE, secondary: 1 }, { label: "Feb", value: Number.MAX_VALUE, secondary: 2 }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Current: Unavailable");
    expect(screen.getByRole("status")).not.toHaveTextContent("Infinity");
  });
  it.each([StepsCard, EarningsChartCard])("%s keeps zero and fractional primary values proportional", Card => {
    const view = render(<Card title="Values" data={[{ label: "Zero", value: 0 }, { label: "Half", value: .25, secondary: 999 }, { label: "Full", value: .5 }]} />);
    expect(Array.from(view.container.querySelectorAll<HTMLElement>(".hk-chart-bar")).map(bar => bar.style.height)).toEqual(["0%", "50%", "100%"]);
    expect(screen.getByText("0.25")).toBeVisible();
  });

  it("bar scaling isolates invalid data and represents signed extremes without overflow", () => {
    const view = render(<OrdersChartCard title="Signed" data={[{ label: "Loss", value: -Number.MAX_VALUE }, { label: "Gain", value: Number.MAX_VALUE }, { label: "Unknown", value: NaN }]} />);
    const bars = Array.from(view.container.querySelectorAll<HTMLElement>(".hk-chart-bar"));
    expect(bars.map(bar => bar.style.height)).toEqual(["50%", "50%"]);
    expect(bars.map(bar => bar.style.bottom)).toEqual(["0%", "50%"]);
    expect(screen.getByText("Unavailable")).toBeVisible();
    view.rerender(<OrdersChartCard title="Tiny" data={[{ label: "Small", value: Number.MIN_VALUE }, { label: "Larger", value: Number.MIN_VALUE * 2 }]} />);
    expect(Array.from(view.container.querySelectorAll<HTMLElement>(".hk-chart-bar")).map(bar => bar.style.height)).toEqual(["50%", "100%"]);
  });

  it("empty, all-zero and invalid bars are distinguishable", () => {
    const view = render(<StepsCard title="Steps" />);
    expect(screen.getByText("No data")).toBeVisible();
    view.rerender(<StepsCard title="Steps" data={[{ label: "Mon", value: 0 }, { label: "Tue", value: 0 }]} />);
    expect(view.container.querySelectorAll('.hk-chart-bar[style*="height: 0%"]')).toHaveLength(2);
    expect(screen.queryByText("No data")).toBeNull();
    view.rerender(<StepsCard title="Steps" data={[{ label: "Missing", value: Infinity }]} />);
    expect(view.container.querySelectorAll(".hk-chart-bar")).toHaveLength(0);
    expect(screen.getByText("Unavailable")).toBeVisible();
  });

  it("funnel retains all stages and labels without inventing area for zero or invalid values", () => {
    const data = Array.from({ length: 8 }, (_, index) => ({ label: `Stage ${index}`, value: index / 10, secondary: 900 }));
    data.push({ label: "Invalid", value: -1, secondary: 900 });
    const view = render(<FunnelChartCard title="Stages" data={data} />);
    const stages = Array.from(view.container.querySelectorAll(".hk-chart-funnel-shape path"));
    expect(stages).toHaveLength(8);
    expect(stages[0]).toHaveAttribute("d", "M100 0 H100 C100 18 100 18 100 36 H100 C100 18 100 18 100 0 Z");
    expect(stages[7].getAttribute("d")).toMatch(/^M0 0 H200 /);
    expect(screen.getByText("Stage 7")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
  });

  it("activity rings independently represent zero, partial and over-target values", () => {
    const view = render(<ActivityRingsCard title="Activity" rings={[{ id: "move", label: "Move", value: 0, target: 100 }, { id: "exercise", label: "Exercise", value: 15, target: 30 }, { id: "run", label: "Running", value: 15, target: 10, unit: "km" }]} />);
    const arcs = view.container.querySelectorAll(".hk-activity-ring-value");
    expect(arcs).toHaveLength(3);
    expect(arcs[0]).toHaveAttribute("stroke-dasharray", "0 100");
    expect(arcs[1]).toHaveAttribute("stroke-dasharray", "50 100");
    expect(arcs[2]).toHaveAttribute("stroke-dasharray", "100 100");
    expect(screen.getByRole("button", { name: /Running/ })).toHaveTextContent("15 / 10 km");
    expect(screen.getByRole("button", { name: /Running/ })).toHaveTextContent("150%");
  });

  it("invalid rings do not render fabricated arcs and duplicate identities are rejected", () => {
    const view = render(<ActivityRingsCard title="Invalid" rings={[{ id: "zero", label: "Zero target", value: 3, target: 0 }, { id: "nan", label: "Missing", value: NaN, target: 5 }, { id: "negative", label: "Negative", value: -1, target: 4 }]} />);
    expect(view.container.querySelectorAll(".hk-activity-ring-value")).toHaveLength(0);
    expect(screen.getByText("No valid activity metrics.")).toBeVisible();
    view.rerender(<ActivityRingsCard title="Invalid" rings={[{ id: "same", label: "A", value: 1, target: 2 }, { id: "same", label: "B", value: 1, target: 2 }]} />);
    expect(screen.getByText("Ring IDs must be unique and non-empty.")).toBeVisible();
    expect(view.container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("ring inspection survives metric updates by identity but never removed or disabled metrics", () => {
    const fixture = (amount: number, disabled = false, present = true) => <ActivityRingsCard title="Activity" disabled={disabled} rings={present ? [{ id: "move", label: "Move", value: amount, target: 100, unit: "kcal" }] : []} calendar={<button>Host day control</button>} />;
    const view = render(fixture(25));
    fireEvent.focus(screen.getByRole("button", { name: /Move/ }));
    expect(screen.getByRole("status")).toHaveTextContent("25 / 100 kcal");
    view.rerender(fixture(50));
    expect(screen.getByRole("status")).toHaveTextContent("50 / 100 kcal");
    fireEvent.keyDown(screen.getByRole("button", { name: /Move/ }), { key: "Escape" });
    expect(screen.getByRole("status")).not.toHaveTextContent("50 / 100");
    view.rerender(fixture(50, true));
    expect(screen.getByRole("button", { name: /Move/ })).toBeDisabled();
    view.rerender(fixture(50, false, false));
    expect(screen.getByRole("status")).not.toHaveTextContent("Move");
    expect(screen.getByRole("button", { name: "Host day control" })).toBeVisible();
  });
  it("renders named card variants from host-fed data", () => {
    render(<><AreaChartCard title="Usage" value="82%" data={[{ label: "Mon", value: 10 }]} /><RevenueChartCard title="Revenue" data={[{ label: "Jan", value: 30 }]} /></>);
    expect(screen.getByText("Usage")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByLabelText("Usage chart")).toBeInTheDocument();
  });

  it("uses chart-specific anatomy instead of one generic bar presentation", () => {
    render(<><RadialChartCard title="Completion" data={[{ label: "Done", value: 8 }]} /><ScatterChartCard title="Latency" series={[{ label: "Requests", points: [{ label: "p50", x: 50, y: 4 }, { label: "p95", x: 95, y: 9 }] }]} /></>);
    expect(screen.getByRole("img", { name: "Completion chart" })).toHaveClass("hk-chart-radial");
    expect(screen.getByRole("group", { name: "Latency chart" }).querySelectorAll("circle")).toHaveLength(2);
  });

  it("handles invalid data without inventing values", () => {
    render(<><HeatmapChartCard title="Empty" /><FunnelChartCard title="Steps" data={[{ label: "Start", value: 100 }, { label: "Done", value: 20 }]} /><RadarChartCard title="Health" data={[{ label: "A", value: 1 }, { label: "B", value: 2 }]} /></>);
    expect(screen.getByText("No matrix data supplied.")).toBeVisible();
    expect(screen.getByRole("group", { name: "Steps chart" })).toHaveTextContent("Start");
    expect(screen.getByRole("img", { name: "Health chart" }).querySelector("polygon")).toBeTruthy();
  });

  it("renders flows as source and destination nodes", () => {
    render(<SankeyChartCard title="Work routing" nodes={[{ name: "Hermes" }, { name: "Result" }]} links={[{ source: "Hermes", target: "Result", value: 8 }]} />);
    expect(screen.getByRole("img", { name: "Work routing chart" })).toHaveTextContent("Hermes");
    expect(screen.getByRole("button", { name: /Hermes → Result/ })).toHaveTextContent("8");
  });

  it("heatmap preserves two axes, zero and missing cells with actual values", () => {
    render(<HeatmapChartCard title="Activity" columns={["Morning", "Evening"]} rows={[{ label: "Mon", values: [0, null] }, { label: "Tue", values: [5, 10] }]} />);
    expect(screen.getAllByRole("columnheader").map(header => header.textContent)).toEqual(["Series", "Morning", "Evening"]);
    expect(screen.getAllByRole("rowheader").map(header => header.textContent)).toEqual(["Mon", "Tue"]);
    expect(screen.getByRole("button", { name: "Mon · Morning: 0" })).toHaveAttribute("data-intensity", "0");
    expect(screen.getByRole("button", { name: "Mon · Evening: No data" })).toHaveTextContent("—");
    expect(screen.getByRole("status")).toHaveTextContent("Observed total: 15 · 1 missing");
    expect(screen.getByRole("button", { name: "Tue · Evening: 10" })).toHaveAttribute("data-intensity", "1");
  });

  it("heatmap synchronizes inspection and axes, restores headline on Escape and honors host control", () => {
    const request = vi.fn();
    render(<HeatmapChartCard title="Activity" value="Baseline" delta="Up 5%" columns={["AM", "PM"]} rows={[{ label: "Mon", values: [5, 10] }]} range="week" ranges={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} onRangeChange={request} />);
    fireEvent.focus(screen.getByRole("button", { name: "Mon · PM: 10" }));
    expect(screen.getByRole("status")).toHaveTextContent("Mon · PM: 10");
    expect(screen.getByRole("columnheader", { name: "PM" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("rowheader", { name: "Mon" })).toHaveAttribute("data-active", "true");
    fireEvent.keyDown(screen.getByRole("button", { name: "Mon · PM: 10" }), { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("Baseline");
    expect(screen.getByText("Up 5%")).toBeVisible();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "month" } });
    expect(request).toHaveBeenCalledWith("month");
    expect(screen.getByRole("combobox")).toHaveValue("week");
  });

  it("heatmap ceiling clamps color but not values, rejects invalid shapes and numbers", () => {
    const view = render(<HeatmapChartCard title="Activity" max={5} color="teal" columns={["AM"]} rows={[{ label: "Mon", values: [10] }]} />);
    expect(screen.getByRole("button", { name: "Mon · AM: 10" })).toHaveAttribute("data-intensity", "1");
    for (const values of [[NaN], [-1], [Infinity], [], new Array(1)]) {
      view.rerender(<HeatmapChartCard title="Invalid" columns={["AM"]} rows={[{ label: "Mon", values }]} />);
      expect(screen.getByRole("alert")).toBeVisible();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    }
    view.rerender(<HeatmapChartCard title="Invalid" columns={["AM", "AM"]} rows={[{ label: "Mon", values: [1, 2] }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("unique");
    view.rerender(<HeatmapChartCard title="Invalid" columns={["AM"]} rows={[{ label: "Mon", values: [1] }]} max={0} />);
    expect(screen.getByRole("alert")).toHaveTextContent("ceiling");
  });

  it("heatmap clears removed selections, guards disabled input and sum overflow", () => {
    const view = render(<HeatmapChartCard title="Matrix" columns={["AM"]} rows={[{ label: "Mon", values: [10] }]} />);
    fireEvent.pointerEnter(screen.getByRole("button"));
    expect(screen.getByRole("status")).toHaveTextContent("Mon · AM");
    view.rerender(<HeatmapChartCard title="Matrix" disabled columns={["AM"]} rows={[{ label: "Tue", values: [0] }]} />);
    expect(screen.getByRole("button")).toBeDisabled();
    fireEvent.focus(screen.getByRole("button"));
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(screen.getByRole("status")).toHaveTextContent("Total: 0");
    view.rerender(<HeatmapChartCard title="Matrix" columns={["AM", "PM"]} rows={[{ label: "Tue", values: [Number.MAX_VALUE, Number.MAX_VALUE] }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("numeric range");
  });

  it("heatmap restores keyboard inspection after a different pointer inspection", () => {
    render(<HeatmapChartCard title="Matrix" columns={["AM", "PM"]} rows={[{ label: "Mon", values: [5, 10] }]} />);
    fireEvent.focus(screen.getByRole("button", { name: "Mon · AM: 5" }));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mon · PM: 10" }));
    expect(screen.getByRole("status")).toHaveTextContent("Mon · PM: 10");
    fireEvent.pointerLeave(screen.getByRole("region"), { pointerType: "mouse" });
    expect(screen.getByRole("status")).toHaveTextContent("Mon · AM: 5");
  });

  it("heatmap never presents all-missing observations as measured zero", () => {
    render(<HeatmapChartCard title="Missing" columns={["AM"]} rows={[{ label: "Mon", values: [null] }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No observations supplied.");
    expect(screen.getByRole("button")).toHaveTextContent("—");
  });

  it("Sankey link width encodes supplied weight and total excludes intermediate double-counting", () => {
    const view = render(<SankeyChartCard title="Flow" nodes={[{ name: "Income" }, { name: "Budget" }, { name: "Home" }, { name: "Savings" }]} links={[{ source: 0, target: 1, value: 100 }, { source: 1, target: 2, value: 75 }, { source: 1, target: 3, value: 25 }]} />);
    const paths = view.container.querySelectorAll(".hk-sankey-link");
    expect(paths).toHaveLength(3);
    expect(Number(paths[1].getAttribute("stroke-width")) / Number(paths[2].getAttribute("stroke-width"))).toBeCloseTo(3);
    expect(screen.getByRole("status")).toHaveTextContent("Source total: 100");
    expect(screen.getByRole("button", { name: /Savings · In/ })).toHaveTextContent("25%");
  });

  it("Sankey reserves intermediate lanes for links spanning columns", () => {
    const view = render(<SankeyChartCard title="Branches" nodes={[{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }, { name: "E" }]} links={[{ source: "A", target: "C", value: 100 }, { source: "B", target: "D", value: 1 }, { source: "D", target: "E", value: 1 }]} />);
    const spanning = view.container.querySelector(".hk-sankey-link")!;
    expect(spanning.getAttribute("d")?.match(/C/g)).toHaveLength(2);
    const intermediate = view.container.querySelectorAll(".hk-sankey rect")[3];
    const routeY = Number(spanning.getAttribute("d")?.match(/C[^C]*? ([\d.]+) H/)?.[1]);
    const top = Number(intermediate.getAttribute("y"));
    const bottom = top + Number(intermediate.getAttribute("height"));
    const radius = Number(spanning.getAttribute("stroke-width")) / 2;
    expect(routeY + radius <= top || routeY - radius >= bottom).toBe(true);
  });

  it("Sankey explicitly rejects mixed magnitudes that erase positive flows", () => {
    render(<SankeyChartCard title="Underflow" nodes={[{ name: "A" }, { name: "B" }, { name: "C" }]} links={[{ source: "A", target: "C", value: Number.MIN_VALUE }, { source: "B", target: "C", value: 2 }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("numeric range");
  });

  it("Sankey rejects cycles, missing endpoints and invalid values instead of inventing flow", () => {
    const nodes = [{ name: "A" }, { name: "B" }];
    for (const links of [[{ source: "A", target: "missing", value: 5 }], [{ source: "A", target: "B", value: -1 }], [{ source: "A", target: "B", value: NaN }], [{ source: "A", target: "B", value: 2 }, { source: "B", target: "A", value: 1 }]]) {
      const view = render(<SankeyChartCard title="Invalid" nodes={nodes} links={links} />);
      expect(screen.getByRole("alert")).toBeVisible();
      expect(view.container.querySelectorAll(".hk-sankey-link")).toHaveLength(0);
      view.unmount();
    }
  });

  it("Sankey zero flow remains zero and node/link inspection is keyboard accessible", () => {
    const request = vi.fn();
    const nodes = [{ name: "A" }, { name: "B" }];
    const view = render(<SankeyChartCard title="Flow" nodes={nodes} links={[{ source: 0, target: 1, value: 10 }]} range="month" ranges={[{ label: "Month", value: "month" }, { label: "Week", value: "week" }]} onRangeChange={request} />);
    fireEvent.focus(screen.getByRole("button", { name: /A → B/ }));
    expect(screen.getByRole("status")).toHaveTextContent("A → B: 10");
    fireEvent.keyDown(screen.getByRole("button", { name: /A → B/ }), { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("Source total: 10");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "week" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("week");
    expect(screen.getByRole("combobox")).toHaveValue("month");
    view.rerender(<SankeyChartCard title="Flow" nodes={nodes} links={[{ source: 0, target: 1, value: 0 }]} />);
    expect(view.container.querySelectorAll(".hk-sankey-link")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("Source total: 0");
  });

  it("Sankey guards overflow and disabled controls, preserving tiny positive values", () => {
    const nodes = [{ name: "A" }, { name: "B" }];
    const view = render(<SankeyChartCard title="Tiny" nodes={nodes} links={[{ source: 0, target: 1, value: Number.MIN_VALUE }]} />);
    expect(view.container.querySelector(".hk-sankey-link")).toHaveAttribute("stroke-width", "240");
    const request = vi.fn();
    view.rerender(<SankeyChartCard title="Tiny" disabled nodes={nodes} links={[{ source: 0, target: 1, value: 10 }]} ranges={[{ value: "week", label: "Week" }]} range="week" onRangeChange={request} />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    fireEvent.pointerEnter(view.container.querySelector(".hk-sankey-link")!);
    expect(screen.getByRole("status")).toHaveTextContent("Source total: 10");
    view.rerender(<SankeyChartCard title="Overflow" nodes={nodes} links={[{ source: 0, target: 1, value: Number.MAX_VALUE }, { source: 0, target: 1, value: Number.MAX_VALUE }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("numeric range");
    expect(view.container.querySelectorAll(".hk-sankey-link")).toHaveLength(0);
  });

  it("scatter uses coordinates rather than array order and scales bubble area", () => {
    render(<ScatterChartCard title="Coordinates" series={[{ label: "A", points: [{ label: "right", x: 100, y: -10, z: 16 }, { label: "left", x: -100, y: 10, z: 4 }, { label: "center", x: 0, y: 0, z: 0 }] }]} />);
    const [right, left, center] = screen.getByRole("group", { name: "Coordinates chart" }).querySelectorAll("circle");
    expect(Number(right.getAttribute("cx"))).toBeGreaterThan(Number(left.getAttribute("cx")));
    expect(Number(right.getAttribute("cy"))).toBeGreaterThan(Number(left.getAttribute("cy")));
    expect(Number(center.getAttribute("cx"))).toBe((Number(right.getAttribute("cx")) + Number(left.getAttribute("cx"))) / 2);
    expect(Number(right.getAttribute("r"))).toBeGreaterThan(Number(left.getAttribute("r")));
    expect(Number(center.getAttribute("r"))).toBeGreaterThan(0);
  });

  it("scatter rejects invalid points, handles constant domains and supports uniform dots", () => {
    const view = render(<ScatterChartCard title="Values" bubble={false} series={[{ label: "A", points: [{ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 20 }, { x: NaN, y: 2 }, { x: 1, y: Infinity }, { x: 1, y: 1, z: -1 }] }]} />);
    const circles = screen.getByRole("group", { name: "Values chart" }).querySelectorAll("circle");
    expect(circles).toHaveLength(2);
    expect(circles[0].getAttribute("cx")).toBe(circles[1].getAttribute("cx"));
    expect(circles[0].getAttribute("r")).toBe(circles[1].getAttribute("r"));
    expect(view.container.innerHTML).not.toMatch(/="(?:NaN|Infinity)"/);
    view.rerender(<ScatterChartCard title="Values" series={[]} />);
    expect(screen.getByText("No valid observations.")).toBeVisible();
  });

  it("scatter inspection follows focus and clears on escape; range remains host owned", () => {
    const request = vi.fn();
    render(<ScatterChartCard title="Inspect" range="month" ranges={[{ value: "month", label: "Month" }, { value: "year", label: "Year" }]} onRangeChange={request} axisLabels={{ x: "Risk", y: "Return" }} series={[{ label: "A", points: [{ label: "Alpha", x: 4, y: 8 }] }]} />);
    fireEvent.focus(screen.getByRole("img", { name: /Alpha/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Alpha");
    expect(screen.getByRole("status")).toHaveTextContent("Risk: 4");
    fireEvent.keyDown(screen.getByRole("img", { name: /Alpha/ }), { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("1 observation");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "year" } });
    expect(request).toHaveBeenCalledExactlyOnceWith("year");
    expect(screen.getByRole("combobox")).toHaveValue("month");
  });

  it("scatter retains finite geometry for extreme and subnormal coordinates", () => {
    for (const values of [[-Number.MAX_VALUE, Number.MAX_VALUE], [0, Number.MIN_VALUE]]) {
      const view = render(<ScatterChartCard title="Extremes" series={[{ label: "A", points: values.map(value => ({ x: value, y: value })) }]} />);
      expect(view.container.querySelectorAll("circle")).toHaveLength(2);
      for (const circle of view.container.querySelectorAll("circle")) for (const attribute of ["cx", "cy", "r"]) expect(Number.isFinite(Number(circle.getAttribute(attribute)))).toBe(true);
      view.unmount();
    }
  });

  it("disabled scatter suppresses inspection and range requests; removed points clear inspection", () => {
    const request = vi.fn();
    const series = [{ label: "A", points: [{ label: "Alpha", x: 1, y: 2 }] }];
    const fixture = (disabled: boolean, present = true) => <ScatterChartCard title="Safety" disabled={disabled} series={present ? series : []} ranges={[{ label: "Week", value: "week" }]} range="week" onRangeChange={request} />;
    const view = render(fixture(false));
    fireEvent.focus(screen.getByRole("img", { name: /Alpha/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Alpha");
    view.rerender(fixture(true));
    expect(screen.getByRole("status")).not.toHaveTextContent("Alpha");
    expect(screen.getByRole("img", { name: /Alpha/ })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("combobox")).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "week" } });
    expect(request).not.toHaveBeenCalled();
    view.rerender(fixture(false, false));
    expect(screen.getByRole("status")).toHaveTextContent("0 observations");
  });
});
