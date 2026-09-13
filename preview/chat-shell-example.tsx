import { useEffect, useMemo, useState } from "react";
import { AssistantRuntimeProvider, WebSpeechSynthesisAdapter, useAuiState, useLocalRuntime, type ToolCallMessagePartComponent, type ToolCallMessagePartProps } from "@assistant-ui/react";
import { Cpu, Export, FolderSimple, GitBranch, Lightning, Play, Wrench } from "@phosphor-icons/react";
import { HarsoChatShell, HarsoThreadList, HarsoThread, HarsoComposer, HarsoMessageAttachment, HarsoReasoning, HarsoToolCall, HarsoMarkdownText } from "../src/chat";
import { IconButton } from "../src";
import { attachments, createScriptedAdapter, initialMessages } from "../src/chat/testing/scripted-adapter";

export const chatShellRoute = "harso:chat-shell";
export const chatShellExports = ["HarsoChatShell", "HarsoThreadList"] as const;
export const chatShellNotes = "assistant-ui owns conversation selection and mutations. Harso supplies container-responsive regions and native modal sheets. History is local and resets on refresh.";

const seed: typeof initialMessages = [
  { id: "u1", role: "user", content: "Move the billing webhook handler onto the new ledger client and keep the retry semantics.", attachments: initialMessages[0]?.attachments },
  { id: "a1", role: "assistant", content: [
    { type: "reasoning", text: "Find the current handler, check how retries are keyed, then switch the client without changing the idempotency key." },
    { type: "tool-call", toolCallId: "read-1", toolName: "read_file", args: { path: "services/billing/webhook.ts" }, argsText: "{\"path\":\"services/billing/webhook.ts\"}", result: "export async function handleStripeEvent(event) {\n  const key = `stripe:${event.id}`;\n  return withRetry(() => ledger.apply(key, event), { attempts: 5 });\n}" },
    { type: "text", text: "The handler already keys retries on `stripe:${event.id}`, so the idempotency contract survives the swap.\n\n**Plan**\n\n1. Replace `ledger.apply` with `ledgerClient.apply` — same signature.\n2. Keep `withRetry(…, { attempts: 5 })` untouched.\n3. Run the webhook suite before touching anything else.\n\n```ts\nreturn withRetry(() => ledgerClient.apply(key, event), { attempts: 5 });\n```\n\nI need permission to run the suite." },
  ], status: { type: "complete", reason: "stop" } },
  { id: "u2", role: "user", content: "Go ahead, but only the webhook tests." },
  { id: "a2", role: "assistant", content: "Running only `services/billing/webhook.test.ts`. I'll ask before executing anything.", status: { type: "complete", reason: "stop" } },
];

function Title() {
  const title = useAuiState(state => state.threadListItem.title || "New conversation");
  return <h1>{title}</h1>;
}

function ContextPanel() {
  return <div className="hkc-context">
    <section><h2>Context</h2>
      <dl className="hkc-context-facts">
        <div><dt>Repository</dt><dd><FolderSimple size={14} aria-hidden="true" /> weave-cloud</dd></div>
        <div><dt>Branch</dt><dd><GitBranch size={14} aria-hidden="true" /> codex/ledger-client</dd></div>
        <div><dt>Model</dt><dd><Cpu size={14} aria-hidden="true" /> gpt-6-astra · medium</dd></div>
        <div><dt>Tools</dt><dd><Wrench size={14} aria-hidden="true" /> read_file, terminal</dd></div>
      </dl>
    </section>
    <section><h2>Files in this conversation</h2>
      <ul className="hkc-context-files">
        <li><code>services/billing/webhook.ts</code></li>
        <li><code>conversation.png</code></li>
        <li><code>requirements.md</code></li>
      </ul>
    </section>
  </div>;
}

export function ChatShellExample() {
  const [adapter] = useState(() => createScriptedAdapter());
  const Tool = useMemo<ToolCallMessagePartComponent>(() => (props: ToolCallMessagePartProps) => <HarsoToolCall {...props} onDecide={adapter.decide} />, [adapter]);
  const runtime = useLocalRuntime(adapter, { initialMessages: seed, adapters: { attachments, speech: new WebSpeechSynthesisAdapter(), feedback: { submit() {} } } });
  useEffect(() => {
    const item = runtime.threads.mainItem;
    void item.initialize().then(() => item.rename("Ledger client migration")).catch(() => {});
  }, [runtime]);
  const replay = () => { void runtime.thread.append({ role: "user", content: [{ type: "text", text: "Run the webhook tests." }] }); };
  return <AssistantRuntimeProvider runtime={runtime}>
    <HarsoChatShell
      sidebar={<HarsoThreadList />}
      header={<Title />}
      actions={<>
        <IconButton label="Replay run" onClick={replay}><Play size={18} /></IconButton>
        <IconButton label="Export transcript"><Export size={18} /></IconButton>
      </>}
      main={<HarsoThread reasoning={HarsoReasoning} attachment={HarsoMessageAttachment} toolUI={{ Fallback: Tool }} text={HarsoMarkdownText} />}
      composer={<HarsoComposer leading={<span className="hkc-composer-chip"><Lightning size={14} aria-hidden="true" /> gpt-6-astra <span className="hkc-composer-chip-detail">· medium</span></span>} />}
      aside={<ContextPanel />} />
  </AssistantRuntimeProvider>;
}

export default ChatShellExample;
