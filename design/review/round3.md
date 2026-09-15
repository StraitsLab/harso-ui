# Round 3 — independent strict visual review (r3)

**Verdict: not fully approved.** Most retouched families are now shippable. MedicalProfile still has its R2 selected-date alignment defect; MarketingDashboard has a newly identified right-axis label/bar collision. Both occur in Light/Clean and Dark/Clean.

## Scope and evidence

Reviewed exactly the 34 entries in the current index, fresh rather than incrementing R2 scores. All PNGs decoded successfully at their indexed dimensions and each received an individual vision_analyze call. Every desktop template received lower-half region inspection in both appearances; DataTable mobile and ambiguous chart/calendar details were also zoomed. Available family web references were freshly inspected (desktop-light for structure, plus phone-dark HR/DataTable). Native Menu/TabBar have no corresponding direct reference in this set. Existing R2 reports supplied the reconciliation checklist, not the verdict.

Tall scrolling templates are explicitly allowed in R3. There is **no export-height penalty** and no confirmed content spilling outside the visible application frame. The earlier R2 insistence on an 800px template height is superseded, not an outstanding defect. Screenshot containment is not a Sketch layer-bound certification.

Scores use the supplied rubric: 8 = shippable with at most one minor nit, 7 = one clear defect, ≤6 = multiple/structural defects. Coordinates are approximate visual locations unless explicitly identified as pixel-read evidence. No WCAG ratio, hidden target size, runtime interaction or illustrative-data correctness certification is implied.

| sheet | score | defects (concrete, with approx px / which specimen) |
|---|---|---|
| FinanceDashboard — Light/Clean | Score: 8/10 | R2 repaired: dated category heatmap with range arrows/intensity/No data key, full Merchant/Category/Date/Amount table with search/filter/selection/sorts/pagination, and Cash flow node/link lists with inspect arrows are present. Lower-half zoom confirms containment. No confirmed defect. |
| FinanceDashboard — Dark/Clean | Score: 8/10 | R2 repaired: dated category heatmap with range arrows/intensity/No data key, full Merchant/Category/Date/Amount table with search/filter/selection/sorts/pagination, and Cash flow node/link lists with inspect arrows are present. Lower-half zoom confirms containment. No confirmed defect. |
| HomeDashboard — Light/Clean | Score: 8/10 | R2 repaired: Customers table, Product/Price filters, selection/sorts/pagination and Contributions numeric intensity/No data key present. Lower-half zoom confirms no overflow or clipping. |
| HomeDashboard — Dark/Clean | Score: 8/10 | R2 repaired: Customers table, Product/Price filters, selection/sorts/pagination and Contributions numeric intensity/No data key present. Lower-half zoom confirms no overflow or clipping. |
| HrManagement — Light/Clean | Score: 8/10 | R2 repaired: People/Departments/Hiring sources/Locations breakdown, Inspect workforce movement and Employees table with all four filters, role sublabels, status dropdowns, selection/sorts/pagination present. No confirmed containment defect. |
| HrManagement — Dark/Clean | Score: 8/10 | R2 repaired: People/Departments/Hiring sources/Locations breakdown, Inspect workforce movement and Employees table with all four filters, role sublabels, status dropdowns, selection/sorts/pagination present. No confirmed containment defect. |
| MarketingDashboard — Light/Clean | Score: 7/10 | NEWLY IDENTIFIED clear defect: Investment and return right-axis 0 directly touches/overlaps the lower-right edge of the August bar (around x710, y965–974; no clear whitespace, roughly 1–2px contact). R2 missing Campaigns table, filters, editable Delivery pills, selection/sorts/pagination, both Inspect data links and People arriving keys are repaired. R2 below-baseline bars are FIXED: pixel inspection puts baseline at y973 and clean background below y974. |
| MarketingDashboard — Dark/Clean | Score: 7/10 | NEWLY IDENTIFIED clear defect: Investment and return right-axis 0 directly touches/overlaps the lower-right edge of the August bar (around x710, y965–974; no clear whitespace, roughly 1–2px contact). R2 missing Campaigns table, filters, editable Delivery pills, selection/sorts/pagination, both Inspect data links and People arriving keys are repaired. R2 below-baseline bars are FIXED: pixel inspection puts baseline at y973 and clean background below y974. |
| MedicalProfile — Light/Clean | Score: 7/10 | R2 REMAINS: selected calendar 7 sits near the left edge of an elongated roughly 60–70px pill, with about 5–8px left clearance versus roughly 45–55px right clearance (Days in motion, around y750). No overlap with 8 claimed. Important updates feed/Inspect/Unread and Patients table, filters, Admission dropdowns, selection/sorts/pagination restored; unrelated Sleep breakdown substitution removed. Lower content contained. |
| MedicalProfile — Dark/Clean | Score: 7/10 | R2 REMAINS: selected calendar 7 sits near the left edge of an elongated roughly 60–70px pill, with about 5–8px left clearance versus roughly 45–55px right clearance (Days in motion, around y750). No overlap with 8 claimed. Important updates feed/Inspect/Unread and Patients table, filters, Admission dropdowns, selection/sorts/pagination restored; unrelated Sleep breakdown substitution removed. Lower content contained. |
| HrManagementPhone — Light/Clean | Score: 8/10 | R2 repaired: employee Role, employment-status dropdown, Department, Start date and labeled Salary replace generic work-record schema. Search/Department/Status/Salary filters, bulk selection, Employee/Start date/Salary sorts and compact count/pagination present. No clipping. |
| HrManagementPhone — Dark/Clean | Score: 8/10 | R2 repaired: employee Role, employment-status dropdown, Department, Start date and labeled Salary replace generic work-record schema. Search/Department/Status/Salary filters, bulk selection, Employee/Start date/Salary sorts and compact count/pagination present. No clipping. |
| DataTable — Light/Clean | Score: 8/10 | R2 repaired: mobile cards preserve Work/Sources/Status schema and eye actions; bulk-selection/Work and Sources sorts, selected-count and compact pagination restored. Desktop partial selection remains coherent. Bottom zoom confirms footer inside card; no clipping. |
| DataTable — Dark/Clean | Score: 8/10 | R2 repaired: mobile cards preserve Work/Sources/Status schema and eye actions; bulk-selection/Work and Sources sorts, selected-count and compact pagination restored. Desktop partial selection remains coherent. Bottom zoom confirms footer inside card; no clipping. |
| StatCards — Light/Clean | Score: 8/10 | R2 repaired: Sources reviewed information icon now sits beside its header. All six metrics and supporting copy fit. Illustrative values and intentional four-plus-two layout not penalized. |
| StatCards — Dark/Clean | Score: 8/10 | R2 repaired: Sources reviewed information icon now sits beside its header. All six metrics and supporting copy fit. Illustrative values and intentional four-plus-two layout not penalized. |
| AreaChartCard — Light/Clean | Score: 8/10 | R2 repaired: Referral and Paid have distinctly darker/lighter grey legend dots and matching boundary strokes, confirmed in regional zoom. All three stacked bands and totals fit. Plot-ending strokes are not clipping; no confirmed defect. |
| AreaChartCard — Dark/Clean | Score: 8/10 | R2 repaired: Referral and Paid have distinctly darker/lighter grey legend dots and matching boundary strokes, confirmed in regional zoom. All three stacked bands and totals fit. Plot-ending strokes are not clipping; no confirmed defect. |
| RadarChartCard — Light/Clean | Score: 8/10 | R2 repaired: circular point markers present at Reach, Care and center/near-center vertices. Raw 0 and 0.25 naturally coincide visually on the 0–100 scale; not a defect. Week/filled controls, guides and value tiles fit. |
| RadarChartCard — Dark/Clean | Score: 8/10 | R2 repaired: circular point markers present at Reach, Care and center/near-center vertices. Raw 0 and 0.25 naturally coincide visually on the 0–100 scale; not a defect. Week/filled controls, guides and value tiles fit. |
| SankeyChartCard — Light/Clean | Score: 8/10 | R2 repaired: trailing inspect arrows present in every node/link row. Flow, named values and This month control contained. Minor reference nit: arrows point right rather than diagonally up-right; inspect affordance is still explicit. |
| SankeyChartCard — Dark/Clean | Score: 8/10 | R2 repaired: trailing inspect arrows present in every node/link row. Flow, named values and This month control contained. Minor reference nit: arrows point right rather than diagonally up-right; inspect affordance is still explicit. |
| SleepScoreCard — Light/Clean | Score: 8/10 | R2 repaired: Stage 2 and Stage 3 arcs and dots now use distinctly different grey luminances in this appearance. Segmented geometry, stage values/goals and Week fit; zero Stage 1 correctly has no active arc. |
| SleepScoreCard — Dark/Clean | Score: 8/10 | R2 repaired: Stage 2 and Stage 3 arcs and dots now use distinctly different grey luminances in this appearance. Segmented geometry, stage values/goals and Week fit; zero Stage 1 correctly has no active arc. |
| Menu — Light/Clean | Score: 8/10 | R2 repaired: submenu-open highlights Move to project, not Duplicate; default specimen retains its independent Duplicate hover. Flyout remains in trigger neighborhood with roughly 6–8px gap. No clipping or content overlap. |
| Sidebar — Light/Clean | Score: 8/10 | R2 repaired: collapsed rail has a dedicated pane-toggle icon above the separate workspace icon. Expanded/collapsed destination order and contained footer retained. No confirmed defect. |
| TabBar — Light/Clean | Score: 8/10 | R2 repaired: all inactive icon/label stacks are horizontally centered, including Projects; active Home remains centered. No clipping or clear alignment defect. |
| Menu — Dark/Clean | Score: 8/10 | R2 repaired: submenu-open highlights Move to project, not Duplicate; default specimen retains its independent Duplicate hover. Flyout remains in trigger neighborhood with roughly 6–8px gap. No clipping or content overlap. |
| Sidebar — Dark/Clean | Score: 8/10 | R2 repaired: collapsed rail has a dedicated pane-toggle icon above the separate workspace icon. Expanded/collapsed destination order and contained footer retained. No confirmed defect. |
| TabBar — Dark/Clean | Score: 8/10 | R2 repaired: all inactive icon/label stacks are horizontally centered, including Projects; active Home remains centered. No clipping or clear alignment defect. |
| EnvironmentVariables — Light/Clean | Score: 8/10 | R2 repaired: revealed specimen says Hide values with slashed-eye glyph; masked specimen retains Show values/open-eye. Rows, hover copy action and footers fit without collisions. |
| EnvironmentVariables — Dark/Clean | Score: 8/10 | R2 repaired: revealed specimen says Hide values with slashed-eye glyph; masked specimen retains Show values/open-eye. Rows, hover copy action and footers fit without collisions. |
| ChainOfThought — Light/Clean | Score: 8/10 | R2 repaired: centered vertical connectors now span between consecutive dots without unequal 12px/27px blank gaps. Subtitle clearance and expanded/collapsed headings clean. |
| ChainOfThought — Dark/Clean | Score: 8/10 | R2 repaired: centered vertical connectors now span between consecutive dots without unequal 12px/27px blank gaps. Subtitle clearance and expanded/collapsed headings clean. |

## Below 8

- **MedicalProfile/Dark/Clean — 7/10:** R2 REMAINS: selected calendar 7 sits near the left edge of an elongated roughly 60–70px pill, with about 5–8px left clearance versus roughly 45–55px right clearance (Days in motion, around y750). No overlap with 8 claimed. Important updates feed/Inspect/Unread and Patients table, filters, Admission dropdowns, selection/sorts/pagination restored; unrelated Sleep breakdown substitution removed. Lower content contained.
- **MedicalProfile/Light/Clean — 7/10:** R2 REMAINS: selected calendar 7 sits near the left edge of an elongated roughly 60–70px pill, with about 5–8px left clearance versus roughly 45–55px right clearance (Days in motion, around y750). No overlap with 8 claimed. Important updates feed/Inspect/Unread and Patients table, filters, Admission dropdowns, selection/sorts/pagination restored; unrelated Sleep breakdown substitution removed. Lower content contained.
- **MarketingDashboard/Dark/Clean — 7/10:** NEWLY IDENTIFIED clear defect: Investment and return right-axis 0 directly touches/overlaps the lower-right edge of the August bar (around x710, y965–974; no clear whitespace, roughly 1–2px contact). R2 missing Campaigns table, filters, editable Delivery pills, selection/sorts/pagination, both Inspect data links and People arriving keys are repaired. R2 below-baseline bars are FIXED: pixel inspection puts baseline at y973 and clean background below y974.
- **MarketingDashboard/Light/Clean — 7/10:** NEWLY IDENTIFIED clear defect: Investment and return right-axis 0 directly touches/overlaps the lower-right edge of the August bar (around x710, y965–974; no clear whitespace, roughly 1–2px contact). R2 missing Campaigns table, filters, editable Delivery pills, selection/sorts/pagination, both Inspect data links and People arriving keys are repaired. R2 below-baseline bars are FIXED: pixel inspection puts baseline at y973 and clean background below y974.

## Round-2 defect reconciliation

Applies separately to both inspected appearances; untouched R2 families are not reassessed.

| R2 family | R3 disposition |
|---|---|
| FinanceDashboard | All named functional omissions repaired: category/date heatmap and its controls/key, complete transactions schema/control set, Cash flow node/link details. |
| HomeDashboard | Customers module and heatmap legend/No data restored. |
| HrManagement | Lower breakdown, Employees module and Inspect workforce movement restored. |
| MarketingDashboard | Campaigns table/control set, Inspect links and People arriving keys restored. Below-baseline bars no longer reproduce in pixel inspection. Newly identified right-zero/bar contact still blocks 8. |
| MedicalProfile | Important updates and Patients restored; unrelated Sleep breakdown removed. **Selected 7 elongated/off-centre pill remains.** |
| HrManagementPhone | All named generic-schema/filter/sort/selection/pagination omissions repaired. |
| DataTable | Mobile schema, eye actions, sort/select-all and footer restored. |
| StatCards | Sources reviewed information icon restored. |
| AreaChartCard | Neutral-series legend/stroke distinction restored. |
| RadarChartCard | Vertex markers restored. |
| SankeyChartCard | Inspect arrows restored; right-arrow versus reference diagonal arrow is only a minor nit. |
| SleepScoreCard | Neutral-segment and dot distinction restored. |
| Menu | Open trigger now highlighted correctly. |
| Sidebar | Explicit collapsed-state expand/pane toggle restored. |
| TabBar | Inactive icon/label centering repaired. |
| EnvironmentVariables | Truthful Hide values/slashed-eye action restored. |
| ChainOfThought | Unequal connector endpoint gaps repaired; x-centering remains correct. |

**Explicit answer:** the only confirmed unchanged R2 defect in this retouched set is MedicalProfile's off-centre selected-date pill, in both appearances. Marketing's right-axis collision is newly identified, not asserted to have been introduced by the retouch.

## Cross-cutting

1. **Lower-module restoration is real, not just taller framing.** Templates now contain their domain tables/feeds/breakdowns with filter, selection, sorting, editable status and pagination affordances. All bottom modules remain visibly inside their frames.
2. **Responsive schema parity is recovered.** HR phone no longer substitutes generic Review/Ready currency records; DataTable mobile preserves Sources/Status/view semantics and its control footer.
3. **State-pair coherence is repaired.** Menu parent highlight, Sidebar reverse control, EnvironmentVariables visibility action and ChainOfThought connector continuity are consistent. TabBar centering also holds in both themes.
4. **Residual geometry deserves tight crops.** Medical's date selection stretches far past its left-biased digit. Marketing's last bar has no safe gap to the secondary-axis zero. Fix the shared geometry in both themes rather than special-casing colors.
5. **Reject low-resolution false positives.** Area's greys are now distinguishable; its terminal curve is not clipped. Radar's near-zero markers naturally overlap. Generic fixture data, absence of speculative bulk actions, hollow but color-keyed legend swatches and inactive pagination treatments are not scored defects.
6. **Marketing baseline adjudication:** repeated vision passes disagreed. Read-only native pixels resolve the old baseline finding: at x320–374 the horizontal rule is y973 (light RGB 230/232/236; dark 38/42/48); bar interiors at x490 and x700 end on that rule, and y974 onward is panel background. Therefore do not carry forward the old approximately 10px below-zero overhang. The independently visible right-zero contact remains scored.

## Limits / issues encountered

Read-only review: no Sketch scripts, source edits, browser or network access. Only this report and supporting review ledger/generator were written. Initial two reference calls accidentally used a 1px crop; those empty results and their generic suggestions were discarded, and both references were re-inspected in full. No image failure blocked coverage. Vision's approximate coordinate estimates varied; disputed claims were zoomed and, for the Marketing baseline, checked directly against pixels.

REVIEW_RESULT: 34 sheets 30 ≥8 4 <8
