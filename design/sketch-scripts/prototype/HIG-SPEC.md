# HIG spec — measured from Apple's macOS 27 / iOS 27 Sketch kits (not from memory)

Source: `SPEC …` instances on the `Apple reference` page (dump in `/tmp/harso-sk/apple-spec2.json`). Numbers are px at 1×.

## macOS 27 — window and chrome
| Element | Measured |
|---|---|
| Window with sidebar | Left pane **256** wide, `#fafafa` at 80% (vibrancy); right pane white. |
| Titlebar + unified toolbar | **52** tall over the content column; a `Scroll Edge Effect` blur band the same height sits under it (content scrolls beneath). |
| Traffic lights | sit in the sidebar's top 52px; three 12px circles at x = 20/40/60, y = 20 (kit renders them in the Left Pane). |
| Navigation ‹ › | a **73×36** capsule at x+8 with two 20px symbol buttons and a 1px separator between them, background black 25%. |
| Window title | **15/semibold (weight 9 = bold-ish)** title + **13** subtitle beneath, centred in the toolbar, with a 17px document symbol before it. |
| Toolbar buttons | **36×36** hit, 28×28 painted, SF symbols at 13pt inside; grouped buttons sit in a 147×36 group with 9px gaps. |
| Toolbar search field | **159×36**, magnifier symbol at x+10, placeholder 13/semibold. |
| Source list section header | **11/bold** uppercase-ish tertiary, 18px tall, 14px inset. |
| Source list row | **32** tall, 228 wide (14px inset both sides); disclosure 16px + symbol 20px + title **13/semibold**; trailing detail 36px slot. Nested level indents +12. |
| Selection | full-row 228-wide pill, radius 6 (source list uses accent tint on active window). |
| Alert (side by side) | **260×170**, icon 72×72 at (22,20), title **13/bold**, body **13/regular**, two **110×28** buttons at y 126, 8px gap; radius 10. |
| Push button Rg / Lg | **66×24 / 66×28**, label 13/semibold. |
| Pop-up button | 120×24, label 13/semibold, ⇅ symbol in a 24px cell at the trailing edge. |
| Search field (content) | 120×24, symbol 8px in, clear ⓧ 16px trailing. |
| Notification banner | **344×78**, radius 6 (kit) — HIG banners are radius 16 on 27, app icon 40, title 13/bold, body 13, "now" 11 tertiary. |
| Menu | 244 wide, rows 22, submenu offset -4/+? , separators inset. |
| Popover | radius **20**, arrow 19px. |
| Form rows (Settings) | labels **13/regular** right-aligned to a gutter, controls 24px tall, rows 24–28 with 8px gaps, group boxes radius 10. |

## iOS 27 — chrome
| Element | Measured |
|---|---|
| Tab bar | floating **346×62** capsule (in a 402-wide screen: x 21, y from bottom 16+62+home inset), background white 20% glass; tabs **66×54**, symbol **18/bold** + label **10/bold**; selected tab: 54-tall pill `#787880` 16% + white 50% inner shape. |
| List row | **52** tall, title **17/regular**, detail 17 tertiary, chevron **17/bold** 10px wide at the trailing edge, 16px margins; edit-mode minus circle 22px red `#ff383c`. |
| Grouped table view | 370 wide rows (16px insets), 52 tall. |
| Sheet (medium) | grabber **60×4** at y+5 centred; toolbar **70** tall with 44×44 leading/trailing buttons (symbols 17/semibold) and **17/bold** centred title; sheet radius 20ish, `#cccccc` 70% material. |
| Alert | **300×184**, title **17/bold**, message **17/regular**? no — 13 in HIG; kit measures 17/regular in a 44px block; buttons row 48 tall at y 122 (two side-by-side). |
| Action sheet | 260 wide, title 17/bold, message 15, stacked buttons in a 396px column. |
| Bordered prominent button (large) | **72×50** for "Play": 17/regular label, 20px horizontal padding → pill. |
| Text field | **288×52**, 17/semibold placeholder, 16px inset. |
| Toolbar search (48pt) | 346×48 field in a 56 band. |
| Menu | 250 wide, control group 57 tall at top, separator 21, items column. |

## Boundaryless → native mapping (decisions)
- Keep our tokens (canvas/panel/surface/ink/accent) and Inter for content; use **SF Pro for chrome text** (titles, sidebar, toolbar, tab bar, alerts) at the measured sizes so the app reads native.
- Use **real SF Symbols** (rendered as SF Pro text, exactly as Apple's kits do) for every affordance; Lucide stays only inside content components already in the kit.
- macOS: unified 52px toolbar with traffic lights, ‹ › capsule, centred title+subtitle, 36px symbol buttons, 159×36 search; 256px vibrancy source list with 32px rows, 11/bold section headers, disclosure triangles, inset selection; trailing 320px inspector as a split view with its own 52px header.
- iOS: large-title navigation on roots (34/bold) collapsing to 17/bold centred; inset-grouped lists 52px rows with 17pt text and chevrons; floating 346×62 tab bar with 18pt symbols; sheets with 60×4 grabber and 44px symbol buttons; native alerts 300 wide.
- Soul: one warm accent moment per screen (the sparkle mark, a tinted selection, a coloured status), real content density (no half-empty panes), authentic copy, and every action iconed.
