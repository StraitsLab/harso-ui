import { useMemo } from "react";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime, useAui, type ChatModelAdapter, type ThreadMessageLike, type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { HarsoToolCall, HarsoTerminalTool, harsoToolComponents } from "../src/chat/tool-call";
import { HarsoReasoning } from "../src/chat/reasoning";
import { HarsoMessageError, HarsoStoppedRun } from "../src/chat/error";

export const chatPartsFixtures: ThreadMessageLike[] = [
  { role: "user", content: "Inspect the message parts." },
  ...["running", "completed", "failed", "denied", "awaiting approval"].map((state): ThreadMessageLike => ({
    role: "assistant", content: [{ type: "tool-call", toolName: "inspect", toolCallId: state, args: { state }, ...(state === "completed" ? { result: "Inspection complete" } : {}), ...(state === "failed" ? { isError: true, result: "Inspection failed" } : {}), ...(state === "denied" || state === "awaiting approval" ? { approval: { id: state, ...(state === "denied" ? { approved: false } : {}) } } : {}) }],
    status: state === "running" || state === "awaiting approval" ? { type: "requires-action", reason: "tool-calls" } : { type: "complete", reason: "stop" },
  })),
  { role: "assistant", content: [{ type: "tool-call", toolName: "terminal", toolCallId: "terminal", args: { command: "npm test" }, result: { output: "All checks passed", exitCode: 0 } }, { type: "tool-call", toolName: "read_file", toolCallId: "read", args: { path: "src/chat/reasoning.tsx" }, result: { content: "export function HarsoReasoning() { … }" } }, { type: "reasoning", text: "Check tokens, alignment, and explicit permission before execution." }], status: { type: "complete", reason: "stop" } },
  { role: "assistant", content: "", status: { type: "incomplete", reason: "error", error: "The local adapter failed. Retry is available." } },
  { role: "assistant", content: "", status: { type: "incomplete", reason: "cancelled" } },
];

export function ChatPartsExample() {
  const flow = useMemo(() => {
    const decisions = new Map<string, (approved: boolean) => void>();
    const adapter: ChatModelAdapter = { async *run({ abortSignal }) {
      const id = crypto.randomUUID();
      let abort = () => {};
      const decision = new Promise<boolean>((resolve, reject) => {
        decisions.set(id, resolve);
        abort = () => reject(new DOMException("Stopped", "AbortError"));
        abortSignal.addEventListener("abort", abort, { once: true });
        if (abortSignal.aborted) abort();
      });
      const tool = { type: "tool-call" as const, toolCallId: id, toolName: "terminal", args: { command: "npm test (simulation only)" }, argsText: '{"command":"npm test (simulation only)"}', approval: { id, prompt: "Simulate running the checks? No shell command is executed." } };
      try {
        yield { content: [tool] };
        const approved = await decision;
        yield { content: [{ ...tool, approval: { id, approved }, result: approved ? { output: "Simulated checks passed", exitCode: 0 } : "Command was not executed." }], status: { type: "complete", reason: "stop" } };
      } finally {
        decisions.delete(id);
        abortSignal.removeEventListener("abort", abort);
      }
    } };
    const onDecide = (id: string, approved: boolean) => { decisions.get(id)?.(approved); };
    const Terminal: ToolCallMessagePartComponent = props => <HarsoTerminalTool {...props} onDecide={onDecide} />;
    const Fallback: ToolCallMessagePartComponent = props => <HarsoToolCall {...props} onDecide={onDecide} />;
    const Message = () => <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Reasoning: HarsoReasoning, tools: { ...harsoToolComponents, by_name: { ...harsoToolComponents.by_name, terminal: Terminal }, Fallback } }} /><HarsoMessageError /><HarsoStoppedRun /></MessagePrimitive.Root>;
    return { adapter, Message };
  }, []);
  const runtime = useLocalRuntime(flow.adapter, { initialMessages: chatPartsFixtures });
  return <AssistantRuntimeProvider runtime={runtime}><section className="hkc-chat-parts-example" style={{ width: "100%", boxSizing: "border-box", maxWidth: 752, margin: "auto", padding: "var(--hk-space-4)" }}><h2>Conversation parts</h2><p>Static states and a live, simulated permission request.</p><StartApproval /><ThreadPrimitive.Root style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 28 }}><ThreadPrimitive.Messages components={{ Message: flow.Message }} /></ThreadPrimitive.Root></section></AssistantRuntimeProvider>;
}

function StartApproval() {
  const aui = useAui();
  return <button type="button" onClick={() => aui.thread().append("Run the simulated approval flow")}>Start live approval</button>;
}
