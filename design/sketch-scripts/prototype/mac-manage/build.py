from pathlib import Path
import subprocess,json,os,re
root=Path('/tmp/harso-sk/proto/lanes/mac-manage')
ids=['projects','projects--empty','project','recent','artifacts','artifacts--empty','artifacts--detail','routines','routines--new','customize','customize--profile']
body=(root/'generator.js').read_text()
for app in ['Light/Clean','Dark/Clean']:
 for n,id in enumerate(ids):
  if app=='Light/Clean' and id=='projects': continue
  p=root/(app.split('/')[0]+'-'+id+'.js');p.write_text('var APP='+json.dumps(app)+', ID='+json.dumps(id)+', INDEX='+str(n)+';\n'+body)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],env={**os.environ,'SK_PRELUDE':'/tmp/harso-sk/proto/prelude.js'},capture_output=True,text=True)
  with (root/'build.log').open('a') as f:f.write(r.stdout+'\n'+r.stderr)
  print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stderr+r.stdout)
