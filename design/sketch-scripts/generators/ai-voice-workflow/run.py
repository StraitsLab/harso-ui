from pathlib import Path
import subprocess,json,sys,os,re
root=Path('/tmp/harso-sk/lanes/ai-voice-workflow')
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
ledger=root/'ledger.json'
data=json.loads(ledger.read_text()) if ledger.exists() else []
for fam in sys.argv[1:]:
 for app in apps:
  if any(d['family']==fam and d['app']==app for d in data):continue
  script=root/(fam+'.js');text=script.read_text();text=re.sub(r"var APP = '[^']+';","var APP = '"+app+"';",text,count=1);script.write_text(text)
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],capture_output=True,text=True)
  print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stderr+r.stdout)
  m=re.search(r'\{.*\}',r.stdout);d=json.loads(m.group(0));data.append(d);ledger.write_text(json.dumps(data,indent=2))
  tag='avw-'+fam+'-'+app.replace('/','-');d['shot']='/tmp/harso-sk/shots/'+tag+'.png'
  s=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
  print(s.stdout,flush=True)
  if s.returncode:raise RuntimeError(s.stderr+s.stdout)
  ledger.write_text(json.dumps(data,indent=2))
 with (root/'REPORT.md').open('a') as report:
  report.write('\n## '+fam+'\n')
  for d in data:
   if d['family']==fam:report.write('- '+d['app']+': `'+d['sheet']+'`; '+str(len(d['made']))+' symbols; screenshot `'+d['shot']+'`.\n')
  report.write('- Construction and screenshots complete; visual gate recorded in verification notes below.\n')
