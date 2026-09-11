import { StrictMode, createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentProgress } from "./agent-progress";

afterEach(() => vi.useRealTimers());
const steps = ["Inspect input", "Build response"];
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));

describe("AgentProgress", () => {
  it.each([
    { stepDuration: Number.MAX_VALUE, completionDelay: 0 },
    { stepDuration: Number.MAX_VALUE / 2, completionDelay: Number.MAX_VALUE },
  ])("rejects finite timing inputs whose computed duration overflows: %o", timing => {
    vi.useFakeTimers();
    const onFinished = vi.fn();
    render(<AgentProgress steps={steps} playback="timed" {...timing} onFinished={onFinished} />);
    expect(screen.getByRole("status")).toHaveTextContent("Progress unavailable");
    expect(vi.getTimerCount()).toBe(0);
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("keeps demo progression monotonic when the wall clock moves backwards", () => {
    vi.useFakeTimers();
    render(<AgentProgress steps={steps} playback="timed" stepDuration={100} />);
    advance(50);
    vi.setSystemTime(Date.now() - 100000);
    advance(50);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("data-state", "active");
  });

  it("preserves the old ol API and never invents host advancement", () => {
    vi.useFakeTimers();
    const ref = createRef<HTMLOListElement>();
    const onFinished = vi.fn();
    render(<AgentProgress steps={steps} ref={ref} className="consumer" onFinished={onFinished} />);
    expect(ref.current).toHaveClass("hk-agent-progress", "consumer");
    expect(screen.getByText("Inspect input")).toHaveClass("hk-agent-progress-label");
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    advance(100000);
    expect(screen.getByRole("status")).toHaveTextContent("2 steps left");
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("uses exact host completion and actual active-step fractions", () => {
    const view = render(<AgentProgress steps={steps} current={1} progress={0.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("data-state", "complete");
    view.rerender(<AgentProgress steps={steps} current={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("All steps complete");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it.each([NaN, Infinity, -Infinity, -1, 0.5, 3])("rejects invalid current %s without false completion", current => {
    render(<AgentProgress steps={steps} current={current} />);
    expect(screen.getByRole("status")).toHaveTextContent("Progress unavailable");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem").every(item => item.dataset.state === "pending")).toBe(true);
  });

  it.each([NaN, Infinity, -0.1, 1.1])("rejects invalid progress %s", progress => {
    render(<AgentProgress steps={steps} progress={progress} />);
    expect(screen.getByRole("status")).toHaveTextContent("Progress unavailable");
  });

  it("honors controlled disclosure refusal and preserves hidden list identity", () => {
    const onExpandedChange = vi.fn();
    const view = render(<AgentProgress steps={steps} expanded onExpandedChange={onExpandedChange} />);
    const list = screen.getByRole("list");
    fireEvent.click(screen.getByRole("button"));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(list).toBeVisible();
    view.rerender(<AgentProgress steps={steps} expanded={false} current={1} />);
    expect(list).not.toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("1 step left");
    view.rerender(<AgentProgress steps={steps} expanded current={1} />);
    expect(screen.getByRole("list")).toBe(list);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");
  });

  it("toggles uncontrolled disclosure and links it accessibly", () => {
    render(<AgentProgress steps={steps} defaultExpanded={false} />);
    const button = screen.getByRole("button", { name: /show steps/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("list").id).toBe(button.getAttribute("aria-controls"));
  });

  it("represents empty, loading, error, disabled, and paused independently", () => {
    const view = render(<AgentProgress steps={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No steps supplied");
    view.rerender(<AgentProgress steps={steps} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading steps");
    view.rerender(<AgentProgress steps={steps} error="Stream disconnected" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Stream disconnected");
    view.rerender(<AgentProgress steps={steps} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Progress disabled");
    view.rerender(<AgentProgress steps={steps} paused />);
    expect(screen.getByRole("status")).toHaveTextContent("Paused");
  });

  it("runs explicit demo while minimized and finishes once after the delay", () => {
    vi.useFakeTimers();
    const onFinished = vi.fn();
    const view = render(<StrictMode><AgentProgress steps={steps} playback="timed" stepDuration={100} completionDelay={100} onFinished={onFinished} /></StrictMode>);
    advance(100);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("data-state", "active");
    fireEvent.click(screen.getByRole("button"));
    advance(100);
    expect(screen.getByRole("status")).toHaveTextContent("Demo complete");
    expect(onFinished).not.toHaveBeenCalled();
    advance(100);
    expect(onFinished).toHaveBeenCalledTimes(1);
    advance(1000);
    expect(onFinished).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["paused", "disabled", "loading", "error"] as const)("suspends demo under %s without losing elapsed progress", state => {
    vi.useFakeTimers();
    const props = { steps, playback: "timed" as const, stepDuration: 100, completionDelay: 100 };
    const view = render(<AgentProgress {...props} />);
    advance(50);
    view.rerender(<AgentProgress {...props} {...{ [state]: state === "error" ? "Offline" : true }} />);
    advance(1000);
    view.rerender(<AgentProgress {...props} />);
    advance(50);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("data-state", "active");
  });

  it("resets on run identity/content/current and cancels stale completion", () => {
    vi.useFakeTimers();
    const onFinished = vi.fn();
    const props = { steps, playback: "timed" as const, stepDuration: 100, completionDelay: 100, onFinished };
    const view = render(<AgentProgress {...props} />);
    advance(250);
    view.rerender(<AgentProgress {...props} runId="new" />);
    advance(50);
    expect(onFinished).not.toHaveBeenCalled();
    view.rerender(<AgentProgress {...props} runId="new" steps={[...steps]} />);
    advance(250);
    expect(onFinished).toHaveBeenCalledTimes(1);
    view.rerender(<AgentProgress {...props} runId="new" steps={["Different"]} />);
    advance(200);
    expect(onFinished).toHaveBeenCalledTimes(2);
    view.rerender(<AgentProgress {...props} current={1} />);
    advance(200);
    expect(onFinished).toHaveBeenCalledTimes(3);
  });

  it("uses the latest callback without restarting and cancels on host switch", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const latest = vi.fn();
    const props = { steps, playback: "timed" as const, stepDuration: 100, completionDelay: 100 };
    const view = render(<AgentProgress {...props} onFinished={first} />);
    advance(200);
    view.rerender(<AgentProgress {...props} onFinished={latest} />);
    advance(100);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    view.rerender(<AgentProgress {...props} runId="next" onFinished={latest} />);
    advance(200);
    view.rerender(<AgentProgress {...props} playback="host" onFinished={latest} />);
    advance(1000);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("2 steps left");
  });
});
