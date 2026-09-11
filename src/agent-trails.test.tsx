import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskList, WebSearch } from "./agent-surfaces";

vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion)", addEventListener() {}, removeEventListener() {} }));

const tasks = [{ id: "read", label: "Inspect", status: "running" as const, steps: [{ label: "Read", chips: [{ label: "page.tsx" }] }, { label: "Compare" }] }, { id: "write", label: "Summarize", steps: [{ label: "Draft" }] }];
const sources = Array.from({ length: 8 }, (_, index) => ({ title: `Reference ${index}`, domain: "example.com", href: `https://example.com/${index}`, brand: "github" }));
const steps = [{ label: "Search docs", query: "theme tokens", dwell: 200, sources }, { label: "Read page", brand: "github" }];
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("agent trails", () => {
  it.each(["TaskList", "WebSearch"])("preserves %s pending deadlines while tails keep arriving", component => {
    vi.useFakeTimers(); let tail = 0;
    const tree = () => component === "TaskList" ? <TaskList tasks={[{ id: "first", label: "First", steps: [{ label: "Read" }] }, ...Array.from({ length: tail }, (_, index) => ({ id: `tail-${index}`, label: `Tail ${index}`, steps: [] }))]} startDelay={200} stepInterval={200} /> : <WebSearch steps={[{ label: "First" }, { label: "Read" }, ...Array.from({ length: tail }, (_, index) => ({ label: `Tail ${index}` }))]} startDelay={200} stepInterval={200} />;
    const view = render(tree());
    for (let append = 0; append < 2; append++) { act(() => vi.advanceTimersByTime(90)); tail++; view.rerender(tree()); }
    act(() => vi.advanceTimersByTime(19)); expect(screen.queryByText("First")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByText("First")).toBeVisible();
    for (let append = 0; append < 2; append++) { act(() => vi.advanceTimersByTime(90)); tail++; view.rerender(tree()); }
    act(() => vi.advanceTimersByTime(19)); expect(screen.queryByText("Read")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByText("Read")).toBeVisible();
  });

  it("keeps already revealed timed search rows mounted when late sources insert ahead of them", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const first = [{ label: "Search first" }, { label: "Read second" }];
    const view = render(<WebSearch steps={first} startDelay={0} stepInterval={500} onComplete={complete} />);
    act(() => vi.advanceTimersByTime(0)); act(() => vi.advanceTimersByTime(500));
    const second = screen.getByText("Read second").closest("li"); expect(complete).toHaveBeenCalledOnce();
    view.rerender(<WebSearch steps={[{ label: "Search first", sources: [{ title: "Late source", domain: "example.com" }] }, first[1]]} startDelay={0} stepInterval={500} onComplete={complete} />);
    expect(screen.getByText("Read second").closest("li")).toBe(second); expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(499)); expect(screen.getByText("Read second")).toBeVisible(); expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByText("Sources")).toBeVisible(); expect(screen.getByText("Read second").closest("li")).toBe(second); expect(complete).toHaveBeenCalledOnce();
  });

  it("keeps controlled revealed authoritative when sources insert before another row", () => {
    vi.useFakeTimers(); const first = [{ label: "Search first" }, { label: "Read second" }];
    const view = render(<WebSearch steps={first} revealed={2} />); expect(screen.getByText("Read second")).toBeVisible();
    view.rerender(<WebSearch steps={[{ label: "Search first", sources: [{ title: "Late source", domain: "example.com" }] }, first[1]]} revealed={2} />);
    expect(screen.getByText("Sources")).toBeVisible(); expect(screen.queryByText("Read second")).not.toBeInTheDocument(); expect(vi.getTimerCount()).toBe(0);
  });

  it("retains revealed rows and manual disclosure on live append; only a host key restarts the run", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const first = [{ id: "read", label: "Inspect", steps: [{ label: "Read" }, { label: "Compare" }] }];
    const view = render(<TaskList key="turn-one" tasks={first} startDelay={100} stepInterval={50} onComplete={complete} />);
    act(() => vi.advanceTimersByTime(100)); act(() => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getByText("Inspect")); const disclosure = screen.getByText("Inspect").closest("details")!; expect(disclosure.open).toBe(false);
    view.rerender(<TaskList key="turn-one" tasks={[...first, { id: "append", label: "Appended", steps: [{ label: "Tail" }] }]} startDelay={100} stepInterval={50} onComplete={complete} />);
    expect(screen.getByText("Inspect").closest("details")).toBe(disclosure); expect(disclosure.open).toBe(false); expect(screen.getByText("Read")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(50)); expect(screen.getByText("Compare")).toBeInTheDocument(); expect(screen.queryByText("Appended")).not.toBeInTheDocument(); expect(complete).not.toHaveBeenCalled();
    view.rerender(<TaskList key="turn-two" tasks={first} startDelay={100} stepInterval={50} onComplete={complete} />); expect(screen.queryByText("Inspect")).not.toBeInTheDocument();
  });

  it("retains search rows and completion latch across content edits and source append", () => {
    const complete = vi.fn(); const first = [{ label: "Search", sources: [{ title: "First", domain: "example.com" }] }];
    const view = render(<WebSearch steps={first} revealed={2} onComplete={complete} />);
    const row = screen.getByText("Search").closest("li"); expect(complete).toHaveBeenCalledOnce();
    view.rerender(<WebSearch steps={[{ ...first[0], sources: [...first[0].sources, { title: "Second", domain: "example.org" }] }]} revealed={2} onComplete={complete} />);
    expect(screen.getByText("Search").closest("li")).toBe(row); expect(complete).toHaveBeenCalledOnce(); expect(screen.getByLabelText("Second · example.org")).toBeInTheDocument();
  });

  it("resumes from the last controlled count and replaces pending timing configuration", () => {
    vi.useFakeTimers();
    const view = render(<TaskList tasks={tasks} revealed={2} stepInterval={50} />);
    view.rerender(<TaskList tasks={tasks} stepInterval={50} />);
    act(() => vi.advanceTimersByTime(40)); expect(screen.queryByText("Compare")).not.toBeInTheDocument();
    view.rerender(<TaskList tasks={tasks} stepInterval={500} />);
    act(() => vi.advanceTimersByTime(499)); expect(screen.queryByText("Compare")).not.toBeInTheDocument(); expect(screen.getByText("Read")).toBeVisible();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByText("Compare")).toBeVisible();
  });

  it("does not count empty source collections as an additional row", () => {
    const complete = vi.fn(); render(<WebSearch steps={[{ label: "Nothing found", sources: [] }, { label: "Read notes" }]} revealed={2} onComplete={complete} />);
    expect(screen.queryByText("Sources")).not.toBeInTheDocument(); expect(screen.getByText("Read notes")).toBeVisible(); expect(complete).toHaveBeenCalledOnce();
  });

  it("counts task headers and steps, never advances controlled events, and completes once", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const view = render(<TaskList tasks={tasks} revealed={1} onComplete={complete} />);
    expect(screen.getByText("Inspect")).toBeVisible(); expect(screen.queryByText("Read")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10000)); expect(screen.queryByText("Read")).not.toBeInTheDocument();
    view.rerender(<TaskList tasks={tasks} revealed={2} onComplete={complete} />);
    expect(screen.getByText("page.tsx")).toBeVisible(); expect(screen.queryByText("Summarize")).not.toBeInTheDocument();
    view.rerender(<TaskList tasks={tasks} revealed={4} onComplete={complete} />);
    expect(screen.getByText("Summarize")).toBeVisible(); expect(screen.queryByText("Draft")).not.toBeInTheDocument(); expect(complete).not.toHaveBeenCalled();
    view.rerender(<TaskList tasks={tasks} revealed={5} onComplete={complete} />);
    expect(screen.getByText("Draft")).toBeVisible(); expect(complete).toHaveBeenCalledTimes(1);
    view.rerender(<TaskList tasks={tasks} revealed={50} onComplete={complete} />); expect(complete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Inspect").closest("li")).toHaveAttribute("data-status", "running");
  });

  it("paces detailed inputs, cancels on mode/config/disabled/unmount, and keeps legacy callers immediate", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const view = render(<TaskList tasks={tasks} startDelay={100} stepInterval={50} onComplete={complete} />);
    expect(screen.queryByText("Inspect")).not.toBeInTheDocument(); act(() => vi.advanceTimersByTime(100)); expect(screen.getByText("Inspect")).toBeVisible();
    act(() => vi.advanceTimersByTime(50)); expect(screen.getByText("Read")).toBeVisible();
    view.rerender(<TaskList tasks={tasks} revealed={0} onComplete={complete} />); act(() => vi.advanceTimersByTime(10000)); expect(screen.queryByText("Inspect")).not.toBeInTheDocument();
    view.rerender(<TaskList tasks={tasks} startDelay={100} disabled onComplete={complete} />); expect(vi.getTimerCount()).toBe(0);
    view.rerender(<TaskList tasks={tasks} startDelay={100} onComplete={complete} />);
    view.rerender(<TaskList tasks={[{ id: "new", label: "New run", steps: [{ label: "New step" }] }]} startDelay={500} onComplete={complete} />);
    act(() => vi.advanceTimersByTime(100)); expect(screen.queryByText("New run")).not.toBeInTheDocument();
    view.unmount(); expect(vi.getTimerCount()).toBe(0); expect(complete).not.toHaveBeenCalled();
    render(<TaskList tasks={[{ id: "simple", label: "Simple", status: "complete" }]} />); expect(screen.getByText("Simple")).toBeVisible(); expect(vi.getTimerCount()).toBe(0);
  });

  it.each([true, "all"] as const)("collapses at the %s boundary but allows retained manual disclosure", collapseOnComplete => {
    const view = render(<TaskList tasks={tasks} revealed={2} collapseOnComplete={collapseOnComplete} />);
    const details = screen.getByText("Inspect").closest("details")!;
    expect(details.open).toBe(true);
    view.rerender(<TaskList tasks={tasks} revealed={3} collapseOnComplete={collapseOnComplete} />);
    expect(details.open).toBe(collapseOnComplete === "all");
    view.rerender(<TaskList tasks={tasks} revealed={5} collapseOnComplete={collapseOnComplete} />); expect(details.open).toBe(false);
    fireEvent.click(screen.getByText("Inspect")); expect(details.open).toBe(true);
    view.rerender(<TaskList tasks={tasks} revealed={5} collapseOnComplete={collapseOnComplete} />); expect(details.open).toBe(true);
  });

  it("counts source rows separately, caps marks at six, expands overflow, and leaves no competing timer", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const view = render(<WebSearch steps={steps} revealed={1} onComplete={complete} working="Checking references" />);
    expect(screen.getByText("Search docs")).toBeVisible(); expect(screen.queryByText("Sources")).not.toBeInTheDocument(); expect(screen.getByText("Checking references")).toBeVisible();
    view.rerender(<WebSearch steps={steps} revealed={2} onComplete={complete} />);
    expect(screen.getByText("Sources")).toBeVisible(); expect(screen.getByText("+2")).toBeVisible(); expect(screen.queryByText("Read page")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reference 0 · example.com" })).toHaveAttribute("href", "https://example.com/0");
    fireEvent.click(screen.getByText("+2")); expect(screen.getByRole("link", { name: "Reference 7 · example.com" })).toBeVisible();
    act(() => vi.advanceTimersByTime(10000)); expect(screen.queryByText("Read page")).not.toBeInTheDocument();
    view.rerender(<WebSearch steps={steps} revealed={3} onComplete={complete} />); expect(screen.getByText("Read page")).toBeVisible(); expect(screen.queryByText("Working")).not.toBeInTheDocument(); expect(complete).toHaveBeenCalledOnce();
  });

  it("holds a step for its dwell before its sources row and cancels when disabled or failed", () => {
    vi.useFakeTimers(); const complete = vi.fn();
    const view = render(<WebSearch steps={steps} startDelay={100} stepInterval={50} onComplete={complete} />);
    act(() => vi.advanceTimersByTime(100)); expect(screen.getByText("Search docs")).toBeVisible();
    act(() => vi.advanceTimersByTime(249)); expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByText("Sources")).toBeVisible();
    view.rerender(<WebSearch steps={steps} startDelay={100} stepInterval={50} disabled onComplete={complete} />);
    expect(vi.getTimerCount()).toBe(0); expect(screen.queryByText("Working")).not.toBeInTheDocument();
    view.rerender(<WebSearch steps={steps} error="Search interrupted" onComplete={complete} />); expect(screen.getByRole("alert")).toHaveTextContent("Search interrupted"); expect(vi.getTimerCount()).toBe(0); expect(complete).not.toHaveBeenCalled();
  });

  it("preserves accessible link identity for unavailable and disabled source marks without enabling navigation", () => {
    const view = render(<WebSearch steps={[{ label: "References", sources: [{ title: "Unavailable", domain: "example.com" }, { title: "Unsafe", domain: "example.com", href: "javascript:alert(1)" }] }]} revealed={2} />);
    for (const name of ["Unavailable · example.com", "Unsafe · example.com"]) {
      const source = screen.getByRole("link", { name });
      expect(source).toHaveAttribute("aria-disabled", "true"); expect(source).not.toHaveAttribute("href"); expect(source).toHaveAttribute("tabindex", "-1");
      expect(fireEvent.click(source)).toBe(false);
    }
    view.rerender(<WebSearch steps={[{ label: "References", sources: [{ title: "Disabled", domain: "example.com", href: "https://example.com" }] }]} revealed={2} disabled />);
    const source = screen.getByRole("link", { name: "Disabled · example.com" });
    expect(source).toHaveAttribute("aria-disabled", "true"); expect(source).not.toHaveAttribute("href"); expect(source).toHaveAttribute("tabindex", "-1"); expect(fireEvent.click(source)).toBe(false);
  });

  it("rejects unsafe links on both detailed and legacy paths; disabled sources cannot navigate", () => {
    const unsafe = ["javascript:alert(1)", "data:text/html,bad", "//example.com", "/relative", "https://user:pass@example.com", "not a url"];
    const view = render(<WebSearch query="Search" searchResults={unsafe.map(url => ({ title: url, url }))} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    view.rerender(<WebSearch steps={[{ label: "Unsafe", sources: unsafe.map(href => ({ title: href, domain: "example.com", href })) }]} revealed={2} />);
    expect(view.container.querySelectorAll("a[href]")).toHaveLength(0);
    view.rerender(<WebSearch steps={steps} revealed={3} disabled />); expect(view.container.querySelectorAll("a[href]")).toHaveLength(0);
    view.rerender(<WebSearch query="Safe" searchResults={[{ title: "Safe site", url: "https://example.com" }]} />); expect(screen.getByRole("link", { name: /Safe site/ })).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("handles empty and invalid counts without synthetic completion or working status", () => {
    const complete = vi.fn(); const view = render(<TaskList tasks={[]} onComplete={complete} />); expect(screen.getByText("No tasks supplied.")).toBeVisible();
    view.rerender(<WebSearch steps={[]} onComplete={complete} />); expect(screen.getByText("No search steps supplied.")).toBeVisible(); expect(screen.queryByText("Working")).not.toBeInTheDocument(); expect(complete).not.toHaveBeenCalled();
    view.rerender(<TaskList tasks={tasks} revealed={NaN} />); expect(screen.queryByText("Inspect")).not.toBeInTheDocument();
    view.rerender(<WebSearch steps={steps} revealed={-1} working={false} />); expect(screen.queryByText("Search docs")).not.toBeInTheDocument(); expect(screen.queryByText("Working")).not.toBeInTheDocument();
  });
});
