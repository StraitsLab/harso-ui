import type { CompleteAttachment, ToolCallMessagePart } from "@assistant-ui/react";

export const HARSO_STREAM_VERSION = 1 as const;

export type HarsoEvent =
  | { type: "text-delta"; text: string }
  | { type: "reasoning-delta"; text: string }
  | { type: "tool-call"; id: string; name: string; args: ToolCallMessagePart["args"] }
  | { type: "tool-result"; id: string; result: unknown; isError?: boolean }
  | { type: "permission-request"; id: string; toolCallId: string; prompt: string }
  | { type: "permission-resolved"; id: string; approved: boolean }
  | { type: "error"; message: string; retryable?: boolean }
  | { type: "done"; reason: "stop" | "cancel" | "error" };

export type HarsoTransport = {
  send(input: {
    threadId: string;
    text: string;
    attachments?: readonly CompleteAttachment[];
    signal: AbortSignal;
  }): AsyncIterable<HarsoEvent>;
  decide?(permissionId: string, approved: boolean): Promise<void>;
};
