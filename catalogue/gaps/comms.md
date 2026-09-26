# Comms: what the blocks cannot say honestly yet

Email, messages, calls and invites done on the person's behalf, in `catalogue/comms.json`, one example per journey
moment from JOURNEY-SPECS (E1–E6, K1–K4). Lead steer 2026-09-27 03:20: every example reuses an existing example's
shape (named below), and only the data changes. No new block, field or layout. Nothing below invents a field; every row
names a field that is not in `docs/agent/schema/output-blocks.v1.json` (sha256 `470aa1ae…`). Gap numbers (G1…G24) are
the playbook's.

## Pattern sources

| Example | Journeys | Pattern source | What changed (data only) |
|---|---|---|---|
| comms-inbox-brief | E1 | prod-launch-status | Group counts in the subtitle; needs-you threads as rows, deadline trailing; Gmail link |
| comms-reply-draft | E2 | prod-email-draft-team | Reply to Mrs Tan, greeting / body / sign-off; tone source in Details |
| comms-email-sent | K1 (sent receipt, and failed = couldn't confirm) | places-table-booked | Thread, sent-from and reply watch as rows; thread link |
| comms-waiting-on | E3 (India) | money-bills-due | Waiting threads oldest first; the one past the nudge point is `overdue` |
| comms-nudge-draft | E3 (US) | prod-email-draft | Nudge to the landscaper, one paragraph |
| comms-cleanup-plan | E4 proposal | shop-cart-summary | Emails to archive and unsubscribes as numbers; senders as rows; all 32 in a sheet |
| comms-cleanup-done | E4 receipt | shop-order-confirmed | Archived and unsubscribed as numbers; Gmail archive link |
| comms-alert-fired | E5 | weather-alert | The school's email as the paragraph; who and when in the header |
| comms-leads-sheet | E6 | file-expenses-sheet | Inquiry count and not-replied count; open or download the sheet |
| comms-text-draft | K2 draft | prod-email-draft | Text to Priya on iMessage |
| comms-text-read | K2 delivered / read | jobs-pipeline | Read, delivered, sent as steps with their time |
| comms-whatsapp-cant | K2 WhatsApp (W7) | text-cant | Words only: can't send WhatsApp yet, nothing sent, the text to paste |
| comms-call-outcome | K3 (booked; failed = no answer) | places-table-booked | Answered by, agreed, next step as rows; transcript file |
| comms-invite-draft | K4 invite | prod-email-draft-team | The party invite to 12 families; the Calendar event link |
| comms-rsvp-tracker | K4 RSVPs | prod-launch-status | Yes / no / not replied counts in the subtitle; not-replied families as rows |

Two journeys share a pattern wherever they look the same on screen: every draft (E2, E3 nudge, K2, K4) is the email
draft, and every done receipt (K1, K3) is the booking receipt.

## Truth rules every example follows

- Nothing is sent, archived, unsubscribed, called or invited without a yes. A draft or proposal card is followed by the
  question in the sentence ("Send it?", "shall I go ahead?"); no card has a Send button.
- A write whose outcome is unknown (an email or text that may have gone, a clean-up that stopped partway) says
  "couldn't confirm" and "I'll check Sent / Messages / what's archived before trying again", never "not sent".
  "Nothing was sent" is said only where nothing was ever sent.
- Archive is never delete: the plan and the receipt both say archived mail stays in All Mail.
- "Read" is said only when Messages reports it; a sent-but-not-delivered text says so and gives the likely reason.
- The fallback carries every drawn fact and every header scope in every state (the lane audit `.lane/gen/parity.py`,
  the delivery lane's audit reused, 0 findings), and every recovery in the fallback is in `status.detail` too.
- No example is time-sensitive (no prices, availability or quotes read live), so none is in the `fresh` list. The one
  price (S$68 at the salon) is what the salon agreed on the call, recorded, not a live price.

## Gaps

| Component | Example(s) | What is missing | Workaround used | Smallest contract field that fixes it |
|---|---|---|---|---|
| Inbox brief (E1) | comms-inbox-brief | The three groups (needs you / FYI / receipts) as grouped rows | Counts per group in the subtitle; only needs-you as rows; FYI and receipts stay in Gmail | `rows_block.items[].group` — G2 (same as WD-1) |
| Uncertain send (K1, K2, E4) | comms-email-sent failed, comms-text-read failed, comms-cleanup-done failed | A write whose outcome is unknown has no state; `failed` reads as "it didn't happen" | `failed` with "couldn't confirm … I'll check … before trying again" | `status_block.state: unconfirmed` (as delivery D8) |
| Message status (K2) | comms-text-read | Delivered / read as step states | Steps as rows, latest first, time trailing | Timed steps — G16 |
| Waiting-on (E3) | comms-waiting-on | "Past the nudge point" has no row state of its own | `status: overdue` (needs you), words in the secondary | `row_status` meanings — G1 |
| RSVP tracker (K4) | comms-rsvp-tracker | Yes / no / not replied as row states and a count per state | Counts in the subtitle; "Not replied" as a word in the secondary | `row_status` meanings — G1; grouped rows — G2 |
| Draft previews | comms-reply-draft, comms-nudge-draft, comms-text-draft, comms-invite-draft | A draft's own link; the recipient as a field | Recipient in the subtitle ("To … · draft"); the Drafts folder or the Calendar event as the link | As WD-6 and WD-7 |
| Call outcome (K3) | comms-call-outcome | Transcript quotes per speaker; a live listen-in state | Transcript is a file; outcome as rows | None proposed: the transcript is a file |
| WhatsApp (K2, W7) | comms-whatsapp-cant | No send path yet | Words only (text-cant pattern) with the text to paste | None: a capability, not a field |

No pattern gap: every journey moment in the brief had an existing pattern that shows it honestly.

## States drawn per example

Each example draws the states its pattern source draws, plus any the journey needs. Left out:

| Example | State left out | Why |
|---|---|---|
| comms-nudge-draft, comms-text-draft | partial, stale | Like prod-email-draft: a short draft is whole or not made; the Gmail/Messages draft is not re-read |
| comms-alert-fired | stale, empty | An alert fires once on an email that arrived; there is no later read to go stale and no alert without a match |
| comms-leads-sheet | stale | A file is made once; like file-expenses-sheet |
| comms-text-read | empty | The request is about a text that was sent; "never sent" is comms-text-draft's empty |
| comms-call-outcome | stale | A finished call is a record, not a live read |
| comms-invite-draft | empty | The guest list is the person's class parents; a missing address is the partial |
| comms-whatsapp-cant | all | Words only; no card |
