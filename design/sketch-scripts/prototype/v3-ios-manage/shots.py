import subprocess,json,os,sys
from pathlib import Path
p=Path(__file__).parent
for a in json.loads((p/'frames.json').read_text()):
 if len(sys.argv)>1 and a['id'] not in sys.argv[1:]:continue
 tag='v3-ios-manage-'+a['app'].split('/')[0]+'-'+a['id'];env=dict(os.environ,SK_TAG=tag)
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':a['frame']})],env=env,capture_output=True,text=True,timeout=60)
 print(tag,r.stdout,flush=True)
 if r.returncode:raise RuntimeError(r.stderr)
