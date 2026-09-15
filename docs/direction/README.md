# Design direction — conversation screen (2026-09-15)

Abhi's verdict on Sketch v0.5 (`2df16c5`): "large improvement… not clean entirely" — inconsistent type sizes, mixed
radii, transcript reads unloaded, cluttered vs the approved concept (`../concept-approved-2026-09-06.png`).

Targets generated with gpt-image-2.5 (image edit) from the approved concept + the current screen, with the constraint
that every element of the current screen must survive (capability preserved, weight removed):

- `conversation-target-expanded-2026-09-15.png` — 240px sidebar. Capability audit: 20/21 elements kept (thumbs-down dropped).
- `conversation-target-collapsed-2026-09-15.png` — 56px icon-only rail, avatar at bottom, unread as a 5px dot. Closest to
  the approved concept; independent taste read 9.5/10.
- Prompts retained beside them (`prompt-*.txt`) so the renders are reproducible.

Spec to carry into the Sketch chrome helpers when this pass resumes (all 144 screens inherit):
borderless columns (tonal step, no rules, no toolbar underline); two shaded surfaces per screen (code/artifact + composer),
everything else quiet rows with a 5px dot; rail 56px icon-only / expanded 240px with a faint active tint and no badges;
context-usage ring 16px hairline beside its text (renders still show ~32px — set by hand); 1.5px monoline SF icons;
one type scale 11 caps / 13 chrome+meta / 14 body / 15 title; 8px rhythm. Status: **parked** ("fine for now").
