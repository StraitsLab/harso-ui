import json
from pathlib import Path
B=Path('/tmp/harso-sk/lanes/charts-r3')
d=json.loads((B/'audit-output.json').read_text().strip().strip("'"))
assert len(d)==16
changes={
'AreaChartCard':'Collapsed grey series → Referral uses the darker neutral and Paid the lighter neutral consistently in band fill, boundary stroke and legend dot. Existing secondary/faint tokens provide separation without modifying shared text tokens.',
'SleepScoreCard':'Collapsed Stage 2/3 greys → darker Stage 2 and lighter Stage 3 active arcs and matching legend dots. Zero Stage 1 remains without an active arc.',
'RadarChartCard':'Missing point targets → four explicit 4px filled vertex circles, including separate center and near-zero points. Raw 0 / 0.25 / 75 / 100 fixtures unchanged; center markers correctly nearly coincide.',
'SankeyChartCard':'Missing trailing affordances → structured detail rows with right-aligned 16px tertiary arrowRight vectors, six node rows and five link rows per appearance. Removed inline text-arrow substitutes.'}
lines=['# Charts round-3 FIX-REPORT','', 'Completed all four requested families × four appearances: 16 unique sheets and 16 symbol masters. No other chart family edited; no swatches/text styles created; document not saved.','', '## Verification','', '- All 16 exports captured through sk.py and vision-checked in four full-resolution family contact sheets; all appearances passed the named defect checks with no observed clipping/overlap.', '- Exact-target Sketch readback verified original x/y, one master per sheet, four 4×4px Radar vertices per appearance, and eleven 16×16px Sankey icons per appearance.', '- Evidence: `before.json`, `results.jsonl`, `audit-output.json`; generated scripts and edited `plot.js`, `card.js`, `build.py` are retained in this directory.','- Initial broad probe exceeded the bridge output cap; narrowed to the 16 targets and re-read successfully. No remaining blockers.','']
for f,change in changes.items():
 lines += ['## '+f,'',change,'','Self-score: **8/10 for each appearance** (not independent reviewer approval).','',f'Vision-reviewed contact sheet: `{B}/{f}-review.png`','', '| Appearance | Sheet ID | Screenshot |','|---|---|---|']
 for s in d:
  if not s['name'].startswith(f+' — '):continue
  app=s['name'].split(' — ')[1];shot='/tmp/harso-sk/shots/charts-r3-'+f+'-'+app.replace('/','-')+'.png'
  assert Path(shot).exists()
  lines += [f"| {app} | `{s['id']}` | `{shot}` |"]
 lines += ['']
lines += ['LANE_RESULT: done — Four chart families repaired across all four appearances; 16 sheets visually and structurally verified; document left unsaved.']
(B/'FIX-REPORT.md').write_text('\n'.join(lines)+'\n')
print('Wrote FIX-REPORT.md with 16 sheet IDs and screenshot paths')
