import { createContext, useContext, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Badge, type ButtonProps } from "./primitives";
import { MessageAction, MessageResponse } from "./conversation";
import { Plan, PlanContent, PlanTrigger, type WorkDisclosureProps } from "./work";

type DivProps = ComponentPropsWithRef<"div">;
type AgentToolsState = { value: string | null; disabled: boolean; setValue: (value: string | null) => void };
const AgentToolsContext = createContext<AgentToolsState | null>(null);
export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type ToolState = "input-streaming" | "input-available" | "approval-requested" | "approval-responded" | "output-available" | "output-error" | "output-denied";
type ToolName = { type: `tool-${string}`; toolName?: string } | { type: "dynamic-tool"; toolName: string };
export type ToolPart = ToolName & { state: ToolState; input?: JsonValue; output?: ReactNode; errorText?: string };

export function getStatusBadge(state: string) {
  const statuses: Record<ToolState, { label: string; icon: string; tone: "neutral" | "positive" | "attention" | "negative" }> = {
    "input-streaming": { label: "Pending", icon: "·", tone: "neutral" },
    "input-available": { label: "Running", icon: "◌", tone: "neutral" },
    "approval-requested": { label: "Awaiting approval", icon: "!", tone: "attention" },
    "approval-responded": { label: "Responded", icon: "↵", tone: "neutral" },
    "output-available": { label: "Completed", icon: "✓", tone: "positive" },
    "output-error": { label: "Error", icon: "!", tone: "negative" },
    "output-denied": { label: "Denied", icon: "×", tone: "attention" },
  };
  const status = Object.hasOwn(statuses, state) ? statuses[state as ToolState] : { label: "Unknown status", icon: "?", tone: "neutral" as const };
  return <Badge tone={status.tone}><span aria-hidden="true">{status.icon}</span>{status.label}</Badge>;
}

export function Tool({ className = "", ...props }: WorkDisclosureProps) {
  return <Plan {...props} className={`hk-tool ${className}`} />;
}

export function ToolHeader({ type, toolName, state, title, children, ...props }: Omit<ButtonProps, "type" | "title"> & ToolName & { state: ToolState; title?: string }) {
  const name = title ?? toolName ?? (type.startsWith("tool-") ? type.slice(5) : "Tool");
  return <h3 className="hk-tool-heading"><PlanTrigger {...props}><span className="hk-activity-name">{children ?? (name || "Tool")}</span>{getStatusBadge(state)}</PlanTrigger></h3>;
}

export function ToolContent(props: Omit<DivProps, "id" | "hidden">) {
  return <PlanContent {...props} />;
}

export function ToolInput({ input, label = "Input", className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { input?: JsonValue; label?: string }) {
  let text: string;
  try { text = input === undefined ? "No input supplied." : JSON.stringify(input, null, 2) ?? "Input cannot be displayed as JSON."; }
  catch { text = "Input cannot be displayed as JSON."; }
  return <div {...props} className={`hk-activity-section ${className}`}><h4>{label}</h4><pre className="hk-activity-code"><code>{text}</code></pre></div>;
}

export function ToolOutput({ output, errorText, className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { output?: ReactNode; errorText?: string }) {
  if (output == null && errorText === undefined) return null;
  return <div {...props} className={`hk-activity-section ${className}`} data-error={errorText !== undefined || undefined}><h4>{errorText !== undefined ? "Error" : "Output"}</h4><div>{errorText !== undefined ? errorText || "The tool reported an error without details." : output}</div></div>;
}

export function Agent({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-agent ${className}`} />;
}

export function AgentHeader({ name, model, className = "", ...props }: DivProps & { name: string; model?: string }) {
  return <div {...props} className={`hk-agent-header ${className}`}><h3>{name}</h3>{model && <span>{model}</span>}</div>;
}

export function AgentContent({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-agent-content ${className}`} />;
}

export function AgentInstructions({ children, className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { children: string }) {
  return <div {...props} className={`hk-activity-section ${className}`}><h4>Instructions</h4><MessageResponse>{children}</MessageResponse></div>;
}

export function AgentTools({ value, defaultValue = null, disabled = false, onValueChange, className = "", children, ...props }: Omit<DivProps, "defaultValue"> & { value?: string | null; defaultValue?: string | null; disabled?: boolean; onValueChange?: (value: string | null) => void }) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value === undefined ? localValue : value;
  const state: AgentToolsState = { value: selected, disabled, setValue: next => { if (disabled || next === selected) return; if (value === undefined) setLocalValue(next); onValueChange?.(next); } };
  return <AgentToolsContext value={state}><div {...props} className={`hk-agent-tools ${className}`}>{children}</div></AgentToolsContext>;
}

export type AgentToolDescriptor = { description?: string; inputSchema?: JsonValue };

export function AgentTool({ value, tool, className = "", ...props }: WorkDisclosureProps & { value: string; tool: AgentToolDescriptor }) {
  const group = useContext(AgentToolsContext);
  const open = group ? group.value === value : props.open;
  return <Plan {...props} open={open} disabled={group?.disabled || props.disabled} onOpenChange={next => { if (group) group.setValue(next ? value : null); props.onOpenChange?.(next); }} className={`hk-agent-tool ${className}`}><PlanTrigger><span className="hk-activity-name">{value}</span>{tool.description && <span className="hk-agent-tool-description">{tool.description}</span>}</PlanTrigger><PlanContent><ToolInput label="Input schema" input={tool.inputSchema} /></PlanContent></Plan>;
}

export function AgentOutput({ schema, className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { schema: string }) {
  return <div {...props} className={`hk-activity-section ${className}`}><h4>Output schema</h4><pre className="hk-activity-code"><code>{schema}</code></pre></div>;
}

export function Artifact({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-artifact ${className}`} />;
}

export function ArtifactHeader({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-artifact-header ${className}`} />;
}

export function ArtifactTitle({ className = "", ...props }: ComponentPropsWithRef<"h3">) {
  return <h3 {...props} className={`hk-artifact-title ${className}`} />;
}

export function ArtifactDescription({ className = "", ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={`hk-artifact-description ${className}`} />;
}

export function ArtifactActions({ className = "", ...props }: DivProps) {
  return <div {...props} role="group" aria-label={props["aria-label"] ?? "Artifact actions"} className={`hk-artifact-actions ${className}`} />;
}

export function ArtifactAction({ icon, children, ...props }: ButtonProps & { label: string; tooltip?: string; icon?: ReactNode }) {
  return <MessageAction {...props} type="button">{icon ? <span aria-hidden="true">{icon}</span> : children}</MessageAction>;
}

export function ArtifactClose({ label = "Close artifact", children = "×", ...props }: ButtonProps & { label?: string }) {
  return <ArtifactAction {...props} label={label} icon={children} />;
}

export function ArtifactContent({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-artifact-content ${className}`} />;
}

export function Sources({ className = "", ...props }: WorkDisclosureProps) {
  return <Plan {...props} className={`hk-sources ${className}`} />;
}

export function SourcesTrigger({ count, children, ...props }: ButtonProps & { count: number }) {
  const label = Number.isSafeInteger(count) && count >= 0 ? `${count} ${count === 1 ? "source" : "sources"}` : "Sources";
  return <PlanTrigger {...props}>{children ?? label}</PlanTrigger>;
}

export function SourcesContent({ className = "", ...props }: Omit<DivProps, "id" | "hidden">) {
  return <PlanContent {...props} className={`hk-sources-content ${className}`} />;
}

export function Source({ href, title, children, onClick, onAuxClick, className = "", ...props }: Omit<ComponentPropsWithRef<"a">, "ping" | "download" | "dangerouslySetInnerHTML">) {
  let safe: URL | undefined;
  try { const url = new URL(href ?? ""); if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) safe = url; } catch { safe = undefined; }
  return <a {...props} href={safe?.href} title={title} target={props.target ?? "_blank"} rel="noreferrer noopener" referrerPolicy="no-referrer" ping={undefined} download={undefined} tabIndex={safe ? props.tabIndex : -1} aria-disabled={!safe || undefined} className={`hk-source ${className}`} onClick={event => { if (safe) onClick?.(event); else event.preventDefault(); }} onAuxClick={event => { if (safe) onAuxClick?.(event); else event.preventDefault(); }}><span>{children ?? title ?? safe?.hostname ?? "Source unavailable"}</span><span aria-hidden="true">{safe ? "↗" : "—"}</span></a>;
}
