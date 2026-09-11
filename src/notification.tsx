import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "./primitives";
import { SegmentedControl } from "./navigation";

export type NotificationTone = "information" | "success" | "error";
export type NotificationPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type NotificationProps = ComponentPropsWithRef<"div"> & {
  title?: string;
  description?: ReactNode;
  tone?: NotificationTone;
  icon?: ReactNode;
  avatar?: ReactNode;
  onDismiss?: () => void;
  duration?: number;
  open?: boolean;
  presence?: "online" | "busy" | "offline";
};

export function Notification({ title, description, tone = "information", icon, avatar, onDismiss, duration, open = true, presence, className = "", children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }: NotificationProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dismissed = useRef(false);
  const dismiss = useRef(onDismiss);
  const visible = open && !props.hidden;
  useEffect(() => { dismiss.current = onDismiss; }, [onDismiss]);
  useEffect(() => { dismissed.current = false; if (!visible) { setHovered(false); setFocused(false); } }, [duration, visible]);
  useEffect(() => {
    if (!visible || hovered || focused || duration === undefined || !Number.isFinite(duration) || duration <= 0 || duration > 2147483647 || dismissed.current || !onDismiss) return;
    const timer = setTimeout(() => { if (!dismissed.current) { dismissed.current = true; dismiss.current?.(); } }, duration);
    return () => clearTimeout(timer);
  }, [duration, visible, hovered, focused, !!onDismiss]);
  return <div {...props} hidden={!visible} aria-hidden={!visible ? true : props["aria-hidden"]} inert={!visible || props.inert} role={props.role ?? "status"} className={`hk-notification hk-notification--${tone} ${className}`} data-tone={tone} onMouseEnter={event => { setHovered(true); onMouseEnter?.(event); }} onMouseLeave={event => { setHovered(false); onMouseLeave?.(event); }} onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); onBlur?.(event); }}>
    <div className="hk-notification-visual" aria-hidden={icon ? undefined : true}>{avatar ?? icon ?? <span className="hk-notification-dot" />}</div>
    <div className="hk-notification-body">{title && <h3>{title}</h3>}{presence && <span className="hk-notification-presence" data-presence={presence}>{({ online: "Online", busy: "Busy", offline: "Offline" })[presence]}</span>}{description && <div className="hk-notification-description">{description}</div>}{children}</div>
    {onDismiss && <Button size="small" className="hk-notification-dismiss" onClick={() => { dismissed.current = true; onDismiss(); }} aria-label="Dismiss notification">Dismiss</Button>}
  </div>;
}

export function NotificationViewport({ position = "bottom-right", label = "Notifications", children, className = "", ...props }: ComponentPropsWithRef<"div"> & { position?: NotificationPosition; label?: string }) {
  return <div {...props} aria-label={label} className={`hk-notification-viewport hk-notification-viewport--${position} ${className}`}>{children}</div>;
}

export function NotificationAction({ className = "", ...props }: ButtonProps) { return <Button {...props} size="small" className={`hk-notification-action ${className}`} />; }

export type NotificationCenterItem = { id: string; title: string; description?: ReactNode; tone?: NotificationTone; read?: boolean; category?: "mentions" | "system"; disabled?: boolean; avatar?: ReactNode; icon?: ReactNode; action?: { label: string; onAction: () => void; disabled?: boolean } };
type NotificationFilter = "all" | "mentions" | "system";
export type NotificationCenterProps = Omit<ComponentPropsWithRef<"section">, "onSelect"> & { items: readonly NotificationCenterItem[]; onSelect?: (item: NotificationCenterItem) => void; onMarkRead?: (id: string) => void; filter?: NotificationFilter; defaultFilter?: NotificationFilter; onFilterChange?: (filter: NotificationFilter) => void; disabled?: boolean };
export function NotificationCenter({ items, onSelect, onMarkRead, filter, defaultFilter = "all", onFilterChange, disabled = false, className = "", ...props }: NotificationCenterProps) {
  const [localFilter, setLocalFilter] = useState(defaultFilter);
  const selected = filter ?? localFilter;
  const visible = items.filter(item => selected === "all" || item.category === selected);
  const unread = items.filter(item => !item.read && !item.disabled);
  const markRead = (item: NotificationCenterItem) => { if (!item.read) onMarkRead?.(item.id); };
  return <section {...props} className={`hk-notification-center ${className}`} aria-label={props["aria-label"] ?? "Notification center"}>
    <header className="hk-notification-center-header"><h2>Notifications</h2><span>{items.length}</span><Button size="small" disabled={disabled || !onMarkRead || !unread.length} onClick={() => unread.forEach(markRead)}>Mark all read</Button></header>
    <SegmentedControl label="Notification filter" items={[{ value: "all", label: "All" }, { value: "mentions", label: "Mentions" }, { value: "system", label: "System" }]} value={selected} disabled={disabled} onValueChange={next => { if (filter === undefined) setLocalFilter(next as NotificationFilter); onFilterChange?.(next as NotificationFilter); }} />
    <div className="hk-notification-center-list">{visible.length ? visible.map(item => <div key={item.id} className="hk-notification-center-row"><button type="button" className={`hk-notification-center-item hk-notification-center-item--${item.tone ?? "information"}`} data-read={item.read || undefined} disabled={disabled || item.disabled || (!onSelect && (!onMarkRead || item.read))} onClick={() => { onSelect?.(item); markRead(item); }}><span aria-hidden="true">{item.avatar ?? item.icon ?? <span className="hk-notification-dot" />}</span><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span>{!item.read && <span className="hk-notification-unread" aria-label="Unread" />}</button>{item.action && <NotificationAction disabled={disabled || item.disabled || item.action.disabled} onClick={() => { item.action?.onAction(); markRead(item); }}>{item.action.label}</NotificationAction>}</div>) : <p className="hk-notification-empty" role="status">{items.length ? "No notifications in this filter." : "You’re all caught up."}</p>}</div>
  </section>;
}
