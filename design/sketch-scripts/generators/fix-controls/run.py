from pathlib import Path
import subprocess,json,re,os,sys
P=Path('/tmp/harso-sk/lanes/fix-controls'); mf=P/'manifest.json'; data=json.loads(mf.read_text()) if mf.exists() else []
for fam in sys.argv[1:]:
 for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
  code=re.sub(r"var APP = '[^']+';",'var APP = '+repr(app)+';', (P/(fam+'.js')).read_text())
  f=P/(fam+'-'+app.replace('/','-')+'.js');f.write_text(code)
  out=subprocess.check_output(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],text=True,timeout=900);(f.with_suffix('.log')).write_text(out)
  d=json.loads(re.search(r'\{.*\}',out,re.S).group());d.pop('made',None)
  if not d.get('ok'):raise Exception(out)
  tag='fix-controls-'+fam+'-'+app.replace('/','-'); env=os.environ.copy();env['SK_TAG']=tag
  print(subprocess.check_output(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],text=True,env=env,timeout=900),flush=True)
  d['screenshot']='/tmp/harso-sk/shots/'+tag+'.png';data=[x for x in data if not(x['family']==fam and x['app']==app)]+[d];mf.write_text(json.dumps(data,indent=2));print(fam,app,d['count'],flush=True)
