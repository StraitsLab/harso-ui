# Harso / Weave prototype — independent REVIEW brief

You are an independent product-design reviewer. Read-only. Judge Sketch screens of the Weave app prototype as a founder
would when clicking through it: "does this look like a finished, coherent app I'd ship?"

## Inputs
- `/tmp/harso-sk/proto-review/index.json`: 142 screens with `platform` (macos 1440×900 / ios 390×844), `appearance`
  (Light/Dark), `id`, `png`. Review ONLY the platform assigned to you.
- The shipped desktop app for reference (macOS lane): `/tmp/harso-sk/app-shots/<route>--light.png` / `--dark.png` for
  signin, new-conversation, conversation, activity, projects, project, recent, artifacts, routines, customize, search,
  settings. The prototype is a design-forward upgrade, not a pixel copy — but its screens must carry the same
  information, navigation and actions as the real one.
- Design authority: `/tmp/harso-sk/BRIEF.md` §Design direction (quiet, typographic, one accent, tonal surfaces, hairlines,
  radius 8 controls / 16–20 floating surfaces, indented separators). iOS screens must read as native iOS 27-era: 54px
  status bar, nav bar with centred title, floating pill tab bar on root screens only, sheets/action sheets/dialogs over a
  scrim, 44px targets, safe areas.

## Score per screen — strict
`Score: N/10`; 8 = ready to show, ≤1 minor nit. Dock hard for: chrome inconsistent with sibling screens (sidebar/tab bar/
nav differs), content clipped or spilling, empty/unfinished regions, missing information the real screen has, overlays
without scrim or not anchored to their trigger, unreadable contrast, dark screens with light artefacts, placeholder
text, obviously wrong copy for the screen. Do not dock for illustrative data, static states, or an overlay screen
repeating its base.
Use `vision_analyze`; zoom with `region` where text is small.

## Output `/tmp/harso-sk/proto-review/<lane>.md`
`| screen (platform/appearance/id) | score | defects |` one row each; `## Below 8` sorted by severity; `## Cross-cutting`
(the highest-value findings — patterns across screens); final `REVIEW_RESULT: <n> screens <n ≥8> <n <8>`.
