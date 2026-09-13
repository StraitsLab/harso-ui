# Phase D breaking conversation retirement

Phase D (2026-09-14) supersedes the Phase A retain-all-exports policy and the
AiProfile/AiImageGeneration out-of-scope policy below. `src/chat` is the sole
product conversation. No legacy compatibility aliases remain. MessageResponse
and Shimmer keep their root export names and move to runtime-free `src/text-effects`.
Agent/trails, Question, Queue, Image, ModelSelector and dashboards remain supported.
The private DashboardWorkspace is not a public chat API.

External desktop usage and dependency pins must be audited before publishing this
breaking kit release. Kit verification is not desktop verification. Download/export,
profile/image templates, native read-aloud host wiring, and model/context/permission
controls have no automatic one-to-one replacement; preserve host ownership and one
draft owner. Use AssistantRuntimeProvider with HarsoThread and HarsoComposer.

## Complete Phase D declaration disposition (91 direct declarations)

| Declaration | Phase D status / replacement |
| --- | --- |
| `Conversation` | DELETE old export; REPLACE surviving chat use with HarsoThread (`src/chat/thread.tsx`) |
| `ConversationContent` | DELETE old export; REPLACE surviving chat use with HarsoThread (`src/chat/thread.tsx`) |
| `ConversationEmptyState` | DELETE old export; REPLACE surviving chat use with HarsoThread.empty |
| `ConversationScrollButton` | DELETE old export; REPLACE surviving chat use with HarsoThread (`src/chat/thread.tsx`) |
| `ConversationText` | DELETE; only retired conversation/starter demo export uses remain. No Harso download API exists; do not imply export parity. |
| `messagesToMarkdown` | DELETE; only retired conversation/starter demo export uses remain. No Harso download API exists; do not imply export parity. |
| `ConversationDownload` | DELETE; only retired conversation/starter demo export uses remain. No Harso download API exists; do not imply export parity. |
| `Message` | DELETE old export; REPLACE surviving chat use with HarsoUserMessage / HarsoAssistantMessage (`src/chat/message.tsx`) |
| `MessageContent` | DELETE old export; REPLACE surviving chat use with retire wrapper; HarsoUserMessage / HarsoAssistantMessage |
| `MessageResponse` | MOVE unchanged to src/text-effects.tsx; export from src/index.ts. Runtime-free sanitized Markdown for activity/work; conversation rendering uses HarsoMarkdownText. |
| `MessageActions` | DELETE old export; REPLACE surviving chat use with HarsoMessageActions (`src/chat/message-actions.tsx`) |
| `MessageAction` | DELETE; REPLACE activity ArtifactAction implementation with IconButton + optional Tooltip from existing primitives/navigation (same label, type=button, ref, disabled and callback contract). Chat actions use HarsoMessageActions. |
| `MessageActionButton` | DELETE old export; REPLACE surviving chat use with retire wrapper; new HarsoMessageActions |
| `MessageBranch` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageBranchContent` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageBranchSelector` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageBranchPrevious` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageBranchNext` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageBranchPage` | DELETE old export; REPLACE surviving chat use with new HarsoMessageActions branch picker |
| `MessageToolbar` | DELETE old export; REPLACE surviving chat use with retire wrapper; new HarsoMessageActions |
| `Suggestions` | DELETE old export; REPLACE surviving chat use with HarsoThread.empty host content |
| `Suggestion` | DELETE old export; REPLACE surviving chat use with HarsoThread.empty host content |
| `Shimmer` | MOVE unchanged to src/text-effects.tsx; export from src/index.ts. Keep generic shimmer API, vercel:shimmer route and reduced-motion/forced-colors behavior. |
| `Composer` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `ComposerAttachments` | DELETE old export; REPLACE surviving chat use with HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) |
| `ComposerLoader` | DELETE old export; REPLACE surviving chat use with retire; runtime send/stop state |
| `ComposerPanelProps` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `ComposerPanel` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `GlassComposer` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `StatusBar` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `AiChatComposerPreview` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `ComposerWithAttachments` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) |
| `ComposerAttachmentStrip` | DELETE old export; REPLACE surviving chat use with HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) |
| `ComposerAttachmentTile` | DELETE old export; REPLACE surviving chat use with HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) |
| `ComposerPermission` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `ComposerChoice` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `PermissionMenuProps` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `PermissionMenu` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `ComposerStatusTab` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `ModelPickerProps` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `ModelPicker` | DELETE unused legacy picker/status API. Future host controls use existing Select/Dropdown/ModelSelector in HarsoComposer.leading/trailing; no one-to-one chat export and no new second permission/draft store. |
| `PromptInputFile` | DELETE old export; REPLACE surviving chat use with retire legacy payload type; adapter boundary |
| `PromptInputMessage` | DELETE old export; REPLACE surviving chat use with retire legacy payload type; adapter boundary |
| `usePromptInputController` | DELETE old export; REPLACE surviving chat use with retire local store; AssistantRuntimeProvider + runtime |
| `useProviderAttachments` | DELETE old export; REPLACE surviving chat use with retire hooks; composer runtime attachments |
| `usePromptInputAttachments` | DELETE old export; REPLACE surviving chat use with retire hooks; composer runtime attachments |
| `usePromptInputReferencedSources` | DELETE old export; REPLACE surviving chat use with retire hook; host context/attachment adapter |
| `PromptInputProps` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps |
| `PromptInput` | DELETE old export; REPLACE surviving chat use with HarsoComposer / HarsoComposerProps |
| `PromptInputProvider` | DELETE old export; REPLACE surviving chat use with retire local store; AssistantRuntimeProvider + runtime |
| `PromptInputTextarea` | DELETE old export; REPLACE surviving chat use with HarsoComposer internal ComposerPrimitive.Input |
| `PromptInputFooter` | DELETE old export; REPLACE surviving chat use with HarsoComposer.leading / trailing |
| `PromptInputTools` | DELETE old export; REPLACE surviving chat use with HarsoComposer.leading / trailing |
| `PromptInputButton` | DELETE old export; REPLACE surviving chat use with HarsoComposer.leading / trailing |
| `PromptInputSubmit` | DELETE old export; REPLACE surviving chat use with HarsoComposer internal Send / Cancel |
| `PromptInputBody` | DELETE old export; REPLACE surviving chat use with retire wrappers; HarsoComposer or adjacent host region |
| `PromptInputHeader` | DELETE old export; REPLACE surviving chat use with retire wrappers; HarsoComposer or adjacent host region |
| `PromptInputSelect` | DELETE old export; REPLACE surviving chat use with retire wrappers; native select in HarsoComposer.leading |
| `PromptInputSelectTrigger` | DELETE old export; REPLACE surviving chat use with retire wrappers; native select in HarsoComposer.leading |
| `PromptInputSelectContent` | DELETE old export; REPLACE surviving chat use with retire wrappers; native select in HarsoComposer.leading |
| `PromptInputSelectItem` | DELETE old export; REPLACE surviving chat use with retire wrappers; native select in HarsoComposer.leading |
| `PromptInputSelectValue` | DELETE old export; REPLACE surviving chat use with retire wrappers; native select in HarsoComposer.leading |
| `PromptInputActionMenu` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host menu in leading / trailing |
| `PromptInputActionMenuTrigger` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host menu in leading / trailing |
| `PromptInputActionMenuContent` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host menu in leading / trailing |
| `PromptInputActionMenuItem` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host menu in leading / trailing |
| `PromptInputActionAddAttachments` | DELETE old export; REPLACE surviving chat use with HarsoComposer internal AddAttachment |
| `PromptInputActionAddScreenshot` | DELETE old export; REPLACE surviving chat use with retire built-in action; host capture control in leading |
| `PromptInputHoverCard` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned contextual UI |
| `PromptInputHoverCardTrigger` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned contextual UI |
| `PromptInputHoverCardContent` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned contextual UI |
| `PromptInputTabsList` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned picker UI |
| `PromptInputTab` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned picker UI |
| `PromptInputTabLabel` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned picker UI |
| `PromptInputTabBody` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned picker UI |
| `PromptInputTabItem` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned picker UI |
| `PromptInputCommand` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandInput` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandList` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandEmpty` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandGroup` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandItem` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `PromptInputCommandSeparator` | DELETE old export; REPLACE surviving chat use with retire chat wrappers; host-owned command picker |
| `AiChatProps` | DELETE public type; MOVE required dashboard section/ref/navigation/status/controlled-panel contract to private DashboardWorkspaceProps; public dashboard props extend that type. Product chat uses HarsoChatShellProps. |
| `AiChat` | DELETE public shell; REPLACE product chat with HarsoChatShell. MOVE only non-conversation layout infrastructure required by dashboards into private DashboardWorkspace in src/dashboard-workspace.tsx (not a public AiChat alias). |
| `AiImageGenerationProps` | DELETE entire shell and API; no direct src/chat equivalent. Profile/image primitives, charts, Image, and agent families remain. Do not recreate this template. |
| `AiImageGeneration` | DELETE entire shell and API; no direct src/chat equivalent. Profile/image primitives, charts, Image, and agent families remain. Do not recreate this template. |
| `AiProfileProps` | DELETE entire shell and API; no direct src/chat equivalent. Profile/image primitives, charts, Image, and agent families remain. Do not recreate this template. |
| `AiProfile` | DELETE entire shell and API; no direct src/chat equivalent. Profile/image primitives, charts, Image, and agent families remain. Do not recreate this template. |
| `ChatStarterProps` | DELETE old export; REPLACE surviving chat use with HarsoChatShell + HarsoThread.empty |
| `ChatStarter` | DELETE old export; REPLACE surviving chat use with HarsoChatShell + HarsoThread.empty |

## Historical Phase A migration snapshot (2026-09-13; not current support)

# Legacy conversation migration map

Snapshot: 2026-09-13, during parallel Phase A implementation. Every declaration
export in the seven requested source files is listed, including types. Re-exports
from `src/agent-surfaces.tsx` are included for completeness; unrelated profile,
image, Agent and Artifact surfaces are explicitly out of conversation scope.

**Retire means stop using it in the new conversation, not delete its public export.**
All legacy APIs remain exported for current desktop consumers. Targets are verified
source-module symbols/slots, not a promise of package-root publication.
See `src/chat/index.ts` and `src/index.ts` before importing.

## Count method

Each reference cell lists `path:count`, where count is the number of matching
lines from `rg -c -w SYMBOL FILE`. Scope is exactly `tests/*.spec.ts` and
`src/*.test.tsx`, not recursive chat tests, desktop tests or `.test.ts` files.
Counts include import lines, type use, JSX and descriptive strings; they are
lexical matches, **not test-case counts or proof of a runtime dependency**. A line
with several uses counts once. `0` means no exact-word match in this scope.

Reproduce for one symbol (a no-match exit status of 1 is expected):

```sh
rg -c -w Message src/*.test.tsx tests/*.spec.ts
rg -n "^export" src/{conversation,composer,prompt-input,agent-surfaces,activity,question,confirmation}.tsx
```

## `src/conversation.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `Conversation` | HarsoThread (`src/chat/thread.tsx`) | Root, viewport and scroll-to-bottom are internal assistant-ui primitives; remove duplicate scroll ownership, subject to history parity. | `tests/boundaryless-chat-starter-readiness.spec.ts:1`; `tests/boundaryless-chat-starter.spec.ts:2`; `src/verification-prior.test.tsx:3`; `tests/boundaryless-conversation-completion.spec.ts:4`; `tests/harso-chat.spec.ts:1`; `tests/boundaryless-kit.spec.ts:3`; `src/conversation.test.tsx:2`; `tests/boundaryless-readiness-workflow.spec.ts:1`; `tests/boundaryless-primitive-variant-matrix.spec.ts:2` |
| `ConversationContent` | HarsoThread (`src/chat/thread.tsx`) | Root, viewport and scroll-to-bottom are internal assistant-ui primitives; remove duplicate scroll ownership, subject to history parity. | `src/verification-prior.test.tsx:2`; `src/conversation.test.tsx:2` |
| `ConversationEmptyState` | HarsoThread.empty | Application supplies empty-state content; loading and unavailable remain distinct host states. | `src/conversation.test.tsx:2` |
| `ConversationScrollButton` | HarsoThread (`src/chat/thread.tsx`) | Root, viewport and scroll-to-bottom are internal assistant-ui primitives; remove duplicate scroll ownership, subject to history parity. | 0 |
| `ConversationText` | retire from the new family; retain host export feature if needed | No chat download/export API exists; do not silently drop a consumer download requirement. | 0 |
| `messagesToMarkdown` | retire from the new family; retain host export feature if needed | No chat download/export API exists; do not silently drop a consumer download requirement. | `src/conversation.test.tsx:2` |
| `ConversationDownload` | retire from the new family; retain host export feature if needed | No chat download/export API exists; do not silently drop a consumer download requirement. | `src/conversation.test.tsx:2` |
| `Message` | HarsoUserMessage / HarsoAssistantMessage (`src/chat/message.tsx`) | Role-specific runtime message components replace the manual from prop. | `tests/boundaryless-ai-chat.spec.ts:8`; `src/composer.test.tsx:2`; `src/verification-prior.test.tsx:2`; `src/verification-ai-developer.test.tsx:3`; `tests/boundaryless-composer-gallery.spec.ts:3`; `tests/boundaryless-ai-consumer-completion.spec.ts:4`; `src/prompt-input.test.tsx:3`; `tests/boundaryless-readiness-workflow.spec.ts:1`; `src/agent-surfaces.test.tsx:2`; `tests/boundaryless-conversation-completion.spec.ts:4`; `tests/boundaryless-kit.spec.ts:3`; `tests/boundaryless-conversation.spec.ts:1`; `src/conversation.test.tsx:2` |
| `MessageContent` | retire wrapper; HarsoUserMessage / HarsoAssistantMessage | Bubble and plain assistant layout are built into the role renderer. | `src/verification-prior.test.tsx:2`; `src/verification-ai-developer.test.tsx:2` |
| `MessageResponse` | HarsoMarkdownText (`src/chat/markdown.tsx`), conditional integration | GFM renderer exists, but initial message defaults use MessagePartPrimitive.Text; legacy sanitization/finalized-body/size policy needs parity tests and message integration. | `src/verification-ai-developer.test.tsx:2`; `src/conversation.test.tsx:2` |
| `MessageActions` | HarsoMessageActions (`src/chat/message-actions.tsx`) | Same spelling, different API: runtime-owned fixed action set, not a generic children container. Lead must resolve the top-level legacy-name collision. | `src/verification-ai-developer.test.tsx:2` |
| `MessageAction` | retire wrapper; new HarsoMessageActions | Actions are internally bound to ActionBarPrimitive; custom callbacks need an explicit integration seam. | `src/verification-ai-developer.test.tsx:2`; `src/conversation.test.tsx:2` |
| `MessageActionButton` | retire wrapper; new HarsoMessageActions | Actions are internally bound to ActionBarPrimitive; custom callbacks need an explicit integration seam. | 0 |
| `MessageBranch` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `src/conversation.test.tsx:3` |
| `MessageBranchContent` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `src/conversation.test.tsx:3` |
| `MessageBranchSelector` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `src/conversation.test.tsx:3` |
| `MessageBranchPrevious` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `src/conversation.test.tsx:3` |
| `MessageBranchNext` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `tests/boundaryless-kit.spec.ts:1`; `src/conversation.test.tsx:3` |
| `MessageBranchPage` | new HarsoMessageActions branch picker | BranchPickerPrimitive and runtime own selection/history; no standalone Harso branch export. | `src/conversation.test.tsx:3` |
| `MessageToolbar` | retire wrapper; new HarsoMessageActions | Actions are internally bound to ActionBarPrimitive; custom callbacks need an explicit integration seam. | `src/verification-ai-developer.test.tsx:2` |
| `Suggestions` | HarsoThread.empty host content | No new suggestion component; wire suggestions through the supported runtime append API, not a second draft store. | `src/conversation.test.tsx:2`; `src/verification-ai-developer.test.tsx:2` |
| `Suggestion` | HarsoThread.empty host content | No new suggestion component; wire suggestions through the supported runtime append API, not a second draft store. | `src/verification-ai-developer.test.tsx:3`; `tests/boundaryless-kit.spec.ts:2`; `src/conversation.test.tsx:2` |
| `Shimmer` | retire conversation shimmer; message in-progress cursor | Streaming text has a runtime-driven cursor; waiting-for-activation copy remains a separate host state. | `tests/boundaryless-readiness-ai.spec.ts:2`; `tests/boundaryless-primitive-variant-matrix.spec.ts:3`; `tests/boundaryless-kit.spec.ts:2`; `src/conversation.test.tsx:2` |

## `src/composer.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `Composer` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | `tests/boundaryless-ai-consumer-completion.spec.ts:4`; `src/verification-foundation.test.tsx:4`; `tests/harso-chat-responsive.spec.ts:1`; `tests/boundaryless-composer-placement.spec.ts:1`; `src/composer.test.tsx:4` |
| `ComposerAttachments` | HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) | Attachment enumeration is internal to composer/message primitives; no parallel attachment state. | 0 |
| `ComposerLoader` | retire; runtime send/stop state | Use real run status; do not simulate progress independently. | `src/composer.test.tsx:6`; `src/verification-foundation.test.tsx:7` |
| `ComposerPanelProps` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | 0 |
| `ComposerPanel` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | `src/composer.test.tsx:22` |
| `GlassComposer` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | `src/composer.test.tsx:3`; `tests/boundaryless-ai-consumer-completion.spec.ts:1`; `src/verification-foundation.test.tsx:2` |
| `StatusBar` | HarsoComposer.leading / trailing | Host supplies model/status facts; no replacement status component. | `src/composer.test.tsx:2`; `src/verification-foundation.test.tsx:2` |
| `AiChatComposerPreview` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | `src/verification-foundation.test.tsx:2` |
| `ComposerWithAttachments` | HarsoComposer / HarsoComposerProps (`src/chat/composer.tsx`) | Replace visual/demo wrapper with runtime composer, not a drop-in prop alias. | `src/composer.test.tsx:4` |
| `ComposerAttachmentStrip` | HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) | Attachment enumeration is internal to composer/message primitives; no parallel attachment state. | 0 |
| `ComposerAttachmentTile` | HarsoComposerAttachment / HarsoMessageAttachment (`src/chat/attachments.tsx`) | Attachment enumeration is internal to composer/message primitives; no parallel attachment state. | `src/composer.test.tsx:16` |
| `ComposerPermission` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | 0 |
| `ComposerChoice` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | 0 |
| `PermissionMenuProps` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | 0 |
| `PermissionMenu` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | `src/composer.test.tsx:4` |
| `ComposerStatusTab` | HarsoComposer.leading / trailing | Host supplies model/status facts; no replacement status component. | `src/composer.test.tsx:4` |
| `ModelPickerProps` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | 0 |
| `ModelPicker` | HarsoComposer.leading / trailing host controls | Existing pickers may remain in slots; per-tool HarsoApproval is not a global permission/model picker. | `src/composer.test.tsx:8` |

## `src/prompt-input.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `PromptInputFile` | retire legacy payload type; adapter boundary | Convert files/messages to the lane-6 contract or assistant-ui attachment/message types; not structurally interchangeable. | `src/readiness-ai.test.tsx:1` |
| `PromptInputMessage` | retire legacy payload type; adapter boundary | Convert files/messages to the lane-6 contract or assistant-ui attachment/message types; not structurally interchangeable. | `tests/boundaryless-kit.spec.ts:3`; `src/readiness-ai.test.tsx:1` |
| `usePromptInputController` | retire local store; AssistantRuntimeProvider + runtime | The family consumes assistant-ui context rather than a second prompt provider. | `src/prompt-input.test.tsx:4` |
| `useProviderAttachments` | retire hooks; composer runtime attachments | AttachmentAdapter and ComposerPrimitive own lifecycle; new attachment tiles render it. | `src/verification-ai-developer.test.tsx:2` |
| `usePromptInputAttachments` | retire hooks; composer runtime attachments | AttachmentAdapter and ComposerPrimitive own lifecycle; new attachment tiles render it. | `src/verification-ai-developer.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `usePromptInputReferencedSources` | retire hook; host context/attachment adapter | No new referenced-source store exists; preserve required source semantics in the adapter. | `tests/boundaryless-kit.spec.ts:1`; `src/verification-ai-developer.test.tsx:2` |
| `PromptInputProps` | HarsoComposer / HarsoComposerProps | Runtime owns draft and submit; controlled legacy input props are not accepted unchanged. | 0 |
| `PromptInput` | HarsoComposer / HarsoComposerProps | Runtime owns draft and submit; controlled legacy input props are not accepted unchanged. | `tests/boundaryless-readiness-ai.spec.ts:2`; `src/verification-ai-developer.test.tsx:7`; `tests/boundaryless-ai-consumer-completion.spec.ts:1`; `src/prompt-input.test.tsx:12`; `src/readiness-ai.test.tsx:2` |
| `PromptInputProvider` | retire local store; AssistantRuntimeProvider + runtime | The family consumes assistant-ui context rather than a second prompt provider. | `src/verification-ai-developer.test.tsx:3`; `src/prompt-input.test.tsx:3` |
| `PromptInputTextarea` | HarsoComposer internal ComposerPrimitive.Input | Use runtime draft; request a prop seam for desktop command-enter and described-by parity. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/verification-ai-developer.test.tsx:3`; `src/prompt-input.test.tsx:7`; `src/verification-foundation.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `PromptInputFooter` | HarsoComposer.leading / trailing | Slots replace generic footer composition; native host buttons must use type=button. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/verification-foundation.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `PromptInputTools` | HarsoComposer.leading / trailing | Slots replace generic footer composition; native host buttons must use type=button. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/readiness-ai.test.tsx:1` |
| `PromptInputButton` | HarsoComposer.leading / trailing | Slots replace generic footer composition; native host buttons must use type=button. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/readiness-ai.test.tsx:1` |
| `PromptInputSubmit` | HarsoComposer internal Send / Cancel | Runtime running state selects send or stop. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/verification-ai-developer.test.tsx:4`; `src/verification-foundation.test.tsx:2`; `src/prompt-input.test.tsx:7`; `src/readiness-ai.test.tsx:1` |
| `PromptInputBody` | retire wrappers; HarsoComposer or adjacent host region | No body/header child slots exist on HarsoComposer; preserve required content outside it. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/readiness-ai.test.tsx:1` |
| `PromptInputHeader` | retire wrappers; HarsoComposer or adjacent host region | No body/header child slots exist on HarsoComposer; preserve required content outside it. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/readiness-ai.test.tsx:1` |
| `PromptInputSelect` | retire wrappers; native select in HarsoComposer.leading | Model/project selection stays application-owned; no new chat select family. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/prompt-input.test.tsx:1` |
| `PromptInputSelectTrigger` | retire wrappers; native select in HarsoComposer.leading | Model/project selection stays application-owned; no new chat select family. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/prompt-input.test.tsx:1` |
| `PromptInputSelectContent` | retire wrappers; native select in HarsoComposer.leading | Model/project selection stays application-owned; no new chat select family. | `src/prompt-input.test.tsx:1`; `tests/boundaryless-readiness-ai.spec.ts:1` |
| `PromptInputSelectItem` | retire wrappers; native select in HarsoComposer.leading | Model/project selection stays application-owned; no new chat select family. | `tests/boundaryless-readiness-ai.spec.ts:3`; `src/prompt-input.test.tsx:1` |
| `PromptInputSelectValue` | retire wrappers; native select in HarsoComposer.leading | Model/project selection stays application-owned; no new chat select family. | `tests/boundaryless-readiness-ai.spec.ts:1`; `src/prompt-input.test.tsx:1` |
| `PromptInputActionMenu` | retire chat wrappers; host menu in leading / trailing | No new action-menu API; retain existing accessible host controls when needed. | `tests/boundaryless-readiness-ai.spec.ts:1` |
| `PromptInputActionMenuTrigger` | retire chat wrappers; host menu in leading / trailing | No new action-menu API; retain existing accessible host controls when needed. | `tests/boundaryless-readiness-ai.spec.ts:1` |
| `PromptInputActionMenuContent` | retire chat wrappers; host menu in leading / trailing | No new action-menu API; retain existing accessible host controls when needed. | `tests/boundaryless-readiness-ai.spec.ts:1` |
| `PromptInputActionMenuItem` | retire chat wrappers; host menu in leading / trailing | No new action-menu API; retain existing accessible host controls when needed. | `tests/boundaryless-readiness-ai.spec.ts:1` |
| `PromptInputActionAddAttachments` | HarsoComposer internal AddAttachment | Availability depends on the attachment adapter. | `src/prompt-input.test.tsx:6`; `src/readiness-ai.test.tsx:1` |
| `PromptInputActionAddScreenshot` | retire built-in action; host capture control in leading | No chat screenshot capture API; keep capture/permission in the host and add through its attachment adapter. | `src/prompt-input.test.tsx:2` |
| `PromptInputHoverCard` | retire chat wrappers; host-owned contextual UI | No replacement hover-card API; keep nonessential explanation separate from composer behaviour. | `src/verification-ai-developer.test.tsx:2`; `tests/boundaryless-citation-consumer.spec.ts:1` |
| `PromptInputHoverCardTrigger` | retire chat wrappers; host-owned contextual UI | No replacement hover-card API; keep nonessential explanation separate from composer behaviour. | `src/verification-ai-developer.test.tsx:2`; `tests/boundaryless-citation-consumer.spec.ts:1` |
| `PromptInputHoverCardContent` | retire chat wrappers; host-owned contextual UI | No replacement hover-card API; keep nonessential explanation separate from composer behaviour. | `src/verification-ai-developer.test.tsx:2`; `tests/boundaryless-citation-consumer.spec.ts:1` |
| `PromptInputTabsList` | retire chat wrappers; host-owned picker UI | No tab store in the new composer; do not recreate one for an unused control. | `src/prompt-input.test.tsx:1`; `src/readiness-ai.test.tsx:2` |
| `PromptInputTab` | retire chat wrappers; host-owned picker UI | No tab store in the new composer; do not recreate one for an unused control. | `src/prompt-input.test.tsx:1`; `src/readiness-ai.test.tsx:3` |
| `PromptInputTabLabel` | retire chat wrappers; host-owned picker UI | No tab store in the new composer; do not recreate one for an unused control. | `src/readiness-ai.test.tsx:2` |
| `PromptInputTabBody` | retire chat wrappers; host-owned picker UI | No tab store in the new composer; do not recreate one for an unused control. | `src/prompt-input.test.tsx:1` |
| `PromptInputTabItem` | retire chat wrappers; host-owned picker UI | No tab store in the new composer; do not recreate one for an unused control. | `src/prompt-input.test.tsx:1` |
| `PromptInputCommand` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:2`; `src/readiness-ai.test.tsx:2` |
| `PromptInputCommandInput` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `PromptInputCommandList` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `PromptInputCommandEmpty` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:1` |
| `PromptInputCommandGroup` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:2` |
| `PromptInputCommandItem` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/prompt-input.test.tsx:2`; `src/readiness-ai.test.tsx:1` |
| `PromptInputCommandSeparator` | retire chat wrappers; host-owned command picker | No command palette in the new family; retain existing search/accessibility behaviour if a consumer needs it. | `src/readiness-ai.test.tsx:1` |

## `src/agent-surfaces.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `AiChatProps` | HarsoChatShell / HarsoChatShellProps (`src/chat/shell.tsx`) | navigation→sidebar, actions→actions, composer→composer, panel→aside, children→main; status and panel controls need host placement. | 0 |
| `AiChat` | HarsoChatShell / HarsoChatShellProps (`src/chat/shell.tsx`) | navigation→sidebar, actions→actions, composer→composer, panel→aside, children→main; status and panel controls need host placement. | `tests/boundaryless-ai-consumer-completion.spec.ts:2`; `src/agent-surfaces.test.tsx:8`; `tests/boundaryless-image-readiness.spec.ts:2` |
| `AiImageGenerationProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AiImageGeneration` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/agent-surfaces.test.tsx:10` |
| `AiProfileProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AiProfile` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/agent-surfaces.test.tsx:6` |
| `ChatStarterProps` | HarsoChatShell + HarsoThread.empty | Conversation welcome belongs in empty; dashboard/auth/team/user navigation remain application-owned. | 0 |
| `ChatStarter` | HarsoChatShell + HarsoThread.empty | Conversation welcome belongs in empty; dashboard/auth/team/user navigation remain application-owned. | `src/agent-surfaces.test.tsx:9` |
| `AgentLimitsCard` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/agent-surfaces.test.tsx:2`; `src/agent-limits.test.tsx:20` |
| `AgentProgress` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/agent-progress.test.tsx:31`; `src/agent-surfaces.test.tsx:2` |
| `AgentProgressProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AgentThinking` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/agent-surfaces.test.tsx:2`; `src/agent-thinking.test.tsx:29` |
| `AgentThinkingProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `TaskList` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-prior.test.tsx:6`; `tests/boundaryless-trail-lifecycle-completion.spec.ts:3`; `src/agent-surfaces.test.tsx:2`; `src/agent-trails.test.tsx:26` |
| `WebSearch` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `tests/boundaryless-trail-lifecycle-completion.spec.ts:4`; `src/agent-surfaces.test.tsx:2`; `src/agent-trails.test.tsx:24`; `src/verification-prior.test.tsx:11` |
| `TaskListProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AgentTrailTask` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AgentTrailStep` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `WebSearchProps` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `WebSearchResult` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `WebSearchStep` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `WebSearchSource` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |

## `src/activity.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `JsonValue` | HarsoToolCallProps (`src/chat/tool-call.tsx`) at adapter boundary | Tool input/output become args/result; ReactNode output is not a transport payload. | 0 |
| `ToolState` | HarsoToolStateName | Map explicit old states; new statuses are not string-compatible (see table below). | `src/activity.test.tsx:2` |
| `ToolPart` | HarsoToolCallProps (`src/chat/tool-call.tsx`) at adapter boundary | Tool input/output become args/result; ReactNode output is not a transport payload. | `src/verification-ai-developer.test.tsx:7` |
| `getStatusBadge` | HarsoToolState | Component accepts a normalized state prop; old arbitrary-string fallback is not preserved automatically. | `src/activity.test.tsx:2` |
| `Tool` | HarsoToolCall; HarsoTerminalTool / HarsoReadFileTool for named tools | Card owns native disclosure, name/status, escaped args/result and approval UI; no standalone header/body parts. | `src/verification-ai-developer.test.tsx:2`; `tests/boundaryless-activity.spec.ts:6`; `tests/boundaryless-content-completion.spec.ts:1`; `tests/boundaryless-readiness-gallery.spec.ts:1`; `src/activity.test.tsx:3` |
| `ToolHeader` | HarsoToolCall; HarsoTerminalTool / HarsoReadFileTool for named tools | Card owns native disclosure, name/status, escaped args/result and approval UI; no standalone header/body parts. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:3` |
| `ToolContent` | HarsoToolCall; HarsoTerminalTool / HarsoReadFileTool for named tools | Card owns native disclosure, name/status, escaped args/result and approval UI; no standalone header/body parts. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:3` |
| `ToolInput` | HarsoToolCall; HarsoTerminalTool / HarsoReadFileTool for named tools | Card owns native disclosure, name/status, escaped args/result and approval UI; no standalone header/body parts. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:4` |
| `ToolOutput` | HarsoToolCall; HarsoTerminalTool / HarsoReadFileTool for named tools | Card owns native disclosure, name/status, escaped args/result and approval UI; no standalone header/body parts. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:3` |
| `Agent` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `tests/boundaryless-agent-trails.spec.ts:5`; `src/activity.test.tsx:2`; `tests/boundaryless-web-search-marks.spec.ts:2`; `tests/boundaryless-motion-completion.spec.ts:1` |
| `AgentHeader` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:2` |
| `AgentContent` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:2` |
| `AgentInstructions` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:2` |
| `AgentTools` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:6` |
| `AgentToolDescriptor` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | 0 |
| `AgentTool` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:6` |
| `AgentOutput` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:2` |
| `Artifact` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:4`; `tests/boundaryless-activity.spec.ts:1`; `tests/boundaryless-content-completion.spec.ts:2`; `src/activity.test.tsx:2` |
| `ArtifactHeader` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `ArtifactTitle` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `ArtifactDescription` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `ArtifactActions` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `ArtifactAction` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `ArtifactClose` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:2` |
| `ArtifactContent` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:2` |
| `Sources` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-charts-templates.test.tsx:2`; `src/verification-ai-developer.test.tsx:5`; `tests/boundaryless-agent-trails.spec.ts:2`; `tests/boundaryless-navigation.spec.ts:2`; `tests/boundaryless-sources-lifecycle.spec.ts:2`; `tests/boundaryless-navigation-completion.spec.ts:5`; `src/navigation.test.tsx:2`; `src/controls.test.tsx:3`; `src/agent-trails.test.tsx:9`; `tests/boundaryless-readiness-workflow.spec.ts:2`; `tests/boundaryless-readiness-foundation.spec.ts:1`; `tests/boundaryless-data.spec.ts:3`; `src/verification-foundation.test.tsx:9`; `tests/boundaryless-citation-consumer.spec.ts:1`; `src/chart-cards.test.tsx:2`; `tests/boundaryless-simple-lifecycle-completion.spec.ts:11`; `src/navigation-surfaces.test.tsx:2`; `src/activity.test.tsx:4` |
| `SourcesTrigger` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/activity.test.tsx:3`; `src/verification-ai-developer.test.tsx:2` |
| `SourcesContent` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/activity.test.tsx:3` |
| `Source` | retire from conversation scope; retain existing export elsewhere | This Agent/Artifact/profile/image/trail surface is outside the conversation migration; no src/chat equivalent is claimed. | `src/verification-ai-developer.test.tsx:2`; `src/verification-charts-templates.test.tsx:1`; `src/sandbox.test.tsx:2`; `tests/boundaryless-sources-lifecycle.spec.ts:1`; `src/jsx-preview.test.tsx:2`; `tests/boundaryless-simple-lifecycle-completion.spec.ts:3`; `src/chart-cards.test.tsx:4`; `src/activity.test.tsx:2`; `tests/boundaryless-sankey.spec.ts:3`; `tests/boundaryless-dashboard-readiness.spec.ts:3`; `src/data.test.tsx:1`; `src/chain-of-thought.test.tsx:2`; `src/code-block.test.tsx:2` |

## `src/question.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `QuestionValue` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `src/verification-prior.test.tsx:8` |
| `Question` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `tests/boundaryless-api-actions.spec.ts:2`; `src/verification-prior.test.tsx:6`; `tests/boundaryless-ai-consumer-completion.spec.ts:16`; `src/question-queue.test.tsx:3`; `tests/boundaryless-kit.spec.ts:1`; `src/question.test.tsx:8` |
| `QuestionPrompt` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `tests/boundaryless-ai-consumer-completion.spec.ts:1` |
| `QuestionDescription` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | 0 |
| `QuestionOptions` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `tests/boundaryless-ai-consumer-completion.spec.ts:1` |
| `QuestionOption` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `tests/boundaryless-ai-consumer-completion.spec.ts:1`; `src/question-queue.test.tsx:2`; `src/question.test.tsx:4` |
| `QuestionInput` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `src/verification-prior.test.tsx:5`; `tests/boundaryless-ai-consumer-completion.spec.ts:1`; `src/question.test.tsx:6` |
| `QuestionActions` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | 0 |
| `QuestionSubmit` | retire built-in conversation form; custom question tool through HarsoThread.toolUI.by_name | No HarsoQuestion export. Preserve single/multiple/text responses and pending/error/resolved semantics; Boolean HarsoApproval is insufficient. | `tests/boundaryless-ai-consumer-completion.spec.ts:1`; `src/verification-prior.test.tsx:5`; `src/question-queue.test.tsx:2`; `src/question.test.tsx:6` |

## `src/confirmation.tsx`

| Old export | New equivalent / disposition | Reason | Test/spec matching lines |
| --- | --- | --- | --- |
| `ConfirmationProps` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | 0 |
| `Confirmation` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/confirmation.test.tsx:4`; `src/readiness-ai.test.tsx:3` |
| `ConfirmationTitle` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/readiness-ai.test.tsx:2`; `src/confirmation.test.tsx:2` |
| `ConfirmationRequest` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/confirmation.test.tsx:3`; `src/readiness-ai.test.tsx:2` |
| `ConfirmationAccepted` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/readiness-ai.test.tsx:2`; `src/confirmation.test.tsx:3` |
| `ConfirmationRejected` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/confirmation.test.tsx:2`; `src/readiness-ai.test.tsx:2` |
| `ConfirmationActions` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/readiness-ai.test.tsx:2`; `src/confirmation.test.tsx:3` |
| `ConfirmationAction` | HarsoApproval / HarsoApprovalProps (`src/chat/approval.tsx`) | approval.id is required by the assistant-ui shape; prompt/resolution and onDecide replace compositional state children. No arbitrary action slot. | `src/confirmation.test.tsx:3`; `src/readiness-ai.test.tsx:2` |

## State translation and cutover gates

Inventory: **151 exports** across the seven modules.

| Old tool state (`src/activity.tsx`) | New presentation | Runtime conversion requirement |
| --- | --- | --- |
| input-streaming | running | Preserve partial args / running status |
| input-available | running | Args are available but execution has not completed |
| approval-requested | awaiting approval | Supply an unresolved approval with stable ID |
| approval-responded | running, denied, or completed | Inspect approved/result/status; a decision alone is not execution success |
| output-available | completed | Supply actual result and settled status |
| output-error | failed | Preserve isError/error status and failure details |
| output-denied | denied | Preserve approval.approved=false; never execute as a fallback |
| unknown string | no direct equivalent | Validate at adapter boundary; do not cast to a successful state |

`HarsoToolStateName` currently spells the awaiting state `"awaiting approval"`,
not `"awaiting"`; see `src/chat/tool-call.tsx`. The normalization above is a
migration plan, not an existing exported conversion helper.

Before cutting over, test Markdown/sanitization parity, acceptance-aware draft
clearing, authoritative pagination anchoring, question accessibility and response
shape, custom copy callback, backend edit/branch support, attachment permissions,
and command-enter shortcuts. Do not delete old tests merely because an exact
replacement export does not exist. Desktop-specific tests and file-by-file work
are listed in `docs/chat/desktop-wiring.md`.
