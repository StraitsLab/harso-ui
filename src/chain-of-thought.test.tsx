import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtStep } from "./chain-of-thought";

describe("ChainOfThought", () => {
  it("renders step children without inventing completion", () => {
    render(<ChainOfThought defaultOpen><ChainOfThoughtHeader /><ChainOfThoughtContent><ChainOfThoughtStep label="Search"><a href="https://example.com">Source</a></ChainOfThoughtStep></ChainOfThoughtContent></ChainOfThought>);
    expect(screen.getByRole("link", { name: "Source" })).toBeVisible();
    expect(screen.getByText("pending")).toBeVisible();
    const trigger = screen.getByRole("button");
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toBeVisible();
  });

  it("allows cancelling disclosure and respects controlled refusal", () => {
    const changed = vi.fn();
    const view = (cancel: boolean, open = false) => <ChainOfThought open={open} onOpenChange={changed}><ChainOfThoughtHeader onClick={event => { if (cancel) event.preventDefault(); }} /><ChainOfThoughtContent>Summary</ChainOfThoughtContent></ChainOfThought>;
    const { rerender } = render(view(true));
    fireEvent.click(screen.getByRole("button"));
    expect(changed).not.toHaveBeenCalled();
    rerender(view(false));
    fireEvent.click(screen.getByRole("button"));
    expect(changed).toHaveBeenCalledWith(true);
    expect(screen.getByText("Summary")).not.toBeVisible();
    rerender(view(false, true));
    expect(screen.getByText("Summary")).toBeVisible();
  });
  it("keeps disclosure controlled and labels step status", () => {
    render(<ChainOfThought><ChainOfThoughtHeader /><ChainOfThoughtContent><ChainOfThoughtStep label="Search" status="active" /></ChainOfThoughtContent></ChainOfThought>);
    expect(screen.getByText("Search").closest(".hk-chain-content")).toHaveAttribute("hidden");
    fireEvent.click(screen.getByRole("button", { name: /Chain of Thought/ }));
    expect(screen.getByText("Search")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
  });
});
