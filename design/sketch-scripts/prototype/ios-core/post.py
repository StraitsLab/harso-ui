import json,os,subprocess,pathlib
root=pathlib.Path('/tmp/harso-sk/proto/lanes/ios-core');os.environ['SK_PRELUDE']='/tmp/harso-sk/proto/prelude.js'
for app in ['Light/Clean','Dark/Clean']:
 for stage,ids in [('fix-composer',['home','conversation','conversation--approval','conversation--menu','conversation--delete']),('overlay',['conversation--approval','conversation--menu','conversation--delete'])]:
  for id in ids:
   path=root/(app.split('/')[0]+'-'+id+'-'+stage+'.js');path.write_text('var APP='+json.dumps(app)+';var ID='+json.dumps(id)+';\n'+(root/'common.js').read_text()+'\n'+(root/(stage+'.js')).read_text())
   r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(path)})],capture_output=True,text=True);print(r.stdout,flush=True)
   if r.returncode:raise RuntimeError(r.stdout+r.stderr)
