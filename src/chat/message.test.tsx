import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AssistantRuntimeProvider, ComposerPrimitive, useLocalRuntime, type ToolCallMessagePartComponent, type ToolCallMessagePartProps, type ThreadMessageLike } from "@assistant-ui/react";
import { HarsoThread } from "./thread";
import type { HarsoMessageSlots } from "./message";
import { attachments, createScriptedAdapter, samples, type ScriptedAdapterOptions } from "./testing/scripted-adapter";
import messageCSS from "./message.css?inline";

const messages: ThreadMessageLike[] = [{ id: "question", role: "user", content: "Original question", attachments: samples }, { id: "answer", role: "assistant", content: "Original answer", status: { type: "complete", reason: "stop" } }];
const submitFeedback = vi.fn();

function Example({ seed = messages, options, ...slots }: HarsoMessageSlots & { seed?: ThreadMessageLike[]; options?: ScriptedAdapterOptions }) {
  const [adapter] = useState(() => createScriptedAdapter({ response: "Edited answer.", tokenDelayMs: 5, tools: false, ...options }));
  const [Tool] = useState<ToolCallMessagePartComponent>(() => ({ toolName, toolCallId, approval, result }: ToolCallMessagePartProps) => <section aria-label={toolName}>{approval && approval.approved === undefined && <><button onClick={() => adapter.decide(toolCallId, true)}>Approve</button><button onClick={() => adapter.decide(toolCallId, false)}>Deny</button></>}<pre>{String(result ?? "Running")}</pre></section>);
  const runtime = useLocalRuntime(adapter, { initialMessages: seed, adapters: { attachments, feedback: { submit: submitFeedback } } });
  return <div className="harso-kit"><style>{messageCSS}</style><AssistantRuntimeProvider runtime={runtime}><HarsoThread toolUI={{ Fallback: Tool }} {...slots} composer={<ComposerPrimitive.Root><ComposerPrimitive.Input aria-label="New message" /><ComposerPrimitive.Send>Send</ComposerPrimitive.Send><ComposerPrimitive.Cancel>Stop</ComposerPrimitive.Cancel></ComposerPrimitive.Root>} /></AssistantRuntimeProvider></div>;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.scrollTo = vi.fn();
  submitFeedback.mockClear();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Harso messages and MessageActions", () => {
  test("aligns users right and assistants left, with attachments inside the bubble", () => {
    const { container } = render(<Example />);
    expect(getComputedStyle(screen.getByRole("article", { name: "You" })).alignItems).toBe("flex-end");
    expect(getComputedStyle(screen.getByRole("article", { name: "Harso" })).alignItems).toBe("flex-start");
    expect(container.querySelector(".hkc-message-bubble")).toContainElement(screen.getByText("requirements.md"));
    expect(container.querySelector(".hkc-message--user .hkc-message-speaker")).toBeNull();
    expect(screen.getByRole("img", { name: "conversation.png" })).toBeInTheDocument();
    const assistant = within(screen.getByRole("article", { name: "Harso" }));
    for (const name of ["Copy message", "Helpful", "Not helpful", "Regenerate response", "Read aloud"]) expect(assistant.getByRole("button", { name })).toHaveAttribute("title");
  });

  test("renders an editorial headline and timestamp without a visible You label", () => {
    const createdAt = new Date(); createdAt.setHours(14, 2, 0, 0);
    const { container } = render(<Example headline="A calmer first step" seed={messages.map(message => ({ ...message, createdAt }))} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("A calmer first step");
    expect(screen.getByText("Today at 14:02")).toHaveAttribute("datetime", createdAt.toISOString());
    expect(container.querySelector(".hkc-message-speaker time")).toHaveTextContent("14:02");
  });

  test("copy delegates to the clipboard primitive", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Example />);
    fireEvent.click(within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Original answer"));
  });

  test("a host clipboard replaces navigator.clipboard and reports the copied state", async () => {
    // Electron renderers under a strict permission policy have no navigator.clipboard; the host writes through IPC.
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const copyToClipboard = vi.fn().mockResolvedValue(undefined);
    render(<Example copyToClipboard={copyToClipboard} />);
    const copy = within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" });
    fireEvent.click(copy);
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledWith("Original answer"));
    await waitFor(() => expect(copy).toHaveAttribute("title", "Copied"));
    expect(copy).toHaveAttribute("aria-pressed", "true");
  });

  test("a host clipboard that rejects leaves the button in its resting state", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const copyToClipboard = vi.fn().mockRejectedValue(new Error("denied"));
    render(<Example copyToClipboard={copyToClipboard} />);
    const copy = within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" });
    fireEvent.click(copy);
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledOnce());
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(copy).toHaveAttribute("title", "Copy");
  });

  test("cancel preserves the original; save creates a navigable branch", async () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    expect(screen.getByRole("textbox", { name: "Edit your message" })).toHaveValue("Original question");
    fireEvent.change(screen.getByRole("textbox", { name: "Edit your message" }), { target: { value: "Discard me" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Original question")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit your message" }), { target: { value: "Changed question" } });
    fireEvent.click(screen.getByRole("button", { name: "Save & send" }));
    await waitFor(() => expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("Edited answer."));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous branch" }));
    expect(await screen.findByText("Original question")).toBeInTheDocument();
    expect(screen.getByText("Original answer")).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  test("shows a streaming cursor until the adapter finishes", async () => {
    render(<Example seed={[]} options={{ response: "First second third", tokenDelayMs: 150, reasoning: false }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Streaming" })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("First second third"));
    await waitFor(() => expect(screen.queryByRole("status", { name: "Streaming" })).not.toBeInTheDocument());
  });

  test("feedback uses runtime state rather than local reaction state", async () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute("aria-pressed", "true");
  });

  test("error can be retried and cancelled runs show a quiet note", async () => {
    render(<Example seed={[]} options={{ response: "First second", tokenDelayMs: 50 }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "error" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Simulated adapter error");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(await screen.findByText("Stopped by you.")).toBeInTheDocument();
  });

  test("passes reasoning, named tool, fallback and attachment slots", () => {
    const Tool: ToolCallMessagePartComponent = ({ toolName }) => <div>Named {toolName}</div>;
    const Fallback: ToolCallMessagePartComponent = ({ toolName }) => <div>Fallback {toolName}</div>;
    render(<Example seed={[messages[0], { role: "assistant", content: [{ type: "reasoning", text: "Think" }, { type: "tool-call", toolCallId: "read", toolName: "read_file", args: {} }, { type: "tool-call", toolCallId: "other", toolName: "other", args: {} }], status: { type: "complete", reason: "stop" } }]} reasoning={() => <div>Custom reasoning</div>} attachment={() => <span>Custom attachment</span>} toolUI={{ by_name: { read_file: Tool }, Fallback }} />);
    expect(screen.getByText("Custom reasoning")).toBeInTheDocument();
    expect(screen.getByText("Named read_file")).toBeInTheDocument();
    expect(screen.getByText("Fallback other")).toBeInTheDocument();
    expect(screen.getAllByText("Custom attachment")).toHaveLength(2);
  });

  test.each(["Approve", "Deny"])("the scripted terminal waits for %s without executing commands", async decision => {
    render(<Example seed={[]} options={{ response: "Inspect.", tools: true, tokenDelayMs: 1, toolDelayMs: 1 }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Inspect" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const button = await screen.findByRole("button", { name: decision });
    expect(screen.queryByText(/SIMULATED OUTPUT/)).not.toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent(decision === "Approve" ? "SIMULATED OUTPUT" : "Denied by you. Command was not executed."));
    await waitFor(() => expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled());
  });

  test("can stop while waiting for approval", async () => {
    render(<Example seed={[]} options={{ response: "Inspect.", tools: true, tokenDelayMs: 1, toolDelayMs: 1 }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Inspect" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("button", { name: "Approve" });
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(await screen.findByText("Stopped by you.")).toBeInTheDocument();
  });

  test("attachment adapter reads a file and completes it on send", async () => {
    const attachment = await attachments.add({ file: new File(["requirements"], "notes.txt", { type: "text/plain" }) });
    if (Symbol.asyncIterator in attachment) throw new Error("Expected the scripted file adapter to resolve once.");
    expect(attachment).toMatchObject({ name: "notes.txt", status: { type: "requires-action" } });
    expect(await attachments.send(attachment)).toMatchObject({ status: { type: "complete" }, content: [{ type: "file", filename: "notes.txt" }] });
    await attachments.remove(attachment);
  });
  test("pending clipboard completion after a branch edit does not replace the new response", async () => {
    let resolveCopy!: () => void;
    const writeText = vi.fn(() => new Promise<void>(resolve => { resolveCopy = resolve; }));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Example />);
    fireEvent.click(within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith("Original answer");
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit your message" }), { target: { value: "New branch" } });
    fireEvent.click(screen.getByRole("button", { name: "Save & send" }));
    await waitFor(() => expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("Edited answer."));
    await act(async () => resolveCopy());
    expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("Edited answer.");
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledOnce();
  });

  test("pending feedback follows message identity through unmount, not a replacement response", async () => {
    let resolveFeedback!: () => void;
    submitFeedback.mockImplementationOnce(() => new Promise<void>(resolve => { resolveFeedback = resolve; }));
    const view = render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalledOnce());
    view.unmount();
    render(<Example seed={[{ id: "replacement", role: "assistant", content: "Replacement answer", status: { type: "complete", reason: "stop" } }]} />);
    await act(async () => resolveFeedback());
    expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("Replacement answer");
    expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute("aria-pressed", "false");
  });

  test("clipboard rejection stays retryable and never claims copied success", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("Permission denied")).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Example />);
    const copy = within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" });
    await act(async () => fireEvent.click(copy));
    expect(copy).not.toHaveAttribute("data-copied");
    expect(copy).toBeEnabled();
    await act(async () => fireEvent.click(copy));
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(copy).toHaveAttribute("data-copied", "true");
  });

  test("pending copy reentry does not announce success until a writer resolves", async () => {
    const resolutions: (() => void)[] = [];
    const writeText = vi.fn(() => new Promise<void>(resolve => resolutions.push(resolve)));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Example />);
    const copy = within(screen.getByRole("article", { name: "Harso" })).getByRole("button", { name: "Copy message" });
    fireEvent.click(copy); fireEvent.click(copy);
    expect(copy).not.toHaveAttribute("data-copied");
    // assistant-ui permits repeated user-gesture writes, unlike a legacy pending lock; neither can mutate message text.
    expect(writeText).toHaveBeenCalledTimes(2);
    await act(async () => resolutions[1]());
    expect(copy).toHaveAttribute("data-copied", "true");
    await act(async () => resolutions[0]());
    expect(screen.getByRole("article", { name: "Harso" })).toHaveTextContent("Original answer");
  });

});
