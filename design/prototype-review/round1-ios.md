# Weave iOS prototype — independent strict review

**Verdict: NOT READY for founder sign-off.** All 74 indexed iOS PNGs were individually inspected with `vision_analyze`; every file decoded at 390×844. Light and Dark were reviewed separately. Additional crops checked missing text, search/status glyphs, button foregrounds and home-indicator clearance. Sketch/source remained untouched.

## Method and scoring

8 = ready to show with no more than one minor nit; 7 = meaningful polish/affordance defect; 6 = substantive content or accessibility defect; 4–5 = high-impact decision flow defect, compounded where appropriate. H = high, M = medium, L = low. Scores are reviewer-adjudicated: the vision tool repeatedly called clean screens “7 / compressed scale”, contradicted the requested rubric, and sometimes objected to expressly permitted flat surfaces. Those ratings and unsupported generic criticisms were not adopted.

**Shared evidence codes:**
- **S1 (L):** Status bar depicts dots, a triangle and a vertical block instead of recognizable iOS cellular/Wi-Fi/battery indicators. This is repeated prototype chrome, not native-quality system chrome. It is the single shared minor nit on otherwise-ready screens.
- **C1 (H, Dark only):** Light label on bright blue primary fill has inadequate contrast. PNG palette sampling found blue `(110,168,255)` with label ink `(242,243,245)`; calculated contrast **2.17:1** (even pure white is only **2.41:1**). Use dark ink or a darker fill. Applies to named blue CTAs, not inverse white/ink empty-state pills or the composer send button.
- **C2 (H, Dark only):** Light label on coral destructive fill has inadequate contrast. Sampled coral `(255,123,115)` with label ink `(242,243,245)` gives **2.27:1** (white **2.52:1**). Zoom confirmed light text on coral Sign out; Delete uses the same visual treatment.

No penalty for illustrative data, valid sparse lists, ordinary whitespace, intentional swipe/preview states, external keyboard shortcuts, repeating overlay bases, flat/no-blur styling, inset floating sheets, or hidden hit areas that PNGs cannot prove. No claim of tested interactions, dynamic type, exact 44pt hit rectangles or shipped-app feature parity. Dark secondary-text failures suggested by vision were **not accepted wholesale**: sampled gray `(130,132,135)` over `(19,21,24)` is **4.88:1**, and `(165,170,179)` over `(28,31,36)` is **7.08:1**. Do not brighten all text indiscriminately.

## Per-screen scores

PNG evidence resolves as `/tmp/harso-sk/proto-review/ios-<appearance lowercase>-<id>.png`; exact paths are also retained in `ios-review-data.json`. In paired notes, only the clause for the row’s appearance applies.

| screen (platform/appearance/id) | score | defects |
|---|---|---|
| ios/Light/projects | Score: 7/10 | M: Search field ends in an empty rounded accessory box; no recognizable action. L: S1. |
| ios/Light/projects--new | Score: 8/10 | Light: No sheet-specific defect: scrim, input, Create and Cancel are complete. L: S1. Dark: H: C1 affects Create project. |
| ios/Light/project | Score: 7/10 | M: Personal appears simultaneously as centered navigation title and large heading. L: S1. Dark additionally H: C1 affects Start a conversation. |
| ios/Light/recent | Score: 7/10 | M: Search trailing accessory is an empty box. Swipe exposure is intentional, not a clipping defect. L: S1. Dark additionally H: C2 affects Delete. |
| ios/Light/signin | Score: 8/10 | Light: Complete sign-in choices and magic-link explanation; no clipping. L: S1. Dark: H: C1 affects Continue. |
| ios/Light/home | Score: 7/10 | M: Home indicator is absent, unlike Projects/Recent/Settings roots. Composer and tabs do not overlap. L: S1. |
| ios/Light/conversation | Score: 6/10 | M: Assistant copy visibly starts its final line with 'll, missing I (zoom-confirmed). Approval-required card has no explicit Respond/disclosure affordance. L: S1. |
| ios/Light/artifacts | Score: 7/10 | M: Search trailing accessory is an empty box. Grid content fits. L: S1. |
| ios/Light/conversation--approval | Score: 5/10 | H: Always allow does not explain permission scope (this command, tool, project or session). M: Home indicator missing; underlying assistant copy loses I in I'll. L: S1. Dark additionally H: C1 affects Allow once. |
| ios/Light/artifacts--detail | Score: 8/10 | L: S1. Preview is readable, surfaces adapt correctly, no clipping. Parent-level Artifacts nav title is a minor contextual choice, not a blocker. |
| ios/Light/conversation--menu | Score: 7/10 | M: Action-sheet Cancel is styled as another button inside the same stack rather than a separately grouped dismissal; underlying missing-I copy remains visible. L: S1. Scrim is present. |
| ios/Light/routines | Score: 7/10 | M: Paused row replaces disclosure with Paused, making reopening/editing less discoverable than the active row. Copy Every 1d is machine-like. L: S1. |
| ios/Light/conversation--delete | Score: 8/10 | Light: Clear destructive confirmation, Cancel and scrim; custom flat dialog is allowed. L: S1. Dark: H: C2 affects Delete conversation. |
| ios/Light/routines--new | Score: 7/10 | M: Instructions are squeezed into a single-line field; schedule is plain text without clear schedule-picker affordance. L: S1. Dark additionally H: C1 affects Create routine. |
| ios/Light/search | Score: 6/10 | M: billing is duplicated as query text and a trailing billing chip in the same input; clear-query action is not identifiable. L: S1. |
| ios/Light/customize | Score: 7/10 | M: Profile rows mix selected checkmark and drill-down chevron, obscuring whether tapping selects or configures a profile. L: S1. |
| ios/Light/activity | Score: 6/10 | M: Home indicator absent unlike sibling roots. You’re up to date reads as all-clear beneath Needs your input; use an end-of-feed label instead. L: S1. |
| ios/Light/settings | Score: 8/10 | L: S1. Full list fits above floating root tabs, clear disclosure rows, home indicator present; no visible content clipping. |
| ios/Light/settings-account | Score: 7/10 | M: Sign out has a push-navigation chevron although the supplied destination is a confirmation sheet; use an action row. L: S1. |
| ios/Light/settings-devices | Score: 6/10 | M: Both devices use empty square-like glyphs, resembling checkboxes rather than phone/laptop. Remote session revocation requires the account service exposes implementation terminology without recovery guidance. L: S1. |
| ios/Light/settings-general | Score: 7/10 | M: Language shows English without picker/disclosure affordance. CONVERSATIONS incorrectly groups device-level haptics. L: S1. |
| ios/Light/settings-appearance | Score: 7/10 | M: Text size / Default has no picker/disclosure affordance. L: S1. System selected is valid in either appearance, not a mismatch. |
| ios/Light/settings-voice | Score: 7/10 | M: Voice / Default lacks picker/disclosure affordance. L: S1. Toggle and microphone-permission copy are coherent. |
| ios/Light/settings-notifications | Score: 8/10 | L: S1. Notification options and permission caveat are complete for the shown static state; no evidence of denied permission requiring recovery UI. |
| ios/Light/activity--work | Score: 7/10 | M: Overall Running and step In progress conflict with Waiting for your approval; expose a blocked/needs-input state. Respond is less specific than Review approval. L: S1. Dark additionally H: C1 affects Respond. |
| ios/Light/settings-connections | Score: 8/10 | L: S1. Connected/not-connected labels plus disclosure and Add connection are clear. Generic app glyphs are acceptable in this kit. |
| ios/Light/settings-billing | Score: 6/10 | H: Usage this month contains only Available, no consumption, allowance or explicit unavailable-data state. L: S1. Dark additionally H: C1 affects Choose plan. |
| ios/Light/settings-privacy | Score: 7/10 | M: Diagnostic-toggle label begins at a different text inset from the icon-led Export/Delete rows in the same group. L: S1. |
| ios/Light/settings-shortcuts | Score: 8/10 | L: S1. Connected-keyboard introduction makes Command shortcuts valid on iOS; no unsupported missing-shortcut claim. |
| ios/Light/settings-about | Score: 6/10 | M: Version value iOS prototype is unfinished product copy, not usable version/build metadata. L: S1. |
| ios/Light/settings--sign-out | Score: 8/10 | Light: Clear device-only scope, retained-data explanation, scrim and Cancel. L: S1. Dark: H: C2 affects Sign out. Zoom confirms home-indicator clearance is adequate. |
| ios/Light/settings-billing--plan | Score: 5/10 | H: Monthly/Annual choice and Pro selection show no price/currency/renewal amount; pricing is deferred to checkout without enough information to compare. L: S1. Dark additionally H: C1 affects Continue. |
| ios/Light/project--empty | Score: 7/10 | M: Personal duplicated in centered navbar and large header. Empty-state explanation and primary action otherwise complete. L: S1. |
| ios/Light/artifacts--empty | Score: 7/10 | M: Detached left-aligned Only real deliverables disclaimer repeats the centered empty-state explanation and breaks its alignment. L: S1. |
| ios/Light/project--work | Score: 7/10 | M: Personal duplicated in centered navbar and large header. Start a conversation is valid for agent-created work, not inherently wrong. L: S1. Dark additionally H: C1 affects Start a conversation. |
| ios/Light/artifacts--code | Score: 6/10 | H: HTML artifact with a migration-notes preview switches to a standalone JavaScript handler; source does not correspond to the shown preview. L: S1. Plain monospace is not itself a defect. |
| ios/Light/artifacts--share | Score: 7/10 | M: Copy link has a disclosure chevron, implying navigation rather than the immediate action named. L: S1. Scrim and home-indicator clearance are present. |
| ios/Dark/signin | Score: 6/10 | Light: Complete sign-in choices and magic-link explanation; no clipping. L: S1. Dark: H: C1 affects Continue. |
| ios/Dark/home | Score: 7/10 | M: Home indicator is absent, unlike Projects/Recent/Settings roots. Composer and tabs do not overlap. L: S1. |
| ios/Dark/conversation | Score: 6/10 | M: Assistant copy visibly starts its final line with 'll, missing I (zoom-confirmed). Approval-required card has no explicit Respond/disclosure affordance. L: S1. |
| ios/Dark/conversation--approval | Score: 4/10 | H: Always allow does not explain permission scope (this command, tool, project or session). M: Home indicator missing; underlying assistant copy loses I in I'll. L: S1. Dark additionally H: C1 affects Allow once. |
| ios/Dark/conversation--menu | Score: 7/10 | M: Action-sheet Cancel is styled as another button inside the same stack rather than a separately grouped dismissal; underlying missing-I copy remains visible. L: S1. Scrim is present. |
| ios/Dark/conversation--delete | Score: 6/10 | Light: Clear destructive confirmation, Cancel and scrim; custom flat dialog is allowed. L: S1. Dark: H: C2 affects Delete conversation. |
| ios/Dark/search | Score: 6/10 | M: billing is duplicated as query text and a trailing billing chip in the same input; clear-query action is not identifiable. L: S1. |
| ios/Dark/activity | Score: 6/10 | M: Home indicator absent unlike sibling roots. You’re up to date reads as all-clear beneath Needs your input; use an end-of-feed label instead. L: S1. |
| ios/Dark/activity--work | Score: 6/10 | M: Overall Running and step In progress conflict with Waiting for your approval; expose a blocked/needs-input state. Respond is less specific than Review approval. L: S1. Dark additionally H: C1 affects Respond. |
| ios/Dark/projects | Score: 7/10 | M: Search field ends in an empty rounded accessory box; no recognizable action. L: S1. |
| ios/Dark/projects--new | Score: 6/10 | Light: No sheet-specific defect: scrim, input, Create and Cancel are complete. L: S1. Dark: H: C1 affects Create project. |
| ios/Dark/project | Score: 6/10 | M: Personal appears simultaneously as centered navigation title and large heading. L: S1. Dark additionally H: C1 affects Start a conversation. |
| ios/Dark/recent | Score: 6/10 | M: Search trailing accessory is an empty box. Swipe exposure is intentional, not a clipping defect. L: S1. Dark additionally H: C2 affects Delete. |
| ios/Dark/artifacts | Score: 7/10 | M: Search trailing accessory is an empty box. Grid content fits. L: S1. |
| ios/Dark/artifacts--detail | Score: 8/10 | L: S1. Preview is readable, surfaces adapt correctly, no clipping. Parent-level Artifacts nav title is a minor contextual choice, not a blocker. |
| ios/Dark/routines | Score: 7/10 | M: Paused row replaces disclosure with Paused, making reopening/editing less discoverable than the active row. Copy Every 1d is machine-like. L: S1. |
| ios/Dark/routines--new | Score: 6/10 | M: Instructions are squeezed into a single-line field; schedule is plain text without clear schedule-picker affordance. L: S1. Dark additionally H: C1 affects Create routine. |
| ios/Dark/customize | Score: 7/10 | M: Profile rows mix selected checkmark and drill-down chevron, obscuring whether tapping selects or configures a profile. L: S1. |
| ios/Dark/settings | Score: 8/10 | L: S1. Full list fits above floating root tabs, clear disclosure rows, home indicator present; no visible content clipping. |
| ios/Dark/settings-account | Score: 7/10 | M: Sign out has a push-navigation chevron although the supplied destination is a confirmation sheet; use an action row. L: S1. |
| ios/Dark/settings-devices | Score: 6/10 | M: Both devices use empty square-like glyphs, resembling checkboxes rather than phone/laptop. Remote session revocation requires the account service exposes implementation terminology without recovery guidance. L: S1. |
| ios/Dark/settings-general | Score: 7/10 | M: Language shows English without picker/disclosure affordance. CONVERSATIONS incorrectly groups device-level haptics. L: S1. |
| ios/Dark/settings-appearance | Score: 7/10 | M: Text size / Default has no picker/disclosure affordance. L: S1. System selected is valid in either appearance, not a mismatch. |
| ios/Dark/settings-voice | Score: 7/10 | M: Voice / Default lacks picker/disclosure affordance. L: S1. Toggle and microphone-permission copy are coherent. |
| ios/Dark/settings-notifications | Score: 8/10 | L: S1. Notification options and permission caveat are complete for the shown static state; no evidence of denied permission requiring recovery UI. |
| ios/Dark/settings-connections | Score: 8/10 | L: S1. Connected/not-connected labels plus disclosure and Add connection are clear. Generic app glyphs are acceptable in this kit. |
| ios/Dark/settings-billing | Score: 5/10 | H: Usage this month contains only Available, no consumption, allowance or explicit unavailable-data state. L: S1. Dark additionally H: C1 affects Choose plan. |
| ios/Dark/settings-privacy | Score: 7/10 | M: Diagnostic-toggle label begins at a different text inset from the icon-led Export/Delete rows in the same group. L: S1. |
| ios/Dark/settings-shortcuts | Score: 8/10 | L: S1. Connected-keyboard introduction makes Command shortcuts valid on iOS; no unsupported missing-shortcut claim. |
| ios/Dark/settings-about | Score: 6/10 | M: Version value iOS prototype is unfinished product copy, not usable version/build metadata. L: S1. |
| ios/Dark/settings--sign-out | Score: 6/10 | Light: Clear device-only scope, retained-data explanation, scrim and Cancel. L: S1. Dark: H: C2 affects Sign out. Zoom confirms home-indicator clearance is adequate. |
| ios/Dark/settings-billing--plan | Score: 4/10 | H: Monthly/Annual choice and Pro selection show no price/currency/renewal amount; pricing is deferred to checkout without enough information to compare. L: S1. Dark additionally H: C1 affects Continue. |
| ios/Dark/project--empty | Score: 7/10 | M: Personal duplicated in centered navbar and large header. Empty-state explanation and primary action otherwise complete. L: S1. |
| ios/Dark/artifacts--empty | Score: 7/10 | M: Detached left-aligned Only real deliverables disclaimer repeats the centered empty-state explanation and breaks its alignment. L: S1. |
| ios/Dark/project--work | Score: 6/10 | M: Personal duplicated in centered navbar and large header. Start a conversation is valid for agent-created work, not inherently wrong. L: S1. Dark additionally H: C1 affects Start a conversation. |
| ios/Dark/artifacts--code | Score: 6/10 | H: HTML artifact with a migration-notes preview switches to a standalone JavaScript handler; source does not correspond to the shown preview. L: S1. Plain monospace is not itself a defect. |
| ios/Dark/artifacts--share | Score: 7/10 | M: Copy link has a disclosure chevron, implying navigation rather than the immediate action named. L: S1. Scrim and home-indicator clearance are present. |

## Below 8

Sorted by score ascending, then screen identifier. These are all below-threshold screens, not a sample.

- **4/10 — ios/Dark/conversation--approval**: H: Always allow does not explain permission scope (this command, tool, project or session). M: Home indicator missing; underlying assistant copy loses I in I'll. L: S1. Dark additionally H: C1 affects Allow once.
- **4/10 — ios/Dark/settings-billing--plan**: H: Monthly/Annual choice and Pro selection show no price/currency/renewal amount; pricing is deferred to checkout without enough information to compare. L: S1. Dark additionally H: C1 affects Continue.
- **5/10 — ios/Light/conversation--approval**: H: Always allow does not explain permission scope (this command, tool, project or session). M: Home indicator missing; underlying assistant copy loses I in I'll. L: S1. Dark additionally H: C1 affects Allow once.
- **5/10 — ios/Dark/settings-billing**: H: Usage this month contains only Available, no consumption, allowance or explicit unavailable-data state. L: S1. Dark additionally H: C1 affects Choose plan.
- **5/10 — ios/Light/settings-billing--plan**: H: Monthly/Annual choice and Pro selection show no price/currency/renewal amount; pricing is deferred to checkout without enough information to compare. L: S1. Dark additionally H: C1 affects Continue.
- **6/10 — ios/Dark/activity**: M: Home indicator absent unlike sibling roots. You’re up to date reads as all-clear beneath Needs your input; use an end-of-feed label instead. L: S1.
- **6/10 — ios/Light/activity**: M: Home indicator absent unlike sibling roots. You’re up to date reads as all-clear beneath Needs your input; use an end-of-feed label instead. L: S1.
- **6/10 — ios/Dark/activity--work**: M: Overall Running and step In progress conflict with Waiting for your approval; expose a blocked/needs-input state. Respond is less specific than Review approval. L: S1. Dark additionally H: C1 affects Respond.
- **6/10 — ios/Dark/artifacts--code**: H: HTML artifact with a migration-notes preview switches to a standalone JavaScript handler; source does not correspond to the shown preview. L: S1. Plain monospace is not itself a defect.
- **6/10 — ios/Light/artifacts--code**: H: HTML artifact with a migration-notes preview switches to a standalone JavaScript handler; source does not correspond to the shown preview. L: S1. Plain monospace is not itself a defect.
- **6/10 — ios/Dark/conversation**: M: Assistant copy visibly starts its final line with 'll, missing I (zoom-confirmed). Approval-required card has no explicit Respond/disclosure affordance. L: S1.
- **6/10 — ios/Light/conversation**: M: Assistant copy visibly starts its final line with 'll, missing I (zoom-confirmed). Approval-required card has no explicit Respond/disclosure affordance. L: S1.
- **6/10 — ios/Dark/conversation--delete**: Light: Clear destructive confirmation, Cancel and scrim; custom flat dialog is allowed. L: S1. Dark: H: C2 affects Delete conversation.
- **6/10 — ios/Dark/project**: M: Personal appears simultaneously as centered navigation title and large heading. L: S1. Dark additionally H: C1 affects Start a conversation.
- **6/10 — ios/Dark/project--work**: M: Personal duplicated in centered navbar and large header. Start a conversation is valid for agent-created work, not inherently wrong. L: S1. Dark additionally H: C1 affects Start a conversation.
- **6/10 — ios/Dark/projects--new**: Light: No sheet-specific defect: scrim, input, Create and Cancel are complete. L: S1. Dark: H: C1 affects Create project.
- **6/10 — ios/Dark/recent**: M: Search trailing accessory is an empty box. Swipe exposure is intentional, not a clipping defect. L: S1. Dark additionally H: C2 affects Delete.
- **6/10 — ios/Dark/routines--new**: M: Instructions are squeezed into a single-line field; schedule is plain text without clear schedule-picker affordance. L: S1. Dark additionally H: C1 affects Create routine.
- **6/10 — ios/Dark/search**: M: billing is duplicated as query text and a trailing billing chip in the same input; clear-query action is not identifiable. L: S1.
- **6/10 — ios/Light/search**: M: billing is duplicated as query text and a trailing billing chip in the same input; clear-query action is not identifiable. L: S1.
- **6/10 — ios/Dark/settings--sign-out**: Light: Clear device-only scope, retained-data explanation, scrim and Cancel. L: S1. Dark: H: C2 affects Sign out. Zoom confirms home-indicator clearance is adequate.
- **6/10 — ios/Dark/settings-about**: M: Version value iOS prototype is unfinished product copy, not usable version/build metadata. L: S1.
- **6/10 — ios/Light/settings-about**: M: Version value iOS prototype is unfinished product copy, not usable version/build metadata. L: S1.
- **6/10 — ios/Light/settings-billing**: H: Usage this month contains only Available, no consumption, allowance or explicit unavailable-data state. L: S1. Dark additionally H: C1 affects Choose plan.
- **6/10 — ios/Dark/settings-devices**: M: Both devices use empty square-like glyphs, resembling checkboxes rather than phone/laptop. Remote session revocation requires the account service exposes implementation terminology without recovery guidance. L: S1.
- **6/10 — ios/Light/settings-devices**: M: Both devices use empty square-like glyphs, resembling checkboxes rather than phone/laptop. Remote session revocation requires the account service exposes implementation terminology without recovery guidance. L: S1.
- **6/10 — ios/Dark/signin**: Light: Complete sign-in choices and magic-link explanation; no clipping. L: S1. Dark: H: C1 affects Continue.
- **7/10 — ios/Light/activity--work**: M: Overall Running and step In progress conflict with Waiting for your approval; expose a blocked/needs-input state. Respond is less specific than Review approval. L: S1. Dark additionally H: C1 affects Respond.
- **7/10 — ios/Dark/artifacts**: M: Search trailing accessory is an empty box. Grid content fits. L: S1.
- **7/10 — ios/Light/artifacts**: M: Search trailing accessory is an empty box. Grid content fits. L: S1.
- **7/10 — ios/Dark/artifacts--empty**: M: Detached left-aligned Only real deliverables disclaimer repeats the centered empty-state explanation and breaks its alignment. L: S1.
- **7/10 — ios/Light/artifacts--empty**: M: Detached left-aligned Only real deliverables disclaimer repeats the centered empty-state explanation and breaks its alignment. L: S1.
- **7/10 — ios/Dark/artifacts--share**: M: Copy link has a disclosure chevron, implying navigation rather than the immediate action named. L: S1. Scrim and home-indicator clearance are present.
- **7/10 — ios/Light/artifacts--share**: M: Copy link has a disclosure chevron, implying navigation rather than the immediate action named. L: S1. Scrim and home-indicator clearance are present.
- **7/10 — ios/Dark/conversation--menu**: M: Action-sheet Cancel is styled as another button inside the same stack rather than a separately grouped dismissal; underlying missing-I copy remains visible. L: S1. Scrim is present.
- **7/10 — ios/Light/conversation--menu**: M: Action-sheet Cancel is styled as another button inside the same stack rather than a separately grouped dismissal; underlying missing-I copy remains visible. L: S1. Scrim is present.
- **7/10 — ios/Dark/customize**: M: Profile rows mix selected checkmark and drill-down chevron, obscuring whether tapping selects or configures a profile. L: S1.
- **7/10 — ios/Light/customize**: M: Profile rows mix selected checkmark and drill-down chevron, obscuring whether tapping selects or configures a profile. L: S1.
- **7/10 — ios/Dark/home**: M: Home indicator is absent, unlike Projects/Recent/Settings roots. Composer and tabs do not overlap. L: S1.
- **7/10 — ios/Light/home**: M: Home indicator is absent, unlike Projects/Recent/Settings roots. Composer and tabs do not overlap. L: S1.
- **7/10 — ios/Light/project**: M: Personal appears simultaneously as centered navigation title and large heading. L: S1. Dark additionally H: C1 affects Start a conversation.
- **7/10 — ios/Dark/project--empty**: M: Personal duplicated in centered navbar and large header. Empty-state explanation and primary action otherwise complete. L: S1.
- **7/10 — ios/Light/project--empty**: M: Personal duplicated in centered navbar and large header. Empty-state explanation and primary action otherwise complete. L: S1.
- **7/10 — ios/Light/project--work**: M: Personal duplicated in centered navbar and large header. Start a conversation is valid for agent-created work, not inherently wrong. L: S1. Dark additionally H: C1 affects Start a conversation.
- **7/10 — ios/Dark/projects**: M: Search field ends in an empty rounded accessory box; no recognizable action. L: S1.
- **7/10 — ios/Light/projects**: M: Search field ends in an empty rounded accessory box; no recognizable action. L: S1.
- **7/10 — ios/Light/recent**: M: Search trailing accessory is an empty box. Swipe exposure is intentional, not a clipping defect. L: S1. Dark additionally H: C2 affects Delete.
- **7/10 — ios/Dark/routines**: M: Paused row replaces disclosure with Paused, making reopening/editing less discoverable than the active row. Copy Every 1d is machine-like. L: S1.
- **7/10 — ios/Light/routines**: M: Paused row replaces disclosure with Paused, making reopening/editing less discoverable than the active row. Copy Every 1d is machine-like. L: S1.
- **7/10 — ios/Light/routines--new**: M: Instructions are squeezed into a single-line field; schedule is plain text without clear schedule-picker affordance. L: S1. Dark additionally H: C1 affects Create routine.
- **7/10 — ios/Dark/settings-account**: M: Sign out has a push-navigation chevron although the supplied destination is a confirmation sheet; use an action row. L: S1.
- **7/10 — ios/Light/settings-account**: M: Sign out has a push-navigation chevron although the supplied destination is a confirmation sheet; use an action row. L: S1.
- **7/10 — ios/Dark/settings-appearance**: M: Text size / Default has no picker/disclosure affordance. L: S1. System selected is valid in either appearance, not a mismatch.
- **7/10 — ios/Light/settings-appearance**: M: Text size / Default has no picker/disclosure affordance. L: S1. System selected is valid in either appearance, not a mismatch.
- **7/10 — ios/Dark/settings-general**: M: Language shows English without picker/disclosure affordance. CONVERSATIONS incorrectly groups device-level haptics. L: S1.
- **7/10 — ios/Light/settings-general**: M: Language shows English without picker/disclosure affordance. CONVERSATIONS incorrectly groups device-level haptics. L: S1.
- **7/10 — ios/Dark/settings-privacy**: M: Diagnostic-toggle label begins at a different text inset from the icon-led Export/Delete rows in the same group. L: S1.
- **7/10 — ios/Light/settings-privacy**: M: Diagnostic-toggle label begins at a different text inset from the icon-led Export/Delete rows in the same group. L: S1.
- **7/10 — ios/Dark/settings-voice**: M: Voice / Default lacks picker/disclosure affordance. L: S1. Toggle and microphone-permission copy are coherent.
- **7/10 — ios/Light/settings-voice**: M: Voice / Default lacks picker/disclosure affordance. L: S1. Toggle and microphone-permission copy are coherent.

## Cross-cutting

1. **Fix Dark filled-button foregrounds first (H).** Bright blue/coral fills plus light labels are the clearest verified accessibility failure. Correct shared primary/destructive tokens, then inspect approval, creation, billing, project, sign-in and destructive flows. Do not mistake deliberately inverse white empty-state pills for stray light artifacts.
2. **Make sensitive choices informed (H).** Approval needs an explicit “Always allow” scope. Plan selection needs price, currency and billing/renewal context before Continue. Usage needs actual values or an honest unavailable state, not Available. These are completion defects, not aesthetic preferences.
3. **Repair artifact/source coherence (H).** Preview shows migration-note HTML while Code shows a different JavaScript handler. Keep the same artifact across segments or label the content honestly. This is stronger than simply requesting syntax highlighting.
4. **Standardize native chrome (M/L).** Home and Activity roots omit the home indicator that Projects, Recent and Settings retain; approval sheets omit it too. Root-only floating tabs are otherwise applied coherently; details correctly drop them. Replace abstract system status glyphs. No actual composer/tab collision was found in the Home zoom, and sign-out sheet clearance is adequate.
5. **Remove unfinished search and message rendering (M).** Search displays billing twice; empty-query search components retain a blank trailing accessory. Conversation copy genuinely loses the I in I'll; fix the base so overlay variants inherit the correction.
6. **Use consistent affordances (M).** Value rows (Language, Text size, Voice) need a picker/navigation cue; direct actions (Copy link, Sign out) should not promise a pushed detail with a chevron. Paused routines and selectable profiles need coherent affordances across sibling rows. Action-sheet Cancel should be structurally distinct from content actions.
7. **Finish product copy and state semantics (M).** Replace iOS prototype version metadata and backend account-service caveats; distinguish Running from waiting for approval. Replace You’re up to date with a neutral end-of-feed statement when an approval is pending. Remove redundant large/inline Personal headings and detached duplicate empty-state disclaimers.
8. **Retain the working foundations.** Tonal light/dark surfaces, single accent, centered navigation, readable primary text, compact lists, non-tab detail screens, and overlay scrims are coherent. No broad content overflow was observed. Sparse content is not evidence of an unfinished screen by itself.

## Limits / acceptance still requiring live checks

Static screenshots do not establish tappability, scroll behavior, keyboard avoidance, Dynamic Type/localization resilience, exact hit regions, VoiceOver semantics, permission persistence or checkout behavior. The supplied desktop references were outside this iOS-only lane; feature parity was not claimed. Review is read-only apart from this report and its scratch data/generator.

REVIEW_RESULT: 74 screens 14 ≥8 60 <8
