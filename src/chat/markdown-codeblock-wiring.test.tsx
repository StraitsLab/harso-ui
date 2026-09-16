import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime } from "@assistant-ui/react";
import { HarsoMarkdownText } from "./markdown";

afterEach(cleanup);

function Message() {
  return <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Text: HarsoMarkdownText }} /></MessagePrimitive.Root>;
}

// Proves the transcript rendering path (HarsoMarkdownText -> SyntaxHighlighter -> HarsoCodeBlock):
// a ```diff fence produces per-line diff rows with add/remove tint classes and an accessible label.
function Harness({ content }: { content: string }) {
  const runtime = useLocalRuntime({ async *run() {} }, { initialMessages: [{ role: "assistant", content }] });
  return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
}

test("a diff fence in the transcript renders add/remove diff rows", () => {
  const md = "Change:\n\n```diff\n- const result = \"Pending\";\n+ const result = \"Done\";\n const other = 1;\n```";
  const { container } = render(<Harness content={md} />);
  const rows = container.querySelectorAll(".hkc-code-block-row");
  expect(rows.length).toBe(3);
  expect(rows[0].getAttribute("data-diff")).toBe("remove");
  expect(rows[1].getAttribute("data-diff")).toBe("add");
  expect(screen.getByText("Removed:")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("a plain fence in the transcript renders per-line rows with a number gutter", () => {
  const md = "Code:\n\n```ts\nconst ready = true;\nconsole.log(ready);\n```";
  const { container } = render(<Harness content={md} />);
  expect(container.querySelectorAll(".hkc-code-block-row").length).toBe(2);
  expect(container.querySelectorAll(".hkc-code-block-num").length).toBe(2);
  // no diff tint on a plain fence
  expect(container.querySelector("[data-diff]")).toBeNull();
});
