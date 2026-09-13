> **Phase D — 2026-09-14 current support:** 114 active reference families
> (69 BoardUI + 45 Vercel), 359 part records (328 Vercel), 15 helpers.
> Twelve reference families are retired. `src/chat` is the sole product conversation;
> MessageResponse/Shimmer moved to runtime-free `src/text-effects` with root names intact.
> Agent/trails, Queue, Image, Question and all dashboards remain. The private
> DashboardWorkspace is not a public chat alias. See [Phase D migration](chat/migration.md).
> Original capture counts, hashes, paths, tests and acceptance claims below are a
> **historical pre-retirement snapshot**, not active support or a fresh run.
> External desktop pin/usage migration is NOT verified by kit tests; audit before release.

## Active reference component list

- `boardui:questionnaire` — `Questionnaire`
- `boardui:activity-rings-card` — `ActivityRingsCard`
- `vercel:agent` — `Agent`
- `boardui:agent-limits-card` — `AgentLimitsCard`
- `boardui:agent-progress` — `AgentProgress`
- `boardui:agent-thinking` — `AgentThinking`
- `boardui:announcement` — `Announcement`
- `boardui:area-chart-card` — `AreaChartCard`
- `vercel:artifact` — `Artifact`
- `vercel:attachments` — `Attachments`
- `vercel:audio-player` — `AudioPlayer`
- `boardui:auth-card` — `AuthCard`
- `boardui:avatar` — `Avatar`
- `boardui:badge` — `Badge`
- `boardui:bar-list-card` — `BarListCard`
- `boardui:breadcrumb` — `Breadcrumb`
- `boardui:button` — `Button`
- `boardui:button-group` — `ButtonGroup`
- `boardui:calendar` — `Calendar`
- `vercel:canvas` — `Canvas`
- `boardui:carousel` — `Carousel`
- `vercel:chain-of-thought` — `ChainOfThought`
- `boardui:checkbox` — `Checkbox`
- `vercel:checkpoint` — `Checkpoint`
- `boardui:chip` — `Chip`
- `boardui:close-button` — `CloseButton`
- `vercel:code-block` — `CodeBlock`
- `boardui:color` — `Color`
- `boardui:combo-chart-card` — `ComboChartCard`
- `vercel:commit` — `Commit`
- `vercel:confirmation` — `Confirmation`
- `vercel:connection` — `Connection`
- `vercel:context` — `Context`
- `boardui:contributions-card` — `ContributionsCard`
- `vercel:controls` — `Controls`
- `boardui:data-table` — `DataTable`
- `boardui:date-picker` — `DatePicker`
- `boardui:divider` — `Separator`
- `boardui:dropdown` — `Dropdown`
- `boardui:earnings-chart-card` — `EarningsChartCard`
- `vercel:edge` — `Edge`
- `vercel:environment-variables` — `EnvironmentVariables`
- `vercel:file-tree` — `FileTree`
- `boardui:file-upload` — `FileUpload`
- `boardui:finance-dashboard` — `FinanceDashboard`
- `boardui:funnel-chart-card` — `FunnelChartCard`
- `boardui:heatmap-chart-card` — `HeatmapChartCard`
- `boardui:home-dashboard` — `HomeDashboard`
- `boardui:hr-management` — `HrManagement`
- `boardui:icon-button` — `IconButton`
- `vercel:image` — `Image`
- `vercel:inline-citation` — `InlineCitation`
- `boardui:input` — `Input`
- `boardui:input-otp` — `InputOtp`
- `vercel:jsx-preview` — `JsxPreview`
- `boardui:line-chart-card` — `LineChartCard`
- `boardui:link-button` — `Link`
- `boardui:marketing-dashboard` — `MarketingDashboard`
- `boardui:medical-profile` — `MedicalProfile`
- `vercel:mic-selector` — `MicSelector`
- `vercel:model-selector` — `ModelSelector`
- `boardui:most-active-days-card` — `MostActiveDaysCard`
- `vercel:node` — `Node`
- `boardui:notification` — `Notification`
- `boardui:notification-center` — `NotificationCenter`
- `vercel:open-in-chat` — `OpenInChat`
- `boardui:orders-chart-card` — `OrdersChartCard`
- `vercel:package-info` — `PackageInfo`
- `boardui:pagination` — `Pagination`
- `vercel:panel` — `Panel`
- `vercel:persona` — `Persona`
- `vercel:plan` — `Plan`
- `vercel:question` — `Question`
- `vercel:queue` — `Queue`
- `boardui:radar-chart-card` — `RadarChartCard`
- `boardui:radial-chart-card` — `RadialChartCard`
- `boardui:radio` — `RadioGroup`
- `vercel:reasoning` — `Reasoning`
- `boardui:revenue-chart-card` — `RevenueChartCard`
- `vercel:sandbox` — `Sandbox`
- `boardui:sankey-chart-card` — `SankeyChartCard`
- `boardui:scatter-chart-card` — `ScatterChartCard`
- `vercel:schema-display` — `SchemaDisplay`
- `boardui:segmented-control` — `SegmentedControl`
- `boardui:select` — `Select`
- `boardui:settings-modal` — `SettingsModal`
- `vercel:shimmer` — `Shimmer`
- `boardui:sidebar` — `Sidebar`
- `boardui:sleep-score-card` — `SleepScoreCard`
- `boardui:slider` — `Slider`
- `vercel:snippet` — `Snippet`
- `boardui:social-button` — `SocialButton`
- `vercel:sources` — `Sources`
- `vercel:speech-input` — `SpeechInput`
- `vercel:stack-trace` — `StackTrace`
- `boardui:stage-bars-card` — `StageBarsCard`
- `boardui:stat-cards` — `StatCards`
- `boardui:steps-card` — `StepsCard`
- `boardui:switch` — `Switch`
- `boardui:table` — `Table`
- `boardui:tabs` — `Tabs`
- `vercel:task` — `Task`
- `boardui:task-list` — `TaskList`
- `vercel:terminal` — `Terminal`
- `vercel:test-results` — `TestResults`
- `boardui:theme-toggle` — `ThemeToggle`
- `vercel:tool` — `Tool`
- `vercel:toolbar` — `Toolbar`
- `boardui:tooltip` — `Tooltip`
- `vercel:transcription` — `Transcription`
- `boardui:typography` — `Typography`
- `vercel:voice-selector` — `VoiceSelector`
- `vercel:web-preview` — `WebPreview`
- `boardui:web-search` — `WebSearch`

## Historical contracts (not the active export list)

# Harso boundaryless UI

## Library candidate — verification in progress

The public BoardUI and pinned AI Elements inventory is a coverage checklist,
not an implementation dependency or a promise of vendor API/pixel parity.
The kit implements original Boundaryless components; Pro is not required.
See `COVERAGE.md` for every family and `coverage.json` for every exact requirement
and its evidence. A rendered example is not proof of all its states.

Theme and business state remain host-owned. The theme foundation supports
System/Light/Dark with Clean/Cozy palettes; the library does not invent progress,
persist conversations, authorize tools, or replace Harso's runtime.

### Native foundation choices

- `Button variant="link"` is a native action button; `Link` is real navigation.
- `Select customizable` progressively enhances a real select with rich native
  options. Use `SelectItem textValue` for a concise selected label and native
  typeahead. Unsupported engines keep the native select fallback; rich rendering
  equivalence across engines is not claimed.
- Grouped `InputOtp` uses one real autofill input and decorative character slots,
  rather than moving focus between separate vendor fields.
- `Slider showValue formatValue` displays the actual supplied/native value in a bubble.
- `SegmentedControl` derives its moving thumb from the native checked control;
  `ThemeToggle` optionally uses native View Transitions. Host refusal is respected
  and reduced motion disables transitions.
- `ComposerLoader active={false}`, `Announcement open={false}` and `Notification open={false}` retain a hidden
  node for native exit transitions, with closed content immediately marked
  `aria-hidden` and `inert`. Hosts that immediately unmount skip the exit.
- Prompt select and action menus reuse the native dropdown popover's visibility,
  focus return and anchoring. Their styling does not reveal closed menus.
- Hover cards preserve hovered content when an endpoint control disables itself,
  restore focus to their trigger, and retain explicit Escape and host refusal.
- Social button treatments use original theme-aware paint, with local installed
  marks supplied by the consumer. Fixed-width examples are host layout, not a
  new authentication flow or a guarantee of provider-brand parity.

### Content and chart boundaries

`ComposerPanel context` accepts host-supplied project/branch/context content above
the editor. `onVoiceRequest` adds a stateless request button; it does not access a
microphone or claim recording. Loading/disabled lock its native controls, while
loading preserves the editor, draft, glass surface and loader DOM. Status text is
opt-in; no status/instructions footer is added by default. Attachment progress
rings only animate finite supplied fractions; absent/nonfinite progress stays
indeterminate. The host owns upload and working completion.

`RadarChartCard` exposes filled/dots/lines/score variants and optional supplied
score/tiles. `RadialChartCard` exposes rings/labels/grid/gauge/solid/stacked layouts.
Their optional built-in controls request changes without overriding controlled
host state. Missing values are not manufactured. Dated activity calendars need
dated records; they do not relabel arbitrary bars as calendar activity.

`JsxPreview` renders trusted React composition, not arbitrary executable strings.
`WebPreview` removes same-origin sandbox capability and supports explicit local
HTML-to-URL navigation. `Image` rejects credential-bearing source URLs. These
guards are not a substitute for host trust policy or full browser security review.

## Persona

`Persona` maps the six reference variant slots (`obsidian`, `mana`, `opal`, `halo`,
`glint`, `command`) to original token-based visuals. The host supplies `state`:
`idle`, `listening`, `thinking`, `speaking`, or `asleep`. It does not infer microphone,
model or tool activity. `size` defaults to128 and is bounded to24–1024; caller styles
and an explicit accessible name remain supported. The visual shrinks to its container.

`paused` pauses CSS motion; the system's reduced-motion preference is followed live.
Asleep stops motion. `onReady` reports DOM-renderer readiness once per mount;
`onPlay` follows animation start/resume, `onPause` follows a playing animation being
paused by the host or system preference, and `onStop` follows stop/unmount. Callback
changes do not restart playback. These are renderer events, not execution events.

**Intentional reference difference:** this implementation uses original DOM/CSS,
not Rive/WebGL or vendor animation files. There is no remote asset to load, fail,
or exhaust a WebGL context. Rive-specific `onLoad`/`onLoadError` and their event
payloads are therefore not implemented or simulated. This is a documented native
replacement, not source-compatible Rive or vendor animation/pixel parity.

## Settings modal

`SettingsModal` is controlled by `isOpen` and `onClose`; the existing `open`
alias remains supported, with `isOpen` taking precedence. Supply your own
trigger. Escape, backdrop and Close request closure without overriding the host.
The body portal traps focus while open and restores the initiating focus on close.
It follows the surrounding kit's resolved mode and palette, including live changes.

General, Profile, Tools and Storage share one modal. `defaultPage` resets on each
opening, not on host updates while browsing. Supply real content through `pages`;
existing `children` fill General when its page slot is absent. No preferences,
identity, connections, storage usage or billing state are fetched or persisted.
General includes original abstract artwork; `planArtSrc` accepts HTTP(S) or a
root-relative image and falls back to that artwork on failure. The gallery exposes
close refusal, initial page selection and failed-image fallback for inspection.

## Questionnaire

`Questionnaire` is an original implementation mapped to the public BoardUI stepped
question reference. Supply `questions` with IDs, prompts, ordered options, optional
`other` (boolean or placeholder object), `stepLabel`, and per-question `select`.
The root `select` defaults to `multiple`; `single` accepts a numbered row and
advances after `advanceDelay` (180ms by default). Digit shortcuts are local to
focus inside the questionnaire and do not intercept free-text editing.

Use `answers`/`onAnswersChange` and `step`/`onStepChange` independently for host
control, or `defaultAnswers`/`defaultStep` for local state. `QuestionnaireAnswers`
is keyed by question ID; values follow declared option order, and `other` is
present only when selected. Typing selects Other. In single mode its nonempty
text waits for Enter or Next; ordinary choices advance only after the answer is
reflected by the host. Controlled navigation refusal does not repeatedly retry.

Step pills and Previous/Next preserve answers; Done calls `onComplete` with all
declared questions. `onDismiss` exposes dismissal; the host removes or hides the
component. `labels` customizes previous/next/complete/other copy. This component
does not persist or send answers. Empty questions show an empty state; duplicate
question IDs or option values show an explicit invalid state. Disabled controls,
reduced motion and focus-on-question-change are Harso safeguards. No required-answer
validation is inferred from the public reference; hosts own submission policy.

The catalogue contains 126 families after the separately evidenced September 7
Questionnaire capture. This is inventory coverage, not whole-library parity proof.

## Shared bar and funnel numeric rendering

### Interactive Area, Line and Combo

`AreaChartCard`, `LineChartCard`, and `ComboChartCard` accept supplied `data`,
`series` keys/labels/formatters and optional `ranges` with their own data. Controlled
`range`/`onRangeChange` requests never override host refusal; a period has no
synthetic data generator or fetch. Area supports `stacked`, `overlap` and `percent`;
`shape` selects `curved` or `sharp`. Combo accepts separate `bar`/`line` definitions
and independently labeled axes. Missing secondary values remain missing, never
copied from the primary series.

Pointer, touch and keyboard point inspection share the same supplied values.
Point buttons support arrows, Home, End and Escape. `disabled`, `loading` and
`error` block interaction; partial/missing data and invalid percentage shares are
identified rather than silently filled. Optional `headline`, `delta`, `format` and
`tiles` customize presentation. Existing `title`/`value`/`caption` and explicit
`children` remain available; custom children replace the default plot.

These three enhanced families do not establish full parity for the other chart
families. Details and exact verification belong to the WEV-1485 candidate receipt.

The default BarList, Orders, StageBars, Steps, MostActiveDays, SleepScore, Earnings
and Revenue renderers now draw primary values against a shared zero baseline.
Zero has no colored height. Fractional values use the actual observed range, and
signed values extend to opposite sides of zero. Normalizing before subtracting
extremes avoids overflow for finite numbers. Unrendered `secondary` values do not
change this primary-only scale; the host must supply another composition to show
a second series. Host domain rules still determine whether signed values make
sense for a particular metric.

Funnel stages require nonnegative finite values, use their actual maximum, and
retain every supplied stage. Zero has zero colored width and no minimum padding.
Invalid or missing values display `Unavailable` rather than a fabricated mark;
empty data displays `No data`. Labels and numeric text live outside colored
geometry, so even zero and tiny values remain readable. Narrow bar plots scroll
with keyboard focus and visible focus indication; the page does not overflow.

These shared defaults are a numeric correctness repair, not proof of full BoardUI
family anatomy, hover/selection behavior or specialized multi-series parity. Those
remain in the complete-library audit. Caller-supplied children still replace the
default plot; other chart families retain their own implementations and obligations.

## CodeBlock composition and highlighting

`CodeBlock` supplies an automatic body when children customize only its header.
An explicit `CodeBlockContent` registers with its nearest block, including when
extracted into a component; nested blocks keep independent bodies. Custom-child
automatic bodies resolve during the browser layout phase, before paint. Server-only
rendering of a custom header does not include that automatic body until hydration;
use explicit Content for server-rendered source. The declared kit consumer is the
React browser preview, not an SSR renderer.

Pinned MIT Shiki4.4.3 provides lazily loaded language tokens, rendered as React text,
never HTML or executable code. Exact source, blank lines and CRLF remain unchanged;
copy uses the original source rather than rendered line numbers. Unknown languages
and failed tokenization retain readable text. Late results cannot replace a newer
code/language pair. Light/Dark token palettes follow KitProvider; forced colors use
system text colors. Grammar assets are split into deferred build chunks.

The language listbox supports selected-option focus, arrows, Home/End, typeahead,
Escape/focus return, outside/Tab dismissal, hidden/disabled-option exclusion and
host-controlled refusal. Root and block disabled states prevent actions. Caller
preventDefault is respected. Clipboard denial remains visible and retryable.

## Medical Profile composition

`MedicalProfile` reuses the controlled workspace shell with `identity`, `steps`,
`sleep`, `calendar`, `activity`, `alerts` and `patients` slots. `title`, `stats`
and `children` remain available; boolean/absent slots do not create landmarks.

Its original host uses fictional profiles and generated sample readings. Profile
selection updates identity and activity; month/day selection updates the inspected
day, sleep breakdown and rings. Step bars have a fixed0–15,000 scale and true zero
height; textual values make every sample inspectable. Scores and goals are
illustrations, not clinical assessments or recommendations. The existing MonthPanel
and ActivityRingsCard supply keyboard date navigation and goal inspection.

Patient search, status/condition filters, sorting, pagination, selection and
admission changes are host-controlled. Alert-read state and saved local report
drafts are keyed by profile; switching profile closes the panel and clears unsaved
fields. Reports support native validation, refusal and cancellation without sending
anything. Explicit loading/empty/error/disabled states and disabled-error retry
refusal accompany the full-width/compact theme previews. Chart and alert surfaces
sit directly on the continuous canvas. No real health records or service is used.

## Marketing Dashboard composition

`MarketingDashboard` reuses `AiChat` navigation, actions and its single controlled
panel. It adds `acquisition`, `spending`, `traffic`, `performance`, `visitors`
and `campaigns` slots alongside `title`, `stats` and `children`. Absent or boolean
slots create no empty landmarks. Data and operations remain host-owned.

The original catalogue host supplies synthetic campaign search, channel/objective/
spend filters, sorting, selection, pagination, delivery updates, and validated
local draft creation with cancellation and refusal. Historical analytics are
explicitly separate from editable campaign rows; attribution uses a disclosed
illustrative split. Funnel counts share the visits denominator; channel allocations
sum to spend; spend and ROAS have separately labelled scales. Zero spend produces
no invented ROAS. Visitor series share a fixed scale and text inspection values.
Loading/empty/error/disabled/disabled-error states, theme combinations, compact
navigation and instance-scoped navigation are exercised in Chrome. No ad account,
budget purchase, network, authentication or persistence is connected.

The preview removes card boundaries within the continuous canvas and allows a
full-width host so expanded and compact layouts can both be inspected. This is
presentation work, not desktop adoption or full-library completion.

## HR Management composition

`HrManagement` reuses the workspace's navigation/actions and single host-owned
panel, adding `recentHires`, `pipeline`, `engagement`, `movement`, `team` and
`employees` slots alongside `title`, `stats` and `children`. False-valued chart
slots do not create empty landmarks. The host owns data and all mutations.

The original example supports synthetic employee add/cancel/refusal, native
field validation, status changes, search and department/status/salary filters,
sorting, selection and pagination. Team counts and recent hires derive from
the roster. Historical movement and survey fixtures are explicitly separate:
movement uses independent people/percentage axes, radar uses a fixed 0–100
scale, and pipeline bars use the application count denominator. Values are
inspectable without interpreting geometry. Disabled team controls preserve
their selected content through a native fieldset. No real HR/payroll system,
network, authentication or persistence is connected.

## Home Dashboard composition

`HomeDashboard` composes `AiChat` navigation/actions/controlled panel with
`breadcrumb`, `search`, `hires`, `earnings`, `revenue`, `contributions` and
`customers` slots. `title`, `stats` and `children` remain supported. All business
state and actions belong to the host; the component neither fetches nor persists.

The original catalogue host supplies synthetic customer operations, derived
period metrics, earnings inspection, contribution data, hire navigation,
notification read state and validated local tickets. Filters, sorting, selection,
pagination and status actions are controlled; refusal leaves state unchanged.
Loading/error/empty/disabled and combined disabled-error scenarios are explicit.
Narrow navigation uses the same right-side panel; it does not duplicate the
desktop sidebar. This is a local presentation candidate, not desktop adoption.

## AI Profile composition

`AiProfile` reuses the workspace shell and its single controlled panel. Supply
`cover`, `avatar`, `contributions`, `activity`, `agents`, and `tokens` slots;
`name`, `description`, and `children` remain supported. `onEdit` and `onShare`
are request callbacks, disabled when absent or when `disabled` is true. Hosts
own editing, sharing, profile selection, panel state and child disabled states.

The catalogue example derives synthetic monthly statistics, a contribution
matrix, daily agent bars and token trend from the same local dataset. It offers
validated editing/cancel, host refusal, explicit text-only clipboard sharing,
day inspection and a daily values table. Narrow agent charts scroll within a
focusable region rather than clipping their date labels. No real profile fetch,
authentication, publishing, persistence or runtime execution is implemented.

Original Harso presentation components, built around one continuous canvas,
quiet controls and deliberate disclosure. The approved reference is the second
concept from Codex thread `01a06fa5-c45f-7492-b59f-9d04528252a5`, image SHA256
`f867f0404dc534985e51e158bc824ba49b7627580fbe5571f2a1e09feeb65b59`.

Design authority: WEV-1423, Linear document
`0b70e04f-d41e-48c6-bb5c-544768928357`. Full library outcome: WEV-1422.
The existing `boardui/` desktop candidate remains separate and unchanged.

## Image-generation workspace — WEV-1468

`AiImageGeneration` composes the existing `AiChat` shell with a generation frame
and optional feedback. It preserves simple `src`, `alt` and `prompt` usage while
accepting shell navigation, composer, status and one contextual panel. Hosts own
`state` (`idle`, `generating`, `complete`, `failed`, `stopped`), `remainingSeconds`,
`error`, `onRetry` and output identity. Only finite nonnegative estimates are
displayed, only while generating; no timer invents progress or completion.
Completion without a supplied image is explicitly unavailable. Failed media is
scoped to its source and cannot override a host's idle/stopped state. A new source
or a host retry through generating resets media presentation.

The original ripple, unfolding frame and mask reveal are CSS, with reduced-motion
alternatives. The gallery uses CSS columns rather than a layout dependency.
The example keeps agent drafts, reference names and generation/history identities
separate. Model/style/aspect/reference metadata is captured on each generation;
manual steps advance synthetic estimates, Stop and Retry are host requests, and
feedback remains per output. Copy uses the existing clipboard primitive with its
confirmation; download buttons only report requests. Gallery supports selection,
prompt reuse and removal, with Escape/close handled by the existing drawer.

All example artwork is original inline SVG; it is not AI-generated output or
vendor artwork. Selected reference files are never read or uploaded—only names
are shown. There is no generation provider, persistence, external navigation,
file download or voice recording. Real integrations remain host responsibilities,
not alternate runtime authorities inside this library.

## Chat Starter composition — WEV-1467

`ChatStarter` reuses `AiChat` rather than providing a second application runtime.
Its `view` selects chat, dashboard, sign-in or sign-up content. The host supplies
`teamMenu`, `userMenu`, `history`, `navigation`, `composer`, `thinking`,
`dashboard`, `signIn` and `signUp`; chat messages are `children`. Composer and
thinking are shown only on the chat route. Existing `suggestions`/`onSelect`
remain supported; absent callbacks and `disabled` make suggestions inert.
The host must propagate disabled state into its supplied slots.

The catalogue demonstrates unread history, rename/delete confirmation, scoped
drafts and pending responses, Stop, Markdown export preview and dashboard metrics.
Deleting the active conversation marks its replacement read only when its chat
is displayed. Team changes deliberately reset the isolated synthetic example;
this is not durable workspace storage. Native sign-in/up forms validate required
fields and password length, then reset on accepted synthetic requests. They do
not authenticate, copy credentials into application state, log credentials or
send them anywhere. Do not enter real credentials into these demonstration forms.

No BoardUI starter transport or localStorage thread implementation is imported.
This template composition does not establish whole-library or desktop readiness.

## AI Chat workspace — WEV-1466

`AiChat` is a presentation template with named `navigation`, `actions`,
`composer`, `status` and `panel` slots; `children` is the conversation content.
It supplies no messages, transport, persistence, model, repository access or
execution. The optional status belongs in the workspace header, not underneath
the composer. The existing title/children composition remains supported.

Navigation collapses without discarding its content. A `panel` contains
`title`, `content` and required `onClose`; it remains open until the host removes
it. Changing panel content updates one panel, never a stack. A native `dialog`
owns dismissal and focus: nonmodal within the grid in wide containers, or modal
at the viewport's right edge when the template is below 900px. Compact drawers
use native top-layer positioning and viewport height rather than an embedded
overlay. Native `cancel` requests host closure without overriding refusal.
Closing restores the opening control when still connected. Outside interaction
does not dismiss the panel; browser-chrome focus remains available while outside
page controls are inert. Native dialog and `closedby` support are required for
this behavior. No custom focus trap or imported desktop styling is required.

The host must reset its panel on conversation changes and supply child disabled
state; the template does not authorize actions or infer tenant/conversation
identity. The synthetic example demonstrates this ownership using FileTree,
Conversation/Message/feedback, Composer with local attachment names and model
selection, manually advanced synthetic responses and stop requests. Drafts and
pending updates are conversation-scoped. Changes and a script-free sandboxed
Browser preview share the drawer. Nothing is fetched, uploaded, saved to
localStorage, applied to a repository or executed by this template.

CodeBlock syntax highlighting remains a separate unfinished library concern;
composing that component does not establish full code-editor parity.

## Compact file hierarchy — WEV-1447

`FileTree`, `FileTreeFolder`, `FileTreeFile`, `FileTreeIcon`, `FileTreeName`
and `FileTreeActions` map the six pinned public FileTree parts. This is an
original presentation API, not a drop-in SDK component or a filesystem client.

```tsx
<FileTree expanded={expanded} onExpandedChange={setExpanded}
  selectedPath={selected} onSelect={setSelected} aria-label="Project files">
  <FileTreeFolder path="src" name="src">
    <FileTreeFile path="src/app.tsx" name="app.tsx"
      actions={<FileTreeActions><Button onClick={inspect}>Inspect</Button></FileTreeActions>} />
  </FileTreeFolder>
</FileTree>
```

- Omit `expanded` for local state, optionally seeded by `defaultExpanded`.
  Supplied sets are never mutated; callbacks receive independent sets.
- Omit `selectedPath` for local selection, optionally seeded by
  `defaultSelectedPath`. Pass `null` for controlled no-selection. Controlled
  requests may be declined. A folder click selects it and requests expansion;
  selection never automatically opens folders or navigates anywhere.
- Native nested lists, disclosure buttons and file buttons use Tab, Enter and
  Space. This is deliberately not an ARIA tree with roving arrow-key focus.
  Existing Plan behavior preserves nested content and restores displaced focus
  on external collapse. Current selection has a checkmark as well as tone.
- `actions` is a sibling slot on files/folders; use `FileTreeActions` there,
  never inside a row's button content. It stops click bubbling and inherits
  root-disabled state via a native disabled fieldset plus inert content. Its
  capture guard also blocks synthetic clicks and the first-legend exception.
  These are interaction rules, not an authorization boundary. Use non-submit buttons.
  File-specific `disabled` disables its selector, not independent actions.
- File `children` replace its icon/name content; only noninteractive content
  belongs there. `icon` overrides default file/folder artwork. String labels
  render as text; React slots and native attributes are trusted host code.
- Paths are unique opaque identities within one root. The host supplies and
  authorizes data; no filesystem IO, fetching, clipboard, execution or storage
  is added. Key the root by project/conversation to reset local state. Empty
  hierarchy copy, loading/errors and actual open-file actions belong to the host.
- This is an unvirtualized supplied hierarchy, not an IDE-scale explorer.
  Narrow, nested, disabled, empty and long-label examples live in the catalogue.

## Authentication media carousel — WEV-1457

`AuthMediaCarousel` accepts host-provided slides, controlled `index` and
`onIndexChange`, or a local `defaultIndex`. Indices are finite, integer and
bounded for display: fractional values truncate and nonfinite values fall back
to the first slide. Removing slides clamps local selection without reviving an
out-of-range selection when content returns. Reconciliation does not emit a
user-change callback; a controlled host can refuse navigation.
Keyed slide elements retain their component identity and draft input state when
preceding slides are removed. Native `aria-label` takes precedence over the
fallback `label` prop.

Only an unmodified arrow, Home or End on the focused carousel itself navigates.
RTL reverses the physical arrow direction; Home and End remain logical first
and last. Descendant inputs, modified shortcuts and caller-cancelled events
are left alone. Boundary requests and active-indicator clicks do not emit
duplicate changes. Dots remain visually small within 28px native buttons with
keyboard and forced-colors focus. There is no autoplay, media fetch or auth
action. The AuthCard catalogue example includes editable synthetic workspace
text to exercise descendant keyboard ownership.

The existing native scrolling `Carousel` remains a separate supported pattern;
it has no controlled-index API. This repair reuses its keyboard ownership and
direction conventions without widening that component or adding a dependency.

## Selector selection contract — WEV-1458

Model, microphone and voice selectors share one selection implementation.
Omit `value` for local state seeded by `defaultValue`; pass a string for
host-controlled selection or `null` for controlled no-selection. A host may
decline `onValueChange`; no optimistic selection replaces its supplied value.
Clicking the selected item is not a value change. Item `onClick` runs before
selection, and `preventDefault()` cancels both local mutation and the callback.
Native buttons expose `aria-pressed`, support Enter/Space and retain visible
focus. Selection also has a weight/edge cue rather than color alone.

Root `disabled` disables option buttons; `readOnly` keeps them focusable but
prevents selection, including requests through `useVoiceSelector().setValue`.
Item-level `disabled` also prevents selection. These are presentation rules,
not an authorization boundary. No host runtime or hardware ownership changes.

WEV-1458 established selection-state coverage only. WEV-1459 adds the lifecycle
and host-device presentation described below; neither is desktop adoption.

## Searchable selectors — WEV-1459

All three roots accept `open`, `defaultOpen`, `onOpenChange`, `search`,
`defaultSearch`, and `onSearchChange`. Omit a controlled prop to use local state.
The host may refuse open/close/search/selection requests independently. Closing
clears only local search; controlled search remains host-owned. Selecting an
enabled item requests closing, including when the selected value is unchanged.
Cancellation or read-only selection keeps the panel open.

Model and Voice content use the installed Radix Dialog for focus containment,
Escape, outside dismissal and focus return. Mic content is nonmodal and aligns
with its trigger, updating on resize/scroll and moving above when needed.
Portals use the trigger's nearest `.harso-kit` to retain appearance/palette.
Provide a trigger when using this themed portal composition. `*Dialog` is an
alternative content part inside its root, not another nested dialog/root.

`*Input` takes native input attributes and a cancelable `onChange`; set its
value through the root's search props, not an independent input controller.
`*Item` accepts `keywords` and `searchValue`; by default its rendered text is
searched. Filtering uses a case-insensitive ordered-subsequence match, preserving
host order rather than adding a ranking system. Groups accept `heading` and hide
when no item matches; `*Empty` appears only with no matches. Disabled matches
remain visible. For host-hidden groups, use `hidden` or inline `display: none` /
`visibility: hidden`; nested groups inherit this flag, and their items leave
navigation and empty-state accounting. Arbitrary stylesheet/media-query hiding
is not observed by the registry; drive the supported `hidden` prop instead.
Arrow keys move between matching enabled choices; Home/End work
on choices but remain text-editing keys in search. Tab, Enter and Space stay
native. These are pressed buttons, not a simulated combobox/listbox.

```tsx
<ModelSelector value={model} onValueChange={setModel}>
  <ModelSelectorTrigger>Choose a model</ModelSelectorTrigger>
  <ModelSelectorContent title="Choose how you work">
    <ModelSelectorInput placeholder="Search models" />
    <ModelSelectorList>
      <ModelSelectorGroup heading="Available">
        <ModelSelectorItem value="balanced" keywords={["writing"]}>
          <ModelSelectorName>Balanced</ModelSelectorName>
        </ModelSelectorItem>
      </ModelSelectorGroup>
      <ModelSelectorEmpty />
    </ModelSelectorList>
  </ModelSelectorContent>
</ModelSelector>
```

### Device and preview ownership

`MicSelector` accepts host-supplied `devices: readonly { deviceId, label }[]`,
`permission: "unknown" | "granted" | "denied"`, `loading`, `error`, and optional
`loadDevices`. `useAudioDevices()` projects that snapshot (also exposing
`hasPermission`); outside a Mic root it reports empty/unknown with no fabricated
refresh function. It never enumerates devices, requests permission, subscribes
to hardware events, or infers permission from labels. The host pushes updated
snapshots on hardware/tenant changes. This intentionally replaces the earlier
automatic helper and differs from Vercel's device runtime, preserving Harso's
single authority rather than providing drop-in vendor behavior.

The optional device action appears explicitly in Mic content. It calls only the
host callback, disables duplicate UI requests while awaiting it, and reports
request rejection without inventing permission/device state. Host loading and
errors are displayed separately. The host must still scope and cancel its own
requests. `MicSelectorList` accepts normal children or a devices render function;
`MicSelectorValue` resolves the supplied selection, falling back to a placeholder.
`MicSelectorLabel device={device}` separates a trailing `(1234:abcd)` hardware
identifier without changing the actual device identity.

Voice metadata parts accept host-rendered labels, not inferred demographics or
downloaded flag artwork. Provider logo parts likewise render host content; they
never fetch remote provider images. `VoiceSelectorPreview` is a sibling action
(never nested inside an item), accepts `playing`, `loading`, `onPlay`, and native
button props, and performs no playback itself. `onClick.preventDefault()` cancels
`onPlay`. `useVoiceSelector` exposes value/setValue/open/setOpen and requires a
selector context rather than returning silent no-op actions.

Catalogue scenarios include ready/empty/loading/error/disabled/read-only,
host refusal, long content and permission denied. The voice preview is explicitly
synthetic. Host-specific execution, real media playback, device discovery and
shortcut bindings are not implemented by this presentation library.

## Brand coordination

The founder's September 6, 2026 note makes the concurrent **Brand Identity**
task (`01a023e1-de81-77c3-933b-f4210851a9f4`) an influence, not a replacement
for this library's approved direction. The current logo reference is the
September 6 logo foundation: preserved R12 symbol with Optical 02 lettering.
Inspected logo-sheet SHA256:
`9e4a45ebe159f92d889fbce818dba24648b47b8bb7c984db9169a2ca159efa91`.

The older brand book and in-progress typography/color studies are not current
UI requirements. Keep the continuous canvas, existing theme architecture and
component goal; incorporate finalized brand decisions through shared tokens
and actual artwork rather than redesigning individual controls. Do not retype
the custom wordmark, reshape the symbol, or use the two-color artwork on an
unapproved background. Logo reference inspection does not mean logo artwork
has been integrated into this library or the desktop.

## Use

```tsx
import { Button, Field, Input, KitProvider } from "@harso/ui";
import "@harso/ui/styles.css";

<KitProvider appearance="system" palette="clean">
  <Field label="Project name" description="A name your team can recognise.">
    {props => <Input {...props} value={name} onChange={updateName} />}
  </Field>
  <Button variant="primary" pending={saving} onClick={save}>
    Save changes
  </Button>
</KitProvider>
```

The host owns values, actions, theme preferences, persistence, data fetching and
runtime identities. Components do not make API calls, acquire device permissions,
simulate progress, create sessions or import an AI transport. Theme inputs are
controlled; System follows live device changes. Library preview choices are
ephemeral and never overwrite desktop preferences.

## Reference map

`catalog.json` contains 125 individually mapped public reference families:

- BoardUI: 65 UI components, two foundations and nine templates.
- Vercel AI Elements: 49 UI components, including the public `question` document
  not yet published on the website at capture time. That entry links to the
  pinned public repository document rather than the website's HTTP 404 route.

The curated catalogue records 422 named UI-part references and 20 separate
helper/type entries, documented option/state/composition names, source identities
and uncertainty. Those parts are not 422 additional independently installable components. Five BoardUI demo
routes are duplicate showcases, not additional template families. AI SDK hooks
and transports are nonvisual runtime APIs, not silently unimplemented UI widgets.

Mapping does **not** mean implementation. The preview marks initial native
implementations separately from planned families. Subcomponent names in the
reference anatomy are the implementation checklist, not an export guarantee.
Actual available exports are those in `index.ts`. Full API/state parity remains
open until component-specific evidence closes it.

### Pinned anatomy correction — WEV-1446

The original 395-part capture was incomplete. A read-only audit checked all 49
Vercel MDX SHA-256 hashes and Git blob IDs at the existing pinned commit.
First-name headings alone reproduce that earlier capture but miss other public
documentation forms. The curated correction adds:

- FileTree: three subcomponents listed in bullets, lines 116–118.
- Context: four usage components in shared-props prose, line 140.
- SchemaDisplay: eleven subcomponents in bullets, lines 112–122.
- OpenIn: seven additional names in shared headings, lines 87 and 99.
- PromptInputMessage: the imported public type, line 40 of prompt-input.
- QuestionValue and QuestionResponse: documented interfaces under Types,
  lines 180 and 185 of question; compiled export status is not asserted.

Edge.Temporary and Edge.Animated were already recorded as helpers. They now map
to planned EdgeTemporary and EdgeAnimated UI parts, without adding families or
claiming implementations. Arithmetic: 395 + 25 omitted UI names + 2 reclassified
members = 422 UI references; 19 - 2 + 3 = 20 nonvisual helper/type entries.
Helpers are searchable and separately disclosed, never counted as UI widgets.

Each family's existing `evidence` and `documentationSha256` pins the referenced
document and these line numbers. The audit identity is retained in
`accounting.vercelAnatomyAudit`; its full findings accompany the WEV-1446 receipt.
`sources[].inventorySha256` remains the historical discovery-input hash, not a
hash of the corrected catalogue. No source pins or BoardUI rows changed.

This is a curated pinned-document inventory, not a universal export extractor.
No maintained inventory generator was found, and none was added. Later updates
must inspect shared headings, bullets, prose and Types blocks, not just headings.
Demo-local names, callback props, SDK imports and third-party/platform types stay
excluded. BoardUI was not re-audited; undocumented, future and gated-only names
are outside this captured set. Documentation coverage is not runtime parity.

## Design rules

- Readable type and grouping precede background surfaces, borders and shadows.
- Boundaries remain where semantics need them: inputs, focus, destructive
  actions and dense data. Boundaryless never means imperceptible controls.
- Compose from semantic primitives rather than restyled donor markup.
- Keep status meaning in text, not color alone. Never compute work progress
  from a demo timer or invent nested agents from tool names.
- Motion explains a relationship, not perpetual activity. Respect reduced
  motion and preserve useful states under forced colors.
- Inputs and buttons retain native forms, keyboard behavior and appropriate
  accessible names. The consumer supplies domain labels and validation.
- Native controls are an initial behavioral foundation. A rich reference such
  as Select still needs its documented rich-item/typeahead use cases checked;
  a plain native select is not automatically full reference parity.

## Compact navigation and attention

WEV-1427 adds ten family examples and their nine mapped parts. The original
reference inventory is unchanged. These are original compositions, not API
clones; the deliberate differences below are part of the Harso mapping.

| Reference family | Harso implementation and parts | State / variant disposition |
| --- | --- | --- |
| Breadcrumb | Breadcrumb, BreadcrumbItem | Native ancestor links, current-page text, icons/avatars and wrapping paths. |
| Button Group | ButtonGroup, ButtonGroupItem | Single/multi native selection; controlled/uncontrolled, form/reset, disabled and named icon content. |
| Segmented Control | SegmentedControl, SegmentedControlItem | Same native foundation, mutually exclusive pill choices; group-local names. |
| Tabs | Tabs, TabList, TabPanel, PillTab, PillTabList | Underline and pills; neutral/accent map gray/blue references. Icons/count content, horizontal/vertical/RTL, keyboard, disabled, unique relations and retained drafts. |
| Pagination | Pagination | First/last plus bounded sibling window, current-page semantics, previous/next, ellipses; empty/invalid totals and large counts. |
| Chip | Chip, StatusDot | Bold/subtle/caption; semantic neutral/positive/negative/attention/accent replace decorative donor color aliases. Meaning always has text. |
| Close Button | CloseButton | 2xs/xs/small/medium icon scales; minimum 42px control, 44px coarse-pointer hit target. |
| Tooltip | Tooltip, TooltipTrigger | Existing Radix focus/hover/Escape/collision behavior; four placements and two densities; remains inside the theme scope. |
| Theme Toggle | ThemeToggle | Expanded System/Light/Dark and compact cycle; controlled props. Host persistence, no donor localStorage or circular reveal. |
| Announcement | Announcement | Optional icon/description/action/dismiss. Host decides visibility; immediate removal rather than a hidden timed exit lifecycle. |

Selection item content is text or decorative icons, not nested interactive
controls. Supply unique stable values within a group or Tabs instance. Native
form reset restores uncontrolled defaults. A controlled form must handle its
own `onReset` (prevent the native reset when retaining the current selection,
or explicitly reset its host values); React's native checked inputs have the
same requirement. The kit does not introduce a second reset state store. Tab
panels remain mounted while hidden so drafts survive tab changes. Unknown or
disabled selected tabs display the first enabled panel; the library does not
write a replacement value to the host. ThemeToggle never stores a preference.

Tooltip content must be noninteractive supplemental help, not essential
instructions. The installed headless dependency supplies its mechanics; original
Harso CSS supplies its presentation. Its portal targets the nearest KitProvider,
escaping locally clipped rows while retaining that provider's live palette.
Place the provider outside clipping surfaces; native top-layer dialogs need a
provider inside their own dialog boundary. Cross-dialog placement is not claimed.

Family examples are in `apps/ui-preview/src/boundaryless/navigation-examples.tsx`;
consumer interaction/appearance proof is in `boundaryless-navigation.spec.ts`.
Local proof and named exports do not imply donor-source equivalence, Land
acceptance, or a completed desktop rollout.

## Native entry and choice compositions — WEV-1429

Ten additional UI exports: `CheckboxCard`, `SwitchCard`, `RadioCard`, `RadioDot`,
`PhoneNumberInput`, `SelectItem`, `Kbd`, `RangeSlider`, `InputOtp`, `FileUpload`.
Input has optional leading/trailing content; Checkbox supports host-supplied
indeterminate presentation. Switch offers pill/rectangle geometry and three
sizes. Choice descriptions remain separate from their accessible names.
Changing input adornments preserves the same native node, draft, focus,
selection and forwarded ref; the empty shell has no layout footprint.
Original native examples stay independently inspectable; seven family pages
also show the richer compositions. OTP and file selection add two family pages.

The native boundary is deliberate:

- OTP is one continuous text field, not six separate boxes. It retains native
  text editing, paste/autofill, form reset, required/pattern validity and refs.
  Invalid characters are not silently stripped. Numeric/alphanumeric lengths
  clamp to 1–12; `onComplete` only reports a full matching value. It never
  verifies, auto-submits, persists or requests credentials. The host must clear
  any previous completion message when subsequent editing makes a code invalid.
- PhoneNumberInput uses caller-supplied countries and preserves raw telephone
  text. It does not infer calling codes, provide flags/masks or claim valid
  international formatting. SelectItem is a native text option, not an
  icon/avatar-rich searchable popup; that reference variant remains open.
- RangeSlider uses two labelled native tracks rather than overlapping thumbs.
  Both use the same minimum as their native step base. The browser sanitizes
  supplied numbers; displayed outputs and callbacks use those native values,
  not a separate rounding algorithm. Callbacks clamp crossing before reaching
  the host. Non-finite/unusable configuration or browser precision failure
  disables the pair and excludes it from FormData, with visible explanation.
  It is a JavaScript-number visual input, not an exact-decimal money authority;
  representable values can differ between browser engines. A layout snapshot
  mirrors native values/validity for display, not a second selected-value store.
  Server output stays empty and disabled until the browser has checked the
  controls. The host owns values, callback acceptance and controlled form reset.
- FileUpload is a selection surface, not an uploader. Its picker and drop path
  reject an invalid batch atomically using the same accept/count/size checks,
  count supplied existing entries, and permit reselecting the same file.
  Drop observes the picker's native disabled state, including ancestor
  fieldsets and the first-legend exception, rather than just its own prop.
  The chooser is cleared after selection: form submission uses File objects
  received by the host, not a hidden native FileList. Pass unique IDs in `files`.
  Names render as text. No contents, object URLs or thumbnails are read/created;
  no upload, persistence, transport, retry operation or removal occurs without
  the host. `onRetry`/`onRemove` request actions; controlled entries remain until
  the host changes them. Status/progress comes only from supplied props.
  MIME/extensions/size checks are UX constraints, not content validation or a
  server security boundary. A backend uploader must validate independently.

Keyboard hints do not register shortcuts. Choice cards use native form controls;
disabled states and host ref/label overrides remain supported. Nested actions
inside choice labels are unsupported. Synthetic examples do not constitute
auth, file-transfer, runtime or desktop integration proof.

## Menus, sidebars and carousels

`Dropdown`, `DropdownTrigger`, `DropdownPopover`, `DropdownGroup`,
`DropdownDivider` and `DropdownItem` compose named action menus. The catalogue
shows model radios, workspace choices, account actions, descriptions, icons,
shortcuts, keep-open actions and DOM-nested submenus. Selections/actions belong
to the host. `open` is controlled when supplied; otherwise `defaultOpen` starts
local state. A controlled host can decline either an opening or a dismissal.

Native manual popovers supply the top layer. Small dismissal and keyboard
handlers preserve one open-state authority instead of reopening a browser's
automatically dismissed popup. Keyboard entry, arrows, Home/End, typeahead,
Escape and Tab are supported; editable children and IME composition retain
their native editing keys. Closing returns focus only if it remains inside the
closing panel; outside actions and host-moved focus are not overwritten.
Nested menus must remain DOM descendants; portalled submenu composition is not
supported. Selecting an action requests closure of its whole ancestor chain;
Escape closes only the innermost menu. Hosts remain responsible for the
semantics of supplied rich content.

The runtime must provide `HTMLElement.showPopover`/`hidePopover`; missing
support disables triggers with an explanatory title. CSS anchor positioning
anchors and flips menus at viewport edges. Without it, the ordinary CSS gives
a centered, viewport-bounded popup. The fallback layout is tested by omitting
the anchor rules in Chromium; this is not an older-browser compatibility claim.

`Sidebar` and `SidebarItem` are navigation presentation, not a router. The host
provides destinations/callbacks, selected items, header/footer compositions and
optional controlled collapse. Compact controls keep their labels and counts;
hidden header/footer and repository children retain local drafts. Dashboard and
AI-workspace examples reuse existing search, announcements and disclosures.

`Carousel` and `CarouselItem` use native scrolling and CSS snap with no autoplay,
clones or gesture engine. Direct item widths, gap, start/center alignment and
independent arrows/dots are supported. Arrow navigation selects the next real
geometric position, including several cards sharing a clamped endpoint. The
indicator represents the nearest aligned item, or the first/last item at a
boundary; several visible items can share that boundary. Dots reveal the named
item, not a promise of a distinct scroll position. Controls hide when everything
fits. Keyboard movement belongs to the track, never inputs within slides.
Resize, RTL, reduced motion and Chromium-emulated native touch are exercised.
Safari/Firefox, physical-device and manual screen-reader proof remain separate.

## Dates and supplied schedules

`DatePicker`, `DateRangePicker`, `MonthPanel`, `MeetingScheduler` and `Calendar`
cover the date-selection and calendar references with original Harso surfaces.
Date-only values use Gregorian `YYYY-MM-DD` (years0001–9999), months use
`YYYY-MM`, and native date fields localize their displayed entry. UTC civil-date
arithmetic avoids daylight-saving and JavaScript's early-year constructor shift.
`locale` formats the month/grid and `weekStartsOn` controls the first column.

Pickers separate the displayed value from an open draft. `Apply` requests a
validated value, `Cancel`/Escape/outside dismissal discard the draft, and `Clear`
explicitly requests null. `value` is host-controlled when supplied (including
null); otherwise `defaultValue` initializes local state. A host that ignores the
callback retains its value. `minDate`, `maxDate`, `disabled` and
`isDateUnavailable` apply to grid, native entry, presets and Apply. Range
validation also visits interior dates when an unavailability predicate is
supplied; its cost is linear in the requested interval. No availability is
fetched. Invalid civil dates are not rolled into a different valid date.

`MonthPanel` supports controlled/uncontrolled selection and displayed month,
arrow/Home/End/PageUp/PageDown keys, Shift+Page for years, RTL, visible today and
range/endpoint selection. Unavailable days retain accessible descriptions and
keyboard focus, but never select. Navigation does not itself change selection.
The host can reject a controlled month request; a selected date does not force
the host's displayed month to change.
Delayed accepted month changes retain the pending keyboard destination only
while the grid still owns focus; another user action cancels that focus request.

Picker and event-detail disclosures use native automatic popovers. These are
not application-modal dialogs and do not trap focus. CSS anchors place them
near their trigger when space permits; a centered CSS fallback keeps oversized
pickers inside the viewport. Native popover support is required. Without CSS
anchors the default centered layout remains usable. No extra overlay manager,
date-picker dependency or donor implementation is introduced.

`MeetingScheduler` receives explicitly offset-qualified `startsAt` instants,
positive durations and stable unique slot IDs. `Intl` derives each slot's date
and clock label in the selected timezone; offsets remain visible to distinguish
repeated daylight-saving hours. Host-supplied zone lists and controlled/uncontrolled
timezone/selection are supported. Changing date/zone, removing a slot or disabling
it prevents stale confirmation. `onConfirm` only requests the supplied slot:
there is no booking, availability generation, provider connection or timezone
guessing for unqualified timestamps. Invalid IANA zones are rejected by `Intl`.

`Calendar` receives host-assigned civil dates, display-only time labels,
attendees and action labels. It does not convert or infer event timezones.
Native event details, day-local `+N more` disclosure and the existing inbox menu
keep all supplied entries available. Below620px container width the same events
form an agenda rather than seven compressed columns. Empty months/inboxes are
explicit. Event/inbox actions are callbacks; no URLs are opened by the kit.

The catalogue contains synthetic date, range, month, meeting/repeated-hour and
event/inbox examples. Browser proof is Chromium, including emulated native touch
and forced colors, not physical-device or manual screen-reader certification.

## Reference provenance

This directory contains original Harso implementation and styling. No BoardUI
Pro source or Vercel implementation source was copied. Public documentation is
used for component names, functionality and coverage. Existing installed React
and platform controls provide the interaction foundation. The catalogue uses
the already installed Phosphor icon package rather than re-drawing its assets.
Previously imported MIT BoardUI code and its notices remain under `../boardui/`.

Public BoardUI discovery reconciled sitemap, navigation, gallery and linked
documentation, rather than trusting marketing counts. Inventory digest:
`d0475d8f95dce8b508182065d8bc50aab216b1c2cb46a64ec054ddb0860d418a`.
Research report digest:
`8a47ead0de3c431b91b14719289c985dd27957ec31473ed067eb3a4c983248fa`.
Vercel public docs are pinned to commit
`6a9d5b1822ffb10bba4bd97175f01edd7d8651cd`; individual document identities are
recorded in the map. Capture date: September 6, 2026. Public descriptions are
not evidence that every public demo behavior is accessible or production-ready.

The generated reference metadata is included for transparency. No Pro registry,
authenticated endpoint, hidden bundle, starter transport or demo persistence is
an implementation dependency.

## Conversation and response presentation — WEV-1437

Four reference families now have original examples with all20 named UI parts:

- Conversation, ConversationContent, ConversationEmptyState,
  ConversationScrollButton and ConversationDownload.
- Message, MessageContent, MessageResponse, MessageActions, MessageAction,
  MessageBranch, MessageBranchContent, MessageBranchSelector,
  MessageBranchPrevious, MessageBranchNext, MessageBranchPage and MessageToolbar.
- Suggestions and Suggestion; Shimmer.

`messagesToMarkdown` is a separate pure formatting helper, not a UI export.
The checkpoint is **82 UI exports /33 mapped family examples**, not complete
reference parity. The remaining92 families and documented rich variants stay
open. Message math, syntax highlighting/copy, attachments and source composition
remain pending their dedicated result/media leaves; they are not silently
claimed by a plain Markdown response.

The Conversation root owns only scrolling context. ConversationContent is the
native `role="log"` viewport; it follows new content and resizes only while the
reader is already at the bottom. A focused jump button remains mounted/visible
until blur after activation, so returning to the newest text does not drop
keyboard focus. Use a conversation ID as the root React key when switching
conversations. Pass `aria-busy` to the log while the host streams text.
Native ResizeObserver supplies resize-following; no stick-to-bottom dependency
or shared transcript state is introduced. On unsupported environments the
viewport still scrolls natively but ongoing resize-following is unavailable.

MessageBranch supports controlled `branch` plus `onBranchChange`, or an
uncontrolled `defaultBranch`. Its single MessageBranchContent counts its direct
children. Give versions stable React keys; hidden versions remain mounted but
leave the tab/accessibility order. Numeric out-of-range selection clamps to the
available display; a controlled host refusal never becomes a false accepted
version. A host key controls reset. This state is presentation only, never
generation, retry identity or conversation routing.

MessageResponse takes untrusted Markdown text, not HTML or plugins. It reuses
installed react-markdown and remark-gfm for GFM lists/tables/code. Raw HTML is
inert; images are labelled text and never fetch; links are clickable only for
absolute HTTP(S) URLs with `noreferrer noopener`. Mail, relative, file, data and
script URLs stay text. Trusted React composition belongs in MessageContent,
not in the text boundary. No raw-HTML escape hatch or custom plugin prop exists.
Unfinished Markdown follows the installed CommonMark parser rather than an
invented token-completion engine. Media needs an explicit separately governed
component, not automatic remote loading from a response.

Actions remain native buttons with accessible labels, optional shared Tooltip,
and caller callbacks; they neither retry nor touch the clipboard independently.
Suggestion uses `onSelect(text)` and can fill a caller draft without sending it.
Shimmer supports `active`, `duration`, `spread` and an `as` semantic element;
reduced motion and forced colors produce readable static text. No timer or
provider activity is hidden inside the effect.

ConversationDownload intentionally calls required `onDownload(markdown)` rather
than owning a file store/browser download policy. Its supplied messages are
explicit `{ role, content }` text records; no SDK UIMessage adapter, hidden tool
payload, system transcript collection or backend request is inferred. The pure
formatter accepts an optional per-message formatter. The catalogue host alone
creates a Blob for its labelled synthetic transcript after the user's click,
then revokes its temporary object URL. Desktop export authorization remains
the real host's responsibility.

## Compact work presentation — WEV-1439

Nineteen original parts map four more reference families. Plan, Task and
Reasoning share a private disclosure mechanism, not three state engines.
Each root takes `open`/`onOpenChange`, or `defaultOpen`, and `disabled`.
Native buttons own keyboard activation, generated relations identify the single
content area, and hidden content remains mounted to preserve local drafts.
Use one trigger/content pair per root and a host key to reset work scope.
Nested roots are independent. An external collapse restores displaced focus
to the trigger (or the root if disabled), but never steals outside focus.
Custom hook-only triggers should forward equivalent focus handling themselves.

| Reference family | Original Harso parts | Behavior and deliberate differences |
| --- | --- | --- |
| Plan | Plan, PlanHeader, PlanTitle, PlanDescription, PlanTrigger, PlanContent, PlanFooter, PlanAction | Plain typography and spacing, not a bordered card. Title/description shimmer when the host says streaming. Footer/actions can remain outside collapsed details. PlanAction is a composition slot, not an execution button. |
| Task | Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile | Compact summary and retained detail list. Host supplies status text/icons/counts. TaskContent is a list; use TaskItem children. File names are inert text; wrap the label in a host Button to request review. |
| Reasoning | Reasoning, ReasoningTrigger, ReasoningContent | Public progress summary supplied by the host, never extraction of hidden model reasoning. Reuses MessageResponse's existing sanitized Markdown boundary. Custom trigger labels and the mapped useReasoning hook are supported. |
| Checkpoint | Checkpoint, CheckpointIcon, CheckpointTrigger | Quiet history marker, optional tooltip, native callback-only button. No checkpoint creation, restore/branch authority, transcript mutation or storage. |

All three disclosures default to collapsed unless the caller opts in. Unlike
the upstream Reasoning timer/automatic disclosure behavior, streaming updates
never open or close a reader's details, move focus or compute runtime duration.
`duration` displays only a finite nonnegative number supplied by the host and
is omitted while streaming. The `useReasoning` helper exposes that same scoped
`isStreaming`, `isOpen`, `setIsOpen` and `duration`; it is not another UI export.
Hosts may compose their own automatic-open policy via controlled `open`.

React slots are trusted composition. Supplied summary strings remain untrusted
and cannot enable HTML, plugins, image requests or unsafe URL schemes. File
labels never navigate or read disk. Status is presentation, not a new runtime
taxonomy: agents and tool work occupy the same Task structure. Required
decisions belong outside hidden content and always carry text, not color alone.

Catalogue examples use labelled manual sample updates, draft retention,
controlled refusal, decisions, public summaries, and explicit checkpoint/file
requests. No operation is performed by those requests. There is no private
model reasoning, real runtime subscription, data store or SDK transport here.

## Tables and metrics — WEV-1441

Table, DataTable and StatCards map three BoardUI families without importing a
table engine or metric data source. Table accepts native table children, a
required caption, and `size="md" | "sm"`. Its labelled, focusable scroll region
keeps narrow layouts readable instead of squeezing labels into single letters.
DataTable retains a 36rem minimum canvas within that local scroll region;
the simpler Table primitive keeps its natural content width.

DataTable accepts typed `columns`, already filtered/sorted/paged `rows`, stable
`rowId` and human-readable `rowLabel` functions. Host props own `sort`,
`selectedIds` and `pagination`; callbacks request changes and a refusal leaves
the display unchanged. `onSelectionChange(visibleIds, selected)` sends only
eligible visible IDs as a delta: it never includes off-page selections or row
objects. Header selection reflects eligible visible rows, including an
indeterminate state. Reordering does not change selected identity. Empty or
duplicate row/column IDs fail closed with a visible error and no row actions.

Use `disabled`, `loading`, `error` and `emptyMessage` for explicit presentation.
Loading/error replaces stale rows; disabling prevents built-in sort, selection
and page requests. `toolbar`, `footer` and cell-renderer React content are trusted
host composition: **custom controls must honor the host's own disabling and
authorization rules**. This component does not secure arbitrary child actions.
Text is React-escaped; no parser, persistence, fetch, tenant cache or SDK state
is introduced. Search/filtering and all data operations stay in the host.

StatCards presents supplied `items` through native `dl/dt/dd`. Each item has an
ID, label and value, with optional delta/trend, caption and shared tooltip hint.
`variant="plain" | "footer"` controls caption separation; six decorative accent
tones preserve the reference's variants without boxed cards. Deltas and elapsed
values are supplied, not inferred. No chart, percentage or trend is fabricated.

The catalogue demonstrates both table densities, rich status/action cells,
string/numeric sorting, filtering, paging, selected identity across updates,
host refusal, malformed identities and six metric accents. These are original
presentation APIs, not drop-in BoardUI source or a replacement data engine.

## Tool activity, configuration, results and sources

WEV-1443 adds four original families with24 UI parts. They reuse the existing
Plan disclosure rather than adding another state engine. Tool/Sources roots
and individual AgentTool roots support `open`, `defaultOpen`, `onOpenChange`
and `disabled`. Disabling a disclosure prevents its trigger, not arbitrary
host-composed actions inside its content. Collapsed content stays mounted;
changing a supplied status never opens it or discards drafts. The host should
key/remount roots when conversation or work identity changes.

```tsx
<Tool open={open} onOpenChange={setOpen}>
  <ToolHeader type="dynamic-tool" toolName="Search evidence"
    state="approval-requested" />
  <ToolContent>
    <ToolInput input={{ query: "Firsthand observations" }} />
    <ToolOutput output={result} errorText={errorText} />
  </ToolContent>
</Tool>
```

The seven supplied states are input-streaming, input-available,
approval-requested, approval-responded, output-available, output-error and
output-denied. `getStatusBadge` provides a readable label/icon; unrecognized
states say Unknown status. Approval remains visible in the collapsed header.
The host places approval actions outside hidden details; the kit never
approves, retries, estimates progress or executes anything. `ToolPart` is a
local display projection, not the SDK's full union or a transport contract.
An error (including an empty error string) suppresses a stale output. Numeric
zero remains a valid result. ToolInput accepts plain JSON values, not SDK
schema instances; undefined and unserializable input receive explicit text.

Agent is configuration display: AgentHeader shows supplied name/model,
AgentInstructions reuses sanitized Markdown, AgentTools allows one expanded
AgentTool at a time, and AgentOutput displays supplied schema text. Tool
descriptors contain only description and plain-JSON inputSchema; SDK tool
functions are not accepted as an execution surface. Never pass secrets or
private reasoning into display props. There is no schema evaluation or tool
invocation. Syntax highlighting remains an explicit rich-parity gap.

AgentTools accepts `value: string | null` for host-controlled selection;
`null` means none open, while omitted `value` uses local `defaultValue`.
Closing requests `null`, not `undefined`. A host may refuse any request.
The group overrides child `open`/`defaultOpen`; its `disabled` gate cannot
be bypassed by a child. Standalone AgentTool keeps its own disclosure API.

Artifact/Header/Title/Description/Actions/Action/Close/Content compose an
unboxed result. ArtifactAction requires an accessible `label`, accepts a
React-node `icon` and optional tooltip, and reuses MessageAction's native
button. Disabled actions do not emit clicks. Close only reports `onClick`;
the host owns removal/refusal and focus restoration after removal. Title is
a semantic h3 rather than the reference paragraph; icon nodes replace a
vendor-specific icon type. CodeBlock composition is not yet implemented.

Sources/Trigger/Content and Source present host-selected references. Count is
supplied, never fetched; invalid counts omit the number. Source accepts custom
children or title, and otherwise displays the safe hostname. Invalid/relative/
credential-bearing/non-HTTP(S) addresses render inert without href or action
callbacks. Safe links use noreferrer/noopener and no-referrer; ping/download
attributes are suppressed. There are no favicons, previews, storage or
background requests. Rich React children in all families remain trusted host
composition, not a sanitization boundary; the host owns authorization,
redaction and any custom handlers. Only string/JSON/Markdown surfaces are
rendered inert by these components.

All four catalogue examples exercise real local state and refusal. Synthetic
source links explicitly prevent navigation; real Source consumers can navigate
only on a user's deliberate link activation. Samples are not runtime proof.

## Inspect and test

From the repository root:

```sh
npm --prefix packages/ui test -- --run src/boundaryless
npm --prefix packages/ui run typecheck
npm --prefix apps/ui-preview run build
```

From `apps/ui-preview`, the existing Vite preview serves `library.html`
independently of `index.html`. The dedicated browser suite uses port 4192:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/harso-conversation-browsers \
  ./node_modules/.bin/playwright test --config playwright.boundaryless.config.ts
```

The library has synthetic examples only. Passing these tests is not evidence
of a signed desktop release or end-to-end Hermes/Ledger runtime correctness.

See `IMPLEMENTATION.md` for complete outcome tracking and remaining families.

### Finance template composition

`FinanceDashboard` accepts host-rendered `navigation`, `actions`, `cashFlow`,
`spending`, `portfolio`, `dailySpending`, and `transactions` slots alongside
`title`, `stats` and `children`. Omitted slots create no fake data or landmarks.
Use the existing DataTable in `transactions`; the host owns filtering, sorting,
selection, page data and request acceptance. The layout adds no data fetching,
account connection, storage or export side effect. Navigation content remains
host-owned and becomes a wrapping row on narrow screens.

The finance catalogue includes an interactive synthetic example, but its chart
geometry remains provisional: the existing heatmap family
does not yet provide full reference behavior. Do not present this composition as
a complete finance visualization system or use its sample values as advice.

### Scatter chart

`ScatterChartCard` now takes `series: { label, color?, points: { x, y, z?, label? }[] }[]`,
not generic `data` with invented x positions. Both axes use actual signed values;
constant domains are centered. Nonfinite coordinates or negative/nonfinite sizes
are excluded, never replaced with zero. `bubble={false}` renders equal dots;
otherwise optional z scales area with a minimum visible marker, defaulting to1.
Use `axisLabels`, `formatX` and `format` for labels, `tiles={false}` to hide
derived count/mean summaries, and host-controlled `range`/`ranges`/`onRangeChange`
for data selection. No fetching or implicit filtering occurs in the component.

Pointer hover, keyboard focus and touch reveal point values; Escape resets
inspection. A removed point cannot remain the active observation. `disabled`
disables range requests and inspection; custom `children` remain host-owned.
The original example demonstrates bubbles/even dots, summaries, host refusal,
empty/invalid/disabled states. There is no vendor drop-in API guarantee.

### Activity rings

`ActivityRingsCard` takes `rings` with unique non-empty `id`, `label`, `value`,
positive `target`, optional `unit` and `color`. Each metric draws its own
concentric arc; zero draws no progress, and over-target progress caps the arc
while retaining the actual value and percentage in text. Invalid metrics are
omitted with an explicit count; duplicate IDs reject the chart. Generic `data`
is no longer a substitute for independent metrics and targets.

Hovering rings or focusing/tapping their native metric buttons reveals values.
Inspection follows stable IDs across host updates, clears when a metric is
removed, and resets with Escape. `disabled` gates these inspection controls.
Use the optional host-rendered `calendar` slot with MonthPanel for selected-day
values; the host supplies the day, availability and metrics and propagates its
disabled state into that slot. No calendar, health store or time-series data
authority is created. `targetLabel` distinguishes goals from proportions such
as Finance's spending categories against a supplied total.

### Heatmap matrix

`HeatmapChartCard` accepts `columns: string[]` and
`rows: { label: string; values: (number | null)[] }[]`. Axes are unique,
non-empty labels; each row has exactly one value per column. Nonnegative finite
numbers are observations, including zero. `null` is missing, never a measured
zero: all-missing matrices show no observations and partial totals identify the
missing count. Invalid shapes, numbers, ceilings or overflowing totals display
an explicit error. No built-in dataset is supplied.

The semantic table exposes both axes and a native button per cell. Pointer,
keyboard focus and touch update the headline and row/column cues. Escape clears
inspection; pointer exit restores the keyboard-focused cell if one exists.
Removed axes cannot keep stale inspection. `disabled` blocks cell inspection
and range requests. Large matrices scroll within a labeled focusable region.
This is an unvirtualized dashboard matrix, not a spreadsheet-scale grid.

`max` supplies a positive finite intensity ceiling; higher observations clamp
only the color, never their displayed values. `color` overrides the theme accent;
`format` renders numeric labels. The same original low-intensity ramp works in
Light/Dark and Clean/Cozy; visible values and focus marks avoid color-only meaning.
`value` and `delta` are host-supplied baseline content, not computed financial
claims. The active cell temporarily replaces the baseline headline.

`range`, `ranges`, `onRangeChange` retain host ownership: refusing a request keeps
the selected range and data. `children` replaces the body for loading/error or
custom content. The example demonstrates weekday × hour and region × month,
ceilings, accents, empty/zero/missing/invalid/disabled/loading/error and host
refusal. Finance composes explicit dates with spending categories; this is not
a separately implemented calendar widget or a vendor drop-in API.

### Sankey flows

`SankeyChartCard` takes `nodes: { name, color? }[]` and `links: { source,
target, value }[]`. Endpoints are node names or zero-based indices; names must
be unique and non-empty. Native SVG lays out an acyclic directed graph with
link widths proportional to nonnegative finite values. Parallel links are
preserved. Cycles, invalid endpoints/values, overflowing totals and relative
weight underflow that would erase a positive link produce
an explicit error rather than a partial, misleading diagram. Zero links do
not become positive strokes. This replaces the old generic `data` API.

The headline derives source and sink totals separately; it does not double
count intermediate transfers or invent balancing flows for inconsistent
input. Node details report inflow/outflow; sink shares use total sink inflow.
Pointer inspection and native node/link buttons share the same readable
status. Escape clears inspection. Use host-controlled `range`, `ranges`,
`onRangeChange` and `format` for selection and labels. `disabled` gates these
requests and inspection; the component never fetches or filters data itself.

Wide diagrams scroll inside a labeled focusable region rather than squeezing
weights into an unreadable mobile chart. Layout follows host order and does
not optimize crossings. Links spanning columns reserve intermediate lanes so
they do not run through unrelated nodes. Full node/link labels remain available in the native
controls even when long on-diagram labels are shortened. No circular-flow or
vendor drop-in API claim is made.
# Developer content: snippets, dependencies and environment values

`Snippet`, `SnippetAddon`, `SnippetText`, `SnippetInput`, `SnippetCopyButton`;
`PackageInfo`, `PackageInfoHeader`, `PackageInfoName`, `PackageInfoChangeType`,
`PackageInfoVersion`, `PackageInfoDescription`, `PackageInfoContent`,
`PackageInfoDependencies`, `PackageInfoDependency`; `EnvironmentVariables`,
`EnvironmentVariablesHeader`, `EnvironmentVariablesTitle`,
`EnvironmentVariablesToggle`, `EnvironmentVariablesContent`,
`EnvironmentVariable`, `EnvironmentVariableGroup`, `EnvironmentVariableName`,
`EnvironmentVariableValue`, `EnvironmentVariableCopyButton` and
`EnvironmentVariableRequired` are original, composable Harso implementations
of the 25 named parts in the three pinned public Vercel reference families.

```tsx
<Snippet code="example status">
  <SnippetAddon><SnippetText aria-hidden="true">$</SnippetText></SnippetAddon>
  <SnippetInput aria-label="Command" />
  <SnippetCopyButton onError={reportCopyFailure} />
</Snippet>

<PackageInfo name={name} currentVersion={current} newVersion={next} changeType="minor">
  <PackageInfoHeader>
    <PackageInfoName /><PackageInfoVersion /><PackageInfoChangeType />
  </PackageInfoHeader>
  <PackageInfoDescription>{description}</PackageInfoDescription>
  <PackageInfoContent><PackageInfoDependencies>
    <PackageInfoDependency name="dependency" version="1.0.0" />
  </PackageInfoDependencies></PackageInfoContent>
</PackageInfo>

<EnvironmentVariables key={environmentIdentity}>
  <EnvironmentVariablesHeader>
    <EnvironmentVariablesTitle /><EnvironmentVariablesToggle />
  </EnvironmentVariablesHeader>
  <EnvironmentVariablesContent>
    <EnvironmentVariable name="SAMPLE_KEY" value={authorizedValue}>
      <EnvironmentVariableGroup><EnvironmentVariableName /><EnvironmentVariableRequired /></EnvironmentVariableGroup>
      <EnvironmentVariableValue />
      <EnvironmentVariableCopyButton copyFormat="value" onError={reportCopyFailure} />
    </EnvironmentVariable>
  </EnvironmentVariablesContent>
</EnvironmentVariables>
```

`SnippetInput` is labelled, read-only, selectable text; the optional prefix is
not copied. Copy buttons accept `label`, `disabled`, `pending`, `timeout`
(default 2000ms), `onCopy` after success, `onError` after failure and ordinary
native button props. `onClick(event.preventDefault())` suppresses copying.
Pending requests cannot duplicate; replaced content, changed visibility and
unmount invalidate completion feedback/callbacks. Already-issued operating
system writes cannot be revoked. Copy has no fallback or clipboard reads;
unavailable/denied native access reports failure rather than pretending success.
The host may show further instructions through `onError`. No command executes.

Package values are supplied, never inferred. The five change types are `major`,
`minor`, `patch`, `added`, `removed`; text accompanies tone. Identical versions
show once; absent versions say “Version not supplied.” Dependencies are plain
rows, not links, installation actions or remote lookups. Slots accept trusted
React content; provided strings render inertly.

Environment values default to masked. `showValues` controls visibility;
`defaultShowValues` initializes uncontrolled visibility. Returning `false` from
`onShowValuesChange` refuses an uncontrolled transition; controlled mode always
waits for the supplied value. The root `disabled` blocks reveal and copy, not
arbitrary host children. Toggle `onChange.preventDefault()` also refuses reveal.
Masking applies even to custom value children. Name and required slots remain
visible. Empty visible values have an explicit label but copy as an empty string.

**Intentional safety differences:** `copyFormat="name"` works while masked;
`value` (default) and `export` require visible values. `export` produces a POSIX
shell assignment using single-quote escaping, validates ASCII variable names,
and rejects NUL. It is not PowerShell syntax and is never executed. Invalid
exports are disabled. Reveal is presentation, not authentication or encryption:
authorized values still exist in application memory. The host must redact and
scope data before rendering, key/remount for conversation/environment changes,
and avoid putting secret values in custom attributes or other trusted slots.
There is no environment enumeration, permission prompt on mount, bulk export,
storage or secret retrieval. Browser tests intercept synthetic clipboard writes;
they do not overwrite the user's OS clipboard or claim real-OS clipboard proof.

## Test results

The17 `TestResults*`, `TestSuite*` and `Test*` parts present supplied test-run
data without becoming a runner. `TestResults summary={...}` owns no aggregation:
the host supplies counts, total, duration and streaming state. Counts must be
nonnegative safe integers and completed counts cannot exceed total before a
determinate native progress bar is shown; otherwise the UI says unavailable or
waiting instead of inventing a percentage. Streaming is a render input, not a
timer or poller.

Suites compose the existing Plan disclosure/focus behavior. `TestStatus` uses
words as well as tone, `TestDuration` shows finite nonnegative milliseconds or
seconds, and errors remain supplied text in `TestErrorMessage`/`TestErrorStack`.
No error text is executed, linked or copied by this family. Hosts own retry,
restart, redaction, identity and actions. This is original UI mapping, not a
test-runner or upstream drop-in.

## Stack traces

The ten `StackTrace*` parts map the pinned public Vercel anatomy without its
demo transport or code execution. `StackTrace trace={raw}` reuses Plan for
controlled/uncontrolled disclosure and focus recovery; `StackTraceCopyButton`
composes Snippet's existing full-text clipboard lifecycle. No parser dependency,
navigation, file access, persistence, polling or runtime adapter is added.

Compose `StackTraceErrorType` and `StackTraceErrorMessage` inside `StackTraceError`;
place that and `StackTraceActions` in the noninteractive `StackTraceHeader`.
Copy and `StackTraceExpandButton` are sibling native buttons, not nested triggers.
This intentionally differs from the upstream trigger header and div expand icon.
Native props/refs are forwarded. Root disabled blocks built-in copy, expansion
and file callbacks, not arbitrary host action slots. A controlled owner can
refuse expansion. Replacing `trace` replaces the data and invalidates copy
feedback; key the root when disclosure should also reset.

`StackTraceFrames` recognizes standard JS/Node `at` lines with a location and
positive safe-integer line/optional column. Windows paths and URL colons stay
opaque. Unrecognized lines, native frames and malformed coordinates remain raw
text, not actionable guesses. Without `onFilePathClick`, all paths are inert.
With it, a native button calls the host only on explicit activation. The host
owns authorization, source navigation and redaction before supplying a trace;
the copy action copies the full supplied string, including hidden frames.

Recognized `node:` and `node_modules` locations are labeled Internal and muted,
not indicated only by color. `showInternalFrames={false}` reports the hidden
count; empty/all-hidden results are explicit. `StackTraceContent maxHeight={400}`
is a keyboard-focusable native scroll area; nonpositive/nonfinite values use400.
Strings render as text with semantic emphasis, not a syntax-highlighter engine.
Unsupported stack dialects are preserved rather than normalized. This is original
UI/API mapping, not an upstream drop-in or comprehensive parser-parity claim.

## Commit summaries and file changes

The22 `Commit*` parts are original presentation components mapped to the pinned
public Commit anatomy. `Commit` reuses Plan's controlled/uncontrolled disclosure
and focus recovery. Keep `CommitAuthor`, `CommitInfo` and `CommitActions` beside
`CommitHeader`, not inside its button. Header contains a short phrasing-content
label such as “4 changed files”; `CommitContent` holds the changed-file rows.
There is one disclosure trigger/content pair per root. The host supplies every
hash, message, author and file; this library never executes Git or opens paths.

`CommitCopyButton hash={fullHash}` composes the existing Snippet clipboard
control, preserving pending/error/success, timeout, prevention and stale-identity
handling. It copies the full supplied string, not the displayed abbreviation.
`CommitActions` and the copy control stop click bubbling. Root `disabled` blocks
its own copy and disclosure; arbitrary host actions remain host-controlled.
No clipboard operation runs on mount; denied access is visibly reported.

`CommitAuthorAvatar` renders the exact supplied initials using existing avatar
styles and native span props/ref. It does not fetch an image. This is a deliberate
native API difference from the reference's Avatar-component prop surface.
Statuses show full labels (Added/Modified/Deleted/Renamed), with accessible labels
even when customized; color is supplementary. Counts require nonnegative safe
integers; invalid counts display an em dash labeled unavailable, not an invented
zero. Strings remain text; React slots/attributes are trusted host input.

`CommitTimestamp date={date} now={clock}` shows English relative time at render,
with an ISO absolute date in `dateTime`, title and accessible label. `now` is
optional; supply a stable clock for deterministic server/client rendering.
There is no timer or background polling. Invalid dates show “Date unavailable.”
Valid custom timestamp children preserve the absolute date. Themes, focus,
reduced motion and forced colors come from the existing foundation.

The catalogue demonstrates controlled refusal, empty changes, unavailable
metadata, long paths, disabled controls and changing hash identity. These22
parts add one real family example, not a full upstream drop-in API or Git client.

### Agent limits breakdown

`AgentLimitsCard` accepts host-supplied `context` with `max`, token `segments`,
and optional member `groups`. Deferred segments are visible in the breakdown
but excluded from consumed context and the usage bar. Group totals are supplied
metadata, not additional consumption. `plan` and `limits` describe separate plan
budgets; reset strings are supplied by the host, not maintained by a local timer.

`expanded` / `onExpandedChange` support controlled refusal; `defaultExpanded`
sets the uncontrolled initial view. Member groups expand independently. Existing
`used`, `maximum`, and `label` callers remain supported. Loading, unavailable,
disabled, empty and over-limit examples are inspectable in the catalogue.
This is an original Boundaryless presentation, not billing, scheduling or quota
enforcement, and does not fetch or persist usage.

### Agent progress and thinking

`AgentProgress` defaults to host-driven `steps` and `current`; `progress` is
the supplied active-step fraction, not an estimated completion percentage.
Collapsing the block preserves its contents and progress. `expanded` and
`onExpandedChange` allow the host to refuse a disclosure change.

`playback="timed"` is an explicit demonstration mode, using `stepDuration`
and `completionDelay`. Only this mode emits `onFinished`, once per run.
Use `runId` to restart it. It never sends messages or runs agent work; the
catalogue labels it as simulated playback. Missing or invalid host progress
is not treated as completion, and an empty list is not a successful run.

`AgentThinking` offers original `wave`, `spin`, `stars`, and `infinity`
indicators with `label`, `tone`, `shimmer`, and `showTimer`. Existing `children`,
`elapsed` and explicit tool `state` remain supported. The optional local clock
measures active display time only; host `elapsed` takes precedence. `runKey`
starts a fresh clock. Pause and terminal states stop activity; live reduced
motion replaces animation with a still indicator. Time updates are not
announced continuously. No remote assets, model activity or execution state
are inferred from these visuals.
