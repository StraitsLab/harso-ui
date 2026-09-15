# Independent macOS prototype review — round 2

**Verdict: substantially improved and ready to show on most screens; not an unconditional all-screen pass.** The major round-1 product omissions, permission scope, billing intent, demo disclaimers and dark-scrim defect are fixed. Residual menu anchoring and artifact-gallery polish still need correction.

## Scope and method

- Read the review brief, design authority and round-1 macOS report before judging the fix wave.
- Individually inspected every indexed macOS PNG with `vision_analyze`: 68 readable 1440×900 images, 34 per appearance. No iOS scored. Also inspected all 12 supplied shipped Light route references for information/action parity.
- Regional reinspection adjudicated menu anchoring, Work footer, shortcut keycaps, exact approval scope and artifact copy. Pixel samples independently checked all nine previously affected Dark overlays.
- 8 = ready to show with at most one minor nit; 9 = no material visible defect detected; 7 = meaningful correction or multiple polish defects. No score implies functional, keyboard, accessibility or payment-flow certification.
- Do not treat illustrative content, intentional whitespace, valid ellipsis, repeated global search, normal modal occlusion, Close plus Cancel, explicit On/Off labels or neutral status dots with text as defects. No measured WCAG claim is made. Source images and Sketch/source files were untouched.
- Each row names its R1 status; PNG path is `/tmp/harso-sk/proto-review/macos-<appearance lowercase>-<id>.png`.

## Per-screen scores

| screen (platform/appearance/id) | score | defects |
|---|---:|---|
| macos/Light/settings | Score: 8/10 | LOW, R1 remains: Active sessions uses a button-like Unavailable pill; status and action affordances are insufficiently differentiated. |
| macos/Light/projects | Score: 9/10 | R1 fixed: Search is secondary; Create is neutral ink/inverse primary; name now contains Release planning. Empty-input validation is not demonstrated, but the pictured contradiction is gone. No material fresh defect. |
| macos/Light/settings-account | Score: 8/10 | LOW, R1 remains: Unavailable retains secondary-button geometry. Account scope and Devices/Data & Privacy links remain intact. |
| macos/Light/new-conversation | Score: 8/10 | LOW, R1 remains: empty Message composer has a saturated, active-looking send button. Actual disabled behavior cannot be inferred. |
| macos/Light/settings-devices | Score: 9/10 | R1 fixed: Full Disk Access has repair instructions and Open System Settings; Revoke device and Rotate credential are separate actions. No material fresh defect. |
| macos/Light/projects--empty | Score: 9/10 | R1 fixed: pinned Personal removed; inline creation form removed; one central Create project CTA. Global Search and intentional empty-state whitespace are valid. |
| macos/Light/project | Score: 9/10 | R1 fixed: breadcrumb, inspector toggle, Instructions/Memory/Sources/Working locations restored; Conversations no longer contains the separate Work list. No material fresh defect. |
| macos/Light/settings-general | Score: 9/10 | No material defect. Toggle labels agree with visible thumb states. R1 clean result sustained. |
| macos/Light/recent | Score: 8/10 | LOW, R1 remains: no selected sidebar destination acknowledges the Recent overview. Page heading still supplies location. |
| macos/Light/signin | Score: 8/10 | LOW, R1 remains: Continue is less explicit than Send magic link; helper text explains the email-link action. SSO labels readable. |
| macos/Light/artifacts | Score: 7/10 | LOW, R1 remains: Image card has a generic type icon instead of a thumbnail. LOW, fresh cross-screen inconsistency: filled-blue Search remains while Projects now uses neutral secondary Search; two polish corrections exceed the one-minor-nit threshold. |
| macos/Light/conversation | Score: 9/10 | R1 fixed: microphone, preview/enrollment and five-minute notices, question/Answer card and linked work/Review card restored. No material clipping or fresh defect. |
| macos/Light/settings-appearance | Score: 9/10 | No material defect. Reduced motion Off agrees with its thumb; theme and reading controls are coherent. R1 clean result sustained. |
| macos/Light/artifacts--empty | Score: 8/10 | LOW, R1 remains: filled-blue Search competes with the neutral Start a conversation primary and differs from corrected Projects search. The presence of global search is valid. |
| macos/Light/activity | Score: 9/10 | R1 fixed: workflow, current stage, step count and Workspace sprite metadata present; Approval pending is plain status text distinct from Review. |
| macos/Light/artifacts--detail | Score: 9/10 | R1 fixed: one Preview/Code and one utility toolbar; literal Synthetic example copy removed and replaced with publication attribution. Illustrative document content is valid. |
| macos/Light/settings-voice | Score: 9/10 | R1 fixed: Saved: On is explicitly distinguished from unavailable microphone capability; group renamed Audio & voice preferences. A saved preference need not be disabled. |
| macos/Light/routines | Score: 9/10 | R1 fixed: Personal/No project routing, workspace, weekly execution time, SGT and Asia/Singapore timezone shown; consistent schedule notation and unrouted-result explanation. |
| macos/Light/routines--new | Score: 9/10 | R1 fixed: schedule timezone plus Project & execution field and explicit Personal → Work output routing present. No material modal defect. |
| macos/Light/settings-notifications | Score: 8/10 | LOW, R1 remains: Desktop notifications master and dependent event switches have the same indentation and visual hierarchy. |
| macos/Light/customize | Score: 8/10 | LOW, R1 remains: profile cards do not distinguish selection from editing. Profile editor exists in the set, but its entry affordance is ambiguous. |
| macos/Light/customize--profile | Score: 9/10 | R1 fixed: plain checked Tools list replaced with explicit On switches. No material dialog defect. |
| macos/Light/conversation--approval | Score: 9/10 | R1 fixed: exact npm test, working directory and Personal/Workspace sprite disclosed; Always allow names command/project and helper excludes other commands. No material consent or clipping defect. |
| macos/Light/settings-connections | Score: 8/10 | LOW, R1 remains: Connected status shares button-like geometry with Connect/Disconnect. Consent and write controls remain present. |
| macos/Light/conversation--menu | Score: 7/10 | MEDIUM, R1 partially remains: menu is still visibly detached beneath the ellipsis trigger; tighten anchoring. R1 fixed: full-window scrim removed and Delete separated from Export by divider. Regional review rejected the full-frame Dark pass on anchoring. |
| macos/Light/conversation--delete | Score: 9/10 | Clear irreversible scope and Cancel/Delete hierarchy; no material dialog defect. Repeated conversation base is not penalized again. |
| macos/Light/settings-billing | Score: 9/10 | R1 fixed: Context window is passive telemetry; Founder active plan and Change billing interval replace vague plan selection; helper requires review before checkout. |
| macos/Light/search | Score: 9/10 | R1 fixed: all five entity filters, Routines result, and Reasoning and raw logs are not searched notice restored. No material palette defect. |
| macos/Light/activity--work | Score: 8/10 | LOW, R1 partially remains: footer still separated from details by large blank interval with no footer divider. Cancel → Cancel run is fixed; bottom-docked actions are now unambiguous, so residual separation is a minor polish issue, not a blocker. Nonmodal inspector needs no scrim. |
| macos/Light/settings-privacy | Score: 9/10 | R1 fixed: security history now includes dates, times and SGT for both events. No material fresh defect. |
| macos/Light/settings-shortcuts | Score: 8/10 | LOW, R1 remains: comma keycap visibly narrower than K/N/B; mixed glyph optical positioning needs alignment. Regional inspection confirms in both themes despite initial Dark full-frame pass. |
| macos/Light/settings-about | Score: 9/10 | R1 fixed: Development build/prototype tags and illustrative disclaimer removed; Version 0.1.0 and copyright are valid user-facing copy. |
| macos/Light/settings--sign-out | Score: 9/10 | Clear local-Mac scope, other-device consequence and Cancel/Sign out actions. No material dialog defect. |
| macos/Light/settings-billing--plan | Score: 9/10 | R1 fixed: Change billing interval / Founder active plan, explicit radio options, Continue to checkout and Nothing changes until you confirm there resolve all plan/commit ambiguity. |
| macos/Dark/settings | Score: 8/10 | LOW, R1 remains: Active sessions uses a button-like Unavailable pill; status and action affordances are insufficiently differentiated. |
| macos/Dark/new-conversation | Score: 8/10 | LOW, R1 remains: empty Message composer has a saturated, active-looking send button. Actual disabled behavior cannot be inferred. |
| macos/Dark/settings-account | Score: 8/10 | LOW, R1 remains: Unavailable retains secondary-button geometry. Account scope and Devices/Data & Privacy links remain intact. |
| macos/Dark/settings-devices | Score: 9/10 | R1 fixed: Full Disk Access has repair instructions and Open System Settings; Revoke device and Rotate credential are separate actions. No material fresh defect. |
| macos/Dark/signin | Score: 8/10 | LOW, R1 remains: Continue is less explicit than Send magic link; helper text explains the email-link action. SSO labels readable. |
| macos/Dark/settings-general | Score: 9/10 | No material defect. Toggle labels agree with visible thumb states. R1 clean result sustained. |
| macos/Dark/conversation | Score: 9/10 | R1 fixed: microphone, preview/enrollment and five-minute notices, question/Answer card and linked work/Review card restored. No material clipping or fresh defect. |
| macos/Dark/activity | Score: 9/10 | R1 fixed: workflow, current stage, step count and Workspace sprite metadata present; Approval pending is plain status text distinct from Review. |
| macos/Dark/settings-appearance | Score: 9/10 | No material defect. Reduced motion Off agrees with its thumb; theme and reading controls are coherent. R1 clean result sustained. |
| macos/Dark/settings-voice | Score: 9/10 | R1 fixed: Saved: On is explicitly distinguished from unavailable microphone capability; group renamed Audio & voice preferences. A saved preference need not be disabled. |
| macos/Dark/settings-notifications | Score: 8/10 | LOW, R1 remains: Desktop notifications master and dependent event switches have the same indentation and visual hierarchy. |
| macos/Dark/conversation--approval | Score: 9/10 | R1 fixed: exact npm test, working directory and Personal/Workspace sprite disclosed; Always allow names command/project and helper excludes other commands. No material consent or clipping defect. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/projects | Score: 9/10 | R1 fixed: Search is secondary; Create is neutral ink/inverse primary; name now contains Release planning. Empty-input validation is not demonstrated, but the pictured contradiction is gone. No material fresh defect. |
| macos/Dark/conversation--menu | Score: 7/10 | MEDIUM, R1 partially remains: menu is still visibly detached beneath the ellipsis trigger; tighten anchoring. R1 fixed: full-window scrim removed and Delete separated from Export by divider. Regional review rejected the full-frame Dark pass on anchoring. D1 fixed by removing the modal wash entirely. |
| macos/Dark/settings-connections | Score: 8/10 | LOW, R1 remains: Connected status shares button-like geometry with Connect/Disconnect. Consent and write controls remain present. |
| macos/Dark/projects--empty | Score: 9/10 | R1 fixed: pinned Personal removed; inline creation form removed; one central Create project CTA. Global Search and intentional empty-state whitespace are valid. |
| macos/Dark/conversation--delete | Score: 9/10 | Clear irreversible scope and Cancel/Delete hierarchy; no material dialog defect. Repeated conversation base is not penalized again. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/project | Score: 9/10 | R1 fixed: breadcrumb, inspector toggle, Instructions/Memory/Sources/Working locations restored; Conversations no longer contains the separate Work list. No material fresh defect. |
| macos/Dark/search | Score: 9/10 | R1 fixed: all five entity filters, Routines result, and Reasoning and raw logs are not searched notice restored. No material palette defect. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/settings-billing | Score: 9/10 | R1 fixed: Context window is passive telemetry; Founder active plan and Change billing interval replace vague plan selection; helper requires review before checkout. |
| macos/Dark/recent | Score: 8/10 | LOW, R1 remains: no selected sidebar destination acknowledges the Recent overview. Page heading still supplies location. |
| macos/Dark/activity--work | Score: 8/10 | LOW, R1 partially remains: footer still separated from details by large blank interval with no footer divider. Cancel → Cancel run is fixed; bottom-docked actions are now unambiguous, so residual separation is a minor polish issue, not a blocker. Nonmodal inspector needs no scrim. |
| macos/Dark/artifacts | Score: 7/10 | LOW, R1 remains: Image card has a generic type icon instead of a thumbnail. LOW, fresh cross-screen inconsistency: filled-blue Search remains while Projects now uses neutral secondary Search; two polish corrections exceed the one-minor-nit threshold. |
| macos/Dark/settings-privacy | Score: 9/10 | R1 fixed: security history now includes dates, times and SGT for both events. No material fresh defect. |
| macos/Dark/artifacts--empty | Score: 8/10 | LOW, R1 remains: filled-blue Search competes with the neutral Start a conversation primary and differs from corrected Projects search. The presence of global search is valid. |
| macos/Dark/artifacts--detail | Score: 9/10 | R1 fixed: one Preview/Code and one utility toolbar; literal Synthetic example copy removed and replaced with publication attribution. Illustrative document content is valid. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/settings-shortcuts | Score: 8/10 | LOW, R1 remains: comma keycap visibly narrower than K/N/B; mixed glyph optical positioning needs alignment. Regional inspection confirms in both themes despite initial Dark full-frame pass. |
| macos/Dark/routines | Score: 9/10 | R1 fixed: Personal/No project routing, workspace, weekly execution time, SGT and Asia/Singapore timezone shown; consistent schedule notation and unrouted-result explanation. |
| macos/Dark/routines--new | Score: 9/10 | R1 fixed: schedule timezone plus Project & execution field and explicit Personal → Work output routing present. No material modal defect. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/settings-about | Score: 9/10 | R1 fixed: Development build/prototype tags and illustrative disclaimer removed; Version 0.1.0 and copyright are valid user-facing copy. |
| macos/Dark/customize | Score: 8/10 | LOW, R1 remains: profile cards do not distinguish selection from editing. Profile editor exists in the set, but its entry affordance is ambiguous. |
| macos/Dark/customize--profile | Score: 9/10 | R1 fixed: plain checked Tools list replaced with explicit On switches. No material dialog defect. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/settings--sign-out | Score: 9/10 | Clear local-Mac scope, other-device consequence and Cancel/Sign out actions. No material dialog defect. D1 fixed: darkening scrim, not milky lightening wash. |
| macos/Dark/settings-billing--plan | Score: 9/10 | R1 fixed: Change billing interval / Founder active plan, explicit radio options, Continue to checkout and Nothing changes until you confirm there resolve all plan/commit ambiguity. D1 fixed: darkening scrim, not milky lightening wash. |

## Below 8

Sorted by score, then identifier.

- **7/10 — macos/Dark/artifacts**: LOW, R1 remains: Image card has a generic type icon instead of a thumbnail. LOW, fresh cross-screen inconsistency: filled-blue Search remains while Projects now uses neutral secondary Search; two polish corrections exceed the one-minor-nit threshold.
- **7/10 — macos/Light/artifacts**: LOW, R1 remains: Image card has a generic type icon instead of a thumbnail. LOW, fresh cross-screen inconsistency: filled-blue Search remains while Projects now uses neutral secondary Search; two polish corrections exceed the one-minor-nit threshold.
- **7/10 — macos/Dark/conversation--menu**: MEDIUM, R1 partially remains: menu is still visibly detached beneath the ellipsis trigger; tighten anchoring. R1 fixed: full-window scrim removed and Delete separated from Export by divider. Regional review rejected the full-frame Dark pass on anchoring. D1 fixed by removing the modal wash entirely.
- **7/10 — macos/Light/conversation--menu**: MEDIUM, R1 partially remains: menu is still visibly detached beneath the ellipsis trigger; tighten anchoring. R1 fixed: full-window scrim removed and Delete separated from Export by divider. Regional review rejected the full-frame Dark pass on anchoring.

## Round-1 defect reconciliation

This inventory covers each named R1 finding, including low-severity findings, for both appearances unless Dark is specified.

| R1 target / named defect | R2 status and evidence |
|---|---|
| Account/settings Unavailable button-like | REMAINS, LOW — same secondary-control silhouette. |
| Projects primary Search; active Create with empty input | FIXED IN CAPTURE — neutral Search, ink/inverse Create, Release planning entered. Empty-form runtime validation unverified. |
| New conversation active-looking empty send | REMAINS, LOW — blue send with placeholder-only composer. |
| Devices no Full Disk Access recovery; Revoke or rotate conflation | FIXED — repair copy and System Settings action; separate credential/device actions. |
| Empty Projects pinned Personal contradiction; competing create controls | FIXED — pinned item and inline form removed. |
| Project missing inspector sections/toggle/breadcrumb; Work under Conversations | FIXED — all four information groups and navigation restored; selected view contains conversations only. |
| Recent no selected nav destination | REMAINS, LOW. |
| Signin Continue vague | REMAINS, LOW — helper still makes action understandable. |
| Artifacts generic image icon | REMAINS, LOW — no real image thumbnail. |
| Conversation no voice entry/notices, question/Answer or linked work/Review | FIXED — all represented visibly. |
| Empty artifacts Search hierarchy | REMAINS, LOW — filled accent utility competes with central creation primary. |
| Activity missing workflow/stage/workspace; status looks actionable | FIXED — metadata restored, approval status now plain text. |
| Artifact detail duplicated toolbars; Synthetic example | FIXED — unified toolbar and publication attribution. |
| Voice On despite permission repair; Audio devices misgrouping | FIXED — saved preference explicitly separated from availability; accurate group title. |
| Routines routing absent; weekly time/timezone absent; mixed notation | FIXED — destination/workspace, explicit schedules and timezone/footer routing copy. |
| New routine timezone and output destination absent | FIXED — timezone, Project & execution and Personal → Work. |
| Notifications master/dependent hierarchy | REMAINS, LOW. |
| Customize profile select/edit ambiguity | REMAINS, LOW. |
| Profile editor plain checks ambiguous | FIXED — editable switches. |
| Approval Always boundary; command/summary/cwd disclosure | FIXED — exact command and directory separate from intent; persistent scope names command and project with explicit exclusion. |
| Connections Connected action-like | REMAINS, LOW. |
| Conversation menu gap, scrim, Delete grouping | PARTIAL — gap remains MEDIUM; scrim removed; destructive divider added. |
| Billing + Context window, vague Choose plan, cycle commit ambiguity | FIXED — passive usage, active plan context, Change billing interval and review-before-checkout wording. |
| Search filters/Routines/privacy exclusion absent | FIXED — filters, routine result and explicit privacy boundary. |
| Work footer Cancel ambiguity and detachment | PARTIAL — Cancel run fixes intent; unseparated bottom footer remains LOW. |
| Privacy history lacks timestamps | FIXED — date/time/timezone for both events. |
| Shortcuts comma width/glyph alignment | REMAINS, LOW — confirmed in regional views. |
| About development/prototype/internal disclaimer | FIXED — removed, without penalizing illustrative version. |
| Plan dialog actually one-tier cadence; vague action commitment | FIXED — explicit interval selection and Continue to checkout with confirmation boundary. |
| Dark D1: nine washed-out overlays | FIXED — eight modal scrims darken; menu no longer uses a scrim. |
| General, Appearance, Light delete/sign-out previously clean | SUSTAINED — no material fresh defect. |

## Cross-cutting

### 1. Major product and consent corrections are real
Project information, conversation interaction families, search scope/privacy, execution context and routine routing now survive the design upgrade. Approval and billing no longer ask users to infer the scope of durable or commercial actions. No original HIGH-severity defect is sustained in this round.

### 2. D1 fixed with independently verified tonal direction
At the unchanged sidebar sample `(10,700)`, Dark conversation base is RGB `(23,25,29)`. Each of `conversation--approval`, `conversation--delete`, `settings--sign-out`, `settings-billing--plan`, `routines--new`, `customize--profile`, `artifacts--detail` and `search` is now `(9,10,12)`, rather than R1 `(111,112,115)`. Menu is `(23,25,29)`, correctly unchanged because its scrim was removed. Regional visual review confirms foreground legibility; this is not a missing-scrim finding.

### 3. Finish the shared hierarchy rules, not only individual screens
Projects now demonstrates the intended secondary Search treatment, but Artifacts and its empty state retain a filled accent Search. The gallery additionally retains a generic image icon; together these exceed the one-minor-nit allowance. Other saturated creation controls remain a broader token-normalization opportunity against the brief's neutral primary direction, not an additional invented functional failure. Status pills in Account and Connections still mimic secondary actions. Notification master/dependent grouping and profile select/edit cues remain minor but recurring affordance issues.

### 4. Menu anchoring remains the highest-priority local defect
The menu now has the correct lightweight, undimmed presentation and destructive grouping, but the visible gap below the ellipsis remains conspicuous in both themes. Attach it to the actual trigger bounds with a small consistent inset. Regional outputs disagreed on exact pixel distance, so no unreliable pixel measurement is asserted. Work footer separation is milder: actions are clearly within the inspector and Cancel run resolves intent; a separator or grouping treatment would finish it.

### 5. Review noise explicitly rejected
Full-frame vision passes produced contradictory claims on Dark menu anchoring, shortcut widths and Work footer separation. Regional inspection overruled the false passes. Generic claims about WCAG ratios, invisible tooltip behavior, missing traffic lights, synthetic sample titles, modal background clipping and automatically invalid global search were excluded. This is a strict evidence-led screen review, not a transcript of every first-pass suggestion.

## Verification and limitations

Every indexed macOS appearance/id is represented exactly once; coverage and totals were checked programmatically. All 68 target PNGs were individually vision-reviewed; none failed to load. No source PNG, Sketch document, repository or external application state was changed. Review artifacts only were written in the assigned directory. Click targets, actual disabled states, permission enforcement, scroll behavior and checkout remain untested by this static review.

REVIEW_RESULT: 68 screens 64 ≥8 4 <8
