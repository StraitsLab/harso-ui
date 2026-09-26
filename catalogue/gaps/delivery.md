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
- Every delivery time is the app's estimate and says so on every surface that carries one, in every state: the
  fallback ("Swiggy's estimate") and Details ("Delivery times are Swiggy's estimate, not a promise"). An empty result
  describes the app's estimates (Swiggy estimates no open place at under 40 minutes), never that no place can reach you.
- The fallback is the whole answer for a device that cannot draw the card: every row's name, quantity, size, variant,
  add-on, mark, condition and amount, every number, and the scoped subject of the header (restaurant, order number,
  people, items) are in it, in every state. Recovery words ("Ask me again…", "Tell me what you'd like") are in the
  drawn `status.detail` too, not only in the fallback.
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
| D3 Dietary filter | delivery-menu-jain, delivery-cart-review, delivery-reorder-usual | Veg / non-veg / vegan / halal / Jain marks the app draws as a symbol (the green square and red or brown triangle) | The mark as a word at the head of the row's secondary line ("Veg", "Non-veg"); Jain in the dish name, as the app names it; a disclaimer that the labels are the restaurant's | A closed `row.tags` set (veg, non_veg, vegan, halal, jain) — not proposed until a second vertical needs it |
| D9 Same dish across apps | delivery-compare-apps | A per-row "as of" | Each app's read time in the subtitle ("Uber Eats as of 18:03 · DoorDash 18:02") and in the fallback ("read 18:02") | `row.as_of`, or `document.as_of` — G6 |
| D12 Coupon | delivery-coupon-not-applicable | "Not eligible" has no row state | The word in `trailing` | `row_status` meanings — G1 |
| Every partial state | all partial states | A machine-readable "N of M" | "1 of 2 apps priced", "4 of 7 found so far" in the subtitle | `document.progress` — G17 |
| Every stale state | all stale states | A freshness time the app can age | "as of 19:05 · couldn't refresh" in the subtitle | `document.as_of` — G6 |
| Every failed state | all failed states | A retry for a chat lookup (no Work Unit) | No action; "Ask me again in a few minutes" | Retry without a Work Unit — G11 |
| Currency | every INR example | The rupee sign ₹ is not in Instrument Sans (checked with fontTools: `instrument-sans-latin-wght-normal.woff2` lacks U+20B9) | The ISO code "INR 714", as the money lane does (money gap M2) | Renderer: fall back to the code for currencies the face lacks |
| Links | DoorDash, Uber Eats, Blinkit, Instamart | Their web pages answered 403 or 202 to a plain fetch (bot walls), so no deep link was checked | Links only where the page answered 200 on 26 Sep (Swiggy search, Zomato menu, GrabFood store); the others carry no link | None: link-checking is the reviewer's, per the playbook |
| D2 Menu section | delivery-menu-jain | Menu categories as headings over their dishes; a rows block has no group heading, and a `text` section heading carries no price rows | The category is the first word of each row's secondary line ("Biryani · Veg · …") and leads each group in the fallback ("Biryani: … Meals: …") | `rows_block.heading`, or grouped rows — needs you |
| D2 Menu, D4 Cart | delivery-menu-jain, delivery-cart-review | Item variants (full / half) and add-ons, each with its own price, as selectable choices | The chosen variant and add-on in the secondary line ("full · extra raita"); another variant's price in words ("half INR 190", "add papad INR 20"); choosing is a question after the card | None for display; choosing is the question card's |
| D1 Near me, D14 Outside area | delivery-near-me, delivery-outside-area | Rating count as its own field next to the rating (the apps show "10K+ ratings") | "4.5/5 from 10K+ ratings" in the secondary line, in the app's own rounded form | None proposed: the secondary line carries it |
| D15 Basket | delivery-quick-basket | Unit price (per L, per kg, per 100 g) beside the pack price; pack size as its own field | Pack size in the item name ("Paneer 200 g"), unit price in the secondary line ("INR 45/100 g"), pack price trailing | None proposed: the row carries all three |
| D15 Basket | delivery-quick-basket | A delivery slot the person can pick (quick commerce offers "next slot" and later ones) | The next slot and its estimate as a number ("10 min", "Next slot, estimated"); the slot choice named in Details; picking a later slot is a question | A slot picker is the question card's; none for display |

## Real platform fields and where they live

The founder's GUI-only steer (26 Sep): the cards take the data these apps actually return. Each field below is shown in
at least one example with the current contract, or is a gap above. Values are illustrative.

| Field (Swiggy, Zomato, Uber Eats, DoorDash, GrabFood) | Where it lives | Example |
|---|---|---|
| Restaurant name | row label | delivery-near-me |
| Open status | only open places are listed; the count left out is in Details and fallback | delivery-near-me |
| ETA | row secondary ("30–35 min") or the title ("Arriving in about 12 min"); always the app's estimate | near-me, tracking |
| Distance | row secondary ("2.4 km"); the delivery-fee row in the cart | near-me, cart-review |
| Rating and rating count | row secondary ("4.5/5 from 10K+ ratings") | near-me, outside-area |
| Fees split (delivery, packaging, platform, GST, handling) | their own rows, each amount apart; totals in `numbers` | cart-review, group-order, reorder-usual, quick-basket |
| Offers and coupons, with their condition | offer in the row secondary ("20% off"); coupons as rows with their condition and amount | near-me, coupon-not-applicable, cart-review |
| Menu categories | first word of the row secondary (gap above) | menu-jain |
| Item variants and add-ons | row secondary (gap above) | menu-jain, cart-review |
| Veg / non-veg marks | a word at the head of the row secondary (gap above: no symbol) | menu-jain, cart-review, reorder-usual |
| Cart (items, quantity, address, payment) | rows with "× n"; address and payment in the subtitle | cart-review |
| Order status stages with times | rows, newest first, time trailing | tracking, quick-tracking |
| Rider (name, distance) | the subtitle (gap above) | tracking, quick-tracking |

| Field (Instamart, Blinkit, Zepto) | Where it lives | Example |
|---|---|---|
| Pack size | in the item name ("Tomatoes 500 g") | quick-basket |
| Unit price | row secondary ("INR 110/kg") | quick-basket |
| Substitutions and out of stock | row secondary ("Milky Mist out · swapped for Amul", "Out of stock · no swap") | quick-basket |
| Slot | a number ("Next slot, estimated") and Details (gap above) | quick-basket |

Shopping fields (Amazon, Lazada, Shopee, AliExpress, Flipkart, Temu: was-price, seller and official-store badge, sold
count, shipping days, import tax, stock, return window, customs tracking) belong to the shopping vertical
(`catalogue/shopping.json`, `catalogue/gaps/shopping.md`), not this one; no delivery example carries them.

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
