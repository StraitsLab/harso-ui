# Shopping: what the blocks cannot say honestly yet

Every shopping component (S1–S14 in the money/shopping research catalogue) has at least one example in
`catalogue/shopping.json`. Where the contract could not carry what the component needs, the example uses the nearest
honest form, and the missing piece is listed here. Nothing below was invented as a field in an example. Gap numbers
(G1…G24) are the playbook's (`catalogue-design/playbook/coverage.md`); the contract lead batches the changes.

| Component | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| S1 Product options, S2 Product grid, S4 inline comparison | shop-vacuum-options, shop-running-shoes, shop-earbuds-compare, partial-sources | A picture per product row. Product answers are image-led at every leader; without it options read as a text list. | Name, one differentiator and rating on the secondary line; the one-product answer (S3) uses the single `image` visual. | `row.image` (artifact uri) — G7 |
| S2 Product grid (many matches) | shop-running-shoes | A count of all matches when only the best are sent. `total_count` makes the gallery/app promise "View all 24" but can only show the 7 sent, so the page dead-ends. | "Top 7 of 24" in the subtitle, and a quiet `open_url` to the store's filtered result page for the rest. | None new: the app should route "View all" past the sent rows to the action's link when `total_count` exceeds the rows (renderer rule, not a field). |
| S3 Product detail | shop-product-detail | Offers AND specs both want rows; one `rows` block per card. | Offers are the rows; specs and "why it fits" go in `text` bullets. | Grouped rows (`rows_block.group` or a second rows block) — G2 |
| S6 Price history, S8 Deal | shop-price-history, shop-deal | The verdict word (low / typical / high) has no meaning the app can colour, and there is no band for the typical range. | Verdict in the title ("S$379 is low for this vacuum"), typical range in the subtitle; today is the highlighted point. | `chart.caption` (G19) for the one-line verdict; a typical range band is not proposed (the subtitle carries it without extra ink). |
| S8 Deal | shop-deal | A change beside the price ("−S$60", "−9%"). | The usual price sits in the subtitle ("Usually S$649"); no strike-through "was" price, by design. | `number.delta` (G3) if the deal moves to a numbers block. |
| S7 Price watch | shop-price-watch | Watches have no backend object yet (output-blocks "Still open"), and a failed check between runs has no per-block state. | `status(watching)` bound to a placeholder routine id; the "last check failed" stale case is not drawn because only the whole card can fail. | Per-block state (G20); the routine backend is outside the contract. |
| S11 Cart / checkout | shop-cart-summary | A totals row under the line items. | Total and delivery move into `numbers`; the checker proves the rows plus delivery add up to the total. | `rows_block.total` (G4) |
| S12 Order confirmation | shop-order-confirmed | Line items plus a total row (same as S11). | One item, so `numbers` (Paid, Arrives) carry it. | `rows_block.total` (G4) |
| S13 Delivery tracking, S14 Refund | shop-delivery, shop-delivery-missed, shop-refund | Step states (done / now / next) and a row state word the app can colour ("Out for delivery", "Delivery missed", "Refunded"). `status_block` needs a Work Unit or routine subject, so a parcel cannot be one. | Steps are rows, newest first, the state word is the row label; the arrival or the refunded amount is the title. | `row_status` meanings (done · in progress · needs you · problem) — G1; timed steps on a domain state — G16 with the subject rule relaxed. |
| S9 Review summary | shop-reviews | Nothing structural. Sentiment is two labelled lists (Liked / Some mention) instead of coloured chips, by design. | — | None |
| S10 Rating | every product example | A star glyph. Instrument Sans has no U+2605 (checked with fontTools on the kit's latin wght file). | "rated 4.6/5" as text, never "4.6★" (the F0 examples used ★; this lane removed every one). | None: renderer and copy rule. |
| Every partial state | all "partial" states | A machine-readable "N of M" (stores checked, weeks tracked). | "2 of 3 stores checked" in the subtitle; the missing store is named in the fallback. | `document.progress` — G17 |
| Every stale state | all "stale" states | A freshness time the app can age. | "As of 08:40 · couldn't refresh" in the subtitle. | `document.as_of` — G6 |
| Every failed state | all "failed" states | A retry for a lookup made in chat (no Work Unit). | No action; the detail says "Ask me again in a few minutes." | Retry without a Work Unit — G11 |

## States drawn per example

Loading, partial, stale, empty and failed are drawn wherever the component has that state. A state is left out only
where it cannot happen: a finished refund or a placed order has no partial or stale read; a logo has no stale or
empty; a new price watch has no partial read, and its "one check failed" stale case needs G20.
