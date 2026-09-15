import json,subprocess,os
from pathlib import Path
B=Path('/tmp/harso-sk/lanes/fix-charts')
for fam in ['ActivityRingsCard','ContributionsCard']:
 for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
  tag='fix-charts-'+fam+'-'+app.replace('/','-');p=B/(tag+'.js');src=p.read_text();prefix=src[:src.index('// Reference-faithful')];p.write_text(prefix+(B/'plot.js').read_text()+'\n'+(B/'card.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],capture_output=True,text=True,timeout=1200);assert r.returncode==0,r.stdout+r.stderr
  d=json.loads(r.stdout.strip().strip("'"));d['tag']=tag
  with (B/'results.jsonl').open('a') as f:f.write(json.dumps(d)+'\n')
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True,timeout=1200);assert r.returncode==0,r.stdout+r.stderr
  print(tag,d['h'],flush=True)
