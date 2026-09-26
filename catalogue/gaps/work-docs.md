# Catalogue gaps: work and documents

Components from the sources (output-library-r1 catalogue rows for productivity and documents, formats.md, B1
knowledge-docs K12–K20 and F01–F05) that the v1 blocks cannot express honestly. Each has the nearest honest example in
`catalogue/productivity.json` or `catalogue/documents.json`. Nothing here adds a field; the lead batches contract
changes. Gaps already numbered in the playbook (G1–G24) are cited, not repeated as new.

| # | Component | What the blocks cannot say | Nearest honest example | Smallest contract field that fixes it |
|---|---|---|---|---|
| WD-1 | Schedule / calendar (week) | Day headings. One rows block per document (G2), so a week is one flat list with the day repeated in each row's secondary. | `prod-week-schedule` | `rows_block.items[].group` (a line24 heading the app draws once per run of equal values); same fix as G2 |
| WD-2 | Meeting notes; Checklist; Kanban / status list; Signature request; Contract clauses | Row state meanings beyond `overdue`/`paid` (G1). "Blocked", "Signed", "Declined", "Review", "Not opened" are words in `trailing` or `secondary`; the app cannot colour them by meaning (done / in progress / needs you / problem). | `prod-launch-status`, `docs-signatures`, `docs-signatures-declined`, `docs-contract-review` | `row_status` enum widened to the four meanings, with the word kept in `trailing` (G1) |
| WD-3 | Meeting notes | Decisions and actions as two grouped lists. Decisions go in text bullets, actions in rows (G2). Works, but a decision cannot carry an owner. | `prod-meeting-notes` | Same `group` field as WD-1 |
| WD-4 | Contract summary with clauses | Per-clause citation. Clause references are written into the row label ("§8.2 · Liability cap"); `details.sources` is document-level only. | `docs-contract-summary`, `docs-contract-review` | `row.source_index` (integer into `details.sources`) (G-B1-6) |
| WD-5 | Citation list | A row cannot open its own source (G8). The list is rows; the links stay in Details. | `docs-sources` | `row.url` (https) (G8) |
| WD-6 | Email draft preview | Line breaks inside a paragraph. Greeting, body and sign-off are three paragraphs; "Kind regards, name" cannot break across two lines. | `prod-email-draft-team`, `file-notice-letter` | None if renderers honour `\n` in `paragraphs[]`; otherwise allow `\n` in `line600` (G-B1-10) |
| WD-7 | Email draft preview | An `open_url` to "the draft" can only point at the Drafts folder; the draft id is not a public https link. | `prod-email-draft-team` | `action_open_url` is enough once the connector returns a per-draft https link; no contract change |
| WD-8 | PDF / Slides / Live page previews | Image caption (G22). Page count and format go in `header.subtitle`. | `file-report-pdf`, `file-deck`, `file-pricing-page` | `image.caption` (G22) |
| WD-9 | PDF (fixed layout) · page view | The pane shows page 1 only; further pages cannot be sent as a stack (one visual per card). | `file-report-pdf` | None for the card; the pane's page view is the app's job once it previews PDFs (D5) |
| WD-10 | Live page | The locked sandbox pane has not shipped (G15). The page is a file with a poster; the card says "open it in your browser". | `file-pricing-page` | None (security review, then the playbook changes) |
| WD-11 | Report / Sheet / Deck, partial | A file that is still being made has no artifact to open, so a "partial" file card would show a button that does nothing. Files have loading and failed only; progress ("12 of 18 interviews read") lives in the working status detail. | `docs-report`, `file-contracts-sheet` | None; recorded so nobody draws a partial file card |
| WD-12 | Comparison (table) | Only four columns fit a phone, and no column can be marked as the pick; the pick stays on the inline rows version. | `docs-compare-table`, `docs-compare-plans` | None (law 4 by design) |
