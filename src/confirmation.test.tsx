import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Confirmation, ConfirmationAccepted, ConfirmationAction, ConfirmationActions, ConfirmationRejected, ConfirmationRequest, ConfirmationTitle } from "./confirmation";

describe("Confirmation", () => {
  it("never self-approves and follows host rejection, reset and absent approval", () => {
    const approve = vi.fn();
    const view = (state: string, approval?: { approved?: boolean }) => <Confirmation state={state} approval={approval}><ConfirmationRequest>Approval required</ConfirmationRequest><ConfirmationActions><ConfirmationAction onClick={approve}>Approve</ConfirmationAction><ConfirmationAction disabled onClick={approve}>Unavailable</ConfirmationAction></ConfirmationActions><ConfirmationAccepted>Approved</ConfirmationAccepted><ConfirmationRejected>Rejected</ConfirmationRejected></Confirmation>;
    const { rerender } = render(view("approval-requested", {}));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
    expect(approve).toHaveBeenCalledOnce();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    expect(screen.getByText("Approval required")).toBeVisible();
    rerender(view("approval-responded", { approved: false }));
    expect(screen.getByText("Rejected")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(view("approval-responded", { approved: true }));
    expect(screen.getByText("Approved")).toBeVisible();
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    rerender(view("approval-requested", {}));
    expect(screen.getByText("Approval required")).toBeVisible();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    rerender(view("approval-requested"));
    expect(screen.queryByText("Approval required")).not.toBeInTheDocument();
  });
  it("presents an approval request without owning the decision", () => {
    render(<Confirmation approval={{ id: "approval-1" }} state="approval-requested"><ConfirmationTitle>Delete file?</ConfirmationTitle><ConfirmationRequest>Approval required.</ConfirmationRequest><ConfirmationActions><ConfirmationAction onClick={() => undefined}>Approve</ConfirmationAction></ConfirmationActions><ConfirmationAccepted>Approved.</ConfirmationAccepted></Confirmation>);
    expect(screen.getByText("Approval required.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.queryByText("Approved.")).not.toBeInTheDocument();
  });
});
