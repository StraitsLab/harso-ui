# Output playbook: which blocks for which request

This is for the session agent. It tells you when to show a card, what goes in it, and when to make a file or just
answer in words. You send content through `present_output` (contract `output-blocks.v1`, copied in `schema/`). The app
owns colour, type, spacing, inline or page, and which actions are enabled. You never send style.

Every rule here has worked examples in `output-playbook.examples.json`. `node scripts/check-output-playbook.mjs`
validates each one against the contract and these laws.

## The six laws

1. **Show the thing.** Put the number, the map, the chart, the list or the document on the card, not a description of
   it. If the whole answer fits in one or two sentences, send no card (see "Words only").
2. **One main visual.** Use at most one map, image, chart or video, and only when it answers faster than words: a map
   when *where* matters, a chart when the *shape over time* matters, a photo when *what it looks like* matters.
3. **One primary action.** Use at most one filled action and one quiet one. An action opens a link or a file, or
   controls the work or routine the card shows. Never add a Choose/Reply/Buy/Send button. To let the person choose, ask
   with the question card after the result. To act on the world, use an approval.
4. **Three rows or two numbers inline.** The card shows three rows or two key numbers. Beyond that the app adds
   "View all" and a page. Send at most 10 rows. Anything longer is a file, or a link to the source's own list (set
   `total_count` and give the link or file as the action).
5. **Sources live in Details.** Sources, assumptions and disclaimers go in `details`, never in visible text or links on
   rows. The exception is an urgent instruction (for example, "call 995"). That is the answer, so it goes in the title
   and summary.
6. **Never repeat the sentence above the card.** Write one sentence in chat first, the judgement or the answer. The card
   carries the evidence. If your sentence says "Ueno fits your budget", the card shows Ueno's price, not "fits your
   budget". A failed card may stand alone.

## Shape of a turn

1. Get the answer.
2. Decide the surface: **words**, **card** or **file** (below).
3. For a card: write the one sentence, call `present_output`, and end. If the person has to pick, then ask with the
   question card (at most 4 choices).
4. If the call is rejected, fix the named field and call again once.

## Words, card or file

| The answer is… | Send | Why |
|---|---|---|
| One fact, one number, a yes/no, a definition, advice, a rewrite, a refusal | **Words only** | A card would only repeat the sentence |
| Missing inputs | **Words or the question card** | Never a speculative results card |
| 2–10 options, places, numbers over time, a status, a short brief | **Card** | Something to look at or compare |
| Anything to keep, print, edit, send or open elsewhere; more than 10 rows; long documents; decks; images; calculators | **File + a card that opens it** | The file is the deliverable and the card is its label |

## Decision table by vertical

"Inline" means the app keeps it in the chat. "Page" means the same blocks with a View all or Read row.

| Request shape | Block sequence | Inline or page | Do not |
|---|---|---|---|
| **Money:** how did I spend | numbers(Left, Spent) → chart(bar, weeks, highlight the week you name) → rows(categories) | page | lead with Spent; bars without a unit |
| Balance / net worth / quote | numbers(value, change) → chart(line) | inline | a 15-field stats grid; "as of" missing |
| Bills, invoices due | rows(payee, due date, amount, `overdue`/`paid`) | inline ≤3 | a table; a Pay button (use `open_url` to the payee) |
| Loan / tax / affordability result | header(what it is) → numbers(result, companion) → details(assumptions) | inline | a donut; sliders (a file calculator if they ask to play) |
| Transfer quote | numbers(they get, fee) → action(open_url provider) | inline | a Send button |
| **Shopping:** find me X | rows(product, "spec · rating", price, one pick) | inline ≤3 | a carousel; a Buy or Choose button |
| One product | image → text(why it fits, what buyers say) → rows(offers, pick best) → action(open_url) | page | strike-through "was" prices |
| Is this a good price | header(verdict: "S$379 is low…") → chart(line, today highlighted) | inline | the chart without the verdict |
| Delivery / refund | header(arrival or amount) → rows(steps, newest first) → action(carrier) | inline | a live map of the van |
| Price watch | status(watching, routine) → rows(target) → action(Pause) | inline | a status without its routine |
| **Real estate:** listings | map → rows(address, "size · minutes to MRT", price, pick) + total_count → action(portal) | page | a map with more than 12 pins |
| One listing | image → numbers(asking, per sqm) → action(open_url) | inline | a photo and a map together |
| Value estimate | numbers(estimate, psf) → details("not a valuation") | inline | a range bar |
| **Jobs:** roles | rows(title, "company · workplace · posted", salary, pick) | inline | logos; % match scores |
| One posting | numbers(pay, apply by) → text(what you'd do, where you fit) → action(apply at employer) | page | salary buried in text |
| Applications, offers | rows(company · role, state in secondary) / table(offer × item, total row last) | inline / page | a board with columns |
| **Travel:** flights | rows(airline, "flight · time · duration", price, pick) | inline | a Choose button (use the question card) |
| Where to stay | map(areas, selected) → rows(area, trade-off, price range, pick) | inline | more than 3 areas inline |
| Itinerary | map(stops) → text(one section per day, timed bullets) → action(open the file) | page | a timeline widget; more than 12 days (use a file) |
| Flight status | header(new time) + subtitle(delay · gate · as of) → rows(was, now) → action(airline) | inline | a live widget; red |
| Visa, packing | header(verdict) → text(bullets) → details(official source) | inline | tick-boxes |
| **Places:** one place | map or image → rows(address, good for) → action(Open in Maps) | inline | both a photo and a map |
| Directions | header(time and mode) → rows(legs) → action(primary: Maps) | inline | drawing a route |
| Restaurants | rows(name, "cuisine · rating · table at", price level, pick) | inline | a Book button (question card, then approval) |
| **Food:** recipe | numbers(time, serves) → text(Ingredients bullets, Method numbered paragraphs) | page | a cook mode |
| Nutrition | rows(energy, fat, sodium, amount trailing) | inline | a macro pie |
| Timer / reminder | status(scheduled, "rings at 19:42", routine) → action(Pause) | inline | a ticking countdown |
| **Weather:** now | numbers(now, rain chance) → chart(line, next hours) | inline | icon sets; range bars |
| Week | rows(day, conditions, low–high) | page | a 10-day inline card |
| Warning | header(warning + until) → text(what to do) → details(authority) | inline | red; hiding the warning in Details |
| **Sports:** score | header(result) → numbers(team, goals × 2) | inline | a live ticker; "as of" missing |
| Standings, fixtures | table(pos, team, played, pts) / rows(opponent, date · venue, home/away) | page / inline | more than 4 columns |
| **News:** what's happening | text(summary, what happened, still unclear) → details(outlets, linked) | page | a bias meter; quotes without sources |
| Timeline, headlines | rows(event or headline, outlet, date) | inline | summaries of summaries |
| **Education:** explain | chart (if it shows the idea) → text(2 short sections) | page | long lessons (make a handout file) |
| Quiz result, progress | numbers(score, time or streak) → chart(bar, days) | inline | confetti; flip cards |
| Worked example | text(one section, numbered paragraphs) | inline | maths markup |
| Glossary (3+ terms) | rows(term, definition) | inline | a card for one term (use words) |
| **Health:** trend | numbers(latest, average) → chart(line) → details(device, "not medical advice") | inline | goal rings |
| Medication, workout | rows(dose or phase, instruction, time or duration) | inline | Taken or Start buttons |
| Symptoms | header(what to do now) → text(summary = urgency, bullets) → details(source, limits) | inline | softening an emergency; a status block |
| **Productivity:** agenda | rows(event, place · people, time) | inline | a month grid |
| Meeting notes | text(Decided bullets) → rows(action, owner · due) | page | creating tasks without approval |
| Email draft | header(subject, "To … · draft") → text(body) | inline | a Send button |
| Watch, long work | status(watching/working, subject) → rows(stops after) → action(Pause / Stop) | inline | a status without its subject |
| **Documents:** contract review | rows(clause, meaning, "Review") → details("not legal advice") | inline | the whole contract |
| Signatures | rows(signer, date, state word) → action(open the signing site) | inline | a Nudge button |
| Compare plans | rows(plan, the one difference, price, pick) | inline | a 6-column grid on a phone |
| Brief | text(summary, ≤3 sections) → action(open the document) | page | more than a page (make a document) |
| **Data:** KPIs | numbers(metric, change) → chart(bar or line, highlight the named period) | inline | sparklines; filter chips |
| Shares, ranking | chart(bar, sorted, highlight the leader) | inline | pie or donut |
| Breakdown | table(≤4 columns, total row last, numbers `align: end`) | page | more than 10 rows (use a sheet) |
| Scatter, heatmap, big pivot | image in a file → action(open) | inline | pretending a line or bar chart shows it |

## Files

Make a file when the person will keep it, print it, edit it, send it, open it in another app, or when it outgrows a
card. Chat creates it straight into Library, with no visible task. Then show a card that labels it:

- **Invoice, receipt, itinerary, handout:** PDF. Card: numbers (amount due, due date) or a page-1 image, then
  action(primary Open, secondary Download).
- **Editable document:** only when they say "Word", "edit" or "template". DOCX. Card: text(bullets: what's inside),
  then action(Download).
- **Sheet:** anything over 10 rows, exports, and anything they will filter or sum. Card: numbers (count, total), then
  action(Open or Download).
- **Deck:** PPTX and PDF. Card: image of the title slide, then action(Open, Download PowerPoint).
- **Image or logo:** card: image, then action(Download). A new version is asked for in chat, not with a button.
- **Chart types the contract lacks** (scatter, heatmap): an image in a file. The insight goes in your sentence.

## Live pages

Use native blocks first: they cover options, numbers, charts, maps, briefs and status. Build a bespoke live page only
when the person wants to *play with* something no block covers: a rent-vs-buy calculator, a what-if model, a small
interactive explainer. It is a self-contained file with no network access. It opens in the locked pane, with
"Open in browser" as the quiet action. The card shows a poster image and opens the file. Never make a page for
something a card already shows. "Show my budget" is numbers and a chart; "let me try different budgets" is a page.

## States

The state belongs in the title or subtitle, in words. The app picks the colour from one of four meanings: done, in
progress, needs you, problem. You never choose red.

| State | Say it like this | Blocks |
|---|---|---|
| Failed, recoverable | "Couldn't check flight prices" + what happened + what didn't change ("Nothing was booked.") | status(failed, detail); Retry only as `work_control` on a real Work Unit |
| Partial | subtitle "3 of 4 stores checked"; name the gap in your sentence | the rows you have |
| Stale | subtitle "As of Fri 26 Sep close · markets closed" | the last good value, still first |
| Empty | "No 3-room HDB in Bishan under S$500k" + the nearest useful fact | status(empty, detail) |
| Working / watching / scheduled | "112 of about 400 checked", "since 9:40 AM", "rings at 19:42" | status + subject + one quiet control |
| Row states | the word that fits: "Overdue", "Refunded", "Signed", "Not opened" | `status: overdue/paid` where they fit; otherwise the word goes in `trailing` or `secondary` until the contract adds meanings |

Anything live or time-sensitive (prices, scores, weather, flights, balances, news) carries "as of HH:MM" in the subtitle.

## Voice

Harso's voice: calm system first, trusted colleague second.

- State first, then reassure. "Done. 14 files moved." Not "Great news!" Never use exclamation marks or emoji.
- Use numerals for numbers people act on. Every number carries its unit or currency ("S$612", "72 dB", "58 bpm").
  Use one date format per card ("12 Oct", "Sat 27 Sep").
- Name the boundary: "I can't move money between banks. Nothing was changed." Never "something went wrong", "please
  try again later" or "oops".
- Banned words: seamless, effortless, magic, delve, supercharge, unleash, empower, frictionless, game-changing,
  cutting-edge.
- Use sentence case, and plain text only in every field: no markdown, no HTML, no links in visible text.
- `fallback_text` is the whole answer in one or two plain sentences, for any device that cannot draw the card.

## What the checker enforces

`scripts/check-output-playbook.mjs` checks every example for:

- **Contract validity:** schema, one block per kind, action last, one pick, arity, status subject, public https links,
  16 KiB.
- **Law 3:** no reply buttons.
- **Law 4:** at most 10 rows sent, at most 4 table columns.
- **Law 5:** no links or "source:" in visible text; news, health and weather carry Details.
- **Law 6:** no visible field repeats the chat sentence.
- **Style and voice:** no style keys, no markup, no banned words, no exclamation marks.
- **Plain text:** words-only examples send no card.
- **Files:** file examples open or download an artifact.
- **Truth:** rows beyond those sent are reachable.
- **Data:** charts state a unit.
- **Staleness:** time-sensitive examples carry "as of".
- **Surface:** the declared surface matches the inline caps.

## Contract source

`schema/output-blocks.v1.json` is a byte-for-byte copy of weave-cloud `packages/contracts/src/schemas/output-blocks.v1.json`,
last changed in commit `db2db1ab`, read at origin/main `7c899530`, sha256
`470aa1aec345587faaa4004ee00a499f3044540dfbde1126ff130072fdd68f87`. The checker refuses a copy whose hash differs from
the one recorded in the examples file, so a schema change has to be re-copied on purpose. Where the contract cannot
express an example cleanly (row state meanings, grouped rows, delta, totals, ordered steps, as-of, row image or link),
the workaround used above is the rule until the backend adds the field.
