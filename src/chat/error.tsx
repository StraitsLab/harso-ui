import { ActionBarPrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowsClockwise, WarningCircle, Stop } from "@phosphor-icons/react";
import "./error.css";

export function HarsoMessageError() {
  const status = useAuiState(state => state.message.status);
  if (status?.type !== "incomplete" || status.reason !== "error") return null;
  const message = typeof status.error === "string" ? status.error : status.error instanceof Error ? status.error.message : "Something went wrong. Please try again.";
  return <div className="hkc-message-error" role="alert"><WarningCircle size={16} aria-hidden="true" /><span>{message}</span><ActionBarPrimitive.Reload><ArrowsClockwise size={16} aria-hidden="true" />Retry</ActionBarPrimitive.Reload></div>;
}

export function HarsoStoppedRun() {
  const status = useAuiState(state => state.message.status);
  if (status?.type !== "incomplete" || status.reason !== "cancelled") return null;
  return <p className="hkc-stopped-run" role="status"><Stop size={16} aria-hidden="true" />Stopped by you</p>;
}
