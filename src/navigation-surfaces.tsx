import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type MouseEvent, type ReactNode, type Ref, type RefObject } from "react";
import { Button, IconButton, Separator, type ButtonProps } from "./primitives";
import { Tooltip } from "./navigation";

function useNativeRef<Element>(local: RefObject<Element | null>, forwarded: Ref<Element> | undefined) {
  return useCallback((element: Element | null) => {
    local.current = element;
    if (typeof forwarded === "function") {
      const cleanup = forwarded(element);
      if (typeof cleanup === "function") return () => { local.current = null; cleanup(); };
    } else if (forwarded) forwarded.current = element;
  }, [local, forwarded]);
}

type MenuContext = { identity: string; anchor: string; label: string; visible: boolean; available: boolean; disabled: boolean; trigger: RefObject<HTMLButtonElement | null>; panel: RefObject<HTMLDivElement | null>; edge: RefObject<"first" | "last">; request: (open: boolean) => void; dismissAll: () => void };
const Menu = createContext<MenuContext | null>(null);
function useMenu() {
  const menu = useContext(Menu);
  if (!menu) throw new Error("Dropdown parts require a Dropdown parent.");
  return menu;
}
function menuItems(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLButtonElement>('button[role^="menuitem"]')).filter(item => item.closest('[role="menu"]') === panel && !item.matches(":disabled") && item.getClientRects().length > 0 && getComputedStyle(item).visibility !== "hidden");
}

export function Dropdown({ label, children, open, defaultOpen = false, onOpenChange, disabled = false }: { label: string; children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; disabled?: boolean }) {
  const parent = useContext(Menu);
  const identity = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const edge = useRef<"first" | "last">("first");
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [available, setAvailable] = useState(false);
  const inheritedDisabled = disabled || !!parent?.disabled;
  const blocked = inheritedDisabled || !!(parent && !parent.visible);
  const visible = available && !blocked && (open ?? localOpen);
  const request = (next: boolean) => {
    if (next && blocked) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  const dismissAll = () => { request(false); parent?.dismissAll(); };
  useLayoutEffect(() => {
    const element = panel.current;
    const supported = !!element && typeof element.showPopover === "function";
    setAvailable(supported);
    if (blocked && open === undefined && localOpen) setLocalOpen(false);
    if (!supported) return;
    if (visible) {
      if (!element.matches(":popover-open")) {
        element.showPopover();
        const items = menuItems(element);
        (edge.current === "last" ? items.at(-1) : items[0])?.focus();
        if (!items.length) element.focus();
        edge.current = "first";
      }
    } else if (element.matches(":popover-open")) {
      const restore = element.contains(document.activeElement);
      element.hidePopover();
      if (restore) trigger.current?.focus({ preventScroll: true });
    }
  }, [visible, blocked, localOpen, open]);
  useLayoutEffect(() => {
    const element = panel.current;
    return () => { if (element?.isConnected && typeof element.hidePopover === "function" && element.matches(":popover-open")) element.hidePopover(); };
  }, []);
  useEffect(() => {
    if (!visible) return;
    const element = panel.current;
    if (!element) return;
    let focused: Element | null = element.contains(document.activeElement) ? document.activeElement : null;
    const rememberFocus = (event: FocusEvent) => { focused = element.contains(event.target as Node) ? event.target as Element : null; };
    const observer = new MutationObserver(() => {
      if (!focused || element.contains(focused) && menuItems(element).includes(focused as HTMLButtonElement)) return;
      if (document.activeElement !== document.body && !element.contains(document.activeElement)) return;
      (menuItems(element)[0] ?? element).focus({ preventScroll: true });
    });
    document.addEventListener("focusin", rememberFocus);
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "style", "class"] });
    return () => { observer.disconnect(); document.removeEventListener("focusin", rememberFocus); };
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) request(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !(document.activeElement as HTMLElement | null)?.closest('[role="menu"]')) request(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  });
  return <Menu value={{ identity, anchor: `--hk-menu-${identity.replace(/[^a-z0-9_-]/gi, "")}`, label, visible, available, disabled: inheritedDisabled, trigger, panel, edge, request, dismissAll }}>{children}</Menu>;
}

export function DropdownTrigger({ ref, onClick, onKeyDown, disabled, style, ...props }: ButtonProps) {
  const menu = useMenu();
  const attached = useNativeRef(menu.trigger, ref);
  return <Button {...props} ref={attached} disabled={disabled || menu.disabled || !menu.available} style={{ ...style, anchorName: menu.anchor } as CSSProperties} aria-haspopup="menu" aria-expanded={menu.visible} aria-controls={menu.identity} title={!menu.available ? "Menu requires native popover support" : props.title} onClick={event => { if (event.currentTarget.matches(":disabled")) return; onClick?.(event); if (!event.defaultPrevented) { menu.edge.current = "first"; menu.request(!menu.visible); } }} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const forward = getComputedStyle(event.currentTarget).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || (props.role === "menuitem" && event.key === forward)) {
      event.preventDefault();
      menu.edge.current = event.key === "ArrowUp" ? "last" : "first";
      menu.request(true);
    }
  }} />;
}

export function DropdownPopover({ ref, className = "", style, onKeyDown, children, ...props }: Omit<ComponentPropsWithRef<"div">, "id" | "role" | "popover" | "aria-label">) {
  const menu = useMenu();
  const attached = useNativeRef(menu.panel, ref);
  const search = useRef({ text: "", time: 0 });
  useEffect(() => { if (!menu.visible) search.current = { text: "", time: 0 }; }, [menu.visible]);
  return <div {...props} ref={attached} id={menu.identity} role="menu" aria-label={menu.label} popover="manual" tabIndex={0} className={`hk-dropdown-popover ${className}`} style={{ ...style, positionAnchor: menu.anchor } as CSSProperties} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing || (event.target as HTMLElement).closest('[role="menu"]') !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const panel = event.currentTarget;
    const backwards = getComputedStyle(panel).direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); menu.request(false); return; }
    if (event.key === "Tab") { menu.dismissAll(); return; }
    const origin = event.target as HTMLElement;
    if (origin.matches("input, textarea, select") || origin.isContentEditable) return;
    if (event.key === backwards && panel.parentElement?.closest('[role="menu"]')) { event.preventDefault(); event.stopPropagation(); menu.request(false); return; }
    const items = menuItems(panel);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let target: HTMLButtonElement | undefined;
    if (event.key === "ArrowDown") target = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") target = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") target = items[0];
    else if (event.key === "End") target = items.at(-1);
    else if (event.key.length === 1 && event.key !== " ") {
      const now = performance.now();
      const text = now - search.current.time > 700 ? event.key : search.current.text + event.key;
      search.current = { text, time: now };
      const prefix = Array.from(text).every(character => character === text[0]) ? text[0] : text;
      target = [...items.slice(index + 1), ...items.slice(0, index + 1)].find(item => (item.dataset.textValue ?? item.textContent ?? "").trim().toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()));
    }
    if (target) { event.preventDefault(); target.focus(); }
  }}>{children}</div>;
}

export function DropdownGroup({ label, children }: { label: string; children: ReactNode }) {
  const identity = useId();
  return <div role="group" aria-labelledby={identity} className="hk-dropdown-group"><span id={identity} className="hk-dropdown-heading">{label}</span>{children}</div>;
}

export function DropdownDivider() { return <Separator />; }

export function DropdownItem({ label, description, icon, shortcut, selected, onSelect, closeOnSelect = true, onClick, className = "", disabled, ...props }: Omit<ComponentPropsWithRef<"button">, "children" | "onSelect"> & { label: string; description?: ReactNode; icon?: ReactNode; shortcut?: ReactNode; selected?: boolean; onSelect?: (event: MouseEvent<HTMLButtonElement>) => void; closeOnSelect?: boolean }) {
  const menu = useMenu();
  const identity = useId();
  return <button {...props} type="button" role={selected === undefined ? "menuitem" : "menuitemradio"} aria-checked={selected} aria-labelledby={`${identity}-label`} aria-describedby={description ? `${identity}-description` : undefined} tabIndex={-1} disabled={disabled || menu.disabled} data-text-value={label} className={`hk-dropdown-item ${className}`} onClick={event => {
    if (event.currentTarget.matches(":disabled")) return;
    onClick?.(event);
    if (!event.defaultPrevented) onSelect?.(event);
    if (!event.defaultPrevented && closeOnSelect) menu.dismissAll();
  }}>{icon && <span className="hk-dropdown-icon" aria-hidden="true">{icon}</span>}<span className="hk-dropdown-copy"><span id={`${identity}-label`}>{label}</span>{description && <span id={`${identity}-description`} className="hk-dropdown-description">{description}</span>}</span>{shortcut && <span className="hk-dropdown-shortcut" aria-hidden="true">{shortcut}</span>}{selected && <span aria-hidden="true">✓</span>}</button>;
}

const Navigation = createContext(false);
export function Sidebar({ label, children, header, footer, collapsed, defaultCollapsed = false, onCollapsedChange, className = "" }: { label: string; children: ReactNode; header?: ReactNode; footer?: ReactNode; collapsed?: boolean; defaultCollapsed?: boolean; onCollapsedChange?: (collapsed: boolean) => void; className?: string }) {
  const identity = useId();
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const compact = collapsed ?? localCollapsed;
  return <Navigation value={compact}><aside className={`hk-sidebar ${className}`} data-collapsed={compact || undefined} aria-label={label}><div className="hk-sidebar-top"><span className="hk-sidebar-title">{label}</span><IconButton label={compact ? "Expand navigation" : "Collapse navigation"} aria-expanded={!compact} aria-controls={identity} onClick={() => { if (collapsed === undefined) setLocalCollapsed(!compact); onCollapsedChange?.(!compact); }}><span aria-hidden="true">{compact ? "›" : "‹"}</span></IconButton></div><div className="hk-sidebar-header" hidden={compact}>{header}</div><nav id={identity} aria-label={`${label} navigation`}>{children}</nav><div className="hk-sidebar-footer" hidden={compact}>{footer}</div></aside></Navigation>;
}

export function SidebarItem({ label, icon, badge, selected = false, href, disabled = false, onSelect }: { label: string; icon?: ReactNode; badge?: string | number; selected?: boolean; href?: string; disabled?: boolean; onSelect?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void }) {
  const compact = useContext(Navigation);
  const contents = <><span className="hk-sidebar-icon" aria-hidden="true">{icon ?? label.slice(0, 1)}</span><span className={compact ? "hk-sr-only" : "hk-sidebar-item-label"}>{label}</span>{badge !== undefined && !compact && <span className="hk-sidebar-badge" aria-hidden="true">{badge}</span>}</>;
  const props = { className: "hk-sidebar-item", "aria-label": badge === undefined ? label : `${label}, ${badge}`, "aria-current": selected ? "page" as const : undefined, onClick: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => { if (disabled) event.preventDefault(); else onSelect?.(event); } };
  const control = href === undefined ? <button {...props} type="button" disabled={disabled}>{contents}</button> : <a {...props} href={disabled ? undefined : href} role="link" aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined}>{contents}</a>;
  return compact && !disabled ? <Tooltip content={label} side="right">{control}</Tooltip> : control;
}

export function CarouselItem({ label, width = "min(100%, 28rem)", className = "", style, ...props }: ComponentPropsWithRef<"div"> & { label: string; width?: CSSProperties["flexBasis"] }) {
  return <div {...props} role="group" aria-roledescription="slide" aria-label={label} className={`hk-carousel-item ${className}`} style={{ ...style, flexBasis: width }} />;
}

function slideOffset(track: HTMLElement, item: HTMLElement, align: "start" | "center") {
  const target = item.getBoundingClientRect();
  const bounds = track.getBoundingClientRect();
  return align === "center" ? (target.left + target.right - bounds.left - bounds.right) / 2 : getComputedStyle(track).direction === "rtl" ? target.right - bounds.right : target.left - bounds.left;
}

export function Carousel({ label, children, align = "start", gap = 24, showArrows = true, showDots = true }: { label: string; children: ReactNode; align?: "start" | "center"; gap?: number; showArrows?: boolean; showDots?: boolean }) {
  const identity = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, count: 0, start: true, end: true });
  const items = () => Array.from(viewport.current?.querySelectorAll<HTMLElement>(".hk-carousel-item") ?? []).filter(item => item.parentElement === viewport.current);
  const measure = useCallback(() => {
    const track = viewport.current;
    if (!track) return;
    const entries = items();
    const bounds = track.getBoundingClientRect();
    const rtl = getComputedStyle(track).direction === "rtl";
    const first = entries[0]?.getBoundingClientRect();
    const last = entries.at(-1)?.getBoundingClientRect();
    const start = !first || (rtl ? first.right <= bounds.right + 1 : first.left >= bounds.left - 1);
    const end = !last || (rtl ? last.left >= bounds.left - 1 : last.right <= bounds.right + 1);
    const distances = entries.map(item => Math.abs(slideOffset(track, item, align)));
    const index = start ? 0 : end ? entries.length - 1 : distances.indexOf(Math.min(...distances));
    const next = { index: Math.max(0, index), count: entries.length, start, end };
    setPosition(previous => Object.keys(next).every(key => previous[key as keyof typeof previous] === next[key as keyof typeof next]) ? previous : next);
  }, [align, children, gap]);
  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    items().forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [measure]);
  const go = (index: number) => {
    const track = viewport.current;
    const entries = items();
    if (!track || !entries.length) return;
    const target = entries[Math.max(0, Math.min(entries.length - 1, index))];
    track.scrollBy({ left: slideOffset(track, target, align), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const step = (direction: number) => {
    const track = viewport.current;
    if (!track) return;
    const entries = items();
    const ordered = direction > 0 ? entries : [...entries].reverse();
    const axis = getComputedStyle(track).direction === "rtl" ? -1 : 1;
    const target = ordered.find(item => slideOffset(track, item, align) * axis * direction > 1);
    if (target) go(entries.indexOf(target));
  };
  const scrollable = !(position.start && position.end);
  return <section className="hk-carousel" role="region" aria-roledescription="carousel" aria-label={label}><div ref={viewport} id={identity} className="hk-carousel-track" tabIndex={0} aria-label={`${label} slides`} style={{ gap: Math.max(0, Number.isFinite(gap) ? gap : 24), "--hk-carousel-align": align } as CSSProperties} onScroll={measure} onKeyDown={event => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); go(event.key === "Home" ? 0 : position.count - 1); }
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); step((event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1)); }
  }}>{children}</div>{scrollable && <div className="hk-carousel-controls">{showArrows && <IconButton label="Previous slide" aria-controls={identity} disabled={position.start} onClick={() => step(-1)}><span aria-hidden="true">‹</span></IconButton>}{showDots && <div className="hk-carousel-dots" role="group" aria-label="Choose slide">{Array.from({ length: position.count }, (_, index) => <button key={index} type="button" aria-label={`Go to slide ${index + 1}`} aria-controls={identity} aria-current={index === position.index ? "true" : undefined} onClick={() => go(index)}><span /></button>)}</div>}{showArrows && <IconButton label="Next slide" aria-controls={identity} disabled={position.end} onClick={() => step(1)}><span aria-hidden="true">›</span></IconButton>}</div>}<span className="hk-sr-only" role="status">{position.count ? `Slide ${position.index + 1} of ${position.count}` : "No slides"}</span></section>;
}
