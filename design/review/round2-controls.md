# Controls — round-2 independent strict visual review

**Disposition: visual pass for the supplied Clean sheets.** All round-1 below-8 defects are resolved in the reviewed renders. Remaining round-1 observations are minor composition/coverage notes, detailed below. This is not a certification of the underlying Sketch symbols or unrendered appearances.

**Scope and evidence:** Reviewed only the 38 `Controls` entries in `/tmp/harso-sk/review/index.json`. All PNGs decoded successfully. Every PNG received a `vision_analyze` inspection; Button and Input received additional lower-sheet region inspections. Further crops resolved ambiguous reads of dark FileUpload borders, disabled HTML in ButtonGroup, and the disabled workspace trigger. Read the review brief, design authority, lane state requirements, and round-1 report. Viewed available desktop-light reference PNGs for all 17 matching BoardUI families; Stepper and ComboBox were judged against the explicit lane requirements. No Sketch scripts, source edits, browser actions, or network requests were used.

**Calibration:** 8 means production-usable visual specimens with at most one minor nit, not exceptional polish or exhaustive configuration coverage. Measurements below are approximate native screenshot pixels. Contrast is a visual assessment, not measured WCAG conformance. Disabled contrast, static spinners, illustrative data, and generic provider glyphs are not penalized. Dark primary fills follow the specified `ink`/`inverse` token inversion.

| sheet | score | defects (concrete, with approx px / which specimen) |
|---|---|---|
| IconButton — Light/Clean | Score: 8/10 | No clear defect. Five states fit; centered plus glyphs and complete focus outline within 36px targets. |
| IconButton — Dark/Clean | Score: 8/10 | No clear defect. Five states, centered glyphs, readable dark surfaces and complete focus outline. |
| Select — Light/Clean | Score: 8/10 | No clear defect. Persistent-choice up/down glyph, four-row menu, inset tonal selection and check are intact. |
| Select — Dark/Clean | Score: 8/10 | No clear defect. Dark menu and selected row remain distinct; labels and checks fit. |
| CloseButton — Light/Clean | Score: 8/10 | No clear defect. Crosses and focus outline are intact. Small visible cross ink is not evidence of a wrong nominal icon box. |
| CloseButton — Dark/Clean | Score: 8/10 | No clear defect. Four states maintain centered crosses and unclipped focus geometry. |
| Checkbox — Light/Clean | Score: 8/10 | No clear defect. Off/on/indeterminate/disabled, helper text and choice-card forms all fit. |
| Checkbox — Dark/Clean | Score: 8/10 | No clear defect. Check/dash marks and selected-card outline are intact; no label collisions. |
| Radio — Light/Clean | Score: 8/10 | No clear rendering defect. Minor reference composition note remains: all six specimens say Our team; Everyone/Partners group not demonstrated. |
| Radio — Dark/Clean | Score: 8/10 | No clear rendering defect. Same minor reference composition omission; off/on/disabled and card forms are sound. |
| Switch — Light/Clean | Score: 8/10 | No clear rendering defect. All three sizes and states fit; on-thumb is right. Reference helper sentence remains omitted (minor). |
| Switch — Dark/Clean | Score: 8/10 | No clear rendering defect. On-thumb is correctly right in all sizes. Reference helper sentence remains omitted (minor). |
| Slider — Light/Clean | Score: 8/10 | No clear defect. Single 40% and range 20–70% labels agree visually with handles and tracks; active bubble fits. |
| Slider — Dark/Clean | Score: 8/10 | No clear defect. Tracks, handles and value bubbles remain distinct without overlap. One active range bubble is valid. |
| DatePicker — Light/Clean | Score: 8/10 | Minor optical nit remains: September 2026 sits beside the left navigation arrow rather than centered between arrows. Selected 11, today ring 15, full grid and input are intact. |
| DatePicker — Dark/Clean | Score: 8/10 | Same minor left-weighted month-header composition. Selected day and separate today ring are correct; no clipping. |
| Stepper — Light/Clean | Score: 8/10 | No clear defect. Numeric field with embedded up/down partition, focus and disabled states fit. |
| Stepper — Dark/Clean | Score: 8/10 | No clear defect. Embedded controls, number and focus outline have sufficient clearance. |
| ComboBox — Light/Clean | Score: 8/10 | No clear defect. Attached down-chevron button and four-row menu have intact text and inset selected row/check. |
| ComboBox — Dark/Clean | Score: 8/10 | No clear defect. All four states preserve input/button geometry and legible menu options. |
| Button — Light/Clean | Score: 8/10 | R1 fixed: Explore now has an approximately 16px compass in outline/ghost, both sizes. Pending labels are action-specific, including Removing...; no clipping. |
| Button — Dark/Clean | Score: 8/10 | R1 fixed: compass present and pending copy action-specific. All variant/size matrices fit with intact focus and spinner glyphs. |
| ButtonGroup — Light/Clean | Score: 8/10 | R1 fixed: speech bubble replaces envelope, selected chat has a tonal pill, and HTML is individually muted in active text groups. |
| ButtonGroup — Dark/Clean | Score: 8/10 | R1 fixed: selected chat pill and correct glyph. Crop verifies HTML is distinctly dimmer than the other unselected option in both active groups. |
| Input — Light/Clean | Score: 8/10 | R1 fixed: textarea content is top-inset approximately 12–16px in every composite state, not vertically centered. Labels, helpers and search adornments fit. |
| Input — Dark/Clean | Score: 8/10 | R1 fixed: stable top inset across textarea states. No text clipping, icon collisions or default-gray layout frame. |
| InputOtp — Light/Clean | Score: 8/10 | R1 fixed: invalid helper now reads “Invalid code. Check all six characters and try again.” Six cells and helper fit. |
| InputOtp — Dark/Clean | Score: 8/10 | R1 fixed: explicit invalid explanation accompanies red borders. Focus progression and all six cells remain clear. |
| LinkButton — Light/Clean | Score: 8/10 | R1 fixed: hover underline matches blue text. Local action · 0 added beside navigation across four states; focus outlines and spacing fit. |
| LinkButton — Dark/Clean | Score: 8/10 | Local action · 0 coverage note resolved. Underlines match state text colors and complete focus outlines clear the labels. |
| Dropdown — Light/Clean | Score: 8/10 | R1 fixed: Research studio trigger with people icon is present. Both triggers have disabled styling; open model menu fits. |
| Dropdown — Dark/Clean | Score: 8/10 | R1 fixed: workspace/people trigger present across rows; disabled treatment, open model menu and selected check are intact. |
| FileUpload — Light/Clean | Score: 8/10 | R1 fixed: inner dropzone is dashed in idle, drag-over and files states. Both filenames, sizes and removal icons fit. |
| FileUpload — Dark/Clean | Score: 8/10 | R1 fixed: region inspection confirms dashed inner borders in idle and files, as well as accented drag-over. Low-contrast dashes are subtle, not solid. |
| ThemeToggle — Light/Clean | Score: 8/10 | R1 fixed: compact half-filled-circle control added beside every segmented specimen. Selected pills and text fit. |
| ThemeToggle — Dark/Clean | Score: 8/10 | R1 fixed: compact control present. Approximately 3–4px track inset beside selected end segment is valid padding, not clipping. |
| SocialButton — Light/Clean | Score: 8/10 | R1 fixed: provider-specific Signing in with … copy retains provider mark/name and spinner; GitHub now has the filled dark primary treatment. No clipping. |
| SocialButton — Dark/Clean | Score: 8/10 | R1 fixed: provider-specific pending copy and identity retained; GitHub now uses the inverse filled primary treatment. White fill here is correct ink/inverse dark-mode adaptation, not missing black-variant parity. |

## Below 8

None in the supplied round-2 Controls PNGs.

## Round-1 defect reconciliation

| Named round-1 issue | Round-2 status and evidence |
|---|---|
| Button: arrow instead of Explore compass, both appearances | **Resolved.** Compass circle/needle visible in outline and ghost, xs and base; checked in lower-sheet crops. |
| Button: Saving changes reused for Remove and other actions | **Resolved.** Continuing..., Deferring..., Exploring..., Removing... are action-specific. |
| ButtonGroup: envelope instead of chat | **Resolved.** Speech bubble now shown in both appearances. |
| ButtonGroup: no selected icon pill | **Resolved.** Chat has an inset selected tonal pill. |
| ButtonGroup: HTML disabled state absent in active text examples | **Resolved.** HTML is individually muted; dark crop checked against the other unselected option, not merely the fully disabled group. |
| Input: textarea vertically centered | **Resolved.** First line is top-inset in all five lower-row states in both appearances. |
| InputOtp: invalid status conveyed only by border color | **Resolved.** Explicit actionable error helper replaces neutral instructions in both appearances. |
| LinkButton Light: dark hover underline | **Resolved.** Accent underline now matches blue text. |
| LinkButton both: Local action reference variant missing | **Resolved.** Local action · 0 is represented in all four displayed states. |
| Dropdown: Research studio people trigger absent | **Resolved.** Added beside Choose model, with legible people glyph and state styling. |
| FileUpload: solid inner dropzone instead of dashed | **Resolved.** Dashed idle/drag/files boundaries confirmed; dark neutral boundaries required zoom to distinguish from the outer solid card. |
| ThemeToggle: compact contrast-circle control absent | **Resolved.** Half-filled circle and Compact control label present beside all three segmented states. |
| SocialButton: Saving changes, lost provider identity when pending | **Resolved.** Provider-specific authentication copy and marks remain visible beside the spinner. |
| SocialButton: filled GitHub appearance absent | **Resolved with correct appearance adaptation.** Dark fill/light text in Light/Clean; inverse light fill/dark text in Dark/Clean, consistent with the design authority's primary ink/inverse rule. Do not force literal black across appearances. |
| Radio: composed Everyone/Partners example absent | **Remains, minor coverage note.** Our team is still used throughout. Required primitive off/on/disabled/card states exist. |
| Switch: helper sentence omitted | **Remains, minor parity note.** Compact rows still show only Voice input. |
| DatePicker: left-weighted month heading | **Remains, minor optical nit.** Not clipping or wrong date state. |
| DatePicker: reference range composition omitted | **Remains, non-blocking scope note.** The lane expressly requires a single selected day plus today ring, which are present. |
| CloseButton: visible cross ink smaller than nominal box | **Unchanged observation, not a verified defect.** Screenshot path bounds cannot establish incorrect icon-box sizing. |
| Cozy appearance coverage | **Still unverified.** Assigned index supplies only Light/Clean and Dark/Clean; do not infer Cozy absence from the Sketch document. |

## Cross-cutting

1. **The fix wave closes the actual round-1 failures, not merely their captions.** Correct glyphs, selected backgrounds, provider-preserving pending content, textarea geometry, dashed boundaries and added component variants are visible in the pixels.
2. **No confirmed clipping, text overlap, missing required primitive state, or default-gray layout frame was found.** Longer authentication pending labels and the expanded LinkButton/Dropdown/ThemeToggle coverage fit their sheets.
3. **Dark mode remains coherent.** Filled-primary inversion is intentional under the written token rule. Do not interpret the white GitHub primary as a regression simply because the light reference calls its appearance black.
4. **Low-contrast dark hairlines require targeted inspection.** The dark FileUpload neutral dashed perimeter initially read as solid at full-sheet scale; crops show actual gaps. Likewise, ButtonGroup HTML must be compared with another unselected active option to verify its individual disabled treatment.
5. **Remaining polish is compositional, not blocking.** DatePicker's month header is left-weighted. Radio still omits the reference's composed group, and Switch omits its helper sentence. Keep those notes visible without misclassifying the expressly required primitive states as missing.
6. **Do not convert generic visual heuristics into defects.** Universal blue focus on danger buttons is valid; multiple focused specimens in a state matrix do not imply simultaneous application focus; plus-only buttons need not duplicate adjacent semantic text-button icons; no resize handle or US spelling is required; a popover may exceed its anchor width; disabled elements need not meet normal text contrast. Static screenshots cannot certify keyboard interaction, accessible names, constraints, symbol naming or runtime behavior.

REVIEW_RESULT: 38 sheets 38 ≥8 0 <8
