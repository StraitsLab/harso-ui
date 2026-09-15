# macOS v2 independent visual review — PARTIAL / BLOCKED

**Not a completed 68-screen review.** All 68 indexed macOS PNGs decoded successfully at 1440×900. Individual vision analysis succeeded for 18 Light images; 2 of those require measurement rechecks, leaving 16 provisional scores. All Dark screens remain unreviewed. Upstream vision service repeatedly returned HTTP 503 `auth_unavailable` / `No capacity available for model gemini-3.8-flash-high`. A delayed retry briefly recovered, then a later full batch failed. No fabricated scores are assigned to unseen screens.

Benchmark: supplied REVIEW-BRIEF-v2.md and HIG-SPEC.md, referring to Apple macOS 27 Mail, Notes, Finder, System Settings. No independent Apple app screenshots were supplied or opened. Flat materials, one accent and Inter content are permitted. All px findings below are visual estimates, not source-layer or raster-run measurements. The initial analyzer explicitly compressed scores despite the prompt; those raw scores are rejected and rescored using the brief (no defect ≥8).

## Per-screen table

| id | appearance | score | defects (px + Apple reference) |
|---|---|---:|---|
| projects | Light | 8 | No confirmed geometry defect. Finder comparison: 256px sidebar / 52px toolbar verified visually. Initial analyzer mistook permissible 28px paint for a failed 36px hit target; rejected. Column-header alignment is a potential nit, not a measured failure. |
| new-conversation | Light | UNREVIEWED | RECHECK: analyzer alleged recent-label wrapping within 32px source rows and ~24px trailing search inset, but no reliable bounds. Do not assign a below-8 score or fix without chrome crop verification. |
| projects--empty | Light | 9 | None nameable. Native Finder / Notes / Mail structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| recent | Light | 9 | None nameable. Native Finder / Notes / Mail structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| artifacts | Light | 9 | None nameable. Native Finder / Notes / Mail structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| artifacts--empty | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| artifacts--detail | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| routines | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| routines--new | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| customize | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| customize--profile | Light | UNREVIEWED | RECHECK: inline detail, not modal (absence of scrim is not a defect). Analyzer alleged ~26px fields and inconsistent right-label gutter against System Settings 24px controls; crop measurement needed before scoring. |
| signin | Light | 7 | Apple account/System Settings comparison: traffic-light inset approximately 16px vs 20px target (4px short); email field approximately 40px vs supplied 24px content-field target (+16px). Measurements are visual estimates, not pixel-run verification. |
| conversation | Light | 9 | None nameable. Native Finder / Notes / Mail structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| conversation--approval | Light | 8 | None nameable. Native Finder / Notes / Mail structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| conversation--menu | Light | 8 | Finder/Mail menu: 244px width and 22px rows; right edge approximately 16–18px beyond ellipsis trigger right edge. Minor anchor nit; Share/Export symbols visually too similar. |
| project | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| settings-account | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| settings-devices | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-general | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-appearance | Light | 8 | System Settings: minor label-gutter variance between Accessibility and Reading/Appearance groups; pixel offset not reliably established, so not treated as below-8 defect. |
| settings-voice | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| settings-notifications | Light | 9 | None nameable. Native System Settings structure; 256px sidebar / 52px toolbar, clear glyphs and no clipping detected. Static screenshot cannot establish hit targets. |
| settings-connections | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-billing | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-privacy | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-shortcuts | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-about | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings--sign-out | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| settings-billing--plan | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| conversation--delete | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| search | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| activity | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| activity--work | Light | UNREVIEWED | NOT REVIEWED — vision_analyze returned upstream 503 capacity/auth_unavailable. |
| projects | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| projects--empty | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| project | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| recent | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-account | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| artifacts | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-devices | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-general | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| artifacts--empty | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-appearance | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-voice | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| artifacts--detail | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-notifications | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-connections | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| routines | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-billing | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-privacy | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| routines--new | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-shortcuts | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-about | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| customize | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings--sign-out | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| customize--profile | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| settings-billing--plan | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| signin | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| new-conversation | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| conversation | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| conversation--approval | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| conversation--menu | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| conversation--delete | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| search | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| activity | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |
| activity--work | Dark | UNREVIEWED | NOT REVIEWED — not attempted after sustained vision-provider outage; no inference from Light counterpart. |

## Below 8 — provisional, sorted by severity

1. **signin · Light — 7/10.** Normalize traffic-light group to 20px inset from the sign-in window origin (move about 4px inward). Reduce the approximately 40px email field to the specified 24px native content control, vertically recenter envelope and text, and preserve an 8px control gap. Reference: supplied macOS System Settings form metrics and window-chrome benchmark. Verify with a crop before modifying; Apple sign-in-specific large-control exceptions were not independently established.

No claim is made that this is the full below-8 set: unreviewed images may contain worse defects.

## Cross-cutting findings

- **Preserve the shell:** reviewed images consistently show 256px source list, 52px unified toolbar and readable native-style glyphs. Do not replace this with a web navigation pattern.
- **Do not confuse paint and hit targets:** 28px painted toolbar elements inside a 36px target are explicitly valid. PNGs cannot prove invisible hit rectangles. Compact 24/28px content buttons are also valid.
- **Menu helper:** offer explicit trigger-relative horizontal alignment; for the reviewed conversation menu, remove the estimated 16–18px trailing overhang if confirmed. Use visually distinct Share (`square.and.arrow.up`) and Export (`square.and.arrow.up.on.square` or another semantically appropriate export symbol) rather than near-identical glyphs. This is a minor refinement, not a reason to force all menus below 8.
- **Form helper recheck:** inspect profile field height and fixed right-aligned label gutter; appearance-page group gutters have a minor visual inconsistency. Do not propagate unmeasured changes across every form.
- **Empty states are valid:** Projects empty has a clear purpose, accent and action; whitespace is not a defect. Do not penalize flat export materials or Inter.
- **Evidence quality:** initial vision results contained incorrect Retina-size claims, a fictional-hardware assertion and compressed scores. Those claims were excluded. A final pass needs actual chrome crops/raster measurements, all unseen PNGs individually, and parity checks in Dark appearance.

## Completion gate

Report has exactly 68 unique `(id, appearance)` rows matching index.json, but only 16 provisional numeric scores. 15 screens are provisionally ≥8; this is a lower bound, not a full-lane verdict. Remaining work is explicit in each row. No Sketch/source/PNG was modified.

REVIEW_RESULT: 15/68 ≥8
