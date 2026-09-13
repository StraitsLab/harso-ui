# Harso runtime — stream v1
`HARSO_STREAM_VERSION = 1` versions the `HarsoEvent` union; negotiate it before streaming.
`send({ threadId, text, attachments?, signal })` returns one ordered async event stream.
Text/reasoning deltas append; adjacent same-kind deltas coalesce, never across tools.
Tool calls carry unique IDs, names and JSON-object args; results reference prior calls.
Permission IDs are unique per run: request after tool-call, resolve before tool-result.
Awaiting approval stays on the live stream, represented by the tool's `approval` field.
`decide(id, approved)` submits a decision; only a resolution event updates the transcript.
Denial records an error result without executing the tool. Do not send its result later.
`error` is terminal, retaining its message and optional retryability in custom metadata.
`done` is terminal: stop → complete, cancel → incomplete/cancelled, error → incomplete/error.
EOF without a terminal event is an error; terminal events cancel pending approvals.

```tsx
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { HarsoThread, useHarsoRuntime, mapHistory } from "./chat";

function Conversation({ transport, threadId, turns, attachments }) {
  const runtime = useHarsoRuntime(transport, {
    threadId, initialMessages: mapHistory(turns), attachments,
  });
  return <AssistantRuntimeProvider runtime={runtime}><HarsoThread /></AssistantRuntimeProvider>;
}
```

Keep transport identity stable; mount a keyed Conversation per desktop thread.
Pass `onDecide={(id, approved) => transport.decide(id, approved)}` to your tool renderer.
`createHarsoAdapter(transport, { threadId })` also exposes a bound, rejecting `decide`.
Without an explicit ID, the adapter uses assistant-ui's thread ID or a local UUID.
`mapHistory` preserves stable IDs, tool states and clarification data in `metadata.custom.harso`.
History lacks tool args/results/chronology: tools precede text; null marks known completion.
Nonfinal history is incomplete, not a revived stream; callbacks are not serialized.
`createScriptedTransport(scripts)` consumes one script per send, without timers.
Requests wait for `decide` and emit resolution, unless resolution is already scripted.

An SSE client must validate version, event types and payloads before yielding `HarsoEvent`.
Decode UTF-8 incrementally, buffer split SSE frames, and preserve event order/IDs.
Forward AbortSignal to fetch/readers; cancel readers and remove listeners in finally.
POST decisions to the server; await server resolution events, never execute tools locally.
Do not replay partial streams blindly: reconcile IDs/history before retrying a send.
