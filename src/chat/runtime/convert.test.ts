import { describe, expect, it } from "vitest";
import { initialHarsoState, reduceHarsoEvent, mapHistory } from "./convert";
import type { HarsoEvent } from "./stream-types";

const call: HarsoEvent = { type: "tool-call", id: "tool", name: "terminal", args: { command: "pwd" } };
const request: HarsoEvent = { type: "permission-request", id: "permission", toolCallId: "tool", prompt: "Run?" };
const fold = (events: HarsoEvent[]) => events.reduce(reduceHarsoEvent, initialHarsoState());

describe("reduceHarsoEvent", () => {
  it("coalesces adjacent deltas without reordering interleaved tools and reasoning", () => {
    const state = fold([
      { type: "text-delta", text: "Hello" }, { type: "text-delta", text: " world" }, call,
      { type: "reasoning-delta", text: "Think" }, { type: "reasoning-delta", text: " more" },
      { type: "tool-result", id: "tool", result: "/tmp" }, { type: "text-delta", text: "Done" },
    ]);
    expect(state.content).toEqual([
      { type: "text", text: "Hello world" },
      { type: "tool-call", toolCallId: "tool", toolName: "terminal", args: { command: "pwd" }, argsText: '{"command":"pwd"}', result: "/tmp", isError: false },
      { type: "reasoning", text: "Think more" }, { type: "text", text: "Done" },
    ]);
  });

  it.each([true, false])("resolves permission approved=%s, preserving the prompt", (approved) => {
    const awaiting = fold([call, request]);
    expect(awaiting.content[0]).toMatchObject({ approval: { id: "permission", prompt: "Run?" } });
    expect(awaiting.status).toEqual({ type: "running" });
    const resolved = reduceHarsoEvent(awaiting, { type: "permission-resolved", id: "permission", approved });
    expect(resolved.content[0]).toMatchObject({ approval: { id: "permission", prompt: "Run?", approved } });
    if (!approved) expect(resolved.content[0]).toMatchObject({ isError: true, result: "Denied by you. Command was not executed." });
    expect(awaiting.content[0]).not.toHaveProperty("approval.approved");
  });

  it.each([
    [{ type: "done", reason: "stop" }, { type: "complete", reason: "stop" }],
    [{ type: "done", reason: "cancel" }, { type: "incomplete", reason: "cancelled" }],
    [{ type: "done", reason: "error" }, { type: "incomplete", reason: "error" }],
    [{ type: "error", message: "Offline", retryable: true }, { type: "incomplete", reason: "error", error: "Offline" }],
  ] satisfies [HarsoEvent, object][]) ("maps terminal event %j", (event, status) => {
    const state = fold([{ type: "text-delta", text: "partial" }, event]);
    expect(state.status).toEqual(status);
    expect(state.content).toEqual([{ type: "text", text: "partial" }]);
    expect(reduceHarsoEvent(state, { type: "done", reason: "stop" })).toBe(state);
  });

  it("retains retryability and cancels pending approvals", () => {
    expect(fold([{ type: "error", message: "oops", retryable: false }]).retryable).toBe(false);
    expect(fold([call, request, { type: "done", reason: "cancel" }]).content[0]).toMatchObject({ approval: { resolution: "cancelled" } });
  });

  it.each([null, false, 0, "", { output: "ok" }])("preserves result %j", (result) => {
    expect(fold([call, { type: "tool-result", id: "tool", result, isError: true }]).content[0]).toMatchObject({ result, isError: true });
  });

  it.each([
    [{ type: "tool-result", id: "missing", result: "no" }],
    [request],
    [{ type: "permission-resolved", id: "missing", approved: true }],
    [call, call],
    [call, request, request],
  ] satisfies HarsoEvent[][])("rejects invalid event ordering %j", (...events) => {
    expect(() => fold(events)).toThrow();
  });

  it("updates the matching tool even when results arrive in reverse order", () => {
    const state = fold([call, { ...call, id: "second" }, { type: "tool-result", id: "second", result: 2 }, { type: "tool-result", id: "tool", result: 1 }]);
    expect(state.content).toMatchObject([{ toolCallId: "tool", result: 1 }, { toolCallId: "second", result: 2 }]);
  });

  it.each([
    [call, request, { type: "tool-result", id: "tool", result: "unapproved" }],
    [call, request, { type: "permission-resolved", id: "permission", approved: false }, { type: "tool-result", id: "tool", result: "denied" }],
    [call, request, { type: "permission-resolved", id: "permission", approved: true }, { type: "permission-resolved", id: "permission", approved: false }],
    [call, { type: "tool-result", id: "tool", result: "finished" }, request],
    [call, request, { ...request, id: "second" }],
  ] satisfies HarsoEvent[][])("rejects invalid approval transition %j", (...events) => {
    expect(() => fold(events)).toThrow();
  });

  it("does not mutate previous text, tool, or result snapshots", () => {
    const first = fold([call]);
    const second = reduceHarsoEvent(first, { type: "tool-result", id: "tool", result: 0 });
    expect(first.content[0]).not.toHaveProperty("result");
    expect(second.content[0]).toHaveProperty("result", 0);
    expect(first.content).not.toBe(second.content);
  });
});

describe("mapHistory", () => {
  it("keeps user-only turns and stable distinct IDs", () => {
    expect(mapHistory([{ id: "turn", userText: "Hi", tools: [] }])).toEqual([{ id: "turn:user", role: "user", content: "Hi" }]);
  });

  it.each([true, false, undefined])("maps assistantFinal=%s without reviving historical streams", (assistantFinal) => {
    const messages = mapHistory([{ id: "turn", userText: "Hi", assistantText: "Hello", assistantFinal, tools: [] }]);
    expect(messages[1]).toMatchObject({ id: "turn:assistant", content: [{ type: "text", text: "Hello" }], status: assistantFinal ? { type: "complete", reason: "stop" } : { type: "incomplete", reason: "other" } });
  });

  it.each(["started", "completed", "failed"] as const)("maps %s tools without inventing output", (state) => {
    const message = mapHistory([{ id: "turn", userText: "Hi", tools: [{ id: "tool", name: "read", state }] }])[1];
    expect(message.content).toMatchObject([{ toolCallId: "tool", toolName: "read", args: {}, argsText: "{}", ...(state === "started" ? {} : { result: null, isError: state === "failed" }) }]);
    expect(message.metadata?.custom?.harso).toMatchObject({ tools: [{ id: "tool", name: "read", state }] });
  });

  it("maps failures and waiting notices", () => {
    expect(mapHistory([{ id: "failed", userText: "Hi", tools: [], failed: true, failureNotice: "Offline" }])[1]).toMatchObject({ status: { type: "incomplete", reason: "error", error: "Offline" } });
    expect(mapHistory([{ id: "waiting", userText: "Hi", tools: [], waitingNotice: "Queued" }])[1]).toMatchObject({ metadata: { custom: { harso: { waitingNotice: "Queued" } } } });
  });

  it.each([true, false])("preserves clarification resolved=%s as data, not callbacks", (resolved) => {
    const clarification = { id: "question", question: "Which?", mode: "single" as const, choices: ["A"], pending: false, resolved, error: "Try again", onRespond: () => {} };
    const message = mapHistory([{ id: "turn", userText: "Hi", assistantText: "Context", tools: [], clarification }])[1];
    expect(message.content).toEqual([{ type: "text", text: "Context" }, { type: "text", text: "Which?" }]);
    expect(message.metadata?.custom?.harso).toMatchObject({ clarification: { id: "question", question: "Which?", mode: "single", choices: ["A"], resolved } });
    expect(JSON.stringify(message)).not.toContain("onRespond");
  });

  it("handles empty final, clarification-only, and duplicate question text", () => {
    expect(mapHistory([{ id: "empty", userText: "", assistantFinal: true, tools: [] }])[1]).toMatchObject({ content: [], status: { type: "complete" } });
    const clarification = { id: "question", question: "Which?", mode: "text" as const, choices: [] };
    for (const assistantText of [undefined, "Which?"]) {
      expect(mapHistory([{ id: "turn", userText: "Hi", tools: [], assistantText, clarification }])[1].content).toEqual([{ type: "text", text: "Which?" }]);
    }
  });
});
