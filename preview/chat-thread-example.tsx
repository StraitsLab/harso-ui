import { useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime, WebSpeechSynthesisAdapter, type ToolCallMessagePartComponent, type ToolCallMessagePartProps } from "@assistant-ui/react";
import { HarsoThread } from "../src/chat/thread";
import { HarsoComposer } from "../src/chat/composer";
import { HarsoMessageAttachment } from "../src/chat/attachments";
import { HarsoReasoning } from "../src/chat/reasoning";
import { HarsoToolCall } from "../src/chat/tool-call";
import { attachments, createScriptedAdapter, initialMessages } from "../src/chat/testing/scripted-adapter";

export const chatThreadExports = ["HarsoThread", "HarsoUserMessage", "HarsoAssistantMessage", "HarsoEditComposer", "HarsoMessageActions"] as const;
export const chatThreadNotes = "assistant-ui owns streaming, editing, branches, clipboard, feedback, and speech. This example uses an in-memory scripted adapter; no commands execute.";
export const chatThreadRoute = "harso:chat-thread";

export function ChatThreadExample() {
  const [adapter] = useState(() => createScriptedAdapter());
  const [Tool] = useState<ToolCallMessagePartComponent>(() => (props: ToolCallMessagePartProps) => <HarsoToolCall {...props} onDecide={adapter.decide} />);
  const runtime = useLocalRuntime(adapter, { initialMessages, adapters: { attachments, speech: new WebSpeechSynthesisAdapter(), feedback: { submit() {} } } });
  return <AssistantRuntimeProvider runtime={runtime}><HarsoThread reasoning={HarsoReasoning} attachment={HarsoMessageAttachment} toolUI={{ Fallback: Tool }} composer={<HarsoComposer leading="Scripted · local only" />} /></AssistantRuntimeProvider>;
}
