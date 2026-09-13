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
}

export function HarsoComposer({ leading, trailing, error, disabled = false, placeholder = "What should we work on next?", className = "", "aria-label": label = "Message" }: HarsoComposerProps) {
  const running = useAuiState(state => state.thread.isRunning);
  const runtimeDisabled = useAuiState(state => state.thread.isDisabled);
  const unavailable = disabled || runtimeDisabled;
  return <ComposerPrimitive.AttachmentDropzone className={`hkc-composer-dock ${className}`} disabled={unavailable}
    onDragOverCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
    onDropCapture={event => { if (unavailable && event.dataTransfer.types.includes("Files")) event.preventDefault(); }}>
    <ComposerPrimitive.Root className="hkc-composer" aria-label="Message composer" aria-disabled={unavailable || undefined} onSubmit={event => { if (unavailable) event.preventDefault(); }}>
      <fieldset className="hkc-composer-fields" disabled={unavailable}>
        <div className="hkc-composer-attachments"><ComposerPrimitive.Attachments components={{ Attachment: HarsoComposerAttachment }} /></div>
        <ComposerPrimitive.Input className="hkc-composer-input" aria-label={label} placeholder={placeholder} rows={1} disabled={unavailable} submitMode="enter" addAttachmentOnPaste={!unavailable} render={<textarea />} />
        {error && <div className="hkc-composer-error" role="alert">{error}</div>}
        <div className="hkc-composer-footer">
          <ComposerPrimitive.AddAttachment className="hkc-composer-button" aria-label="Add attachment" title="Add attachment"><Paperclip size={16} aria-hidden="true" /></ComposerPrimitive.AddAttachment>
          <div className="hkc-composer-leading">{leading}</div>
          <div className="hkc-composer-trailing">{trailing}</div>
          {running ? <ComposerPrimitive.Cancel className="hkc-composer-button hkc-composer-send" aria-label="Stop" title="Stop"><Square size={16} weight="fill" aria-hidden="true" /></ComposerPrimitive.Cancel>
            : <ComposerPrimitive.Send className="hkc-composer-button hkc-composer-send" disabled={unavailable} aria-label="Send" title="Send"><ArrowUp size={16} aria-hidden="true" /></ComposerPrimitive.Send>}
        </div>
      </fieldset>
    </ComposerPrimitive.Root>
  </ComposerPrimitive.AttachmentDropzone>;
}
