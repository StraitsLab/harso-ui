import subprocess,json,re,os,sys
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/display'); doc=Path('/tmp/harso-sk/doc.id').read_text().strip()
for fam in sys.argv[1:]:
 results=[]
 for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
  f=P/(fam+'.js'); f.write_text(re.sub(r"var APP = '[^']+';","var APP = '"+app+"';",f.read_text(),count=1))
  p=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(f)})],capture_output=True,text=True)
  (P/(fam+'-'+app.replace('/','-')+'.log')).write_text(p.stdout+p.stderr)
  if p.returncode: print(p.stdout,p.stderr);sys.exit(1)
  text=p.stdout.strip(); a=json.loads(text[text.index('{'):text.rindex('}')+1]); results.append(a)
  tag='display-'+fam+'-'+app.replace('/','-'); a['screenshot']='/tmp/harso-sk/shots/'+tag+'.png'
  q=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':a['sheet']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True)
  if q.returncode: print(q.stdout,q.stderr);sys.exit(1)
  print(fam,app,a['sheet'],len(a['made']),a['h'],q.stdout.strip(),flush=True)
  with (P/'results.jsonl').open('a') as out:out.write(json.dumps(a)+'\n')
 with (P/'REPORT.md').open('a') as out:
  out.write('\n## '+fam+'\n')
  for a in results:out.write('- '+a['app']+': `'+a['sheet']+'` · '+str(len(a['made']))+' symbols · `'+a['screenshot']+'`\n')
  out.write('- Screenshot capture complete; vision review pending.\n')
