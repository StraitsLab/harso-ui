# Harso / Weave — prototype v2: NATIVE macOS 27 / iOS 27 rebuild BRIEF

The v1 prototype (142 screens) was judged "not top quality": not benchmarked to Apple, generic X/close marks instead of
system affordances, missing icons, and no soul. v2 rebuilds EVERY screen on measured native chrome with real SF Symbols.
Read `/tmp/harso-sk/proto/HIG-SPEC.md` first — the numbers came from Apple's own macOS 27 / iOS 27 Sketch kits.

## Tooling
- `export SK_PRELUDE=/tmp/harso-sk/proto/prelude2.js` (kit helpers + v2 native chrome + SF Symbols). Run scripts with
  `python3 /tmp/harso-sk/sk.py run_code '{"code_file":"/abs/script.js"}'`; screenshot with
  `SK_TAG=name python3 /tmp/harso-sk/sk.py get_screenshot '{"targetDocumentID":"<doc.id>","layerID":"<id>"}'` (doc id in
  `/tmp/harso-sk/doc.id`) → `vision_analyze`. Never save the document. Never touch pages other than your own.
- READ these before writing a line: `/tmp/harso-sk/proto/lib-native.js` (the chrome you MUST use), `lib-sf.js` (the
  SF Symbol names available — use ONLY names in `H.SF`; anything else throws), `smoke3.js` (macOS conversation, the
  reference build → `/tmp/harso-sk/proto/ref-mac-conversation-v2.png`) and `smoke4.js` (iOS settings / alert / sheet →
  `ref-ios-v2.png`). Your screens must look like those references' chrome, exactly.

## The chrome (never hand-draw these; call the helpers)
macOS: `var w = H.macWindow(screen, APP, { active:'<sidebar id>', title, subtitle, tools:[[name, glyph], [name, glyph, 'Label', primary?]],
search:true|false, inspector:'Title'|false, inspectorToggle:'<link id>', inspectorClose:'<link id>', activityCount })` → build content in
`w.main` (column stack, 28px pad; set `w.main.stackLayout.padding/alignItems` if needed); inspector content goes in a frame you
add to `w.inspector`; call `w.finish()` LAST. Overlays: `H.macScrim(screen, APP)` then `H.macAlert(screen, APP, {title, body,
glyph, tone:'danger'?, buttons:[[link, label, 'primary'|'danger'|'secondary']]})` or your own panel (menus/popovers/sheets) —
placed after `w.finish()`, positioned absolutely, `.moveToFront()`.
iOS: `var r = H.iosScreen({page, app, id, x, y, title, large:true|false, back:'Label'|true, leading:'glyph', trailing:[[link, glyph] | [link, glyph, 'Label', bold?]],
tab:'home'|…|false, gap, pad})` → build in `r.body` (DO NOT call H.order on r.body — finish() does), `r.finish()` LAST.
Lists: `H.iosGroup(parent, app, [{link, glyph, tint, title, sub, detail, chevron:false?, toggle:true|false, destructive}], {header, footer})`.
Overlays (after finish): `H.iosAlert(screen, app, {title, body, buttons:[[link,label,'bold'|'danger']]})`,
`var sh = H.iosSheet(screen, app, {title, cancelLink, done:'Create', doneLink, h})` → fill `sh.body` → `sh.finish()`.
Chrome text = `H.sft` (SF Pro at HIG sizes); content text = `H.text` (Inter). Symbols = `H.sf(parent, name, {size, weight, color, w})`.

## Rules that decide the score
1. **Native geometry**: macOS 256 source list + 52 toolbar + optional 320 inspector; iOS 54 status + 44 nav (+52 large title)
   + inset-grouped lists (52 rows) + 346×62 floating tab bar over the home indicator. Content must leave ≥100px clear above
   the tab bar (body is clipped; put a spacer or design to fit). Every screen exactly 1440×900 / 390×844.
2. **Every affordance is an SF Symbol** from `H.SF`. Close = `xmark` in a 28px circle only in popovers/sheets where Apple uses
   it; dialogs use buttons, sheets use Cancel/Done, windows use traffic lights. No text "X", no "Close" links, no Lucide glyph in chrome.
3. **Real content**: real conversation copy (engineering, product, finance — like the reference), real file paths, real
   numbers (tokens, minutes, counts, prices with currency and renewal date), real names (Abhi Bansal, Straits Lab, Weave
   Cloud). No "Lorem", "Sample", "Synthetic", "illustrative", "Setup incomplete".
4. **Soul**: one warm accent moment per screen (sparkle mark on empty states, tinted selection, coloured status dot,
   accent squircle icons in iOS groups), density like Mail/Notes (no half-empty panes; a pane with <3 items gets an empty
   state with a symbol + one-line explanation + one action), consistent 8px rhythm, section headers 11/bold (mac) or 13
   uppercase (iOS), inset separators.
5. **Overlays own their screen** (`<base>--<overlay>`): draw the base first, then scrim (black 40/60%), then the overlay
   anchored to its trigger (menus under the ⋯ button, popovers with arrow, sheets from the bottom, alerts centred).
6. **Links**: same contract as v1 — every clickable is `link:<id>` / `link:back`; the chrome helpers already emit the nav
   links. Dialog primary → target screen; Cancel → `link:back`.

## Process per screen
Build Light → screenshot → vision_analyze with the question "vs Apple Mail/Notes/Settings: every defect with px; score
1-10" → fix until ≥8 → then Dark (same generator, `var APP`). Keep generators in your lane folder. Delete v1 screens on your
page for the ids you own (`page.layers` named `Screen/<platform>/<App>/<id>` and their captions `caption/*/<id>`) before
building, so ids stay unique. Place v2 at the same grid (x = index × (w+120), y = group × (h+160)).

## Definition of done
All ids in your SCOPE.md × 2 appearances, each ≥8 by vision against Apple, `REPORT.md` with id → frame id and scores,
final line `LANE_RESULT: …`. Never save.


## v3 — the APPROVED DIRECTION (supersedes v2 chrome rules where they conflict)

Abhi approved two renders as the design target: `/tmp/harso-sk/render/reimagine-c.png` (expanded sidebar) and
`/tmp/harso-sk/render/reimagine-collapsed.png` (collapsed rail). Look at both with vision_analyze before building. The rule
he gave: **complete capability, minimal look** — every element a screen needs stays; visual weight goes.

Chrome is now `lib-v3.js` (concatenated last in `SK_PRELUDE=/tmp/harso-sk/proto/prelude3.js`; it overrides the v2 helpers of
the same names). READ IT. The reference build is `/tmp/harso-sk/proto/smoke5.js` → `ref-v3-conversation.png` and
`ref-v3-conversation-rail.png` — your screens must look like siblings of those.

Rules (enforced by review):
1. **Borderless.** No 1px borders on panels, cards, buttons, fields, chips. Columns separate by tonal step only
   (`panel` sidebar/inspector, `surface` content); no rule under the toolbar. Hairlines appear ONLY as inset separators
   inside a list (`H.iosGroup` does this) — never around anything.
2. **Two shaded surfaces per screen**: the artifact/code card (`H.codeCard`) and the composer (`H.composer` /
   `H.iosComposer`). Everything else is a quiet row (`H.quietRow`, `H.runRow`) with a 5px dot (`H.dot`) for state.
   User messages are a soft `accent-soft` bubble (that is the one exception). Empty states: sparkle + one line + one
   dark pill action, no card.
3. **Type scale `H.T`**: 11 caps labels (`H.caps`), 12 meta, 13 chrome, 14 body, 15 title, 22 display (the assistant's
   one editorial headline). Nothing else. Chrome = `H.sft` (SF Pro), content = `H.text` (Inter). Never Helvetica.
4. **Radii `H.R`**: 8 rows/buttons, 12 cards, 16 composer/bubbles, pill chips/segments. Nothing at 4/6/7/10.
5. **Icons**: `H.sfg` (monoline, weight 5, 16px; 18 on iOS rows). Only `H.SF` names. Dark circular send.
6. **Indicators tiny**: dots 5px, rings 16px (`H.ring`), badges 14px. One blue (`accent`) + one amber
   (`attention-mark`); positive/negative only in text.
7. **Sidebar**: `H.macWindow(screen, APP, {rail:false|true, ...})`. Every macOS screen exists ONLY in the expanded 240 form
   except `conversation` and `activity--work`, which ALSO get a `--rail` twin (`conversation--rail`,
   `activity--work--rail`) reached from the sidebar collapse button (`collapseLink`) — wire: collapse → `--rail`, rail's
   toolbar `link:back` → expanded. Active row = 5% ink tint, no badges (rail shows a 14px count badge on Activity).
8. **Density**: calm — 24–28px between blocks, 40px between inspector sections; but no half-empty panes.
9. **Inspector**: `H.inspBody` + `H.inspSection` + `H.quietRow`; changed files show muted '+184 lines added' as meta
   under the path, not coloured trailing counts.
10. iOS: same rules through `H.iosGroup` (panel-tinted groups, no borders), `H.iosTabBar` (no border), `H.iosComposer`,
    `H.iosSheet`/`H.iosAlert` unchanged. Native chrome geometry from HIG-SPEC stays.

Process: delete the v2 screen with the same id on your page, regenerate on prelude3, screenshot, and ask vision:
"Compare to /tmp/harso-sk/proto/ref-v3-conversation.png as a sibling screen: list borders, extra shaded surfaces, off-scale
type, off-system radii, oversized indicators, clutter — with px" → fix until the list is empty. Never save.


## SCOPE (ids you own; v2 generators for reference live in /tmp/harso-sk/proto/lanes/v2-ios-manage/)
## THIS LANE: `ios-manage` — iOS only, both appearances (Light/Clean, Dark/Clean)

Flow group 1 (projects + library + settings): `projects` (tab 'projects': grouped list of project rows with chevrons; row → `link:project`; nav trailing + → `link:projects--new`), `projects--new` (Sheet: name field + Create; Cancel → link:back), `project` (pushed, back: header, segmented Conversations/Work, list; row → `link:conversation`), `recent` (tab 'recent': Today/Yesterday grouped rows w/ swipe-action state on one row (delete red); row → `link:conversation`), `artifacts` (pushed from home 'Artifacts' tile or nav; grid 2-col cards; card → `link:artifacts--detail`), `artifacts--detail` (back; preview with tabs Preview/Code; share trailing), `routines` (list rows w/ schedule + paused chip; trailing + → `link:routines--new`), `routines--new` (Sheet form), `customize` (GroupBox sections Profiles (rows with checkmark on General) / Skills (rows with switches)), `settings` (tab 'settings': GroupBox grouped rows in iOS Settings style: Account (avatar row), Devices, General, Appearance, Voice & Live, Notifications, Connections, Usage & Billing, Data & Privacy, Shortcuts, About; each row `link:settings-<cat>`), and pushed detail screens `settings-account` (email, Sign out red row → `link:settings--sign-out`), `settings-devices`, `settings-general`, `settings-appearance` (Theme segmented, switches), `settings-voice`, `settings-notifications`, `settings-connections`, `settings-billing` (plan + Choose plan → `link:settings-billing--plan`), `settings-privacy`, `settings-shortcuts`, `settings-about`; overlays `settings--sign-out` (ActionSheet Sign out (red)/Cancel; Sign out → `link:signin`), `settings-billing--plan` (Sheet Monthly/Annual).

Pages: `Proto iOS Light` / `Proto iOS Dark`. Use flow-group row y as given by your group number; x by screen index. Write one generator per screen parameterised by `var APP` and run it for both appearances. Keep scripts in `/tmp/harso-sk/proto/lanes/ios-manage/`. Never touch other lanes' screens or the kit pages. Never save.
