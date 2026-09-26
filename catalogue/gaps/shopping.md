# Shopping: what the blocks cannot say honestly yet

Every shopping component (S1–S14 in the money/shopping research catalogue) has at least one example in
`catalogue/shopping.json`. Where the contract could not carry what the component needs, the example uses the nearest
honest form, and the missing piece is listed here. Nothing below was invented as a field in an example. Gap numbers
(G1…G24) are the playbook's (`catalogue-design/playbook/coverage.md`); the contract lead batches the changes.

| Component | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| S1 Product options, S2 Product grid, S4 inline comparison | shop-vacuum-options, shop-running-shoes, shop-earbuds-compare, partial-sources | A picture per product row. Product answers are image-led at every leader; without it options read as a text list. | Name, one differentiator and rating on the secondary line; the one-product answer (S3) uses the single `image` visual. | `row.image` (artifact uri) — G7 |
| S2 Product grid (many matches) | shop-running-shoes | A count of all matches when only the best are sent, and a place to see the rest. The 24 matches span three stores, and no store page holds another store's results, so no one link can honestly promise "all 24". `total_count` would make the app promise "View all 24" and dead-end at the 7 sent. | "Top 7 of 24 from 3 stores" in the subtitle; the fallback lists all 7 with price, type and rating; a quiet link labelled for what it opens ("Men's shoes at Running Lab", HTTP 200 checked 26 Sep). | A file artifact holding the full 24 (no contract change: `open_artifact` already exists), or a merged-results page when Harso has live pages. |
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

Loading, partial, stale, empty and failed are drawn for every example whose request can meet them. A lookup is never
exempt because the thing it looks up is finished: an order, a delivery or a refund is read from sources (email, the
merchant, the carrier, the card feed) that can each answer late, answer alone, or be cached. Those reads get partial
and stale states like any other. Only the cells below are left out, each for the reason given:

| Example | State left out | Why it cannot happen for this request |
|---|---|---|
| partial-sources | partial | The main answer is the partial case (3 of 4 stores answered); a second copy adds nothing. |
| shop-compare-phones, shop-earbuds-compare | empty | Both products are named and on sale; their fixed specs cannot come back empty. A missing test or price is the partial state. |
| shop-price-watch | stale | Real, but not drawable: "the last check failed" belongs to one block between runs, and only a whole card can have a state (G20, row above). |
| shop-price-watch | empty | Creating a watch has nothing to find; "no price below the target yet" is the watch itself. |
| shop-delivery-missed | empty | The request names a delivery that already came; "not shipped yet" is shop-delivery's empty state. |
| file-logo | partial, stale, empty | A finished image is one artifact: it has no partial read, no age and cannot come back empty. |
| text-clarify-free | all | A words-only reply sends no card, so it has no card states. |

Failed and empty lookups say what was observed, never a real-world outcome they did not see: "I couldn't reach your
email, so I can't say whether it went through. Check Courts before you order again", not "Nothing was ordered".

