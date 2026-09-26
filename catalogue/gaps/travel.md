# Catalogue gaps: travel and places

What the blocks cannot say honestly in `catalogue/travel.json` and `catalogue/places.json`, the workaround each example
uses today, and the smallest contract field that would fix it. Every row names a field that does not exist in
`docs/agent/schema/output-blocks.v1.json` (sha256 `470aa1ae…`); no example sends one. Numbers in brackets are the
playbook gap ids in `catalogue-design/playbook/coverage.md`.

| Component | Example / state | What is missing | Workaround today | Smallest fix |
|---|---|---|---|---|
| Flight status / disruption | `travel-flight-status`, `travel-flight-cancelled` | "Delayed" and "Cancelled" cannot carry the needs-you tone; `row_status` is `overdue`/`paid` only [G1] | The word goes in the title or subtitle as text | `row_status` gains a closed set mapped to the four meanings (`delayed`, `cancelled` → needs you) |
| Flight status / disruption | `travel-flight-status` | The trip's timed steps (boarding, departs, lands) cannot sit on the status block [G16] | Was/Now as two rows | `status_block.steps[{label, time, stage}]` |
| Flight status (watch) | `travel-flight-status` | "Tell me if it changes again" has no watch object to point at | The card is a one-off read with "as of"; no watch is promised | Backend watch object (Tasks → Later) before any UI |
| Every fresh card | all `fresh: true` examples, stale states | "As of" is prose in the subtitle; the app cannot age it or restyle it [G6] | "as of 09:12" / "as of 07:40 · couldn't refresh" in `header.subtitle` | `document.as_of` (RFC 3339) |
| Partial results | `travel-flights`, `travel-stay-areas`, `travel-hotels-ueno`, `places-dinner-options`, `places-nearby-map` partial | "2 of 3 airlines priced" is prose [G17] | Subtitle "N of M …" plus the rows that are in | `document.progress {done, total, noun}` |
| Partial (one block missing) | `travel-hotel-detail` partial, `places-card-photo` partial | A block that failed while the rest loaded cannot say so; the card drops it [G20] | The photo is left out and the subtitle says "photo didn't load" | `block_state {state, message}` on the visual |
| Failed lookups | every failed state | A chat lookup has no Work Unit, so there is no Retry [G11] | No action; the closing sentence says to ask again | A retry verb that re-runs the turn, or a Work Unit per lookup |
| Itinerary | `travel-itinerary` | Days are headed text sections; times are bullet prefixes, not aligned trailing values [G2, G5] | "09:00 Kiyomizu-dera" bullets per day section | `rows_block.groups[{heading, items}]` |
| Flight options, long list | `travel-flights-return` | The card cannot say "3 cheapest of 14" while keeping the other 11 reachable inline: with `total_count` the gallery's View all opens a page that cannot list rows it was never sent | "3 cheapest of 14" in the subtitle and a link to the source's own result page | A `more_url` on the rows block (the page View all opens), or send all 14 as a file |
| Opening hours | `places-hours`, `places-card-photo` | Today's row cannot be emphasised without misusing `pick` [G1] | "Hours today" as the row label | Covered by the `row_status` set (`open`/`closed`) |
| Place card | `places-cafe`, `places-card-photo` | A place's photo and its map cannot both show; `visual` is one per card | Photo when what it looks like matters (restaurant), map when where matters (cafe) | None: one visual is the law. Recorded so nobody adds a second |
| Directions | `places-directions`, `places-walk-map` | No route line; legs are rows | Legs as rows, Maps does navigation via `open_url` | None by design: Maps owns routing |
| Boarding pass | `travel-boarding-pass` | No barcode block | A Wallet file via `download_artifact` | None by design: Wallet owns the pass |
| Visa, hours sources | `travel-visa`, `places-hours` | Details sources carry a `url`, but the kit card draws the label only (`output-card.tsx` DetailsContent) | The url is sent; the person cannot open it yet | Kit: render the source as a link with the `open_url` confirmation (no contract change) |
| Reservation | `places-dinner-options`, `places-table-booked` | Choosing a time is the question card and booking is an approval; neither is a block | The results card has no Book button; the confirmation card follows the approval | None: the question card and approval are the authority |
