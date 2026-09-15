from build import *
L=json.loads((ROOT/'ledger.json').read_text())
for e in L:
 tag='ios-manage-'+e['app'].split('/')[0]+'-'+e['id']
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':e['frame']})],env=dict(os.environ,SK_TAG=tag),text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 print(tag,flush=True)
print('Exported',len(L))
