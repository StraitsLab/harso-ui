import json,subprocess,os,pathlib
p=pathlib.Path('/tmp/harso-sk/proto/lanes/fix2-macos')
a=[json.loads(l.strip().strip("'")) for l in (p/'fix-result.txt').read_text().splitlines() if l.strip().startswith("'{")]
for x in a:
 tag='fix2-macos-'+x['appearance'].lower()+'-'+x['id']
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':x['frame']})],env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude2.js',SK_TAG=tag),capture_output=True,text=True,timeout=60)
 if r.returncode or 'IMAGE' not in r.stdout: raise RuntimeError(r.stdout+r.stderr)
 x['png']='/tmp/harso-sk/shots/'+tag+'.png'
 with (p/'exports.jsonl').open('a') as f:f.write(json.dumps(x)+'\n')
 print(tag,flush=True)
