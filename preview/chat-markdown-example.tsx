import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useAui, useAuiState, useLocalRuntime } from "@assistant-ui/react";
import { HarsoMarkdownText } from "../src/chat/markdown";
import { HarsoCodeBlock } from "../src/chat/code-block";
import { HarsoArtifact } from "../src/chat/artifact";
import { HarsoWorkResult } from "../src/chat/work-result";
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
      <HarsoCodeBlock language="typescript" filename="work-unit.ts" lineNumbers highlightLines={[1]} code={'const result: string = "Work complete";\n\nconsole.log(result);\n'} />
      <HarsoCodeBlock language="typescript" filename="work-unit.ts" lineNumbers diff code={'- const result = "Pending";\n+ const result: string = "Work complete";\n console.log(result);\n'} />
      <div data-testid="artifact-demos" style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 28 }}>
        <HarsoArtifact name="A quieter place to think" meta="Research brief · Markdown" language="markdown" defaultMode="preview" highlightLines={[1]}
          code={'# A quieter place to think\n\nThe best workspace leaves room for the work.\n'}
          onExpand={() => {}}
          preview={<>
            <p style={{ fontSize: 16, fontWeight: 600 }}>The best workspace leaves room for the work.</p>
            <p style={{ fontWeight: 600 }}>What stood out</p>
            <p>People want to see what matters now, with the detail one deliberate step away. Progress stays visible without taking over the conversation.</p>
            <p style={{ fontWeight: 600 }}>The next small step</p>
            <p>Try the calmer flow with one real task. Keep the decisions visible, and let the rest recede.</p>
          </>} />
        <HarsoArtifact name="A quieter place to think" meta="Research brief · Markdown" language="markdown" defaultMode="code" highlightLines={[1]}
          code={'# A quieter place to think\n\nThe best workspace leaves room for the work.\n'}
          onExpand={() => {}}
          preview={<p>The best workspace leaves room for the work.</p>} />
      </div>
      <div data-testid="work-demos" style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 28 }}>
        <HarsoWorkResult title="Shape the launch brief" status="running"
          steps={[
            { id: "a", label: "Shaping the recommendation", state: "done" },
            { id: "b", label: "Checking the evidence", state: "running", chip: "12s" },
            { id: "c", label: "Six sources reviewed", state: "pending" },
          ]}
          summary="A decision is needed before the final step." />
        <HarsoWorkResult title="Shape the launch brief" status="succeeded"
          steps={[
            { id: "a", label: "Shaping the recommendation", state: "done" },
            { id: "b", label: "Checking the evidence", state: "done" },
            { id: "c", label: "Six sources reviewed", state: "done" },
          ]}
          artifacts={[{ id: "one", name: "launch-brief.md", chip: "4 KB", detail: <HarsoArtifact name="launch-brief.md" meta="Research brief · Markdown" language="markdown" code={'# A quieter place to think\n\nThe best workspace leaves room for the work.\n'} preview={<p>The best workspace leaves room for the work.</p>} /> }]}
          summary="The final step is complete." />
      </div>
    </section>
  </AssistantRuntimeProvider>;
}
