import subprocess,json,os,re,sys
from pathlib import Path
p=Path(__file__).parent
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude3.js')
gen=p.joinpath('generator.js').read_text()
ids=json.loads('['+re.search(r'var ids=\[(.*?)\];',gen).group(1).replace("'",'"')+']')
records=[]
if p.joinpath('frames.json').exists(): records=json.loads(p.joinpath('frames.json').read_text())
for app in ['Light/Clean','Dark/Clean']:
 for ident in ids:
  if len(sys.argv)>1 and ident not in sys.argv[1:]:continue
  f=p/('build-'+app.split('/')[0]+'-'+ident+'.js');f.write_text('var APP='+json.dumps(app)+',ID='+json.dumps(ident)+';\n'+gen)
  try:r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],env=env,text=True,capture_output=True,timeout=60)
  except subprocess.TimeoutExpired:
   subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':'/tmp/harso-sk/ping.js'})],env=env,timeout=60);raise
  print(ident,app,r.stdout,r.stderr,flush=True)
  if r.returncode or 'Error:' in r.stdout:raise RuntimeError('Sketch failed')
  rec=json.loads(re.search(r'\{"id":.*\}',r.stdout).group());records=[a for a in records if not(a['id']==ident and a['app']==app)]+[rec];p.joinpath('frames.json').write_text(json.dumps(records,indent=2))
