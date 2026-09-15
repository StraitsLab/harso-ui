# Boundaryless — the approved design direction (v3, ratified 2026-09-15)

Abhi: "we use this." This file is the authority for every Weave screen, on Sketch first and in code after.
Reference renders: `docs/direction/conversation-target-expanded-2026-09-15.png` and `-collapsed-`. Built spec: `sketch-scripts/prototype/lib-v3.js`.
Principle: **complete capability, minimal look** — nothing a screen needs is removed; visual weight is.

## Rules
1. Borderless. No 1px strokes on panels, cards, buttons, fields, chips. Columns separate by tonal step (panel vs surface). No rule under the toolbar. Hairlines only as inset separators inside a list.
2. Two shaded surfaces per screen: the artifact/code card and the composer. Everything else is a quiet row. User messages are a soft accent-tint bubble (the one exception).
3. State is a 5px dot (blue = running/AI, amber = needs you, grey = done). Rings are 16px hairlines. Badges 14px. One blue accent + one amber; positive/negative only as text colour.
4. One type scale: 11 caps labels (0.6 tracking) · 12 meta · 13 chrome · 14 body · 15 title · 22 display (the assistant's single editorial headline). SF Pro for chrome, Inter for content, never a fallback font.
5. Radii: 8 rows/buttons · 12 cards · 16 composer/bubbles · pill chips, segments, model selector. Nothing at 4/6/7/10.
6. Icons: monoline SF Symbols, weight 5, 16px (18 on iOS rows). Primary action = dark circular send / dark pill. Secondary = panel-tint pill. Tertiary = bare glyph.
7. macOS chrome: 240px source list (5% ink tint on the active row, no badges, gear beside the account) or 56px icon-only rail (14px count badge on Activity, avatar inset at the bottom); 52px unified toolbar; 320px inspector with caps sections 28px apart and quiet rows (changed files show muted "+184 lines added" under the path).
8. iOS chrome: HIG geometry (54/44/52 large title, 52px rows, 346×62 capsule tab bar over the home indicator); groups panel-tinted with inset hairlines; monoline grey glyphs, no coloured squircles; floating pill composer; sheets/alerts unchanged.
9. Density: calm — 24–28px between blocks, 40px between inspector sections — but no half-empty panes; empty states are sparkle + one line + one dark pill.

## Process
Sketch is the spec. Any new screen is generated on `prelude3.js`, screenshotted, and checked as a sibling of
`ref-v3-conversation.png`. Numeric vision scores are not a gate; a founder-eye defect hunt over contact sheets is, with
every claim zoomed before acting on it. Code implements what Sketch shows; the token contract in `src/theme.css` follows.
