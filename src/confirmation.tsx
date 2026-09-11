import { createContext, useContext, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "./primitives";

type ConfirmationState = { state: string; approved?: boolean };
const ConfirmationValue = createContext<ConfirmationState | null>(null);
function useConfirmation() { const value = useContext(ConfirmationValue); if (!value) throw new Error("Confirmation parts require Confirmation."); return value; }
export type ConfirmationProps = ComponentPropsWithRef<"section"> & { approval?: { approved?: boolean; id?: string }; state: string };
export function Confirmation({ approval, state, children, className = "", ...props }: ConfirmationProps) { if (!approval) return null; return <ConfirmationValue value={{ state, approved: approval.approved }}><section {...props} className={`hk-confirmation hk-confirmation--${state} ${className}`} data-state={state}>{children}</section></ConfirmationValue>; }
export function ConfirmationTitle({ className = "", ...props }: ComponentPropsWithRef<"h3">) { return <h3 {...props} className={`hk-confirmation-title ${className}`} />; }
export function ConfirmationRequest({ children }: { children?: ReactNode }) { const value = useConfirmation(); return value.state === "approval-requested" ? <div className="hk-confirmation-request">{children}</div> : null; }
export function ConfirmationAccepted({ children }: { children?: ReactNode }) { const value = useConfirmation(); return value.approved && ["approval-responded", "output-denied", "output-available"].includes(value.state) ? <div className="hk-confirmation-accepted">{children}</div> : null; }
export function ConfirmationRejected({ children }: { children?: ReactNode }) { const value = useConfirmation(); return value.approved === false && ["approval-responded", "output-denied", "output-available"].includes(value.state) ? <div className="hk-confirmation-rejected">{children}</div> : null; }
export function ConfirmationActions({ className = "", ...props }: ComponentPropsWithRef<"div">) { const value = useConfirmation(); return value.state === "approval-requested" ? <div {...props} role="group" className={`hk-confirmation-actions ${className}`} /> : null; }
export function ConfirmationAction({ className = "", ...props }: ButtonProps) { return <Button {...props} size="small" className={`hk-confirmation-action ${className}`} />; }
