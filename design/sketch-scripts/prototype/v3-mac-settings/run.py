import os,json,subprocess,sys
from pathlib import Path
P=Path('/tmp/harso-sk/proto/lanes/v3-mac-settings');os.environ['SK_PRELUDE']='/tmp/harso-sk/proto/prelude3.js'
IDS=['settings','settings-account','settings-devices','settings-general','settings-appearance','settings-voice','settings-notifications','settings-connections','settings-billing','settings-privacy','settings-shortcuts','settings-about','settings--sign-out','settings-billing--plan']
base=(P/'base.js').read_text().replace('// CONTENT',(P/'content.js').read_text());(P/'build.js').write_text(base)
def call(tool,args,tag=None):
 env=os.environ.copy();env['SK_MAX']='20000'
 if tag:env['SK_TAG']=tag
 try:r=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],text=True,capture_output=True,env=env,timeout=60)
 except subprocess.TimeoutExpired:
  subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':'/tmp/harso-sk/ping.js'})],timeout=60);raise
 if r.returncode or 'Error:' in r.stdout:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
if __name__=='__main__':
 ids=sys.argv[1:] or IDS
 for ID in ids:
  (P/(ID+'.js')).write_text(base+'\nbuildSettings(APP,'+json.dumps(ID)+',PHASE);')
  for app in ['Light/Clean','Dark/Clean']:
   for phase in ['shell','detail']+(['overlay'] if '--' in ID else []):
    f=P/'current.js';f.write_text('var APP='+json.dumps(app)+',PHASE='+json.dumps(phase)+';\n'+(P/(ID+'.js')).read_text());out=call('run_code',{'code_file':str(f)});print(out,flush=True)
    with (P/'build.log').open('a') as z:z.write(out+'\n')
   obj=json.loads(out.strip().strip("'"));tag='v3-ms-'+app.split('/')[0]+'-'+ID;print(call('get_screenshot',{'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':obj['frame']},tag),flush=True)
   with (P/'frames.jsonl').open('a') as z:z.write(json.dumps(dict(obj,shot='/tmp/harso-sk/shots/'+tag+'.png'))+'\n')
