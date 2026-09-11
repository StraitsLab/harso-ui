import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sandbox, SandboxContent, SandboxHeader, SandboxTabContent, SandboxTabs, SandboxTabsBar, SandboxTabsList, SandboxTabsTrigger } from "./sandbox";

describe("Sandbox", () => {
  it("allows the host to refuse native disclosure and disables its descendants", () => {
    const change = vi.fn();
    const view = render(<Sandbox open={false} onOpenChange={change}><SandboxHeader state="output-available" /></Sandbox>);
    const details = view.container.querySelector("details")!;
    details.open = true; fireEvent(details, new Event("toggle"));
    expect(change).toHaveBeenCalledWith(true);
    expect(details.open).toBe(false);
    view.rerender(<Sandbox open disabled><SandboxHeader state="output-available" /><SandboxTabs><SandboxTabsTrigger value="code">Code</SandboxTabsTrigger></SandboxTabs></Sandbox>);
    expect(screen.getByRole("tab")).toBeDisabled();
  });
  it("keeps tab selection controlled and honors prevention", () => {
    const change = vi.fn();
    const fixture = (prevent = false) => <SandboxTabs value="code" onValueChange={change}><SandboxTabsList><SandboxTabsTrigger value="code">Code</SandboxTabsTrigger><SandboxTabsTrigger value="output" onClick={event => { if (prevent) event.preventDefault(); }}>Output</SandboxTabsTrigger></SandboxTabsList><SandboxTabContent value="code">Source</SandboxTabContent><SandboxTabContent value="output">Result</SandboxTabContent></SandboxTabs>;
    const view = render(fixture());
    fireEvent.click(screen.getByRole("tab", { name: "Output" }));
    expect(change).toHaveBeenCalledWith("output");
    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Result")).not.toBeVisible();
    change.mockClear(); view.rerender(fixture(true));
    fireEvent.click(screen.getByRole("tab", { name: "Output" }));
    expect(change).not.toHaveBeenCalled();
  });
  it("links panels and moves keyboard focus without activating disabled tabs", () => {
    render(<SandboxTabs><SandboxTabsList><SandboxTabsTrigger value="code">Code</SandboxTabsTrigger><SandboxTabsTrigger value="blocked" disabled>Blocked</SandboxTabsTrigger><SandboxTabsTrigger value="output">Output</SandboxTabsTrigger></SandboxTabsList><SandboxTabContent value="code">Source</SandboxTabContent><SandboxTabContent value="output">Result</SandboxTabContent></SandboxTabs>);
    const code = screen.getByRole("tab", { name: "Code" });
    code.focus(); fireEvent.keyDown(code, { key: "ArrowRight" });
    const output = screen.getByRole("tab", { name: "Output" });
    expect(output).toHaveFocus();
    expect(output).toHaveAttribute("aria-selected", "true");
    expect(output).toHaveAttribute("aria-controls", screen.getByRole("tabpanel", { name: "Output" }).id);
    fireEvent.keyDown(output, { key: "Home" }); expect(code).toHaveFocus();
  });
  it("presents host-fed execution state and tabs", () => {
    render(<Sandbox open><SandboxHeader state="output-available" title="index.tsx" /><SandboxContent><SandboxTabs><SandboxTabsBar><SandboxTabsList><SandboxTabsTrigger value="code">Code</SandboxTabsTrigger><SandboxTabsTrigger value="output">Output</SandboxTabsTrigger></SandboxTabsList></SandboxTabsBar><SandboxTabContent value="code">const result = 1;</SandboxTabContent><SandboxTabContent value="output">done</SandboxTabContent></SandboxTabs></SandboxContent></Sandbox>);
    expect(screen.getByText("index.tsx")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("const result = 1;")).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Output" }));
    expect(screen.getByRole("tabpanel", { name: "Output" })).toBeVisible();
  });
});
