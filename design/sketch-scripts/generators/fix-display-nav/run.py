import json,subprocess,os,sys
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/fix-display-nav');doc=Path('/tmp/harso-sk/doc.id').read_text().strip()
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
families=sys.argv[1:] or json.loads((P/'families.json').read_text())
for fam in families:
 for app in apps:
  source=(P/(fam+'.js')).read_text().replace("var APP = 'Light/Clean';",'var APP = '+json.dumps(app)+';')
  script=P/(fam+'-'+app.replace('/','-')+'.js');script.write_text(source)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],capture_output=True,text=True)
  (P/(script.stem+'.log')).write_text(r.stdout+r.stderr)
  if r.returncode: print('FAIL',fam,app,r.stdout,r.stderr,flush=True);sys.exit(1)
  text=r.stdout.strip();data=json.loads(text[text.index('{'):text.rindex('}')+1]);data.update(family=fam,app=app)
  tag='fix-dn-'+fam+'-'+app.replace('/','-');data['screenshot']='/tmp/harso-sk/shots/'+tag+'.png'
  with (P/'results.jsonl').open('a') as out:out.write(json.dumps(data)+'\n')
  env=dict(os.environ,SK_TAG=tag)
  shot=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':data['sheet']})],capture_output=True,text=True,env=env)
  if shot.returncode:print('SHOT FAIL',shot.stdout,shot.stderr,flush=True);sys.exit(1)
  print(fam,app,data['sheet'],shot.stdout.strip(),flush=True)
