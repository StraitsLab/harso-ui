import os,pathlib,json,subprocess,sys
p=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-ios-manage');rows=[json.loads(x) for x in (p/'frames.jsonl').read_text().splitlines()]; d={(r['app'],r['id']):r for r in rows};
for r in d.values():
 tag='manage-'+r['app'].split('/')[0]+'-'+r['id']; env=dict(os.environ,SK_TAG=tag)
 result=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':r['frame']})],env=env,capture_output=True,text=True)
 print(tag,result.stdout,flush=True)
 if result.returncode:raise RuntimeError(result.stdout+result.stderr)
