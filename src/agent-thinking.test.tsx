import { StrictMode, createRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import css from "./agent-thinking.css?raw";
import theme from "./theme.css?raw";
import { AgentThinking } from "./agent-thinking";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("AgentThinking", () => {
  it("preserves Working and children overrides without inventing a running badge", () => {
    const view = render(<AgentThinking />);
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    view.rerender(<AgentThinking label="Searching">Custom work</AgentThinking>);
    expect(screen.getByRole("status")).toHaveTextContent("Custom work");
    expect(screen.queryByText("Searching")).not.toBeInTheDocument();
    view.rerender(<AgentThinking label="Searching">{null}</AgentThinking>);
    expect(screen.getByRole("status").textContent).toBe("");
    view.rerender(<AgentThinking label="Searching" />);
    expect(screen.getByRole("status")).toHaveTextContent("Searching");
  });

  it("preserves every explicit host status without inferred transitions", () => {
    vi.useFakeTimers();
    const view = render(<AgentThinking />);
    const states = { "input-streaming": "Pending", "input-available": "Running", "approval-requested": "Awaiting approval", "approval-responded": "Responded", "output-available": "Completed", "output-error": "Error", "output-denied": "Denied" } as const;
    for (const [state, label] of Object.entries(states)) {
      view.rerender(<AgentThinking state={state as keyof typeof states} showTimer />);
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(view.container.firstChild).toHaveAttribute("data-active", String(state === "input-streaming" || state === "input-available"));
    }
  });

  it("has four original decorative structures and variant tone defaults", () => {
    const view = render(<AgentThinking />);
    for (const variant of ["wave", "spin", "stars", "infinity"] as const) {
      view.rerender(<AgentThinking variant={variant} shimmer={false} />);
      expect(view.container.firstChild).toHaveAttribute("data-variant", variant);
      expect(view.container.firstChild).toHaveAttribute("data-tone", variant === "stars" ? "subtle" : "accent");
      expect(view.container.firstChild).toHaveAttribute("data-shimmer", "false");
      expect(view.container.querySelector(".hk-thinking-indicator")).toHaveAttribute("aria-hidden", "true");
      expect(view.container.querySelectorAll(".hk-thinking-dot")).toHaveLength(variant === "wave" || variant === "spin" ? 9 : 0);
      expect(view.container.querySelectorAll(".hk-thinking-star")).toHaveLength(variant === "stars" ? 5 : 0);
      expect(view.container.querySelectorAll(".hk-thinking-comet")).toHaveLength(variant === "infinity" ? 1 : 0);
    }
    view.rerender(<AgentThinking variant="stars" tone="accent" />);
    expect(view.container.firstChild).toHaveAttribute("data-tone", "accent");
  });

  it("uses host elapsed verbatim and never starts a local clock for it", () => {
    vi.useFakeTimers();
    const view = render(<AgentThinking elapsed="host 02:34" />);
    expect(screen.getByRole("timer")).toHaveTextContent("host 02:34");
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<AgentThinking elapsed="" showTimer />);
    expect(screen.getByRole("timer")).toBeEmptyDOMElement();
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<AgentThinking elapsed="host 02:34" showTimer={false} />);
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("counts only active presentation time, freezes on pause and terminal, and resets by runKey", () => {
    vi.useFakeTimers();
    const view = render(<StrictMode><AgentThinking showTimer runKey="one" /></StrictMode>);
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("timer")).toHaveTextContent("1.5 s");
    expect(screen.getByRole("timer")).toHaveAccessibleName("Elapsed presentation time");
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "off");
    expect(screen.getByRole("status")).not.toContainElement(screen.getByRole("timer"));
    view.rerender(<StrictMode><AgentThinking showTimer runKey="one" paused /></StrictMode>);
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByRole("timer")).toHaveTextContent("1.5 s");
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<StrictMode><AgentThinking showTimer runKey="one" /></StrictMode>);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("timer")).toHaveTextContent("2.0 s");
    view.rerender(<StrictMode><AgentThinking showTimer runKey="one" state="output-available" /></StrictMode>);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("timer")).toHaveTextContent("2.0 s");
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<StrictMode><AgentThinking showTimer runKey="two" state="output-available" /></StrictMode>);
    expect(screen.getByRole("timer")).toHaveTextContent("0.0 s");
    view.rerender(<StrictMode><AgentThinking showTimer runKey="two" /></StrictMode>);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole("timer")).toHaveTextContent("0.3 s");
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["approval-requested", "approval-responded", "output-available", "output-error", "output-denied"] as const)("never ticks initially static %s", state => {
    vi.useFakeTimers();
    const view = render(<AgentThinking state={state} showTimer shimmer />);
    expect(view.container.firstChild).toHaveAttribute("data-active", "false");
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("timer")).toHaveTextContent("0.0 s");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains active duration through visibility and presentation changes", () => {
    vi.useFakeTimers();
    const view = render(<AgentThinking showTimer runKey="same" />);
    act(() => vi.advanceTimersByTime(1000));
    view.rerender(<AgentThinking showTimer={false} runKey="same" />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(1000));
    view.rerender(<AgentThinking showTimer runKey="same" variant="stars" tone="subtle" label="Searching" shimmer={false} />);
    expect(screen.getByRole("timer")).toHaveTextContent("2.0 s");
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("timer")).toHaveTextContent("2.5 s");
    view.rerender(<AgentThinking showTimer={false} runKey="same" paused />);
    act(() => vi.advanceTimersByTime(1000));
    view.rerender(<AgentThinking showTimer runKey="same" paused />);
    expect(screen.getByRole("timer")).toHaveTextContent("2.5 s");
    view.rerender(<AgentThinking showTimer={false} runKey="new" paused />);
    view.rerender(<AgentThinking showTimer runKey="new" paused />);
    expect(screen.getByRole("timer")).toHaveTextContent("0.0 s");
  });

  it("forwards native props/ref and keeps ticking outside live regions", () => {
    const ref = createRef<HTMLDivElement>();
    render(<AgentThinking ref={ref} className="custom" id="work" aria-live="polite" showTimer />);
    expect(ref.current).toHaveClass("custom", "hk-agent-thinking");
    expect(ref.current).toHaveAttribute("id", "work");
    expect(ref.current).toHaveAttribute("aria-live", "off");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("gates all animation declarations behind native live motion preference and active state", () => {
    for (const [, token] of css.matchAll(/var\((--hk-[\w-]+)/g)) expect(`${theme}\n${css}`).toContain(`${token}:`);
    expect(css).toContain("@media (forced-colors: none)");
    const [staticCss, motionCss] = css.split("@media (prefers-reduced-motion: no-preference)");
    expect(motionCss).toBeTruthy();
    expect(staticCss).not.toMatch(/animation\s*:/);
    const animatedRules = [...motionCss.matchAll(/([^{}]+)\{[^{}]*animation\s*:[^{}]*\}/g)];
    expect(animatedRules.length).toBe(5);
    for (const rule of animatedRules) expect(rule[1]).toContain('[data-active="true"]');
    expect(motionCss).toContain('[data-shimmer="true"]');
    expect(staticCss).toMatch(/\[data-variant="infinity"\] \.hk-thinking-indicator\s*\{[^}]*display: block;[^}]*width: 32px;/);
  });
});
