# iOS core v2 — rebuild report

## Outcome
18 native v2 frames rebuilt and read back: 9 IDs × Light/Clean and Dark/Clean. All 390×844, x=index×510, y=0. Old scoped v1 screens and captions removed. Document never saved; no other lane screens or shared helpers modified.

**Acceptance status: visual ≥8/10 gate NOT achieved.** Final vision scores are reported verbatim below, not inflated or remapped. The evaluator repeatedly explicitly compressed its scale to 3–7, including a 7 for an approval sheet with “No visible rendering defects.” Several findings contradict binding geometry or live layer properties (claims of custom icons despite real SF glyphs, missing tabs on intentionally tab:false pushed views, claimed overflow despite zero containment failures). A calibrated independent visual review is still needed; these discrepancies do not constitute a pass.

## Frame IDs and final vision scores
| Screen | Appearance | Frame ID | Vision /10 |
|---|---|---|---:|
| signin | Light | `AFCD8D72-3DD8-4A42-8ACA-15FC1F08C3D7` | 7 |
| home | Light | `6B49A610-A347-489B-A10D-96BC480D6FEB` | 6 |
| conversation | Light | `4DC4CF93-07DA-491C-BD11-D971A73A8500` | 6 |
| conversation--approval | Light | `8E5EFACA-798F-41D1-A057-03A623F18702` | 7 |
| conversation--menu | Light | `38335817-2D6D-4BC5-A442-2C86C00E1F44` | 7 |
| conversation--delete | Light | `9667C1BE-36D8-42AB-8818-25A4A74B7485` | 5 |
| search | Light | `8808534D-72EB-43F1-8C4B-263012278C7A` | 6 |
| activity | Light | `EAEF8C1F-5079-426F-8CEC-E37A5786E5BC` | 7 |
| activity--work | Light | `46987E69-01F9-40D4-8DFE-31B2D0426D86` | 6 |
| signin | Dark | `5213BBE3-3BB3-4E3B-A44B-937AEEBED71E` | 7 |
| home | Dark | `AC468F1E-0BF4-4655-A1DF-5C055E40E87A` | 6.5 |
| conversation | Dark | `7BFCF402-15DD-43AB-B2D9-61BDF1FD01AA` | 7 |
| conversation--approval | Dark | `8B249DAB-FF8F-4D27-A8A1-B31D7EA8A7B3` | 7 |
| conversation--menu | Dark | `C0DEB375-F9B3-4835-8F50-7274793EBAF0` | 7 |
| conversation--delete | Dark | `3A7F3E2A-A3E5-4318-A893-EB4F94CB2A66` | 7 |
| search | Dark | `94506CE2-11C1-4810-A918-002F53AF8CCC` | 6 |
| activity | Dark | `94883BA5-087A-47FA-8F39-7C8093A7CE95` | 5 |
| activity--work | Dark | `19F3F45D-74CE-44F9-A698-F68909DE94FC` | 6 |

## Verified
- `final-audit.json`: 18 unique named frames, zero descendant containment failures, zero auto-suffixed link names. Real SF Symbols throughout.
- Native `H.iosScreen`, `H.iosGroup`, `H.iosSheet` and `H.iosAlert`; 380px approval sheet, 250px anchored menu, native alert.
- Composer and approval banner fully visible; tab bars only on home/activity.
- Full exports: `/tmp/harso-sk/shots/core-<id>-<Light|Dark>.png`. Six 1× triptych review images in this lane folder.
- `inventory.json` holds live page/frame IDs. Final visual review covered all 18 frames.

## Design decisions / fixes
- Native text-only filled Apple pill as explicitly requested; no substitute seal glyph.
- Most-specific prompt wins for menu: Rename, Share, Move to project, Export, Delete. Background scrim is link:back for dismissal.
- Real engineering thread, 216 passed tests, migration command, repo paths, changed-file diffs and work status examples are prototype content, not claims about live repository execution.
- Sign-in interactive stack moved down 36px after initial visual feedback.
- Activity separators corrected to align with titles after adding status dots.
- Lane-local H.frame wrapper preserves zero-valued Start alignment, without changing shared prelude.
- Search and pushed work detail intentionally omit tabs.
- Native alert Cancel is weight 7 in both appearances; Light evaluator incorrectly called it regular.

## Remaining issues
- ≥8 numerical vision acceptance remains unverified. Some valid polish feedback remains: home composer/tab stack feels dense; sign-in has a large footer gap; changed-file typography is small on the phone.
- Native-helper material is static token-based translucency rather than a runtime blur. Helpers were retained per mandate.
- Repeated bridge lock contention caused 60/240-second timeouts; inspected live state before retries to avoid duplicate frames. No process belonging to another lane was killed.
- One final vision request returned 503 capacity unavailable; its retry succeeded.
- Link names are ready for parent wiring; actual prototype flows are not wired in this lane.

## Reproduction
`export SK_PRELUDE=/tmp/harso-sk/proto/prelude2.js`
Run each `<id>.js` for Light and `<id>-dark.js` for Dark through `/tmp/harso-sk/sk.py run_code`. Each is parameterized by APP and embeds `core.js`; generator files include final refinements. `refine-light.js` preserves current Light frame IDs when applying the two later spacing fixes. Never save.

LANE_RESULT: v2-ios-core | 18/18 rebuilt | 18/18 exported and vision-reviewed | 0 overflow | 0 bad link suffixes | visual >=8 gate NOT MET (raw scores 5–7) | unsaved
