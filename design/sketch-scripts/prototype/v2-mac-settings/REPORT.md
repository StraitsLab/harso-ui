# macOS Settings v2 — native rebuild

## Outcome
28 frames rebuilt on Proto macOS Light / Proto macOS Dark. All 1440×900, original group-2 grid. Native H.macWindow chrome, real SF Pro SF Symbols, 220px category navigation, 13pt right-aligned 200px form gutter, GroupBoxes and macOS controls. Document was not saved.

## Visual scores and evidence
Scores below are the vision tool’s explicitly reported **actual/uncompressed 1–10 native-fidelity scores**, not its separate center-compressed reporting scores (typically 6–7). Both scales appeared in tool responses; no numerical conversion was inferred. Early reviews gave lower scores; repairs addressed Space key clipping, adjacent actions, switch/button depth, permission disclosures, meter grouping and sheet corners. Remaining comments concern small optical/material differences; some vision comments contradict measured geometry (e.g. sheet at y52 described as floating). Geometry is audited independently.

| Screen | Appearance | Frame ID | Actual vision score |
|---|---|---|---|
| settings | Light | `3F254BCA-10C8-4924-B974-7C554AD30711` | 8.5 |
| settings-account | Light | `DE42BB10-CAD4-41AE-B0E8-985A625D6CEF` | 8.0 |
| settings-devices | Light | `11487E4A-4B4B-49BB-B70D-9DF368B15755` | 9.5 |
| settings-general | Light | `6D6999F9-FBAA-4722-BCE3-7B3EABBF1D2D` | 8.5 |
| settings-appearance | Light | `5DFB86AF-78B1-48AB-9DE7-56675FDD26F2` | 8.0 |
| settings-voice | Light | `5F9F9546-E7CD-4842-BE07-B8C00508DA18` | 9.2 |
| settings-notifications | Light | `126FC499-D20A-4811-8BAC-08FD7BB601B2` | 9.5 |
| settings-connections | Light | `CFE8FC12-EC08-4BA2-B0FC-3877E48D17FB` | 9.5 |
| settings-billing | Light | `240AD51A-C4E4-4AAB-9852-89C32AA27D5A` | 9.5 |
| settings-privacy | Light | `D15A6BD3-A61B-4E5C-83BB-A3FE8E528D1E` | 8.5 |
| settings-shortcuts | Light | `60309C25-74A7-46A2-B110-C543D526C3B8` | 8.0 |
| settings-about | Light | `12A25471-8DE4-4F7B-82FE-0C2A2A71BB98` | 9.5 |
| settings--sign-out | Light | `0B3FD776-5069-45AB-B531-56073E95153B` | 9.3 |
| settings-billing--plan | Light | `A4D79E62-5F9E-4920-8563-A01D89F2C1E7` | 9.0 |
| settings | Dark | `4ED725B8-F189-4AD3-93BD-D80EFA69826A` | 9.0 |
| settings-account | Dark | `D1679338-5106-4639-89A3-CEB65F7916B6` | 8.5 |
| settings-devices | Dark | `6E188030-8AC3-4EC1-91B2-F61DB575AC3E` | 9.5 |
| settings-general | Dark | `B8EBDCBB-DB93-4684-935D-33DAF3F912C8` | 8.5 |
| settings-appearance | Dark | `EB632E03-C8A7-4F17-BE03-7A9531EC3947` | 8.0 |
| settings-voice | Dark | `9B1E7FF6-3CB6-42A2-8B81-4DC4774A4F65` | 9.0 |
| settings-notifications | Dark | `910F2AA6-2837-48E6-9C83-6A214E14AC73` | 9.5 |
| settings-connections | Dark | `991B577B-1F9A-4FDA-A873-84AA55D602D0` | 9.5 |
| settings-billing | Dark | `1426FB59-1A5F-4168-B507-92EB24A81834` | 9.5 |
| settings-privacy | Dark | `8D293922-F2D8-4682-9CDD-D6A79A2A224D` | 8.0 |
| settings-shortcuts | Dark | `7AD9E86E-EE1E-4773-9E8E-D4BFC6AAB56B` | 9.0 |
| settings-about | Dark | `3C265401-567B-400A-8D02-9055526A74EA` | 9.5 |
| settings--sign-out | Dark | `542524D4-4423-4722-8D14-8B72A3E3D620` | 9.0 |
| settings-billing--plan | Dark | `76CDA4DF-7520-485E-AF4A-4A9960077481` | 9.0 |

## Decisions / real values
- Latest task overrides old SCOPE copy: root selects General; dedicated Account exists. Pro S$32/month; Team S$96/month; renewal14 Oct2026; 41,200/500,000 tokens; three named devices; version1.4(build2026.09.15).
- Identity/contact details and preferences are designed prototype values, not live account verification.
- Search toolbar is labeled Search settings and scoped to settings navigation; actual filter behavior is not implemented in static Sketch frames. Control hotspots use link names; parent lane handles final wiring.
- `settings--sign-out`: native centered danger alert, Cancel→back, Sign out→signin. `settings-billing--plan`:560px attached sheet at y52, three plan cards/current check, Change plan→settings-billing.

## Files and replay
- `build.js`, one `<screen>.js` per id parameterized APP/PHASE; `run.py` builds both appearances (shell/detail/overlay).
- `repair.py` idempotently repairs detail regions; scope resolution uses exact child paths, not global find.
- Final replay refinements: `polish.js`, `keys-fix.js`, `adjacent.js`, `final-refine.js`, `audit.js`.
- `frames.json` is exact document ledger; `export.py` exports all28. Screenshots `/tmp/harso-sk/shots/v2-ms-<Light|Dark>-<screen>.png`. Full-scale visual pairs `pair-<screen>.png`; earlier review boards retained.

## Issues resolved
- Page-object helper bug initially placed root/account on stray Page pages. Recovered own frames to correct page and changed H.screen(page:page.name). Lead subsequently cleaned shared stray pages.
- Initial missing exact screen caused broad sketch.find fallback and mixed detail content. Replaced with explicit descendant traversal; rebuilt every detail; audited one heading per frame.
- Vision service returned intermittent503 and repeatedly center-compressed scores; retried and explicitly requested both score scales.

LANE_RESULT: PASS — mac-settings v2;28/28 frames;actual vision scores8.0–9.5;no save;REPORT.md + frames.json.