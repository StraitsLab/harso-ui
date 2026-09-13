import { useEffect, useRef, useState } from "react";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { HarsoComposer } from "../src/chat/composer";
import { HarsoMessageAttachment } from "../src/chat/attachments";

import { attachments, createScriptedAdapter } from "../src/chat/testing/scripted-adapter";

const echo: ChatModelAdapter = {
  run(options) {
    const prompt = options.messages.at(-1)?.content.filter(part => part.type === "text").map(part => part.text).join(" ") ?? "Attachment received";
    return createScriptedAdapter({ response: `Echo: ${prompt}`, tools: false, reasoning: false, errorOnce: false, tokenDelayMs: 500 }).run(options);
  },
};

const states = ["empty", "typing", "running", "disabled", "with-attachments", "with attachment", "error", "refused submission"] as const;
type ExampleState = typeof states[number];

function Message() {
  return <MessagePrimitive.Root><MessagePrimitive.Parts /><MessagePrimitive.Attachments components={{ Attachment: HarsoMessageAttachment }} /></MessagePrimitive.Root>;
}

function ExampleRuntime({ state, disabled, refuse }: { state: ExampleState; disabled: boolean; refuse: boolean }) {
  const [result, setResult] = useState("Nothing sent yet. Draft stays local.");
  const runtime = useLocalRuntime(echo, { adapters: { attachments } });
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (state === "typing" || state === "disabled" || state === "error" || state === "refused submission") runtime.thread.composer.setText("Check the responsive conversation layouts.");
    if (state === "running") {
      const timer = setTimeout(() => runtime.thread.append("A local streaming reply. Press Stop to cancel this response before it finishes."), 0);
      return () => { clearTimeout(timer); seeded.current = false; };
    }
    if (state === "with-attachments" || state === "with attachment") {
      void runtime.thread.composer.addAttachment(new File(["Local fixture, never uploaded."], "requirements.md", { type: "text/markdown" }));
      void runtime.thread.composer.addAttachment(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#d6d9df"/></svg>'], "layout.svg", { type: "image/svg+xml" }));
    }
  }, [runtime, state]);
  return <AssistantRuntimeProvider runtime={runtime}>
    <ThreadPrimitive.Root>
      <div data-testid="composer-fixture" onSubmitCapture={event => { if (refuse) { event.preventDefault(); event.stopPropagation(); setResult("Submission refused by host. Draft and attachments retained."); } }} onClickCapture={event => {
        if (refuse && (event.target as HTMLElement).closest('button[aria-label="Send"]')) { event.preventDefault(); event.stopPropagation(); setResult("Submission refused by host. Draft and attachments retained."); }
      }} onKeyDownCapture={event => {
        if (refuse && event.target instanceof HTMLTextAreaElement && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); setResult("Submission refused by host. Draft and attachments retained."); }
      }}>
      <ThreadPrimitive.Messages components={{ UserMessage: Message, AssistantMessage: Message }} />
      <HarsoComposer disabled={disabled || state === "disabled"} leading="Harso local · echo" trailing={<span>Local only</span>} error={state === "error" ? "Could not send. Your draft is retained; try Send again." : undefined} />
      <output aria-label="Composer host result" data-testid="composer-host-result" aria-live="polite">{result}</output>
      </div>
    </ThreadPrimitive.Root>
  </AssistantRuntimeProvider>;
}

export function ChatComposerExample() {
  const [state, setState] = useState<ExampleState>("empty");
  const [disabled, setDisabled] = useState(false);
  const [refuse, setRefuse] = useState(false);
  return <section className="hkc-composer-example">
    <h2>Conversation composer</h2>
    <p>Local echo adapter. Drop or paste files; Enter sends, Shift+Enter adds a line.</p>
    <label>Composer state <select aria-label="Composer state" data-testid="composer-state" value={state} onChange={event => setState(event.target.value as ExampleState)}>{states.map(value => <option key={value}>{value}</option>)}</select></label>
    <label><input type="checkbox" aria-label="Disable composer input" checked={disabled} onChange={event => setDisabled(event.target.checked)} />Disable composer input</label>
    <label><input type="checkbox" aria-label="Refuse submission" checked={refuse} onChange={event => setRefuse(event.target.checked)} />Refuse submission</label>
    <ExampleRuntime key={state} state={state} disabled={disabled} refuse={refuse || state === "refused submission"} />
  </section>;
}

export default ChatComposerExample;
