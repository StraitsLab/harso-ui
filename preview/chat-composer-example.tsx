import { useEffect, useRef, useState } from "react";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type AttachmentAdapter, type ChatModelAdapter } from "@assistant-ui/react";
import { HarsoComposer } from "../src/chat/composer";
import { HarsoMessageAttachment } from "../src/chat/attachments";

const attachments: AttachmentAdapter = {
  accept: "*",
  async add({ file }) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { id: crypto.randomUUID(), name: file.name, type: file.type.startsWith("image/") ? "image" : "document", contentType: file.type, file, status: { type: "requires-action", reason: "composer-send" }, content: file.type.startsWith("image/") ? [{ type: "image", image: data }] : [{ type: "file", data, mimeType: file.type, filename: file.name }] };
  },
  async send(attachment) { return { ...attachment, status: { type: "complete" }, content: attachment.content ?? [] }; },
  async remove() {},
};

const echo: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const prompt = messages.at(-1)?.content.filter(part => part.type === "text").map(part => part.text).join(" ") ?? "Attachment received";
    let text = "";
    for (const word of `Echo: ${prompt}`.split(" ")) {
      if (abortSignal.aborted) return;
      await new Promise<void>(resolve => {
        const done = () => { clearTimeout(timer); abortSignal.removeEventListener("abort", done); resolve(); };
        const timer = setTimeout(done, 500);
        abortSignal.addEventListener("abort", done, { once: true });
      });
      if (abortSignal.aborted) return;
      text += `${word} `;
      yield { content: [{ type: "text", text }] };
    }
  },
};

const states = ["empty", "typing", "running", "disabled", "with-attachments", "error"] as const;
type ExampleState = typeof states[number];

function Message() {
  return <MessagePrimitive.Root><MessagePrimitive.Parts /><MessagePrimitive.Attachments components={{ Attachment: HarsoMessageAttachment }} /></MessagePrimitive.Root>;
}

function ExampleRuntime({ state }: { state: ExampleState }) {
  const runtime = useLocalRuntime(echo, { adapters: { attachments } });
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (state === "typing" || state === "disabled" || state === "error") runtime.thread.composer.setText("Check the responsive conversation layouts.");
    if (state === "running") runtime.thread.append("A local streaming reply. Press Stop to cancel this response before it finishes.");
    if (state === "with-attachments") {
      void runtime.thread.composer.addAttachment(new File(["Local fixture, never uploaded."], "requirements.md", { type: "text/markdown" }));
      void runtime.thread.composer.addAttachment(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#d6d9df"/></svg>'], "layout.svg", { type: "image/svg+xml" }));
    }
  }, [runtime, state]);
  return <AssistantRuntimeProvider runtime={runtime}>
    <ThreadPrimitive.Root>
      <ThreadPrimitive.Messages components={{ UserMessage: Message, AssistantMessage: Message }} />
      <HarsoComposer disabled={state === "disabled"} leading="Harso local · echo" trailing={<span>Local only</span>} error={state === "error" ? "Could not send. Your draft is retained; try Send again." : undefined} />
    </ThreadPrimitive.Root>
  </AssistantRuntimeProvider>;
}

export function ChatComposerExample() {
  const [state, setState] = useState<ExampleState>("empty");
  return <section className="hkc-composer-example">
    <h2>Conversation composer</h2>
    <p>Local echo adapter. Drop or paste files; Enter sends, Shift+Enter adds a line.</p>
    <label>Composer state <select value={state} onChange={event => setState(event.target.value as ExampleState)}>{states.map(value => <option key={value}>{value}</option>)}</select></label>
    <ExampleRuntime key={state} state={state} />
  </section>;
}

export default ChatComposerExample;
