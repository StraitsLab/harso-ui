import pathlib,json,subprocess,os,sys
P=pathlib.Path('/tmp/harso-sk/proto/lanes/fix-ios')
entries=[]
for line in (P/'probe.log').read_text().splitlines():
 try:
  o=json.loads(line.strip("'"))
  if 'page' in o: entries.append(o)
 except: pass
(P/'entries.json').write_text(json.dumps(entries,indent=2))
env=os.environ.copy();env['SK_PRELUDE']=str(P/'prelude.js');env['SK_MAX']='30000'
# Append lane helper definitions to our private prelude only.
p=P/'prelude.js'
p.write_text(pathlib.Path('/tmp/harso-sk/proto/prelude.js').read_text()+'\n'+(P/'fixes.js').read_text())
for e in entries:
 key=e['page'].split()[-1]+'-'+e['id']
 if len(sys.argv)>1 and key not in sys.argv[1:]: continue
 script=P/(key+'-fix.js');script.write_text("var s=sketch.find('#"+e['frame']+"',doc)[0];H.fixIOS(s,"+json.dumps(e['page'].split()[-1]+'/Clean')+","+json.dumps(e['id'])+");")
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],env=env,text=True,capture_output=True)
 (P/(key+'.log')).write_text(r.stdout+r.stderr)
 print(key,r.returncode,r.stdout[:80],flush=True)
 if r.returncode or 'Error:' in r.stdout: raise RuntimeError(r.stdout+r.stderr)
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':e['frame']})],env={**env,'SK_TAG':'fix-ios-'+key},text=True,capture_output=True)
 (P/(key+'-screenshot.log')).write_text(r.stdout+r.stderr)
 if r.returncode: raise RuntimeError(r.stdout+r.stderr)
 print(r.stdout.strip(),flush=True)
