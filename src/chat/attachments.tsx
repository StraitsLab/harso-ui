"use client";

import { AttachmentPrimitive, useAuiState } from "@assistant-ui/react";
import { FileText, X } from "@phosphor-icons/react";
import "./attachments.css";

function AttachmentTile({ removable = false }: { removable?: boolean }) {
  const attachment = useAuiState(state => state.attachment);
  const image = attachment.content?.find(part => part.type === "image");
  const size = attachment.file?.size;
  return <AttachmentPrimitive.Root className={`hkc-attachment ${removable ? "hkc-attachment--composer" : "hkc-attachment--message"}`}>
    {image?.type === "image" ? <img className="hkc-attachment-thumb" src={image.image} alt={attachment.name} /> : <span className="hkc-attachment-thumb"><FileText size={20} aria-hidden="true" /></span>}
    <span className="hkc-attachment-details"><span className="hkc-attachment-name" title={attachment.name}><AttachmentPrimitive.Name /></span>
      {size !== undefined && <span className="hkc-attachment-size">{size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`}</span>}
      {attachment.status.type === "incomplete" && <span className="hkc-attachment-error" role="alert">Attachment failed</span>}
    </span>
    {removable && <AttachmentPrimitive.Remove className="hkc-attachment-remove" aria-label={`Remove ${attachment.name}`} title={`Remove ${attachment.name}`}><X size={16} aria-hidden="true" /></AttachmentPrimitive.Remove>}
  </AttachmentPrimitive.Root>;
}

export function HarsoComposerAttachment() { return <AttachmentTile removable />; }
export function HarsoMessageAttachment() { return <AttachmentTile />; }
