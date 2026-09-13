import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button, IconButton } from "./primitives";
import { SidebarSimpleIcon, ListIcon, XIcon } from "@phosphor-icons/react";

/** Private dashboard layout infrastructure; not part of the root API. */
export type DashboardWorkspaceProps = ComponentPropsWithRef<"section"> & {
  title?: string; navigation?: ReactNode; actions?: ReactNode; status?: ReactNode;
  changesCount?: number; onTogglePanel?: () => void;
  panel?: { title: string; content: ReactNode; onClose: () => void } | null;
};
export function DashboardWorkspace({ title = "Workspace", navigation, actions, status, panel, changesCount, onTogglePanel, children, className = "", ref, ...props }: DashboardWorkspaceProps) {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const phoneMode = useRef<boolean | null>(null);
  const [compact, setCompact] = useState(true);
  const root = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const panelOpen = Boolean(panel);
  const identity = useId();
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !panelOpen) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      element.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    };
  }, [panelOpen]);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !panelOpen) return;
    const focused = element.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    if (element.open) element.close();
    element.setAttribute("closedby", "closerequest");
    if (compact) element.showModal(); else element.show();
    focused?.focus({ preventScroll: true });
  }, [panelOpen, compact]);
  useEffect(() => {
    if (!root.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => { if (entries[0]) { const width = entries[0].contentRect.width; setCompact(width < 900); const phone = width <= 640; if (phoneMode.current !== phone) { setNavigationOpen(!phone); phoneMode.current = phone; } } });
    observer.observe(root.current);
    root.current.querySelectorAll<HTMLElement>(".hk-dashboard-workspace-navigation button").forEach(button => { if (!button.title) button.title = button.getAttribute("aria-label") || button.textContent || ""; });
    return () => observer.disconnect();
  }, []);
  return <section {...props} ref={element => { root.current = element; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} className={`hk-dashboard-workspace ${className}`} data-compact={compact} data-navigation={Boolean(navigation && navigationOpen)} data-panel={Boolean(panel)}>
    <header className="hk-dashboard-workspace-header"><div>{navigation && <IconButton label="Toggle workspace navigation" className="hk-dashboard-navigation-toggle" aria-controls={`${identity}-navigation`} aria-expanded={navigationOpen} onClick={() => setNavigationOpen(open => !open)}><ListIcon size={18} /></IconButton>}<h2>{title}</h2></div><div>{status}{actions}{changesCount !== undefined && <span className="hk-dashboard-changes-count" aria-label={`${changesCount} changes`}>{changesCount}</span>}{(panel || onTogglePanel) && <Button leadingIcon={<SidebarSimpleIcon size={16} />} aria-label="Toggle context panel" aria-expanded={panelOpen} onClick={onTogglePanel ?? panel?.onClose}>Panel</Button>}</div></header>
    <div className="hk-dashboard-workspace-body">
      {navigation && <nav id={`${identity}-navigation`} aria-label="Dashboard workspace" className="hk-dashboard-workspace-navigation" hidden={!navigationOpen && phoneMode.current === null} onKeyDown={event => { if (event.key === "Escape") { setNavigationOpen(false); root.current?.querySelector<HTMLButtonElement>(".hk-dashboard-navigation-toggle")?.focus(); } }}>{navigation}</nav>}
      {navigation && navigationOpen && <button type="button" className="hk-dashboard-navigation-backdrop" aria-label="Close workspace navigation" onClick={() => setNavigationOpen(false)} />}
      <div className="hk-dashboard-workspace-content"><div className="hk-dashboard-workspace-thread">{children}</div></div>
        {panel && <dialog ref={dialog} className="hk-dashboard-workspace-panel" aria-labelledby={`${identity}-panel-title`} onCancel={event => { event.preventDefault(); panel.onClose(); }}>
          <div className="hk-dashboard-workspace-panel-header"><h2 id={`${identity}-panel-title`}>{panel.title}</h2><IconButton label="Close context panel" onClick={panel.onClose}><XIcon size={18} /></IconButton></div>
          <div className="hk-dashboard-workspace-panel-content">{panel.content}</div>
        </dialog>}
    </div>
  </section>;
}
