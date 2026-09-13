import { useMemo } from "react";
import { useLocalRuntime, type ChatModelAdapter, type ChatModelRunOptions, type ChatModelRunResult, type AttachmentAdapter, type LocalRuntimeOptions } from "@assistant-ui/react";
import { initialHarsoState, reduceHarsoEvent } from "./convert";
import type { HarsoEvent, HarsoTransport } from "./stream-types";

function abortable<Value>(promise: PromiseLike<Value>, signal: AbortSignal): Promise<Value> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Stopped", "AbortError"));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export type HarsoAdapter = Omit<ChatModelAdapter, "run"> & {
  run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult, void>;
  decide(permissionId: string, approved: boolean): Promise<void>;
};

export function createHarsoAdapter(transport: HarsoTransport, options: { threadId?: string } = {}): HarsoAdapter {
  const fallbackThreadId = options.threadId ?? crypto.randomUUID();
  return {
    async decide(permissionId, approved) {
      if (!transport.decide) throw new Error("Harso transport does not support permission decisions");
      await transport.decide(permissionId, approved);
    },
    async *run({ messages, abortSignal, unstable_threadId }) {
      let state = initialHarsoState();
      let iterator: AsyncIterator<HarsoEvent> | undefined;
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (abortSignal.aborted) abort();
      else abortSignal.addEventListener("abort", abort, { once: true });
      try {
        if (controller.signal.aborted) throw new DOMException("Stopped", "AbortError");
        const user = messages.filter((message) => message.role === "user").at(-1);
        iterator = transport.send({
          threadId: options.threadId ?? unstable_threadId ?? fallbackThreadId,
          text: user?.content.filter((part) => part.type === "text").map((part) => part.text).join("\n") ?? "",
          ...(user ? { attachments: user.attachments } : {}),
          signal: controller.signal,
        })[Symbol.asyncIterator]();
        while (!controller.signal.aborted) {
          const next = await abortable(iterator.next(), controller.signal);
          if (controller.signal.aborted) break;
          if (next.done) throw new Error("Harso stream ended before a done event");
          state = reduceHarsoEvent(state, next.value);
          yield { content: state.content, status: state.status, ...(state.retryable === undefined ? {} : { metadata: { custom: { harso: { retryable: state.retryable } } } }) };
          if (state.status.type !== "running") return;
        }
        state = reduceHarsoEvent(state, { type: "done", reason: "cancel" });
        yield { content: state.content, status: state.status };
      } catch (error) {
        state = reduceHarsoEvent(state, controller.signal.aborted
          ? { type: "done", reason: "cancel" }
          : { type: "error", message: error instanceof Error ? error.message : String(error) });
        yield { content: state.content, status: state.status };
      } finally {
        abortSignal.removeEventListener("abort", abort);
        controller.abort();
        try { void Promise.resolve(iterator?.return?.()).catch(() => {}); } catch {}
      }
    },
  };
}

export type HarsoRuntimeOptions = LocalRuntimeOptions & { threadId?: string; attachments?: AttachmentAdapter };

export function useHarsoRuntime(transport: HarsoTransport, { threadId, attachments, ...options }: HarsoRuntimeOptions = {}) {
  const adapter = useMemo(() => createHarsoAdapter(transport, { threadId }), [transport, threadId]);
  return useLocalRuntime(adapter, { ...options, adapters: { ...options.adapters, ...(attachments ? { attachments } : {}) } });
}

export function createScriptedTransport(script: HarsoEvent[][]): HarsoTransport {
  let runIndex = 0;
  const decisions = new Map<string, (approved: boolean) => void>();
  return {
    async decide(permissionId, approved) {
      const resolve = decisions.get(permissionId);
      if (!resolve) throw new Error(`No pending Harso permission: ${permissionId}`);
      decisions.delete(permissionId);
      resolve(approved);
    },
    async *send({ signal }) {
      const events = script[runIndex++] ?? [];
      for (const event of events) {
        if (signal.aborted) return;
        if (event.type !== "permission-request" || events.some((candidate) => candidate.type === "permission-resolved" && candidate.id === event.id)) {
          yield event;
          continue;
        }
        if (decisions.has(event.id)) throw new Error(`Duplicate pending Harso permission: ${event.id}`);
        const decision = new Promise<boolean>((resolve) => decisions.set(event.id, resolve));
        const clear = () => decisions.delete(event.id);
        signal.addEventListener("abort", clear, { once: true });
        try {
          yield event;
          const approved = await abortable(decision, signal);
          yield { type: "permission-resolved", id: event.id, approved };
        } finally {
          clear();
          signal.removeEventListener("abort", clear);
        }
      }
    },
  };
}
