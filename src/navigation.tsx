import { useCallback, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactElement, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { flushSync } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Button, IconButton, type ButtonProps } from "./primitives";
import type { Appearance } from "./theme";

export function Breadcrumb({ children, label = "Breadcrumb" }: { children: ReactNode; label?: string }) {
  return <nav aria-label={label} className="hk-breadcrumb"><ol>{children}</ol></nav>;
}

export function BreadcrumbItem({ current = false, children, href, ...props }: ComponentPropsWithRef<"a"> & { current?: boolean }) {
  return <li>{current || !href ? <span aria-current={current ? "page" : undefined}>{children}</span> : <a {...props} href={href}>{children}</a>}</li>;
}

export type SelectionItem = { value: string; label: string; content?: ReactNode; disabled?: boolean };
type SelectionItemProps = Omit<ComponentPropsWithRef<"input">, "children" | "type"> & { label: string; children?: ReactNode; multiple?: boolean };

export function ButtonGroupItem({ label, children, multiple = false, className = "", ...props }: SelectionItemProps) {
  return <label className={`hk-selection-item ${className}`}><input {...props} type={multiple ? "checkbox" : "radio"} aria-label={label} /><span>{children ?? label}</span></label>;
}

export function SegmentedControlItem(props: Omit<SelectionItemProps, "multiple">) {
  return <ButtonGroupItem {...props} />;
}

export function ButtonGroup({ label, items, multiple = false, selected, defaultSelected = [], onSelectionChange, name, disabled = false, className = "", ref }: {
  label: string; items: readonly SelectionItem[]; multiple?: boolean; selected?: readonly string[]; defaultSelected?: readonly string[];
  onSelectionChange?: (values: string[]) => void; name?: string; disabled?: boolean; className?: string; ref?: ComponentPropsWithRef<"fieldset">["ref"];
}) {
  const identity = useId();
  const Item = multiple ? ButtonGroupItem : SegmentedControlItem;
  return <fieldset ref={ref} className={`hk-button-group ${className}`} disabled={disabled}>
    <legend className="hk-sr-only">{label}</legend>
    {items.map(item => <Item key={item.value} name={name ?? identity} value={item.value} label={item.label} multiple={multiple} disabled={item.disabled} checked={selected === undefined ? undefined : selected.includes(item.value)} defaultChecked={selected === undefined ? defaultSelected.includes(item.value) : undefined} onChange={event => {
      if (disabled || item.disabled) return;
      const group = event.currentTarget.closest("fieldset");
      if (group) onSelectionChange?.(Array.from(group.querySelectorAll<HTMLInputElement>("input:checked"), input => input.value));
    }}>{item.content}</Item>)}
  </fieldset>;
}

export function SegmentedControl({ value, defaultValue, onValueChange, ref, ...props }: Omit<ComponentPropsWithRef<typeof ButtonGroup>, "multiple" | "selected" | "defaultSelected" | "onSelectionChange"> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  const root = useRef<HTMLFieldSetElement>(null);
  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    const update = () => {
      const selected = group.querySelector<HTMLInputElement>("input:checked")?.closest("label");
      group.toggleAttribute("data-thumb", !!selected);
      if (!selected) return;
      group.style.setProperty("--hk-thumb-x", `${selected.offsetLeft}px`);
      group.style.setProperty("--hk-thumb-y", `${selected.offsetTop}px`);
      group.style.setProperty("--hk-thumb-width", `${selected.offsetWidth}px`);
      group.style.setProperty("--hk-thumb-height", `${selected.offsetHeight}px`);
    };
    const settled = () => queueMicrotask(update);
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    resize?.observe(group);
    group.querySelectorAll("label").forEach(item => resize?.observe(item));
    group.addEventListener("change", settled);
    group.form?.addEventListener("reset", settled);
    window.addEventListener("resize", update);
    update();
    return () => { resize?.disconnect(); group.removeEventListener("change", settled); group.form?.removeEventListener("reset", settled); window.removeEventListener("resize", update); };
  });
  const attach = useCallback((node: HTMLFieldSetElement | null) => {
    root.current = node;
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }, [ref]);
  return <ButtonGroup {...props} ref={attach} className={`hk-segmented ${props.className ?? ""}`} selected={value === undefined ? undefined : [value]} defaultSelected={defaultValue === undefined ? [] : [defaultValue]} onSelectionChange={values => { if (values[0] !== undefined) onValueChange?.(values[0]); }} />;
}

export type TabItem = { value: string; label: ReactNode; content: ReactNode; disabled?: boolean };
type TabListProps = { label: string; items: readonly TabItem[]; value?: string; onValueChange: (value: string) => void; identity: string; orientation?: "horizontal" | "vertical"; variant?: "underline" | "pill"; tone?: "neutral" | "accent" };

export function PillTab({ className = "", ...props }: ComponentPropsWithRef<"button">) {
  return <button {...props} type="button" role="tab" className={`hk-tab hk-tab--pill ${className}`} />;
}

export function TabList({ label, items, value, onValueChange, identity, orientation = "horizontal", variant = "underline", tone = "neutral" }: TabListProps) {
  const enabled = items.filter(item => !item.disabled);
  const selected = enabled.find(item => item.value === value)?.value ?? enabled[0]?.value;
  return <div role="tablist" aria-label={label} aria-orientation={orientation} className={`hk-tab-list hk-tab-list--${variant} hk-tab-list--${tone}`}>
    {items.map(item => {
      const Tab = variant === "pill" ? PillTab : "button";
      return <Tab key={item.value} type="button" role="tab" id={`${identity}-tab-${encodeURIComponent(item.value)}`} aria-controls={`${identity}-panel-${encodeURIComponent(item.value)}`} aria-selected={selected === item.value} tabIndex={selected === item.value ? 0 : -1} disabled={item.disabled} className="hk-tab" onClick={() => onValueChange(item.value)} onKeyDown={event => {
        const index = enabled.findIndex(option => option.value === item.value);
        if (index < 0 || !enabled.length || event.altKey || event.ctrlKey || event.metaKey) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const nextKey = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
        const previousKey = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
        const nextIndex = event.key === nextKey ? (index + 1) % enabled.length : event.key === previousKey ? (index - 1 + enabled.length) % enabled.length : event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : undefined;
        if (nextIndex === undefined) return;
        event.preventDefault();
        const next = enabled[nextIndex];
        document.getElementById(`${identity}-tab-${encodeURIComponent(next.value)}`)?.focus();
        onValueChange(next.value);
      }}>{item.label}</Tab>;
    })}
  </div>;
}

export function PillTabList(props: Omit<TabListProps, "variant">) {
  return <TabList {...props} variant="pill" />;
}

export function TabPanel({ active, tabId, children, ...props }: ComponentPropsWithRef<"div"> & { active: boolean; tabId: string }) {
  return <div {...props} role="tabpanel" aria-labelledby={tabId} hidden={!active} tabIndex={0} className={`hk-tab-panel ${props.className ?? ""}`}>{children}</div>;
}

export function Tabs({ label, items, value, defaultValue, onValueChange, variant = "underline", tone = "neutral", orientation = "horizontal" }: Omit<TabListProps, "identity" | "onValueChange"> & { defaultValue?: string; onValueChange?: (value: string) => void }) {
  const identity = useId();
  const [localValue, setLocalValue] = useState(defaultValue);
  const requested = value === undefined ? localValue : value;
  const selected = items.find(item => item.value === requested && !item.disabled)?.value ?? items.find(item => !item.disabled)?.value;
  const List = variant === "pill" ? PillTabList : TabList;
  return <div className="hk-tabs" data-orientation={orientation}>
    <List label={label} items={items} value={selected} identity={identity} orientation={orientation} tone={tone} onValueChange={next => { if (value === undefined) setLocalValue(next); onValueChange?.(next); }} />
    {items.map(item => <TabPanel key={item.value} id={`${identity}-panel-${encodeURIComponent(item.value)}`} tabId={`${identity}-tab-${encodeURIComponent(item.value)}`} active={selected === item.value}>{item.content}</TabPanel>)}
  </div>;
}

export function Pagination({ page, pageCount, onPageChange, siblings = 1, disabled = false, label = "Pagination" }: { page: number; pageCount: number; onPageChange: (page: number) => void; siblings?: 0 | 1 | 2; disabled?: boolean; label?: string }) {
  const total = Number.isSafeInteger(pageCount) && pageCount > 0 ? pageCount : 0;
  if (!total) return <p className="hk-pagination-empty">No pages</p>;
  const current = Math.max(1, Math.min(Number.isSafeInteger(page) ? page : 1, total));
  const radius = Number.isFinite(siblings) ? Math.max(0, Math.min(2, Math.floor(siblings))) : 1;
  const pages = new Set([1, total]);
  for (let cursor = Math.max(1, current - radius); cursor <= Math.min(total, current + radius); cursor++) pages.add(cursor);
  const ordered = [...pages].sort((first, second) => first - second);
  return <nav className="hk-pagination" aria-label={label}>
    <Button size="small" aria-label="Previous page" disabled={disabled || current <= 1} onClick={() => onPageChange(current - 1)}>‹</Button>
    <div className="hk-page-window">{ordered.map((number, index) => <span className="hk-page-slot" key={number}>{index > 0 && number - ordered[index - 1] > 1 && <span className="hk-page-gap" aria-hidden="true">…</span>}<Button size="small" disabled={disabled} aria-label={`Page ${number}`} aria-current={number === current ? "page" : undefined} onFocus={event => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })} onClick={() => { if (number !== current) onPageChange(number); }}>{number}</Button></span>)}</div>
    <Button size="small" aria-label="Next page" disabled={disabled || current >= total} onClick={() => onPageChange(current + 1)}>›</Button>
  </nav>;
}

export type ChipTone = "neutral" | "positive" | "negative" | "attention" | "accent" | "lime" | "rose" | "yellow" | "cyan" | "gray" | "soft" | "green" | "indigo";

export function StatusDot({ tone = "neutral", className = "", ...props }: ComponentPropsWithRef<"span"> & { tone?: ChipTone }) {
  return <span {...props} aria-hidden="true" className={`hk-status-dot hk-tone--${tone} ${className}`} />;
}

export function Chip({ tone = "neutral", variant = "subtle", className = "", leadingIcon, onRemove, removeLabel = "Remove", children, ...props }: ComponentPropsWithRef<"span"> & { tone?: ChipTone; variant?: "bold" | "subtle" | "caption"; leadingIcon?: ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return <span {...props} className={`hk-chip hk-tone--${tone} hk-chip--${variant} ${className}`}>{leadingIcon && <span className="hk-chip-icon" aria-hidden="true">{leadingIcon}</span>}{children}{onRemove && <IconButton label={removeLabel} className="hk-chip-remove" onClick={onRemove}><XIcon size={18} weight="regular" aria-hidden="true" /></IconButton>}</span>;
}

export function CloseButton({ label = "Close", size = "medium", ...props }: Omit<ButtonProps, "children" | "size" | "aria-label"> & { label?: string; size?: "2xs" | "xs" | "small" | "medium" }) {
  return <IconButton {...props} label={label} size={size === "medium" ? "medium" : "small"} className={`hk-close hk-close--${size} ${props.className ?? ""}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></IconButton>;
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export function Tooltip({ children, content, side = "top", size = "medium", ...props }: ComponentPropsWithRef<typeof TooltipPrimitive.Root> & { children: ReactElement; content: ReactNode; side?: "top" | "bottom" | "left" | "right"; size?: "small" | "medium" }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const anchor = useCallback((node: HTMLButtonElement | null) => setContainer(node?.closest<HTMLElement>(".harso-kit") ?? null), []);
  const hint = <TooltipPrimitive.Content side={side} sideOffset={8} collisionPadding={12} className={`hk-tooltip hk-tooltip--${size}`}>{content}</TooltipPrimitive.Content>;
  return <TooltipPrimitive.Provider delayDuration={250}><TooltipPrimitive.Root {...props}><TooltipTrigger asChild ref={anchor}>{children}</TooltipTrigger>{container ? <TooltipPrimitive.Portal container={container}>{hint}</TooltipPrimitive.Portal> : hint}</TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

export function ThemeToggle({ value, onValueChange, compact = false, disabled = false }: { value: Appearance; onValueChange: (value: Appearance) => void; compact?: boolean; disabled?: boolean }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const current = useRef(value);
  const active = useRef<ViewTransition | null>(null);
  useLayoutEffect(() => { current.current = value; }, [value]);
  useLayoutEffect(() => () => { active.current?.skipTransition(); active.current = null; }, []);
  const change = (next: Appearance) => {
    if (disabled || next === value) return;
    active.current?.skipTransition();
    if (!document.startViewTransition || !document.documentElement.animate || !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onValueChange(next); return; }
    const bounds = document.activeElement?.getBoundingClientRect();
    const { x, y } = origin.current ?? { x: bounds ? bounds.left + bounds.width / 2 : 0, y: bounds ? bounds.top + bounds.height / 2 : 0 };
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    let requested = false;
    let transition: ViewTransition;
    try {
      transition = document.startViewTransition({ update: () => { requested = true; flushSync(() => onValueChange(next)); }, types: ["hk-theme"] });
    } catch (error) {
      if (requested) throw error;
      onValueChange(next);
      return;
    }
    active.current = transition;
    void transition.ready.then(() => {
      if (current.current !== next || active.current !== transition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { transition.skipTransition(); return; }
      document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 320, easing: "ease-out", pseudoElement: "::view-transition-new(root)" });
    }).catch(() => undefined);
    void transition.finished.finally(() => { if (active.current === transition) active.current = null; }).catch(() => undefined);
  };
  const choices = [{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }];
  return <div className="hk-theme-toggle" onKeyDownCapture={() => { origin.current = null; }} onClickCapture={event => {
    const bounds = (event.target as HTMLElement).closest("button, label")?.getBoundingClientRect();
    origin.current = event.detail > 0 ? { x: event.clientX, y: event.clientY } : { x: bounds ? bounds.left + bounds.width / 2 : 0, y: bounds ? bounds.top + bounds.height / 2 : 0 };
  }}>{compact ? <IconButton label={`Change appearance, currently ${value}`} disabled={disabled} onClick={() => change(value === "system" ? "light" : value === "light" ? "dark" : "system")}><span aria-hidden="true">◐</span></IconButton> : <SegmentedControl label="Appearance" items={choices} value={value} disabled={disabled} onValueChange={next => change(next as Appearance)} />}</div>;
}

export function Announcement({ title, description, icon, action, actionLabel, onAction, onDismiss, open = true }: { title: string; description?: ReactNode; icon?: ReactNode; action?: ReactNode; actionLabel?: string; onAction?: () => void; onDismiss?: () => void; open?: boolean }) {
  const identity = useId();
  return <section className="hk-announcement" aria-labelledby={identity} hidden={!open} inert={!open} aria-hidden={!open || undefined}><div className="hk-announcement-copy">{icon && <span className="hk-announcement-icon" aria-hidden="true">{icon}</span>}<h3 id={identity}>{title}</h3>{description && <p>{description}</p>}{(action || actionLabel) && <div className="hk-announcement-action">{action ?? <Button disabled={!onAction} onClick={onAction}>{actionLabel}</Button>}</div>}</div>{onDismiss && <CloseButton size="small" label={`Dismiss ${title}`} onClick={onDismiss} />}</section>;
}
