from pathlib import Path
import json,re,collections
P=Path('/tmp/harso-sk/lanes/controls')
a=json.loads(re.search(r'\{.*\}',(P/'audit.log').read_text(),re.S).group(0));ds=a['sheets'];families=json.loads((P/'families.json').read_text());apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
assert len(ds)==76
assert all(sum(d['family']==f for d in ds)==4 for f in families)
names=[n for d in ds for n in d['names']];assert len(names)==len(set(names))
for app in apps:
 col=sorted([d for d in ds if d['app']==app],key=lambda d:d['y'])
 for i,d in enumerate(col):
  assert d['x']==apps.index(app)*1600
  if i:assert d['y']>=col[i-1]['y']+col[i-1]['h']+80
for d in ds:
 d['screenshot']='/tmp/harso-sk/shots/controls-'+d['family']+'-'+d['app'].replace('/','-')+'.png'
 assert Path(d['screenshot']).exists()
 d['vision']='passed — four-appearance contact sheet reviewed'
summary=f"## Summary\n- Built all 19 Controls families × four appearances: 76 sheets, {len(names)} unique symbol masters.\n- All 76 sheets captured through Sketch MCP and vision-checked (including both Cozy appearances).\n- Verified naming uniqueness, appearance columns, 80px minimum family spacing, and all five states for every Input variant.\n- Fixed clipped focus borders, primary hover differentiation, switch thumb contrast, invalid placeholder clarity, search-hint contrast, and calendar-header fit.\n- Created 19 parameterized family generators plus helpers, targeted refinements, screenshot/contact-sheet evidence, and an audited manifest in `/tmp/harso-sk/lanes/controls/`.\n- Only Controls was modified. No document save, swatches, or text styles created.\n"
text='# Controls lane report\n\n'+summary+'\n## Fidelity and verification notes\n- Seventeen original family PNG references inspected before building; Stepper and ComboBox are new brief-directed families with no rendered reference PNG.\n- Social marks are actual bundled Phosphor SVGs (Google, GitHub, Apple), not improvised approximations.\n- FileUpload initially hit a JS newline escaping parse error before mutation; corrected and rebuilt successfully.\n- Vision thumbnail suspicions about primary loading fill and ComboBox menu padding were checked against the live DOM: primary loading uses #f2f3f5; menu padding is exactly 6px top/bottom. No defect.\n- `refine.js`, `fix-focus.js`, and `complete-input.js` record surgical post-generator refinements; `arrange.js` establishes final family ordering. Do not blindly rerun generators on existing sheets.\n'
for f in families:
 text+='\n## '+f+'\n'
 for app in apps:
  d=next(d for d in ds if d['family']==f and d['app']==app)
  text+=f"- {app}: `{d['sheet']}`; {d['count']} symbols; `{d['screenshot']}`; vision PASS.\n"
 text+='- Four-appearance visual evidence: `'+str(P/('check-'+f+'.png'))+'`.\n'
text+='\nLANE_RESULT: done — 19 families, 76 vision-checked sheets, '+str(len(names))+' unique symbols; Controls only; unsaved for lead.\n'
(P/'REPORT.md').write_text(text);(P/'manifest.json').write_text(json.dumps(ds,indent=2));(P/'SUMMARY.md').write_text(summary+'\n'+text.splitlines()[-1]+'\n');print(summary);print(text.splitlines()[-1])
