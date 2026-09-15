import pathlib,json,subprocess,os
P=pathlib.Path('/tmp/harso-sk/proto/lanes/fix-ios');env={**os.environ,'SK_PRELUDE':str(P/'prelude.js'),'SK_MAX':'30000'}
for e in json.loads((P/'entries.json').read_text()):
 if not (e['id'].startswith('conversation') or e['id'].startswith('routines') or e['id'].startswith('settings-billing')):continue
 key=e['page'].split()[-1]+'-'+e['id'];script=P/(key+'-refine.js');script.write_text('var FRAME='+json.dumps(e['frame'])+';\n'+(P/'refine.js').read_text())
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],env=env,capture_output=True,text=True);assert r.returncode==0 and 'Error:' not in r.stdout,r.stdout+r.stderr
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':e['frame']})],env={**env,'SK_TAG':'fix-ios-'+key},capture_output=True,text=True);assert r.returncode==0,r.stdout+r.stderr
 print(key,r.stdout.strip(),flush=True)
