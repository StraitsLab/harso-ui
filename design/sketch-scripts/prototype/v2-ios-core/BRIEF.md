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
## THIS LANE: `ios-core` — iOS only, both appearances (Light/Clean, Dark/Clean)

Flow group 0 (auth + home + chat): `signin` (no tab bar: `tab:false`; sparkle mark, title, Continue with Apple/Google (SocialButton), email + Continue; → `link:home`), `home` (tab 'home': greeting 'What can I help with?', composer card docked ABOVE the tab bar (phone Composer from kit), recent conversations list (row → `link:conversation`), project chip row), `conversation` (tab:false, nav back → link:back, title = conversation, trailing ⋯ → `link:conversation--menu`; thread from the kit's phone shell; composer docked above home indicator), `conversation--approval` (Sheet medium detent with approval card Allow once/Always/Deny; Deny → link:back), `conversation--menu` (ActionSheet: Rename/Duplicate/Move to project/Export/Delete(red)/Cancel; Delete → `link:conversation--delete`; Cancel → link:back), `conversation--delete` (Dialog destructive; Cancel → link:back), `search` (full-screen search: SearchField at top w/ cancel, grouped results; result → `link:conversation`; Cancel → link:back), `activity` (tab 'activity': work list rows with status chips; row → `link:activity--work`), `activity--work` (pushed detail, back → link:back: objective, attempt, plan steps, Steer/Cancel/Respond; Respond → `link:conversation--approval`).

Pages: `Proto iOS Light` / `Proto iOS Dark`. Use flow-group row y as given by your group number; x by screen index. Write one generator per screen parameterised by `var APP` and run it for both appearances. Keep scripts in `/tmp/harso-sk/proto/lanes/ios-core/`. Never touch other lanes' screens or the kit pages. Never save.
