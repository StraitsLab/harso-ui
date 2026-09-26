# Home admin: what the blocks cannot say honestly yet

Subscriptions, bills, forms, files, reminders and plans in `catalogue/home_admin.json`: journeys B2, B3, B5, B6, F2, F3,
F4, P3, M1, M2, M3, M4, S7, L2 and L3 from the 60-journey map (`beta-ops/journeys/JOURNEY-SPECS.md`). Lead steer
2026-09-27 03:20: every example reuses the shape of an existing example (named in `.lane/preflight.md`); only data
changes. Nothing below adds a field or a block type. Gap numbers (G1…G24) are the playbook's.

Already covered elsewhere, linked rather than redone: the subscription audit (`money-subscriptions`, B1), bills due
(`money-bills-due`, B4), a one-shot timer or reminder (`food-timer`, M1 one-off), and a plain refusal (`text-cant`).

## Truth rules every example follows

- Nothing is cancelled, sent, submitted, moved, added to a calendar or basket, or called without a yes. The proposal
  card (cancel, call plan, form fields, file moves, weekly blocks, basket) is followed by the question in the sentence;
  no card has a Cancel, Send, Submit or Move button.
- An action that may have landed says "couldn't confirm … I'll check … before trying again", never "nothing happened":
  the cancellation, the form submission and the file move each have that failed state.
- Every price has its currency (S$, US$, INR) and a read time in the subtitle when it is live (plans, stock, quotes,
  the basket, the cancel terms).
- Every date is explicit against 26 Sep 2026 with a correct weekday; "next 72 hours" ends Tue 29 Sep 11:30.
- The fallback keeps every identity and qualifier the card draws (names, dates, source emails, read times, state words,
  qualifiers such as "fixed", "within your plan", "if you cancel") and stays under 600 characters (largest: 566).
- A proposal never uses a done word for its own action ("Stops if you cancel", "To rename", "rename to"); only the
  receipts after the yes say cancelled, moved or renamed.
- A snapshot's rows and sources are no later than its "as of"; a stale card's source stamp equals its "as of".
- A failed card carries its recovery (sign in, reconnect, approve a code, ask again, set up, call instead) in the drawn
  `status.detail`, not only in the fallback. A partial names what is missing on the card itself.

## Pattern gaps (no existing pattern shows it exactly; nearest used, the lead decides)

| Journey | What the person should see | Nearest pattern used | What is missing |
|---|---|---|---|
| F2 take-over | "Needs you" for a captcha, inside the running form work | `prod-work-running` with `state: needs_you` (a contract state no catalogue example used before) | No example on main drew `needs_you`; this is its first use. The live view that the person solves it in is the app's, not a block |
| B2 "they want a call" | The call plan as the thing approved | `delivery-cart-review` (proposal then yes) with the plan as rows | A call plan has no block of its own; rows carry "Ask for / May agree / May share / Won't agree" |
| S7 negotiate | The person's floor next to the drafted offer | `prod-email-draft` with the floor in the subtitle | A private note beside a draft (never sent) has no field; the subtitle carries it |
| M3 goal plan | Milestones with dates plus a recurring check-in | `prod-meeting-notes` (agreed bullets, then rows) | The check-in routine is named in words; the card cannot also carry its routine status (one card, one subject) |

## Contract gaps

| Component | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| Row states | home-bill-lower-pending, home-form-review, home-tax-docs, home-quotes-requested, home-stock-check | "Needs you", "Missing", "Found", "Agreed", "No reply yet", "in stock / low / out" have no meaning the app can colour | The word in `trailing` or `secondary` | `row_status` meanings — G1 |
| Per-row read time | home-stock-check, home-quotes-requested | Each store or firm was checked at its own time | "checked 16:02" on the row's secondary line; the latest in the subtitle | `row.as_of` — G6 |
| Row links | home-tax-docs, home-deadlines-mail | Each found document or email should open itself | The source named on the row; the list with links goes to Library (Details says so) | `row.url` — G8 |
| Group headings | home-weekly-plan, home-deadlines-mail | Day headings; found vs missing as groups | Day or state in each row; "Already passed" / "IRAS gets these directly" as a text section | Grouped rows — G2 |
| Next times | home-reminder-recurring | A routine's next occurrences as a field | Two rows ("Then", "And") under the scheduled status | Timed status steps — G16 |
| Place trigger | home-reminder-place | An arrival trigger and radius | The place as a row; the mechanism (phone Shortcuts) in Details | None proposed: a reminder rule is the routine's, not the card's |
| Every partial / stale | all | Machine-readable "N of M" and a freshness time the app can age | Subtitle words | `document.progress` — G17; `document.as_of` — G6 |
| Two amounts in one cell | home-electricity-plans | Monthly and annual estimate per plan; one `trailing` | "S$137/mo · S$1,644/yr" in `trailing` (fits 24) | A second numeric column per row, or a `table` (not the pattern source's shape) |
| Every failed lookup | all failed states without a Work Unit | Retry for a chat lookup | "Ask me again in a few minutes" in `status.detail` | G11 |

## States drawn per example

| Example | State left out | Why |
|---|---|---|
| home-sub-cancelled, home-form-submitted, home-files-done | empty | The request is the yes to a proposal; "nothing to cancel / submit / move" is the proposal's own empty state. Each has a stale state (the receipt as of its time, couldn't refresh), as `places-table-booked` |
| home-bill-dispute-draft, home-negotiate-offer | partial, stale | A draft is written from what was read; it has no half-read or aged form (as `prod-email-draft`) |
| home-bill-lower-pending | partial | One case record; it is read whole or not at all (as `jobs-pipeline`) |
| home-electricity-plans | empty | There is always the current plan to show |
| home-form-review, home-files-organise | stale | A proposal is re-read before the yes is acted on |
| home-form-needs-you | all | It is itself a state (the running form work waiting on the person), as `prod-work-running` |
| home-reminder-recurring, home-reminder-place | partial, stale, empty | A reminder is set or not (as `food-timer`); failed says it may or may not be set |
| home-weekly-plan | loading, stale | As `prod-week-schedule`; the Monday routine sends the finished plan |
