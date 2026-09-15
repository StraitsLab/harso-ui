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


## THIS LANE: `fix-macos` — pages Proto macOS Light / Proto macOS Dark

All 40 below-8 macOS screens in `/tmp/harso-sk/proto-review/macos.md`. Cross-cutting P1: restore shipped affordances — Project screen gets tabs Conversations / Work / Instructions / Memory / Sources / Working locations + inspector toggle + breadcrumb; Conversation composer gets the mic/voice button and the thread shows the Question (clarify) card and a linked Work review card; Search palette gets scope chips All/Projects/Conversations/Work/Routines and the 'Reasoning and raw logs are not searched' privacy line; Activity/Routines rows show where work runs/lands (workspace + project). P2: approval card shows the exact command in mono + working directory, and 'Always' reads 'Always allow `npm test` in Personal'. P3: Projects empty state has NO pinned project in the sidebar; Project Conversations tab shows only conversations; Voice row distinguishes preference from availability. V1: artifacts--detail single toolbar; conversation menu anchored 4px under its ⋯ trigger with NO full-window wash (menus are not modal — use no scrim); Search is never a blue primary — only the creation action is primary. C1: replace scaffolding copy; Security history rows get timestamps; routines get timezone + project routing; Devices gets permission-repair guidance. Also from lead's own check of `conversation`: normalise turn rhythm to 16px between turn parts and 24px between turns; inspector file rows 28px with file icons; header 20px semibold with a breadcrumb (Personal › Conversation) above; composer 24px from bottom, same width as thread column. Original generators: `/tmp/harso-sk/proto/lanes/mac-core/`, `mac-manage/`, `mac-settings/` (+ their frames.json). Copy into `/tmp/harso-sk/proto/lanes/fix-macos/` and edit there.
