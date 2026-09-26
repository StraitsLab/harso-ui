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

## States deliberately not drawn

A state is included only where it can actually happen, and none is written to fill a grid.

- **Pure calculations** (`home-affordability`, `home-monthly-cost`) have no states at all. The agent computes them
  from the person's own numbers. Nothing is fetched, so nothing can be loading, partial, stale, empty or failed. A
  bad input is a question, not a failed card.
- **Stable records** (`home-value-estimate`, `home-price-history`, `home-schools`, `home-facts`, `jobs-salary`,
  `jobs-offers`, `jobs-pipeline`, `jobs-interviews`, `jobs-applications`, `jobs-fit`, `home-viewing`) have no stale
  state. Their `fresh` is false, so no "as of" time exists that could go stale.
- **Partial** appears only when an answer reads two or more sources and one can arrive first: two listing portals,
  two job sites, LinkedIn with Gmail, or a table with one fact still missing. A single-source answer is either whole
  or failed.
- `empty-search` is itself the empty answer, so it has loading and failed only.
- **Empty** is left out where nothing is looked up (making a file, setting an alert). `file-calculator-page`,
  `file-resume` and `jobs-alert` have loading and failed only. `jobs-offers` reads two letters the person already
  has, so it has no empty state either.
