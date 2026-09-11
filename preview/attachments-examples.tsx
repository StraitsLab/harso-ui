import { Attachments, Attachment, AttachmentEmpty, AttachmentInfo, AttachmentPreview, AttachmentProgress, AttachmentRemove, AttachmentRetry, type AttachmentData } from "@harso/ui";
import type { ExampleState } from "./examples";
import { useState } from "react";

export const attachmentsExports = ["Attachments", "Attachment", "AttachmentPreview", "AttachmentInfo", "AttachmentRemove", "AttachmentHoverCard", "AttachmentHoverCardTrigger", "AttachmentHoverCardContent", "AttachmentEmpty"] as const;
export type AttachmentsExport = typeof attachmentsExports[number];
const names = ["design.png", "notes.md"];
export const attachmentsNotes = Object.fromEntries(attachmentsExports.map(name => [name, { behavior: "Host-supplied attachment presentation. Data, upload state, removal, and retry remain controlled by the host; the component only renders the supplied state.", example: '<Attachments variant="grid"><Attachment data={file} onRemove={remove}><AttachmentPreview /><AttachmentInfo /><AttachmentRemove /></Attachment></Attachments>' }])) as Record<AttachmentsExport, { behavior: string; example: string }>;
export function AttachmentsExample({ component, state }: { component: AttachmentsExport; state: ExampleState }) {
  const [items, setItems] = useState<AttachmentData[]>(names.map((name, index) => ({ id: String(index + 1), name, mediaType: index ? "text/markdown" : "image/png", size: index ? 4096 : 2048 })));
  if (component === "AttachmentEmpty") return <AttachmentEmpty />;
  if (!items.length) return <AttachmentEmpty />;
  const variant = state === "long-content" ? "list" : state === "error" ? "inline" : "grid";
  return <div className="hkl-example-stack"><Attachments variant={variant}>{items.map(item => {
    const data: AttachmentData = state === "error" && item.id === "2" && !item.status ? { ...item, status: "error", error: "Upload failed" } : item;
    return <Attachment key={item.id} data={data} onRemove={() => setItems(current => current.filter(value => value.id !== item.id))} onRetry={() => setItems(current => current.map(value => value.id === item.id ? { ...value, status: "uploading", progress: 0, error: undefined } : value))}><AttachmentPreview /><AttachmentInfo showMediaType /><AttachmentProgress />{data.status === "error" ? <AttachmentRetry disabled={state === "disabled"} /> : <AttachmentRemove disabled={state === "disabled"} />}</Attachment>;
  })}</Attachments></div>;
}
