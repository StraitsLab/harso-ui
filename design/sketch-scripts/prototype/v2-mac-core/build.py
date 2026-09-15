import os,json,subprocess,pathlib,sys,re
root=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-mac-core');os.environ['SK_PRELUDE']='/tmp/harso-sk/proto/prelude2.js'
ids=['signin','new-conversation','conversation','conversation--approval','conversation--menu','conversation--delete','search','activity','activity--work']
app=sys.argv[1]; chosen=sys.argv[2:] or ids
for id in chosen:
 for phase in ['shell','content','inspector','overlay']:
  script='var APP='+json.dumps(app)+';var ID='+json.dumps(id)+';\n'+(root/'common.js').read_text()+(root/(phase+'.js')).read_text()
  path=root/(id+'-'+phase+'-'+app.split('/')[0]+'.js');path.write_text(script)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(path)})],capture_output=True,text=True,timeout=60)
  print(r.stdout,flush=True)
  if r.returncode or 'Error:' in r.stdout: raise RuntimeError(r.stdout+r.stderr)
  if phase=='final': pass
  if phase=='overlay':
   match=re.search(r'\{"id".*?\}',r.stdout);data=json.loads(match.group())
   with (root/'frames.jsonl').open('a') as f:f.write(json.dumps(data)+'\n')
 print('BUILT',app,id,flush=True)
