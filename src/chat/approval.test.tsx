import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { HarsoApproval } from "./approval";

describe("HarsoApproval", () => {
  test.each([["Allow once", true, "Approved"], ["Deny", false, "Denied"]] as const)("%s records the decision", async (label, value, decision) => {
    const onDecide = vi.fn();
    render(<HarsoApproval approval={{ id: "approval", prompt: "Run checks?" }} onDecide={onDecide} />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(onDecide).toHaveBeenCalledExactlyOnceWith("approval", value);
    expect(await screen.findByRole("status")).toHaveTextContent(decision);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  test("failed decisions remain retryable", async () => {
    const onDecide = vi.fn().mockRejectedValue(new Error("offline"));
    render(<HarsoApproval approval={{ id: "approval" }} onDecide={onDecide} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow once" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    await waitFor(() => expect(screen.getByRole("button", { name: "Allow once" })).toBeEnabled());
  });
  test("a new request resets the decision; expired requests have no controls", async () => {
    const view = render(<HarsoApproval approval={{ id: "first" }} onDecide={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow once" }));
    await screen.findByText("Approved");
    view.rerender(<HarsoApproval approval={{ id: "second" }} onDecide={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Allow once" })).toBeEnabled();
    view.rerender(<HarsoApproval approval={{ id: "second", resolution: "expired" }} onDecide={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("expired");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
