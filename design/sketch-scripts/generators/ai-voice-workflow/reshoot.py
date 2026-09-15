from pathlib import Path
import subprocess,json,sys,os
root=Path('/tmp/harso-sk/lanes/ai-voice-workflow')
for d in json.loads((root/'ledger.json').read_text()):
 if d['family'] not in sys.argv[1:]:continue
 tag=Path(d['shot']).stem
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
 print(r.stdout,flush=True)
 if r.returncode:raise RuntimeError(r.stderr)
