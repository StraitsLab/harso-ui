# Delivery: what the blocks cannot say honestly yet

Food delivery (Swiggy, Zomato, GrabFood, DoorDash, Uber Eats) and quick commerce (Swiggy Instamart, Blinkit) in
`catalogue/delivery.json`, modelled on the published Swiggy journey (address → search → menu → cart → coupon →
place order → track, https://mcp.swiggy.com/builders/docs/build/recipes/order-food.md). Nothing below was invented as a
field in an example; every row names a field that is not in `docs/agent/schema/output-blocks.v1.json` (sha256
`470aa1ae…`). Gap numbers (G1…G24) are the playbook's.

## Truth rules every example follows

- Every price has its currency (INR, S$, US$) and the time it was read ("as of 19:48"); a compare card gives each app's
  own read time on its row.
- Fees are never folded into the dish price: delivery, packaging, platform and tax are their own rows or their own
  number. A total says what it includes ("before tip").
- "Cheaper" is said only when every compared price is in. The partial compare (one app didn't answer) says "I can't say
  which is cheaper".
- Every delivery time is the app's estimate and says so in Details ("Times are Swiggy's estimate").
- Closed restaurants are never recommended: search results are open places only and say how many closed ones were left
  out (Swiggy `availabilityStatus: OPEN`).
- Nothing is ordered without a yes. A cart, group order, reorder or basket card is followed by the approval question
  in the sentence ("shall I place it?"); no card has an Order button.
- Placing an order is not idempotent. A timeout says "I couldn't confirm the order; I'll check your orders before trying
  again", never "nothing was ordered", and never retries blindly. "Nothing was ordered" is said only where no order was
  ever sent (a lookup or a cart that failed before placing).

## Gaps

| Component | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| D4 Cart, D10 Group order, D11 Reorder, D15 Basket | delivery-cart-review, delivery-group-order, delivery-reorder-usual, delivery-quick-basket | A totals row under the line items, and fees kept apart from items | Total in `numbers`; fees and coupon as their own rows; the rows add up to the total (audited in code) | `rows_block.total` — G4 |
| D4 Cart, D10, D11, D15 | same | The approval that places the order is not a block | The card is followed by the approval question in the sentence; no Order button | None: the approval card is the authority |
| D8 Uncertain order | delivery-order-uncertain, delivery-order-placed failed | A write whose outcome is unknown has no state; `failed` reads as "it didn't happen" | `failed` with "Swiggy didn't answer after the order was sent. Not retried." and the check-before-retry sentence | `status_block.state: unconfirmed` (needs you), or a Work Unit that reconciles against `get_food_orders` before answering |
| D6, D16 Tracking | delivery-tracking, delivery-quick-tracking | Step states (done / now / next) and a live ETA the app can tick | Steps as rows newest first with their clock time trailing; the app's estimate in the title; no map, no countdown | Timed steps — G16; `document.as_of` — G6 |
| D6 Tracking | delivery-tracking | The rider (name, distance) has no field | Name and distance in the subtitle | None proposed: the subtitle carries it |
| D1 Near me, D14 Outside area | delivery-near-me, delivery-outside-area | A photo per restaurant row; an "offer" chip | Rating, distance, time and offer on the secondary line; fee trailing | `row.image` — G7 |
| D1 Near me | delivery-near-me | "Closed places left out" has no machine field | An assumption in Details and the count in the fallback | None: filtering is the agent's job |
| D2 Menu section | delivery-menu-jain | "3 of 5 dishes" with the other 2 reachable: `total_count` would make View all promise rows it was never sent | "3 of 5 Jain dishes" in the subtitle; the full Jain menu is the Zomato link (HTTP 200 on 26 Sep) | A `more_url` on the rows block, as travel proposes |
| D3 Dietary filter | delivery-menu-jain | Veg / vegan / halal / Jain marks the app could draw | The filter in the title; the restaurant's own label on each row; a disclaimer that it is their label | A closed `row.tags` set — not proposed until a second vertical needs it |
| D9 Same dish across apps | delivery-compare-apps | A per-row "as of" | Each app's read time on its row ("read 18:02"); the header's time is the latest read | `row.as_of`, or `document.as_of` — G6 |
| D12 Coupon | delivery-coupon-not-applicable | "Not eligible" has no row state | The word in `trailing` | `row_status` meanings — G1 |
| Every partial state | all partial states | A machine-readable "N of M" | "1 of 2 apps priced", "4 of 7 found so far" in the subtitle | `document.progress` — G17 |
| Every stale state | all stale states | A freshness time the app can age | "as of 19:05 · couldn't refresh" in the subtitle | `document.as_of` — G6 |
| Every failed state | all failed states | A retry for a chat lookup (no Work Unit) | No action; "Ask me again in a few minutes" | Retry without a Work Unit — G11 |
| Currency | every INR example | The rupee sign ₹ is not in Instrument Sans (checked with fontTools: `instrument-sans-latin-wght-normal.woff2` lacks U+20B9) | The ISO code "INR 714", as the money lane does (money gap M2) | Renderer: fall back to the code for currencies the face lacks |
| Links | DoorDash, Uber Eats, Blinkit, Instamart | Their web pages answered 403 or 202 to a plain fetch (bot walls), so no deep link was checked | Links only where the page answered 200 on 26 Sep (Swiggy search, Zomato menu, GrabFood store); the others carry no link | None: link-checking is the reviewer's, per the playbook |

## States drawn per example

Loading, partial, stale, empty and failed are drawn wherever the request can meet them. Only these are left out:

| Example | State left out | Why |
|---|---|---|
| delivery-order-placed | empty | The request is the yes to a cart; there is always an outcome to report. "Not placed" is failed; "maybe placed" is delivery-order-uncertain |
| delivery-order-uncertain | partial, stale, empty, failed | The example is itself the unknown-outcome state; its loading state is the order check that follows |
| delivery-minimum-not-met | empty | The cart has the items the person named; an empty cart is delivery-cart-review's empty state |
| delivery-delivered | — | A finished record still reads from the app, which can answer late or be cached, so every state is drawn |

`delivery-delivered` and `delivery-order-uncertain` are the two non-fresh examples: a finished delivery and a sent
order are records, not live prices.
