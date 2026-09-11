import { createContext, useContext, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { type ButtonProps } from "./primitives";
import { Plan, PlanContent, PlanTrigger, type WorkDisclosureProps } from "./work";

type OpenInContextValue = { query: string; disabled: boolean; request: (open: boolean) => void };
const OpenInContext = createContext<OpenInContextValue | null>(null);
function useOpenIn() { const value = useContext(OpenInContext); if (!value) throw new Error("OpenIn parts require OpenIn."); return value; }
export type OpenInProps = WorkDisclosureProps & { query: string };
export function OpenIn({ query, open, defaultOpen = true, onOpenChange, disabled = false, children, className = "", ...props }: OpenInProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const request = (next: boolean) => { if (disabled) return; if (open === undefined) setLocalOpen(next); onOpenChange?.(next); };
  return <OpenInContext value={{ query, disabled, request }}><Plan {...props} open={open ?? localOpen} onOpenChange={request} disabled={disabled} className={`hk-open-in ${className}`}>{children}</Plan></OpenInContext>;
}
export function OpenInTrigger({ children = "Open in chat", className = "", ...props }: ButtonProps) { return <PlanTrigger {...props} size="small" aria-haspopup="menu" className={`hk-open-in-trigger ${className}`}>{children}<span aria-hidden="true">↗</span></PlanTrigger>; }
export function OpenInContent({ children, className = "", onKeyDown, ...props }: ComponentPropsWithRef<typeof PlanContent>) {
  const { request } = useOpenIn();
  return <PlanContent aria-label="Chat destinations" {...props} role="menu" className={`hk-open-in-content ${className}`} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); request(false); return; }
    const menu = event.currentTarget;
    const items = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[role="menuitem"][href]')).filter(item => item.closest('[role="menu"]') === menu);
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "Home" ? items[0] : event.key === "End" ? items.at(-1) : event.key === "ArrowDown" ? items[(index + 1) % items.length] : event.key === "ArrowUp" ? items[(index - 1 + items.length) % items.length] : undefined;
    if (next) { event.preventDefault(); next.focus(); }
  }}>{children}</PlanContent>;
}
export function OpenInLabel({ children, className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-open-in-label ${className}`}>{children}</div>; }
export function OpenInSeparator({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} role="separator" className={`hk-open-in-separator ${className}`} />; }
export function OpenInItem({ href, label, children, className = "", onClick, ...props }: Omit<ComponentPropsWithRef<"a">, "children"> & { href: string; label?: string; children?: ReactNode }) {
  let allowed = false;
  try { const parsed = new URL(href); allowed = ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch {}
  const root = useContext(OpenInContext);
  const disabled = !allowed || !!root?.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return <a {...props} href={disabled ? undefined : href} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : props.tabIndex} target={props.target ?? "_blank"} rel="noreferrer noopener" role="menuitem" className={`hk-open-in-item ${className}`} onClick={event => { if (disabled) event.preventDefault(); else onClick?.(event); }}>{children ?? label}</a>;
}
function platformUrl(platform: string, query: string) { const encoded = encodeURIComponent(query); const urls: Record<string, string> = { chatgpt: `https://chatgpt.com/?q=${encoded}`, claude: `https://claude.ai/new?q=${encoded}`, t3: `https://t3.chat/?q=${encoded}`, scira: `https://scira.ai/?q=${encoded}`, v0: `https://v0.dev/?q=${encoded}`, cursor: `https://cursor.com/?q=${encoded}` }; return urls[platform]; }
export function OpenInChatGPT(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("chatgpt", useOpenIn().query)} label="ChatGPT" />; }
export function OpenInClaude(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("claude", useOpenIn().query)} label="Claude" />; }
export function OpenInT3(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("t3", useOpenIn().query)} label="T3 Chat" />; }
export function OpenInScira(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("scira", useOpenIn().query)} label="Scira" />; }
export function OpenInv0(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("v0", useOpenIn().query)} label="v0" />; }
export function OpenInCursor(props: Omit<ComponentPropsWithRef<"a">, "href">) { return <OpenInItem {...props} href={platformUrl("cursor", useOpenIn().query)} label="Cursor" />; }
export const OpenInChat = OpenIn;
