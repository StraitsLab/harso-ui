import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useAui, useAuiState, useLocalRuntime } from "@assistant-ui/react";
import { HarsoMarkdownText } from "../src/chat/markdown";
import { HarsoCodeBlock } from "../src/chat/code-block";
import { createScriptedAdapter } from "../src/chat/testing/scripted-adapter";

export const chatMarkdownFixture = `# A calmer space to build

Paragraphs support **strong emphasis**, *gentle emphasis*, ~~old ideas~~, and inline \`const ready = true\`. Visit [the Harso example](https://example.com) in a new tab.

## A small checklist

- Right-aligned user messages
- Plain assistant responses
  - Keep the details close to the work

1. Inspect the tokens
2. Review the result

- [x] Read the styles
- [ ] Review together

### Working context

> Permission stays explicit. No command runs without your decision.

| Element | Treatment |
| :--- | :--- |
| Assistant | Quiet, no bubble |
| Code | Monospace, scrollable |

---

\`\`\`typescript
const greeting = "Hello, Harso";
console.log(greeting);
\`\`\`

\`\`\`
No language? Plain text still reads clearly.
\`\`\`

Ready for your review.`;

const adapter = createScriptedAdapter({ response: chatMarkdownFixture, tokenDelayMs: 12, tools: false, reasoning: false, errorOnce: false });
function MarkdownMessage() {
  return <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Text: HarsoMarkdownText }} /></MessagePrimitive.Root>;
}
function Replay() {
  const aui = useAui();
  const running = useAuiState(state => state.thread.isRunning);
  return <button type="button" disabled={running} onClick={() => aui.thread().append("Stream the markdown fixture")}>{running ? "Streaming…" : "Stream markdown"}</button>;
}
export function ChatMarkdownExample() {
  const runtime = useLocalRuntime(adapter, { initialMessages: [{ role: "assistant", content: chatMarkdownFixture }] });
  return <AssistantRuntimeProvider runtime={runtime}>
    <section className="hkc-chat-markdown-example" style={{ maxWidth: 760, minWidth: 0, margin: "auto", padding: "var(--hk-space-4)" }}>
      <Replay />
      <ThreadPrimitive.Root><ThreadPrimitive.Messages components={{ Message: MarkdownMessage }} /></ThreadPrimitive.Root>
      <HarsoCodeBlock language="typescript" filename="src/greeting.ts" lineNumbers code={'export const greeting = "A long line demonstrates horizontal scrolling without widening the conversation on mobile.";\nconsole.log(greeting);'} />
    </section>
  </AssistantRuntimeProvider>;
}
