import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Questionnaire } from "./questionnaire";

const questions = [
  { id: "tools", question: "Choose tools", options: [{ value: "search", label: "Search" }, { value: "code", label: "Code" }], other: true },
  { id: "delivery", question: "Choose delivery", options: [{ value: "draft", label: "Draft" }] }
];

afterEach(() => vi.useRealTimers());
describe("Questionnaire", () => {
  it("clicking a retained single choice advances again", () => {
    vi.useFakeTimers();
    render(<Questionnaire questions={questions} select="single" />);
    fireEvent.click(screen.getByLabelText("Search"));
    act(() => vi.advanceTimersByTime(180));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByText("Search"));
    act(() => vi.advanceTimersByTime(180));
    expect(screen.getByRole("heading")).toHaveTextContent("Choose delivery");
  });
  it("a superseded admitted choice never revives an old advance intent", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const common = { questions, select: "single" as const, step: 0, onStepChange: change };
    const { rerender } = render(<Questionnaire {...common} answers={{}} />);
    fireEvent.click(screen.getByLabelText("Search"));
    rerender(<Questionnaire {...common} answers={{ tools: { values: ["search"] } }} />);
    act(() => vi.advanceTimersByTime(90));
    rerender(<Questionnaire {...common} answers={{ tools: { values: ["code"] } }} />);
    act(() => vi.advanceTimersByTime(250));
    rerender(<Questionnaire {...common} answers={{ tools: { values: ["search"] } }} />);
    act(() => vi.advanceTimersByTime(180));
    expect(change).not.toHaveBeenCalled();
  });
  it("retains choices across steps and emits values in option order", () => {
    const complete = vi.fn();
    render(<Questionnaire questions={questions} onComplete={complete} />);
    fireEvent.click(screen.getByLabelText("Code"));
    fireEvent.click(screen.getByLabelText("Search"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByLabelText("Search")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Step 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(complete).toHaveBeenCalledWith({ tools: { values: ["search", "code"] }, delivery: { values: [] } });
  });
  it("advances a single choice after the delay, not before", () => {
    vi.useFakeTimers();
    render(<Questionnaire questions={questions} select="single" />);
    fireEvent.click(screen.getByLabelText("Search"));
    act(() => vi.advanceTimersByTime(179));
    expect(screen.getByText("Choose tools")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("Choose delivery")).toBeInTheDocument();
  });
  it("does not advance when a controlled answer is refused", () => {
    vi.useFakeTimers();
    const step = vi.fn();
    render(<Questionnaire questions={questions} select="single" answers={{}} onStepChange={step} />);
    fireEvent.click(screen.getByLabelText("Search"));
    act(() => vi.advanceTimersByTime(1000));
    expect(step).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Search")).not.toBeChecked();
  });
  it("selects Other by typing but waits for Enter in single mode", () => {
    vi.useFakeTimers();
    const complete = vi.fn();
    render(<Questionnaire questions={[questions[0]]} select="single" onComplete={complete} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Research" } });
    act(() => vi.advanceTimersByTime(1000));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(complete).toHaveBeenCalledWith({ tools: { values: [], other: "Research" } });
  });
  it("cancels pending advance on manual navigation", () => {
    vi.useFakeTimers();
    const complete = vi.fn();
    render(<Questionnaire questions={questions} select="single" onComplete={complete} />);
    fireEvent.click(screen.getByLabelText("Search"));
    fireEvent.click(screen.getByRole("button", { name: "Step 2" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByText("Choose delivery")).toBeInTheDocument();
  });
  it("rejects duplicate IDs instead of aliasing answers", () => {
    render(<Questionnaire questions={[questions[0], questions[0]]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid questionnaire");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
  it("ignores digit shortcuts in free text and outside the questionnaire", () => {
    render(<Questionnaire questions={questions} select="single" />);
    fireEvent.keyDown(document.body, { key: "1" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "1" });
    expect(screen.getByLabelText("Search")).not.toBeChecked();
    fireEvent.keyDown(screen.getByLabelText("Search"), { key: "2" });
    expect(screen.getByLabelText("Code")).toBeChecked();
  });
  it("cancels selection advance when disabled and does not revive it", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Questionnaire questions={questions} select="single" />);
    fireEvent.click(screen.getByLabelText("Search"));
    rerender(<Questionnaire questions={questions} select="single" disabled />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(<Questionnaire questions={questions} select="single" />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Choose tools")).toBeInTheDocument();
  });
  it("handles empty questions and prototype-like question IDs safely", () => {
    const complete = vi.fn();
    const { rerender } = render(<Questionnaire questions={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No questions");
    rerender(<Questionnaire questions={[{ ...questions[0], id: "__proto__" }]} onComplete={complete} />);
    fireEvent.click(screen.getByLabelText("Code"));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(Object.hasOwn(complete.mock.calls[0][0], "__proto__")).toBe(true);
    expect(complete.mock.calls[0][0].__proto__.values).toEqual(["code"]);
  });
  it("emits only one step request when a controlled step is refused", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    render(<Questionnaire questions={questions} select="single" step={0} onStepChange={change} />);
    fireEvent.click(screen.getByLabelText("Search"));
    act(() => vi.advanceTimersByTime(180));
    act(() => vi.advanceTimersByTime(1000));
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith(1);
    expect(screen.getByText("Choose tools")).toBeInTheDocument();
  });
  it("accepts delayed controlled answers and does not auto-advance seeded selections", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const { rerender } = render(<Questionnaire questions={questions} select="single" answers={{}} onStepChange={change} />);
    fireEvent.click(screen.getByLabelText("Search"));
    act(() => vi.advanceTimersByTime(500));
    expect(change).not.toHaveBeenCalled();
    rerender(<Questionnaire questions={questions} select="single" answers={{ tools: { values: ["search"] } }} onStepChange={change} />);
    act(() => vi.advanceTimersByTime(180));
    expect(change).toHaveBeenCalledTimes(1);
    rerender(<Questionnaire key="seed" questions={questions} select="single" defaultAnswers={{ tools: { values: ["search"] } }} onStepChange={change} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("cancels pending navigation on configuration replacement", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const { rerender } = render(<Questionnaire questions={questions} select="single" onStepChange={change} />);
    fireEvent.click(screen.getByLabelText("Search"));
    rerender(<Questionnaire questions={[{ ...questions[0], question: "Replacement question" }, questions[1]]} select="single" onStepChange={change} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(change).not.toHaveBeenCalled();
  });
});
