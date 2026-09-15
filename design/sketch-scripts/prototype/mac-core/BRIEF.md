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


## THIS LANE: `mac-core` — macOS only, both appearances (Light/Clean, Dark/Clean)

Flow group 0 (auth + home): `signin` (auth card: sparkle mark, 'Sign in to Weave', Continue with Apple / Google buttons, email input + Continue; links: Apple/Google/Continue → `link:new-conversation`), `new-conversation` (heading centred 'What can I help with?', composer card 620 wide with + / model pill / send, project select below, 'Nothing is created until you send' caption; send → `link:conversation`), `conversation` (thread: user turn, reasoning row, tool row, assistant markdown w/ plan + code block, message actions; right inspector 320 with Context/Files/usage ring; composer; header title + ⋯ → `link:conversation--menu`), `conversation--approval` (approval card overlay 'Run npm test in the project workspace' Allow once/Always/Deny; Deny → link:back), `conversation--menu` (⋯ menu from the kit Menu symbol; items Rename/Duplicate/Move to project/Export/Delete; Delete → `link:conversation--delete`), `conversation--delete` (destructive Dialog 'Delete this conversation?'; Cancel → link:back), `search` (CommandPalette overlay over new-conversation: query 'ledger', grouped results Projects/Conversations/Work with kbd hints; a result → `link:conversation`), `activity` (list of work units: 'Prepare the release' running with plan 1/3 + pending approval chip, a completed one, a failed one; row → `link:activity--work`), `activity--work` (activity with right work inspector open: objective, attempt status, plan steps, Steer/Cancel/Respond buttons; Respond → `link:conversation--approval`).

Pages: `Proto macOS Light` / `Proto macOS Dark`. Use flow-group row y as given by your group number; x by screen index. Write one generator per screen parameterised by `var APP` and run it for both appearances. Keep scripts in `/tmp/harso-sk/proto/lanes/mac-core/`. Never touch other lanes' screens or the kit pages. Never save.
