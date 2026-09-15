import json,os,subprocess,pathlib,ast
root=pathlib.Path('/tmp/harso-sk/proto/lanes/ios-core')
ids=['signin','home','conversation','conversation--approval','conversation--menu','conversation--delete','search','activity','activity--work']
os.environ['SK_PRELUDE']='/tmp/harso-sk/proto/prelude.js'
common=(root/'common.js').read_text()
for app in ['Light/Clean','Dark/Clean']:
 for id in ids:
  for stage in ['shell','content']:
   if app=='Light/Clean' and (ids.index(id)<7 or (id=='activity' and stage=='shell')): continue
   code='var APP='+json.dumps(app)+';var ID='+json.dumps(id)+';\n'+common+'\n'+(root/(stage+'.js')).read_text()
   path=root/(app.split('/')[0]+'-'+id+'-'+stage+'.js');path.write_text(code)
   r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(path)})],capture_output=True,text=True)
   print(app,id,stage,r.stdout,flush=True)
   with (root/'build.log').open('a') as f:f.write(r.stdout+'\n')
   if r.returncode:raise RuntimeError(r.stdout+r.stderr)
