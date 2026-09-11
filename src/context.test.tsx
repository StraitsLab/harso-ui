import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Context, ContextContent, ContextContentBody, ContextContentHeader, ContextContentFooter, ContextInputUsage, ContextTrigger } from "./context";

describe("Context", () => {
  it("does not present invalid costs and supplies a numeric ring progress", () => {
    const { container, rerender } = render(<Context maxTokens={100} usedTokens={25} cost={NaN}><ContextTrigger /><ContextContentFooter /><ContextInputUsage value={0} cost={-1} /></Context>);
    expect(screen.getAllByText(/Cost unavailable/)).toHaveLength(2);
    expect((container.querySelector(".hk-context-ring") as HTMLElement).style.getPropertyValue("--hk-context-progress")).toBe("25");
    rerender(<Context maxTokens={100} usedTokens={0} cost={0}><ContextContentFooter /></Context>);
    expect(screen.getByText("$0.0000")).toBeInTheDocument();
  });
  it("distinguishes unavailable usage from a reported zero", () => {
    const { rerender } = render(<Context maxTokens={0} usedTokens={NaN} defaultOpen><ContextTrigger /><ContextInputUsage /></Context>);
    expect(screen.getByRole("button", { name: "Context usage unavailable" })).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    rerender(<Context maxTokens={100} usedTokens={0} usage={{ inputTokens: 0 }} defaultOpen><ContextTrigger /><ContextInputUsage /></Context>);
    expect(screen.getByRole("button", { name: "0% context used" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("honors cancelled toggles, host refusal and host reset", () => {
    const change = vi.fn();
    const view = (open: boolean, cancel = false) => <Context maxTokens={100} usedTokens={25} open={open} onOpenChange={change}><ContextTrigger onClick={event => { if (cancel) event.preventDefault(); }} /><ContextContent>Details</ContextContent></Context>;
    const { rerender } = render(view(false, true));
    fireEvent.click(screen.getByRole("button"));
    expect(change).not.toHaveBeenCalled();
    rerender(view(false));
    fireEvent.click(screen.getByRole("button"));
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.getByText("Details")).not.toBeVisible();
    rerender(view(true));
    expect(screen.getByText("Details")).toBeVisible();
  });
  it("shows host-supplied usage details through the compound API", () => {
    render(<Context maxTokens={100000} usedTokens={25000} usage={{ inputTokens: 18000, outputTokens: 7000 }}><ContextTrigger /><ContextContent><ContextContentHeader /><ContextContentBody><ContextInputUsage /></ContextContentBody></ContextContent></Context>);
    expect(screen.getByRole("button", { name: /25% context used/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/18.0K/)).toBeInTheDocument();
  });
});
