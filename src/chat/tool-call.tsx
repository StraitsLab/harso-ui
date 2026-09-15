import { useState, type ReactNode } from "react";
import { CaretRight, Terminal } from "@phosphor-icons/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { HarsoApproval, type HarsoApprovalProps } from "./approval";
import "./tool-call.css";

export type HarsoToolCallProps = ToolCallMessagePartProps & { onDecide?: HarsoApprovalProps["onDecide"]; meta?: string };
export type HarsoToolStateName = "running" | "completed" | "failed" | "denied" | "awaiting approval";

export function HarsoToolState({ state }: { state: HarsoToolStateName }) {
  return <span className="hkc-tool-state" data-state={state} role="status"><span aria-hidden="true" />{state}</span>;
}

function stateOf({ approval, isError, status, result }: ToolCallMessagePartProps): HarsoToolStateName {
  if (approval?.approved === false) return "denied";
  if (isError || status.type === "incomplete" || approval?.resolution) return "failed";
  if (approval && approval.approved === undefined) return "awaiting approval";
  return result !== undefined || status.type === "complete" ? "completed" : "running";
}

function format(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "";
}

function ToolCard({ children, ...part }: HarsoToolCallProps & { children: ReactNode }) {
  const state = stateOf(part);
  const [open, setOpen] = useState(state === "awaiting approval");
  const command = typeof part.args?.command === "string" ? part.args.command : part.toolName;
  return <section className="hkc-tool" data-tool={part.toolName} data-state={state}>
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary><Terminal size={14} weight="regular" aria-hidden="true" /><code>{command}</code><span className="hkc-tool-meta">{part.meta ?? (command !== part.toolName ? part.toolName : "")}</span><HarsoToolState state={state} /><CaretRight className="hkc-tool-chevron" size={11} aria-hidden="true" /></summary>
      <div className="hkc-tool-body">{children}</div>
      <HarsoApproval approval={part.approval} onDecide={part.onDecide ?? ((_id, approved) => part.respondToApproval({ approved }))} />
    </details>
  </section>;
}

export function HarsoToolCall(part: HarsoToolCallProps) {
  return <ToolCard {...part}><pre aria-label="Arguments">{part.argsText || format(part.args)}</pre>{part.result !== undefined && <pre aria-label="Result">{format(part.result)}</pre>}</ToolCard>;
}

export function HarsoTerminalTool(part: HarsoToolCallProps) {
  const result = part.result;
  const structured = result !== null && typeof result === "object" ? result as Record<string, unknown> : undefined;
  return <ToolCard {...part}><pre data-label="Arguments" aria-label="Command">{format(part.args?.command)}</pre>{result !== undefined && <pre data-label="Result" aria-label="Output">{format(structured?.output ?? result)}</pre>}{structured?.exitCode !== undefined && <p>Exit code: <code>{format(structured.exitCode)}</code></p>}</ToolCard>;
}

export function HarsoReadFileTool(part: HarsoToolCallProps) {
  const result = part.result;
  const structured = result !== null && typeof result === "object" ? result as Record<string, unknown> : undefined;
  return <ToolCard {...part}><pre data-label="Arguments" aria-label="Path">{format(part.args?.path)}</pre>{result !== undefined && <pre data-label="Result" aria-label="File content">{format(structured?.content ?? result)}</pre>}</ToolCard>;
}

export const harsoToolComponents = { by_name: { terminal: HarsoTerminalTool, read_file: HarsoReadFileTool }, Fallback: HarsoToolCall };
