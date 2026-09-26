# Money: what the blocks cannot say honestly

Lane CAT-money. Every example in `catalogue/money.json` is schema-valid today; where the contract has no field, the
example uses the nearest honest composition and the gap is listed here. G-numbers refer to the playbook's gap table
(`catalogue-design/playbook/coverage.md`); a new row gets an M-number. No field was invented in any example.

## Components and the gap each one waits on

| Component | Example(s) | What the blocks cannot say | Workaround in the example | Smallest contract fix |
|---|---|---|---|---|
| F1 Balance / net worth | money-net-worth, money-balance | The change belongs beside the value, not in a second cell | Change is the second number ("−S$5,560 Since 1 Sep") | `number.delta` (G3) |
| F2 Portfolio summary | money-portfolio | Same; also no line chart AND holdings inline without going to the page | Two numbers, holdings as rows, page | G3 |
| F3 Stock / crypto quote | money-stock-quote, money-crypto-quote | Same; "why it moved" is the sentence, not the card (law 6) | Change as the second number | G3 |
| F4 Key stats grid | money-key-stats | Nothing | label/trailing rows, page | none |
| F5 Stock comparison | money-stock-compare | Nothing inline; a 4-column table does not fit a phone | Line chart, 3 series, winner in the sentence | none |
| F6 Watchlist / movers | money-watchlist | The move is a signed number, drawn as plain text | Move in `trailing`, price in `secondary` | `row.delta` (G3 for rows) |
| F7 Spending summary | money-spending-month, money-spending-so-far | Budget as a target line on the chart | Budget in the number label ("Left of S$5,000") | `chart.target` (G9) |
| F8 Budget by category | money-budget-categories | "Over" is a state word with a meaning (needs you) | Word in `trailing` ("S$260 over") | `row_status` meanings (G1) |
| F9 Transactions list | money-card-charges, file-expenses-sheet | Charges grouped by day | One flat list, date in `secondary` | grouped rows (G2) |
| F10 Bill / subscription due | money-bills-due, money-bills-month, money-subscriptions | "Autopay" / "not on autopay" / "Due" are states the app could colour | `overdue` where it fits; the rest as words in `secondary` | G1 |
| F11 Invoice | money-invoice-sent, money-invoices-owed, file-invoice-pdf | A total row under the invoice rows | Total as a `numbers` item | `rows_block.total` (G4) |
| F12 Quote / estimate | money-quote-estimate | Same as F11 | Total as a number | G4 |
| F13 Money transfer quote | money-transfer-quote | Nothing (the rupee sign is a font gap, see M2) | Two numbers, rate and arrival in the subtitle | none |
| F14 Transfer / payment tracking | money-transfer-tracking | Steps with a done/now/next stage; the status block needs a Work Unit, a bank transfer has none | Rows newest first, time in `secondary` | `status_block.steps` for a domain state (G16) |
| F15 Loan / mortgage result | money-mortgage | Monthly breakdown with a total row | Two numbers; breakdown lives in the assumptions | G4 |
| F16 Amortization / payoff | money-amortization | Nothing | Line chart + two rows + schedule file | none |
| F17 Tax estimate | money-tax-estimate | Driver lines with a total row | Two numbers; sources and rates in Details | G4 |
| F18 Statement / report file | file-statement | Nothing | numbers + open/download | none |

## States

| State | Gap | Workaround | Fix |
|---|---|---|---|
| partial | "3 of 4 accounts read" is text the app cannot count or animate | Written in the subtitle; the rows that did arrive are sent | `document.progress` (G17) |
| stale | "as of" is text; the app cannot age it or tint it | "as of Thu 24 Sep 18:00 · couldn’t refresh" in the subtitle | `document.as_of` (G6) |
| failed | A lookup made in chat has no Work Unit, so it has no Retry | status(failed) + what happened + what did not change; the closing sentence says to ask again | retry without a Work Unit (G11) |
| loading | A loading card needs a Work Unit subject | Placeholder Work Unit ids in the uuid7 shape | none (the app draws loading from the running unit) |

## New rows from this lane

| # | Gap | Where it bites | Workaround | Smallest fix |
|---|---|---|---|---|
| M1 | **Calculations have no stale, partial or empty state.** A mortgage or tax estimate is computed from the person's numbers; it cannot be out of date, half-read or empty, and its only failure is a missing input, which is a question, not a failed card. | money-mortgage, money-tax-estimate | These two carry no `states`; missing inputs go through the question card | none: this is the honest shape, recorded so a reviewer does not read it as a missing state |
| M2 | **The Indian rupee sign ₹ is not in Instrument Sans** (B1 gaps A9). | money-transfer-quote, money-transfer-tracking | Amounts use the ISO code ("INR 61,540"); F0's examples used ₹ and are changed here. Rupiah is written "Rp", which the face has (money-transfer-idr) | Renderer: fall back to the ISO code for currencies the face lacks; then examples may use the sign |
| M3 | **A partial total cannot sit beside "N of M".** When 1 of 4 accounts is unread, "Left of S$5,000" would be false, so the budget number cannot be shown. | money-spending-month partial, money-spending-so-far partial | Show Spent and the count read; say the budget comparison waits in `fallback_text` | G17 plus a per-number "incomplete" flag is NOT proposed: the honest card leaves the number out |
| M4 | **The share law triggers only on bare percentages.** Subscriptions and unpaid invoices are parts of a total but carry text in `secondary`, so nothing checks their order. | money-subscriptions, money-invoices-owed | Subscriptions go largest first; unpaid invoices go late first, then by due date, because "who to chase" is the question. The checker's "rows add up to Total" law checks both sums | none in the contract; a checker rule would need a lead decision on what "a list of parts" means and which order it takes |

## State applicability matrix (every example)

Present = the example carries that state. N/A = the state cannot honestly happen for this request, with the reason.
Lead ruling 2026-09-26: immutable artifacts and words-only answers are exempt. `.lane/class-checks.mjs` checks this
table against the file.

| Example | loading | partial | stale | empty | failed | Why a state is N/A |
|---|---|---|---|---|---|---|
| money-spending-month | yes | yes | yes | yes | yes | |
| money-net-worth | yes | yes | yes | yes | yes | |
| money-stock-quote | yes | yes | yes | N/A | yes | a listed stock always has a price; a wrong ticker is a question |
| money-portfolio | yes | yes | yes | yes | yes | |
| money-bills-due | yes | yes | yes | yes | yes | |
| money-transfer-quote | yes | yes | yes | N/A | yes | a corridor with no provider is a boundary answer (text-cant), not an empty quote |
| money-mortgage | N/A | N/A | N/A | N/A | N/A | calculation from the person's own numbers (M1) |
| money-amortization | yes | N/A | N/A | N/A | yes | calculation (M1); only the schedule file can fail |
| money-budget-categories | yes | yes | yes | yes | yes | |
| money-tax-estimate | N/A | N/A | N/A | N/A | N/A | calculation (M1) |
| money-invoice-sent | yes | N/A | yes | yes | yes | one invoice is read whole or not at all |
| text-convert, text-cant | N/A | N/A | N/A | N/A | N/A | words-only answers send no card |
| file-invoice-pdf | yes | N/A | N/A | N/A | yes | a new file from given inputs: made or not made |
| file-expenses-sheet | yes | yes | N/A | yes | yes | a saved export is a fixed record of the month; it does not go out of date |
| stale-portfolio | N/A | N/A | N/A | N/A | yes | this example IS the stale state (markets closed); its siblings live on money-portfolio |
| money-key-stats | yes | yes | yes | N/A | yes | a listed stock always has stats |
| money-stock-compare | yes | yes | yes | N/A | yes | as money-stock-quote |
| money-quote-estimate | yes | yes | N/A | yes | yes | a received quote is a fixed document; its "valid until" is shown instead |
| money-transfer-tracking | yes | N/A | yes | yes | yes | a transfer's status is one record |
| money-pay-bill | yes | N/A | N/A | yes | yes | one bill; a payment hand-off is never shown from an old read |
| file-statement | yes | N/A | N/A | yes | yes | an issued statement is an immutable file |
| money-watchlist | yes | yes | yes | yes | yes | |
| money-card-charges | yes | N/A | yes | yes | yes | one card is one read |
| money-spending-so-far | yes | yes | yes | yes | yes | |
| money-balance | yes | N/A | yes | N/A | yes | one account, one read; an account always has a balance |
| money-crypto-quote | yes | yes | yes | N/A | yes | as money-stock-quote |
| money-subscriptions | yes | yes | yes | yes | yes | |
| money-invoices-owed | yes | yes | yes | yes | yes | |
| money-bills-month | yes | yes | yes | yes | yes | |
| money-transfer-idr | yes | yes | yes | N/A | yes | as money-transfer-quote |
| money-spending-zh | yes | N/A | N/A | yes | yes | its siblings are on money-spending-month; this one tests Chinese text, not states |

## Freshness verdicts

Anything about what is owed, paid, due or over budget *now* is fresh and stamped "as of HH:MM", because a payment or
cancellation changes it: money-bills-due, money-bills-month, money-subscriptions, money-invoices-owed,
money-invoice-sent, money-pay-bill, money-budget-categories. Finished periods (August spending, the August statement,
the August export), fixed calculations and a received quote stay `fresh: false`.

## Failure wording

A read that fails proves nothing about the provider: "Gmail didn’t respond, so I can’t tell what’s paid. I didn’t pay
anything." Every failed state says what *this agent* did not do ("I didn’t change / send / pay anything"), never
"Nothing was paid".

## Conversion convention

The transfer fee comes out of the amount sent; the rest converts at the quoted rate (Wise's own convention).
Destination = (sent − fee) × rate: S$1,000 − S$6.20 = S$993.80 × 61.92 = INR 61,536.10, shown as INR 61,536 because the
number cell holds 12 characters; the fallback gives the exact figure. S$2,000 − S$9.80 = S$1,990.20 × 12,166 =
Rp24,212,773. Rates carry their unit ("12,166 IDR per SGD").

## Visual acceptance (lead ruling 2026-09-26)

This lane is accepted on data. On the current kit renderer, charts and status blocks fall back to `fallback_text`, and
actions are not drawn (src/chat/output-card.tsx). That is why the fallbacks above carry every figure. Visual acceptance
(QUALITY-BAR 9 or above) is a separate lead gate once #11, P5c and P5d (actions and linked sources) land.
