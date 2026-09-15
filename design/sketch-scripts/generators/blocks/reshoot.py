import pathlib,subprocess,json,os
D=pathlib.Path('/tmp/harso-sk/lanes/blocks');data=json.loads((D/'ledger.json').read_text())
for r in data:
 tag=pathlib.Path(r['screenshot']).stem
 z=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
 print(r['family'],r['appearance'],z.returncode,flush=True)
 if z.returncode:raise RuntimeError(z.stdout+z.stderr)
