# Harso v6 card-family interface (WEV-3303)

One typed frame, one registry, one rendering seam. A family builder codes against this file and `types.ts`. Do not copy the card engines: chart, table, media, status, progress and action rendering already exist and are exported.

Status of this file: written by the foundation builder from the code on branch `factory/wev-3300-v6-kit-foundation`. Every name below exists in that code and is checked by `src/chat/v6/*.test.tsx`.

## What a family is

A family is one object with two functions. It lives in its own file `src/chat/v6/<stem>.tsx`.

```ts
import type { V6Family } from "./types";
export const family: V6Family = { renderFamily, supportedWidgetSizes };
```

```ts
renderFamily(props: V6FamilyProps): ReactNode | undefined
supportedWidgetSizes(template: V6Template): readonly WidgetSize[]
```

- Return `undefined` (or `null`) from `renderFamily` for any document or `widgetSize` you cannot draw in full. The generic card then draws the whole answer, so no block is lost.
- `renderFamily` runs inside a component of its own, keyed by template. Hooks are legal in it and keep their state while the document is replaced.
- A family that throws falls back to the generic card.
- Draw through `HarsoV6Frame` (`V6Frame`) for the header, open target, trailing area and Details.
- Never fetch, navigate, poll, read the device clock for a "live" claim, or register yourself. The Lead adds one line to `registry.tsx`.

## `V6FamilyProps` (frozen, from `types.ts`)

```ts
interface V6FamilyProps {
  document: HarsoOutputDocument;          // the same object the host passed
  mode: "inline" | "full";                // inline = card in a chat; full = the whole answer
  widgetSize?: "small" | "medium" | "large" | "extraLarge";   // set only for a card pinned to Home
  host: V6Host;
  media: HarsoOutputMediaHost;            // { resolveArtifact? }; {} when the host gave none
  renderBrand: V6RenderBrand;             // always callable; returns undefined when the host has no mark
  onOpenDetails?: () => void;             // when set, Details hands off to the host instead of opening inline
}

interface V6Host extends HarsoOutputActionHost {
  onViewAll: () => void;                  // open the whole answer
  subjectState?: (subject: HarsoOutputStatusSubject) => HarsoOutputSubjectState | undefined;
  blockStates?: Readonly<Record<number, HarsoOutputBlockState>>;   // by index in document.blocks
}

interface HarsoOutputActionHost {          // each callback is optional: absent means draw no control for it
  onOpenUrl?: (url: string) => void;
  onOpenArtifact?: (artifact: string) => void;
  onDownloadArtifact?: (artifact: string) => void;
  onWorkControl?: (control: "cancel" | "retry" | "dismiss", workUnitId: string) => void;
  onRoutineControl?: (control: "pause" | "resume", routineId: string) => void;
  onPageWatchControl?: (control: "disable", pageWatchId: string) => void;
}

type V6RenderBrand = (brand: { domain: string; label: string }) => ReactNode | undefined;
```

PLAN section 6 lists `host` as host callbacks. `onViewAll`, `subjectState` and `blockStates` live inside `host` so `V6FamilyProps` keeps exactly the seven PLAN keys.

`mode` is `full` when the card is uncapped (`caps.maxRows === Infinity`, the host's View all) unless the host says otherwise.

## Registry

`registry.tsx` exports `V6_FAMILIES` (frozen, empty), `v6TemplateOf(doc)`, `v6FamilyOf(doc, families?)`, `harsoV6WidgetSizes(doc, families?)` and `V6FamilyBoundary`. It imports no family. Dispatch is by `document.template` only: absent, unknown, a variant name such as `flight-status-inair`, or a prototype key (`constructor`) all give the generic card. `HarsoOutputCard` takes an optional `families` prop (a test registry) and defaults to `V6_FAMILIES`.

## The frame

```tsx
<HarsoV6Frame document mode host onOpenDetails renderBrand trailing openArea className>{body}</HarsoV6Frame>
```

- Header: optional brand mark (`header.brand`), title, subtitle, snapshot line (`As of 09:10 · 2 of 5 sources`) and the coverage meter.
- Open target: inline mode makes the title one `<button>` inside the `<h2>`; it calls `host.onViewAll`. Full mode draws a plain heading. `openArea="card"` stretches the same single button over the whole card; anything else pressable sits above it.
- `trailing`: the header's action area, a SIBLING of the open target. Draw only what the host can act on. The frame never nests one pressable inside another.
- Details: the toggle sits in the trailing area; it hands off to `onOpenDetails` or discloses inline (Escape closes and returns focus).
- Snapshot: only the saved UTC `as_of`, formatted in the viewer's zone. The frame makes no live, stale or up-to-date claim from the device clock.
- `HarsoV6Brand` (`V6Brand`): `{ domain, label, renderBrand }`. A domain that is not a lowercase public host name never reaches `renderBrand`. A decline gives a letter tile. Decorative (`aria-hidden`); the name is always in the text. Use it for row brands too.
- `HarsoOutputActionRow`: the action block with the card's own rules (https only, callback required, no `reply`). Use it for `trailing`.

Engines to reuse, not copy. They are exported from their own files and are NOT re-exported from `src/chat/index.ts` (this foundation did not widen the public surface); import them from `../output-card-charts` and `../output-card-media`:

- charts: `readChart`, `readShare`, `readTable`, `HarsoOutputChartView`, `HarsoOutputShareView`, `HarsoOutputTableView`, `HarsoOutputRowStatus`, `HarsoOutputNumberDelta`, `HarsoOutputBlockFrame`
- media: `readStatus`, `readSteps`, `readProgress`, `readMedia`, `HarsoOutputStatusView`, `HarsoOutputProgressView`, `HarsoOutputImageView`, `HarsoOutputThumb`, `HarsoOutputGalleryView`, `HarsoOutputVideoView`, `HarsoOutputMapView`, `HarsoOutputMediaSkeleton`
- card: `readAction`, `HarsoOutputActionRow`, `HarsoOutputCardMeta`, `hasDetails`, `DetailsContent`, `isHttps` from `../output-card`

Each `read*` returns undefined for data it cannot read, which is the signal to return `undefined` from `renderFamily`.

## Contract fields C0-C10 (all optional, closed, no free-form bag)

| ID | Where | Type |
|---|---|---|
| C0 | `document.template` | `V6Template` (20 names, `V6_TEMPLATES`) |
| C1 | `header.brand`, `row.brand` | lowercase public host name, max 253 |
| C2 | `row.action` | `{ kind: "open_url"; label; url }` |
| C3 | `status` with `state: "tracking"` | `label` required; `subject` never; `progress` 0-100 integer; `stages` 1-8; `stage_index` in bounds; `condition` `on_time` / `delayed` / `unknown` |
| C4 | `chart.range`, `chart.baseline` | `1D`/`1W`/`1M`/`1Y`; exact decimal string |
| C5 | `table.columns[].thumbnail`, `table.rows[].winner` | photo; column index |
| C6 | row | `rating`, `review_count`, `noise_db`, `category`, `opening_label`, `open_state`, `distance`, `travel_mode` |
| C7 | row | `unread`, `due_at`, `starts_at`, `calendar_color` |
| C8 | `document.weather` | `V6Weather` |
| C9 | `document.flight`, flat on row | `V6Flight` + row `arrival_day_offset` 0-3 |
| C10 | `text.sections[].date`, `.thumbnail` | `YYYY-MM-DD`; photo |

The kit types check shape only. Cross-field and date rules (bounds, decimal ranges, `high >= low`, real calendar dates, hourly arity) belong to the canonical validator in weave-cloud. A family must still treat an out-of-range value as missing and fall back.

Page watch: `status.subject = { page_watch_id }` and `{ kind: "page_watch_control", label, page_watch_id, control: "disable" }` are native. The card calls `onPageWatchControl("disable", id)` with the exact ID and draws nothing without the callback. Routine and Work controls are unchanged.

A `tracking` status is display-only. The generic card says `Tracking · <label>` plus `On time` or `Delayed` only when the source gave one. A family draws `progress` and `stages` itself. It never invents progress from the device clock.

## Rules a family must keep

- Source order and `row.id` identity. Never sort, drop or rename.
- Render a missing optional field as absent, never as a sample.
- Decorate and group; do not discard an unhandled block. If you cannot draw it, return `undefined`.
- Links, files, media and controls are host-owned. No callback, no control.
- Pass `document.template` through untouched.
- Tests: `(cd kit && npm test -- src/chat/v6/<stem>.test.tsx)`. Include light and dark checks of your own CSS tokens, a missing-data fallback, and an axe check of your interactive layout (see `frame.test.tsx`).
