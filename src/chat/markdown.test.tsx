import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime } from "@assistant-ui/react";
import { HarsoMarkdownText } from "./markdown";

afterEach(cleanup);

function Message() {
  return <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Text: HarsoMarkdownText }} /></MessagePrimitive.Root>;
}

test("renders GFM tables, lists, task lists, inline code, and fenced code", () => {
  function Harness() {
    const runtime = useLocalRuntime({ async *run() {} }, { initialMessages: [{ role: "assistant", content: '# Title\n\n## Section\n\n### Detail\n\nA paragraph with `inline` code.\n\n- first\n- second\n\n1. ordered\n\n- [x] checked\n\n| Name | Value |\n| --- | --- |\n| Harso | Ready |\n\n> A quiet quote\n\n---\n\n```ts\nconst ready = true;\n```' }] });
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Title");
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Section");
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Detail");
  expect(within(screen.getByRole("table")).getByRole("cell", { name: "Harso" })).toBeVisible();
  expect(screen.getAllByRole("list")).toHaveLength(3);
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(screen.getByText("inline").tagName).toBe("CODE");
  expect(screen.getByText("A quiet quote").closest("blockquote")).not.toBeNull();
  expect(screen.getByRole("separator")).toBeVisible();
  expect(screen.getByRole("region", { name: "Code" })).toHaveTextContent("const ready = true;");
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("rendered Markdown collapses source newlines instead of inheriting the plain-text pre-wrap", () => {
  // .hkc-message-text is pre-wrap for streaming plain text; a Markdown container carrying that class would render the
  // newline between </li> and <li> as a blank line and triple the list leading.
  function Harness() {
    const runtime = useLocalRuntime({ async *run() {} }, { initialMessages: [{ role: "assistant", content: "- one\n- two\n\nafter" }] });
    return <AssistantRuntimeProvider runtime={runtime}><div className="harso-kit"><ThreadPrimitive.Messages components={{ Message }} /></div></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  const markdown = screen.getByTestId("hkc-markdown");
  expect(markdown).toHaveClass("hkc-message-text");
  expect(getComputedStyle(markdown).whiteSpace).toBe("normal");
});

test("opens safe links in a new tab and removes executable URLs", () => {
  function Harness() {
    const runtime = useLocalRuntime({ async *run() {} }, { initialMessages: [{ role: "assistant", content: "[Example](https://example.com) and [unsafe](javascript:alert%281%29)" }] });
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  expect(screen.getByRole("link", { name: "Example" })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: "Example" })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("unsafe")).not.toHaveAttribute("href", "javascript:alert%281%29");
});

test("streams through the real runtime without remounting the text part", async () => {
  let runtime: ReturnType<typeof useLocalRuntime>;
  let continueStream!: () => void;
  const nextChunk = new Promise<void>(resolve => { continueStream = resolve; });
  const adapter = { async *run() {
    yield { content: [{ type: "text" as const, text: "First paragraph." }] };
    await nextChunk;
    yield { content: [{ type: "text" as const, text: "First paragraph. More streamed text." }] };
  } };
  function Harness() {
    runtime = useLocalRuntime(adapter);
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ AssistantMessage: Message, UserMessage: () => null }} /></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  await act(async () => { runtime.thread.append("Stream"); });
  await waitFor(() => expect(screen.getByTestId("hkc-markdown")).toHaveTextContent("First"));
  const root = screen.getByTestId("hkc-markdown");
  const paragraph = root.querySelector("p");
  await act(async () => { continueStream(); });
  await waitFor(() => expect(root).toHaveTextContent("More streamed text."));
  expect(screen.getByTestId("hkc-markdown")).toBe(root);
  expect(root.querySelector("p")).toBe(paragraph);
});
