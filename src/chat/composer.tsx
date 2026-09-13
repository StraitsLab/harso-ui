"use client";

import type { ReactNode } from "react";
import { ComposerPrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowUp, Paperclip, Square } from "@phosphor-icons/react";
import { HarsoComposerAttachment } from "./attachments";
import "./composer.css";

export interface HarsoComposerProps {
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

export function HarsoComposer({ leading, trailing, error, disabled = false, placeholder = "What should we work on next?", className = "", "aria-label": label = "Message", submitMode = "enter", "aria-describedby": describedBy, attachments = true, cancellable = true }: HarsoComposerProps) {
  const running = useAuiState(state => state.thread.isRunning);
  const runtimeDisabled = useAuiState(state => state.thread.isDisabled);
  const unavailable = disabled || runtimeDisabled;
  return <ComposerPrimitive.AttachmentDropzone className={`hkc-composer-dock ${className}`} disabled={unavailable}
    onDragOverCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
    onDropCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}>
    <ComposerPrimitive.Root className="hkc-composer" aria-label="Message composer" aria-disabled={unavailable || undefined} onSubmit={event => { if (unavailable) event.preventDefault(); }}>
      <fieldset className="hkc-composer-fields" disabled={unavailable}>
        <div className="hkc-composer-attachments"><ComposerPrimitive.Attachments components={{ Attachment: HarsoComposerAttachment }} /></div>
        <ComposerPrimitive.Input className="hkc-composer-input" aria-label={label} aria-describedby={describedBy} aria-keyshortcuts={submitMode === "ctrlEnter" ? "Meta+Enter Control+Enter" : "Enter"} placeholder={placeholder} rows={1} disabled={unavailable} submitMode={submitMode} addAttachmentOnPaste={attachments && !unavailable} render={<textarea />} />
        {error && <div className="hkc-composer-error" role="alert">{error}</div>}
      </fieldset>
      <div className="hkc-composer-footer">
        {attachments && <ComposerPrimitive.AddAttachment className="hkc-composer-button" aria-label="Add attachment" title="Add attachment" disabled={unavailable}><Paperclip size={16} aria-hidden="true" /></ComposerPrimitive.AddAttachment>}
        <div className="hkc-composer-leading">{leading}</div>
        <div className="hkc-composer-trailing">{trailing}</div>
        {running && cancellable ? <ComposerPrimitive.Cancel className="hkc-composer-button hkc-composer-send" aria-label="Stop" title="Stop"><Square size={16} weight="fill" aria-hidden="true" /></ComposerPrimitive.Cancel>
          : <ComposerPrimitive.Send className="hkc-composer-button hkc-composer-send" disabled={unavailable || running} aria-label="Send" title="Send"><ArrowUp size={16} aria-hidden="true" /></ComposerPrimitive.Send>}
      </div>
    </ComposerPrimitive.Root>
  </ComposerPrimitive.AttachmentDropzone>;
}
