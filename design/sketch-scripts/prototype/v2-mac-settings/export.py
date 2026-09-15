import subprocess,os,json,pathlib
L=pathlib.Path(__file__).parent
for d in json.loads((L/'frames.json').read_text()):
 tag='v2-ms-'+d['app']+'-'+d['id']
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':d['frame']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
 print(tag,r.stdout,flush=True)
 if r.returncode:raise RuntimeError(r.stderr)
