# HarsoOutputCard

Display-only inline card for an agent **output document** (`output-blocks.v1`,
draft contract frozen in weave-cloud packet S0). First slice: the founder-approved
**Flights** inline card (Sketch `iOS — Inline results` 01, light + dark). Exported
from `@harso/ui` with `HarsoOutputCardProps`, `HarsoOutputDocument` and the block
types it reads. Mount inside `KitProvider` and load `@harso/ui/styles.css`.

```tsx
<HarsoOutputCard
  document={validatedDocument}          // host already validated against output-blocks.v1
  onViewAll={openOutputPage}            // the host opens the full output view
  onOpenDetails={openOutputPage}        // optional; omit to disclose Details inline
/>
```

## Public surface

- `document: HarsoOutputDocument` — the parsed document. The card reads `header`,
  `rows` blocks (with `total_count`), `numbers` blocks, `text` blocks, `more_label`,
  `details` and `fallback_text`. It performs **no
  validation** and imports nothing from weave-cloud or any JSON-schema library.
- `caps?: Partial<{ maxRows: number; maxNumbers: number; maxTextChars: number; maxTextLines: number }>` —
  defaults to `HARSO_OUTPUT_CARD_CAPS` (`{ maxRows: 3, maxNumbers: 2, maxTextChars: 180, maxTextLines: 4 }`,
  the approved inline rule: ≤ 3 rows, 2-up key numbers, ~4 lines of text).
- `onViewAll()` — called once per press of the View-all row (rule 2). The card
  opens, fetches and sends nothing itself; the host shows the full output.
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
   label — the only accent on the card. Order is preserved. At most
   `caps.maxRows` rows show inline; nothing is dropped silently. The count of
   rows is, per rows block, the larger of the supplied rows and its
   `total_count`. When that count exceeds the rows shown, one quiet View-all row
   follows the rows: the document's `more_label` if present, else
   "View all N". It is a full-width ghost `Button` (grey 13 label on the row text
   edge, chevron on the values edge, real 44px box) that calls `onViewAll`.
   When everything fits, there is no View-all row.
3. **Key numbers** (`numbers`): a 2-up row of figures, value above label, left-aligned
   cells. Value 22 semibold (`--hk-text-display`, the kit's desktop stand-in for the
   iOS 28 key-number size) with tabular digits; label 13 secondary. At most
   `caps.maxNumbers` figures show inline; each further figure is added to the
   View-all count, alongside rows (e.g. three numbers → two figures + "View all 3").
   Each figure is one `li` with the value before its label in the DOM, so a screen
   reader hears "S$4,280, Spent".
4. **Text** (`text`): one plain body paragraph (14 regular). The inline text is the
   block's `summary`, else its paragraphs and bullets run together. It is cut at
   `caps.maxTextChars` code points (backed off to a word boundary, then "…"), and
   CSS clamps what remains to `caps.maxTextLines` rendered lines, because characters
   alone do not bound height across scripts (160 CJK characters are 7 lines at 420px)
   or widths. The card measures the paragraph (and re-measures on resize), so the
   View-all row appears (with `more_label`, else "View all") when the line clamp hides
   text, when the text was cut, when a `summary` stands in for
   sections, when sections carry headings or bullets, or when a second text block
   follows. Section headings and bullets never render inline.
5. Blocks render in the agent's order; budgets are shared across blocks of a kind.
6. **No actions.** The card is display-only: choices go through the host's
   native question card. `action` blocks (including the contract's still-carried
   `reply`) are accepted and render nothing — no button, no text — and never
   fall back or throw.
7. **Fallback:** if any block is not `rows`/`numbers`/`text`/`action` (visual,
   table, status, unknown), or a row carries `status` (Overdue/Paid, not styled
   yet), the card renders the header plus `fallback_text` as plain text and
   **nothing else from blocks** — no rows, numbers or text, no View-all row, never raw JSON.
8. Plain text only: no markdown, no HTML; React escaping is the only processing.
9. Accessibility: `section` named by the title; rows and key numbers are `ul/li`; Pick is text, not
   colour-only; Escape inside an open disclosure closes it and returns focus to
   Details, otherwise Escape bubbles to the host.

## Visual contract

Borderless tonal card: `--hk-surface` fill, `--hk-radius-card` (12), 16px padding,
16px rhythm between header, rows and the View-all row; zero enabled border/outline on any
element (keyboard focus rings excepted). Type sizes, colours, radii and the main
spacing rhythm come from `--hk-*` tokens, so light, dark and the warm (`cozy`)
palette work unchanged; a few small geometry values (2px row gaps, the Pick
capsule padding, the Details toggle's optical margin, line heights and the 44px
target) are literal. In forced-colors mode (Windows High Contrast) the card and
controls deliberately gain system-colour outlines, because tonal fills disappear
there; this is an accessibility exception to the borderless rule.

## Fixture and proof

`/preview/output-card.html` (served by Vite, not a gallery route). Documents are
verbatim copies of the S0 examples; callbacks are simulated counters.
`doc=more` is synthetic: the Flights rows plus four more (seven against the cap
of three). `doc=numbers` is the Spending example's numbers block alone (charts
render in a later packet). `doc=brief` is S0 example 05; `doc=text` is a synthetic
long paragraph with no summary. Query:
`doc=flights|failed|spending|more|numbers|brief|text`, `mode=dark`,
`palette=cozy`, `hostDetails=1`.

```sh
npm run check
npm test -- src/chat/output-card.test.tsx
HARSO_UI_PORT=<free port> npx playwright test tests/harso-output-card.spec.ts
```

The Playwright spec shoots light + dark at 420px, runs Axe on the card, asserts
zero borders, 12px radius, surface fill, ≥44px targets, no overlap, no action
button, the View-all row (light + dark), key numbers and text (light + dark: sizes,
2-up geometry, ≤ 4 text lines at 420px, CJK text clamped to 4 lines with View all,
a short sentence with none, and the clamp following width changes) and the fallback path. Not covered here:
the host's inline-vs-page decision and full output view, transport, live data,
visual/table/status blocks and installed-app acceptance.
