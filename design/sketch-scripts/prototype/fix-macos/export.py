import pathlib,json,subprocess,os,re
D=pathlib.Path('/tmp/harso-sk/proto/lanes/fix-macos'); rows=[]
for line in (D/'live-before.log').read_text().splitlines()[1:69]:
 rows.append(json.loads(line.strip("'")))
ids={r['id'] for r in json.loads((D/'targets.json').read_text())}
rows=[r for r in rows if r['name'].split('/')[-1] in ids]
(D/'frames.json').write_text(json.dumps(rows,indent=2))
for r in rows:
 a=r['name'].split('/')[2];i=r['name'].split('/')[-1];tag='fix-mac-'+a+'-'+i
 q=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['id']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True)
 if q.returncode or 'IMAGE' not in q.stdout:raise RuntimeError(q.stdout+q.stderr)
 print(tag,flush=True)
