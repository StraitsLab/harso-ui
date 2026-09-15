import json,subprocess,os,pathlib
p=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-mac-manage')
rs=json.loads((p/'frames.json').read_text());assert len(rs)==22 and len({(r['id'],r['app']) for r in rs})==22
for r in rs:
 env=dict(os.environ,SK_TAG='v2-manage-'+r['app'].split('/')[0]+'-'+r['id'])
 out=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':r['frame']})],text=True,capture_output=True,env=env)
 print(out.stdout.strip(),flush=True)
 if out.returncode:raise SystemExit(out.stderr)
print('EXPORTED 22 unique frames',flush=True)
