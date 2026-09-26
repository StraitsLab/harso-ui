# Learning and health: what the blocks cannot say honestly yet

Examples: `catalogue/education.json`, `catalogue/health.json`. Each row names the example that works around the gap,
what it sends today, and the smallest contract field that would fix it. No example invents a field. Gaps the playbook
already numbers (G1 row state meanings, G2 grouped rows, G5 ordered steps, in `catalogue-design/playbook/coverage.md`)
are referenced, not repeated.

| # | Example (component) | What is missing | What the example sends today | Smallest contract field that fixes it |
|---|---|---|---|---|
| LH-1 | `health-resting-hr`, `health-sleep` (Metric trend) | A target or usual-range line on a line/bar chart | No line. The usual range, if the agent names it, goes in the sentence | `chart.target`: `{ value: decimal, label: line24 }`, optional, one per chart |
| LH-2 | `edu-worked-example`, `edu-worked-circle` (Worked example) | Math notation. Fields are plain strings: no fractions, roots or stacked exponents | Unicode only (`π × r²`, `5² = 25`, `≈`). Works for arithmetic and linear algebra; a fraction-heavy problem would need an image file | Owner decision, not a field: math as a rendered image (existing `image` + artifact), or a `text` math run. Until then, keep worked examples to what Unicode shows exactly |
| LH-3 | `edu-worked-example`, `edu-worked-circle` (Worked example) | Ordered steps (G5) | Numbered paragraphs (`"1. …"`) in one section | `section.ordered: boolean` (G5) |
| LH-4 | `edu-quiz-review` (Quiz), `health-meds-taken` (Medication) | Row state words with a meaning (G1): "Not quite" = needs you, "Taken" = done, "Due 22:00" = needs you | The word goes in `trailing`; no colour meaning | `row.status` widened to the four meanings, with the word as its own field (G1) |
| LH-5 | `health-workout`, `health-workout-strength` (Workout plan) | A group heading per phase when a plan has more than one step per phase (G2) | One row per phase; repeats go in the label ("3 rounds: squats, push-ups, lunges") | `rows.heading: line40`, or grouped rows (G2) |
| LH-6 | `health-symptom` failed state (Symptom check) | A way to say "part of this answer failed, the rest still stands" | The urgent text keeps its summary and the status block says the guide didn't load | None needed: text plus a `failed` status already say it. Renderer rule: never truncate `summary` when the title is an urgent instruction |
| LH-7 | `edu-quiz-result` partial (Quiz) | A quiz stopped part-way has no progress field | "stopped after 7 of 10" in the subtitle, the score as "5 of 7" | None; the subtitle carries it |

## Not a contract gap: the kit card draws a paragraph for these (renderer, outside this lane)

`HarsoOutputCard` (`src/chat/output-card.tsx:115-146`) draws only header, rows, numbers, text and action. Any `visual`
or `status` block, or a row with `status`, makes the whole card draw `fallback_text` as a paragraph. So the charts in
`health-resting-hr`, `health-sleep`, `health-steps-week`, `edu-lesson`, `edu-progress`, the images in `edu-diagram`
and `file-lesson-handout`, and every loading/empty/failed state (a status block) show as their fallback paragraph on
the contact sheets. That is why every fallback here carries each number the chart shows. Across the whole catalogue,
75 of 163 documents (main answers plus states) fall back this way. The fix is the output-card renderer lanes (charts,
status, media), not new examples.

## Decided on purpose (no gap)

- Flashcards: the deck is a file (`file-flashcards-deck`), practice is the question card one card at a time
  (`text-flashcards`). No flip card (R1 rejection, G-B1-4).
- Logging a dose is a question card, never a Taken button on the card; the only card control is the reminder
  routine's Pause (`health-meds-taken`).
- Starting a workout belongs to the watch; the plan has no Start button.
- An urgent symptom answer puts "Call 995 now" in the title and summary, never behind Details (playbook law 5
  exception); its failed state still carries it.
