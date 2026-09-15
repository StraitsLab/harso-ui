# macOS fix wave 2 — repairs verified; score gate BLOCKED

## Outcome

All 68 entries have an individual-image review (6 unchanged Light scores carried from the supplied independent review; 62 reviewed/rescored in this wave). All 34 Dark images were individually reviewed. All 50 changed screens were re-exported through Sketch and individually reviewed again. Every final image decoded at 1440×900. Live document readback has exactly 34 Light + 34 Dark screens, original frame IDs preserved. **Never saved.**

**The ≥8 acceptance gate is NOT achieved.** The vision backend repeatedly and explicitly applies a “compressed toward center” scale, including when it reports zero defects. Prompts supplied the exact full 1–10 rubric, and a targeted correction/crop retry still returned7. Raw scores below are NOT silently remapped to8. This is a calibration blocker, not evidence that every compliant screen should be redesigned. Initial 503s on Shortcuts, General and Voice recovered after20s delayed retries. No missing images are given invented scores.

## Applied surgical repairs

- Both appearances: sign-in email36→24px; sign-in buttons28px. Traffic-light x20 was already correct, so preserved.
- Both appearances: conversation menu right edge aligned to ellipsis trigger right minus8; final menu x768,width244.
- Both appearances: profile Send email icon corrected from overlapping-window glyph to unchecked native rounded-square checkbox14×14.
- Both appearances: project-creation input text vertically centered in24px field.
- Core + Settings screens: long Recent sidebar labels shortened consistently to single lines, preserving routing and all screen IDs.
- Lead's Export glyph preserved; fresh Light/Dark menu vision identifies Share and Export as distinct SF Symbols.

## Confirmed false positives — do not blindly change these

- Appearance: every one of10 rows uses label width200 and control x216, row28. No inter-group gutter variance. `geometry.json` contains exact per-child measurements.
- Profile: Name/Model controls24 high, Description76 high; label120 and gap12. Fresh vision explicitly confirmed uniform fields and no overlaps.
- Artifact detail: sheet y52; existing popover arrow14×14 at1080,120. Review repeatedly alleged absence despite live presence.
- Sign-in: every button28 and email24; provider's claimed32px primary is false. Footer/control stack gap16, not claimed13.
- Reviewer repeatedly penalized deliberately permitted flat materials, Inter, and required centered alerts; also compared to Sonoma/Ventura rather than supplied macOS27 kit.

## Per-screen final raw scores

| id | appearance | raw score | evidence / disposition |
|---|---|---:|---|
| projects | Light | 6.5 | wave2 individual vision, raw score; Input text vertically centered in24px field. Fresh Dark vision confirms baseline. Remaining complaints target intentional inline creation. |
| new-conversation | Light | 6.8 | wave2 individual vision, raw score; Recent sidebar long labels now single-line; fresh vision confirms. Remaining complaints target duplicate search and permitted flat material. |
| projects--empty | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| recent | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| artifacts | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| artifacts--empty | Light | 6 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| artifacts--detail | Light | 7 | wave2 individual vision, raw score; Live sheet y52; live popover-arrow exists at1080,120 (14×14). Reviewer missing-arrow/floating-sheet claims contradicted by layer readback. |
| routines | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| routines--new | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| customize | Light | 9 | prior independent review (unchanged); Prior accepted review retained; unchanged. |
| customize--profile | Light | 7 | wave2 individual vision, raw score; Wrong overlapping-window glyph replaced with 14px unchecked checkbox. Vision confirms no clipping/overlap and uniform 24px fields. Recalibration still returned 7. Labels 120px, gap12 verified. |
| signin | Light | 7 | wave2 individual vision, raw score; Email reduced 36→24; all sign-in buttons 28. Live readback disproves reviewer claim of 32px primary; 16px stack gaps verified. Remaining review alleges 1–2px optical nits. |
| conversation | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| conversation--approval | Light | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| conversation--menu | Light | 6.8 | wave2 individual vision, raw score; Menu x768 width244: right1012 = trigger right1020 minus8. Share/Export visually distinct, verified in both fresh images. Review still penalizes permitted flat materials. |
| project | Light | 6 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings | Light | 6.5 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-account | Light | 6.7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-devices | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-general | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-appearance | Light | 7 | wave2 individual vision, raw score; All 10 label widths200; all controls x216; all rows28 in both appearances. Claimed group-gutter variance disproven by geometry.json. |
| settings-voice | Light | 6.6 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-notifications | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-connections | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-billing | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-privacy | Light | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-shortcuts | Light | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-about | Light | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings--sign-out | Light | 7 | wave2 individual vision, raw score; Fresh Light review calls fully finished, defect-free but returns compressed7. Centered alert is explicitly required. |
| settings-billing--plan | Light | 7 | wave2 individual vision, raw score; Live y52 and fresh Light review confirm attachment. Fresh review calls defect-free yet compressed7. |
| conversation--delete | Light | 6.8 | wave2 individual vision, raw score; Fresh Light review reports zero major and minor pixel defects; score6.8 explicitly compressed. |
| search | Light | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| activity | Light | 6.9 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| activity--work | Light | 6.8 | wave2 individual vision, raw score; Fresh Light review reports zero pixel defects; score6.8 explicitly compressed. |
| projects | Dark | 6.8 | wave2 individual vision, raw score; Input text vertically centered in24px field. Fresh Dark vision confirms baseline. Remaining complaints target intentional inline creation. |
| projects--empty | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| project | Dark | 7.2 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| recent | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-account | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| artifacts | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-devices | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-general | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| artifacts--empty | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-appearance | Dark | 6.8 | wave2 individual vision, raw score; All 10 label widths200; all controls x216; all rows28 in both appearances. Claimed group-gutter variance disproven by geometry.json. |
| settings-voice | Dark | 6.7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| artifacts--detail | Dark | 7 | wave2 individual vision, raw score; Live sheet y52; live popover-arrow exists at1080,120 (14×14). Reviewer missing-arrow/floating-sheet claims contradicted by layer readback. |
| settings-notifications | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-connections | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| routines | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-billing | Dark | 6.5 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-privacy | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| routines--new | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-shortcuts | Dark | 6.5 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings-about | Dark | 7 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| customize | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| settings--sign-out | Dark | 6.8 | wave2 individual vision, raw score; Fresh Light review calls fully finished, defect-free but returns compressed7. Centered alert is explicitly required. |
| customize--profile | Dark | 7 | wave2 individual vision, raw score; Wrong overlapping-window glyph replaced with 14px unchecked checkbox. Vision confirms no clipping/overlap and uniform 24px fields. Recalibration still returned 7. Labels 120px, gap12 verified. |
| settings-billing--plan | Dark | 7 | wave2 individual vision, raw score; Live y52 and fresh Light review confirm attachment. Fresh review calls defect-free yet compressed7. |
| signin | Dark | 7 | wave2 individual vision, raw score; Email reduced 36→24; all sign-in buttons 28. Live readback disproves reviewer claim of 32px primary; 16px stack gaps verified. Remaining review alleges 1–2px optical nits. |
| new-conversation | Dark | 6.8 | wave2 individual vision, raw score; Recent sidebar long labels now single-line; fresh vision confirms. Remaining complaints target duplicate search and permitted flat material. |
| conversation | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| conversation--approval | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| conversation--menu | Dark | 7 | wave2 individual vision, raw score; Menu x768 width244: right1012 = trigger right1020 minus8. Share/Export visually distinct, verified in both fresh images. Review still penalizes permitted flat materials. |
| conversation--delete | Dark | 6.8 | wave2 individual vision, raw score; Fresh Light review reports zero major and minor pixel defects; score6.8 explicitly compressed. |
| search | Dark | 6.8 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| activity | Dark | 6.9 | wave2 individual vision, raw score; Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker. |
| activity--work | Dark | 7 | wave2 individual vision, raw score; Fresh Light review reports zero pixel defects; score6.8 explicitly compressed. |

## Remaining

Obtain a rubric-compliant independent visual scorer (or human adjudication) before declaring every screen ≥8. Retain raw findings for actual verification; do not use provider scores as a reason to destroy correctly measured native chrome. Minor optical allegations remain unconfirmed where the provider contradicts its own full-frame geometry. No claim that every below8 raw output has been fixed into a passing score.

## Artifacts and replay

- `fix-native.js`: lane-scoped in-place repair (no save).
- `fix-result.txt`: changed-frame ledger.
- `export.py`, `exports.jsonl`: 50 fresh MCP screenshots under `/tmp/harso-sk/shots/fix2-macos-*`.
- `probe.js`, `probe.jsonl`, `probe-parsed.json`: before-state evidence.
- `verify.js`, `verified.txt`, `geometry.js`, `geometry.json`: readback evidence.
- `final-ledger.json`: all68 final score/source/frame/image records.
- `report.py`: count/dimension validation and report generation.

LANE_RESULT: BLOCKED — 68/68 reviewed, 50/50 changed screens re-shot and re-reviewed; 6/68 raw scores ≥8; vision full-scale calibration failure; document unsaved.
