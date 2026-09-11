import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Question, QuestionInput, QuestionOption, QuestionSubmit } from "./question";

describe("Question action admission", () => {
  it("rejects disabled form submission and input changes at the central boundary", () => {
    const submit = vi.fn();
    const change = vi.fn();
    const { container, rerender } = render(<Question disabled defaultValue={{ selectedValues: ["yes"], text: "Original" }} onSubmit={submit} onValueChange={change}><QuestionInput aria-label="Response" /><QuestionSubmit /></Question>);
    fireEvent.submit(container.querySelector("form")!);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Changed" } });
    expect(submit).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    rerender(<Question onSubmit={submit} onValueChange={change}><QuestionInput aria-label="Response" /><QuestionSubmit /></Question>);
    expect(screen.getByRole("textbox")).toHaveValue("Original");
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).toHaveBeenCalledWith({ selectedValues: ["yes"], text: "Original" });
  });
  it("honors prevented option and input handlers before changing local state", () => {
    const change = vi.fn();
    render(<Question onValueChange={change}><QuestionOption value="yes" onClick={event => event.preventDefault()}>Yes</QuestionOption><QuestionInput aria-label="Response" onChange={event => event.preventDefault()} /></Question>);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Blocked" } });
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("rejects capture-prevented submissions and child-disabled input mutations", () => {
    const submit = vi.fn();
    const change = vi.fn();
    const { container } = render(<Question defaultValue={{ selectedValues: ["yes"], text: "" }} onSubmit={submit} onValueChange={change} onSubmitCapture={event => event.preventDefault()}><QuestionInput aria-label="Response" disabled /><QuestionSubmit /></Question>);
    fireEvent.submit(container.querySelector("form")!);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Blocked" } });
    expect(submit).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
  it("preserves controlled refusal, multiple toggling, trimmed submission and empty rejection", () => {
    const change = vi.fn();
    const submit = vi.fn();
    const { container, rerender } = render(<Question value={{ selectedValues: [], text: "" }} onValueChange={change} onSubmit={submit}><QuestionOption value="yes">Yes</QuestionOption><QuestionSubmit /></Question>);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(change).toHaveBeenCalledWith({ selectedValues: ["yes"], text: "" });
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).not.toHaveBeenCalled();
    rerender(<Question selectionMode="multiple" onSubmit={submit}><QuestionOption value="yes">Yes</QuestionOption><QuestionOption value="no">No</QuestionOption><QuestionInput aria-label="Response" /><QuestionSubmit /></Question>);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Explain  " } });
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).toHaveBeenCalledWith({ selectedValues: ["no"], text: "Explain" });
  });
});
