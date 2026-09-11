import { createContext, useContext, useId, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { getStatusBadge, type ToolState } from "./activity";

type SandboxTabsState = { identity: string; value: string; disabled: boolean; setValue: (value: string) => void };
const SandboxTabsContext = createContext<SandboxTabsState | null>(null);
const SandboxDisabled = createContext(false);
function useSandboxTabs() { const state = useContext(SandboxTabsContext); if (!state) throw new Error("Sandbox tab parts require SandboxTabs."); return state; }

export function Sandbox({ open, defaultOpen = false, onOpenChange, disabled = false, onToggle, className = "", children, ...props }: ComponentPropsWithRef<"details"> & { defaultOpen?: boolean; disabled?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const shown = open ?? localOpen;
  return <SandboxDisabled value={disabled}><details {...props} open={shown} inert={disabled || props.inert} className={`hk-sandbox ${className}`} onToggle={event => {
    const next = event.currentTarget.open;
    onToggle?.(event);
    if (next === shown) return;
    event.currentTarget.open = shown;
    if (disabled || event.defaultPrevented) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  }}>{children}</details></SandboxDisabled>;
}
export function SandboxHeader({ title, state, className = "", ...props }: ComponentPropsWithRef<"summary"> & { title?: string; state: ToolState }) { return <summary {...props} className={`hk-sandbox-header ${className}`}><span className="hk-sandbox-title">{title ?? "Sandbox"}</span>{getStatusBadge(state)}</summary>; }
export function SandboxContent({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-sandbox-content ${className}`} />; }
export function SandboxTabs({ value: controlledValue, defaultValue = "code", onValueChange, disabled = false, children, className = "", ...props }: Omit<ComponentPropsWithRef<"div">, "defaultValue"> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void | boolean; disabled?: boolean }) { const identity = useId(); const blocked = useContext(SandboxDisabled) || disabled; const [localValue, setLocalValue] = useState(defaultValue); const value = controlledValue ?? localValue; const setValue = (next: string) => { if (!blocked && next !== value && onValueChange?.(next) !== false && controlledValue === undefined) setLocalValue(next); }; return <SandboxTabsContext value={{ identity, value, disabled: blocked, setValue }}><div {...props} className={`hk-sandbox-tabs ${className}`} data-value={value}>{children}</div></SandboxTabsContext>; }
export function SandboxTabsBar({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-sandbox-tabs-bar ${className}`} />; }
export function SandboxTabsList({ className = "", onKeyDown, ...props }: ComponentPropsWithRef<"div">) { return <div aria-label="Sandbox views" {...props} role="tablist" className={`hk-sandbox-tabs-list ${className}`} onKeyDown={event => {
  onKeyDown?.(event);
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
  const list = event.currentTarget;
  const enabled = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')).filter(tab => tab.closest('[role="tablist"]') === list);
  const index = enabled.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  const forward = getComputedStyle(list).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backward = forward === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
  const target = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1) : event.key === forward ? enabled[(index + 1) % enabled.length] : event.key === backward ? enabled[(index + enabled.length - 1) % enabled.length] : undefined;
  if (target) { event.preventDefault(); target.focus(); target.click(); }
}} />; }
export function SandboxTabsTrigger({ value, children, className = "", onClick, ...props }: ComponentPropsWithRef<"button"> & { value: string }) { const tabs = useSandboxTabs(); return <button {...props} disabled={tabs.disabled || props.disabled} type="button" role="tab" id={`${tabs.identity}-tab-${encodeURIComponent(value)}`} aria-controls={`${tabs.identity}-panel-${encodeURIComponent(value)}`} aria-selected={tabs.value === value} tabIndex={tabs.value === value ? 0 : -1} className={`hk-sandbox-tabs-trigger ${className}`} data-value={value} onClick={event => { onClick?.(event); if (!event.defaultPrevented) tabs.setValue(value); }}>{children}</button>; }
export function SandboxTabContent({ value, children, className = "", ...props }: ComponentPropsWithRef<"div"> & { value: string; children?: ReactNode }) { const tabs = useSandboxTabs(); return <div tabIndex={0} {...props} role="tabpanel" id={`${tabs.identity}-panel-${encodeURIComponent(value)}`} aria-labelledby={`${tabs.identity}-tab-${encodeURIComponent(value)}`} hidden={tabs.value !== value} className={`hk-sandbox-tab-content ${className}`} data-value={value}>{children}</div>; }
