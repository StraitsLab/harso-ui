> **Phase D — 2026-09-14 current support:** 114 active reference families
> (69 BoardUI + 45 Vercel), 359 part records (328 Vercel), 15 helpers.
> Twelve reference families are retired. `src/chat` is the sole product conversation;
> MessageResponse/Shimmer moved to runtime-free `src/text-effects` with root names intact.
> Agent/trails, Queue, Image, Question and all dashboards remain. The private
> DashboardWorkspace is not a public chat alias. See [Phase D migration](migration.md).
> Original capture counts, hashes, paths, tests and acceptance claims below are a
> **historical pre-retirement snapshot**, not active support or a fresh run.
> External desktop pin/usage migration is NOT verified by kit tests; audit before release.

# Desktop wiring plan — not implemented in Phase A

All desktop paths below are relative to the read-only checkout
`/Volumes/MainData/AgentTools/codex/worktrees/harso-ui-conversation`.
This lane changes no desktop files. Planned adapter/module names are explicitly
marked as planned; existing identifiers were read from the files cited below.

## Integration boundary

Target composition: `KitProvider` → `AssistantRuntimeProvider` →
`HarsoChatShell` with `HarsoThread` as `main` and `HarsoComposer` as `composer`.
Keep the runtime alive for the selected conversation, and isolate/reset it when
the organization or conversation changes. Keep the outer `LivingWorkspace`
navigation in `apps/desktop-shell/src/renderer/App.tsx`; do not duplicate it blindly
inside the shell. Decide whether the shell sidebar is conversation-local navigation
or whether the outer navigation is moved into that slot as a separate migration.

The lane-6 contract is now present in `src/chat/runtime/stream-types.ts`,
`harso-runtime.ts`, and `convert.ts` in the kit. Its verified signature is
`useHarsoRuntime(transport: HarsoTransport, options: HarsoRuntimeOptions = {})`;
options extend `LocalRuntimeOptions` with optional `threadId` and `attachments`.
It returns the result of `useLocalRuntime`, not a `{ runtime, decide }` pair.
The protocol ordering, SSE guidance and keyed-thread lifecycle are documented in
`src/chat/runtime/README.md`, which was read after lane 6 published it.

Do not attach this local runtime to an already externally streamed desktop store
and send twice. Its `HarsoTransport.send` bridge must submit once and yield the
authoritative events for that submission. The desktop runtime continues to own
authentication, submission acceptance, durable history, Live, authorization,
and execution. The spike's `ChatModelAdapter` remains useful for UI tests only.

### Exact stream contract and adapter work

`HARSO_STREAM_VERSION` is `1`. `HarsoTransport.send` accepts
`{ threadId, text, attachments?, signal }` and returns `AsyncIterable<HarsoEvent>`.
Optional `decide(permissionId, approved)` returns `Promise<void>`. Transport
implementations must validate incoming data; the TypeScript union is not runtime
validation of desktop IPC/network input.

| Event in `stream-types.ts` | Concrete desktop bridge responsibility |
| --- | --- |
| `text-delta { text }` | Yield only appended text, not the entire `assistantText` snapshot on every update; detect non-append revisions rather than corrupting the transcript |
| `reasoning-delta { text }` | Yield only genuine reasoning events; `ViewTurnActivity` currently has no reasoning field |
| `tool-call { id, name, args }` | Emit once per tool identity; view-model tool badges have no args, so use authoritative transport data or explicit empty args without claiming output |
| `tool-result { id, result, isError? }` | Match a prior tool-call and preserve actual output; the reducer rejects results for unresolved/denied approvals |
| `permission-request { id, toolCallId, prompt }` | Tie the permission ID to its prior tool call and real server authorization request |
| `permission-resolved { id, approved }` | Emit the acknowledged Boolean decision; denied results stay unexecuted |
| `error { message, retryable? }` | Preserve safe failure text and retryability; do not turn uncertain delivery into a blind resend |
| `done { reason: "stop" / "cancel" / "error" }` | Emit a terminal event; EOF without one is an adapter error; propagate the AbortSignal to the real cancellation path |

`createHarsoAdapter` converts events into cumulative assistant-ui content/status.
`useHarsoRuntime` does not expose that adapter's `decide` method or automatically
call `transport.decide` from a tool. Bind `HarsoToolCall.onDecide` explicitly to
the transport decision callback (only when supported), as an override renderer
in `toolUI`. Never silently approve when `decide` is missing.

`mapHistory(viewTurns: readonly HarsoViewTurn[])` in `convert.ts` accepts the
data portion of `ViewTurnActivity`, not raw `ViewMessage[]`. It emits IDs
`${turn.id}:user` and `${turn.id}:assistant`; pass the result as initial messages
only for an actual turn-history seed. It stores tool states/clarification/waiting/
failure facts under `metadata.custom.harso`, but drops callbacks by design.
Clarifications currently become question text plus metadata, **not a question
tool part**; completed/failed tools use `result: null` as a status marker, not
real output. Keep callbacks in an identity-keyed host map and add a renderer or
conversion step that preserves these facts. Do not send fabricated tool output.

There is no transport pagination, snapshot-replacement, non-Boolean clarification,
Live or submit-acceptance event in version 1. `mapHistory` is not a load-older
adapter. Resolve these contract gaps before desktop cutover rather than claiming
that passing `initialMessages` synchronizes future snapshot changes. Likewise,
send accepts only latest user text/attachments, not branch parent/message IDs;
persisted edit/regenerate branching needs a backend contract extension.

## File-by-file changes

### `packages/ui/src/views/view-model.ts`

Keep product facts and capability gates. Add a typed adapter boundary to the lane-6
contract rather than exposing assistant-ui objects throughout unrelated views.

| Existing input | Mapping to the conversation runtime/UI | Required safeguard |
| --- | --- | --- |
| `ViewMessage` | Stable `id`; `user` → user role, `agent` → assistant role; `body` → text part; preserve `label` and `finalized` metadata | Do not mark every partial Live message complete; preserve the current finalized-only rich-text policy |
| `ViewTurnActivity` | One causally grouped user/assistant turn; `id` anchors reconciliation, `assistantText` updates one text part, `assistantFinal` settles it | Reconcile durable messages with transient activity by authoritative identity; do not duplicate the optimistic user message |
| `ViewToolActivity` | Stable `id` becomes tool-call identity, `name` becomes tool name; `started` → running, `completed` → complete, `failed` → error | These view objects contain no args or result: never manufacture successful output; preserve an explicit status |
| `ViewClarification` | A dedicated question tool renderer registered under an agreed tool name in `HarsoThread.toolUI.by_name` | Not a Boolean approval: preserve question, choices, single/multiple/text mode, pending/resolved/error and callback |
| `ViewHistory` | Adapter history/prepend support plus a history control above the messages | Preserve `hasOlder`, `loading`, `error`, `revision`, and `onLoadOlder`; keep scroll anchor across prepends |
| `ViewComposer` | Runtime draft/send/cancel plus `HarsoComposer` slots | One draft owner, acceptance-aware clearing, disabled explanations, shortcut parity and attachment gating |
| `ViewLive` | Host-owned controls/status in composer slots; Live transcript converted separately | No replacement with browser read-aloud; Live transport, microphone permission and playback recovery remain desktop-owned |

### `packages/ui/src/views/ConversationView.tsx`

1. Replace old `Conversation`, `ConversationContent`, `ConversationScrollButton`,
   `Message`, `KitMessageContent`, `MessageActions` and manual copy state with
   the new shell/thread/messages. The existing `onCopyMessage` callback is an
   integration requirement: new actions do not expose that callback today.
2. Preserve `pending`, `unavailable`, `none`, `waiting`, read-only notice and
   transcript notice as product states. `HarsoThread.empty` alone cannot represent
   all of them; loading/unavailable are not empty conversations.
3. Replace local follow-tail logic only when `ThreadPrimitive.Viewport` is the
   actual scroll owner. The existing `previousHistoryViewport`/`revision` logic
   preserves prepend position; do not delete it until adapter/viewport tests
   establish the same behaviour. Current `HarsoThreadProps` exposes no history
   header, viewport ref or `onLoadOlder` prop (`src/chat/thread.tsx` in the kit).
   Request that seam from its owner; a button outside the scroll area does not
   solve scroll anchoring.
4. Move `TurnActivity` projection into the adapter. Keep `waitingNotice` and
   failure-specific actions: `onRetry` means resend a never-recorded user turn;
   `onDismiss` retires it; `onRefresh` reconciles uncertain durable history.
   These are not interchangeable with `ActionBarPrimitive.Reload`.
5. Adapt existing `ClarificationCard` as the dedicated question tool renderer.
   Keep native `RadioGroup`/`Checkbox` semantics and text input, not the legacy
   `QuestionOption` pressed-button semantics. Route `onRespond` once through the
   existing callback; failures remain retryable, resolved cards stay answered.
   `HarsoApproval` is appropriate only for a genuine Approve/Deny request.
6. Keep contextual `WorkCard` selection and `InspectorOverlay`/focus return until
   a deliberate move into `HarsoChatShell.aside`. Preserve Escape and selected
   work identity. Replacing the entire work inspector is not this migration.

Rich-text parity is a cutover gate: existing `MessageBody` uses `MessageResponse`
only for finalized bodies ≤100,000 characters; drafts/oversized bodies stay plain.
The initial `src/chat/message.tsx` renderer uses `MessagePartPrimitive.Text`, not
that policy. `HarsoMarkdownText` now exists in `src/chat/markdown.tsx`, using
`MarkdownTextPrimitive` with GFM, but does not itself enforce finalized-only or
the 100,000-character limit. Implement/test the policy through `components` or
agree a text-renderer slot with lane 1 before retiring `MessageResponse` here.

### `packages/ui/src/views/Composer.tsx`

- Replace `GlassComposer`/manual textarea/send only after the runtime owns the
  draft. `HarsoComposer` does not currently accept controlled `value`, `onChange`,
  `onSubmit`, `submitShortcut` or arbitrary textarea props. Connect through the
  runtime contract, not an invented component prop.
- Put the native `ViewComposerPicker` select and its status/alert in `leading`:
  retain label, placeholder, disabled options, selected value and `onSelect`.
  These are application/project choices, not assistant-ui model configuration.
- Put Live start/mute/end/enable-audio controls and status in `trailing` or an
  adjacent host region when they cannot fit; preserve diagnostics expansion,
  preview label, call-ceiling note, start-unavailable reason and alert semantics.
- Preserve the existing blocked rule, but distinguish pending submission from an
  active cancellable run: disabling the entire fieldset would also disable Stop.
  Request explicit send-versus-cancel capability handling if the runtime cannot
  express it. Never enable cancelling a durable operation without a supported path.
- Preserve label, `aria-describedby`, error and disabled explanation. `error`
  is an available slot, but the current input has no described-by prop seam.
- Current kit `ComposerPrimitive.Input` hardcodes `submitMode="enter"`. Desktop
  supports `command-enter`, IME protection and Shift+Enter; request shortcut
  configurability and tests before replacing the desktop keyboard handler.
- Keep attachment-unavailable policy until a real attachment adapter is supplied.
  A preview data-URL adapter is not permission to enable desktop file submission.

### `apps/desktop-shell/src/renderer/App.tsx`

`ConversationRoute` already projects `FounderSnapshot` into view types. Adapt at
this boundary (or a small planned adjacent adapter module), using lane-6 exact
types. Preserve the existing organization/conversation activity filter, Work
filter, `transcriptWaiting`, `presentTurnActivity`, collection/auth/read-only gates,
and `liveStartUnavailableReason`. Preserve `live:${role}:${id}` transcript identity.

Keep the `runtimeRef` transport callbacks: `onLoadOlder`, `onClarify`, retry/retire,
refresh, Live controls, and accepted submission. The current submit promise uses
`clearSubmittedDraft(previous, submitted)` so a late acceptance cannot clear a
newer draft. Do not replace that with unconditional composer reset. Do not expose
edit/regenerate/feedback just because a local runtime demo supports them: confirm
the desktop backend persists branches and acknowledges each operation first.

`HarsoThreadList` is runtime-driven, not a plain `items` prop list. Keep desktop
navigation until a runtime thread-list adapter has authoritative list/select/new/
rename/archive/delete support. Preview in-memory threads are not durable history.

## Desktop test update inventory

These exact test names are in `apps/desktop-shell/src/renderer/App.test.tsx`.
Update component/role assertions when wiring changes; preserve the underlying
behaviour assertions. This list is a cutover checklist, not a claim they fail today.

| Current start line | Test name |
| --- | --- |
| 46 | applies the local theme and submit shortcut to the production shell |
| 187 | renders the restored shell without rejected destinations or raw topology |
| 195 | uses explicit collection state and a shared error instead of false emptiness |
| 200 | exposes Live only from the active Conversation composer |
| 206 | labels voice as a preview with its ceiling and refuses the mic with a reason |
| 222 | projects blocked Live audio recovery only in the active conversation |
| 228 | presents an ephemeral clarification after durable conversation messages |
| 234 | maps native activity tools and clarification into one causal presentation group |
| 242 | maps authoritative history, causal recovery, and active Live treatment without prototype copy |
| 250 | holds the first message through activation with a sentence, not a failure |
| 259 | explains a failed first message in a sentence and offers only the safe actions |
| 273 | does not carry the activation wait into a transcript state that never published it |
| 285 | does not render activity from a different conversation |
| 319 | fails closed across cached collection surfaces while preserving a read-only transcript |
| 428 | preserves newer draft content after an accepted submit |

Also rerun the existing shortcut tests at lines 158 and 166 if event routing
changes; navigation tests at 291/297 if navigation moves into the shell; contextual
Work tests at 407/412 if its inspector moves. Add integration checks for history
prepend anchoring, one-shot question/approval responses, stop propagation, stale
events after switching conversations and unsupported action gating. Exact new
tests belong to the desktop migration, not this documentation-only lane.
