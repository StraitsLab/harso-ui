# ios-core prototype lane report

Built 18 iOS frames: 9 requested screens × Light/Clean and Dark/Clean. All frames are 390×844, flow row y=0, x=index×510, with external captions. Document was not saved. Other lanes and kit pages were not modified.

## Frame inventory

| Page | Screen | Frame ID |
|---|---|---|
| Proto iOS Light | signin | `8CBC262B-5820-4377-B4A8-2E0B983D01CE` |
| Proto iOS Light | home | `5E1641B2-17FB-4E18-A6A9-DB5CC2B5D87F` |
| Proto iOS Light | conversation | `5F3540E7-212F-4602-A05E-BC5127467A22` |
| Proto iOS Light | conversation--approval | `127B829E-5A0F-4CE9-8D76-D17B023B401A` |
| Proto iOS Light | conversation--menu | `68EFAA25-9A55-42E1-96F1-ADF82B2B3E7B` |
| Proto iOS Light | conversation--delete | `D0480B90-1485-4C31-99C4-EB42C57D84C2` |
| Proto iOS Light | search | `F7D18AF8-984F-49DB-BD80-7E383F4A6979` |
| Proto iOS Light | activity | `2ADE4393-262A-4874-9358-15D8E9121FAB` |
| Proto iOS Light | activity--work | `96A78939-F023-4012-BB39-1FB93CA5EF7A` |
| Proto iOS Dark | signin | `0B1C5D9E-342F-4D46-8135-1DFA3D106A8E` |
| Proto iOS Dark | home | `FA27C511-F93F-42D6-A10B-C15AE33BE201` |
| Proto iOS Dark | conversation | `FC2AE104-2747-4F8A-BBB8-D3F599717105` |
| Proto iOS Dark | conversation--approval | `7EDA4785-164A-4A65-80B2-A413738A87B6` |
| Proto iOS Dark | conversation--menu | `7A7F358D-8C93-4085-BB62-57C8F7623AC0` |
| Proto iOS Dark | conversation--delete | `DCB5754A-C65F-4B70-ADF5-9F27C663F179` |
| Proto iOS Dark | search | `DC77D488-C6B8-4D21-BA55-38841CEEDA2E` |
| Proto iOS Dark | activity | `A44DE7AE-42A1-4B3B-A31B-B8677363C28D` |
| Proto iOS Dark | activity--work | `1016C8B5-11B3-4BF4-A2F4-C0B1F927DBE0` |

## Navigation target names

`link:activity`, `link:activity--work`, `link:artifacts`, `link:back`, `link:conversation`, `link:conversation--approval`, `link:conversation--delete`, `link:conversation--menu`, `link:home`, `link:project`, `link:projects`, `link:recent`, `link:search`, `link:settings`

Exact names read back from the document after removing Sketch automatic numeric sibling suffixes. Navigation frames and controls use link:<id>. Cross-lane targets are intentionally left for the lead to wire. Menu Rename/Duplicate and composer actions use the conversation target as prototype continuity; these are visual prototype actions, not functional editing.

## Verification

- All 18 screenshots exported through Sketch get_screenshot; six contact sheets vision-reviewed.
- Final signin, home, conversation and overlay visual reviews passed after repairing SocialButton strokes, Composer trailing controls and explicit assistant text wrapping. Search, Activity and Work details passed.
- Approval sheet: Allow once / Always allow / Deny. Menu: Rename / Duplicate / Move to project / Export / Delete / Cancel. Delete dialog: destructive action / Cancel. All overlays retain underlying conversation with 40% ink scrim.
- Work details includes objective, attempt, three plan steps, Steer / Cancel / Respond.
- Kit SocialButton and phone Composer content reused; local instances detached only to fix phone resizing. SearchField remains a kit instance. Overlay containers follow kit dimensions/patterns.

## Files

Generators and targeted repair scripts: this directory (`common.js`, `shell.js`, `content.js`, `overlay.js`, `fix-*.js`, `social-border.js` plus per-appearance generated scripts). `frames.json` is the verified frame/navigation ledger. `verify.js` and `export.py` regenerate evidence. `Light-review-*.png` and `Dark-review-*.png` are contact sheets; individual screenshots are `/tmp/harso-sk/shots/ios-core-<appearance>-<screen>.png`.

## Issues resolved / limitations

- Foreground batch timed out; inspected live document and resumed only missing stages. No duplicate frames.
- Missing danger swatch caused partial overlay builds; repaired existing panels using the actual negative token. Sketch wrapper can exit zero with Error in stdout.
- No ChatShell-named frame could be found in the live document using recursive inspection; conversation was adapted from the supplied real-app screenshot, with kit phone Composer and shared iOS shell.
- Native flow wiring is the lead lane’s next step; no document save performed.

LANE_RESULT: ios-core COMPLETE — 18 frames, both appearances, screenshot/vision checked, exact link names verified; ready for lead wiring.
