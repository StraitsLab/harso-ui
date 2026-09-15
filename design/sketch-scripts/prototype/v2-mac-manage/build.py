import pathlib,subprocess,json,os,sys
P=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-mac-manage'); common=(P/'common.js').read_text()
ids=['projects','projects--empty','project','recent','artifacts','artifacts--empty','artifacts--detail','routines','routines--new','customize','customize--profile']
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude2.js')
app=sys.argv[1]; selection=sys.argv[2: ] or ids
ledger=P/'frames.json'; records=json.loads(ledger.read_text()) if ledger.exists() else []
for id in selection:
 for stage,code in [('shell','var s=buildShell();'),('body','var s=resolve();buildBody(s);'),('overlay','var s=resolve();overlay(s);normalize(s);')]:
  script=common+'\nvar APP='+json.dumps(app)+';var ID='+json.dumps(id)+';\n'+code+'console.log(JSON.stringify({id:ID,app:APP,frame:String(s.id),stage:'+json.dumps(stage)+'}));'
  f=P/(id+'-'+stage+'.js');f.write_text(script)
  out=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],env=env,text=True,capture_output=True)
  print(id,stage,out.stdout.strip(),flush=True)
  if out.returncode or 'Error:' in out.stdout: raise SystemExit(out.stderr or out.stdout)
  if stage=='overlay':
   import re
   match=re.search(r'\{.*\}',out.stdout)
   rec=json.loads(match.group());records=[r for r in records if not(r['id']==id and r['app']==app)];records.append(rec);ledger.write_text(json.dumps(records,indent=2))
   shotenv=dict(env,SK_TAG='v2-manage-'+app.split('/')[0]+'-'+id)
   out=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':rec['frame']})],env=shotenv,text=True,capture_output=True)
   print(out.stdout.strip(),flush=True)
   if out.returncode:raise SystemExit(out.stderr)
