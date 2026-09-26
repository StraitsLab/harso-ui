# Calendar and bookings: what the blocks cannot say honestly yet

Calendar changes (conflicts, finding a time, moving events, focus blocks) and bookings (dentist, salon, government
appointments, event tickets, cancelling, an airport ride) in `catalogue/calendar_bookings.json`. Journeys C2–C5, R2–R6
and T7 from the 60-journey map. Every example reuses the shape of an existing example on main and changes data only
(lead steer, 27 Sep 03:20); the pattern source for each is in the table at the end. No field was invented; every gap
names a field that is not in `docs/agent/schema/output-blocks.v1.json` (sha256 `470aa1ae…`). Gap numbers G1–G24 are
the playbook's.

## Truth rules every example follows

- Nothing is moved, sent, booked, bought, cancelled or called without a yes. A proposal card (clash fixes, slots,
  the moved event, focus blocks, seats, the cancel, the ride) ends with the question in the sentence, says "not moved
  yet", "none added yet", "not called" or "nothing bought yet" on the card or in the fallback, and has no
  Book/Buy/Send/Cancel button.
- A write that may have landed (moving an event, a booking, tickets paid, a cancellation) says "couldn't confirm" and
  "I'll check before trying again", never "not moved" or "nothing was booked". "Nothing was booked" is said only where
  nothing was ever sent (a lookup that failed).
- Every price has its currency (S$, US$, INR) and the time it was read. A ticket or ride total names what it includes,
  and the seat and fee rows add up to it.
- Every date is explicit against reference date Sat 26 Sep 2026: "next week" is Mon 28 Sep–Sun 4 Oct; "Saturday's
  lunch" is Sat 3 Oct; "next month" is October.
- Time zones: a slot offered to someone in another zone shows both (SGT and IST); DMV times are Pacific and say so.
- Identity logins (Singpass, a CAPTCHA, a ticket queue check) are the person's own step; the card says so and never
  claims to pass them.

## Gaps

| Journey | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| C2, C4, C5, R5, R6, T7 | cal-conflicts-next-week, cal-move-event, cal-focus-blocks, book-tickets-seats, book-cancel-lunch, book-airport-ride | The approval that makes the change is not a block | The question follows the card in the sentence; no action button | None: the approval card is the authority |
| C4, R2, R5, R6 | cal-event-moved, book-dentist-booked, book-tickets-confirmed, book-cancelled (failed) | A write whose outcome is unknown has no state; `failed` reads as "it didn't happen" | `failed` with "couldn't confirm … I'll check before trying again" (delivery-order-uncertain wording) | `status_block.state: unconfirmed` (as delivery proposes) |
| C4 | cal-move-event | A before/after pair ("was → now") | Two rows, "Now" and "Moves to", with times trailing | A `delta` on rows — G3 |
| C2 | cal-conflicts-next-week | Grouping two events into one clash | One row per clash: both event names in the label, both times and the fix in the secondary | Grouped rows — G2 |
| C3 | cal-find-time-priya | A second time zone per row | Both times in the secondary line ("14:00 SGT · 11:30 IST for Priya") | None proposed: the secondary line carries it |
| C4 | cal-event-moved | Per-guest RSVP state (accepted, declined, no reply) | The word in `trailing` | `row_status` meanings — G1 |
| C5 | cal-focus-blocks | A week strip showing where blocks land among existing events | Rows in day order, times trailing; the day with no room named in Details and the fallback | None: the rows are the answer; a week grid is a page (pattern gap below) |
| R2, R3 | book-clinic-call-plan | A call plan (who, what I'll ask, what may be shared) has no block of its own | The email-draft shape: the script word for word as the paragraph; the number and "not called" in the subtitle | None for display; the call is the approval card's |
| R4 | book-ica-passport, book-dmv-real-id | A documents checklist the person ticks | A `text` section headed "Bring" with bullets (no tick-boxes, per the playbook) | None: ticking is not the card's job |
| R5 | book-tickets-seats | A seat map | Seats as a row ("Cat 2 · Row K, seats 14–15"); no map | A seat-map image is a file; none proposed |
| R5 | book-tickets-seats partial | A total that is not known yet | Numbers show the seat subtotal and "Not in yet" for fees; no total is claimed | `document.progress` — G17 |
| T7 | book-airport-ride | Timed steps worked back from the flight | Rows from the flight to the pickup, the time trailing | Timed steps — G16 |
| T7 | book-airport-ride | A watcher that re-proposes the pickup on a delay | Named in Details ("I'll watch SQ 638 and propose a new pickup"); the delay card itself is the reschedule proposal, which reuses this same card | None: a routine plus this card |
| Every partial | all partial states | A machine-readable "N of M" | "1 of 2 calendars read", "2 of 3 offices checked" in the subtitle | `document.progress` — G17 |
| Every stale | all stale states | A freshness time the app can age | "as of 09:10 · couldn't refresh" in the subtitle | `document.as_of` — G6 |
| Every failed | all failed states | A retry for a chat lookup with no Work Unit | No action; the recovery is in `status.detail` | Retry without a Work Unit — G11 |
| Currency | book-salon-home-india | The rupee sign is not in Instrument Sans | The ISO code "INR 499", as money and delivery do | Renderer: fall back to the code |

## Pattern gaps (no shape on main shows it; nearest pattern used, lead decides)

| Journey moment | Nearest pattern used | What it cannot show |
|---|---|---|
| C5 a week view of proposed blocks among existing events | prod-week-schedule (rows in day order) | Where each block sits against the day's other events |
| R2/R3 a call in progress and its summary with the clinic's confirmation | prod-email-draft (the plan) and places-table-booked (the result) | The live call and its transcript; that is a Work result, outside this vertical |

## Links

Checked with a plain fetch on 26 Sep: Google Calendar week and day views, ICA passport collection, California DMV
appointments, Chope (Candlenut), Grab Advance Booking and Urban Company Bangalore answered 200. SISTIC and a Q & M
Dental booking page were not checked (no deep link that answered), so those cards carry no link or use the calendar.

## States drawn per example

| Example | State left out | Why |
|---|---|---|
| cal-event-moved | empty | The request is the yes to a proposal; "the slot went" is shown by cal-move-event's partial state; failed is the unconfirmed write |
| book-clinic-call-plan | partial, stale | A draft is written, not read: it is there or it is not (as prod-email-draft) |

## Freshness

Fresh (availability, fares, fees, policy read now): cal-find-time-priya, the dentist slots and booking, the salon, the
ICA and DMV slots, the seats, the cancel and cancelled, and the ride. Not fresh (the person's own calendar or a
finished record): the clashes, the move proposal and receipt, focus blocks, the call plan, and bought tickets.
