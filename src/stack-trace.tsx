import { createContext, useContext, type ComponentPropsWithRef } from "react";
import { Plan, PlanContent, PlanTrigger, type WorkDisclosureProps } from "./work";
import { Snippet, SnippetCopyButton, type DeveloperCopyProps } from "./developer-content";
import { Button } from "./primitives";

type DivProps = ComponentPropsWithRef<"div">;
type SpanProps = ComponentPropsWithRef<"span">;
export type StackTraceProps = WorkDisclosureProps & { trace: string; onFilePathClick?: (path: string, line?: number, column?: number) => void };
type Frame = { raw: string; functionName?: string; location?: string; path?: string; line?: number; column?: number; internal?: boolean };
const StackContext = createContext<{ trace: string; errorType: string; message: string; frames: Frame[]; disabled: boolean; onFilePathClick?: StackTraceProps["onFilePathClick"] } | null>(null);
function useStack() { const stack = useContext(StackContext); if (!stack) throw new Error("StackTrace parts require StackTrace."); return stack; }

function parseFrame(raw: string): Frame {
  const frame = raw.match(/^\s*at\s+(?:(.+?)\s+\((.+)\)|(.+?))\s*$/);
  const location = frame?.[2] ?? frame?.[3];
  const match = location?.match(/^(.+?):(-?\d+(?:\.\d+)?)(?::(-?\d+(?:\.\d+)?))?$/);
  if (!match) return { raw };
  const path = match[1], line = Number(match[2]), column = match[3] === undefined ? undefined : Number(match[3]);
  if (!Number.isSafeInteger(line) || line <= 0 || (column !== undefined && (!Number.isSafeInteger(column) || column <= 0))) return { raw };
  return { raw, functionName: frame?.[1], location, path, line, column, internal: path.startsWith("node:") || /(?:^|[/\\])node_modules[/\\]/.test(path) };
}

export function StackTrace({ trace, disabled = false, onFilePathClick, className = "", ...props }: StackTraceProps) {
  const [first = "", ...lines] = trace.split(/\r?\n/);
  const error = first.match(/^([\w.]*Error|[\w.]*Exception):\s?(.*)$/);
  return <StackContext value={{ trace, disabled, onFilePathClick, errorType: error?.[1] ?? "Stack trace", message: error?.[2] ?? first, frames: lines.map(parseFrame) }}><Plan {...props} disabled={disabled} className={`hk-stack-trace ${className}`} /></StackContext>;
}
export function StackTraceHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-stack-header ${className}`} />; }
export function StackTraceError({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-stack-error ${className}`} />; }
export function StackTraceErrorType({ children, className = "", ...props }: SpanProps) { const { errorType } = useStack(); return <span {...props} className={`hk-stack-error-type ${className}`}>{children ?? errorType}</span>; }
export function StackTraceErrorMessage({ children, className = "", ...props }: SpanProps) { const { message, trace } = useStack(); return <span {...props} className={`hk-stack-error-message ${className}`}>{children ?? (trace.trim() ? message : "No stack trace supplied.")}</span>; }
export function StackTraceActions({ onClick, className = "", ...props }: DivProps) { return <div {...props} className={`hk-stack-actions ${className}`} onClick={event => { event.stopPropagation(); onClick?.(event); }} />; }
export function StackTraceCopyButton({ disabled, onClick, ...props }: DeveloperCopyProps) {
  const stack = useStack();
  return <Snippet code={stack.trace} disabled={stack.disabled || disabled || !stack.trace.trim()} className="hk-stack-copy"><SnippetCopyButton {...props} label={props.label ?? "Copy stack trace"} onClick={event => { event.stopPropagation(); onClick?.(event); }} /></Snippet>;
}
export function StackTraceExpandButton({ children = "Stack frames", className = "", onClick, ...props }: ComponentPropsWithRef<typeof PlanTrigger>) { return <PlanTrigger {...props} className={`hk-stack-expand ${className}`} onClick={event => { event.stopPropagation(); onClick?.(event); }}>{children}</PlanTrigger>; }
export function StackTraceContent({ maxHeight = 400, style, className = "", ...props }: ComponentPropsWithRef<typeof PlanContent> & { maxHeight?: number }) {
  return <PlanContent aria-label="Stack frames" tabIndex={0} {...props} className={`hk-stack-content ${className}`} style={{ ...style, maxHeight: Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : 400 }} />;
}
export function StackTraceFrames({ showInternalFrames = true, className = "", ...props }: DivProps & { showInternalFrames?: boolean }) {
  const { frames, disabled, onFilePathClick } = useStack();
  const visible = frames.filter(frame => showInternalFrames || !frame.internal);
  const hidden = frames.length - visible.length;
  return <div {...props} className={`hk-stack-frames ${className}`}>{hidden > 0 && <p className="hk-stack-summary">{hidden} internal {hidden === 1 ? "frame" : "frames"} hidden</p>}{visible.some(frame => frame.raw.trim()) ? visible.map((frame, index) => <div key={index} className="hk-stack-frame" data-internal={frame.internal || undefined}>{frame.path ? <>{frame.functionName && <span className="hk-stack-function">{frame.functionName}</span>}{onFilePathClick ? <Button className="hk-stack-path" disabled={disabled} onClick={event => { event.stopPropagation(); onFilePathClick(frame.path!, frame.line, frame.column); }}>{frame.location}</Button> : <span className="hk-stack-path">{frame.location}</span>}</> : frame.raw}{frame.internal && <span className="hk-stack-internal">Internal</span>}</div>) : <p className="hk-stack-summary">No visible frames.</p>}</div>;
}
