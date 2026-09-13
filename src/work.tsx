import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode, type RefObject } from "react";
import { Button, type ButtonProps } from "./primitives";
import { MessageResponse, Shimmer } from "./text-effects";
import { Tooltip } from "./navigation";

type DivProps = ComponentPropsWithRef<"div">;
export type WorkDisclosureProps = DivProps & { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; disabled?: boolean; isStreaming?: boolean; duration?: number };
type WorkState = { kind: string; identity: string; isOpen: boolean; setIsOpen: (open: boolean) => void; disabled: boolean; isStreaming: boolean; duration?: number; trigger: RefObject<HTMLButtonElement | null>; content: RefObject<HTMLDivElement | null> };
const WorkContext = createContext<WorkState | null>(null);

function useWork() {
  const state = useContext(WorkContext);
  if (!state) throw new Error("Work parts require their Plan, Task or Reasoning root.");
  return state;
}

function WorkDisclosure({ kind, open, defaultOpen = false, onOpenChange, disabled = false, isStreaming = false, duration, children, ref, className = "", ...props }: WorkDisclosureProps & { kind: string }) {
  const identity = useId();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = open ?? localOpen;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);
  const previousOpen = useRef(isOpen);
  useEffect(() => {
    lastFocused.current = document.activeElement;
    const record = (event: FocusEvent) => { lastFocused.current = event.target instanceof Element ? event.target : null; };
    document.addEventListener("focusin", record);
    return () => document.removeEventListener("focusin", record);
  }, []);
  useLayoutEffect(() => {
    if (previousOpen.current && !isOpen && content.current?.contains(lastFocused.current) && (document.activeElement === document.body || content.current.contains(document.activeElement)) && !root.current?.closest("[hidden]")) {
      if (trigger.current && !trigger.current.disabled) trigger.current.focus();
      else root.current?.focus();
    }
    previousOpen.current = isOpen;
  }, [isOpen]);
  const setIsOpen = (next: boolean) => {
    if (disabled || next === isOpen) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  return <WorkContext value={{ kind, identity, isOpen, setIsOpen, disabled, isStreaming, duration: !isStreaming && Number.isFinite(duration) && duration! >= 0 ? duration : undefined, trigger, content }}><div {...props} ref={node => { root.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }} tabIndex={props.tabIndex ?? -1} className={`hk-work hk-${kind} ${className}`} data-streaming={isStreaming || undefined}>{children}</div></WorkContext>;
}

function WorkTrigger({ children, disabled, className = "", ref, onClick, ...props }: ButtonProps) {
  const work = useWork();
  return <Button {...props} ref={node => { work.trigger.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }} type="button" className={`hk-work-trigger ${className}`} disabled={disabled || work.disabled} id={`${work.identity}-trigger`} aria-controls={`${work.identity}-content`} aria-expanded={work.isOpen} onClick={event => { onClick?.(event); if (!event.defaultPrevented) work.setIsOpen(!work.isOpen); }}><span className="hk-work-trigger-label">{children}</span><span className="hk-work-chevron" aria-hidden="true">⌄</span></Button>;
}

function WorkContent({ children, className = "", ref, ...props }: Omit<DivProps, "id" | "hidden">) {
  const work = useWork();
  return <div {...props} ref={node => { work.content.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }} id={`${work.identity}-content`} hidden={!work.isOpen} className={`hk-work-content ${className}`}>{children}</div>;
}

export function Plan(props: WorkDisclosureProps) {
  return <WorkDisclosure {...props} kind="plan" />;
}

export function PlanHeader({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-plan-header ${className}`} />;
}

export function PlanTitle({ children, className = "", ...props }: ComponentPropsWithRef<"h3">) {
  const { isStreaming } = useWork();
  return <h3 {...props} className={`hk-plan-title ${className}`}><Shimmer active={isStreaming}>{children}</Shimmer></h3>;
}

export function PlanDescription({ children, className = "", ...props }: ComponentPropsWithRef<"p">) {
  const { isStreaming } = useWork();
  return <p {...props} className={`hk-plan-description ${className}`}><Shimmer active={isStreaming}>{children}</Shimmer></p>;
}

export function PlanTrigger({ children = "Plan details", ...props }: ButtonProps) {
  return <WorkTrigger {...props}>{children}</WorkTrigger>;
}

export function PlanContent(props: Omit<DivProps, "id" | "hidden">) {
  return <WorkContent {...props} />;
}

export function PlanFooter({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-plan-footer ${className}`} />;
}

export function PlanAction({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-plan-action ${className}`} />;
}

export function Task(props: WorkDisclosureProps) {
  return <WorkDisclosure {...props} kind="task" />;
}

export function TaskTrigger({ title, status, children, ...props }: ButtonProps & { title: string; status?: ReactNode }) {
  return <WorkTrigger {...props}><span>{children ?? title}</span>{status && <span className="hk-task-summary">{status}</span>}</WorkTrigger>;
}

export function TaskContent(props: Omit<DivProps, "id" | "hidden">) {
  return <WorkContent role="list" {...props} />;
}

export function TaskItem({ children, status, icon = "·", className = "", ...props }: DivProps & { status?: ReactNode; icon?: ReactNode }) {
  return <div {...props} role="listitem" className={`hk-task-item ${className}`}><span className="hk-task-icon" aria-hidden="true">{icon}</span><div className="hk-task-item-content">{children}</div>{status && <span className="hk-task-item-status">{status}</span>}</div>;
}

export function TaskItemFile({ children, icon = "↳", className = "", ...props }: ComponentPropsWithRef<"span"> & { icon?: ReactNode }) {
  return <span {...props} className={`hk-task-file ${className}`}><span aria-hidden="true">{icon}</span>{children}</span>;
}

export function Reasoning(props: WorkDisclosureProps) {
  return <WorkDisclosure {...props} kind="reasoning" />;
}

export function useReasoning() {
  const work = useWork();
  if (work.kind !== "reasoning") throw new Error("useReasoning requires Reasoning.");
  return { isStreaming: work.isStreaming, isOpen: work.isOpen, setIsOpen: work.setIsOpen, duration: work.duration };
}

export function ReasoningTrigger({ children, getThinkingMessage, ...props }: ButtonProps & { getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode }) {
  const { isStreaming, duration } = useReasoning();
  const label = isStreaming ? "Working" : duration === undefined ? "Progress summary" : `Progress summary · ${duration}s`;
  return <WorkTrigger {...props}>{children ?? getThinkingMessage?.(isStreaming, duration) ?? <Shimmer active={isStreaming}>{label}</Shimmer>}</WorkTrigger>;
}

export function ReasoningContent({ children, ...props }: Omit<DivProps, "id" | "hidden" | "children" | "dangerouslySetInnerHTML"> & { children: string }) {
  const { isStreaming } = useReasoning();
  return <WorkContent {...props}><MessageResponse streaming={isStreaming}>{children}</MessageResponse></WorkContent>;
}

export function Checkpoint({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-checkpoint ${className}`} />;
}

export function CheckpointIcon({ children = "◇", className = "", ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} aria-hidden="true" className={`hk-checkpoint-icon ${className}`}>{children}</span>;
}

export function CheckpointTrigger({ tooltip, className = "", children = "Review checkpoint", ...props }: ButtonProps & { tooltip?: string }) {
  const button = <Button {...props} type="button" className={`hk-checkpoint-trigger ${className}`}>{children}</Button>;
  return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button;
}
