# mac-core v2 — 18 frames built; visual acceptance NOT met

Document `40E7AE0D-B568-476B-9630-D3AB62280DBE` remains open and **unsaved**. Only owned screen ids on Proto macOS Light / Proto macOS Dark were changed. All 18 frames are 1440×900 at x=index×1560, y=0.

## Frame ids and final vision scores

Scores below are the final post-refinement three-screen review outputs, retained verbatim, not converted into passing scores. Every frame also received an individual full-frame vision review.

| Screen | Light frame | Score | Dark frame | Score |
|---|---|---:|---|---:|
| signin | `F379A68D-32D3-4B57-9DE5-1B2D29395BDC` | 6.5 | `B708CE01-0A3E-4EEA-9D46-CCA1475F5414` | 6 |
| new-conversation | `FB1CCB50-2941-4F9E-A0FC-605DC861FCA6` | 6.8 | `3E9C76B5-B359-4563-941E-CA1889019E51` | 7 |
| conversation | `E268D511-9E3B-47A7-AC78-1AA771E6F84E` | 6.7 | `81E3D6A3-E547-43D5-A8DE-B1FE4E504046` | 7 |
| conversation--approval | `E2948722-A77D-4F19-8B7F-AB3F764CC027` | 6 | `307BCF6E-0FB3-47E5-9187-A79EC70755FA` | 6 |
| conversation--menu | `0C37B0B5-B03A-4704-9BEB-3412AF8DF788` | 7 | `F2DFF085-175A-46DB-91F1-2DEA8D036EBB` | 5 |
| conversation--delete | `62EE0398-0F95-4EFD-B066-4D8C9A61CAA9` | 6 | `9CFD6EC4-4830-4C27-AE23-AA67B722AA66` | 6 |
| search | `8ADDCFA6-396D-4185-9616-9187790C116E` | 7 | `55D86F61-1D07-4AF0-BF73-C8A58FC235CE` | 6.2 |
| activity | `D22ED12B-1DC0-4468-80E2-B6F31E54341F` | 6.5 | `FB5360BC-ADCE-467A-8A5E-061498D4F098` | 6.6 |
| activity--work | `33D7B889-E3F9-4433-B40F-EC22A87FC910` | 6.5 | `2342D644-5E5E-4DCB-A3D5-6D77399B45A2` | 6.4 |

## Delivered and verified

- Finished four remaining Light screens and built all nine Dark screens using v2 native helpers; retained the five pre-existing Light frame IDs.
- Exact command approval with working directory, remember checkbox, Deny / Allow once. Danger delete alert. 244px menu with 22px rows, SF glyphs, separator and negative Delete, anchored 4px below ellipsis. Full-screen search, eight grouped results, scope chips and reasoning privacy line. Activity with work status/project/time/tokens and Work inspector with steps/files/approval/actions.
- Auth refinement replaces generic identity glyphs with actual monochrome Apple and Google SVG brand shapes (Simple Icons v15), 32px OAuth controls and layered shadow; legal footer centered.
- Fixed native sidebar All projects label's 8px parent overflow locally across all 16 window frames. Final `verification.json`: **18 unique targets, zero descendant right/bottom overflow, zero suffixed link names**. This audit does not prove interactive link destinations are wired; it verifies the requested naming contract.
- Geometry readback: sidebar256 / toolbar52 / inspector320; menus244×129; full-frame scrims exist above base and below overlays, Light #00000066 / Dark #00000099. Code and conversation composer both784 wide. No shared helper or other lane page was changed.

## Visual acceptance blocker / findings

**0/18 achieved the requested ≥8/10 gate. Do not report this lane as complete.** The vision evaluator repeatedly declares a “compressed scale”, once explicitly a 3–7 range. It also contradicts verified geometry (claims 240px sidebar / 300px inspector, absent scrims, 200px menu, unequal code/composer widths) and requests alternatives forbidden by the brief (window-attached sheets instead of required centered H.macAlert, docked editor instead of required composer, no scrim instead of required scrim). Those claims were checked against the live document; numeric scores were not relabeled. Remaining consistent visual criticism concerns flat materials/control shading and auth-window spacing. These need an authoritative visual review/calibration or a coordinated native-helper redesign, not silently violating the mandated chrome in this lane.

Two vision calls returned temporary 503 capacity errors; both review sets were retried successfully. Sketch bridge stayed responsive; no call exceeded60s. Builder now enforces a60s timeout per bridge invocation.

## Artifacts and replay

Lane root: `/tmp/harso-sk/proto/lanes/v2-mac-core/`.

- Existing parameterized `common.js`, `shell.js`, `content.js`, `inspector.js`, `overlay.js`; generated per-screen/per-appearance scripts.
- `build.py` updated with60s subprocess timeout; `frames.jsonl` appended.
- `refine.js`, per-target `*-refine-*.js`, `apple.svg`, `google.svg`; apply refinements after generator build.
- `final-fix.js` and per-target `*-final-fix-*.js`; apply LAST after build/refinement, preserving frame IDs.
- `audit.js`, `check.js`, `live.json`, `verification.json` give exact final inventory and geometry evidence.
- Final full-size PNGs: `/tmp/harso-sk/shots/core2-{Light|Dark}-{id}.png`.
- Final review sheets: `{Light|Dark}-review-{0|1|2}.png` (each contains three full-resolution1440×900 frames with labels; 1440×2880 overall).

Reference: `/tmp/harso-sk/proto/ref-mac-conversation-v2.png` and measured `/tmp/harso-sk/proto/HIG-SPEC.md`. Signin is a standalone native auth-window composition; all other frames use H.macWindow exactly.

LANE_RESULT: INCOMPLETE_VISUAL_GATE — 18/18 v2 frames built/exported/reviewed;18 unique frames,zero audited overflow or suffixed links;0/18 certified ≥8; REPORT.md includes exact ids and unmodified vision scores; document unsaved.
