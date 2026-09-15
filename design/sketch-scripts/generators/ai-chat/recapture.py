from pathlib import Path
import subprocess,json,os,sys
P=Path('/tmp/harso-sk/lanes/ai-chat');rs=json.loads((P/'ledger.json').read_text())
for r in rs:
 if r['family'] not in sys.argv[1:]:continue
 tag='ai-'+r['family']+'-'+r['app'].replace('/','-')
 s=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['sheet']})],capture_output=True,text=True,env=dict(os.environ,SK_TAG=tag));print(s.stdout,flush=True)
 if s.returncode:raise RuntimeError(s.stdout+s.stderr)
