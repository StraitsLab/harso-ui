"use client";

import { XIcon } from "@phosphor-icons/react";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../primitives";
import "./output-detail.css";

export type HarsoOutputPreviewState = "loading" | "ready" | "unsupported" | "error" | "unavailable";

export interface HarsoOutputAction {
  enabled: boolean;
  pending: boolean;
  unavailableReason?: string;
  /** Safe human copy supplied by the host, not a raw exception. */
  error?: string;
  /** Host owns promises, duplicate-operation fencing and outcomes. */
  onInvoke: () => void;
}

export interface HarsoOutputDetailProps {
  contentKey: string;
  title: string;
  kind: "image" | "document" | "file";
  /** Trusted host composition, never agent-authored component data or HTML. */
  content: ReactNode;
  details?: ReactNode;
  previewState: HarsoOutputPreviewState;
  previewMessage?: string;
  actions: { download?: HarsoOutputAction; expand?: HarsoOutputAction; openExternally?: HarsoOutputAction };
  onClose: () => void;
  className?: string;
}

function OutputAction({ action, name, label }: { action: HarsoOutputAction; name: "download" | "expand" | "openExternally"; label: string }) {
  const id = useId();
  const description = [action.pending ? `${label} in progress.` : "", action.unavailableReason, action.error].filter(Boolean).join(" ");
  return <div className={`hkc-output-action hkc-output-action--${name}`}>
    <Button variant={name === "download" ? "primary" : "quiet"} disabled={!action.enabled} pending={action.pending}
      aria-describedby={description ? id : undefined} onClick={action.onInvoke}>
      {name === "download" && action.error ? "Retry download" : label}
    </Button>
    <p id={id} className="hkc-output-action-description" role="status">{description}</p>
  </div>;
}

const PREVIEW_MESSAGE: Record<HarsoOutputPreviewState, string> = {
  loading: "Loading preview…", ready: "", unsupported: "Preview is not supported for this file.",
  error: "Preview could not be displayed.", unavailable: "Preview is unavailable.",
};

export function HarsoOutputDetail({ contentKey, title, kind, content, details, previewState, previewMessage, actions, onClose, className = "" }: HarsoOutputDetailProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [disclosure, setDisclosure] = useState({ contentKey, open: false });
  // Reset during render so a newly selected output never paints stale metadata.
  if (disclosure.contentKey !== contentKey) setDisclosure({ contentKey, open: false });
  const detailsOpen = disclosure.open && details != null;
  useLayoutEffect(() => {
    const element = panel.current, button = trigger.current, header = button?.parentElement;
    if (!detailsOpen || !element || !button || !header) return;
    // Keep the region in document order, not a modal/menu or a portalled surface.
    // Measure the visible space, not a fraction of the viewport below a tall header.
    const ancestors: HTMLElement[] = [];
    for (let node = header.parentElement; node; node = node.parentElement) ancestors.push(node);
    const viewport = window.visualViewport;
    const place = () => {
      const anchor = button.getBoundingClientRect(), origin = header.getBoundingClientRect();
      // Computed height retains fractions; offsetHeight rounds and would push
      // a resized disclosure fractionally past the viewport even without zoom.
      const headerHeight = parseFloat(getComputedStyle(header).height);
      const scale = headerHeight ? origin.height / headerHeight : 1;
      const gap = parseFloat(getComputedStyle(element).getPropertyValue("--hk-space-1")) * scale;
      let top = viewport?.offsetTop ?? 0;
      let bottom = top + (viewport?.height ?? window.innerHeight);
      for (const node of ancestors) {
        if (!/(auto|scroll|hidden|clip)/.test(getComputedStyle(node).overflowY)) continue;
        const rect = node.getBoundingClientRect();
        top = Math.max(top, rect.top + node.clientTop * scale);
        bottom = Math.min(bottom, rect.top + (node.clientTop + node.clientHeight) * scale);
      }
      const below = Math.min(bottom, Math.max(top, anchor.bottom + gap));
      const above = Math.max(top, Math.min(bottom, anchor.top - gap));
      const belowSpace = Math.max(0, bottom - below), aboveSpace = Math.max(0, above - top);
      const style = getComputedStyle(element);
      const naturalHeight = (element.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)) * scale;
      const downward = naturalHeight <= belowSpace || belowSpace >= aboveSpace;
      const available = downward ? belowSpace : aboveSpace;
      element.style.maxHeight = `min(70dvh, ${available / scale}px)`;
      const height = element.getBoundingClientRect().height;
      element.style.top = `${((downward ? below : above - height) - origin.top) / scale}px`;
    };
    place();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(place);
    for (const node of [header, element, ...ancestors]) observer?.observe(node);
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    viewport?.addEventListener("resize", place);
    viewport?.addEventListener("scroll", place);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
      viewport?.removeEventListener("resize", place);
      viewport?.removeEventListener("scroll", place);
      element.style.removeProperty("top");
      element.style.removeProperty("max-height");
    };
  }, [detailsOpen, details]);
  return <section className={`hkc-output-detail ${className}`} data-kind={kind} aria-labelledby={`${id}-title`}
    onKeyDown={event => {
      if (event.key === "Escape" && detailsOpen) {
        event.stopPropagation();
        setDisclosure({ contentKey, open: false });
        trigger.current?.focus();
      }
    }}>
    <header className="hkc-output-header">
      <h2 id={`${id}-title`} className="hkc-output-title">{title}</h2>
      {details != null && <Button ref={trigger} className="hkc-output-details-toggle" aria-expanded={detailsOpen} aria-controls={`${id}-details`}
        onClick={() => setDisclosure({ contentKey, open: !detailsOpen })}>Details</Button>}
      <Button variant="ghost" className="hkc-output-close" aria-label="Close output" onClick={onClose}><XIcon size={16} aria-hidden="true" /></Button>
      {details != null && <div ref={panel} id={`${id}-details`} className="hkc-output-details" role="region" aria-label="Output details" hidden={!detailsOpen}>{details}</div>}
    </header>
    <div className="hkc-output-body">
      <div className="hkc-output-content">{content}</div>
      <p className="hkc-output-status" role="status" aria-live="polite" aria-atomic="true">{previewMessage ?? PREVIEW_MESSAGE[previewState]}</p>
      <div className="hkc-output-actions">
        {actions.download && <OutputAction name="download" label="Download" action={actions.download} />}
        {actions.expand && <OutputAction name="expand" label="Expand" action={actions.expand} />}
        {actions.openExternally && <OutputAction name="openExternally" label="Open externally" action={actions.openExternally} />}
      </div>
    </div>
  </section>;
}
