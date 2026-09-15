import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CaretLeft, CaretRight, List, SidebarSimple, X } from "@phosphor-icons/react";
import "./shell.css";

export type HarsoChatShellProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  sidebar: ReactNode;
  nav?: ReactNode;
  footer?: ReactNode;
  windowControls?: boolean;
  subtitle?: ReactNode;
  onBack?: () => void;
  onForward?: () => void;
  header?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  themeToggle?: ReactNode;
  main?: ReactNode;
  composer?: ReactNode;
  aside?: ReactNode;
  /** Render the thread area as a `<main>` landmark (default). Hosts that already own a page `<main>` pass `false` to avoid nested/duplicate main landmarks. */
  mainLandmark?: boolean;
};

function ShellSheet({ label, kind, onClose, children }: { label: string; kind: "sidebar" | "aside"; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className={`hkc-shell-sheet hkc-shell-sheet--${kind}`} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <button className="hkc-shell-icon hkc-shell-close" type="button" aria-label={`Close ${label.toLowerCase()}`} onClick={onClose}><X size={20} /></button>
    {children}
  </dialog>;
}

export function HarsoChatShell({ sidebar, nav, footer, windowControls = false, subtitle, onBack, onForward, header, title, actions, themeToggle, main, composer, aside, mainLandmark = true, children, className = "", ...props }: HarsoChatShellProps) {
  const root = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [asideOpen, setAsideOpen] = useState(true);
  const [layout, setLayout] = useState<"phone" | "tablet" | "desktop">("desktop");
  const [sheet, setSheet] = useState<"sidebar" | "aside" | null>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = (width: number) => setLayout(width <= 640 ? "phone" : width < 1024 ? "tablet" : "desktop");
    update(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => { if (entries[0]) update(entries[0].contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setSheet(null); }, [layout]);
  const sidebarToggle = <button type="button" className="hkc-shell-icon" aria-label="Open conversations" aria-haspopup="dialog" aria-expanded={sheet === "sidebar"} onClick={() => setSheet("sidebar")}><List size={20} /></button>;
  const rail = layout === "tablet" || collapsed;
  const sourceContent = <><div className="hkc-shell-nav">{nav}</div><div className="hkc-shell-history">{sidebar}</div>{footer && <footer className="hkc-shell-account">{footer}</footer>}</>;
  const inspector = <><header className="hkc-shell-aside-header"><h2>Context</h2><button className="hkc-shell-icon" type="button" aria-label="Collapse context" onClick={() => layout === "desktop" ? setAsideOpen(false) : setSheet(null)}><SidebarSimple size={16} /></button></header><div className="hkc-shell-aside-body">{aside}</div></>;
  return <div {...props} ref={root} className={`hkc-shell ${className}`} data-layout={layout} data-sidebar={layout === "phone" ? "hidden" : rail ? "rail" : "expanded"}>
    <div className="hkc-shell-grid" data-has-aside={!!aside && asideOpen}>
      {layout !== "phone" && <aside className={`hkc-shell-sidebar${rail ? " hkc-shell-rail" : ""}`} role={layout === "tablet" ? "navigation" : undefined} aria-label="Conversation navigation">
        <div className="hkc-shell-titlebar">
          {windowControls && !rail && <span className="hkc-shell-window-controls" aria-hidden="true"><i /><i /><i /></span>}
          {layout === "tablet" ? sidebarToggle : <button type="button" className="hkc-shell-icon" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><SidebarSimple size={16} /></button>}
        </div>{sourceContent}
      </aside>}
      <div className="hkc-shell-center">
        <header className="hkc-shell-header">
          {layout === "phone" && sidebarToggle}
          <div className="hkc-shell-history-controls"><button type="button" className="hkc-shell-icon" aria-label="Go back" disabled={!onBack} onClick={onBack}><CaretLeft size={14} /></button><button type="button" className="hkc-shell-icon" aria-label="Go forward" disabled={!onForward} onClick={onForward}><CaretRight size={14} /></button></div>
          <div className="hkc-shell-heading">{header ?? <h1>{title}</h1>}{subtitle && <span className="hkc-shell-subtitle">{subtitle}</span>}</div>
          {actions}{themeToggle}
          {aside && (layout !== "desktop" || !asideOpen) && <button type="button" className="hkc-shell-icon" aria-label="Open context" aria-haspopup={layout !== "desktop" ? "dialog" : undefined} aria-expanded={layout === "desktop" ? asideOpen : sheet === "aside"} onClick={() => layout === "desktop" ? setAsideOpen(true) : setSheet("aside")}><SidebarSimple size={20} /></button>}
        </header>
        {mainLandmark ? <main className="hkc-shell-main">{main ?? children}</main> : <div className="hkc-shell-main">{main ?? children}</div>}
        {composer && <div className="hkc-shell-composer">{composer}</div>}
      </div>
      {aside && asideOpen && layout === "desktop" && <aside className="hkc-shell-aside" aria-label="Context">{inspector}</aside>}
    </div>
    {sheet && <ShellSheet label={sheet === "sidebar" ? "Conversations" : "Context"} kind={sheet} onClose={() => setSheet(null)}>{sheet === "sidebar" ? sourceContent : inspector}</ShellSheet>}
  </div>;
}
