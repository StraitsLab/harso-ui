from pathlib import Path
import json
p=Path('/tmp/harso-sk/lanes/ai-voice-workflow');a=json.loads((p/'audit.json').read_text())['sheets'];d=json.loads((p/'ledger.json').read_text());fs=json.loads((p/'families.json').read_text());apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
assert len(a)==60 and sum(len(s['symbols']) for s in a)==104
for app in apps:
 rows=sorted([s for s in a if s['name'].endswith(' — '+app)],key=lambda s:s['y'])
 assert len(rows)==15
 for left,right in zip(rows,rows[1:]):assert right['y']==left['y']+left['h']+80
assert all(Path(s['shot']).exists() for s in d)
summary='''## Summary
- Built 15 families × 4 appearances: **60 sheets, 104 unique symbols**, on `AI Voice & Workflow` only.
- All 60 sheets screenshotted and vision-checked, including both Cozy appearances. Corrected contrast and canvas connections were re-shot and rechecked.
- Verified appearance columns at x = 0 / 1600 / 3200 / 4800, 80px inter-family gaps, and four editable 1024×640 node canvases.
- Created 15 APP-parameterized family scripts, helpers, ledger, audit evidence, contact sheets, and this progressive report under `/tmp/harso-sk/lanes/ai-voice-workflow/`; screenshots are `/tmp/harso-sk/shots/avw-*.png`.
- No document save, swatch creation, text-style creation, or other-page edits performed.
'''
notes='''
## Verification and fixes
- Reference anchors: `references-0.png`, `references-1.png`, `references-2.png` reviewed before building; fixture source read from `catalogue-workflow-voice.tsx` and `selectors-examples.tsx`.
- Scope precedence: the lane's explicit product specifications supersede older rendered fixture structure (Maya persona card rather than 3D renderer gallery; 3-node canvas rather than 2; voice-card grid; top workflow toolbar; image-generation placeholder; Open in Weave wording).
- Vision evidence: `check-<Family>.png` contains all four exact per-sheet captures for each family. All families passed final visible clipping/order/legibility checks. Canvas montage downsampling produced a false endpoint concern; full-resolution Light/Clean and Dark/Clean crops confirmed exact circle attachment and readable text. Cozy uses the identical verified geometry and its own swatches.
- Fixed Sketch auto-centering during stack growth: restored all sheet positions after relayout; audit proves no sheet overlap and 80px gaps. Generator footer now restores x/y after symbolization.
- Fixed canvas edges from guessed bounding-box anchors to actual post-layout Input/Output circle coordinates. Eight connections verified across four canvases. A repair probe initially matched only `work unit`, missing Sketch auto-suffixed names; changed to prefix matching, repaired successfully, then re-shot.
- Strengthened 12px port outlines, inactive waveform bars, input-level labels/segments, and control glyph contrast using existing swatches. All touched sheets re-shot and vision-checked.
- Image shimmer is an editable static loading-state representation, not animation. Symbols are visual kit assets, not interactive playback/workflow implementations.
- Reproduction: use family generators only for absent sheets (guarded against duplication). `fix.js` and `final-audit.js` encode post-build refinements; do not rerun the non-idempotent edge patch on already-refined sheets. Prefer targeted ID edits for further changes.
- Final readback: page `241513C9-F5B9-4B7B-9B33-9C05A419D2EC`; 60 sheets; 104 SymbolMasters / 104 unique names; eight port-bound edges. `audit.json` preserves exact names, positions and symbol inventories.
- Remaining blockers: none. Document intentionally left unsaved for lead.

LANE_RESULT: done — 60 sheets / 104 unique symbols built, all four appearances vision-checked, final layout and canvas connections verified; left unsaved.
'''
old=(p/'REPORT.md').read_text();(p/'REPORT.md').write_text(summary+old+notes)
print(summary+notes.split('\nLANE_RESULT:')[1].join(['LANE_RESULT:','']) if False else summary+'\n'+notes.splitlines()[-1])
