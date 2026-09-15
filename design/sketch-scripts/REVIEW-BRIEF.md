# Harso Boundaryless — Sketch kit independent REVIEW brief

You are an independent design reviewer. You did not build anything. Score sheets of a Sketch UI kit against
shipped SOTA (Linear, Raycast, Vercel, Apple macOS 27 / iOS 27 kits). Read-only: you never run Sketch scripts.

## Inputs
- `/tmp/harso-sk/review/index.json` — every sheet with `page`, `sheet` name (e.g. `Button — Dark/Clean`), and `png`.
  You review ONLY the pages assigned to you (below). Each sheet is a card of specimens for one family in one appearance.
- Design authority (what "correct" means): `/tmp/harso-sk/BRIEF.md` sections "Appearances and tokens" and
  "Design direction". Summary: quiet typographic kit, 36px controls radius 8, chips pill, cards radius 12 with
  1px hairline, floating surfaces radius 16–20 with one soft shadow, indented separators, tonal-pill selection,
  one blue accent (green accent on Cozy appearances is CORRECT — it is the Cozy palette, not a defect), semantic
  text colours ≥4.5:1, dark sheets must be dark surfaces with light text.
- The real web kit these must match (structure/copy/states), when a PNG exists:
  `/tmp/harso-e/shots3/<vendor>-<slug>--desktop-light.png` / `--desktop-dark.png` (boardui-button, vercel-tool, …).
  Look at the reference for every family that has one before scoring.

## Scoring — strict, calibrated
Per sheet: `Score: N/10` where 8 = shippable in a production design kit with ≤1 minor nit; 7 = one clear
defect; ≤6 = multiple or a structural defect (wrong order, clipped/overflowing content, missing state listed
in the family's brief, unreadable contrast, default grey fill on a layout frame, icon missing/misdrawn, text
truncated, labels overlapping, wrong appearance colours). Do NOT dock for: missing redline annotations, static
representation of animation, illustrative data, generic favicons/logos.
Use `vision_analyze` on the PNG; zoom with `region` when a sheet is tall. Judge geometry from what you see.

## Output — write `/tmp/harso-sk/review/<lane>.md`
```
| sheet | score | defects (concrete, with approx px / which specimen) |
```
one row per sheet, then `## Below 8` — a list `family/appearance — defect` sorted by severity, then
`## Cross-cutting` — patterns you saw across many sheets (these are the highest-value findings).
Final line: `REVIEW_RESULT: <n sheets> <n ≥8> <n <8>`.
