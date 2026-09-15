import json,pathlib
from PIL import Image
p=pathlib.Path('/tmp/harso-sk/proto/lanes/fix2-macos')
a=[x for x in json.load(open('/tmp/harso-sk/proto-review/index.json')) if x['platform']=='macos']
old={(x['id'],x['appearance']):x for x in json.load(open('/tmp/harso-sk/proto-review/macos-partial-ledger.json'))}
ex={(x['id'],x['appearance']):x for x in map(json.loads,(p/'exports.jsonl').read_text().splitlines())}
light={'projects':6.5,'new-conversation':6.8,'artifacts--empty':6,'artifacts--detail':7,'customize--profile':7,'signin':7,'conversation':7,'conversation--approval':6.8,'conversation--menu':6.8,'project':6,'settings':6.5,'settings-account':6.7,'settings-devices':7,'settings-general':7,'settings-appearance':7,'settings-voice':6.6,'settings-notifications':7,'settings-connections':7,'settings-billing':7,'settings-privacy':7,'settings-shortcuts':6.8,'settings-about':6.8,'settings--sign-out':7,'settings-billing--plan':7,'conversation--delete':6.8,'search':6.8,'activity':6.9,'activity--work':6.8}
dark={'projects':6.8,'projects--empty':7,'project':7.2,'recent':7,'settings':7,'settings-account':6.8,'artifacts':7,'settings-devices':7,'settings-general':6.8,'artifacts--empty':6.8,'settings-appearance':6.8,'settings-voice':6.7,'artifacts--detail':7,'settings-notifications':6.8,'settings-connections':6.8,'routines':6.8,'settings-billing':6.5,'settings-privacy':6.8,'routines--new':7,'settings-shortcuts':6.5,'settings-about':7,'customize':6.8,'settings--sign-out':6.8,'customize--profile':7,'settings-billing--plan':7,'signin':7,'new-conversation':6.8,'conversation':6.8,'conversation--approval':6.8,'conversation--menu':7,'conversation--delete':6.8,'search':6.8,'activity':6.9,'activity--work':7}
notes={'signin':'Email reduced 36→24; all sign-in buttons 28. Live readback disproves reviewer claim of 32px primary; 16px stack gaps verified. Remaining review alleges 1–2px optical nits.','customize--profile':'Wrong overlapping-window glyph replaced with 14px unchecked checkbox. Vision confirms no clipping/overlap and uniform 24px fields. Recalibration still returned 7. Labels 120px, gap12 verified.','conversation--menu':'Menu x768 width244: right1012 = trigger right1020 minus8. Share/Export visually distinct, verified in both fresh images. Review still penalizes permitted flat materials.','settings-appearance':'All 10 label widths200; all controls x216; all rows28 in both appearances. Claimed group-gutter variance disproven by geometry.json.','projects':'Input text vertically centered in24px field. Fresh Dark vision confirms baseline. Remaining complaints target intentional inline creation.','artifacts--detail':'Live sheet y52; live popover-arrow exists at1080,120 (14×14). Reviewer missing-arrow/floating-sheet claims contradicted by layer readback.','new-conversation':'Recent sidebar long labels now single-line; fresh vision confirms. Remaining complaints target duplicate search and permitted flat material.','settings--sign-out':'Fresh Light review calls fully finished, defect-free but returns compressed7. Centered alert is explicitly required.','settings-billing--plan':'Live y52 and fresh Light review confirm attachment. Fresh review calls defect-free yet compressed7.','conversation--delete':'Fresh Light review reports zero major and minor pixel defects; score6.8 explicitly compressed.','activity--work':'Fresh Light review reports zero pixel defects; score6.8 explicitly compressed.'}
rows=[]
for x in a:
 k=x['id'],x['appearance']; scores=light if x['appearance']=='Light' else dark
 inherited=x['id'] not in scores
 score=old[k]['score'] if inherited else scores[x['id']]
 assert score is not None
 png=ex[k]['png'] if k in ex else x['png']; im=Image.open(png);im.load();assert im.size==(1440,900)
 rows.append(dict(x,png=png,score=score,source='prior independent review (unchanged)' if inherited else 'wave2 individual vision, raw score',changes=ex.get(k,{}).get('changes',[]),note=notes.get(x['id'],'Prior accepted review retained; unchanged.' if inherited else 'Individual full-frame review succeeded. Raw score retained; provider repeatedly asserts compressed scale despite full-scale prompt. See calibration blocker.')))
assert len(rows)==68 and len({(x['id'],x['appearance']) for x in rows})==68
(p/'final-ledger.json').write_text(json.dumps(rows,indent=2))
passed=sum(x['score']>=8 for x in rows)
text='''# macOS fix wave 2 — repairs verified; score gate BLOCKED

## Outcome

All 68 entries have an individual-image review (6 unchanged Light scores carried from the supplied independent review; 62 reviewed/rescored in this wave). All 34 Dark images were individually reviewed. All 50 changed screens were re-exported through Sketch and individually reviewed again. Every final image decoded at 1440×900. Live document readback has exactly 34 Light + 34 Dark screens, original frame IDs preserved. **Never saved.**

**The ≥8 acceptance gate is NOT achieved.** The vision backend repeatedly and explicitly applies a “compressed toward center” scale, including when it reports zero defects. Prompts supplied the exact full 1–10 rubric, and a targeted correction/crop retry still returned7. Raw scores below are NOT silently remapped to8. This is a calibration blocker, not evidence that every compliant screen should be redesigned. Initial 503s on Shortcuts, General and Voice recovered after20s delayed retries. No missing images are given invented scores.

## Applied surgical repairs

- Both appearances: sign-in email36→24px; sign-in buttons28px. Traffic-light x20 was already correct, so preserved.
- Both appearances: conversation menu right edge aligned to ellipsis trigger right minus8; final menu x768,width244.
- Both appearances: profile Send email icon corrected from overlapping-window glyph to unchecked native rounded-square checkbox14×14.
- Both appearances: project-creation input text vertically centered in24px field.
- Core + Settings screens: long Recent sidebar labels shortened consistently to single lines, preserving routing and all screen IDs.
- Lead's Export glyph preserved; fresh Light/Dark menu vision identifies Share and Export as distinct SF Symbols.

## Confirmed false positives — do not blindly change these

- Appearance: every one of10 rows uses label width200 and control x216, row28. No inter-group gutter variance. `geometry.json` contains exact per-child measurements.
- Profile: Name/Model controls24 high, Description76 high; label120 and gap12. Fresh vision explicitly confirmed uniform fields and no overlaps.
- Artifact detail: sheet y52; existing popover arrow14×14 at1080,120. Review repeatedly alleged absence despite live presence.
- Sign-in: every button28 and email24; provider's claimed32px primary is false. Footer/control stack gap16, not claimed13.
- Reviewer repeatedly penalized deliberately permitted flat materials, Inter, and required centered alerts; also compared to Sonoma/Ventura rather than supplied macOS27 kit.

## Per-screen final raw scores

| id | appearance | raw score | evidence / disposition |
|---|---|---:|---|
'''
for x in rows:text+=f"| {x['id']} | {x['appearance']} | {x['score']} | {x['source']}; {x['note']} |\n"
text+='''
## Remaining

Obtain a rubric-compliant independent visual scorer (or human adjudication) before declaring every screen ≥8. Retain raw findings for actual verification; do not use provider scores as a reason to destroy correctly measured native chrome. Minor optical allegations remain unconfirmed where the provider contradicts its own full-frame geometry. No claim that every below8 raw output has been fixed into a passing score.

## Artifacts and replay

- `fix-native.js`: lane-scoped in-place repair (no save).
- `fix-result.txt`: changed-frame ledger.
- `export.py`, `exports.jsonl`: 50 fresh MCP screenshots under `/tmp/harso-sk/shots/fix2-macos-*`.
- `probe.js`, `probe.jsonl`, `probe-parsed.json`: before-state evidence.
- `verify.js`, `verified.txt`, `geometry.js`, `geometry.json`: readback evidence.
- `final-ledger.json`: all68 final score/source/frame/image records.
- `report.py`: count/dimension validation and report generation.

'''
text+=f'LANE_RESULT: BLOCKED — 68/68 reviewed, 50/50 changed screens re-shot and re-reviewed; {passed}/68 raw scores ≥8; vision full-scale calibration failure; document unsaved.\n'
(p/'FIX-REPORT.md').write_text(text)
print({'rows':len(rows),'changed':len(ex),'inherited':sum(x['source'].startswith('prior') for x in rows),'raw_ge8':passed,'report':str(p/'FIX-REPORT.md')})
