# v3 macOS manage — rebuild report

## Outcome
Regenerated all 11 SCOPE IDs × Light/Clean and Dark/Clean (22 frames) in the existing Proto macOS Light / Dark pages using prelude3 and lib-v3. No pages created, no document save performed, no other lane screens touched.

Approved pattern implementation: quiet Pinned/All project lists; Project inspector Instructions/Memory/Sources/Working location; Today/Yesterday recent rows; three-column artifact thumbnail grid with titles/meta on canvas; 760px artifact preview with pill tabs and shadow share popover; clock routine rows with 5px status dots; borderless radius16 new-routine sheet; quiet customization sections, pills and profile form; sparkle/one-line/action empty states.

## Verified
- Live exact-target audit: 22 unique screen IDs, all 1440×900; y1060, x=index×1560.
- Zero enabled borders except native traffic lights. Every status dot5px. All text SF Pro or Inter. Zero auto-suffixed link names.
- All 22 exports independently asserted 1440×900 and copied into this lane directory with unique v3-mac-manage-verified names.
- Final Light contact-sheet vision: no clipping/overlap or unapproved containers across all11; raw7/10.
- Final Dark contact-sheet vision: no clipping/overlap, compliant tonal containers across all11; no numeric score supplied.
- Repaired share popover independently reviewed Light and Dark: no clipping/overlap, raw7/10 each.

## Numeric gate caveat
The reviewer repeatedly announces a compressed4–7 scale, even when asked for full1–10 and when listing no defects. Do not promote those raw scores to8. The v3 defect-list gate is clear; the inherited v2 numeric≥8 gate remains NOT certified. Earlier contact reviews alleged borders and extra inspector surfaces contradicted by the live zero-border audit and the explicit approved inspector specification; final grounded reviews clear these findings.

## Issues resolved
- Invalid SF `square` was rejected; replaced by available rectangle_on_rectangle.
- Share popover quiet-row default made text12px wide; repaired to144px, verified both appearances, folded into generator.
- Shared quietRow mono timestamps fell back to Helvetica; lane-normalized to Inter and verified.
- Initial export names collided with another concurrent lane and were overwritten with390×844 phone images. Discarded those artifacts/reviews and re-exported every exact frame using unique mac-specific tags; final exports all1440×900.

## Frame ledger and raw first-pass scores
Scores below remain raw; final defect-only results above supersede false-positive border claims, not the numerical scores.

| Appearance | ID | Frame ID | Raw review score |
|---|---|---|---|
| Light/Clean | projects | `8BFB5BF7-CEDD-4524-8B38-B83CE06CF9EF` | 7/10 |
| Light/Clean | projects--empty | `DB49091A-D822-4ED7-B048-6FDE471454E7` | 6/10 |
| Light/Clean | project | `187BF01F-3059-4AB1-BBDE-61FA2A458512` | 6/10 |
| Light/Clean | recent | `17FA1DB1-F208-489D-B85B-85A03A5EE7E4` | 6/10 |
| Light/Clean | artifacts | `A4065778-57D1-4144-B42A-8DFB9CCDF9DD` | 7/10 |
| Light/Clean | artifacts--empty | `430D46A3-C339-4946-A132-B9E5A31A0702` | 6/10 |
| Light/Clean | artifacts--detail | `EB5C1A90-9C6B-4367-984B-CAF1B5A2FE89` | 7/10 |
| Light/Clean | routines | `A79C9523-7A2B-41AA-940A-C7758113CB3C` | 7/10 |
| Light/Clean | routines--new | `C809E502-2269-43DE-A4DD-C233F4527382` | 6/10 |
| Light/Clean | customize | `ED5BCC50-2562-4F73-8F09-32EC3A4A8A60` | 5/10 |
| Light/Clean | customize--profile | `607859D4-00E4-47DD-8AAC-219EAA30D74F` | 5/10 |
| Dark/Clean | projects | `7C9F97AC-5D6B-424B-8A67-017DFCFBA930` | 7/10 |
| Dark/Clean | projects--empty | `EFA9426F-CFB0-4CCA-8BF9-C50D3316ED1A` | 7/10 |
| Dark/Clean | project | `BC0AEAC3-BEB8-495E-B73E-DF1E90C9A51A` | 5/10 |
| Dark/Clean | recent | `D0042DD5-770F-44E9-A4A2-82CF70D4CF09` | 7/10 |
| Dark/Clean | artifacts | `F69F2AFC-4B86-42EE-8667-BDAF1D0952AE` | 7/10 |
| Dark/Clean | artifacts--empty | `15F195A2-4364-40E1-AD76-C9A81945384D` | 7/10 |
| Dark/Clean | artifacts--detail | `6770E2C8-EF22-451B-8782-AF29CA7C9868` | 7/10 |
| Dark/Clean | routines | `9357ECAB-F20E-4941-AE79-C0BBBC809838` | 7/10 |
| Dark/Clean | routines--new | `2B12C51E-4195-4403-8F28-1059A982140A` | 7/10 |
| Dark/Clean | customize | `6530089D-D73D-43E7-AF4E-08B58F70ED89` | 6/10 |
| Dark/Clean | customize--profile | `0C24B225-39FF-4CDF-BA5F-7F9E57B7F407` | 5/10 |

## Files / reproduction
`common.js`, `data.js`, `build.py`, per-screen shell/body/overlay scripts, `refine.js`, `fonts.js`, `audit.js`, `audit.json`, `audit-result.txt`, `frames.json`, `export.py`, Light/Dark contact sheets, and22 verified PNGs all live here.
Build with `python3 build.py Light/Clean` and `python3 build.py Dark/Clean`; build.py explicitly sets SK_PRELUDE=/tmp/harso-sk/proto/prelude3.js. Changes from refine/fonts are integrated into current common.js. Run export.py to produce verified exports. Never save.

LANE_RESULT: REBUILT_22_OF_22; V3_DEFECT_GATE_CLEAR; NUMERIC_GE8_NOT_CERTIFIED; NO_SAVE
