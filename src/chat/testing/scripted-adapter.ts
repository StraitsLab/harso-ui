import type { AttachmentAdapter, ChatModelAdapter, CompleteAttachment, ThreadAssistantMessagePart, ThreadMessageLike } from "@assistant-ui/react";

export const preview = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#eef0f3"/><rect x="12" y="12" width="30" height="76" rx="5" fill="#d6d9df"/><rect x="52" y="18" width="95" height="8" rx="4" fill="#3d8bf5"/><rect x="72" y="40" width="74" height="20" rx="8" fill="#d6d9df"/><rect x="52" y="72" width="95" height="14" rx="7" fill="white"/></svg>');
export const samples: CompleteAttachment[] = [
  { id: "image", type: "image", name: "conversation.png", contentType: "image/svg+xml", status: { type: "complete" }, content: [{ type: "image", image: preview }] },
  { id: "file", type: "document", name: "requirements.md", contentType: "text/markdown", status: { type: "complete" }, content: [{ type: "text", text: "User right; assistant left. Keep approval explicit." }] },
];
export const initialMessages: ThreadMessageLike[] = [
  { id: "u1", role: "user", content: "Make the coding conversation feel like Harso. Keep my messages on the right, and make tool permissions explicit.", attachments: samples },
  { id: "a1", role: "assistant", content: [
    { type: "reasoning", text: "Scripted reasoning: inspect the conversation styles, preserve the token boundary, then check the responsive layout." },
    { type: "tool-call", toolCallId: "read-seed", toolName: "read_file", args: { path: "src/conversation.css" }, result: ".user { margin-inline-start: auto; }\n.assistant { background: transparent; }" },
    { type: "text", text: "A quieter conversation, with a clear sense of who said what.\n\nYour messages sit on the right. My responses stay plain, with tool activity and permissions kept close to the work." },
  ], status: { type: "complete", reason: "stop" } },
  { id: "u2", role: "user", content: "Check the responsive layouts before we ship." },
  { id: "a2", role: "assistant", content: "The local preview is ready. Replay the coding run to inspect the styles and review a terminal permission request.", status: { type: "complete", reason: "stop" } },
];

export interface ScriptedAdapterOptions {
  tokenDelayMs?: number;
  toolDelayMs?: number;
  response?: string;
  tools?: boolean;
  reasoning?: boolean;
  errorOnce?: boolean;
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(Object.assign(new Error("Stopped"), { name: "AbortError" }));
    const abort = () => { clearTimeout(timer); reject(Object.assign(new Error("Stopped"), { name: "AbortError" })); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function createScriptedAdapter({ tokenDelayMs = 85, toolDelayMs = 900, response = "I’ll inspect the conversation styles and verify the three layouts. Your attachments stay with your message, and no command runs without a decision. ", tools = true, reasoning = true, errorOnce = true }: ScriptedAdapterOptions = {}): ChatModelAdapter & { decide: (id: string, approved: boolean) => void } {
  const failedPrompts = new Set<string>();
  const decisions = new Map<string, (approved: boolean) => void>();
  return {
    decide(id, approved) { decisions.get(id)?.(approved); },
    async *run({ messages, abortSignal }) {
      const user = messages.filter(message => message.role === "user").at(-1);
      const prompt = user?.content.filter(part => part.type === "text").map(part => part.text).join(" ") ?? "";
      const content: ThreadAssistantMessagePart[] = reasoning ? [{ type: "reasoning", text: "Scripted reasoning: check alignment and tokens first; request permission before running the terminal." }] : [];
      const textIndex = content.length;
      let text = "";
      for (const token of response.split(/(?<=\s)/)) {
        await wait(tokenDelayMs, abortSignal);
        text += token;
        content[textIndex] = { type: "text", text };
        yield { content: [...content] };
      }
      if (errorOnce && /error/i.test(prompt) && !failedPrompts.has(user?.id ?? "")) {
        failedPrompts.add(user?.id ?? "");
        yield { content: [...content], status: { type: "incomplete", reason: "error", error: "Simulated adapter error — retry is available." } };
        return;
      }
      if (tools) {
        const read: ThreadAssistantMessagePart = { type: "tool-call", toolCallId: crypto.randomUUID(), toolName: "read_file", args: { path: "src/conversation.css" }, argsText: '{"path":"src/conversation.css"}' };
        const readIndex = content.length;
        content.push(read);
        yield { content: [...content] };
        await wait(toolDelayMs, abortSignal);
        content[readIndex] = { ...read, result: ".user { margin-inline-start: auto; }\n.assistant { background: transparent; }" };
        yield { content: [...content] };
        const id = crypto.randomUUID();
        const tool: ThreadAssistantMessagePart = { type: "tool-call", toolCallId: id, toolName: "terminal", args: { command: "npm run test:responsive" }, argsText: '{"command":"npm run test:responsive"}', approval: { id, prompt: "Run the responsive checks?" } };
        const toolIndex = content.length;
        content.push(tool);
        let cancelDecision = () => {};
        const decision = new Promise<boolean>((resolve, reject) => {
          const abort = () => { decisions.delete(id); reject(Object.assign(new Error("Stopped"), { name: "AbortError" })); };
          if (abortSignal.aborted) return abort();
          cancelDecision = () => { decisions.delete(id); abortSignal.removeEventListener("abort", abort); };
          decisions.set(id, approved => { cancelDecision(); resolve(approved); });
          abortSignal.addEventListener("abort", abort, { once: true });
        });
        void decision.catch(() => {});
        try {
          yield { content: [...content] };
          const approved = await decision;
          content[toolIndex] = { ...tool, approval: { id, approved }, ...(!approved ? { result: "Denied by you. Command was not executed.", isError: true } : {}) };
          yield { content: [...content] };
          if (approved) {
            await wait(toolDelayMs, abortSignal);
            content[toolIndex] = { ...tool, approval: { id, approved }, result: "SIMULATED OUTPUT\n✓ 390px · 1024px · 1440px\n6 layout checks passed · exit 0" };
            yield { content: [...content] };
          }
          content.push({ type: "text", text: approved ? "The scripted checks are complete. Ready for your review." : "I’ve left the command unexecuted. You can continue with a read-only review." });
        } finally { cancelDecision(); }
      }
      yield { content: [...content], status: { type: "complete", reason: "stop" } };
    },
  };
}

export const adapter = createScriptedAdapter();
export const decide = adapter.decide;
export const attachments: AttachmentAdapter = {
  accept: "*",
  async add({ file }) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read attachment."));
      reader.onabort = () => reject(new DOMException("Attachment read stopped", "AbortError"));
      reader.readAsDataURL(file);
    });
    return { id: crypto.randomUUID(), name: file.name, type: file.type.startsWith("image/") ? "image" : "document", contentType: file.type || "application/octet-stream", file, status: { type: "requires-action", reason: "composer-send" }, content: file.type.startsWith("image/") ? [{ type: "image", image: data }] : [{ type: "file", data, mimeType: file.type || "application/octet-stream", filename: file.name }] };
  },
  async send(attachment) { return { ...attachment, status: { type: "complete" }, content: attachment.content ?? [] }; },
  async remove() {},
};
