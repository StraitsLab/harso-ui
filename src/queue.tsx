import { useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "./primitives";
export type QueueMessagePart = { type: string; text?: string; url?: string; filename?: string; mediaType?: string };
export type QueueMessage = { id: string; parts: QueueMessagePart[] };
export type QueueTodo = { id: string; title: string; description?: string; status?: "pending" | "completed" };
export function Queue({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-queue ${className}`} />; }
export function QueueSection({ defaultOpen = true, open, onOpenChange, onToggle, className = "", children, ...props }: Omit<ComponentPropsWithRef<"details">, "open"> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const current = open ?? localOpen;
  return <details {...props} open={current} className={`hk-queue-section ${className}`} onToggle={event => {
    const next = event.currentTarget.open;
    if (open !== undefined) event.currentTarget.open = open;
    onToggle?.(event);
    if (next === current) return;
    if (event.defaultPrevented) { event.currentTarget.open = current; return; }
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  }}>{children}</details>;
}
export function QueueSectionTrigger({ className = "", ...props }: ComponentPropsWithRef<"summary">) { return <summary {...props} className={`hk-queue-section-trigger ${className}`} />; }
export function QueueSectionLabel({ label, count, icon, className = "", ...props }: ComponentPropsWithRef<"span"> & { label: string; count?: number; icon?: ReactNode }) { return <span {...props} className={`hk-queue-section-label ${className}`}>{icon}{count !== undefined && <span>{count}</span>}{label}</span>; }
export function QueueSectionContent({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-queue-section-content ${className}`} />; }
export function QueueList({ className = "", ...props }: ComponentPropsWithRef<"ul">) { return <ul {...props} className={`hk-queue-list ${className}`} />; }
export function QueueItem({ className = "", ...props }: ComponentPropsWithRef<"li">) { return <li {...props} className={`hk-queue-item ${className}`} />; }
export function QueueItemIndicator({ completed = false, className = "", ...props }: ComponentPropsWithRef<"span"> & { completed?: boolean }) { return <span {...props} className={`hk-queue-indicator ${completed ? "hk-queue-indicator--completed" : ""} ${className}`} aria-label={completed ? "Completed" : "Pending"}>{completed ? "✓" : "·"}</span>; }
export function QueueItemContent({ completed = false, className = "", ...props }: ComponentPropsWithRef<"span"> & { completed?: boolean }) { return <span {...props} className={`hk-queue-item-content ${completed ? "hk-queue-item-content--completed" : ""} ${className}`} />; }
export function QueueItemDescription({ completed = false, className = "", ...props }: ComponentPropsWithRef<"div"> & { completed?: boolean }) { return <div {...props} className={`hk-queue-item-description ${completed ? "hk-queue-item-description--completed" : ""} ${className}`} />; }
export function QueueItemActions({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-queue-item-actions ${className}`} />; }
export function QueueItemAction({ className = "", ...props }: ButtonProps) { return <Button {...props} size="small" className={`hk-queue-item-action ${className}`} />; }
export function QueueItemAttachment({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-queue-item-attachment ${className}`} />; }
export function QueueItemImage({ className = "", ...props }: ComponentPropsWithRef<"img">) { return <img {...props} className={`hk-queue-item-image ${className}`} />; }
export function QueueItemFile({ name, className = "", ...props }: ComponentPropsWithRef<"div"> & { name?: string }) { return <div {...props} className={`hk-queue-item-file ${className}`}>{name ?? props.children}</div>; }
