import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Checkpoint, CheckpointIcon, CheckpointTrigger, Plan, PlanAction, PlanContent, PlanDescription, PlanFooter, PlanHeader, PlanTitle, PlanTrigger, Reasoning, ReasoningContent, ReasoningTrigger, Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger, useReasoning } from "./work";

describe("boundaryless work presentation", () => {
  test("runtime-free work preserves Markdown and shimmer changes on the same mounted nodes", () => {
    const fixture = (streaming: boolean) => <Reasoning defaultOpen isStreaming={streaming}><ReasoningTrigger /><ReasoningContent>{"## Public evidence\n\n**Verified**"}</ReasoningContent></Reasoning>;
    const view = render(fixture(true));
    const markdown = view.container.querySelector(".hk-message-response"); const shimmer = view.container.querySelector(".hk-shimmer");
    expect(screen.getByRole("heading", { name: "Public evidence" })).toBeVisible();
    expect(markdown).toHaveAttribute("data-streaming", "true"); expect(shimmer).toHaveAttribute("data-active");
    view.rerender(fixture(false));
    expect(view.container.querySelector(".hk-message-response")).toBe(markdown);
    expect(markdown).not.toHaveAttribute("data-streaming"); expect(shimmer).not.toHaveAttribute("data-active");
  });
  test("disclosures retain drafts, refuse controlled requests and keep footer decisions visible", () => {
    const request = vi.fn();
    const view = render(<Plan open={false} onOpenChange={request}><PlanHeader><PlanTitle>A smaller launch</PlanTitle><PlanDescription>Three considered steps.</PlanDescription><PlanAction>Ready for review</PlanAction><PlanTrigger /></PlanHeader><PlanContent><input aria-label="Plan notes" /></PlanContent><PlanFooter><button>Review decision</button></PlanFooter></Plan>);
    fireEvent.click(screen.getByRole("button", { name: "Plan details" }));
    expect(request).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Review decision" })).toBeVisible();
    view.unmount();
    render(<Task><TaskTrigger title="Research" /><TaskContent><TaskItem><input aria-label="Research notes" /></TaskItem></TaskContent></Task>);
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    const notes = screen.getByRole("textbox");
    fireEvent.change(notes, { target: { value: "Keep this" } });
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    expect(screen.getByRole("textbox")).toBe(notes);
    expect(notes).toHaveValue("Keep this");
  });

  test("streaming only changes supplied presentation, not disclosure or elapsed time", () => {
    const content = (streaming: boolean, duration: number) => <Reasoning isStreaming={streaming} duration={duration}><ReasoningTrigger /><ReasoningContent>Public progress, not private reasoning.</ReasoningContent></Reasoning>;
    const view = render(content(true, NaN));
    expect(screen.getByRole("button", { name: "Working" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Working" }));
    view.rerender(content(false, 12));
    expect(screen.getByRole("button", { name: "Progress summary · 12s" })).toHaveAttribute("aria-expanded", "true");
    view.rerender(content(false, Infinity));
    expect(screen.getByRole("button", { name: "Progress summary" })).toBeInTheDocument();
    expect(screen.getByText("Public progress, not private reasoning.")).toBeVisible();
  });

  test("prevented and disabled disclosure requests never change state or submit forms", () => {
    const submit = vi.fn();
    render(<form onSubmit={submit}><Task><TaskTrigger title="Prevented" onClick={event => event.preventDefault()} /><TaskContent>First</TaskContent></Task><Plan disabled><PlanTrigger /><PlanContent>Second</PlanContent></Plan><Reasoning><ReasoningTrigger disabled /><ReasoningContent>Third</ReasoningContent></Reasoning></form>);
    fireEvent.click(screen.getByRole("button", { name: "Prevented" }));
    expect(screen.getByRole("button", { name: "Prevented" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Plan details" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Progress summary" })).toBeDisabled();
    expect(submit).not.toHaveBeenCalled();
  });

  test("nested relations are unique and external collapse restores only displaced focus", () => {
    const root = createRef<HTMLDivElement>();
    const content = (open: boolean) => <><Plan ref={root} open={open}><PlanTrigger /><PlanContent><Task defaultOpen><TaskTrigger title="Nested task" /><TaskContent><TaskItem><input aria-label="Draft" /></TaskItem></TaskContent></Task></PlanContent></Plan><button>Outside</button></>;
    const view = render(content(true));
    const triggers = screen.getAllByRole("button").filter(button => button.hasAttribute("aria-controls"));
    expect(new Set(triggers.map(button => button.getAttribute("aria-controls"))).size).toBe(2);
    screen.getByRole("textbox").focus();
    view.rerender(content(false));
    expect(screen.getByRole("button", { name: "Plan details" })).toHaveFocus();
    view.rerender(content(true));
    screen.getByRole("button", { name: "Outside" }).focus();
    view.rerender(content(false));
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(root.current).toHaveClass("hk-plan");
  });

  test("summary Markdown and filenames remain inert; checkpoint requests are explicit", () => {
    const restore = vi.fn();
    const { container } = render(<><Reasoning defaultOpen><ReasoningTrigger /><ReasoningContent>{'<script>alert(1)</script>\n![tracker](https://private.example/pixel) [bad](javascript:alert%281%29) [safe](https://example.com)'}</ReasoningContent></Reasoning><Task defaultOpen><TaskTrigger title="Files" /><TaskContent><TaskItem status="Ready"><TaskItemFile>{'../../<script>file.tsx'}</TaskItemFile></TaskItem></TaskContent></Task><Checkpoint><CheckpointIcon /><CheckpointTrigger onClick={restore}>Review checkpoint</CheckpointTrigger></Checkpoint></>);
    expect(container.querySelector("img, script, iframe")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText('../../<script>file.tsx')).toBeVisible();
    expect(restore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Review checkpoint" }));
    expect(restore).toHaveBeenCalledTimes(1);
  });

  test("initially autofocused nested content returns focus to its visible owner on collapse", () => {
    const content = (open: boolean) => <Plan open={open}><PlanTrigger /><PlanContent><Task defaultOpen><TaskTrigger title="Nested task" /><TaskContent><TaskItem><input aria-label="Initial draft" autoFocus defaultValue="Keep this" /></TaskItem></TaskContent></Task></PlanContent></Plan>;
    const view = render(content(true));
    expect(screen.getByRole("textbox")).toHaveFocus();
    view.rerender(content(false));
    expect(screen.getByRole("button", { name: "Plan details" })).toHaveFocus();
    view.rerender(content(true));
    expect(screen.getByRole("textbox")).toHaveValue("Keep this");
  });

  test("mapped reasoning hook exposes the same scoped state without a separate store", () => {
    function CustomTrigger() {
      const reasoning = useReasoning();
      return <button onClick={() => reasoning.setIsOpen(!reasoning.isOpen)}>{reasoning.isOpen ? "Collapse summary" : "Read summary"}</button>;
    }
    render(<Reasoning><CustomTrigger /><ReasoningContent>One shared disclosure.</ReasoningContent></Reasoning>);
    fireEvent.click(screen.getByRole("button", { name: "Read summary" }));
    expect(screen.getByText("One shared disclosure.")).toBeVisible();
  });
});
