import json,re,subprocess,os,sys
from pathlib import Path
B=Path('/tmp/harso-sk/lanes/fix-charts'); apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
standard='Illustrative host values · no inferred totals'
fixture='Synthetic fixtures · each period supplied by this host; no fetched or generated period data'
subs={'activity':'2026-09-07','days':'Illustrative dated activity','contributions':'','area':fixture,'line':fixture,'combo':fixture,'radial':'Synthetic host-supplied observations · no fetched data, inferred totals or generated scores.','radar':'Synthetic host-supplied observations · no fetched data, inferred totals or generated scores.','heatmap':'Synthetic observations · Inspect any cell','scatter':'Synthetic sample · Size represents observations','sankey':'Synthetic USD flow · Follow a node or a connection'}
for src in sorted(Path('/tmp/harso-sk/lanes/charts').glob('*Card.js')):
 cfg=json.loads(re.search(r'var CFG = (.*);',src.read_text()).group(1)); cfg[3]=subs.get(cfg[1],standard)
 if len(sys.argv)>1 and cfg[0] not in sys.argv[1:]:continue
 for app in apps:
  tag='fix-charts-'+cfg[0]+'-'+app.replace('/','-'); script=B/(tag+'.js')
  script.write_text('var APP='+json.dumps(app)+';var CFG='+json.dumps(cfg)+';\n'+(B/'plot.js').read_text()+'\n'+(B/'card.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],capture_output=True,text=True,timeout=1200)
  if r.returncode: raise RuntimeError(r.stdout+r.stderr)
  data=json.loads(r.stdout.strip().strip("'"));data['tag']=tag
  with (B/'results.jsonl').open('a') as f:f.write(json.dumps(data)+'\n')
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':data['sheet']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True,timeout=1200)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  print(cfg[0],app,data['h'],r.stdout.strip(),flush=True)
