"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ComposerPrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowUp, CaretDown, Plus, Square } from "@phosphor-icons/react";
import { HarsoComposerAttachment } from "./attachments";
import "./composer.css";

export interface HarsoComposerProps {
  /** Host-owned picker; label and glyph remain runtime-configurable. */
  modelSelector?: { label: string; glyph?: ReactNode; onClick?: () => void; disabled?: boolean };
  /** Host-owned voice control (supply an accessible button). */
  voice?: ReactNode;
  "data-layout"?: "phone" | "desktop";
  leading?: ReactNode;
  trailing?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  /** Enter sends (default) or Ctrl/⌘+Enter sends; Shift+Enter always inserts a newline. */
  submitMode?: "enter" | "ctrlEnter";
  "aria-describedby"?: string;
  /** Hide the attachment button when the host has no attachment adapter. */
  attachments?: boolean;
  /** Show Stop while running; set false when the runtime cannot cancel (Send stays disabled instead). */
  cancellable?: boolean;
}

export function HarsoComposer({ modelSelector, voice, "data-layout": layout, leading, trailing, error, disabled = false, placeholder, className = "", "aria-label": label = "Message", submitMode = "enter", "aria-describedby": describedBy, attachments = true, cancellable = true }: HarsoComposerProps) {
  const running = useAuiState(state => state.thread.isRunning);
  const runtimeDisabled = useAuiState(state => state.thread.isDisabled);
  const unavailable = disabled || runtimeDisabled;
  const text = useAuiState(state => state.thread.composer.text);
  const dock = useRef<HTMLDivElement>(null);
  const [multiline, setMultiline] = useState(false);
  useLayoutEffect(() => {
    const element = dock.current;
    if (!element) return;
    const measure = () => {
      const input = element.querySelector<HTMLTextAreaElement>("textarea");
      const form = element.querySelector<HTMLElement>(".hkc-composer");
      if (!input || !form) return;
      // Hosts render the composer under test environments without a full window (e.g. a consumer test that mounts a
      // surface through a stubbed DOM); the pill/expanded switch is progressive, so skip measuring rather than throw.
      const view = element.ownerDocument.defaultView;
      if (!view || typeof view.getComputedStyle !== "function") return;
      const style = view.getComputedStyle(form);
      const controls = [...form.querySelectorAll<HTMLElement>(".hkc-composer-control")].filter(node => view.getComputedStyle(node).display !== "none");
      const width = form.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0") - controls.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) - controls.length * (parseFloat(style.columnGap) || 0);
      // Measure at the collapsed row width even when expanded, avoiding wrap/unwrap oscillation.
      const probe = input.cloneNode() as HTMLTextAreaElement;
      const inputStyle = view.getComputedStyle(input);
      Object.assign(probe.style, { position: "fixed", visibility: "hidden", pointerEvents: "none", height: "0", minHeight: "0", maxHeight: "none", width: `${Math.max(1, width)}px`, font: inputStyle.font, lineHeight: inputStyle.lineHeight, padding: "0", border: "0", boxSizing: "border-box" });
      probe.removeAttribute("id");
      probe.setAttribute("aria-hidden", "true");
      probe.tabIndex = -1;
      probe.value = text;
      document.body.append(probe);
      setMultiline(text.includes("\n") || probe.scrollHeight > parseFloat(inputStyle.lineHeight) + 1);
      probe.remove();
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, modelSelector?.label, leading, trailing, voice, layout]);
  return <ComposerPrimitive.AttachmentDropzone ref={dock} data-layout={layout} className={`hkc-composer-dock ${className}`} disabled={unavailable}
    onDragOverCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
    onDropCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}>
    <ComposerPrimitive.Root data-multiline={multiline || undefined} className="hkc-composer" aria-label="Message composer" aria-disabled={unavailable || undefined} onSubmit={event => { if (unavailable) event.preventDefault(); }}>
      <fieldset className="hkc-composer-fields" disabled={unavailable}>
        <div className="hkc-composer-attachments"><ComposerPrimitive.Attachments components={{ Attachment: HarsoComposerAttachment }} /></div>
      </fieldset>
      {attachments && <ComposerPrimitive.AddAttachment className="hkc-composer-button hkc-composer-control" aria-label="Add attachment" title="Add attachment" disabled={unavailable}><Plus size={16} aria-hidden="true" /></ComposerPrimitive.AddAttachment>}
      {modelSelector && <button type="button" className="hkc-composer-model hkc-composer-control" onClick={modelSelector.onClick} disabled={modelSelector.disabled} aria-label={`Select model: ${modelSelector.label}`}><span className="hkc-composer-model-glyph" aria-hidden="true">{modelSelector.glyph}</span><span>{modelSelector.label}</span><CaretDown className="hkc-composer-model-chevron" size={9} aria-hidden="true" /></button>}
      {leading && <div className="hkc-composer-leading hkc-composer-control">{leading}</div>}
      <fieldset className="hkc-composer-fields" disabled={unavailable}>
        <ComposerPrimitive.Input className="hkc-composer-input" aria-label={label} aria-describedby={describedBy} aria-keyshortcuts={submitMode === "ctrlEnter" ? "Meta+Enter Control+Enter" : "Enter"} placeholder={placeholder ?? (layout === "phone" ? "Message Weave" : "Reply…")} rows={1} disabled={unavailable} submitMode={submitMode} addAttachmentOnPaste={attachments && !unavailable} render={<textarea />} />
        {error && <div className="hkc-composer-error" role="alert">{error}</div>}
      </fieldset>
      {trailing && <div className="hkc-composer-trailing hkc-composer-control">{trailing}</div>}
      {voice && <div className="hkc-composer-voice hkc-composer-control">{voice}</div>}
        {running && cancellable ? <ComposerPrimitive.Cancel className="hkc-composer-button hkc-composer-send hkc-composer-control" aria-label="Stop" title="Stop"><Square size={16} weight="fill" aria-hidden="true" /></ComposerPrimitive.Cancel>
          : <ComposerPrimitive.Send className="hkc-composer-button hkc-composer-send hkc-composer-control" disabled={unavailable || running} aria-label="Send" title="Send"><ArrowUp size={15} weight="bold" aria-hidden="true" /></ComposerPrimitive.Send>}
    </ComposerPrimitive.Root>
  </ComposerPrimitive.AttachmentDropzone>;
}
