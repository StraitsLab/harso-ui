import json,subprocess,os,sys,re
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/ai-chat'); apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
families='UserMessage AssistantMessage Reasoning Tool Confirmation Task Plan ChainOfThought Checkpoint Context InlineCitation Sources ModelSelector Queue Question Shimmer Attachments Composer ThreadList MessageError StoppedRun'.split()
ledger=P/'ledger.json'; records=json.loads(ledger.read_text()) if ledger.exists() else []
for family in (sys.argv[1:] or families):
 for app in apps:
  if any(r['family']==family and r['app']==app for r in records):continue
  f=P/(family+'.js'); f.write_text('var APP = '+json.dumps(app)+';\nvar FAMILY = '+json.dumps(family)+';\n'+(P/'components.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],capture_output=True,text=True)
  print(r.stdout,flush=True)
  if r.returncode:raise RuntimeError(r.stdout+r.stderr)
  match=re.search(r'\{.*\}',r.stdout); rec=json.loads(match.group()); records.append(rec);ledger.write_text(json.dumps(records,indent=2))
  tag='ai-'+family+'-'+app.replace('/','-'); out=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':rec['sheet']})],capture_output=True,text=True,env=dict(os.environ,SK_TAG=tag)); print(out.stdout,flush=True)
  if out.returncode:raise RuntimeError(out.stdout+out.stderr)
  rec['shot']='/tmp/harso-sk/shots/'+tag+'.png';ledger.write_text(json.dumps(records,indent=2))
  with (P/'REPORT.md').open('a') as f:f.write(f"- {family} · {app}: sheet `{rec['sheet']}`, {len(rec['made'])} symbols; screenshot `{rec['shot']}`. Vision review pending.\n")
 print('FAMILY_CAPTURED '+family,flush=True)
