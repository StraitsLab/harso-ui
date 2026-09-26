# Contract gaps: food, weather, sports, news

Lane CAT-food-weather, 2026-09-26. Each row is a component that the `output-blocks.v1` blocks cannot express honestly.
The example named in the row sends the nearest honest workaround and nothing more. The last column gives the smallest
contract field that would fix it. No example invents a field. Numbers such as G2 refer to the playbook's coverage table
(`catalogue-design/playbook/coverage.md`). "new" means this lane found the gap.

| Component | What is missing | Workaround the example sends | Examples | Smallest field that fixes it | Ref |
|---|---|---|---|---|---|
| Recipe | Ordered steps. Method steps are numbered by hand. | Paragraphs that start "1.", "2." inside a `Method` section | food-recipe, food-recipe-pantry | `section.ordered: true` | G5 |
| Menu | Grouped rows (courses). Only one `rows` block is allowed per document. | One course per card (food-menu-section), or three highlights with the full menu linked (food-menu) | food-menu, food-menu-section | `row.group` (line24), drawn as a section header between runs | G2 |
| Current + forecast | A second measure on the forecast line. `chart.unit` is chart-wide, so rain chance (%) cannot sit beside temperature (°C). | Temperature is the line; the rain chance is one key number (value "60%", label "Showers after 14:00") | weather-now, weather-tomorrow | `series.unit` (line12), overriding `chart.unit` for that series | new |
| Current + forecast (week) | Today, or the day the sentence names, cannot be marked in rows without misusing `pick` (which means "recommended"). | No row is marked. The day the sentence names (Wed, rain) is in the sentence only | weather-week | `row.mark: "current"` beside `"pick"` | new (R1 G8) |
| Severe-weather alert | An urgent state with no Work Unit. `needs_attention` requires a `subject`, so a warning cannot use a status block or the attention colour. | The warning and its time go in `header.title`; what to do goes in one text paragraph; the authority goes in Details. The renderer must never truncate the title | weather-alert, weather-alert-typhoon | allow `status.subject` to be absent for `needs_attention` when `details.sources` is present | G10 |
| Scoreboard (live) | Match clock. The minute is only text in the subtitle, so the app cannot age it or show that the match is in play. | `"67' · second half · as of 23:12"` in the subtitle; `fresh: true`; a final-score watch is a separate request | sports-live, sports-score (stale) | `document.as_of` (G6) covers the time; nothing more is needed for the minute | G6 |
| Standings | Your team cannot be emphasised in a table. `table_row` has only `cells` and `status`. | The team is named in the sentence; its row is not marked | sports-standings, sports-standings-f1 | `table_row.mark: "current"` (the same value as the row mark above) | new (R1 G8) |
| Source list | Row link. A headline row cannot open its article. | Each article link is a `details.sources` entry in row order | news-sources, news-headlines, news-timeline | `row.url` (https_url), opened with the same confirmation as `open_url` | G8 |
| Story timeline / match feed | Event kind. A goal, a card or a deal milestone is only a word in the label. | "Goal · Saka", "Red card · Caicedo" as the label, newest first, so the result is inline | sports-match-feed, news-timeline | none. The words are clear; no icon set (the flow score would fall) | not a gap |
| Nutrition (week) | Daily target line on the bar chart. | The average goes in a number; no target is drawn | food-nutrition-week | `chart.target` (decimal) | G9 |
| Cooking timer | Nothing. It is a routine with `status: scheduled` and one Pause. | as the component | food-timer | none | not a gap |

## States that the blocks cannot express

- **Per-block staleness (G20).** A stale weather, score or menu card says "as of HH:MM · couldn’t refresh" in the
  subtitle and repeats the last good blocks. The app cannot dim the old values or mark which block is stale until
  `block_state` exists.
- **Partial (G17).** "5 of 7 days reported" and "2 of 3 sources read" are subtitle text. Missing chart points are
  `null`, never `0` (food-nutrition-week partial: Thursday and Sunday are `null`).
- **Retry (G11).** A failed chat lookup (forecast, score, menu, news) has no Work Unit, so it carries no Retry action.
  The failed card says what did not respond, and the closing sentence tells the person to ask again.
