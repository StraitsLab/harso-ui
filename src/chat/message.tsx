import type { ComponentType } from "react";
import { ActionBarPrimitive, AttachmentPrimitive, ComposerPrimitive, MessagePartPrimitive, MessagePrimitive, useAuiState, type ReasoningMessagePartComponent, type TextMessagePartComponent, type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CaretRight, FileText, Sparkle } from "@phosphor-icons/react";
import { HarsoMessageActions } from "./message-actions";
import "./message.css";

export interface HarsoMessageSlots {
  assistantName?: string;
  toolUI?: { by_name?: Record<string, ToolCallMessagePartComponent | undefined>; Fallback?: ToolCallMessagePartComponent };
  /** Text part renderer; defaults to plain streaming text. Pass HarsoMarkdownText for GFM. */
  text?: TextMessagePartComponent;
  reasoning?: ReasoningMessagePartComponent;
  error?: ComponentType;
  attachment?: ComponentType;
}

function StreamingText() {
  return <div className="hkc-message-text"><MessagePartPrimitive.Text /><MessagePartPrimitive.InProgress><span className="hkc-streaming-cursor" role="status" aria-label="Streaming" /></MessagePartPrimitive.InProgress></div>;
}

function DefaultAttachment() {
  const attachment = useAuiState(state => state.attachment);
  const image = attachment.content?.find(part => part.type === "image");
  return <AttachmentPrimitive.Root className="hkc-message-attachment">{image?.type === "image" ? <img src={image.image} alt={attachment.name} /> : <FileText size={16} />}<span>{attachment.name}</span></AttachmentPrimitive.Root>;
}

function DefaultReasoning() {
  return <details className="hkc-message-reasoning"><summary><CaretRight size={16} />Reasoning</summary><div><MessagePartPrimitive.Text /></div></details>;
}

function DefaultError() {
  const status = useAuiState(state => state.message.status);
  return <div className="hkc-message-error" role="alert"><span>{status?.type === "incomplete" && status.reason === "error" && typeof status.error === "string" ? status.error : "The response was interrupted."}</span><ActionBarPrimitive.Reload>Retry</ActionBarPrimitive.Reload></div>;
}

export function HarsoUserMessage({ attachment: Attachment = DefaultAttachment }: Pick<HarsoMessageSlots, "attachment"> = {}) {
  return <MessagePrimitive.Root className="hkc-message hkc-message--user" role="article" aria-label="You"><div className="hkc-message-speaker">You</div><div className="hkc-message-bubble"><MessagePrimitive.Parts components={{ Text: StreamingText }} /><div className="hkc-message-attachments"><MessagePrimitive.Attachments components={{ Attachment }} /></div></div><HarsoMessageActions user /></MessagePrimitive.Root>;
}

export function HarsoAssistantMessage({ assistantName = "Harso", toolUI, reasoning = DefaultReasoning, error: Error = DefaultError, text: Text = StreamingText }: HarsoMessageSlots = {}) {
  const status = useAuiState(state => state.message.status);
  return <MessagePrimitive.Root className="hkc-message hkc-message--assistant" role="article" aria-label={assistantName}>
    <div className="hkc-message-speaker"><Sparkle size={16} aria-hidden="true" />{assistantName}</div>
    <MessagePrimitive.Parts components={{ Text, Reasoning: reasoning, tools: toolUI }} />
    {status?.type === "incomplete" && status.reason === "error" && <Error />}
    {status?.type === "incomplete" && status.reason === "cancelled" && <p className="hkc-message-stopped" role="status">Stopped by you.</p>}
    <HarsoMessageActions />
  </MessagePrimitive.Root>;
}

export function HarsoEditComposer() {
  return <MessagePrimitive.Root className="hkc-message hkc-message--user" role="article" aria-label="Edit message"><ComposerPrimitive.Root className="hkc-edit-composer"><ComposerPrimitive.Input aria-label="Edit your message" /><p>Sending creates a branch. Your original conversation is preserved.</p><div><ComposerPrimitive.Cancel>Cancel</ComposerPrimitive.Cancel><ComposerPrimitive.Send className="hkc-edit-save">Save &amp; send</ComposerPrimitive.Send></div></ComposerPrimitive.Root></MessagePrimitive.Root>;
}
