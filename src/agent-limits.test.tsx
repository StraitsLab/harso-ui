import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgentLimitsCard } from "./agent-limits";

const context = {
  max: 100,
  segments: [{ label: "Messages", tokens: 60 }, { label: "Tools deferred", tokens: 90, deferred: true }],
  groups: [
    { label: "Tools", tokens: 90, items: [{ label: "Browser", tokens: 90 }] },
    { label: "Memory", tokens: 12, items: [{ label: "Notes", tokens: 12 }] },
  ],
};

describe("AgentLimitsCard", () => {
  it("excludes deferred buckets and group totals, preserving free space", () => {
    const { container } = render(<AgentLimitsCard context={context} used={99} maximum={200} defaultExpanded />);
    expect(screen.getByRole("progressbar", { name: "Context window usage" })).toHaveAttribute("value", "60");
    expect(screen.getByText("60 / 100 (60%)")).toBeVisible();
    expect(screen.getByText("Free space").closest("li")).toHaveTextContent("40 (40%)");
    expect(screen.getByText("Tools deferred").closest("li")).toHaveTextContent("90 —");
    const bar = container.querySelector(".hk-agent-limits-segments")!;
    expect(bar.children).toHaveLength(1);
    expect(bar.firstElementChild).toHaveStyle({ width: "60%" });
  });

  it("supports keyboard expansion and independent native member lists", async () => {
    const user = userEvent.setup(); const changed = vi.fn();
    render(<AgentLimitsCard context={context} onExpandedChange={changed} />);
    const toggle = screen.getByRole("button", { name: "Context window" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    toggle.focus(); await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(changed).toHaveBeenLastCalledWith(true);
    const tools = screen.getByText("Tools").closest("details")!;
    const memory = screen.getByText("Memory").closest("details")!;
    await user.click(within(tools).getByText("Tools"));
    expect(tools).toHaveAttribute("open"); expect(memory).not.toHaveAttribute("open");
    await user.click(within(memory).getByText("Memory"));
    expect(tools).toHaveAttribute("open"); expect(memory).toHaveAttribute("open");
    await user.click(toggle); await user.click(toggle);
    expect(tools).toHaveAttribute("open");
  });

  it("requests controlled changes without overriding host refusal", async () => {
    const user = userEvent.setup(); const changed = vi.fn();
    const view = render(<AgentLimitsCard context={context} expanded={false} defaultExpanded onExpandedChange={changed} />);
    await user.click(screen.getByRole("button", { name: "Context window" }));
    expect(changed).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Context window" })).toHaveAttribute("aria-expanded", "false");
    view.rerender(<AgentLimitsCard context={context} expanded onExpandedChange={changed} />);
    await user.click(screen.getByRole("button", { name: "Context window" }));
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("button", { name: "Context window" })).toHaveAttribute("aria-expanded", "true");
  });

  it.each(["disabled", "loading"] as const)("%s prevents disclosure and navigation", async state => {
    const user = userEvent.setup(); const changed = vi.fn();
    render(<AgentLimitsCard context={context} defaultExpanded plan="Team" planHref="/plan" onExpandedChange={changed} {...{ [state]: true }} />);
    const toggle = screen.getByRole("button", { name: "Context window" });
    expect(toggle).toBeDisabled(); await user.click(toggle); expect(changed).not.toHaveBeenCalled();
    const summary = screen.getByText("Tools").closest("summary")!;
    expect(summary).toHaveAttribute("aria-disabled", "true");
    expect(fireEvent.click(summary)).toBe(false);
    expect(fireEvent.keyDown(summary, { key: "Enter" })).toBe(false);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    if (state === "loading") expect(screen.getByRole("status")).toHaveTextContent("Loading usage");
  });

  it("renders host plan fractions and reset labels independently of expansion", () => {
    render(<AgentLimitsCard plan="Team" planHref="/settings/plan" limits={[{ label: "Weekly", used: 0.38, resets: "Resets Tuesday" }]} error="Usage unavailable" />);
    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute("href", "/settings/plan");
    expect(screen.getByRole("progressbar", { name: "Weekly usage" })).toHaveAttribute("value", "38");
    expect(screen.getByText("Resets Tuesday")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Usage unavailable");
  });

  it.each(["javascript:alert(1)", "data:text/html,bad", "//evil.test", "/\\evil.test", "https://user:pass@example.com", "java\nscript:alert(1)"])("rejects unsafe plan URL %s", planHref => {
    render(<AgentLimitsCard plan="Team" planHref={planHref} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Team")).toBeVisible();
  });

  it.each(["https://example.com/plan", "http://example.com/plan", "/settings/plan"])("allows plan URL %s", planHref => {
    render(<AgentLimitsCard plan="Team" planHref={planHref} />);
    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute("href", planHref);
  });

  it.each([NaN, Infinity, -1, undefined])("marks invalid or missing legacy quantities %s unavailable", value => {
    const { container } = render(<AgentLimitsCard used={value} maximum={value} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    expect(container).not.toHaveTextContent(/NaN|Infinity|∞/);
    expect(screen.getByText("— / — (—%)")).toBeVisible();
  });

  it("clamps meters without hiding over-limit amounts, and marks overflowing sums unavailable", () => {
    const view = render(<AgentLimitsCard used={150} maximum={100} label="Context window" defaultExpanded limits={[{ label: "Weekly", used: 1.2, resets: "Tomorrow" }]} />);
    expect(screen.getByText("150 / 100 (150%)")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Context window usage" })).toHaveAttribute("value", "100");
    expect(screen.getByText("Free space").closest("li")).toHaveTextContent("0 (0%)");
    expect(screen.getByRole("progressbar", { name: "Weekly usage" })).toHaveAttribute("value", "100");
    expect(screen.getByText("120%")).toBeVisible();
    view.rerender(<AgentLimitsCard defaultExpanded context={{ max: Number.MIN_VALUE, segments: [{ label: "Large", tokens: Number.MAX_VALUE }, { label: "Larger", tokens: Number.MAX_VALUE }] }} />);
    expect(view.container).not.toHaveTextContent(/NaN|Infinity|∞/);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    expect(view.container.innerHTML).not.toMatch(/(?:width|flex-basis):[^;]*(?:NaN|Infinity)/);
  });

  it("distinguishes empty context from missing data and ignores invalid deferred buckets", () => {
    const view = render(<AgentLimitsCard context={{ max: 100, segments: [] }} defaultExpanded />);
    expect(screen.getByText("0 / 100 (0%)")).toBeVisible();
    expect(screen.getByText("Free space").closest("li")).toHaveTextContent("100 (100%)");
    view.rerender(<AgentLimitsCard context={{ max: 100, segments: [{ label: "Deferred", tokens: NaN, deferred: true }] }} defaultExpanded />);
    expect(screen.getByText("0 / 100 (0%)")).toBeVisible();
    view.rerender(<AgentLimitsCard context={{ max: 100, segments: [{ label: "Invalid", tokens: -1 }] }} defaultExpanded limits={[{ label: "Weekly", used: NaN }]} />);
    expect(screen.getByText("— / 100 (—%)")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Weekly usage" })).not.toHaveAttribute("value");
    expect(screen.getByText("Free space").closest("li")).toHaveTextContent("— (—%)");
  });

  it("preserves legacy labels and supplies a context-specific default", () => {
    const view = render(<AgentLimitsCard used={20} maximum={100} />);
    expect(screen.getByRole("button", { name: "Context" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Context usage" })).toHaveAttribute("value", "20");
    view.rerender(<AgentLimitsCard used={20} maximum={100} label="Tokens" />);
    expect(screen.getByRole("button", { name: "Tokens" })).toBeVisible();
  });

  it("clamps finite over-limit meters even when their percentage overflows", () => {
    render(<AgentLimitsCard used={Number.MAX_VALUE} maximum={Number.MIN_VALUE} limits={[{ label: "Weekly", used: Number.MAX_VALUE }]} />);
    expect(screen.getByRole("progressbar", { name: "Context usage" })).toHaveAttribute("value", "100");
    expect(screen.getByRole("progressbar", { name: "Weekly usage" })).toHaveAttribute("value", "100");
  });

  it.each([
    [200001, 1.00001, true],
    [200000, 1, false],
    [199999, 0.99999, false],
    [NaN, Infinity, false],
  ] as const)("shows raw over-limit state despite rounding (%s tokens, %s plan)", (tokens, used, overLimit) => {
    render(<AgentLimitsCard context={{ max: 200000, segments: [{ label: "Messages", tokens }] }} limits={[{ label: "Session", used }]} />);
    const heading = screen.getByRole("button", { name: "Context window" }).closest("header")!;
    const limit = screen.getByRole("progressbar", { name: "Session usage" }).closest(".hk-agent-limits-limit") as HTMLElement;
    for (const region of [heading, limit]) {
      if (overLimit) expect(within(region).getByText("Over limit")).toBeVisible();
      else expect(within(region).queryByText("Over limit")).not.toBeInTheDocument();
    }
  });
});
