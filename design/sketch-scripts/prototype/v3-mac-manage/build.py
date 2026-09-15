import pathlib,subprocess,json,os,sys,re
P=pathlib.Path('/tmp/harso-sk/proto/lanes/v3-mac-manage')
common=(P/'common.js').read_text()+'\n'+(P/'data.js').read_text()
ids=['projects','projects--empty','project','recent','artifacts','artifacts--empty','artifacts--detail','routines','routines--new','customize','customize--profile']
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude3.js')
app=sys.argv[1]; selection=sys.argv[2:] or ids
ledger=P/'frames.json'; records=json.loads(ledger.read_text()) if ledger.exists() else []
def call(tool,args,env=env):
 try: o=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],env=env,text=True,capture_output=True,timeout=60)
 except subprocess.TimeoutExpired:
  subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':'/tmp/harso-sk/ping.js'})],env=env,timeout=60);raise
 if o.returncode or 'Error:' in o.stdout: raise RuntimeError(o.stdout+o.stderr)
 return o.stdout
for id in selection:
 for stage,code in [('shell','var s=shell();'),('body','var s=resolve();body(s);'),('overlay','var s=resolve();overlay(s);normalize(s);')]:
  f=P/(id+'-'+stage+'.js');f.write_text(common+'\nvar APP='+json.dumps(app)+';var ID='+json.dumps(id)+';'+code+'console.log(JSON.stringify({id:ID,app:APP,frame:String(s.id),stage:'+json.dumps(stage)+'}));')
  out=call('run_code',{'code_file':str(f)}); print(id,stage,out.strip(),flush=True)
  if stage=='overlay':
   rec=json.loads(re.search(r'\{.*\}',out).group());records=[r for r in records if not(r['id']==id and r['app']==app)];records.append(rec);ledger.write_text(json.dumps(records,indent=2))
   print(call('get_screenshot',{'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':rec['frame']},dict(env,SK_TAG='v3-manage-'+app.split('/')[0]+'-'+id)),flush=True)
