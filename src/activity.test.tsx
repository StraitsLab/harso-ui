import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools, Artifact, ArtifactAction, ArtifactActions, ArtifactClose, ArtifactContent, ArtifactDescription, ArtifactHeader, ArtifactTitle, Source, Sources, SourcesContent, SourcesTrigger, Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, getStatusBadge, type ToolState } from "./activity";

describe("boundaryless activity presentation", () => {
  test("artifact actions preserve native refs, icon/children, disabled state and optional tooltip", async () => {
    const ref = createRef<HTMLButtonElement>(); const click = vi.fn(); const submit = vi.fn();
    const view = render(<form onSubmit={submit}><ArtifactAction ref={ref} label="Inspect" tooltip="Inspect artifact" icon={<svg data-testid="action-icon" />} type="submit" onClick={click} /></form>);
    const button = screen.getByRole("button", { name: "Inspect" });
    expect(ref.current).toBe(button); expect(button).toHaveAttribute("type", "button");
    expect(screen.getByTestId("action-icon").parentElement).toHaveAttribute("aria-hidden", "true");
    fireEvent.focus(button); expect(await screen.findByRole("tooltip")).toHaveTextContent("Inspect artifact");
    fireEvent.click(button); expect(click).toHaveBeenCalledOnce(); expect(submit).not.toHaveBeenCalled();
    view.rerender(<ArtifactAction label="Inspect" ref={ref} disabled onClick={click}>Child glyph</ArtifactAction>);
    expect(ref.current).toHaveTextContent("Child glyph"); expect(ref.current).toBeDisabled();
    fireEvent.click(ref.current!); expect(click).toHaveBeenCalledOnce();
  });
  test("instructions render runtime-free GFM and reject unsafe URLs", () => {
    const view = render(<AgentInstructions>{"## Instructions\n\n- [x] Verified\n\n[bad](javascript:alert%281%29) ![private](https://example.com/pixel)"}</AgentInstructions>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Instructions");
    expect(screen.getByRole("checkbox")).toBeChecked(); expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(view.container.querySelector("img,script,a")).toBeNull();
  });
  test("tool status updates never open details or replace a draft; decisions stay visible", () => {
    const fixture = (state: ToolState) => <Tool><ToolHeader type="dynamic-tool" toolName="Search evidence" state={state} /><ToolContent><input aria-label="Notes" /></ToolContent></Tool>;
    const view = render(fixture("input-streaming"));
    view.rerender(fixture("approval-requested"));
    expect(screen.getByRole("button", { name: /Search evidence Awaiting approval/ })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button"));
    const notes = screen.getByRole("textbox");
    fireEvent.change(notes, { target: { value: "Retain this" } });
    view.rerender(fixture("output-available"));
    expect(screen.getByRole("button", { name: /Completed/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("textbox")).toBe(notes);
    expect(notes).toHaveValue("Retain this");
    fireEvent.click(screen.getByRole("button"));
    view.rerender(fixture("output-error"));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: /Error/ })).toHaveAttribute("aria-expanded", "false");
  });

  test("all seven supplied states and unknown status have readable labels", () => {
    const states = ["input-streaming", "input-available", "approval-requested", "approval-responded", "output-available", "output-error", "output-denied", "future-state"];
    render(<>{states.map(state => <div key={state}>{getStatusBadge(state)}</div>)}</>);
    for (const label of ["Pending", "Running", "Awaiting approval", "Responded", "Completed", "Error", "Denied", "Unknown status"]) expect(screen.getByText(label)).toBeVisible();
  });

  test("tool and source disclosures respect controlled refusal, prevented requests and disabled roots", () => {
    const request = vi.fn();
    render(<><Tool open={false} onOpenChange={request}><ToolHeader type="tool-search" state="input-available" /><ToolContent>Hidden result</ToolContent></Tool><Sources disabled><SourcesTrigger count={2} /><SourcesContent>Hidden sources</SourcesContent></Sources><Sources><SourcesTrigger count={1} onClick={event => event.preventDefault()} /><SourcesContent>Prevented content</SourcesContent></Sources></>);
    fireEvent.click(screen.getByRole("button", { name: /search Running/ }));
    expect(request).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByText("Hidden result")).not.toBeVisible();
    expect(screen.getByRole("button", { name: /2 sources/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /1 source/ }));
    expect(screen.getByText("Prevented content")).not.toBeVisible();
  });

  test("plain input JSON and errors stay inert; failed output cannot show stale success", () => {
    const value = { markup: '<img src="https://invalid.example/x" onerror="alert(1)">' };
    const view = render(<><ToolInput input={value} /><ToolOutput output={<button>Stale action</button>} errorText="<script>unsafe()</script>" /></>);
    expect(view.container.querySelectorAll("script,img")).toHaveLength(0);
    expect(screen.getByText(/onerror/)).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("<script>unsafe()</script>")).toBeVisible();
    view.rerender(<ToolOutput output={0} />);
    expect(screen.getByText("0")).toBeVisible();
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    view.rerender(<ToolInput input={cyclic as never} />);
    expect(screen.getByText("Input cannot be displayed as JSON.")).toBeVisible();
    view.rerender(<ToolInput />);
    expect(screen.getByText("No input supplied.")).toBeVisible();
  });

  test("agent configuration never invokes descriptors or evaluates schema and renders safe Markdown", () => {
    const execute = vi.fn();
    const descriptor = { description: "Search the archive", inputSchema: { query: "string" }, execute };
    const view = render(<Agent><AgentHeader name="Research partner" model="Supplied model" /><AgentContent><AgentInstructions>{'Use **verified evidence**. <script>bad()</script> ![no fetch](https://invalid.example/x)'}</AgentInstructions><AgentTools><AgentTool value="search" tool={descriptor} /><AgentTool value="summarize" tool={{ description: "Summarize findings" }} /></AgentTools><AgentOutput schema="callUntrustedCode()" /></AgentContent></Agent>);
    expect(screen.getByRole("heading", { name: "Research partner" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /search Search the archive/ }));
    expect(screen.getByText(/"query": "string"/)).toBeVisible();
    expect(screen.getByRole("button", { name: /summarize/ })).toHaveAttribute("aria-expanded", "false");
    expect(view.container.querySelector("strong")).toHaveTextContent("verified evidence");
    expect(view.container.querySelectorAll("script,img")).toHaveLength(0);
    expect(screen.getByText("callUntrustedCode()")).toBeVisible();
    expect(execute).not.toHaveBeenCalled();
  });

  test("agent tools use one open disclosure when grouped", () => {
    render(<AgentTools defaultValue="search"><AgentTool value="search" tool={{ description: "Search" }} /><AgentTool value="summarize" tool={{ description: "Summarize" }} /></AgentTools>);
    expect(screen.getByRole("button", { name: /search Search/ })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: /summarize Summarize/ }));
    expect(screen.getByRole("button", { name: /search Search/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /summarize Summarize/ })).toHaveAttribute("aria-expanded", "true");
  });

  test("controlled empty does not revive the default and closing requests null", () => {
    const request = vi.fn();
    const fixture = (value: string | null) => <AgentTools value={value} defaultValue="search" onValueChange={request}><AgentTool value="search" tool={{ description: "Search" }} /></AgentTools>;
    const view = render(fixture(null));
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(request).toHaveBeenLastCalledWith("search");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    view.rerender(fixture("search"));
    fireEvent.click(trigger);
    expect(request).toHaveBeenLastCalledWith(null);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    view.rerender(fixture(null));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("group ownership overrides child expansion and child disable cannot bypass root disable", () => {
    const request = vi.fn();
    const childRequest = vi.fn();
    const fixture = (disabled: boolean) => <AgentTools defaultValue="search" disabled={disabled} onValueChange={request}><AgentTool value="search" open={false} tool={{ description: "Search" }} /><AgentTool value="summarize" open defaultOpen disabled={false} onOpenChange={childRequest} tool={{ description: "Summarize" }} /></AgentTools>;
    const view = render(fixture(false));
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(request).toHaveBeenCalledExactlyOnceWith("summarize");
    expect(childRequest).toHaveBeenCalledExactlyOnceWith(true);
    view.rerender(fixture(true));
    expect(first).toBeDisabled();
    expect(second).toBeDisabled();
    fireEvent.click(second);
    expect(request).toHaveBeenCalledTimes(1);
  });

  test("cancelled grouped activation stays closed and standalone disclosure still works", () => {
    const request = vi.fn();
    render(<><AgentTools onValueChange={request} onClickCapture={event => event.preventDefault()}><AgentTool value="search" tool={{}} /></AgentTools><AgentTool value="standalone" defaultOpen tool={{}} /></>);
    fireEvent.click(screen.getByRole("button", { name: "search" }));
    expect(request).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "search" })).toHaveAttribute("aria-expanded", "false");
    const standalone = screen.getByRole("button", { name: "standalone" });
    expect(standalone).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(standalone);
    expect(standalone).toHaveAttribute("aria-expanded", "false");
  });

  test("artifact actions emit native requests without hidden close state or form submission", () => {
    const request = vi.fn(); const submit = vi.fn();
    render(<form onSubmit={submit}><Artifact><ArtifactHeader><ArtifactTitle>Research brief</ArtifactTitle><ArtifactDescription>Ready for consideration</ArtifactDescription><ArtifactActions><ArtifactAction label="Save brief" icon="↓" onClick={request} /><ArtifactAction label="Share brief" disabled icon="↗" onClick={request} /><ArtifactClose onClick={request} /></ArtifactActions></ArtifactHeader><ArtifactContent>Still present until the host closes it.</ArtifactContent></Artifact></form>);
    fireEvent.click(screen.getByRole("button", { name: "Save brief" }));
    fireEvent.click(screen.getByRole("button", { name: "Share brief" }));
    fireEvent.click(screen.getByRole("button", { name: "Close artifact" }));
    expect(request).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText("Still present until the host closes it.")).toBeVisible();
  });

  test("sources only navigate to explicit safe web URLs without tracking or credentials", () => {
    const clicked = vi.fn();
    const unsafe = ["javascript:alert(1)", "data:text/html,test", "file:///tmp/local", "//example.com", "/relative", "https://user:secret@example.com", "", "blob:https://example.com/id"];
    const view = render(<Sources defaultOpen><SourcesTrigger count={Infinity} /><SourcesContent><Source href="https://example.com/evidence" title="Evidence" {...{ ping: "https://tracking.example.com" }} /><Source href="http://example.com/" title="Plain HTTP" />{unsafe.map((href, index) => <Source key={index} href={href} title={`Unsafe ${index}`} onClick={clicked} />)}</SourcesContent></Sources>);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    const link = screen.getByRole("link", { name: /Evidence/ });
    expect(link).toHaveAttribute("href", "https://example.com/evidence");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(link).not.toHaveAttribute("ping");
    for (let index = 0; index < unsafe.length; index++) fireEvent.click(screen.getByText(`Unsafe ${index}`));
    expect(clicked).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sources" })).toBeVisible();
    expect(view.container.querySelectorAll("img,iframe,script")).toHaveLength(0);
  });
});
