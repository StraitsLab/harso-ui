# HarsoOutputCard

Display-only inline card for an agent **output document** (`output-blocks.v1`,
draft contract frozen in weave-cloud packet S0). First slice: the founder-approved
**Flights** inline card (Sketch `iOS — Inline results` 01, light + dark). Exported
from `@harso/ui` with `HarsoOutputCardProps`, `HarsoOutputDocument` and the block
types it reads. Mount inside `KitProvider` and load `@harso/ui/styles.css`.

```tsx
<HarsoOutputCard
  document={validatedDocument}          // host already validated against output-blocks.v1
  onReply={text => composer.prefill(text)} // or send; the host decides
  onOpenDetails={openOutputPage}        // optional; omit to disclose Details inline
/>
```

## Public surface

- `document: HarsoOutputDocument` — the parsed document. The card reads `header`,
  `rows` and `action` blocks, `details` and `fallback_text`. It performs **no
  validation** and imports nothing from weave-cloud or any JSON-schema library.
- `caps?: Partial<{ maxRows: number }>` — defaults to `HARSO_OUTPUT_CARD_CAPS`
  (`{ maxRows: 3 }`, the approved inline rule).
- `onReply(text: string)` — called once per press of a `reply` action with the
  action's `text` (never its `label`). The card sends nothing itself.
- `onOpenDetails?()` — if supplied, the Details control hands off to the host (e.g.
  a full output page). If omitted and `document.details` has content, Details is a
  local nonmodal disclosure listing sources, assumptions and disclaimers as plain
  text (source URLs are not linked in this slice).
- `className?: string`.

## Rendering rules

1. **Header:** title (15 semibold, `--hk-text-title`) + optional subtitle
   (13 secondary). Never the large title. Long titles wrap; nothing truncates.
2. **Rows:** a list. Label 14 semibold, optional secondary line 13, trailing value
   13 secondary, right-aligned on the label's baseline. `mark: "pick"` renders a
   text **Pick** capsule (`--hk-accent-soft` fill, `--hk-accent` text) after the
   label — the only accent on the card. Order is preserved. Rows beyond
   `caps.maxRows` are dropped silently; **overflow / "View all" / `more_label` /
   `total_count` are a later packet.**
3. **Action:** the first action block's `primary` (else `secondary`) as one
   full-width kit `Button` (`variant="primary"` for primary), real 44px minimum
   box. Only `reply` is operable; any other action kind renders disabled with the
   visible, associated reason "Not available here yet".
4. **Fallback:** if any block is not `rows`/`action` (visual, numbers, text,
   table, status, unknown), or a row carries `status` (Overdue/Paid, not styled
   yet), the card renders the header plus `fallback_text` as plain text and
   **nothing else from blocks** — no rows, no action, never raw JSON.
5. Plain text only: no markdown, no HTML; React escaping is the only processing.
6. Accessibility: `section` named by the title; rows are `ul/li`; Pick is text, not
   colour-only; Escape inside an open disclosure closes it and returns focus to
   Details, otherwise Escape bubbles to the host.

## Visual contract

Borderless tonal card: `--hk-surface` fill, `--hk-radius-card` (12), 16px padding,
16px rhythm between header, rows and action; zero enabled border/outline on any
element (keyboard focus rings excepted). All type, colour, radius and spacing come
from `--hk-*` tokens, so light, dark and the warm (`cozy`) palette work unchanged.
Forced colors adds a card outline and control borders.

## Fixture and proof

`/preview/output-card.html` (served by Vite, not a gallery route). Documents are
verbatim copies of the S0 examples; callbacks are simulated counters.
Query: `doc=flights|failed|spending`, `mode=dark`, `palette=cozy`, `hostDetails=1`.

```sh
npm run check
npm test -- src/chat/output-card.test.tsx
HARSO_UI_PORT=<free port> npx playwright test tests/harso-output-card.spec.ts
```

The Playwright spec shoots light + dark at 420px, runs Axe on the card, asserts
zero borders, 12px radius, surface fill, ≥44px targets, no overlap, and the
fallback path. Not covered here: the host's inline-vs-page decision, transport,
live data, other block kinds, overflow/"View all" and installed-app acceptance.
