# Harso / Weave — clickable prototype (screens) BRIEF

Goal: every screen a user sees in the Weave app, as Sketch frames, on macOS (1440×900) and iOS (390×844), in
Light/Clean and Dark/Clean, with every navigation element named so the lead can wire Sketch prototype flows.
Sketch only. Builds on the finished kit in the open document (`/tmp/harso-sk/doc.id`).

## Tooling (same as the kit build)
- `python3 /tmp/harso-sk/sk.py run_code '{"code_file":"/abs/script.js"}'` with `SK_PRELUDE=/tmp/harso-sk/proto/prelude.js`
  exported in your shell (this prelude = kit helpers + prototype helpers). Screenshot:
  `SK_TAG=name python3 /tmp/harso-sk/sk.py get_screenshot '{"targetDocumentID":"<doc.id>","layerID":"<id>"}'` → vision_analyze.
- READ `/tmp/harso-sk/proto/lib-proto.js` (prototype helpers) and `/tmp/harso-sk/lib.js` (kit helpers) first, then
  `/tmp/harso-sk/proto/smoke.js` + `smoke2.js` (working mac + iOS shells, screenshots at /tmp/harso-sk/shots/smoke-mac.png
  and smoke-ios2.png).
- Helpers: `H.screen`, `H.macSidebar(screen, app, activeId)`, `H.macMain(screen, app)`, `H.iosScreen({page, app, id, x, y,
  title, back, trailing, tab})` → `{screen, body, finish}` (call `finish()` last), `H.inst('<exact symbol name>', parent)` to
  place a kit symbol (Button/Light/Clean/primary/base/text/default etc. — list names with `doc.getSymbols()` filtered by
  prefix if unsure; `H.hasSymbol(name)`), plus all kit helpers (H.frame/text/rect/icon/order/relayout/paths).
- Pitfalls unchanged: stacks render index 0 LAST → `H.order` on every hand-built row; fontWeight 1–12; clear fills on
  layout frames (H.frame does); every screen must stay exactly 1440×900 / 390×844 — content that would overflow is
  clipped by the screen (design it to fit; use a scroll affordance, not a taller frame).

## Naming contract (the lead wires flows from these — get it exact)
- Screen frame: `Screen/<platform>/<App>/<id>` where platform ∈ `macos`,`ios`; App ∈ `Light/Clean`,`Dark/Clean`; id from the
  inventory below. Created by `H.screen`/`H.iosScreen` — never rename.
- Every clickable element: name `link:<target-id>` (a frame or symbol instance). `link:back` = go back. The sidebar and
  tab bar helpers already emit these. Add your own for in-content navigation (a project card → `link:project`, a
  conversation row → `link:conversation`, Settings category rows → `link:settings-<cat>`, dialogs' Cancel → `link:back`).
- Overlays (dialogs, sheets, menus, command palette) are their OWN screens with the underlying screen drawn beneath at
  40% ink scrim: id `<base>--<overlay>` e.g. `conversation--approval`, `settings--sign-out`.

## Layout
Page per platform×appearance: `Proto macOS Light`, `Proto macOS Dark`, `Proto iOS Light`, `Proto iOS Dark`. Grid: screens
in a row per flow group, x = index × (w + 120), y = group × (h + 160). Add a 13px `tertiary` caption text above each
screen (outside the frame, y − 28) with the id.

## Fidelity
The real app, screenshotted from the dev build at 1440×900: `/tmp/harso-sk/app-shots/<route>--light.png` / `--dark.png`
for routes signin, new-conversation, conversation, activity, projects, project, recent, artifacts, routines,
customize, search, settings (the new-conversation shot has its heading clipped by a fixture bug — centre it properly).
Reproduce the real sidebar, headings, copy and module structure of each screen; upgrade the visuals to the kit
(this is the design-forward version of the app, not a pixel copy). Where the real screen is an empty state, draw both the
empty state (from the kit's EmptyState) AND a populated state as separate screens `<id>` and `<id>--empty`.
For iOS there is no shipped app: derive each screen from its macOS sibling using iOS 27 patterns from the kit (TabBar,
Sheet, ActionSheet, SearchField, GroupBox rows, 44px targets, safe areas).

## Definition of done per lane
All screens in the lane × 2 appearances × assigned platforms, screenshotted and vision-checked (correct order, nothing
clipped, chrome consistent with the smoke shells, every nav element present and named). `/tmp/harso-sk/proto/lanes/<lane>/REPORT.md`
listing every screen id → frame id per page, plus the `link:` ids used. Final line `LANE_RESULT: …`. Never save the document.


## FIX WAVE — read before anything

Independent reviewers scored every screen (`/tmp/harso-sk/proto-review/macos.md` and `ios.md`: per-screen table, `## Below 8`,
`## Cross-cutting`). Bring every screen in your lane to ≥8 by fixing the NAMED defects, in BOTH appearances.
- Reviewer "NOT a defect" notes are binding. Illustrative data is fine; scaffolding copy ("Synthetic example", "Version shown is
  illustrative", "iOS prototype version", backend caveats) is NOT — replace with product copy.
- The lead already fixed the scrims globally (all 34 overlay scrims are now black 40%/60% so dark overlays darken). Do not
  re-tint them; if you rebuild an overlay screen, use `#00000066` (Light) / `#00000099` (Dark) for the scrim.
- Rebuild a screen by editing its generator, deleting the old frame (`page.layers.find(name===...).remove()`) and regenerating
  at the SAME x/y with the SAME `Screen/...` name. Keep every `link:<id>` name; add links for any restored affordance
  (e.g. Project tabs Instructions/Memory/Sources → self-links `link:project`; voice mic → `link:conversation`). The lead
  re-wires flows after your lane, so do not set flows yourself.
- After each screen: screenshot both appearances, vision-check against the reviewer's exact defect text, log in
  `/tmp/harso-sk/proto/lanes/<lane>/FIX-REPORT.md` (screen → defects → change → screenshot → your score). Never save.


## THIS LANE: `fix-ios` — pages Proto iOS Light / Proto iOS Dark

All 60 below-8 iOS screens in `/tmp/harso-sk/proto-review/ios.md`. Cross-cutting 1 (H): Dark filled buttons — primary uses the kit's inverse-ink pill (ink fill `#f2f3f5` with `inverse` text), destructive uses `negative` TEXT on `hover` fill or a `negative-mark` fill with dark ink text — never light text on bright blue/coral; fix at the shared button helper so every screen inherits. 2 (H): approval 'Always' → 'Always allow `npm test` in Personal'; plan sheet shows Monthly US$300 / Annual US$3,000 with currency + renewal line; Usage shows real numbers (tokens 32k/200k, requests 41/500) or an honest 'Not available yet'. 3 (H): artifacts--detail Preview and Code must be the SAME artifact (billing webhook migration note ↔ its code). 4: every root screen (home, activity, projects, recent, settings) and every sheet draws the 134×5 home indicator; replace the '●●● ▲ ▮' glyph string with three real glyphs (signal bars, wifi arc, battery) drawn as small shapes in the status bar — do this in the shared H.iosStatusBar in your own copy of the prelude and regenerate all screens. 5: search shows each result once; empty search has no blank trailing accessory; conversation copy 'I'll' fixed at the base so overlays inherit. 6: value rows get a chevron/disclosure; direct actions (Copy link, Sign out) get no chevron; paused routine rows and selectable profile rows use one consistent affordance; ActionSheet Cancel is a separate grouped button below the list. 7: replace prototype/backend copy; Activity distinguishes 'Running' from 'Waiting for approval'; no 'You're up to date' while an approval is pending; remove duplicate 'Personal' headings. Original generators: `/tmp/harso-sk/proto/lanes/ios-core/`, `ios-manage/`. Copy into `/tmp/harso-sk/proto/lanes/fix-ios/` and edit there. Use your own prelude copy at `/tmp/harso-sk/proto/lanes/fix-ios/prelude.js` (start from /tmp/harso-sk/proto/prelude.js) and export SK_PRELUDE to it.
