import json,os,subprocess,sys
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/fix-controls');d=json.loads((P/'manifest.json').read_text())
for r in d:
 if r['family'] not in sys.argv[1:]:continue
 env=os.environ.copy();env['SK_TAG']='fix-controls-'+r['family']+'-'+r['app'].replace('/','-')
 print(subprocess.check_output(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['sheet']})],text=True,env=env,timeout=900),flush=True)
