import json,re,subprocess,os,sys
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/controls')
a=json.loads(re.search(r'\{.*\}',(P/'audit.log').read_text(),re.S).group(0))
for d in a['sheets']:
 if d['family'] not in sys.argv[1:]:continue
 tag='controls-'+d['family']+'-'+d['app'].replace('/','-')
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],capture_output=True,text=True,env={**os.environ,'SK_TAG':tag})
 print(r.stdout,flush=True)
