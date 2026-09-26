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
| Source list (links) | A link must open the original article, so an illustrative story has no honest URL. | Illustrative rows (headlines, the MRT brief, the haze brief) name their outlet and time in Details with no URL. Rows that need links (news-sources, news-timeline) use real, retrievable 2025–26 reporting on Grab–GoTo | news-headlines, news-brief, news-brief-haze | none. This is a data rule, not a field | new |
| Menu (daily) | Some restaurants have no menu page (Burnt Ends writes a new menu daily). | The link is the restaurant's own page, labelled "Burnt Ends website", not "Full menu"; Details says the menu is daily | food-menu | none | new |
| Cooking timer | Nothing. It is a routine with `status: scheduled` and one Pause. | as the component | food-timer | none | not a gap |

## States that the blocks cannot express

- **Per-block staleness (G20).** A stale weather, score or menu card says "as of HH:MM · couldn’t refresh" in the
  subtitle and repeats the last good blocks. The app cannot dim the old values or mark which block is stale until
  `block_state` exists.
- **Partial (G17).** "5 of 7 days reported" and "2 of 3 sources read" are subtitle text. Missing chart points are
  `null`, never `0` (food-nutrition-week partial: Thursday and Sunday are `null`).
- **Retry (G11).** A failed chat lookup (forecast, score, menu, news) has no Work Unit, so it carries no Retry action.
  The failed card says what did not respond, and the closing sentence tells the person to ask again.

## State applicability (every card example)

Y = the example sends that state. N/A = the state cannot honestly occur for that request; the reason is given. Text
answers (text-weather-simple, text-single-fact) are words only, so they are exempt. Loading and failed apply to every
card, because every card waits on a read or a write.

| Example | loading | partial | stale | empty | failed | Why a state is N/A |
|---|---|---|---|---|---|---|
| food-recipe | Y | N/A | N/A | N/A | Y | A recipe is stable (fresh: false), so it cannot go stale. Half a method is unsafe to cook from, so there is no partial. A standard dish always has recipes; "nothing matched" is food-recipe-pantry's empty |
| food-recipe-pantry | Y | N/A | N/A | Y | Y | Stable, and no partial, as for food-recipe |
| food-nutrition | Y | Y | N/A | Y | Y | Reference data (fresh: false) does not go stale |
| food-nutrition-week | Y | Y | Y | Y | Y | |
| food-menu | Y | Y | Y | Y | Y | |
| food-menu-section | Y | Y | Y | N/A | Y | The request names a section the restaurant is known for. A menu that isn't online is food-menu's empty |
| food-timer | Y | N/A | N/A | N/A | Y | It is one write, not a read: nothing to be partial, old or empty. A failed write says the outcome couldn't be confirmed and to check before asking again |
| weather-now | Y | Y | Y | N/A | Y | A forecast always exists for a place and time; no reading is a failure, not an empty |
| weather-tomorrow | Y | Y | Y | N/A | Y | As weather-now |
| weather-week | Y | Y | Y | N/A | Y | As weather-now |
| weather-alert | Y | Y | Y | Y | Y | |
| weather-alert-typhoon | Y | Y | Y | Y | Y | |
| sports-score | Y | Y | Y | Y | Y | |
| sports-live | Y | Y | Y | Y | Y | |
| sports-match-feed | Y | Y | Y | Y | Y | |
| sports-standings | Y | Y | Y | N/A | Y | A league in season always has a table; a missing read is failed |
| sports-standings-f1 | Y | Y | Y | N/A | Y | As sports-standings |
| sports-fixtures | Y | Y | Y | N/A | Y | A club in season always has fixtures. The off-season is a different request ("when does the season start") |
| sports-f1-weekend | Y | Y | Y | N/A | Y | The race is on the published calendar; before the timetable is out, the partial (practice times not out yet) is the honest state |
| news-brief | Y | Y | Y | Y | Y | |
| news-brief-haze | Y | Y | Y | Y | Y | |
| news-timeline | Y | Y | Y | Y | Y | |
| news-headlines | Y | Y | Y | N/A | Y | Front pages always carry headlines; unreadable front pages are failed or partial |
| news-sources | Y | Y | Y | Y | Y | |

Negative states say only what was checked ("None of the 40 outlets searched", "None of the 3 recipe sites checked").
They never say "no one" or "nothing exists".

## Renderer prerequisites (lead ruling 2026-09-26: visual acceptance is a separate gate)

The gallery draws status, chart and table blocks as their fallback sentence, and it drops actions and source links, until
PR #11 (charts, tables, status) and P5d (actions and linked sources, t_451b1e32) land. These examples rely on them:
weather-now, weather-tomorrow and food-nutrition-week (charts); sports-standings and sports-standings-f1 (tables);
food-timer and every loading, empty and failed state (status); food-menu, food-menu-section and the standings
(open_url); food-timer (Pause); news-sources and news-timeline (article links in Details). The sheets should be
re-shot then. This lane changes no renderer file.
