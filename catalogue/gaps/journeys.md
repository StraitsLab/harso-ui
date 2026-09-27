# Journeys with no honest example yet

The four journeys below have no catalogue example that shows the moment their success check describes. No card was
designed for them (reuse law, founder 2026-09-27): each is new data in the shape of the existing example named under
"Closest pattern", for a data-only lane. `scripts/check-journeys.mjs` reads the `## <ID>` headings: a journey with no
example must be listed here, and a journey listed here must have none. Delete the section in the same change that
adds its example to `catalogue/journeys.json`.

Success checks are quoted from JOURNEY-SPECS.md (2026-09-25, card t_18f80a89), the line in brackets.

## T5

Trip logistics from booking emails.

- Success check [335]: "Tester forwards/has 2 booking mails; sees an itinerary doc and the events in Google Calendar at
  the right local times."
- Why no example fits: `travel-itinerary` is a plan made from a request, not from booking mails (no confirmation
  numbers, no local-time events), and no example asks to add a trip's events to the calendar.
- Closest pattern: `travel-itinerary` (visual + text + open the doc) for the doc built from the mails, then
  `cal-move-event` / `cal-event-moved` (the calendar change for approval, then done) for "Add 6 events to your calendar".

## C1

Week ahead / meeting prep brief.

- Success check [663]: "Tester with 2 meetings tomorrow gets one evening brief naming each meeting, attendees and one
  prep note each."
- Why no example fits: `prod-agenda` names tomorrow's meetings and attendees, but carries no prep note per meeting;
  `prod-week-schedule` is the week without prep.
- Closest pattern: `prod-agenda` (rows: meeting, attendees and one prep note in the secondary line, time trailing),
  sent by a routine at 20:00 like `news-digest-tech`.

## Q3

Watch listings (apartments, jobs, cars).

- Success check [936]: "Tester sets a rental search; after a new listing appears, one alert lists it with a working
  link."
- Why no example fits: `jobs-alert` sets a listings watch and `home-rent-listings` shows a one-off search, but no
  example shows the alert when a new listing appears.
- Closest pattern: `travel-rate-drop-rebook` (a watch that fired: status watching + the new item as rows + Pause), with
  the listing row from `home-rent-listings` and an open_url to the listing.

## P2

Bank/card transaction monitoring.

- Success check [1059]: "Tester makes a test charge over the threshold; alert arrives on the phone."
- Why no example fits: `money-card-charges` lists a week's charges on request; no example sets a charge-over-threshold
  watch or shows it firing. The phone notification itself is outside the chat.
- Closest pattern: `shop-price-watch` (setting the watch: status watching + the rule as rows + Pause) and
  `travel-rate-drop-rebook` (the watch fired), with the charge row from `money-card-charges`.
