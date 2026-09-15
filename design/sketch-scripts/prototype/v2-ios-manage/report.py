from pathlib import Path
import json
p=Path('/tmp/harso-sk/proto/lanes/v2-ios-manage');rs=json.loads((p/'inventory.json').read_text())
scores=[7,6,5,6,6,6,6,7,5,7,5,5,6,6.5,6,6,6.8,6.6,6.9,6.8,6.5,6.8,5.8,6,6,6,6,5,6.2,6.5,5.9,6.4,6.5,5.5,6,5.5,6,6,7,6,6,6.5,5.5,6,6,6,6.5,6,6,5,5,5,6.5,6,6.5,6,6.5,6]
assert len(rs)==len(scores)==58
reviews=[dict(index=i,frame=r['id'],name=r['name'],score=scores[i],screenshot=r['shot']) for i,r in enumerate(rs)]
(p/'scores.json').write_text(json.dumps(reviews,indent=2))
s='''# v2 iOS manage — final inventory and visual review

**58/58 frames live on the two authorized pages. All 58 exported and individually scored in labeled four-phone contact sheets. Acceptance BLOCKED: raw vision scores remain below 8. No scores have been rescaled or fabricated. Never saved.**

## Changes and verified results
- Re-inventoried all 29 screen IDs × Light/Dark; no gaps. Preserved every existing frame ID; did not rebuild from scratch or create pages.
- Fixed both Settings roots and their sign-out overlay bases: all category rows and Sign Out now 44px (previously 33/40), profile 44px, two groups retained. Collapsed native title is necessary to fit. Live readback: body starts98, Sign Out ends646, tabs start748 → **102px clearance**. Both full-size final visual reviews confirm no clipping.
- Native sheet grabbers corrected to60×4; sheet toolbar70. Added selected segment shadow; Markdown source switched to SF Mono; About section renamed WEAVE; redundant Follow system switch renamed Tint app icon.
- Re-exported all58 after polish. Frame size390×844 unchanged. All changes scoped to owned screen IDs; no shared helper edits.

## Visual acceptance blocker
The reviewer repeatedly explicitly reports “scores compressed to3–7” / “toward the center per instructions” despite being asked for a full1–10 scale. It also repeatedly penalizes required iOS27 floating capsules as deviations from legacy docked UITabBar, or requests tabs on intentionally pushed destinations. Final Settings reviews:7/10 each, verified geometry and no clipping. Those numeric scores are preserved, NOT silently normalized to8. Remaining style criticisms include custom share-sheet header/action arrangement, stacked metadata/document cards and segmented material fidelity. Every screen received a raw score; this is not a claim that all defects are resolved.

## Frame IDs and raw vision scores
|Screen|Light frame|Score|Dark frame|Score|
|---|---|---:|---|---:|
'''
d={(r['name'].split('/')[2],r['name'].split('/')[-1]):(r,score) for r,score in zip(rs,scores)}
ids=[r['name'].split('/')[-1] for r in rs if '/Light/' in r['name']]
assert len(ids)==29 and len(d)==58
for id in ids:
 a,sa=d[('Light',id)];b,sb=d[('Dark',id)];s+=f"|{id}|{a['id']}|{sa}/10|{b['id']}|{sb}/10|\n"
s+='''
## Evidence and replay
- `inventory.json`, `audit-live.txt`: exact live initial58-frame inventory.
- `final-audit.js` / `final-audit.txt`: post-write readback of settings and sheet metrics.
- `fix-settings.js`, then `polish.js`: idempotent-ish in-place refinement passes after old generator (do not use old generator alone; it still has33px settings rows).
- `verify-export.py`: each bridge call timeout60; generates58 screenshots `/tmp/harso-sk/shots/manage-verified-0.png` … `57.png` and15 labeled `review-*.png` sheets.
- `scores.json`: exact index/frame/screenshot/raw-score mapping. Scores for unchanged screens retained from first review; final rereviews replace Settings roots and artifact empty/work/code/share scores.
- `report.py` generates this report. No live process outstanding.

LANE_RESULT: ios-manage BLOCKED —58/58 live frames,58/58 screenshot-reviewed;0/58 raw vision≥8; Settings44px rows/102px clearance verified; score-compression/legacy-rubric conflict; never saved.
'''
(p/'REPORT.md').write_text(s)
print('frames',len(d),'reviewed',len(scores),'passing',sum(x>=8 for x in scores));print(s.splitlines()[-1])
