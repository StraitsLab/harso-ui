import type { MessageStatus, ThreadAssistantMessagePart, ThreadMessageLike, ToolCallMessagePart } from "@assistant-ui/react";
import type { HarsoEvent } from "./stream-types";

export type HarsoStreamState = {
  content: ThreadAssistantMessagePart[];
  status: MessageStatus;
  retryable?: boolean;
};

export const initialHarsoState = (): HarsoStreamState => ({ content: [], status: { type: "running" } });

export function reduceHarsoEvent(state: HarsoStreamState, event: HarsoEvent): HarsoStreamState {
  if (state.status.type !== "running") return state;
  const content = [...state.content];
  const updateTool = (matches: (part: ToolCallMessagePart) => boolean, update: (part: ToolCallMessagePart) => ToolCallMessagePart) => {
    const index = content.findIndex((part) => part.type === "tool-call" && matches(part));
    const part = content[index];
    if (part?.type !== "tool-call") throw new Error(`Harso ${event.type}: unknown tool or permission`);
    content[index] = update(part);
  };
  switch (event.type) {
    case "text-delta":
    case "reasoning-delta": {
      const type = event.type === "text-delta" ? "text" : "reasoning";
      const last = content.at(-1);
      if (last?.type === type) content[content.length - 1] = { ...last, text: last.text + event.text };
      else content.push({ type, text: event.text });
      break;
    }
    case "tool-call":
      if (content.some((part) => part.type === "tool-call" && part.toolCallId === event.id)) throw new Error(`Duplicate Harso tool: ${event.id}`);
      content.push({ type: "tool-call", toolCallId: event.id, toolName: event.name, args: event.args, argsText: JSON.stringify(event.args) });
      break;
    case "tool-result":
      updateTool((part) => part.toolCallId === event.id, (part) => {
        if (part.approval && part.approval.approved !== true) throw new Error("Harso result received without approval");
        return { ...part, result: event.result, isError: event.isError ?? false };
      });
      break;
    case "permission-request":
      if (content.some((part) => part.type === "tool-call" && part.approval?.id === event.id)) throw new Error(`Duplicate Harso permission: ${event.id}`);
      updateTool((part) => part.toolCallId === event.toolCallId, (part) => {
        if (part.approval || part.result !== undefined) throw new Error("Harso permission must precede a tool result");
        return { ...part, approval: { id: event.id, prompt: event.prompt } };
      });
      break;
    case "permission-resolved":
      updateTool((part) => part.approval?.id === event.id, (part) => {
        if (part.approval?.approved !== undefined) throw new Error("Harso permission already resolved");
        return { ...part, approval: { ...part.approval!, approved: event.approved }, ...(event.approved ? {} : { result: "Denied by you. Command was not executed.", isError: true }) };
      });
      break;
    case "error":
    case "done": {
      const status: MessageStatus = event.type === "error"
        ? { type: "incomplete", reason: "error", error: event.message }
        : event.reason === "stop" ? { type: "complete", reason: "stop" }
          : { type: "incomplete", reason: event.reason === "cancel" ? "cancelled" : "error" };
      return {
        content: content.map((part) => part.type === "tool-call" && part.approval && part.approval.approved === undefined
          ? { ...part, approval: { ...part.approval, resolution: "cancelled" } } : part),
        status,
        ...(event.type === "error" ? { retryable: event.retryable } : {}),
      };
    }
  }
  return { ...state, content };
}

export type HarsoViewTurn = Readonly<{
  id: string;
  userText: string;
  assistantText?: string;
  assistantFinal?: boolean;
  tools: readonly Readonly<{ id: string; name: string; state: "started" | "completed" | "failed" }>[];
  failed?: boolean;
  clarification?: Readonly<{
    id: string;
    question: string;
    mode: "single" | "multiple" | "text";
    choices: readonly string[];
    pending?: boolean;
    resolved?: boolean;
    error?: string;
  }>;
  waitingNotice?: string;
  failureNotice?: string;
}>;

export function mapHistory(viewTurns: readonly HarsoViewTurn[]): ThreadMessageLike[] {
  return viewTurns.flatMap((turn): ThreadMessageLike[] => {
    const messages: ThreadMessageLike[] = [{ id: `${turn.id}:user`, role: "user", content: turn.userText }];
    if (turn.assistantText === undefined && !turn.assistantFinal && !turn.tools.length && !turn.failed && !turn.clarification && !turn.waitingNotice && !turn.failureNotice) return messages;
    const content: ThreadAssistantMessagePart[] = turn.tools.map((tool) => ({
      type: "tool-call", toolCallId: tool.id, toolName: tool.name, args: {}, argsText: "{}",
      ...(tool.state === "started" ? {} : { result: null, isError: tool.state === "failed" }),
    }));
    if (turn.assistantText !== undefined) content.push({ type: "text", text: turn.assistantText });
    const clarification = turn.clarification && {
      id: turn.clarification.id, question: turn.clarification.question, mode: turn.clarification.mode,
      choices: [...turn.clarification.choices], pending: turn.clarification.pending,
      resolved: turn.clarification.resolved, error: turn.clarification.error,
    };
    if (clarification && clarification.question !== turn.assistantText) content.push({ type: "text", text: clarification.question });
    messages.push({
      id: `${turn.id}:assistant`, role: "assistant", content,
      status: turn.failed || turn.failureNotice ? { type: "incomplete", reason: "error", error: turn.failureNotice ?? "Turn failed" }
        : turn.assistantFinal ? { type: "complete", reason: "stop" } : { type: "incomplete", reason: "other" },
      metadata: { custom: { harso: { turnId: turn.id, tools: turn.tools.map(({ id, name, state }) => ({ id, name, state })), clarification, waitingNotice: turn.waitingNotice, failureNotice: turn.failureNotice } } },
    });
    return messages;
  });
}
