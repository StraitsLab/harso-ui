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
the contact sheets. So every fallback here names each chart reading with its label and unit (a day, week or year),
every number the card shows, and each reading that is missing ("15 Sep no readings", "Fri hasn't synced"). The
rework probe (in the PR) checks this for every document in both files. Across the whole catalogue,
75 of 163 documents (main answers plus states) fall back this way. The fix is the output-card renderer lanes (charts,
status, media), not new examples.

The same card skips `action` blocks unread (`src/chat/output-card.tsx:114-116`, `:145`), so `file-flashcards-deck`'s
Download deck and `health-meds-taken`'s Pause reminders do not draw on the sheets either. The documents carry them;
the renderer lane draws them.

## Which states each component has

`yes` = the catalogue has that state (example id). `n/a` = the state cannot happen for that component, with the reason.
No state is invented to fill the grid.

| Component | Loading | Partial | Stale | Empty | Failed |
|---|---|---|---|---|---|
| K01 Lesson | yes `edu-lesson-notes` | yes (2 pages unreadable) | yes (older copy of the notes) | yes (no chapter 4) | yes (PDF locked) |
| K01 Lesson, general topic (`edu-lesson`) | n/a: explained from knowledge, nothing to read | n/a | n/a: not time-bound | n/a | n/a: the same answer as `edu-lesson-notes` when a source fails |
| K02 Flashcards (deck file) | yes `file-flashcards-deck` | n/a: the file is written whole or not at all | n/a: a file does not age | n/a: made from misses the person names | yes |
| K02 Flashcards (recall) | n/a: a sentence (`text-flashcards`), no card | n/a | n/a | n/a | n/a |
| K03 Quiz | yes `edu-quiz-result` | yes (stopped after 7 of 10) | yes (study log couldn't refresh) | yes (no quiz yet) | yes (study log didn't load) |
| K03 Quiz review (`edu-quiz-review`) | n/a: same read as `edu-quiz-result`, whose states cover it | n/a | n/a | n/a: with no misses the answer is the result card | n/a |
| K04 Progress / streak | yes `edu-progress` | yes (Fri not synced, `null` bar) | yes | yes (nothing logged in 7 days) | yes |
| K05 Worked example | n/a: computed in the answer, nothing to read | n/a | n/a: maths does not age | n/a | n/a |
| K06 Glossary, general terms (`edu-glossary`) | n/a: from knowledge | n/a | n/a | n/a | n/a |
| K06 Glossary from a document | yes `edu-glossary-insurance` | n/a: terms are listed whole | n/a: a letter does not age | n/a: a letter with no terms is a sentence | yes (photo too blurred) |
| K07 Diagram | yes `edu-diagram` | n/a: an image renders whole or not at all | n/a | n/a | yes |
| Lesson handout (worksheet file) | yes `file-lesson-handout` | n/a: the PDF is written whole | n/a | n/a | yes |
| K08 Metric trend | yes: all three of `health-resting-hr`, `health-sleep`, `health-steps-week` | yes | yes | yes | yes |
| K09 Workout plan | n/a: planned from the request, nothing to read | n/a | n/a: a plan for tomorrow does not age | n/a | n/a |
| K10 Medication schedule | yes `health-meds-taken` | yes (one medicine logged in another app) | yes (log as of 18:00, don't double-dose) | yes `health-meds` (no list) | yes (both) |
| K11 Symptom check | n/a: advice must not wait; an urgent answer never shows a loading card | n/a | n/a: advice does not age | n/a | yes `health-symptom` (guide failed, 995 still first) |

Loading states exist only where the agent reads something slow (a file, Apple Health, the study log) or makes a file.

## Decided on purpose (no gap)

- Flashcards: the deck is a file (`file-flashcards-deck`), practice is the question card one card at a time
  (`text-flashcards`). No flip card (R1 rejection, G-B1-4).
- Logging a dose is a question card, never a Taken button on the card; the only card control is the reminder
  routine's Pause (`health-meds-taken`).
- Starting a workout belongs to the watch; the plan has no Start button.
- An urgent symptom answer puts "Call 995 now" in the title and summary, never behind Details (playbook law 5
  exception); its failed state still carries it.
