import json,subprocess,os,sys,re
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/fix-ai-chat'); apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
ledger=P/'ledger.json'; records=json.loads(ledger.read_text()) if ledger.exists() else []
for family in sys.argv[1:]:
 for app in apps:
  f=P/(family+'-'+app.replace('/','-')+'.js');f.write_text('var APP='+json.dumps(app)+';var FAMILY='+json.dumps(family)+';\n'+(P/'components.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],capture_output=True,text=True); print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  rec=json.loads(re.search(r'\{.*\}',r.stdout).group());records=[x for x in records if not(x['family']==family and x['app']==app)];records.append(rec);ledger.write_text(json.dumps(records,indent=2))
  tag='fix-ai-'+family+'-'+app.replace('/','-');out=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':rec['sheet']})],capture_output=True,text=True,env=dict(os.environ,SK_TAG=tag));print(out.stdout,flush=True)
  if out.returncode:raise RuntimeError(out.stdout+out.stderr)
  rec['shot']='/tmp/harso-sk/shots/'+tag+'.png';ledger.write_text(json.dumps(records,indent=2))
