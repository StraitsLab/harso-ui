import pathlib, subprocess, json, os, sys
L=pathlib.Path(__file__).parent
IDS=['settings','settings-account','settings-devices','settings-general','settings-appearance','settings-voice','settings-notifications','settings-connections','settings-billing','settings-privacy','settings-shortcuts','settings-about','settings--sign-out','settings-billing--plan']
env={**os.environ,'SK_PRELUDE':'/tmp/harso-sk/proto/prelude2.js'}
base=(L/'build.js').read_text()
for i in IDS:(L/(i+'.js')).write_text(base+'\nbuildSettings(APP,'+json.dumps(i)+',PHASE);')
for app in ['Light/Clean','Dark/Clean']:
 for i in IDS:
  for phase in ['detail']:
   p=L/(i+'-run.js');p.write_text('var APP='+json.dumps(app)+';var PHASE='+json.dumps(phase)+';\n'+(L/(i+'.js')).read_text())
   r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],env=env,capture_output=True,text=True)
   with (L/'build.log').open('a') as f:f.write(r.stdout+r.stderr)
   print(app,i,phase,r.returncode,r.stdout[:250],flush=True)
   if r.returncode or 'Error:' in r.stdout:sys.exit('Stopped; inspect build.log')
