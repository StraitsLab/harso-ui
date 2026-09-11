import { Children, createContext, isValidElement, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ElementType, type ReactNode, type RefObject } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, EmptyState, IconButton, type ButtonProps } from "./primitives";
import { Tooltip } from "./navigation";

type DivProps = ComponentPropsWithRef<"div">;
type ConversationState = { viewport: RefObject<HTMLDivElement | null>; following: RefObject<boolean>; atBottom: boolean; setAtBottom: (value: boolean) => void; scrollToLatest: () => void };
const ConversationContext = createContext<ConversationState | null>(null);

function useConversation() {
  const value = useContext(ConversationContext);
  if (!value) throw new Error("Conversation parts require Conversation.");
  return value;
}

export function Conversation({ children, className = "", ...props }: DivProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const scrollToLatest = () => {
    following.current = true;
    const element = viewport.current;
    element?.scrollTo?.({ top: element.scrollHeight, behavior: "instant" });
    setAtBottom(true);
  };
  return <ConversationContext value={{ viewport, following, atBottom, setAtBottom, scrollToLatest }}><div {...props} className={`hk-conversation ${className}`}>{children}</div></ConversationContext>;
}

export function ConversationContent({ children, className = "", ref, onScroll, ...props }: DivProps) {
  const { viewport, following, setAtBottom } = useConversation();
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => {
      if (following.current) element.scrollTo?.({ top: element.scrollHeight, behavior: "instant" });
      setAtBottom(element.scrollHeight - element.scrollTop - element.clientHeight <= 24);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [viewport, following, setAtBottom]);
  return <div {...props} role="log" aria-label={props["aria-label"] ?? "Conversation messages"} aria-live={props["aria-live"] ?? "polite"} aria-relevant="additions text" tabIndex={props.tabIndex ?? 0} className={`hk-conversation-viewport ${className}`} ref={element => { viewport.current = element; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} onScroll={event => {
    const element = event.currentTarget;
    following.current = element.scrollHeight - element.scrollTop - element.clientHeight <= 24;
    setAtBottom(following.current);
    onScroll?.(event);
  }}><div className="hk-conversation-content" ref={content}>{children}</div></div>;
}

export function ConversationEmptyState({ title = "A little space to think.", description = "Begin with what is on your mind.", icon, children, ...props }: DivProps & { title?: string; description?: string; icon?: ReactNode }) {
  return <div {...props}>{icon && <div className="hk-conversation-empty-icon" aria-hidden="true">{icon}</div>}<EmptyState title={title} description={description} action={children} /></div>;
}

export function ConversationScrollButton({ onClick, className = "", children, ...props }: ButtonProps) {
  const { atBottom, scrollToLatest } = useConversation();
  const [focused, setFocused] = useState(false);
  return <Button {...props} hidden={atBottom && !focused} className={`hk-conversation-jump ${className}`} onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }} onClick={event => { onClick?.(event); if (!event.defaultPrevented) scrollToLatest(); }}>{children ?? "Latest response ↓"}</Button>;
}

export type ConversationText = { role: "user" | "assistant" | "system" | "tool"; content: string };
export function messagesToMarkdown(messages: readonly ConversationText[], formatMessage: (message: ConversationText, index: number) => string = message => `## ${message.role}\n\n${message.content}`) {
  return messages.map(formatMessage).join("\n\n");
}

export function ConversationDownload({ messages, onDownload, formatMessage, ...props }: Omit<ButtonProps, "onClick"> & { messages: readonly ConversationText[]; onDownload: (markdown: string) => void; formatMessage?: (message: ConversationText, index: number) => string }) {
  return <Button {...props} disabled={props.disabled || !messages.length} onClick={() => onDownload(messagesToMarkdown(messages, formatMessage))}>{props.children ?? "Download conversation"}</Button>;
}

export function Message({ from, label = from === "assistant" ? "Harso" : from === "user" ? "You" : from, children, className = "", ...props }: ComponentPropsWithRef<"article"> & { from: ConversationText["role"]; label?: string }) {
  return <article {...props} aria-label={label} className={`hk-message hk-message--${from} ${className}`}><div className="hk-message-label">{label}</div>{children}</article>;
}

export function MessageContent({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-message-content ${className}`} />;
}

export function MessageResponse({ children, streaming = false, className = "", ...props }: Omit<DivProps, "children" | "dangerouslySetInnerHTML"> & { children: string; streaming?: boolean }) {
  return <div {...props} className={`hk-message-response ${className}`} aria-busy={streaming || undefined} data-streaming={streaming || undefined}><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
    a: ({ href, children: content }) => {
      let safe: string | undefined;
      try { const url = new URL(href ?? ""); if (url.protocol === "http:" || url.protocol === "https:") safe = url.href; } catch { safe = undefined; }
      return safe ? <a href={safe} target="_blank" rel="noreferrer noopener">{content}</a> : <span>{content}</span>;
    },
    img: ({ alt }) => <span className="hk-message-image-label">{alt ? `Image: ${alt}` : "Image omitted"}</span>,
    input: ({ checked }) => <input type="checkbox" checked={!!checked} disabled aria-label={checked ? "Completed task" : "Incomplete task"} />,
  }}>{children}</Markdown></div>;
}

export function MessageActions({ className = "", ...props }: DivProps) {
  return <div {...props} role="group" aria-label={props["aria-label"] ?? "Message actions"} className={`hk-message-actions ${className}`} />;
}

export function MessageAction({ label, tooltip, ...props }: ButtonProps & { label: string; tooltip?: string }) {
  const button = <IconButton {...props} label={label} />;
  return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button;
}

type BranchState = { selected: number; count: number; setCount: (count: number) => void; select: (branch: number) => void };
const BranchContext = createContext<BranchState | null>(null);
function useBranch() {
  const value = useContext(BranchContext);
  if (!value) throw new Error("Message branch parts require MessageBranch.");
  return value;
}
function boundedBranch(value: number, count: number) {
  return Math.max(0, Math.min(Number.isFinite(value) ? Math.trunc(value) : 0, count - 1));
}

export function MessageBranch({ branch, defaultBranch = 0, onBranchChange, className = "", children, ...props }: DivProps & { branch?: number; defaultBranch?: number; onBranchChange?: (branch: number) => void }) {
  const [localBranch, setLocalBranch] = useState(defaultBranch);
  const [count, setCount] = useState(0);
  const selected = boundedBranch(branch ?? localBranch, count);
  useEffect(() => { if (branch === undefined && count) setLocalBranch(previous => boundedBranch(previous, count)); }, [branch, count]);
  const select = (next: number) => {
    if (next < 0 || next >= count || next === selected) return;
    if (branch === undefined) setLocalBranch(next);
    onBranchChange?.(next);
  };
  return <BranchContext value={{ selected, count, setCount, select }}><div {...props} className={`hk-message-branch ${className}`}>{children}</div></BranchContext>;
}

export function MessageBranchContent({ children, className = "", ...props }: DivProps) {
  const { selected, setCount } = useBranch();
  const branches = Children.toArray(children);
  useLayoutEffect(() => { setCount(branches.length); }, [branches.length, setCount]);
  return <div {...props} className={`hk-message-branches ${className}`}>{branches.map((child, index) => <div key={isValidElement(child) ? child.key : index} hidden={index !== boundedBranch(selected, branches.length)}>{child}</div>)}</div>;
}

export function MessageBranchSelector({ className = "", ...props }: DivProps) {
  return <div {...props} role="group" aria-label={props["aria-label"] ?? "Response versions"} className={`hk-message-branch-selector ${className}`} />;
}

export function MessageBranchPrevious({ onClick, ...props }: ButtonProps) {
  const { selected, select } = useBranch();
  return <IconButton {...props} label={props["aria-label"] ?? "Previous response"} disabled={props.disabled || selected === 0} onClick={event => { onClick?.(event); if (!event.defaultPrevented) select(selected - 1); }}>{props.children ?? <span aria-hidden="true">←</span>}</IconButton>;
}

export function MessageBranchNext({ onClick, ...props }: ButtonProps) {
  const { selected, count, select } = useBranch();
  return <IconButton {...props} label={props["aria-label"] ?? "Next response"} disabled={props.disabled || selected >= count - 1} onClick={event => { onClick?.(event); if (!event.defaultPrevented) select(selected + 1); }}>{props.children ?? <span aria-hidden="true">→</span>}</IconButton>;
}

export function MessageBranchPage({ children, ...props }: ComponentPropsWithRef<"span">) {
  const { selected, count } = useBranch();
  return <span {...props} aria-live="polite" aria-atomic="true">{children ?? `${count ? selected + 1 : 0} of ${count}`}</span>;
}

export function MessageToolbar({ className = "", ...props }: DivProps) {
  return <div {...props} className={`hk-message-toolbar ${className}`} />;
}

export function Suggestions({ className = "", ...props }: DivProps) {
  return <div {...props} role="group" aria-label={props["aria-label"] ?? "Suggestions"} className={`hk-suggestions ${className}`} />;
}

export function Suggestion({ suggestion, onSelect, className = "", ...props }: Omit<ButtonProps, "onSelect"> & { suggestion: string; onSelect?: (suggestion: string) => void }) {
  return <Button {...props} className={`hk-suggestion ${className}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) onSelect?.(suggestion); }}>{props.children ?? suggestion}</Button>;
}

export function Shimmer({ as: Element = "span", active = true, duration = 2, spread = 2, className = "", style, ...props }: ComponentPropsWithRef<"span"> & { as?: ElementType; active?: boolean; duration?: number; spread?: number }) {
  return <Element {...props} className={`hk-shimmer ${className}`} data-active={active || undefined} style={{ ...style, "--hk-shimmer-duration": `${Number.isFinite(duration) ? Math.max(.5, duration) : 2}s`, "--hk-shimmer-spread": `${Number.isFinite(spread) ? Math.max(5, Math.min(80, spread * 10)) : 20}%` } as CSSProperties} />;
}
