from pathlib import Path
import subprocess,json,os,re
P=Path('/tmp/harso-sk/lanes/ai-chat'); records=[]
for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
 for w in [1440,1024,390]:
  script='var APP='+json.dumps(app)+';var WIDTH='+str(w)+';\n'+(P/'components.js').read_text().split("var apps=['Light/Clean'")[0]+(P/'shell-body.js').read_text()
  path=P/'ChatShell.js';path.write_text(script)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(path)})],capture_output=True,text=True);print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  rec=json.loads(re.search(r'\{.*\}',r.stdout).group());records.append(rec);(P/'shell-ledger.json').write_text(json.dumps(records,indent=2))
  tag='ai-Shell-'+app.replace('/','-')+'-'+str(w)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':rec['sheet']})],capture_output=True,text=True,env=dict(os.environ,SK_TAG=tag));print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  rec['shot']='/tmp/harso-sk/shots/'+tag+'.png';(P/'shell-ledger.json').write_text(json.dumps(records,indent=2))
  with (P/'REPORT.md').open('a') as f:f.write(f"- Shell/{app}/{w}: frame `{rec['sheet']}`; screenshot `{rec['shot']}`. Vision pending.\n")
