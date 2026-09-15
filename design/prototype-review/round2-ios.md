# Weave iOS prototype — round-2 independent strict review

**Verdict: nearly ready; not full sign-off.** All 74 indexed iOS PNGs were individually inspected with `vision_analyze` in Light and Dark. All decoded at 390×844. Every named round-1 defect is visually resolved. A fresh sibling-control inconsistency remains below the brief’s threshold on the two project Work screens.

## Method

Read REVIEW-BRIEF, design direction, and round-1 ios.md before inspection. Each full PNG was reviewed separately; extra crops checked system indicators, list separators and segmented-control sibling styling. Scores are reviewer-adjudicated: 9 = no concrete visible defect found; 8 = ready with one minor nit; 7 = meaningful consistency defect. No 10s awarded from static evidence. H/M/L indicate high/medium/low severity.

Do not adopt the vision backend’s unrelated “compressed scale,” demands for glass/translucency or SF assets, unsupported contrast estimates, absent-interaction claims, or penalties for valid sparse content. Flat tonal surfaces, inset sheets, illustrative data and intentional swipe states are permitted by the brief. These scores concern shown visual states, not production feature completeness.

## Per-screen scores

Exact evidence paths appear in `ios-r2-review-data.json`; pattern: `/tmp/harso-sk/proto-review/ios-<appearance lowercase>-<id>.png`.

| screen (platform/appearance/id) | score | defects |
|---|---|---|
| ios/Light/projects | Score: 9/10 | None observed. R1 blank search accessory removed; recognizable system indicators replace placeholder glyphs. |
| ios/Light/projects--new | Score: 9/10 | None observed. Scrim, name field, actions and safe-area clearance intact; Dark Create uses dark ink on light fill (C1 fixed). |
| ios/Light/project | Score: 9/10 | None observed. R1 duplicate Personal heading removed; Dark primary contrast repaired. Neutral selected Conversations segment is the sibling reference for project--work. |
| ios/Light/recent | Score: 9/10 | None observed. R1 blank search accessory removed; Dark Delete is coral text on dark fill (C2 fixed). Intentional swipe exposure is not clipping. |
| ios/Light/signin | Score: 9/10 | None observed. Auth choices, email and explanatory copy fit; Dark Continue now inverse monochrome (C1 fixed). |
| ios/Light/home | Score: 9/10 | None observed. R1 home indicator restored; composer clears floating root tabs. |
| ios/Light/conversation | Score: 9/10 | None observed. R1 missing I repaired: Before executing anything, I’ll ask you. Terminal card now has Review approval disclosure. |
| ios/Light/artifacts | Score: 9/10 | None observed. R1 blank search accessory removed; all four deliverable cards fit. |
| ios/Light/conversation--approval | Score: 9/10 | None observed. R1 permission scope now Always allow npm test in Personal; home indicator restored and background copy corrected; Dark Allow once contrast fixed. |
| ios/Light/artifacts--detail | Score: 9/10 | None observed. Readable migration-notes preview; no light artifact in Dark. |
| ios/Light/conversation--menu | Score: 9/10 | None observed. R1 Cancel now structurally detached from action stack; background I’ll corrected; scrim and bottom clearance intact. |
| ios/Light/routines | Score: 9/10 | None observed. R1 paused-row disclosure restored; schedule now Every day, not Every 1d. |
| ios/Light/conversation--delete | Score: 9/10 | None observed. Scope and irreversible outcome explicit; scrim present; destructive text now on tonal fill (Dark C2 fixed). |
| ios/Light/routines--new | Score: 9/10 | None observed. R1 instructions now multiline; schedule has disclosure; Dark Create routine contrast fixed. No sheet clipping. |
| ios/Light/search | Score: 8/10 | L: Cancel remains a boxed secondary control rather than the lighter plain-text search-dismissal treatment. R1 duplicate billing chip removed and × clear action visible. |
| ios/Light/customize | Score: 9/10 | None observed. R1 profile selection/drill-down ambiguity repaired with checked-circle versus empty-circle selection; skill toggles remain distinct. |
| ios/Light/activity | Score: 9/10 | None observed. R1 home indicator restored; End of recent activity replaces contradictory all-clear; pending states coherent. |
| ios/Light/settings | Score: 8/10 | L: Grouped settings rows are separated by whitespace rather than the design-direction indented hairlines. All rows fit above root tabs; no clipping. |
| ios/Light/settings-account | Score: 8/10 | L: Grouped rows lack visible indented separators. R1 Sign out chevron removed; action and device scope clear. |
| ios/Light/settings-devices | Score: 9/10 | None observed. R1 phone/laptop glyphs now recognizable; footer gives actionable guidance: select another device and review its session. |
| ios/Light/settings-general | Score: 9/10 | None observed. R1 English has disclosure; DEVICE PREFERENCES replaces incorrect CONVERSATIONS grouping. |
| ios/Light/settings-appearance | Score: 9/10 | None observed. R1 Text size / Default has disclosure. System selection valid in either appearance. |
| ios/Light/settings-voice | Score: 8/10 | L: Grouped rows lack visible indented separators. R1 Voice / Default now has disclosure; microphone copy coherent. |
| ios/Light/settings-notifications | Score: 9/10 | None observed. Options and iOS permission caveat readable; no evidence of denied permission demanding recovery UI. |
| ios/Light/activity--work | Score: 9/10 | None observed. R1 overall Waiting for approval and step NEEDS YOUR INPUT replace Running/In progress; Review approval replaces Respond; Dark CTA contrast fixed. |
| ios/Light/settings-connections | Score: 8/10 | L: Indented row hairlines absent, confirmed by crop and Light pixel inspection; whitespace alone separates integrations/actions. Connection labels and disclosures otherwise clear. |
| ios/Light/settings-billing | Score: 8/10 | L: Billing history is grouped under USAGE rather than a billing subsection. R1 usage now Tokens this month 32k / 200k and Requests: 41 / 500; Dark Choose plan contrast fixed. |
| ios/Light/settings-privacy | Score: 9/10 | None observed. R1 diagnostic row now has shield icon and same text inset as Export/Delete. |
| ios/Light/settings-shortcuts | Score: 9/10 | None observed. Connected-keyboard explanation validates command shortcuts; no clipping. |
| ios/Light/settings-about | Score: 9/10 | None observed. R1 unfinished version replaced with 1.0.0 (1); illustrative version is not a verified release claim. |
| ios/Light/settings--sign-out | Score: 9/10 | None observed. Device-only scope and retained conversations clear; Dark destructive text on tonal fill fixes C2; home-indicator clearance intact. |
| ios/Light/settings-billing--plan | Score: 9/10 | None observed. R1 pricing now Monthly · US$300 / Annual · US$3,000, with monthly renewal-until-canceled disclosure. Dark Continue contrast fixed; no clipping. Prices reviewed as illustrative, not verified commercial terms. |
| ios/Light/project--empty | Score: 9/10 | None observed. R1 duplicate Personal heading removed; explanation and primary action complete. |
| ios/Light/artifacts--empty | Score: 9/10 | None observed. R1 detached Only real deliverables disclaimer removed; single centered explanation and action. |
| ios/Light/project--work | Score: 7/10 | M: Same segmented control changes its selected-state language: Work uses blue text/blue tint, whereas Conversations in project and project--empty uses neutral selected surface/ink. Standardize the component across states. R1 duplicate title and Dark CTA contrast are fixed. |
| ios/Light/artifacts--code | Score: 9/10 | None observed. R1 unrelated JavaScript replaced with HTML containing the same migration heading, paragraph, migrated status and three ordered steps as Preview. |
| ios/Light/artifacts--share | Score: 8/10 | L: Action group lacks visible indented row separator. R1 Copy link chevron removed (Save to Files also no chevron); scrim and bottom clearance intact. |
| ios/Dark/signin | Score: 9/10 | None observed. Auth choices, email and explanatory copy fit; Dark Continue now inverse monochrome (C1 fixed). |
| ios/Dark/home | Score: 9/10 | None observed. R1 home indicator restored; composer clears floating root tabs. |
| ios/Dark/conversation | Score: 9/10 | None observed. R1 missing I repaired: Before executing anything, I’ll ask you. Terminal card now has Review approval disclosure. |
| ios/Dark/conversation--approval | Score: 9/10 | None observed. R1 permission scope now Always allow npm test in Personal; home indicator restored and background copy corrected; Dark Allow once contrast fixed. |
| ios/Dark/conversation--menu | Score: 9/10 | None observed. R1 Cancel now structurally detached from action stack; background I’ll corrected; scrim and bottom clearance intact. |
| ios/Dark/conversation--delete | Score: 9/10 | None observed. Scope and irreversible outcome explicit; scrim present; destructive text now on tonal fill (Dark C2 fixed). |
| ios/Dark/search | Score: 8/10 | L: Cancel remains a boxed secondary control rather than the lighter plain-text search-dismissal treatment. R1 duplicate billing chip removed and × clear action visible. |
| ios/Dark/activity | Score: 9/10 | None observed. R1 home indicator restored; End of recent activity replaces contradictory all-clear; pending states coherent. |
| ios/Dark/activity--work | Score: 9/10 | None observed. R1 overall Waiting for approval and step NEEDS YOUR INPUT replace Running/In progress; Review approval replaces Respond; Dark CTA contrast fixed. |
| ios/Dark/projects | Score: 9/10 | None observed. R1 blank search accessory removed; recognizable system indicators replace placeholder glyphs. |
| ios/Dark/projects--new | Score: 9/10 | None observed. Scrim, name field, actions and safe-area clearance intact; Dark Create uses dark ink on light fill (C1 fixed). |
| ios/Dark/project | Score: 9/10 | None observed. R1 duplicate Personal heading removed; Dark primary contrast repaired. Neutral selected Conversations segment is the sibling reference for project--work. |
| ios/Dark/recent | Score: 9/10 | None observed. R1 blank search accessory removed; Dark Delete is coral text on dark fill (C2 fixed). Intentional swipe exposure is not clipping. |
| ios/Dark/artifacts | Score: 9/10 | None observed. R1 blank search accessory removed; all four deliverable cards fit. |
| ios/Dark/artifacts--detail | Score: 9/10 | None observed. Readable migration-notes preview; no light artifact in Dark. |
| ios/Dark/routines | Score: 9/10 | None observed. R1 paused-row disclosure restored; schedule now Every day, not Every 1d. |
| ios/Dark/routines--new | Score: 9/10 | None observed. R1 instructions now multiline; schedule has disclosure; Dark Create routine contrast fixed. No sheet clipping. |
| ios/Dark/customize | Score: 9/10 | None observed. R1 profile selection/drill-down ambiguity repaired with checked-circle versus empty-circle selection; skill toggles remain distinct. |
| ios/Dark/settings | Score: 8/10 | L: Grouped settings rows are separated by whitespace rather than the design-direction indented hairlines. All rows fit above root tabs; no clipping. |
| ios/Dark/settings-account | Score: 8/10 | L: Grouped rows lack visible indented separators. R1 Sign out chevron removed; action and device scope clear. |
| ios/Dark/settings-devices | Score: 9/10 | None observed. R1 phone/laptop glyphs now recognizable; footer gives actionable guidance: select another device and review its session. |
| ios/Dark/settings-general | Score: 9/10 | None observed. R1 English has disclosure; DEVICE PREFERENCES replaces incorrect CONVERSATIONS grouping. |
| ios/Dark/settings-appearance | Score: 9/10 | None observed. R1 Text size / Default has disclosure. System selection valid in either appearance. |
| ios/Dark/settings-voice | Score: 8/10 | L: Grouped rows lack visible indented separators. R1 Voice / Default now has disclosure; microphone copy coherent. |
| ios/Dark/settings-notifications | Score: 9/10 | None observed. Options and iOS permission caveat readable; no evidence of denied permission demanding recovery UI. |
| ios/Dark/settings-connections | Score: 8/10 | L: Indented row hairlines absent, confirmed by crop and Light pixel inspection; whitespace alone separates integrations/actions. Connection labels and disclosures otherwise clear. |
| ios/Dark/settings-billing | Score: 8/10 | L: Billing history is grouped under USAGE rather than a billing subsection. R1 usage now Tokens this month 32k / 200k and Requests: 41 / 500; Dark Choose plan contrast fixed. |
| ios/Dark/settings-privacy | Score: 9/10 | None observed. R1 diagnostic row now has shield icon and same text inset as Export/Delete. |
| ios/Dark/settings-shortcuts | Score: 9/10 | None observed. Connected-keyboard explanation validates command shortcuts; no clipping. |
| ios/Dark/settings-about | Score: 9/10 | None observed. R1 unfinished version replaced with 1.0.0 (1); illustrative version is not a verified release claim. |
| ios/Dark/settings--sign-out | Score: 9/10 | None observed. Device-only scope and retained conversations clear; Dark destructive text on tonal fill fixes C2; home-indicator clearance intact. |
| ios/Dark/settings-billing--plan | Score: 9/10 | None observed. R1 pricing now Monthly · US$300 / Annual · US$3,000, with monthly renewal-until-canceled disclosure. Dark Continue contrast fixed; no clipping. Prices reviewed as illustrative, not verified commercial terms. |
| ios/Dark/project--empty | Score: 9/10 | None observed. R1 duplicate Personal heading removed; explanation and primary action complete. |
| ios/Dark/artifacts--empty | Score: 9/10 | None observed. R1 detached Only real deliverables disclaimer removed; single centered explanation and action. |
| ios/Dark/project--work | Score: 7/10 | M: Same segmented control changes its selected-state language: Work uses blue text/blue tint, whereas Conversations in project and project--empty uses neutral selected surface/ink. Standardize the component across states. R1 duplicate title and Dark CTA contrast are fixed. |
| ios/Dark/artifacts--code | Score: 9/10 | None observed. R1 unrelated JavaScript replaced with HTML containing the same migration heading, paragraph, migrated status and three ordered steps as Preview. |
| ios/Dark/artifacts--share | Score: 8/10 | L: Action group lacks visible indented row separator. R1 Copy link chevron removed (Save to Files also no chevron); scrim and bottom clearance intact. |

## Below 8

Sorted by score/severity, then identifier and appearance.

- **7/10 — ios/Dark/project--work**: M: Same segmented control changes its selected-state language: Work uses blue text/blue tint, whereas Conversations in project and project--empty uses neutral selected surface/ink. Standardize the component across states. R1 duplicate title and Dark CTA contrast are fixed.
- **7/10 — ios/Light/project--work**: M: Same segmented control changes its selected-state language: Work uses blue text/blue tint, whereas Conversations in project and project--empty uses neutral selected surface/ink. Standardize the component across states. R1 duplicate title and Dark CTA contrast are fixed.

## Round-1 defect closure ledger

**All entries below were checked in both appearances unless Dark-only is stated. No named R1 defect remains open.** This is visual closure only, not runtime proof.

| R1 defect | R2 finding / evidence screens | Status |
|---|---|---|
| S1 dots/triangle/vertical-block status glyphs | Every PNG shows recognizable cellular bars, Wi-Fi arcs and horizontal framed battery. Projects status crop confirms actual shapes; generic “Android” criticism is not supported under a brief that prohibits copying SF styling. | Fixed |
| C1 Dark light-on-bright-blue primary labels | signin, projects--new, project, project--work, conversation--approval, routines--new, activity--work, settings-billing, settings-billing--plan now use dark text on light monochrome primary fill. | Fixed |
| C2 Dark light-on-coral destructive labels | recent, conversation--delete, settings--sign-out now use coral text on dark tonal surfaces. | Fixed |
| Blank trailing search accessory | projects, recent, artifacts show clean empty-query search bars without a phantom box. | Fixed |
| Duplicate Personal nav/large heading | project, project--empty, project--work have a single centered Personal title. | Fixed |
| Missing home indicator | home, activity, conversation--approval now include indicator with clearance. | Fixed |
| Missing I in I’ll | conversation and visible menu/approval bases show complete I’ll sentence. | Fixed |
| Approval-required card lacks response affordance | conversation terminal card includes Review approval ›. | Fixed |
| Always allow lacks command/project scope | approval option explicitly says Always allow npm test in Personal. | Fixed |
| Menu Cancel not structurally separate | conversation--menu now has detached Cancel container. | Fixed |
| Paused routine lacks disclosure; Every 1d | routines has paused-row chevron and human-readable Every day. | Fixed |
| Single-line routine instructions; no schedule cue | routines--new has two-line instructions area and schedule disclosure. | Fixed |
| Search duplicate billing chip / unidentified clear | search has one query plus × clear glyph. | Fixed |
| Profile selection mixed with drill-down | customize uses selected checked circle and unselected circle. | Fixed |
| Activity all-clear contradicts needs-input | activity uses End of recent activity and pending state labels. | Fixed |
| Sign out push chevron | settings-account action no longer has chevron. | Fixed |
| Device empty square glyphs / account-service jargon | settings-devices has phone/laptop icons and plain select-device guidance. | Fixed |
| Language picker cue / haptics under CONVERSATIONS | settings-general shows English › under DEVICE PREFERENCES. | Fixed |
| Text size picker cue | settings-appearance shows Default ›. | Fixed |
| Voice picker cue | settings-voice shows Default ›. | Fixed |
| Work Running/In progress contradicts waiting / vague Respond | activity--work uses Waiting for approval / NEEDS YOUR INPUT and Review approval. | Fixed |
| Usage Available without values | settings-billing shows Tokens this month 32k / 200k and Requests: 41 / 500. | Fixed |
| Diagnostic label inset mismatch | settings-privacy now has shield icon and aligned labels. | Fixed |
| Version iOS prototype | settings-about shows 1.0.0 (1). | Fixed |
| Plan lacks price/currency/renewal | plan sheet shows US$300 monthly / US$3,000 annual, monthly billing and renewal-until-canceled copy before Continue. | Fixed |
| Detached duplicate artifacts disclaimer | artifacts--empty consolidates explanation in centered empty state. | Fixed |
| HTML preview vs unrelated JS source | artifacts--code displays HTML matching preview heading, paragraph, migrated status and ordered steps. Styling/CSS need not be visible for semantic content correspondence. | Fixed |
| Copy link misleading chevron | artifacts--share action has no disclosure. | Fixed |

## Cross-cutting

1. **Standardize the project segment component (M).** Work-selected changes to blue text/tint while Conversations-selected uses neutral surface/ink. This is not an objection to either style individually: the same sibling control changes its selection language. Correct the Work variant in both appearances; this is the only below-8 finding.
2. **Finish indented list hairlines (L).** Connections, Account, Voice, Settings and the Share action group visually rely on whitespace rather than the specified inset separators. Connections was additionally cropped and sampled: x64–349, y180–284 remains white as the dominant row color throughout, not an overlooked gray horizontal divider. Legible whitespace grouping prevents this from becoming a usability blocker; it is one minor design-direction nit on affected rows.
3. **Retain the sensitive-flow repairs.** Scoped permission choice, upfront plan amounts, actual usage values, coherent work states, readable primary/destructive labels and artifact/source correspondence are genuine improvements. Do not regress these while polishing chrome.
4. **Small grouping/control nits (L).** Search Cancel is visually heavier than necessary; Billing history sits inside USAGE. Neither obstructs the shown action or comprehension.
5. **Contrast adjudication.** Vision repeatedly invented low-contrast ratios. PNG sampling instead found Dark destructive text `(255,123,115)` on `(38,42,49)` = **5.72:1**, and Light destructive text `(185,52,39)` on `(238,240,243)` = **5.13:1**. These resolve C2 rather than carry it forward. Reference palette calculations for gray `(130,132,135)` on dark canvas `(19,21,24)` = **4.88:1**, `(165,170,179)` on `(28,31,36)` = **7.08:1**, and `(91,96,103)` on white = **6.34:1** explain why broad “all secondary text fails” claims were rejected. This is targeted verification, not an exhaustive accessibility certification.

## Limits and read-only boundary

No Sketch/source edits, browser navigation or external mutations. Only report/scratch review files were written under `/tmp/harso-sk/proto-review`. Static images cannot prove exact tappable hit rectangles, VoiceOver, Dynamic Type, scrolling/keyboard avoidance, persistent permission semantics, real subscription pricing, checkout behavior, or feature parity with the shipped desktop. In particular the scoped approval label does not prove how command-prefix matching works, and the displayed version/prices are treated as illustrative prototype data. Those require live product checks; no claims of App Store compliance or actual runtime safety are made.

REVIEW_RESULT: 74 screens 72 ≥8 2 <8
