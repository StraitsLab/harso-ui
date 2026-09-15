# Harso / Weave prototype v2 — independent REVIEW brief (vs Apple, FULL scale)

You are an independent product-design reviewer judging Sketch screens of the Weave app prototype against Apple's own
apps on macOS 27 / iOS 27 (Mail, Notes, Finder, System Settings, Messages, Files). Read-only: never modify Sketch or the
PNGs. Your output is a report the lead uses to cut fix lanes, so precision beats volume.

## Inputs
- `/tmp/harso-sk/proto-review/index.json` — every screen: platform, appearance, id, frame id, png.
- `/tmp/harso-sk/proto/HIG-SPEC.md` — the numbers measured from Apple's macOS 27 / iOS 27 Sketch kits. THIS is the
  benchmark for geometry: 256 source list, 52 unified toolbar, 32 sidebar rows; iOS 54 status, 44 nav (+52 large title),
  52 grouped rows, **346×62 floating capsule tab bar over the home indicator (this IS the iOS 27 tab bar — do not
  penalise it as "non-standard" vs the old edge-to-edge UITabBar)**, 60×4 grabber, 270 alerts.
- Design constraints that are deliberate, not defects: flat surfaces without vibrancy blur (a Sketch export cannot show
  NSVisualEffectView; judge structure, not material), one accent colour, Inter for content text with SF Pro for chrome.

## Scale — USE THE FULL 1–10 RANGE. Do not compress to 3–7.
10 = a screenshot of Apple's own app; 9 = indistinguishable to a designer at a glance; 8 = native, finished, one nit;
7 = native but visibly unfinished in one area; 6 = mixed native/web cues; ≤5 = wireframe-like, broken, tofu, clipped.
A screen with ZERO defects you can name must score ≥8. If you score <8 you MUST name the defect with px and the Apple
app it fails against.

## What to judge, per screen
1. Native chrome geometry vs HIG-SPEC (measure the png).
2. Affordances: every action an SF Symbol or native control; no "X"/"Close" text, no Lucide-style strokes in chrome,
   no tofu boxes.
3. Content truth: real names/paths/numbers, no scaffold copy ("Sample", "illustrative", "Setup incomplete", "Lorem").
4. Soul: an accent moment, density like Apple's apps (no half-empty panes without an empty state), 8px rhythm,
   consistent hierarchy, section headers, inset separators.
5. Overlay screens: scrim darkens, overlay anchored to its trigger (menus under ⋯, sheets from bottom, alerts centred).

## Output → `/tmp/harso-sk/proto-review/<lane>.md`
- Table: id | appearance | score | defects (px + Apple reference) — every screen in your lane, one row each.
- "Below 8" list sorted by severity with the exact fix.
- Cross-cutting findings (things to fix once in a helper).
- Final line: `REVIEW_RESULT: <n>/<total> ≥8`.
Use vision_analyze on every PNG individually (zoom with region for chrome). Verify the count matches index.json.
