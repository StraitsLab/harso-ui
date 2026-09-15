import { useEffect, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, WebSpeechSynthesisAdapter, useAuiState, useLocalRuntime, type ToolCallMessagePartComponent, type ToolCallMessagePartProps } from "@assistant-ui/react";
import { Bell, CaretRight, ChatCircle, Clock, Cube, FileText, DotsThree, Export, FolderSimple, GearSix, MagnifyingGlass, Microphone, PencilSimple, Sparkle, Stack } from "@phosphor-icons/react";
import { HarsoChatShell, HarsoThreadList, HarsoThread, HarsoComposer, HarsoMessageAttachment, HarsoReasoning, HarsoToolCall, HarsoMarkdownText } from "../src/chat";
import { HarsoSidebarNav } from "../src/chat/thread-list";
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
    <section><h2>Context</h2><div className="hkc-context-project"><FolderSimple size={16} />Personal</div><p>~/Developer/products/weave-cloud</p><p className="hkc-context-note"><FileText size={14} aria-hidden="true" /><span>Ledger only. Never resend emails.<br />Ask before running workspace commands.</span></p></section>
    <section><h2>Changed files</h2><ul className="hkc-context-files">
      <li><code><FileText size={12} aria-hidden="true" />services/billing-webhook/index.ts</code><small>+184 lines added · New service</small></li>
      <li><code><FileText size={12} aria-hidden="true" />api/routes/billing.ts</code><small>−92 lines · Thin enqueue route</small></li>
      <li><code><FileText size={12} aria-hidden="true" />db/migrations/0142_webhook_events.sql</code><small>+31 lines added · Event deduplication</small></li>
    </ul></section>
    <section><h2>Approvals</h2><div className="hkc-context-approval"><span className="hkc-context-dot" /><div>Review npm test<p>Waiting for you · 2 minutes</p></div><CaretRight size={14} /></div></section>
    <section><h2>Context window</h2><div className="hkc-context-usage"><svg className="hkc-context-ring" viewBox="0 0 16 16" role="img" aria-label="21% context used"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--hk-line-strong)" strokeWidth="1.5" /><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--hk-accent)" strokeWidth="1.5" pathLength="100" strokeDasharray="21 79" transform="rotate(-90 8 8)" /></svg><div>41.2k of 200k tokens<p>21% used · Plenty of room</p></div></div></section>
    <section><h2>Session</h2><div className="hkc-context-project"><Cube size={16} aria-hidden="true" />Claude Fable 5.1</div><p>Started 14:02 · 16 minutes<br />3 files · 2 new tests</p></section>
  </div>;
}

export function ChatShellExample() {
  const [adapter] = useState(() => createScriptedAdapter());
  const Tool = useMemo<ToolCallMessagePartComponent>(() => (props: ToolCallMessagePartProps) => <HarsoToolCall {...props} onDecide={adapter.decide} />, [adapter]);
  const seeded = useRef(false);
  const initial = seeded.current ? [] : (seeded.current = true, seed);
  const runtime = useLocalRuntime(adapter, { initialMessages: initial, adapters: { attachments, speech: new WebSpeechSynthesisAdapter(), feedback: { submit() {} } } });
  useEffect(() => {
    const item = runtime.threads.mainItem;
    void item.initialize().then(() => item.rename("Move the billing webhook handler")).catch(() => {});
  }, [runtime]);
  const replay = () => { void runtime.thread.append({ role: "user", content: [{ type: "text", text: "Run the webhook tests." }] }); };
  return <AssistantRuntimeProvider runtime={runtime}>
    <HarsoChatShell
      windowControls
      mainLandmark={false}
      nav={<><HarsoSidebarNav label="Conversation actions" heading={false} items={[
        { id: "new", label: "New conversation", icon: <PencilSimple size={16} />, onSelect: () => { void runtime.threads.switchToNewThread(); } },
        { id: "search", label: "Search", icon: <MagnifyingGlass size={16} /> },
      ]} /><HarsoSidebarNav label="Weave" items={[
        { id: "activity", label: "Activity", icon: <Bell size={16} />, count: 3 },
        { id: "artifacts", label: "Artifacts", icon: <Stack size={16} /> },
        { id: "routines", label: "Routines", icon: <Clock size={16} /> },
        { id: "customize", label: "Customize", icon: <Sparkle size={16} /> },
      ]} /></>}
      sidebar={<><HarsoSidebarNav label="Projects" items={[
        { id: "all", label: "All projects", icon: <FolderSimple size={16} /> },
        { id: "personal", label: "Personal", icon: <FolderSimple size={16} /> },
        { id: "cloud", label: "Weave Cloud", icon: <FolderSimple size={16} /> },
      ]} /><HarsoThreadList heading="Recent" newButton={false} /></>}
      footer={<div className="hkc-shell-account-row"><span className="hkc-shell-avatar" role="img" aria-label="Abhi Bansal">AB</span><div className="hkc-shell-account-copy"><strong>Abhi Bansal</strong><small>Pro · Straits Lab</small></div><button type="button" className="hkc-shell-icon" aria-label="Account settings"><GearSix size={16} /></button></div>}
      subtitle="Personal · 14 turns"
      onBack={() => window.history.back()}
      header={<Title />}
      actions={<>
        <button type="button" className="hkc-shell-icon" aria-label="More actions" onClick={replay}><DotsThree size={16} /></button>
        <button type="button" className="hkc-shell-icon" aria-label="Share conversation"><Export size={16} /></button>
        <button type="button" className="hkc-shell-icon" aria-label="Search in conversation"><MagnifyingGlass size={16} /></button>
      </>}
      main={<HarsoThread reasoning={HarsoReasoning} attachment={HarsoMessageAttachment} toolUI={{ Fallback: Tool }} text={HarsoMarkdownText} />}
      composer={<HarsoComposer placeholder="Reply…" modelSelector={{ label: "Claude Fable 5.1", glyph: <Cube size={12} aria-hidden="true" /> }} voice={<button type="button" className="hkc-composer-button hkc-composer-control" aria-label="Dictate"><Microphone size={16} /></button>} />}
      aside={<ContextPanel />} />
  </AssistantRuntimeProvider>;
}

export default ChatShellExample;
