from pathlib import Path
import subprocess,json,re,os,sys,ast
root=Path('/tmp/harso-sk/lanes/fix-ai-code-voice'); doc=Path('/tmp/harso-sk/doc.id').read_text().strip()
ledger=json.loads((root/'ledger.json').read_text()) if (root/'ledger.json').exists() else []
for fam in sys.argv[1:]:
 for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
  code=re.sub(r"var APP = '[^']+';",'var APP = '+repr(app)+';', (root/(fam+'.js')).read_text(),count=1)
  p=root/(fam+'-'+app.replace('/','-')+'.js');p.write_text(code)
  res=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],capture_output=True,text=True,check=True)
  text=res.stdout.strip(); data=json.loads(ast.literal_eval(text))
  assert data.get('sheet'),text
  tag='fix-acv-'+fam+'-'+app.replace('/','-')
  shot=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':data['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True,check=True)
  data['screenshot']='/tmp/harso-sk/shots/'+tag+'.png';ledger=[r for r in ledger if (r['family'],r['app'])!=(fam,app)]+[data]
  (root/'ledger.json').write_text(json.dumps(ledger,indent=2));print(fam,app,data['sheet'],shot.stdout,flush=True)
