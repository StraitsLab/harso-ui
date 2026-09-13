import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { List, SidebarSimple, X } from "@phosphor-icons/react";
import "./shell.css";

export type HarsoChatShellProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  sidebar: ReactNode;
  header?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  themeToggle?: ReactNode;
  main?: ReactNode;
  composer?: ReactNode;
  aside?: ReactNode;
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

export function HarsoChatShell({ sidebar, header, title, actions, themeToggle, main, composer, aside, children, className = "", ...props }: HarsoChatShellProps) {
  const root = useRef<HTMLDivElement>(null);
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
  return <div {...props} ref={root} className={`hkc-shell ${className}`} data-layout={layout}>
    <div className="hkc-shell-grid" data-has-aside={!!aside}>
      {layout === "desktop" ? <aside className="hkc-shell-sidebar" aria-label="Conversation navigation">{sidebar}</aside> : layout === "tablet" ? <nav className="hkc-shell-rail" aria-label="Conversation navigation">{sidebarToggle}</nav> : null}
      <div className="hkc-shell-center">
        <header className="hkc-shell-header">
          {layout === "phone" && sidebarToggle}
          <div className="hkc-shell-heading">{header ?? <h1>{title}</h1>}</div>
          {actions}{themeToggle}
          {aside && layout !== "desktop" && <button type="button" className="hkc-shell-icon" aria-label="Open context" aria-haspopup="dialog" aria-expanded={sheet === "aside"} onClick={() => setSheet("aside")}><SidebarSimple size={20} /></button>}
        </header>
        <main className="hkc-shell-main">{main ?? children}</main>
        {composer && <div className="hkc-shell-composer">{composer}</div>}
      </div>
      {aside && layout === "desktop" && <aside className="hkc-shell-aside" aria-label="Context">{aside}</aside>}
    </div>
    {sheet && <ShellSheet label={sheet === "sidebar" ? "Conversations" : "Context"} kind={sheet} onClose={() => setSheet(null)}>{sheet === "sidebar" ? sidebar : aside}</ShellSheet>}
  </div>;
}
