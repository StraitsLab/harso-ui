import type { ComponentType, HTMLAttributes } from "react";
import { ActionBarPrimitive, AttachmentPrimitive, ComposerPrimitive, MessagePartPrimitive, MessagePrimitive, useAuiState, type ReasoningMessagePartComponent, type TextMessagePartComponent, type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { FileText, Sparkle } from "@phosphor-icons/react";
import { HarsoMessageActions, type HarsoMessageActionCapabilities } from "./message-actions";
import { HarsoReasoning } from "./reasoning";
import "./message.css";

export interface HarsoMessageSlots {
  assistantName?: string;
  /** Optional editorial introduction; markdown first headings also receive display styling. */
  headline?: string;
  toolUI?: { by_name?: Record<string, ToolCallMessagePartComponent | undefined>; Fallback?: ToolCallMessagePartComponent };
  /** Text part renderer; defaults to plain streaming text. Pass HarsoMarkdownText for GFM. */
  text?: TextMessagePartComponent;
  reasoning?: ReasoningMessagePartComponent;
  error?: ComponentType;
  attachment?: ComponentType;
  /** Which message actions the host runtime actually supports; defaults to all. */
  actions?: HarsoMessageActionCapabilities;
  /** Host clipboard for Copy; renderers without navigator.clipboard (Electron with a strict permission policy) supply one. */
  copyToClipboard?: (text: string) => void | Promise<void>;
}

/**
 * Message root without hover tracking. assistant-ui's MessagePrimitive.Root calls setIsHovering on every mouseenter,
 * which updates the thread store and re-derives every message client (O(rows) per row the pointer crosses). Harso
 * reveals times and actions with CSS :hover / :focus-within, so the row only needs its element and data-message-id.
 * (Drops turnAnchor="top" registration; no Harso thread uses it.)
 */
function MessageRoot(props: HTMLAttributes<HTMLDivElement>) {
  const id = useAuiState(state => state.message.id);
  return <div {...props} data-message-id={id} />;
}

function StreamingText() {
  return <div className="hkc-message-text"><MessagePartPrimitive.Text /><MessagePartPrimitive.InProgress><span className="hkc-streaming-cursor" role="status" aria-label="Streaming" /></MessagePartPrimitive.InProgress></div>;
}

function DefaultAttachment() {
  const attachment = useAuiState(state => state.attachment);
  const image = attachment.content?.find(part => part.type === "image");
  return <AttachmentPrimitive.Root className="hkc-message-attachment">{image?.type === "image" ? <img src={image.image} alt={attachment.name} /> : <FileText size={16} />}<span>{attachment.name}</span></AttachmentPrimitive.Root>;
}

function MessageTime({ user = false }: { user?: boolean }) {
  const createdAt = useAuiState(state => state.message.createdAt);
  if (!createdAt) return null;
  const date = new Date(createdAt);
  const today = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return <time className="hkc-message-time" dateTime={date.toISOString()}>{user ? `${today ? "Today" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${time}` : time}</time>;
}

function DefaultError() {
  const status = useAuiState(state => state.message.status);
  return <div className="hkc-message-error" role="alert"><span>{status?.type === "incomplete" && status.reason === "error" && typeof status.error === "string" ? status.error : "The response was interrupted."}</span><ActionBarPrimitive.Reload>Retry</ActionBarPrimitive.Reload></div>;
}

export function HarsoUserMessage({ attachment: Attachment = DefaultAttachment, actions, copyToClipboard }: Pick<HarsoMessageSlots, "attachment" | "actions" | "copyToClipboard"> = {}) {
  return <MessageRoot className="hkc-message hkc-message--user" role="article" aria-label="You"><div className="hkc-message-bubble"><MessagePrimitive.Parts components={{ Text: StreamingText }} /><div className="hkc-message-attachments"><MessagePrimitive.Attachments components={{ Attachment }} /></div></div><MessageTime user /><HarsoMessageActions user capabilities={actions} copyToClipboard={copyToClipboard} /></MessageRoot>;
}

export function HarsoAssistantMessage({ assistantName = "Harso", headline, toolUI, reasoning = HarsoReasoning, error: Error = DefaultError, text: Text = StreamingText, actions, copyToClipboard }: HarsoMessageSlots = {}) {
  const status = useAuiState(state => state.message.status);
  return <MessageRoot className="hkc-message hkc-message--assistant" role="article" aria-label={assistantName}>
    <div className="hkc-message-speaker"><Sparkle size={14} weight="regular" aria-hidden="true" />{assistantName}<MessageTime /></div>
    {headline && <h2 className="hkc-message-headline">{headline}</h2>}
    <MessagePrimitive.Parts components={{ Text, Reasoning: reasoning, tools: toolUI }} />
    {status?.type === "incomplete" && status.reason === "error" && <Error />}
    {status?.type === "incomplete" && status.reason === "cancelled" && <p className="hkc-message-stopped" role="status">Stopped by you.</p>}
    <HarsoMessageActions capabilities={actions} copyToClipboard={copyToClipboard} />
  </MessageRoot>;
}

export function HarsoEditComposer() {
  return <MessageRoot className="hkc-message hkc-message--user" role="article" aria-label="Edit message"><ComposerPrimitive.Root className="hkc-edit-composer"><ComposerPrimitive.Input aria-label="Edit your message" /><p>Sending creates a branch. Your original conversation is preserved.</p><div><ComposerPrimitive.Cancel>Cancel</ComposerPrimitive.Cancel><ComposerPrimitive.Send className="hkc-edit-save">Save &amp; send</ComposerPrimitive.Send></div></ComposerPrimitive.Root></MessageRoot>;
}
