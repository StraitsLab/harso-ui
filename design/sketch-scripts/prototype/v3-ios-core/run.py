import json,subprocess,os
from pathlib import Path
P=Path('/tmp/harso-sk/proto/lanes/v3-ios-core');env=os.environ.copy();env['SK_PRELUDE']='/tmp/harso-sk/proto/prelude3.js'
ids=['signin','home','conversation','conversation--approval','conversation--menu','conversation--delete','search','activity','activity--work']
def call(tool,args,tag=''):
 e=env.copy();e['SK_TAG']=tag
 try:r=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],env=e,text=True,capture_output=True,timeout=60)
 except subprocess.TimeoutExpired:
  subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':'/tmp/harso-sk/ping.js'})],env=e,timeout=60);raise
 if r.returncode or 'Error:' in r.stdout:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
if __name__=='__main__':
 import sys
 app=sys.argv[1];chosen=sys.argv[2:] or ids
 records=[]
 for id in chosen:
  file=P/(id+'-'+app+'.js');file.write_text('var APP='+json.dumps(app+'/Clean')+';\n'+(P/'core.js').read_text()+'\nbuild('+json.dumps(id)+','+str(ids.index(id))+');')
  out=call('run_code',{'code_file':str(file)});print(out,flush=True)
  record=json.JSONDecoder().raw_decode(out[out.index('{'):])[0];records.append(record)
  with (P/'inventory.jsonl').open('a') as f:f.write(json.dumps(record)+'\n')
  print(call('get_screenshot',{'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':record['frame']},'v3-ios-'+app+'-'+id),flush=True)
