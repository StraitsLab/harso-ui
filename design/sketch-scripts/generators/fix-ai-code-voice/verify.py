from pathlib import Path
import ast,json
p=Path('/tmp/harso-sk/lanes/fix-ai-code-voice')
a=json.loads(ast.literal_eval((p/'audit-output.txt').read_text().strip()))
(p/'audit.json').write_text(json.dumps(a,indent=2))
print('Sheets',len(a),'unique names',len({r['name'] for r in a}),'symbols',sum(len(r['symbols']) for r in a))
print('Gaps',[(r['name'],r['gap']) for r in a if r['gap'] is not None and r['gap']<80])
print('Voices',[r['voices'] for r in a if r['voices']])
assert len(a)==32 and len({r['name'] for r in a})==32
assert all(r['gap'] is None or r['gap']>=0 for r in a)
for r in a:
 if r['voices']:
  assert len(r['voices'])==3
  assert len({v['h'] for v in r['voices']})==1
  assert len({v['actions'][0]['y'] for v in r['voices']})==1
 if r['name'].startswith(('Node —','Canvas —')):
  assert len(r['ports'])==(8 if r['name'].startswith('Node') else 6)
  assert all(z['x']==(0 if z['name']=='input port' else 240) and z['y']==102 for z in r['ports'])
print('PASS geometry and count assertions')
