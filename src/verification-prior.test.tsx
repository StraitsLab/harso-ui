import type { ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Questionnaire } from "./questionnaire";
import { Question, QuestionInput, QuestionSubmit, type QuestionValue } from "./question";
import { SettingsModal } from "./misc-surfaces";
import { TaskList, WebSearch } from "./agent-trails";
// Phase D: trails are runtime-free host content, not legacy conversation wrappers.
import { AreaChartCard, ComboChartCard, LineChartCard } from "./chart-cards";

const questions = [
  { id: "tools", question: "Choose tools", options: [{ value: "search", label: "Search" }, { value: "code", label: "Code" }], other: true },
  { id: "delivery", question: "Choose delivery", options: [{ value: "draft", label: "Draft" }] }
];

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("prior requirement verification", () => {
  it("uses all custom questionnaire labels for navigation and Other submission", () => {
    const complete = vi.fn();
    render(<Questionnaire questions={questions} labels={{ previous: "Back", next: "Continue", complete: "Send answers", other: "Something else" }} onComplete={complete} />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Something else response" }), { target: { value: "Investigate" } });
    expect(screen.getByRole("checkbox", { name: "Something else" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Choose delivery");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("textbox")).toHaveValue("Investigate");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Send answers" }));
    expect(complete).toHaveBeenCalledExactlyOnceWith({ tools: { values: [], other: "Investigate" }, delivery: { values: ["draft"] } });
  });

  it("initializes a nonzero default step and answers without resetting local edits on rerender", () => {
    const complete = vi.fn();
    const { rerender } = render(<Questionnaire questions={questions} defaultStep={1} defaultAnswers={{ tools: { values: ["search", "code"] }, delivery: { values: ["draft"] } }} onComplete={complete} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Choose delivery");
    expect(screen.getByRole("checkbox", { name: "Draft" })).toBeChecked();
    rerender(<Questionnaire questions={questions} defaultStep={0} defaultAnswers={{}} onComplete={complete} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Choose delivery");
    expect(screen.getByRole("checkbox", { name: "Draft" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("checkbox", { name: "Search" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Code" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Search" }));
    expect(screen.getByRole("checkbox", { name: "Search" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Search" }));
    expect(screen.getByRole("checkbox", { name: "Search" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Code" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(complete).toHaveBeenCalledExactlyOnceWith({ tools: { values: ["search"] }, delivery: { values: ["draft"] } });
  });

  it.each([75, 180, 420])("advances a single choice at the configured %ims boundary, never earlier", delay => {
    vi.useFakeTimers();
    const step = vi.fn();
    const complete = vi.fn();
    render(<Questionnaire questions={questions} select="single" advanceDelay={delay} onStepChange={step} onComplete={complete} />);
    fireEvent.click(screen.getByRole("radio", { name: "Search" }));
    act(() => vi.advanceTimersByTime(delay - 1));
    expect(screen.getByRole("heading")).toHaveTextContent("Choose tools");
    expect(step).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("heading")).toHaveTextContent("Choose delivery");
    expect(step).toHaveBeenCalledExactlyOnceWith(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(step).toHaveBeenCalledTimes(1);
    expect(complete).not.toHaveBeenCalled();
  });

  it("submits freeform-only QuestionValue with trimmed text and rejects empty or disabled submission", () => {
    expectTypeOf<Parameters<NonNullable<ComponentProps<typeof Question>["onSubmit"]>>[0]>().toEqualTypeOf<QuestionValue>();
    const submit = vi.fn<(value: QuestionValue) => void>();
    const { container, rerender } = render(<Question onSubmit={submit}><QuestionInput aria-label="Written answer" /><QuestionSubmit /></Question>);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Explain the result  " } });
    expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(submit).toHaveBeenCalledExactlyOnceWith({ selectedValues: [], text: "Explain the result" });
    expect(screen.getByRole("textbox")).toHaveValue("  Explain the result  ");
    rerender(<Question disabled onSubmit={submit}><QuestionInput aria-label="Written answer" /><QuestionSubmit /></Question>);
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("keeps typed freeform QuestionValue host-owned until the requested edit is admitted", () => {
    const value: QuestionValue = { selectedValues: [], text: "Original" };
    const change = vi.fn<(next: QuestionValue) => void>();
    const submit = vi.fn<(response: QuestionValue) => void>();
    const { rerender } = render(<Question value={value} onValueChange={change} onSubmit={submit}><QuestionInput aria-label="Written answer" /><QuestionSubmit /></Question>);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Revised  " } });
    expect(change).toHaveBeenCalledExactlyOnceWith({ selectedValues: [], text: "  Revised  " });
    expect(screen.getByRole("textbox")).toHaveValue("Original");
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(submit).toHaveBeenLastCalledWith({ selectedValues: [], text: "Original" });
    rerender(<Question value={{ selectedValues: [], text: "  Revised  " }} onValueChange={change} onSubmit={submit}><QuestionInput aria-label="Written answer" /><QuestionSubmit /></Question>);
    expect(screen.getByRole("textbox")).toHaveValue("  Revised  ");
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenLastCalledWith({ selectedValues: [], text: "Revised" });
    expect(value).toEqual({ selectedValues: [], text: "Original" });
  });

  it("replaces a failed settings artwork source without claiming image decoding", () => {
    const { rerender } = render(<SettingsModal isOpen planArtSrc="/first-plan.png" />);
    const first = screen.getByRole("img", { name: "Plan artwork" });
    expect(first.tagName).toBe("IMG");
    expect(first).toHaveAttribute("src", "/first-plan.png");
    fireEvent.error(first);
    expect(screen.getByRole("img", { name: "Plan artwork" })).toHaveAttribute("data-artwork", "native");
    rerender(<SettingsModal isOpen planArtSrc="/first-plan.png" />);
    expect(screen.getByRole("img", { name: "Plan artwork" })).toHaveAttribute("data-artwork", "native");
    rerender(<SettingsModal isOpen planArtSrc="/replacement-plan.png" />);
    const replacement = screen.getByRole("img", { name: "Plan artwork" });
    expect(replacement.tagName).toBe("IMG");
    expect(replacement).toHaveAttribute("src", "/replacement-plan.png");
    expect(replacement).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(replacement).not.toHaveAttribute("data-artwork", "native");
    rerender(<SettingsModal isOpen />);
    expect(screen.getByRole("img", { name: "Plan artwork" })).toHaveAttribute("data-artwork", "native");
  });

  it.each([undefined, false])("keeps task disclosures open through task and run completion with collapseOnComplete=%s", collapseOnComplete => {
    const tasks = [{ id: "first", label: "Inspect sources", steps: [{ label: "Read reference" }] }, { id: "second", label: "Write findings", steps: [{ label: "Draft result" }] }];
    const complete = vi.fn();
    const { container, rerender } = render(<TaskList tasks={tasks} revealed={1} collapseOnComplete={collapseOnComplete} onComplete={complete} />);
    const first = container.querySelector("details")!;
    expect(first).toHaveAttribute("open");
    rerender(<TaskList tasks={tasks} revealed={2} collapseOnComplete={collapseOnComplete} onComplete={complete} />);
    expect(first).toHaveAttribute("open");
    expect(complete).not.toHaveBeenCalled();
    rerender(<TaskList tasks={tasks} revealed={4} collapseOnComplete={collapseOnComplete} onComplete={complete} />);
    expect(container.querySelectorAll("details[open]")).toHaveLength(2);
    expect(complete).toHaveBeenCalledTimes(1);
    fireEvent.click(within(first).getByText("Inspect sources"));
    expect(first).not.toHaveAttribute("open");
    rerender(<TaskList tasks={tasks} revealed={4} collapseOnComplete={collapseOnComplete} onComplete={complete} />);
    expect(first).not.toHaveAttribute("open");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("removes and restores the search working indicator while rows are still pending", () => {
    const steps = [{ label: "Find references" }, { label: "Read references" }];
    const complete = vi.fn();
    const { rerender } = render(<WebSearch steps={steps} revealed={1} onComplete={complete} />);
    const row = screen.getByText("Find references");
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    expect(screen.getByRole("status").querySelector('[aria-hidden="true"]')).not.toBeNull();
    rerender(<WebSearch steps={steps} revealed={1} working={false} onComplete={complete} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Find references")).toBe(row);
    expect(screen.queryByText("Read references")).not.toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
    rerender(<WebSearch steps={steps} revealed={1} onComplete={complete} />);
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    rerender(<WebSearch steps={steps} revealed={2} onComplete={complete} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Read references")).toBeInTheDocument();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("keeps root and per-step search queries separate, literal and replaceable", () => {
    const { container, rerender } = render(<WebSearch query="root query" steps={[{ label: "Find references", query: '<script>alert("query")</script>' }]} revealed={1} />);
    expect(container.querySelector("header code")).toHaveTextContent("root query");
    expect(container.querySelector("q")).toHaveTextContent('<script>alert("query")</script>');
    expect(container.querySelector("script")).toBeNull();
    rerender(<WebSearch query="revised root" steps={[{ label: "Find references", query: "revised step" }]} revealed={1} />);
    expect(container.querySelector("header code")).toHaveTextContent("revised root");
    expect(container.querySelector("q")).toHaveTextContent("revised step");
    rerender(<WebSearch steps={[{ label: "Find references" }]} revealed={1} />);
    expect(container.querySelector("header code")).toBeNull();
    expect(container.querySelector("q")).toBeNull();
    expect(screen.getByText("Find references")).toBeInTheDocument();
  });

  it("uses recognized site marks, host fallback icons and default globe without changing source identity", () => {
    const sources = [
      { title: "Known", domain: "github.com", href: "https://github.com/", brand: "github" },
      { title: "Unknown", domain: "example.com", href: "https://example.com/", brand: "unrecognized" },
      { title: "No brand", domain: "example.org", href: "https://example.org/" },
      { title: "Host icon", domain: "example.net", href: "https://example.net/", brand: "unrecognized", icon: <span>Host fallback</span> }
    ];
    const { container, rerender } = render(<WebSearch steps={[{ label: "Read site", brand: "github", sources }]} revealed={2} />);
    const known = screen.getByRole("link", { name: "Known · github.com" });
    const knownMark = known.querySelector(".hk-trail-site-mark")!;
    expect(knownMark).toHaveAttribute("data-brand", "github");
    expect(knownMark.querySelector("svg path")).not.toBeNull();
    expect(container.querySelector('.hk-trail-row > [data-brand="github"] svg')).not.toBeNull();
    const unknown = screen.getByRole("link", { name: "Unknown · example.com" }).querySelector(".hk-trail-site-mark")!;
    const absent = screen.getByRole("link", { name: "No brand · example.org" }).querySelector(".hk-trail-site-mark")!;
    expect(unknown).not.toHaveAttribute("data-brand");
    expect(unknown.querySelector("svg")).not.toBeNull();
    expect(unknown.innerHTML).toBe(absent.innerHTML);
    expect(knownMark.innerHTML).not.toBe(unknown.innerHTML);
    expect(screen.getByRole("link", { name: "Host icon · example.net" })).toHaveTextContent("Host fallback");
    expect(known).toHaveAttribute("href", "https://github.com/");
    rerender(<WebSearch steps={[{ label: "Read site", sources: [{ ...sources[0], brand: "unrecognized", icon: <span>Replacement mark</span> }] }]} revealed={2} />);
    const replacement = screen.getByRole("link", { name: "Known · github.com" });
    expect(replacement).toHaveAttribute("href", "https://github.com/");
    expect(replacement).toHaveTextContent("Replacement mark");
    expect(replacement.querySelector("[data-brand]")).toBeNull();
  });

  it.each(["task-list", "web-search"])("composes %s inside an assistant conversation message without replacing neighboring content", family => {
    const complete = vi.fn();
    const tree = (revealed: number) => <section role="log" aria-label="Conversation messages"><article aria-label="You"><input aria-label="Unsent draft" defaultValue="Keep my draft" /></article><article aria-label="Harso">{family === "task-list" ? <TaskList tasks={[{ id: "read", label: "Inspect request", steps: [{ label: "Finish inspection" }] }]} revealed={revealed} onComplete={complete} /> : <WebSearch steps={[{ label: "Inspect request" }, { label: "Finish inspection" }]} revealed={revealed} onComplete={complete} />}</article></section>;
    const { rerender } = render(tree(1));
    const log = screen.getByRole("log", { name: "Conversation messages" });
    const assistant = within(log).getByRole("article", { name: "Harso" });
    const draft = within(log).getByRole("textbox", { name: "Unsent draft" });
    fireEvent.change(draft, { target: { value: "Edited but unsent" } });
    expect(within(assistant).getByText("Inspect request")).toBeInTheDocument();
    expect(within(assistant).queryByText("Finish inspection")).not.toBeInTheDocument();
    rerender(tree(2));
    expect(screen.getByRole("article", { name: "Harso" })).toBe(assistant);
    expect(within(assistant).getByText("Finish inspection")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Unsent draft" })).toBe(draft);
    expect(draft).toHaveValue("Edited but unsent");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("selects the supplied yearly line-chart period and replaces inspected monthly data", () => {
    const change = vi.fn();
    render(<LineChartCard title="Requests" ranges={[{ id: "monthly", label: "Monthly", data: [{ label: "January", value: 3 }] }, { id: "yearly", label: "Yearly", data: [{ label: "2025", value: 40 }, { label: "2026", value: 60 }] }]} onRangeChange={change} />);
    fireEvent.focus(screen.getByRole("button", { name: /Inspect January/ }));
    expect(screen.getByRole("status")).toHaveTextContent("January");
    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("yearly");
    expect(screen.getByRole("button", { name: "Yearly" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: /Inspect January/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent("January");
    fireEvent.focus(screen.getByRole("button", { name: /Inspect 2026/ }));
    expect(screen.getByRole("status")).toHaveTextContent("2026");
    expect(screen.getByRole("status")).toHaveTextContent("Requests: 60");
  });

  it.each(["area", "combo"])("updates %s cursor and series inspection state on pointer entry and clears on leave", family => {
    const data = [{ label: "January", value: 20, secondary: 2 }, { label: "February", value: 60, secondary: 4 }];
    const { container } = render(family === "area" ? <AreaChartCard title="Traffic" data={data} /> : <ComboChartCard title="Traffic" data={data} />);
    expect(container.querySelector(".hk-interactive-cursor")).toBeNull();
    fireEvent.pointerEnter(container.querySelector('[data-inspect="0"]')!);
    expect(screen.getByRole("status")).toHaveTextContent("January");
    const firstCentre = family === "combo" ? "80" : "44"; // wave 2: combo endpoints are inset so the first and last bars sit inside the plot
    expect(container.querySelector(".hk-interactive-cursor")).toHaveAttribute("d", `M${firstCentre} 20V184`);
    expect(container.querySelector(".hk-interactive-dot")).toHaveAttribute("cx", firstCentre);
    if (family === "combo") expect([...container.querySelectorAll(".hk-interactive-bar")].map(bar => bar.getAttribute("data-active"))).toEqual(["true", "false"]);
    fireEvent.pointerEnter(container.querySelector('[data-inspect="1"]')!);
    expect(screen.getByRole("status")).toHaveTextContent("February");
    expect(container.querySelector(".hk-interactive-cursor")).toHaveAttribute("d", "M396 20V184");
    expect(container.querySelector(".hk-interactive-dot")).toHaveAttribute("cx", "396");
    if (family === "combo") expect([...container.querySelectorAll(".hk-interactive-bar")].map(bar => bar.getAttribute("data-active"))).toEqual(["false", "true"]);
    fireEvent.pointerLeave(container.querySelector(".hk-interactive-plot")!);
    expect(container.querySelector(".hk-interactive-cursor")).toBeNull();
    expect(container.querySelector(".hk-interactive-dot")).toBeNull();
    expect(screen.getByRole("status")).not.toHaveTextContent("February");
    if (family === "combo") expect([...container.querySelectorAll(".hk-interactive-bar")].every(bar => !bar.hasAttribute("data-active"))).toBe(true);
  });
});
