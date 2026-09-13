import { useState } from "react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import "./tool-call.css";

export type HarsoApprovalProps = {
  approval?: ToolCallMessagePartProps["approval"];
  onDecide: (id: string, approved: boolean) => void | Promise<void>;
};

export function HarsoApproval({ approval, onDecide }: HarsoApprovalProps) {
  if (!approval) return null;
  return <ApprovalDecision key={approval.id} approval={approval} onDecide={onDecide} />;
}

function ApprovalDecision({ approval, onDecide }: HarsoApprovalProps & { approval: NonNullable<HarsoApprovalProps["approval"]> }) {
  const [decision, setDecision] = useState<boolean>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const approved = approval.approved ?? decision;
  async function decide(value: boolean) {
    setPending(true);
    setError("");
    try {
      await onDecide(approval.id, value);
      setDecision(value);
    } catch {
      setError("Decision could not be saved. Try again.");
    } finally {
      setPending(false);
    }
  }
  return <div className="hkc-approval">
    {approval.prompt && <p>{approval.prompt}</p>}
    {approval.resolution ? <p role="status">Approval {approval.resolution}</p> : approved !== undefined ? <p role="status">{approved ? "Approved" : "Denied"}</p> : <div className="hkc-approval-actions">
      <button type="button" disabled={pending} onClick={() => void decide(false)}>Deny</button>
      <button type="button" className="hkc-approval-primary" disabled={pending} onClick={() => void decide(true)}>Approve</button>
    </div>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
