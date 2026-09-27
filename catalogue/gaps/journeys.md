# Journeys with no honest example yet

The 7 journeys below have no catalogue example that shows the moment their success check describes. No card was
designed for them (reuse law, founder 2026-09-27): each is new data in the shape of the existing example named under
"Closest pattern", for a data-only lane. `scripts/check-journeys.mjs` reads the `## <ID>` headings: a journey with no
example must be listed here, a journey listed here must have none, and the check exits 1 while any is listed. Delete
the section in the same change that adds its example to `catalogue/journeys.json`.

Success checks are quoted from JOURNEY-SPECS.md (2026-09-25, card t_18f80a89), the line in brackets.

## S1

Research and compare products.

- Success check [94]: "Tester asks for headphones under $300; within one Work Unit sees a 3-row table with live prices from at least 2 retailers, each link opening the right product page."
- Why no example fits: None of the product options carries a link to its product page. shop-marketplaces-compare's one URL is a Lazada search; shop-vacuum-options and partial-sources have no links at all.
- Closest pattern: `shop-vacuum-options` rows (price per retailer, one pick) with a product-page link per option. Rows carry no link in output-blocks v1, so the links go where the contract allows (details sources with url, one per product); if that is not enough, it is a contract question for the lead, not a new card.

## S4

Track orders and deliveries.

- Success check [159]: "Tester with 2+ shipped orders asks 'what's arriving?'; sees each order with carrier status matching the carrier site."
- Why no example fits: Every tracking example (shop-delivery, shop-cross-border-tracking, shop-delivery-missed, delivery-tracking) is one order.
- Closest pattern: `shop-return-windows` (one row per order, soonest first) with the carrier status from `shop-delivery` as each row's secondary line.

## S7

Negotiate a price / haggle.

- Success check [225]: "Tester negotiates a real or test listing; each outgoing message appears in their Marketplace inbox exactly as approved."
- Why no example fits: home-negotiate-offer is the opening offer before approval; nothing shows the approved message sent in the Marketplace inbox.
- Closest pattern: `comms-email-sent` (sent receipt: thread, sent from, reply watch) with the Marketplace thread.

## T1

Trip research and itinerary.

- Success check [249]: "Tester asks for 5 days in Tokyo; receives an itinerary doc with dated days and hotel/flight prices that match the linked pages."
- Why no example fits: travel-itinerary and file-itinerary-pdf have dated days but no flight or hotel prices; the flights and hotels cards are separate answers.
- Closest pattern: `travel-itinerary` (visual + text + open the doc) with the chosen flight and hotel as rows with their prices, and each price page in details sources.

## T5

Trip logistics from booking emails.

- Success check [335]: "Tester forwards/has 2 booking mails; sees an itinerary doc and the events in Google Calendar at the right local times."
- Why no example fits: travel-itinerary is a plan made from a request, not from booking mails (no confirmation numbers, no local-time events), and no example adds a trip's events to the calendar.
- Closest pattern: `travel-itinerary` for the doc built from the mails, then `cal-event-moved` (the calendar change done, open in Calendar) for the added events.

## T6

Watch fares / hotel rates, rebook on drop.

- Success check [356]: "Tester watches a refundable booking; when a lower rate appears, approves two cards and ends with one booking at the lower price."
- Why no example fits: travel-rate-drop-rebook stops at the question to rebook; nothing shows the new booking made and the old one cancelled.
- Closest pattern: `travel-booking-confirmed` (booked: ref, total) plus a row for the cancelled old booking, as in `book-cancelled`.

## T7

Airport ride timed to the flight.

- Success check [377]: "Tester with a real flight gets a booked ride confirmation for the proposed time; a simulated delay produces a reschedule card."
- Why no example fits: book-airport-ride proposes a pickup and asks to book; travel-flight-status shows a delay with nothing to change. No booked ride, no reschedule card.
- Closest pattern: `places-table-booked` (booked: ref and time) for the ride, and `cal-move-event` (the change for approval) for the delay reschedule.
