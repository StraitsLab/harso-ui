# Journeys with no honest example yet

The 23 journeys below have no catalogue example that shows the moment their success check describes. No card was
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

## R4

Government / DMV appointment.

- Success check [466]: "Tester books (or reaches the final submit step of) a real appointment; sees the confirmation page in the live view."
- Why no example fits: book-ica-passport and book-dmv-real-id list slots and offer to start or prepare the booking; neither reaches the final submit step or a confirmation.
- Closest pattern: `home-form-review` / `home-form-needs-you` (filled for approval, the step only the person can do) and `book-dentist-booked` (the confirmation).

## E3

Follow-up nudges (waiting-on).

- Success check [575]: "Tester marks one thread 'nudge in 2 days'; after 2 days approves the nudge and sees it sent in the thread."
- Why no example fits: comms-waiting-on lists who hasn't replied and comms-nudge-draft is the nudge before approval; nothing shows the nudge sent in the thread.
- Closest pattern: `comms-email-sent` (sent receipt in the thread).

## E6

Extract leads / info into a sheet.

- Success check [638]: "Tester sends 2 test inquiries; both appear as rows in the named Sheet."
- Why no example fits: comms-leads-sheet makes a new spreadsheet once, from past mail; nothing appends new inquiries to the person's named Sheet as they arrive.
- Closest pattern: `comms-leads-sheet` (numbers + open the sheet) with the named Sheet and the rows added, run by a routine like `news-digest-tech`.

## C1

Week ahead / meeting prep brief.

- Success check [663]: "Tester with 2 meetings tomorrow gets one evening brief naming each meeting, attendees and one prep note each."
- Why no example fits: prod-agenda names tomorrow's meetings and attendees but carries no prep note per meeting; prod-week-schedule is the week without prep.
- Closest pattern: `prod-agenda` (rows: meeting, attendees and one prep note in the secondary line, time trailing), sent by a routine at 20:00 like `news-digest-tech`.

## C3

Find a time with others.

- Success check [705]: "Tester asks for 30 min with a colleague; the invite arrives in the colleague's calendar at an approved slot."
- Why no example fits: cal-find-time-priya picks a slot and asks to send the invite; nothing shows the invite sent and on the colleague's calendar.
- Closest pattern: `cal-event-moved` (the event with each attendee's reply, open in Calendar).

## C5

Protect focus time / buffers.

- Success check [746]: "Tester sets the rule; next week's calendar shows the focus blocks and buffers."
- Why no example fits: cal-focus-blocks proposes blocks and buffers and says none are added yet.
- Closest pattern: `cal-event-moved` (done, open in Calendar) with the added blocks as rows.

## B3

Lower a bill / dispute a charge.

- Success check [813]: "Tester runs a call against a real provider (or a founder-staffed test line); gets a transcript and an agreed or refused outcome within the plan."
- Why no example fits: home-bill-lower-pending has the agreed outcome but no transcript; home-bill-dispute-draft is unsent.
- Closest pattern: `comms-call-outcome` (who answered, what was agreed, open transcript) for the provider call.

## B4

Bill due-date tracking.

- Success check [833]: "Tester with one bill mail gets a phone reminder on the set day."
- Why no example fits: money-bills-due and money-bills-month list due bills; nothing sets a reminder for a bill or shows it firing.
- Closest pattern: `home-reminder-recurring` (status scheduled + next dates + Pause) with the bill and its due date.

## B5

Home upkeep and supply lists.

- Success check [853]: "Tester's list file updates after a new household receipt arrives."
- Why no example fits: home-upkeep-due and home-supplies-basket read the lists and propose a basket; nothing shows the list file updated after a receipt.
- Closest pattern: `home-files-done` (done: what changed, open in Drive) with the list file and the rows the receipt added.

## Q3

Watch listings (apartments, jobs, cars).

- Success check [936]: "Tester sets a rental search; after a new listing appears, one alert lists it with a working link."
- Why no example fits: jobs-alert sets a listings watch and home-rent-listings shows a one-off search, but no example shows the alert when a new listing appears.
- Closest pattern: `travel-rate-drop-rebook` (a watch that fired: status watching + the new item as rows + Pause), with the listing row from `home-rent-listings` and an open_url to the listing (as `home-listing-card`).

## F1

Answer from my documents.

- Success check [957]: "Tester picks their lease; the answer quotes the clause and page."
- Why no example fits: docs-contract-summary and docs-contract-review paraphrase clauses in rows; neither quotes the clause's words, and docs-contract-review cites only '18 pages'.
- Closest pattern: `docs-contract-summary` (clause rows, the PDF and page in details sources) with a text block quoting the clause and its page.

## P1

Spending tracker from receipts.

- Success check [1039]: "Tester gets a spreadsheet with this month's receipts and totals by category."
- Why no example fits: file-expenses-sheet is built from linked accounts, not receipts, and shows no totals by category; money-spending-month is category spending from accounts, not a sheet.
- Closest pattern: `file-expenses-sheet` (numbers + open the sheet) sourced from receipts, with category totals as rows as in `money-budget-categories`.

## P2

Bank/card transaction monitoring.

- Success check [1059]: "Tester makes a test charge over the threshold; alert arrives on the phone."
- Why no example fits: money-card-charges lists a week's charges on request; no example sets a charge-over-threshold watch or shows it firing. The phone notification itself is outside the chat.
- Closest pattern: `shop-price-watch` (setting the watch: status watching + the rule as rows + Pause) and `travel-rate-drop-rebook` (the watch fired), with the charge row from `money-card-charges`.

## P3

Tax prep document gathering.

- Success check [1078]: "Tester sees a checklist of tax forms with links to each found mail/file."
- Why no example fits: home-tax-docs is the checklist of found and missing forms, but it links none of the found mails or files (its only URL is IRAS guidance, and 'links are in the Library list' names no artifact).
- Closest pattern: `home-tax-docs` with an open_url per found mail, as `home-form-submitted` links its receipt email, or an open_artifact list as in `file-expenses-sheet`.

## M2

Weekly review / planning.

- Success check [1119]: "Tester gets a Monday recap and sees approved blocks in Calendar."
- Why no example fits: home-weekly-plan is last week's recap and the proposed blocks; it asks to add them, and nothing shows them in Calendar.
- Closest pattern: `cal-event-moved` (done, open in Calendar) with the added blocks as rows.

## M3

Goals turned into plans.

- Success check [1138]: "Tester gets a plan and a weekly check-in that references their answers."
- Why no example fits: home-goal-plan says a check-in will come every Sunday; no example shows a check-in that uses the person's answers.
- Closest pattern: `news-digest-tech` (a routine's message as it arrives) with the week's runs and what changed from the person's answer, as in `edu-progress`.
