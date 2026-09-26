# Data and analysis: gaps

What the `output-blocks.v1` contract (sha256 `470aa1ae…`) cannot express honestly for the data examples in
`catalogue/data.json`. For each gap you get the nearest honest example, and the smallest field that would fix it.
Gaps already numbered in the playbook's coverage file (G1–G24) are cited by number and not re-argued. Renderer
findings are listed separately at the end, because they belong to the renderer lanes (PR #11, #12), not to the
contract.

## Contract gaps

| # | Needed by | What is missing | What the example does instead | Smallest fix |
|---|---|---|---|---|
| D-1 | `data-target` | A **target line** on a line chart (G9). | The running total is a line. The gap to the target is a number ("S$11,400 Left to target"), and the target is in the subtitle. The chart cannot show how far the line is from the goal. | `chart.target {value, label}` (G9) |
| D-2 | `data-kpis`, `data-kpis-week`, `data-metric-trend`, `data-year-compare` | A **change beside a number** (G3). | The change is its own number tile ("+12% vs July"). This uses up the 2-number inline cap, so a KPI card can show only one metric. | `number.delta` (line16) (G3) |
| D-3 | `data-table-small`, `data-pivot`, `data-product-breakdown` | A **totals row** (G4). | The last row is labelled "Total". Nothing but the word marks it as a total, so a renderer has to guess. | `table_block.totals {cells}` (G4) |
| D-4 | `data-kpis`, `data-filter-weeks` | **Unequal periods** on a category axis. August splits into 7+7+7+10 days. | Bars show average sales a day, not weekly totals, and the subtitle says so ("Average sales a day, by week"). Weekly totals would have made the 10-day week look best simply because it is longer (this was the F0 example, now fixed). | None required. The honest measure is a rate. A caption field (G19) would let the chart say "a day" beside the axis instead of in the subtitle. |
| D-5 | `data-kpis-week` | A **future slot** on a time axis (Sunday has not happened yet). | The chart sends only the days that have happened (Mon–Sat). `null` means "not reported yet" (the partial law), so it is not used for a day that has not happened. | None. Leaving the slot out is honest, and a new field would add a third kind of blank. |
| D-6 | `data-share-payments` | A **share of a count** (orders), not money. | Share rows carry the count in `trailing` ("719 orders"), and the total is in the subtitle ("1,240 orders"). The checker's "adds up to the total" law parses only S$ amounts, so here the sum (719+384+137 = 1,240) is checked by hand, not by the checker. | The share master (G18/G24) should accept any unit. The checker's money-only sum is a checker limit, noted for the lead. |
| D-7 | `data-channel-share` partial, `data-share-payments` partial | A **partial share**: 2 of 3 channels read. | The rows show amounts with no percentages, and the subtitle says "2 of 3 channels read". A share of an incomplete whole would be false, so no % is shown until every part is in. | None. This is the honest rule. The playbook could state it. |
| D-8 | `data-year-compare` | **Two series with one highlighted point**: which series does `highlight_index` call out? | Highlight March, the month the sentence names ("ahead since March"). Both series are marked at that index. | None for now. `highlight_series` would be needed only if an example had to call out one series. |
| D-9 | `file-scatter`, `data-heatmap` | Scatter and heatmap charts (G12, by design). | An image of the chart in a file. The insight goes in the sentence. | None (R1 ruling). |
| D-10 | `data-sales-collections` | A **row link** for each late invoice (G8). | One `open_url` to Xero's filtered unpaid list. | `row.url` (G8) |
| D-11 | `data-filter-weeks`, `text-filter` | A **filter echo**: what the answer is narrowed to. | The subtitle says "online store only". There are no chips (a ruling). | None (G-B1-7, rejected on purpose). |

## Renderer findings (outside this lane; from a scratch preview of this data merged with PR #11 and #12)

Shot in a throwaway worktree at `/tmp/cat-data-preview` (this branch + `origin/codex/wev-output-status-media`, which
contains #11). Nothing from that worktree was pushed.

| # | Renderer | Finding | Evidence |
|---|---|---|---|
| R-1 | table (#11 `output-card-charts.tsx:381`) | At 420 wide, a 3-column table whose first cell is a long CJK name (`亚麻衬衫男士长袖夏季薄款透气商务休闲`) pushes the Revenue column past the card edge. The column scrolls sideways, but nothing on screen shows that it can: "S$12…" is cut at the edge and the header is out of view. At 390 the whole column is out of view. | Probe sheet `/tmp/cat-data-probe/catalogue-data-light.png` (hostile data, not a catalogue example) |
| R-2 | header subtitle (kit `output-card.tsx:212`) | A subtitle that mixes Arabic with "1–31 Aug" is drawn as "31–1": the numbers take the Arabic run's direction. Text fields need `dir="auto"` / bidi isolation. | Same probe sheet, first card |
| R-3 | numbers | "S$1,234,567k" and "+1,234.5%" fit at 390. No finding. | Same probe |

Before this lane touched the data, the unit "S$ a day" rendered as "1,670 S$ a day", because the money-unit regex in
`withUnit` matches only bare currency symbols. The data now sends `S$` and names the rate in the subtitle, so this is
recorded as fixed-in-data, not as a renderer finding.
