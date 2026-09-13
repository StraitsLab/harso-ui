import { useMemo, type ComponentType, type ReactNode } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { ArrowDown } from "@phosphor-icons/react";
import { HarsoAssistantMessage, HarsoEditComposer, HarsoUserMessage, type HarsoMessageSlots } from "./message";
import "./thread.css";

export interface HarsoThreadProps extends HarsoMessageSlots {
  composer?: ReactNode;
  empty?: ReactNode;
  className?: string;
  components?: { UserMessage?: ComponentType; AssistantMessage?: ComponentType; EditComposer?: ComponentType };
}

export function HarsoThread({ composer, empty = "Start a conversation.", className = "", components, assistantName, toolUI, reasoning, error, attachment, text }: HarsoThreadProps) {
  const messages = useMemo(() => ({
    UserMessage: components?.UserMessage ?? (() => <HarsoUserMessage attachment={attachment} />),
    AssistantMessage: components?.AssistantMessage ?? (() => <HarsoAssistantMessage assistantName={assistantName} toolUI={toolUI} reasoning={reasoning} error={error} text={text} />),
    EditComposer: components?.EditComposer ?? HarsoEditComposer,
  }), [components?.UserMessage, components?.AssistantMessage, components?.EditComposer, assistantName, toolUI, reasoning, error, attachment, text]);
  return <ThreadPrimitive.Root className={`hkc-thread ${className}`}>
    <ThreadPrimitive.Viewport className="hkc-thread-viewport" autoScroll>
      <div className="hkc-thread-transcript" role="log" aria-label="Conversation">
        <ThreadPrimitive.Empty><div className="hkc-thread-empty">{empty}</div></ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages components={messages} />
      </div>
    </ThreadPrimitive.Viewport>
    <ThreadPrimitive.ScrollToBottom className="hkc-thread-scroll"><ArrowDown size={16} />Latest message</ThreadPrimitive.ScrollToBottom>
    {composer && <div className="hkc-thread-composer">{composer}</div>}
  </ThreadPrimitive.Root>;
}
