from pathlib import Path
import json,subprocess,os
p=Path('/tmp/harso-sk/lanes/fix-ai-chat');t=(p/'shell-fix-result.json').read_text().strip();rows=json.loads(t[1:-1] if t.startswith("'") else t)
for r in rows:
 tag='fix-ai-'+r['name'].replace('/','-');o=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['id']})],env=dict(os.environ,SK_TAG=tag),text=True,capture_output=True);print(o.stdout,flush=True)
 if o.returncode:raise RuntimeError(o.stdout)
 r['shot']='/tmp/harso-sk/shots/'+tag+'.png';(p/'shell-ledger.json').write_text(json.dumps(rows,indent=2))
