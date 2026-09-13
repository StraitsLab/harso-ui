# Harso conversation family — Phase A

The approved decision is additive: assistant-ui 0.15.19 supplies conversation
behaviour; Harso tokens and plain CSS supply the skin. The legacy exports remain
available. This is not a desktop migration or a new backend.

## Sources and publication boundary

- Family barrel: `src/chat/index.ts`; implementation: `src/chat/*.tsx` and `*.css`.
- Package entry: `src/index.ts`; package export map: `package.json`. The lead owns
  publishing the family there. Do not assume `@harso/ui/chat` is a package subpath.
- Approved spike, read-only: `/Volumes/MainData/Developer/products/harso-ui-spike/app/src/main.tsx`,
  `src/runtime.ts`, and `src/styles.css` under the same spike app directory.
  Its adapter is a simulation, not a desktop transport; its approval callback
  resolves an in-memory promise and never launches the sample command.
- Upstream structural reference: `/Volumes/MainData/Developer/products/harso-ui-spike/ref-assistant-ui/packages/ui/src/components/react/assistant-ui/elements/`.
  The kit does not need the reference's Tailwind/shadcn skin or the spike's Lucide icons.

## Behaviour ownership

| Family source | assistant-ui used | Harso/application responsibility |
| --- | --- | --- |
| `src/chat/thread.tsx` | `ThreadPrimitive.Root`, `Viewport`, `Empty`, `Messages`, `ScrollToBottom` | Transcript layout, empty state, message component selection |
| `src/chat/message.tsx` | `MessagePrimitive.Root`, `Parts`, `Attachments`; `MessagePartPrimitive.Text`, `InProgress`; `ComposerPrimitive.Root`, `Input`, `Cancel`, `Send` | User/assistant presentation, text cursor, component slots, edit copy |
| `src/chat/message-actions.tsx` | `ActionBarPrimitive.Root`, `Copy`, `Edit`, `FeedbackPositive`, `FeedbackNegative`, `Reload`, `Speak`, `StopSpeaking`; `BranchPickerPrimitive.Root`, `Previous`, `Number`, `Count`, `Next` | Phosphor icons, labels/tooltips, responsive visibility; adapters must support enabled actions |
| `src/chat/composer.tsx` | `ComposerPrimitive.AttachmentDropzone`, `Root`, `Attachments`, `Input`, `AddAttachment`, `Cancel`, `Send` | Token styling and footer/error slots; adapter owns attachment transport |
| `src/chat/attachments.tsx` | `AttachmentPrimitive.Root`, `Name`, `Remove`; `useAuiState` | Image/file thumbnail, size and failure display |
| `src/chat/tool-call.tsx`, `approval.tsx` | `ToolCallMessagePartProps`, including `respondToApproval` | Tool rendering, status derivation, pending/error UI and callback override; authorization/execution stays in transport |
| `src/chat/reasoning.tsx`, `error.tsx` | `MessagePartPrimitive.Text`, `useAuiState`, `ActionBarPrimitive.Reload` | Native details disclosure, failure and cancelled-run copy |
| `src/chat/thread-list.tsx` | `ThreadListPrimitive.Root`, `New`, `Items`; `ThreadListItemPrimitive.Root`, `Trigger`, `Title`, `Archive`, `Delete`; `useAui` rename | Date grouping, inline rename and deletion confirmation; persistence belongs to adapter |
| `src/chat/shell.tsx` | None directly | Layout, native dialog sheets and focus restoration |
| `src/chat/markdown.tsx`, `code-block.tsx` | `MarkdownTextPrimitive` from `@assistant-ui/react-markdown` | GFM element skin and code-block presentation; desktop finalized/size policy is separate |
| `src/chat/runtime/harso-runtime.ts`, `convert.ts`, `stream-types.ts` | `useLocalRuntime`, `ChatModelAdapter` and message/attachment types | Version-1 event conversion, transport cancellation, history projection and scripted transport; no backend implementation |

Mount runtime-aware components beneath `AssistantRuntimeProvider`. For local
examples, `useLocalRuntime` with a `ChatModelAdapter` is the verified pattern in
`preview/chat-thread-example.tsx`; use an attachment/feedback/speech adapter only
when the host supports that capability. Harso CSS needs a `.harso-kit` ancestor
(normally `KitProvider`); `HarsoChatShell` does not establish a runtime or theme.

## Composition and slots

| Component | Verified public slots/options | Source |
| --- | --- | --- |
| `HarsoChatShell` | Required `sidebar`; optional `header`, `title`, `actions`, `themeToggle`, `main` (falls back to children), `composer`, `aside` | `src/chat/shell.tsx` |
| `HarsoThread` | `composer`, `empty`, `components.UserMessage`, `components.AssistantMessage`, `components.EditComposer`; message slots below | `src/chat/thread.tsx` |
| `HarsoMessageSlots` | `assistantName`, `toolUI.by_name`, `toolUI.Fallback`, `reasoning`, `error`, `attachment` | `src/chat/message.tsx` |
| `HarsoComposer` | `leading`, `trailing`, `error`, `disabled`, `placeholder`, `aria-label`, `className` | `src/chat/composer.tsx` |
| `HarsoThreadList` | `groupBy` returning `Today`, `Yesterday`, or `Earlier` | `src/chat/thread-list.tsx` |
| `HarsoApproval` | `approval`, required `onDecide(id, approved)`; errors keep the choice retryable | `src/chat/approval.tsx` |

Explicitly pass `toolUI={harsoToolComponents}`, `reasoning={HarsoReasoning}`,
`error={HarsoMessageError}`, and `attachment={HarsoMessageAttachment}` to the
thread to select those family renderers. A tool-specific renderer goes in
`toolUI.by_name`; it receives assistant-ui tool part props, not a desktop view model.
Use `components` for a completely custom message/edit renderer.

Choose exactly one composer placement: `HarsoThread.composer` inside its thread
root, or `HarsoChatShell.composer` outside the thread but inside the same runtime
provider. Do not nest two providers with different active conversations.

## Token and layout contract

Do not edit `src/theme.css`. New selectors are scoped below `.harso-kit` and use
the `hkc-` prefix; preserve primitive-generated `data-*` attributes.

- Typography: `--hk-text-xs` 12, `sm/label` 13, `base` 14, `md/body` 15,
  `user` 16, `title` 20, `heading` 24. Assistant body is 15px/1.6;
  user bubble text is 16px with a 13px tertiary speaker label.
- Surfaces: `--hk-canvas`, `--hk-panel`, `--hk-surface`, `--hk-hover`;
  borders: `--hk-line`, `--hk-line-strong`; primary fill: `--hk-dark`.
- Ink: `--hk-ink`, `--hk-secondary`, `--hk-tertiary`, `--hk-faint`.
  Accent and positive/attention/negative text tokens are distinct from their
  `-mark` decoration variants. Use text tokens for readable status text.
- Spacing: `--hk-space-1..16`; radii: `--hk-radius-pill`, `--hk-radius-card`;
  floating surfaces use the one `--hk-shadow`. Approved bubble/composer radius
  is 16px, tool card radius 12px; user bubble max-width is 78%.
- Shell: its measured container is phone at ≤640px, tablet at 641–1023px,
  desktop at ≥1024px (`src/chat/shell.tsx`, `shell.css`). Tablet has a navigation
  rail; phone/tablet open navigation/context as native dialog sheets.
- Action-bar contract: hover reveal at ≥1024px container width; visible below;
  ≤640px targets are 44px. Composer phone contract: sticky, full-bleed,
  `max(12px, env(safe-area-inset-bottom))` bottom padding and 16px input text.
  These are acceptance criteria, not a substitute for screenshots.

## Gallery and verification

`preview/chat-catalog.ts` supplies `chatCatalog`, an immutable metadata array with
`id`, `name`, `description`, and `exports`. It deliberately imports no components.
The lead must register these IDs and their example renderers in `preview/Library.tsx`;
metadata alone does not make a route executable. Existing hash parsing is in
`selectionFromHash` in that file.

Once registered, visit the running gallery at `http://127.0.0.1:4194/#harso:chat-thread`,
`#harso:chat-composer`, `#harso:chat-parts`, `#harso:chat-markdown`, and `#harso:chat-shell`.
Use the gallery's appearance control for light/dark and its phone/tablet viewport
control (hash suffix `?vw=phone` or `?vw=tablet`) for constrained-container checks.
Confirm the heading/rendered example, not just the hash: unregistered IDs fall back
to another catalog entry. Do not start another server on 4194, 4186, or 4198.

| Registry ID | Example export | Source for lead wiring |
| --- | --- | --- |
| `harso:chat-thread` | `ChatThreadExample` | `preview/chat-thread-example.tsx` |
| `harso:chat-composer` | `ChatComposerExample` | `preview/chat-composer-example.tsx` |
| `harso:chat-parts` | `ChatPartsExample` | `preview/chat-parts-example.tsx` |
| `harso:chat-markdown` | `ChatMarkdownExample` | `preview/chat-markdown-example.tsx` |
| `harso:chat-shell` | `ChatShellExample` | `preview/chat-shell-example.tsx` |

```sh
./node_modules/.bin/tsc --noEmit -p tsconfig.json
./node_modules/.bin/tsc --noEmit -p tsconfig.preview.json
npm test -- --reporter=dot
```

Family tests live beside components in `src/chat/*.test.tsx`. Existing legacy
references and reproducible grep counts are in `docs/chat/migration.md`.
The concrete desktop integration work and missing parity are in
`docs/chat/desktop-wiring.md`. No legacy removal is authorized by these documents.

The exact version-1 event protocol and transport lifecycle are documented in
`src/chat/runtime/README.md`. `useHarsoRuntime` takes a stable `HarsoTransport`
and options including `threadId`, `initialMessages`, and an attachment adapter;
it returns the assistant-ui runtime. `mapHistory` projects turn data, not live
pagination. Boolean permission decisions require an explicit tool-renderer
callback to `transport.decide`; question answers and Live remain host concerns.
