# Gaps: homes and jobs (catalogue/real_estate.json, catalogue/jobs.json)

These are the places where the output-blocks v1 contract cannot express a home or job answer honestly. Each row names
the example that uses the nearest honest workaround and the smallest field that would fix it. Numbers in the G column
refer to the shared list in `catalogue-design/playbook/coverage.md`; "new" means that list does not have the row yet.
No example invents a field.

| Component | Example | What is missing | Workaround used now | Smallest contract fix | G |
|---|---|---|---|---|---|
| R3 Map + listings | `home-listing-results` | Price on the pin (Zillow draws the asking price on each pin). `place.label` is a 40-character name, with no short value. | Pins carry the block name. The price is on the matching row below the map. | `place.value` (line12, e.g. "S$548k") | new (B0 D4, not drawn) |
| R2 Listing results | `home-listing-results`, `home-rent-listings` | A photo on each listing row | Text rows. A single listing uses the one `image` visual (`home-listing-card`). | `row.image` (artifact_uri) | G7 |
| R5 Price history | `home-price-history` | The change between sales on each row | Rows show the price only. The rise goes in the sentence ("about 12% in two years"). | `row.delta` (line12) | G3 |
| J5 Application status | `jobs-applications` | State meaning for Interview / Viewed / Not selected | The word goes in `secondary` with no colour meaning. | `row.state {word, meaning: done, in progress, needs you, problem}` | G1 |
| J6 Application pipeline | `jobs-pipeline` | Ordered steps with done / now / next | Rows are newest first. "Next" and "Passed" go in `trailing`. | `status_block.steps[{label, time, stage}]` | G16 |
| J4 Offer comparison | `jobs-offers` | An emphasised total row | The last table row is labelled "Total" and has no emphasis. | `table_row.total: true` | G4 |
| Every partial state | `states.partial` on listing and job searches | "1 of 2 portals checked" as data the app can draw | Written into `header.subtitle` | `document.progress {done, total, noun}` | G17 |
| Every stale state | `states.stale` | When the data was read, as data | "As of 09:30 · couldn't refresh" in `header.subtitle` | `document.as_of` | G6 |
| Every loading state | `states.loading` | A lookup made in chat has no Work Unit, but `status(working)` needs a subject | Each loading state names a placeholder Work Unit id (`…4e0bNN`), as money-portfolio does. This is only honest if the backend opens a Work Unit for the lookup. | `block_state` on the card with no subject (per-block state) | G20 |
| Every failed state | `states.failed` | A Retry for a chat lookup (the only retry verb is `work_control`) | No action. The closing sentence says to ask again. | a retry verb that needs no Work Unit | G11 |

## Which states each answer has (applicability matrix)

A state is drawn when the request can actually produce it, decided from what the answer reads, never from its `fresh`
flag (`fresh` only says whether the subtitle carries an "as of" time).

- **Loading / failed:** every answer that fetches or makes something.
- **Partial:** the answer reads two or more independent inputs that can arrive apart.
- **Stale:** the answer shows something that can change after it was read (a listing, a price, availability, a posting,
  an application status, a calendar entry), so a failed refresh can leave an old version on screen.
- **Empty:** a lookup that can honestly find nothing.

| Example | Reads | L | P | S | E | F | Why a state is absent |
|---|---|---|---|---|---|---|---|
| `home-listing-results` | PropertyGuru + HDB Flat Portal | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `home-listing-card` | one listing (details, then photos) | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `home-rent-listings` | 99.co + PropertyGuru | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `empty-search` | PropertyGuru + 99.co | ✓ | ✓ | ✓ | – | ✓ | It is itself the empty answer. |
| `home-open-houses` | PropertyGuru open houses | ✓ | – | ✓ | ✓ | ✓ | One source: whole or failed. |
| `home-viewing` | your calendar | ✓ | – | ✓ | ✓ | ✓ | One source. |
| `home-value-estimate` | URA caveats, last 6 months | ✓ | – | ✓ | ✓ | ✓ | One source. Stale applies: old sales do not change, but the rolling six-month window does (new sales, older ones dropping out), so a failed refresh leaves the last good estimate, dated. |
| `home-price-history` | HDB resale records | ✓ | – | – | ✓ | ✓ | One source; completed sales never change. |
| `home-facts` | URA + project page | ✓ | ✓ | ✓ | ✓ | ✓ | Stale applies: tenure and completion are fixed, but the monthly maintenance fee can change, so a failed refresh leaves the last good facts, dated. |
| `home-schools` | OneMap | ✓ | – | – | ✓ | ✓ | One source; distances and schools do not change between reads. |
| `home-affordability`, `home-monthly-cost` | your own numbers | – | – | – | – | – | Pure calculation: nothing is fetched. A bad input is a question, not a card. |
| `file-calculator-page` | makes a file | ✓ | – | – | – | ✓ | A delivered file does not change or go stale, and making one cannot find nothing. |
| `jobs-results` | LinkedIn + MyCareersFuture | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `jobs-remote-results` | LinkedIn | ✓ | – | ✓ | ✓ | ✓ | One source. |
| `jobs-posting` | Grab careers | ✓ | – | ✓ | ✓ | ✓ | One source. |
| `jobs-applications` | LinkedIn + Gmail | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `jobs-pipeline` | Gmail from Grab | ✓ | – | ✓ | ✓ | ✓ | One source. |
| `jobs-interviews` | your calendar | ✓ | – | ✓ | ✓ | ✓ | One source. |
| `jobs-salary` | MOM wage table + Glassdoor | ✓ | ✓ | – | ✓ | ✓ | Published pay figures for a period, not live data. |
| `jobs-offers` | two offer letters you have | ✓ | ✓ | – | – | ✓ | Letters are fixed documents; you named both, so neither can be missing (an unreadable one is failed). |
| `jobs-fit` | the posting + your CV | ✓ | – | – | – | ✓ | A comparison needs both inputs, so half of it is not an answer; it is recomputed on each ask; a removed posting is `jobs-posting` empty. |
| `file-resume` | makes a file | ✓ | – | – | – | ✓ | Delivered file, as above. |
| `jobs-alert` | sets up a routine | ✓ | – | – | – | ✓ | A set-up confirmation: nothing is read, so nothing can be partial, stale or empty. Later matches are their own results. |

Words-only answers (plain text examples) have no card and so no states.

## Visual acceptance (lead ruling 2026-09-26: split from this PR)

This PR is accepted on data. The visual floor (QUALITY-BAR 9+) is a separate lead gate run on the whole catalogue once
the renderer prerequisites land; these examples wait on them and need no data change:

| What a person would miss today | Examples | Prerequisite |
|---|---|---|
| Status, table, map and image blocks draw as a fallback paragraph | every loading/failed/empty state; `jobs-offers`, `home-facts` tables; `home-listing-results` map; `home-listing-card` photo | charts/tables PR #11; status/media P5c (on #11's branch); a media host in the gallery |
| Actions and linked sources are not drawn | `home-listing-card` View listing, `home-viewing` Directions, `jobs-posting` Apply, `jobs-remote-results` See all 23, `file-resume`, `file-calculator-page`, `jobs-alert` Pause | P5d (t_451b1e32) |

Loading-state note for the lead: the playbook says the agent never sends a loading card; the app draws it. The loading
documents here are gallery fixtures of that app state, and their `work_unit_id` subjects are placeholders the schema
needs (row G20 above). They are not examples of something the agent should send.

## States deliberately not drawn (superseded)

The matrix above replaces the earlier reasoning that stable (`fresh: false`) records cannot go stale. That was wrong:
application status, pipelines, interviews and viewings change after they are read, and now have stale states. So do
a rolling-window value estimate and a facts card that includes a monthly fee: an immutable fact inside an answer does
not make the whole answer immutable.
