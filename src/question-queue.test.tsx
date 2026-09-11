import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Question, QuestionOption, QuestionSubmit } from "./question";
import { Queue, QueueItem, QueueItemIndicator, QueueList, QueueSection, QueueSectionTrigger, QueueSectionContent } from "./queue";

describe("Question and Queue", () => {
  it("keeps native disclosure host-controlled across refusal and reset", async () => {
    const changed = vi.fn();
    const view = (open: boolean) => <QueueSection open={open} onOpenChange={changed}><QueueSectionTrigger>Queued work</QueueSectionTrigger><QueueSectionContent>Pending task</QueueSectionContent></QueueSection>;
    const { rerender } = render(view(false));
    await userEvent.click(screen.getByText("Queued work"));
    await waitFor(() => expect(changed).toHaveBeenCalledWith(true));
    expect(screen.getByText("Queued work").closest("details")).not.toHaveAttribute("open");
    rerender(view(true));
    expect(screen.getByText("Queued work").closest("details")).toHaveAttribute("open");
    await userEvent.click(screen.getByText("Queued work"));
    await waitFor(() => expect(changed).toHaveBeenCalledWith(false));
    expect(screen.getByText("Queued work").closest("details")).toHaveAttribute("open");
  });

  it("retains an uncontrolled native toggle when the parent rerenders", async () => {
    const view = (label: string) => <QueueSection defaultOpen={false}><QueueSectionTrigger>{label}</QueueSectionTrigger></QueueSection>;
    const { rerender } = render(view("Queue"));
    await userEvent.click(screen.getByText("Queue"));
    rerender(view("Updated queue"));
    expect(screen.getByText("Updated queue").closest("details")).toHaveAttribute("open");
  });
  it("collects a host-owned choice and presents queue state", async () => {
    let response = "";
    render(<><Question onSubmit={value => { response = value.selectedValues[0] ?? ""; }}><QuestionOption value="yes">Yes</QuestionOption><QuestionSubmit /></Question><Queue><QueueList><QueueItem><QueueItemIndicator completed />Done</QueueItem></QueueList></Queue></>);
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(response).toBe("yes");
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
    expect(screen.getByRole("listitem").parentElement).toBe(screen.getByRole("list"));
  });
});
