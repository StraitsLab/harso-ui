import { createContext, useContext, useEffect, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { Snippet, SnippetCopyButton, type DeveloperCopyProps } from "./developer-content";
import { Button } from "./primitives";

type DivProps = ComponentPropsWithRef<"div">;
type TerminalState = { output: string; isStreaming: boolean; autoScroll: boolean; onClear?: () => void; disabled: boolean };
const TerminalContext = createContext<TerminalState | null>(null);
function useTerminal() { const state = useContext(TerminalContext); if (!state) throw new Error("Terminal parts require Terminal."); return state; }

const ansi = /\x1b\[([0-9;]*)m/g;
function ansi256(value: number) {
  if (value < 16) return `var(--hk-terminal-${value < 8 ? "c" : "b"}${value % 8})`;
  if (value >= 232) { const shade = 8 + (value - 232) * 10; return `rgb(${shade} ${shade} ${shade})`; }
  const index = value - 16, r = Math.floor(index / 36), g = Math.floor((index % 36) / 6), b = index % 6;
  const channel = (part: number) => part === 0 ? 0 : 55 + part * 40;
  return `rgb(${channel(r)} ${channel(g)} ${channel(b)})`;
}
function renderAnsi(output: string): ReactNode[] {
  const nodes: ReactNode[] = []; let cursor = 0; let key = 0; let style: React.CSSProperties = {};
  for (const match of output.matchAll(ansi)) {
    if (match.index! > cursor) nodes.push(<span key={key++} style={style}>{output.slice(cursor, match.index)}</span>);
    const codes = (match[1] || "0").split(";").map(Number);
    for (let index = 0; index < codes.length; index += 1) {
      const code = codes[index];
      if (code === 0) style = {};
      else if (code === 1) style = { ...style, fontWeight: 700 };
      else if (code === 3) style = { ...style, fontStyle: "italic" };
      else if (code === 4) style = { ...style, textDecoration: "underline" };
      else if (code >= 30 && code <= 37) style = { ...style, color: `var(--hk-terminal-c${code - 30})` };
      else if (code >= 90 && code <= 97) style = { ...style, color: `var(--hk-terminal-b${code - 90})` };
      else if (code === 38 && codes[index + 1] === 5 && Number.isInteger(codes[index + 2])) { style = { ...style, color: ansi256(codes[index + 2]) }; index += 2; }
      else if (code === 48 && codes[index + 1] === 5 && Number.isInteger(codes[index + 2])) { style = { ...style, backgroundColor: ansi256(codes[index + 2]) }; index += 2; }
    }
    cursor = match.index! + match[0].length;
  }
  if (cursor < output.length) nodes.push(<span key={key++} style={style}>{output.slice(cursor)}</span>);
  return nodes;
}

export type TerminalProps = DivProps & { output: string; isStreaming?: boolean; autoScroll?: boolean; onClear?: () => void; disabled?: boolean };
export function Terminal({ output, isStreaming = false, autoScroll = true, onClear, disabled = false, children, className = "", ...props }: TerminalProps) {
  return <TerminalContext value={{ output, isStreaming, autoScroll, onClear, disabled }}><div {...props} className={`hk-terminal ${className}`} data-streaming={isStreaming || undefined}>{children ?? <><TerminalHeader><TerminalTitle /><TerminalStatus /><TerminalActions>{onClear && <TerminalClearButton />}</TerminalActions></TerminalHeader><TerminalContent /></>}</div></TerminalContext>;
}
export function TerminalCopyButton({ disabled, onClick, ...props }: DeveloperCopyProps) { const terminal = useTerminal(); return <Snippet code={terminal.output} disabled={terminal.disabled || disabled} className="hk-terminal-copy"><SnippetCopyButton {...props} label={props.label ?? "Copy terminal output"} onClick={event => { event.stopPropagation(); onClick?.(event); }} /></Snippet>; }
export function TerminalHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-terminal-header ${className}`} />; }
export function TerminalTitle({ children = "Terminal", className = "", ...props }: DivProps) { return <div {...props} className={`hk-terminal-title ${className}`}>{children}</div>; }
export function TerminalStatus({ children, className = "", ...props }: DivProps) { const { isStreaming } = useTerminal(); return <div {...props} role="status" className={`hk-terminal-status ${className}`}>{children ?? (isStreaming ? "Streaming" : "Ready")}</div>; }
export function TerminalActions({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-terminal-actions ${className}`} />; }
export function TerminalClearButton({ children = "Clear", className = "", onClick, ...props }: ComponentPropsWithRef<typeof Button>) { const { onClear, disabled } = useTerminal(); return <Button {...props} type="button" disabled={disabled || props.disabled || !onClear} className={`hk-terminal-clear ${className}`} onClick={event => { event.stopPropagation(); onClick?.(event); if (!event.defaultPrevented) onClear?.(); }}>{children}</Button>; }
export function TerminalContent({ className = "", ...props }: DivProps) { const { output, isStreaming, autoScroll } = useTerminal(); const ref = useRef<HTMLDivElement>(null); useEffect(() => { if (autoScroll && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [autoScroll, output]); return <div {...props} ref={ref} role="log" aria-live={isStreaming ? "polite" : "off"} aria-busy={isStreaming || undefined} tabIndex={0} className={`hk-terminal-content ${className}`}>{renderAnsi(output)}{isStreaming && <span className="hk-terminal-cursor" aria-label="Output streaming">▌</span>}</div>; }
