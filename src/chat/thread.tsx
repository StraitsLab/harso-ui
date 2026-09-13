import { useMemo, type ComponentType, type ReactNode } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { ArrowDown } from "@phosphor-icons/react";
import { HarsoAssistantMessage, HarsoEditComposer, HarsoUserMessage, type HarsoMessageSlots } from "./message";
import "./thread.css";

export interface HarsoThreadProps extends HarsoMessageSlots {
  composer?: ReactNode;
  /** Rendered above the messages inside the scroll viewport (history controls, notices). */
  header?: ReactNode;
  /** Rendered after the messages inside the scroll viewport (host-owned cards, notices). */
  footer?: ReactNode;
  empty?: ReactNode;
  className?: string;
  components?: { UserMessage?: ComponentType; AssistantMessage?: ComponentType; EditComposer?: ComponentType };
}

export function HarsoThread({ composer, header, footer, empty = "Start a conversation.", className = "", components, assistantName, toolUI, reasoning, error, attachment, text, actions, copyToClipboard }: HarsoThreadProps) {
  const messages = useMemo(() => ({
    UserMessage: components?.UserMessage ?? (() => <HarsoUserMessage attachment={attachment} actions={actions} copyToClipboard={copyToClipboard} />),
    AssistantMessage: components?.AssistantMessage ?? (() => <HarsoAssistantMessage assistantName={assistantName} toolUI={toolUI} reasoning={reasoning} error={error} text={text} actions={actions} copyToClipboard={copyToClipboard} />),
    EditComposer: components?.EditComposer ?? HarsoEditComposer,
  }), [components?.UserMessage, components?.AssistantMessage, components?.EditComposer, assistantName, toolUI, reasoning, error, attachment, text, actions, copyToClipboard]);
  return <ThreadPrimitive.Root className={`hkc-thread ${className}`}>
    <ThreadPrimitive.Viewport className="hkc-thread-viewport" autoScroll>
      <div className="hkc-thread-transcript" role="log" aria-label="Conversation">
        {header}
        <ThreadPrimitive.Empty><div className="hkc-thread-empty">{empty}</div></ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages components={messages} />
        {footer}
      </div>
    </ThreadPrimitive.Viewport>
    <ThreadPrimitive.ScrollToBottom className="hkc-thread-scroll"><ArrowDown size={16} />Latest message</ThreadPrimitive.ScrollToBottom>
    {composer && <div className="hkc-thread-composer">{composer}</div>}
  </ThreadPrimitive.Root>;
}
