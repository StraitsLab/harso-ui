import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useLocalRuntime } from "@assistant-ui/react";
import { HarsoReasoning } from "./reasoning";

test("reasoning uses the part text and native disclosure", () => {
  function Message() { return <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Reasoning: HarsoReasoning }} /></MessagePrimitive.Root>; }
  function Harness() {
    const runtime = useLocalRuntime({ async *run() {} }, { initialMessages: [{ role: "assistant", content: [{ type: "reasoning", text: "Inspect the tokens first." }] }] });
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
  }
  const { container } = render(<Harness />);
  const disclosure = container.querySelector("details")!;
  expect(disclosure).not.toHaveAttribute("open");
  fireEvent.click(screen.getByText(/^Reason/));
  expect(disclosure).toHaveAttribute("open");
  expect(screen.getByText("Inspect the tokens first.", { selector: ":not(.hkc-reasoning-preview)" })).toBeVisible();
  fireEvent.click(screen.getByText(/^Reason/));
  expect(disclosure).not.toHaveAttribute("open");
});

test("reasoning marks streaming until the adapter completes", async () => {
  let runtime: ReturnType<typeof useLocalRuntime>;
  let complete!: () => void;
  const finished = new Promise<void>(resolve => { complete = resolve; });
  function Message() { return <MessagePrimitive.Root><MessagePrimitive.Parts components={{ Reasoning: HarsoReasoning }} /></MessagePrimitive.Root>; }
  function Harness() {
    runtime = useLocalRuntime({ async *run() {
      yield { content: [{ type: "reasoning", text: "Checking…" }] };
      await finished;
    } });
    return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Messages components={{ Message }} /></AssistantRuntimeProvider>;
  }
  const { container } = render(<Harness />);
  await act(async () => { runtime.thread.append("Inspect"); });
  await waitFor(() => expect(container.querySelector("details")).toHaveAttribute("data-streaming", "true"));
  await act(async () => { complete(); });
  await waitFor(() => expect(container.querySelector("details")).toHaveAttribute("data-streaming", "false"));
});
