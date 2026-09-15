# v2 macOS manage — delivery report

## Outcome
Rebuilt all 11 scoped screens × Light/Clean and Dark/Clean (22 frames) in the existing Sketch document. **The requested ≥8/10 vision gate is NOT established for all screens.** Raw reviewer scores are reported below, without inflating or remapping them.

Document: `40E7AE0D-B568-476B-9630-D3AB62280DBE`. Pages: `Proto macOS Light`, `Proto macOS Dark`. Never saved. No kit pages or other lanes edited.

## Verified
- 22 unique scoped frames, each 1440×900, row y1060, x=index×1560; v1 counterparts removed before each replacement.
- Native `H.macWindow` chrome, 256 sidebar, 52 toolbar, 320 Project inspector; 600 real SF Pro symbol text layers.
- Native 24px controls/segmented pickers, 13pt form labels, 28px Recent rows; artifacts sheet720 and routine sheet520 both attached at y52.
- Final recursive audit: zero descendant stack-bound overflows and zero numeric-suffixed link names. `audit.json` contains exact IDs and results.
- Every screen exported through Sketch MCP and individually vision-reviewed; all22 final screenshot exports succeeded.
- Fixed inspector header order, sidebar recent wrapping, an8px All projects label-container overflow, empty-project sidebar contradictions, competing empty CTA and dangling Recent heading.

## Design decisions
- Followed SCOPE's11 exact IDs rather than inventing project overlays. Project shows Conversations/Work and right inspector. Artifact detail includes the open Share popover on the same scoped overlay frame.
- Realistic authored application content uses Abhi Bansal/Straits Lab, Weave Cloud billing extraction, Q3 letter, Aheli SATS work, actual-format paths and schedules. These are prototype content, not asserted live business telemetry.
- Customize combines required profile cards/skills with Voice, Personality and Tools GroupBoxes. Profile detail retains explicit Save as requested.
- Empty project removes existing project/recent rows and toolbar creation action; one warm sparkle and one primary CTA remain.
- Screens remain editable Sketch layers using stacks, document swatches, and real SF glyphs. The explicit link-name contract is ready for parent prototype wiring; this lane did not perform global routing.

## Vision scores (raw, not normalized)
The evaluator often explicitly said it used a “compressed scale,” assigning6–7 even where it found zero defects. It also repeatedly penalized requirements (solid primary button, profile cards, SF checkbox glyphs, fixed sheet) and misestimated screenshot scale. Actual geometry was therefore checked against live layers rather than changing correct dimensions. These scores still do not meet the requested all-screen ≥8 acceptance criterion. Dark artifact detail10 is explicitly a *defect* score, not a broad aesthetic score.

| Screen | Appearance | Frame ID | Raw vision score |
|---|---|---|---:|
| projects | Light/Clean | `02529925-BCF1-4C73-8DFA-2CCC6E593F4D` | 6.8 |
| projects--empty | Light/Clean | `9FD2831B-0D58-4A30-91A4-DC85C42CC4FB` | 6.5 |
| recent | Light/Clean | `8967E9F1-8C0F-47FD-88A3-5B204A9E1AE8` | 6.2 |
| artifacts | Light/Clean | `78E4C3C4-CFE1-49E7-9DF2-218A0C1B21C9` | 6.8 |
| artifacts--empty | Light/Clean | `C330284F-2A17-4CAF-B3EE-B9DB985CF4AF` | 6.5 |
| artifacts--detail | Light/Clean | `7F68FC9D-9518-4A16-8087-416D490A8D8D` | 6.8 |
| routines | Light/Clean | `A7B4E8DF-BA65-431B-9570-D19D766B2C9E` | 6.2 |
| routines--new | Light/Clean | `7F4C5039-CAFD-4A01-877E-5647C9BCA8EB` | 6 |
| customize | Light/Clean | `F48CDCD7-842C-4206-AF29-4ED122362B64` | 6.5 |
| customize--profile | Light/Clean | `75322581-4D04-4DF6-B1A3-CB56FA890A1C` | 6 |
| project | Light/Clean | `E75C634E-CDCB-4E10-866A-9E4A479DEE36` | 6.5 |
| projects | Dark/Clean | `F59A7656-C31E-4C76-8E6E-3909FD2BFC19` | 6.8 |
| projects--empty | Dark/Clean | `7A318509-5471-45B5-92CA-9D52F98A08A3` | 7 |
| project | Dark/Clean | `FFBA03D1-EA36-4AF5-AE95-46B2BAD3D61F` | 6.5 |
| recent | Dark/Clean | `3D227A2B-804C-4DF9-905B-62A378DC0002` | 6.5 |
| artifacts | Dark/Clean | `C739B99C-C20F-4EA4-8A2D-2DB56C3A623D` | 7 |
| artifacts--empty | Dark/Clean | `869C89E5-90AC-4B48-877A-E12147D093CA` | 7 |
| artifacts--detail | Dark/Clean | `ACF7821E-2E9A-49BF-A479-69DB7E724345` | 10 |
| routines | Dark/Clean | `37BC68DE-DE69-4E6D-B882-46C08CF12DBC` | 9.5 |
| routines--new | Dark/Clean | `3031B2A8-C4FF-461C-A95F-8CB02DCE3259` | 7 |
| customize | Dark/Clean | `0B38B33E-58C0-459F-A614-9ABB6E298E69` | 8.5 |
| customize--profile | Dark/Clean | `B3B317A5-0B80-474B-A530-347CE18FE786` | 6.5 |

## Files and replay
Canonical lane folder: `/tmp/harso-sk/proto/lanes/v2-mac-manage/`.
- `common.js`: reusable lane generator, parameterized by APP/ID.
- `<screen>-shell.js`, `<screen>-body.js`, `<screen>-overlay.js`: incremental per-screen stage scripts.
- `build.py`: generates and executes stages; takes `Light/Clean` or `Dark/Clean` and optional IDs.
- `refine.js`: mandatory final screen-scoped refinement pass. Run after generator replay.
- `frames.json`, `audit.js`, `audit.json`, `audit-result.txt`, `refine-result.txt`: ledgers and live readback evidence.
- `export.py`: exports all22 unique frames. PNGs: `/tmp/harso-sk/shots/v2-manage-{Light|Dark}-{id}.png`.
- Replay: `export SK_PRELUDE=/tmp/harso-sk/proto/prelude2.js`; `python3 build.py Light/Clean`; `python3 build.py Dark/Clean`; execute `refine.js` through sk.py; execute `audit.js`; `python3 export.py`. Never save.

## Issues / remaining acceptance
- All-screen ≥8 vision gate remains unmet; no blanket pass claimed. Low raw scores primarily cite native material depth/chrome conventions and generic flat-control appearance. Shared native chrome was preserved exactly as required, rather than altered against the reference.
- Shared bridge contention caused wrapper timeouts. Process/ledger checks avoided duplicate restarts; remaining batches were completed in a tracked background process and waited to exit0.
- Parent should use the frame ledger for navigation wiring and reconcile vision calibration/reference scoring before claiming full acceptance.

LANE_RESULT: v2-mac-manage BUILT=22/22 VERIFIED_GEOMETRY=22/22 OVERFLOW=0 BAD_LINK_NAMES=0 VISION_GATE=NOT_MET SAVED=false REPORT=/tmp/harso-sk/proto/lanes/v2-mac-manage/REPORT.md
