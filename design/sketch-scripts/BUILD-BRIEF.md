# Harso Boundaryless — Sketch completion program (BRIEF)

You are building Sketch symbols for the Harso "Boundaryless" UI kit inside the OPEN document
`Harso Boundaryless.sketch` (document ID in `/tmp/harso-sk/doc.id`). Sketch only. No React/CSS work.

## How you talk to Sketch

- Client: `python3 /tmp/harso-sk/sk.py run_code '{"code_file":"/abs/path/script.js"}'` — runs a Sketch plugin
  script. It holds a cross-process lock, so parallel lanes are safe; keep each script < ~40 s of work
  (one sheet per script). Output is whatever the script `console.log`s (use `H.out({...})`).
- Screenshot: `SK_TAG=<name> python3 /tmp/harso-sk/sk.py get_screenshot '{"targetDocumentID":"<doc.id>","layerID":"<id>"}'`
  → prints `IMAGE /tmp/harso-sk/shots/<name>.png`. Then `vision_analyze` that PNG. ALWAYS screenshot
  and look before claiming a sheet is done; fix, re-shoot.
- Prelude `/tmp/harso-sk/lib.js` is auto-prepended to every script: you have `sketch`, `doc`, and
  `H.page(name)`, `H.sw(app, role)` (swatch reference colour), `H.hex(app, role)`, `H.alpha(hex, a)`,
  `H.frame({...})` (stack container), `H.text({...})`, `H.rect({...})`, `H.icon({parent, d: H.paths.search, size, color})`,
  `H.order(frame)`, `H.relayout(frame)`, `H.sheet({...})`, `H.row(parent, name, app, {...})`,
  `H.symbolize(root, /^Name\//)`, `H.paths.*` (Lucide path fragments; add more inline as SVG if needed).
  READ `/tmp/harso-sk/lib.js` first (it is short) and `/tmp/harso-sk/example-sheet.js` (a finished sheet).
- Sketch API pitfalls (each cost us a round-trip): stacks render index 0 LAST → build children in reading
  order, then `H.order(frame)`; `fontWeight` is 1–12 (5 regular, 6 medium, 7 semibold) — never 400/500;
  structural Frames paint a default fill (H.frame clears it); radius via `style.corners.radii`;
  `H.symbolize` promotes frames in place — do it LAST, once per sheet, and never re-run on a sheet that
  already has symbols (name collision). Text width: pass `w` for fixed-width labels that must not grow.
  `H.frame({h})` makes fixed height; omit `h` for hug. Fill for layout-only frames must stay empty.

## Appearances and tokens

Four appearances exist as swatches: `Light/Clean`, `Light/Cozy`, `Dark/Clean`, `Dark/Cozy`. Roles:
`canvas canvas-deep panel surface hover ink secondary tertiary faint line line-strong accent accent-mark
accent-soft positive positive-mark attention attention-mark negative negative-mark inverse control-line`.
Semantic split: `positive` etc. is TEXT-safe; `positive-mark` is the bright shade for dots/bars only.
`--hk-dark` (primary pill fill) = `ink`; its text = `inverse`. Build every symbol for ALL FOUR appearances
by looping `['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']` — one sheet per appearance per group.

Type: Inter; sizes 12/13/14/15/16/20/24; mono JetBrains Mono 13. Controls: 36px tall, radius 8,
padding 6/14, 14px weight 6 label; small 28px/12px; icon 16px stroke 2. Chips pill radius 999, 12px
weight 6, padding 4/8. Cards radius 12, `surface` fill, 1px `line` border. Hairlines 1px `line`.
Menus/popovers: `surface` + `line`, radius 12, 6px padding, rows 32px radius 6, `hover` on selected.
Shadow (popovers/dialogs only): `{color:'#0000001f', blur:24, spread:0, x:0, y:8}`.

## Design direction (lead decision — apply, do not re-litigate)

Boundaryless stays primary: quiet, typographic, one blue accent + amber/green/red as semantic text,
dark pill primary, tonal surface steps, low-contrast hairlines, 4/8 grid. From Apple's iOS 27 / macOS 27
kits we adopt these traits (verified on `Apple reference` page, board `78DC31C3-…`):
1. Indented separators — list/menu dividers start at the text margin, not edge-to-edge.
2. Large surfaces (sheets, dialogs, popovers, notifications) use radius 16–20; controls keep 8; chips pill.
3. Selection = tonal pill (`hover` wash, radius 6) not filled blocks; sidebars inset the pill 8px from the edge.
4. Pop-up (⇅ chevrons-up-down, persistent choice) vs pull-down (⌄, actions) are distinct glyphs.
5. Menu shortcuts right-aligned as glyph groups (⌘⇧K), section headers 12px `tertiary`, separators inset.
6. Steppers embedded inside numeric fields; disclosure chevron rotates; determinate circular progress.
7. Two-column form rows: 13px `secondary` label left, control right, 32px row rhythm.
8. Notification banner: 16px radius, 32px app glyph, title 14/6, body 13 `secondary`, time 12 `tertiary`.
9. One ambient shadow only on floating layers; NEVER glass/blur (we are flat).
10. Icons sized to cap height (16px in 14px text rows; 14px in 12px chips).
Do NOT copy Apple colours, SF glyph style, or pill-everything. Our accent is `accent` swatch, not #007AFF.

## Naming (maps 1:1 to kit classes)

`<Family>/<Appearance>/<variant>/<state>` e.g. `Button/Dark/Cozy/primary/hover`, `Menu/Light/Clean/default`,
`Sidebar/Light/Clean/item/selected`. Family names are the kit family slug in PascalCase. Put each family's
specimens in a sheet named `<Group> — <Appearance>` on the page named for the group (below). Symbol
frames are the ONLY things named with a `/`; helper layers inside are plain names (`label`, `icon`, `mark`).

## Definition of done per lane

- Every family in the lane × 4 appearances, all listed variants/states, promoted to symbols.
- Each sheet screenshotted and vision-checked: correct order, no default fills, no truncation, icons crisp,
  text on correct colour, dark sheets dark. Fix and re-shoot until clean.
- Write `/tmp/harso-sk/lanes/<lane>/REPORT.md`: sheet IDs, symbol count, screenshots paths, defects fixed,
  anything you could not build (with why). Do not save the document (lead saves). Do not touch sheets on
  other lanes' pages. Do not create swatches/text styles.
