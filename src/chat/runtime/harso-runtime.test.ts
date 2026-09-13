import { createElement } from "react";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssistantRuntimeProvider, type ChatModelRunOptions, type ChatModelRunResult, type CompleteAttachment } from "@assistant-ui/react";
import { createHarsoAdapter, createScriptedTransport, useHarsoRuntime } from "./harso-runtime";
import type { HarsoEvent, HarsoTransport } from "./stream-types";

const options = (signal = new AbortController().signal): ChatModelRunOptions => ({
  messages: [], abortSignal: signal, runConfig: {}, context: { tools: {} },
  unstable_getMessage: () => { throw new Error("Not used"); },
});
const collect = async (stream: AsyncGenerator<ChatModelRunResult, void>) => {
  const updates: ChatModelRunResult[] = [];
  for await (const update of stream) updates.push(update);
  return updates;
};

describe("createHarsoAdapter", () => {
  it("yields immutable cumulative snapshots and uses successive scripts", async () => {
    const adapter = createHarsoAdapter(createScriptedTransport([
      [{ type: "text-delta", text: "A" }, { type: "text-delta", text: "B" }, { type: "done", reason: "stop" }],
      [{ type: "reasoning-delta", text: "Think" }, { type: "done", reason: "cancel" }],
    ]));
    const updates = await collect(adapter.run(options()));
    expect(updates).toMatchObject([
      { content: [{ type: "text", text: "A" }], status: { type: "running" } },
      { content: [{ type: "text", text: "AB" }], status: { type: "running" } },
      { content: [{ type: "text", text: "AB" }], status: { type: "complete", reason: "stop" } },
    ]);
    expect((await collect(adapter.run(options()))).at(-1)?.status).toEqual({ type: "incomplete", reason: "cancelled" });
  });

  it("forwards latest user text, attachments, and thread identity", async () => {
    const attachment: CompleteAttachment = { id: "file", name: "note", type: "document", contentType: "text/plain", status: { type: "complete" }, content: [{ type: "text", text: "body" }] };
    const send = vi.fn<HarsoTransport["send"]>(() => (async function* () { yield { type: "done", reason: "stop" } as const; })());
    const adapter = createHarsoAdapter({ send });
    const runOptions = options();
    await collect(adapter.run({ ...runOptions, unstable_threadId: "desktop-thread", messages: [
      { id: "old", role: "user", content: [{ type: "text", text: "old" }], attachments: [], createdAt: new Date(), metadata: { custom: {} } },
      { id: "new", role: "user", content: [{ type: "text", text: "new" }, { type: "text", text: "prompt" }], attachments: [attachment], createdAt: new Date(), metadata: { custom: {} } },
    ] }));
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ threadId: "desktop-thread", text: "new\nprompt", attachments: [attachment], signal: expect.any(AbortSignal) }));
  });

  it.each([true, false])("permission round-trip approved=%s", async (approved) => {
    const adapter = createHarsoAdapter(createScriptedTransport([[
      { type: "tool-call", id: "tool", name: "terminal", args: {} },
      { type: "permission-request", id: "permission", toolCallId: "tool", prompt: "Run?" },
      { type: "done", reason: "stop" },
    ]]));
    const stream = adapter.run(options());
    await stream.next();
    expect((await stream.next()).value).toMatchObject({ content: [{ approval: { id: "permission" } }] });
    await adapter.decide("permission", approved);
    expect((await stream.next()).value).toMatchObject({ content: [{ approval: { approved } }] });
    expect((await stream.next()).value).toMatchObject({ status: { type: "complete" } });
    await stream.return();
    await expect(adapter.decide("permission", approved)).rejects.toThrow();
  });

  it("aborts before sending", async () => {
    const controller = new AbortController();
    controller.abort();
    const send = vi.fn<HarsoTransport["send"]>();
    expect(await collect(createHarsoAdapter({ send }).run(options(controller.signal)))).toMatchObject([{ status: { type: "incomplete", reason: "cancelled" } }]);
    expect(send).not.toHaveBeenCalled();
  });

  it("replays explicitly scripted permissions without waiting or duplicating resolution", async () => {
    const adapter = createHarsoAdapter(createScriptedTransport([[
      { type: "tool-call", id: "tool", name: "read", args: {} },
      { type: "permission-request", id: "permission", toolCallId: "tool", prompt: "Read?" },
      { type: "permission-resolved", id: "permission", approved: true },
      { type: "tool-result", id: "tool", result: "ok" },
      { type: "done", reason: "stop" },
    ]]));
    const updates = await collect(adapter.run(options()));
    expect(updates).toHaveLength(5);
    expect(updates.at(-1)).toMatchObject({ status: { type: "complete" }, content: [{ result: "ok", approval: { approved: true } }] });
  });

  it("uses an explicit thread ID before assistant-ui's ID and retains its local fallback", async () => {
    const send = vi.fn<HarsoTransport["send"]>(() => (async function* () { yield { type: "done", reason: "stop" } as const; })());
    await collect(createHarsoAdapter({ send }, { threadId: "explicit" }).run({ ...options(), unstable_threadId: "other" }));
    expect(send.mock.calls[0][0].threadId).toBe("explicit");
    const local = createHarsoAdapter({ send });
    await collect(local.run(options()));
    await collect(local.run(options()));
    expect(send.mock.calls[1][0].threadId).toBeTruthy();
    expect(send.mock.calls[1][0].threadId).toBe(send.mock.calls[2][0].threadId);
  });

  it("aborts mid-stream and preserves partial text", async () => {
    const controller = new AbortController();
    const adapter = createHarsoAdapter(createScriptedTransport([[{ type: "text-delta", text: "partial" }, { type: "text-delta", text: "ignored" }]]));
    const stream = adapter.run(options(controller.signal));
    await stream.next();
    controller.abort();
    expect((await stream.next()).value).toMatchObject({ content: [{ text: "partial" }], status: { type: "incomplete", reason: "cancelled" } });
    expect((await stream.next()).done).toBe(true);
  });

  it("aborts a stalled next() without waiting for transport cooperation", async () => {
    const controller = new AbortController();
    const close = vi.fn(async () => ({ done: true as const, value: undefined }));
    const adapter = createHarsoAdapter({ send: () => ({ [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}), return: close }) }) });
    const stream = adapter.run(options(controller.signal));
    const pending = stream.next();
    controller.abort();
    expect((await pending).value).toMatchObject({ status: { reason: "cancelled" } });
    await stream.next();
    expect(close).toHaveBeenCalledOnce();
  });

  it("aborts during approval and removes pending decisions", async () => {
    const controller = new AbortController();
    const adapter = createHarsoAdapter(createScriptedTransport([[
      { type: "tool-call", id: "tool", name: "terminal", args: {} },
      { type: "permission-request", id: "permission", toolCallId: "tool", prompt: "Run?" },
    ]]));
    const stream = adapter.run(options(controller.signal));
    await stream.next();
    await stream.next();
    const pending = stream.next();
    controller.abort();
    expect((await pending).value).toMatchObject({ status: { reason: "cancelled" }, content: [{ approval: { resolution: "cancelled" } }] });
    await stream.next();
    await expect(adapter.decide("permission", true)).rejects.toThrow();
  });

  it.each([
    [{ type: "error", message: "Offline", retryable: true }, { type: "done", reason: "stop" }],
    [{ type: "tool-result", id: "unknown", result: null }],
    [{ type: "text-delta", text: "truncated" }],
    [],
  ] satisfies HarsoEvent[][])("reports error or premature EOF for %j", async (...events) => {
    const updates = await collect(createHarsoAdapter(createScriptedTransport([events])).run(options()));
    expect(updates.at(-1)?.status).toMatchObject({ type: "incomplete", reason: "error" });
  });

  it("turns thrown transport failures into error state", async () => {
    const adapter = createHarsoAdapter({ send() { throw new Error("Network unavailable"); } });
    expect((await collect(adapter.run(options()))).at(-1)?.status).toEqual({ type: "incomplete", reason: "error", error: "Network unavailable" });
    await expect(adapter.decide("missing", true)).rejects.toThrow("does not support");
  });

  it("binds decisions to the transport and propagates decision failures", async () => {
    const transport = { send: createScriptedTransport([]).send, async decide() { expect(this).toBe(transport); throw new Error("Denied by server"); } };
    await expect(createHarsoAdapter(transport).decide("id", true)).rejects.toThrow("Denied by server");
  });
});

describe("useHarsoRuntime", () => {
  it("keeps an approval stream running until the server decision arrives", async () => {
    const transport = createScriptedTransport([[
      { type: "tool-call", id: "tool", name: "terminal", args: {} },
      { type: "permission-request", id: "permission", toolCallId: "tool", prompt: "Run?" },
      { type: "tool-result", id: "tool", result: "ok" },
      { type: "done", reason: "stop" },
    ]]);
    const { result } = renderHook(() => useHarsoRuntime(transport, { threadId: "thread" }));
    render(createElement(AssistantRuntimeProvider, { runtime: result.current }));
    act(() => { result.current.thread.append("Run"); });
    await waitFor(() => expect(result.current.thread.getState().messages.at(-1)?.content[0]).toMatchObject({ approval: { id: "permission" } }));
    expect(result.current.thread.getState().isRunning).toBe(true);
    await act(async () => { await transport.decide!("permission", true); });
    await waitFor(() => expect(result.current.thread.getState().isRunning).toBe(false));
    expect(result.current.thread.getState().messages.at(-1)?.content[0]).toMatchObject({ approval: { approved: true }, result: "ok" });
    expect(result.current.thread.getState().messages.at(-1)?.status).toEqual({ type: "complete", reason: "stop" });
  });

  it("hydrates history, streams through assistant-ui and passes attachment adapters", async () => {
    const send = vi.fn(async (attachment) => ({ ...attachment, status: { type: "complete" as const } }));
    const attachmentAdapter = {
      accept: "text/plain", add: vi.fn(async ({ file }: { file: File }) => ({ id: "file", type: "document" as const, name: file.name, file, status: { type: "requires-action" as const, reason: "composer-send" as const }, content: [] })),
      send, remove: vi.fn(async () => {}),
    };
    const transport = createScriptedTransport([[{ type: "text-delta", text: "Response" }, { type: "done", reason: "stop" }]]);
    const { result } = renderHook(() => useHarsoRuntime(transport, { threadId: "thread", attachments: attachmentAdapter, initialMessages: [{ role: "user", content: "Seed" }] }));
    render(createElement(AssistantRuntimeProvider, { runtime: result.current }));
    expect(result.current.thread.getState().messages[0].content).toMatchObject([{ text: "Seed" }]);
    await act(async () => { await result.current.thread.composer.addAttachment(new File(["hello"], "note.txt", { type: "text/plain" })); });
    act(() => { result.current.thread.composer.setText("Prompt"); result.current.thread.composer.send(); });
    await waitFor(() => expect(result.current.thread.getState().messages.at(-1)?.status).toEqual({ type: "complete", reason: "stop" }));
    expect(result.current.thread.getState().messages.at(-1)?.content).toMatchObject([{ text: "Response" }]);
    expect(send).toHaveBeenCalledOnce();
  });
});
