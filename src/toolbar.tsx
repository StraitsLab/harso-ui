import type { ComponentPropsWithRef, CSSProperties } from "react";

export function Toolbar({ isVisible = true, position = "top", offset = 10, className = "", style, onKeyDown, ...props }: ComponentPropsWithRef<"div"> & { isVisible?: boolean; position?: "top" | "right" | "bottom" | "left"; offset?: number }) {
  if (!isVisible) return null;
  return <div {...props} role="toolbar" className={`hk-toolbar hk-toolbar--${position} ${className}`} style={{ "--hk-toolbar-offset": `${Number.isFinite(offset) ? Math.max(0, offset) : 10}px`, ...style } as CSSProperties} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const actions = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled):not([hidden]):not([aria-disabled='true']), a[href]:not([hidden])")).filter(action => !action.closest("[hidden], [inert]"));
    const current = actions.indexOf(event.target as HTMLElement);
    if (current < 0 || !actions.length) return;
    event.preventDefault();
    const index = event.key === "Home" ? 0 : event.key === "End" ? actions.length - 1 : (current + (event.key === "ArrowRight" ? 1 : actions.length - 1)) % actions.length;
    actions[index].focus();
  }} />;
}
