import { useEffect, useRef, useState } from "react";
import { AssistantRuntimeProvider, ExportedMessageRepository, useLocalRuntime, WebSpeechSynthesisAdapter, type ThreadMessageLike, type ToolCallMessagePartComponent, type ToolCallMessagePartProps } from "@assistant-ui/react";
import { HarsoThread } from "../src/chat/thread";
import { HarsoComposer } from "../src/chat/composer";
import { HarsoMessageAttachment } from "../src/chat/attachments";
import { HarsoReasoning } from "../src/chat/reasoning";
import { HarsoToolCall } from "../src/chat/tool-call";
import { attachments, createScriptedAdapter, initialMessages } from "../src/chat/testing/scripted-adapter";

export const chatThreadExports = ["HarsoThread", "HarsoUserMessage", "HarsoAssistantMessage", "HarsoEditComposer", "HarsoMessageActions"] as const;
export const chatThreadNotes = "assistant-ui owns streaming, editing, branches, clipboard, feedback, and speech. This example uses an in-memory scripted adapter; no commands execute.";
export const chatThreadRoute = "harso:chat-thread";
const states = ["default", "empty", "loading", "error", "long transcript", "branching", "disabled input"] as const;
type ThreadState = typeof states[number];

function ThreadRuntime({ state, disabled }: { state: ThreadState; disabled: boolean }) {
  const [adapter] = useState(() => createScriptedAdapter(state === "loading" ? { tokenDelayMs: 1000, response: "Waiting for the local scripted host. ".repeat(30), tools: false } : state === "error" ? { tokenDelayMs: 0, response: "Local error fixture. ", tools: false, reasoning: false } : {}));
  const [Tool] = useState<ToolCallMessagePartComponent>(() => (props: ToolCallMessagePartProps) => <HarsoToolCall {...props} onDecide={adapter.decide} />);
  const [initial] = useState<ThreadMessageLike[]>(() => state === "empty" || state === "loading" || state === "error" ? [] : state === "long transcript" ? Array.from({ length: 40 }, (_, index) => ({ id: `long-${index}`, role: index % 2 ? "assistant" : "user", content: `Transcript entry ${index + 1}. Keep the reader's place while reviewing this supplied history.\n\nA local fixture for scrolling, keyboard access, and returning to the latest message.` })) : initialMessages);
  const runtime = useLocalRuntime(adapter, { initialMessages: initial, adapters: { attachments, speech: new WebSpeechSynthesisAdapter(), feedback: { submit() {} } } });
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    // Defer until useLocalRuntime has activated its main thread.
    if (state === "loading" || state === "error") {
      const timer = setTimeout(() => runtime.thread.append(state === "error" ? "Demonstrate an error" : "Demonstrate loading"), 0);
      return () => { clearTimeout(timer); seeded.current = false; };
    }
    if (state === "branching") runtime.thread.import(ExportedMessageRepository.fromBranchableArray([
      { parentId: null, message: { id: "branch-user", role: "user", content: "Compare two approaches." } },
      { parentId: "branch-user", message: { id: "branch-one", role: "assistant", content: "First branch: start with a focused launch." } },
      { parentId: "branch-user", message: { id: "branch-two", role: "assistant", content: "Second branch: begin with an invitation." } },
    ], { headId: "branch-two" }));
  }, [runtime, state]);
  return <AssistantRuntimeProvider runtime={runtime}><HarsoThread reasoning={HarsoReasoning} attachment={HarsoMessageAttachment} toolUI={{ Fallback: Tool }} composer={<HarsoComposer disabled={disabled} leading="Scripted · local only" />} /></AssistantRuntimeProvider>;
}

export function ChatThreadExample() {
  const [state, setState] = useState<ThreadState>("default");
  const [disabled, setDisabled] = useState(false);
  // Disabled is deliberately not part of the runtime key: draft and reader position survive.
  const runtimeState = state === "disabled input" ? "default" : state;
  return <div data-testid="thread-fixture" style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
    <div className="hkl-example-row"><label>Thread state <select aria-label="Thread state" data-testid="thread-state" value={state} onChange={event => setState(event.target.value as ThreadState)}>{states.map(value => <option key={value}>{value}</option>)}</select></label><label><input type="checkbox" aria-label="Disable thread input" checked={disabled} onChange={event => setDisabled(event.target.checked)} />Disable thread input</label></div>
    <ThreadRuntime key={runtimeState} state={runtimeState} disabled={disabled || state === "disabled input"} />
  </div>;
}
