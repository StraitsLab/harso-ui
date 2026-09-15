import os,json,subprocess,sys,re
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/ai-code')
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
names='Agent Artifact CodeBlock Commit EnvironmentVariables FileTree JsxPreview PackageInfo Sandbox SchemaDisplay Snippet StackTrace Terminal TestResults WebPreview'.split()
ledger=P/'ledger.json'
data=json.loads(ledger.read_text()) if ledger.exists() else []
for fam in (sys.argv[1:] or names):
 for app in apps:
  if any(x['family']==fam and x['app']==app for x in data): continue
  f=P/(fam+'.js'); f.write_text("var APP = '"+app+"';\nvar FAMILY = '"+fam+"';\n"+(P/'core.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],capture_output=True,text=True,timeout=220)
  print(r.stdout,flush=True)
  if r.returncode: raise RuntimeError(r.stderr+r.stdout)
  m=re.search(r'\{.*\}',r.stdout)
  d=json.loads(m.group()); tag='ai-code-'+fam+'-'+app.replace('/','-'); d['screenshot']='/tmp/harso-sk/shots/'+tag+'.png';data.append(d);ledger.write_text(json.dumps(data,indent=2))
  rr=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True,timeout=220)
  print(rr.stdout,flush=True)
  if rr.returncode: raise RuntimeError(rr.stderr+rr.stdout)
 with (P/'REPORT.md').open('a') as fp:
  fp.write('\n## '+fam+'\n')
  for d in data:
   if d['family']==fam:fp.write('- '+d['app']+': sheet `'+d['sheet']+'`; '+str(len(d['made']))+' symbols; screenshot `'+d['screenshot']+'`.\n')
  fp.write('- Build and screenshot complete; visual review pending.\n')
