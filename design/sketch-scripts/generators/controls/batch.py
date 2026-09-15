import json,subprocess,os,sys,re
from pathlib import Path
P=Path('/tmp/harso-sk/lanes/controls'); apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
manifest=P/'manifest.json'; data=json.loads(manifest.read_text()) if manifest.exists() else []
def call(tool,args,tag=None):
 env=os.environ.copy();env['SK_MAX']='40000'
 if tag:env['SK_TAG']=tag
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],capture_output=True,text=True,env=env,timeout=220)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
for fam in sys.argv[1:]:
 for app in apps:
  known=next((d for d in data if d['family']==fam and d['app']==app),None)
  if known:continue
  if fam=='Button' and app=='Light/Clean':
   d={'family':fam,'app':app,'sheet':'7202A982-7EDD-44E3-8A2C-9D0764A820AD','count':100,'h':1777,'w':812,'y':0}
  else:
   script=P/(fam+'.js');code=script.read_text();code=re.sub(r"var APP = '[^']+';",'var APP = '+repr(app)+';',code,count=1);script.write_text(code)
   out=call('run_code',{'code_file':str(script)})
   (P/(fam+'-'+app.replace('/','-')+'.log')).write_text(out)
   match=re.search(r'\{.*\}',out,re.S);d=json.loads(match.group(0));d.pop('made',None)
  tag='controls-'+fam+'-'+app.replace('/','-');out=call('get_screenshot',{'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']},tag)
  d['screenshot']='/tmp/harso-sk/shots/'+tag+'.png';d['vision']='pending';data.append(d);manifest.write_text(json.dumps(data,indent=2));print(fam,app,d['sheet'],d['count'],out.strip(),flush=True)
 with (P/'REPORT.md').open('a') as f:
  f.write('\n## '+fam+'\n')
  for d in data:
   if d['family']==fam:f.write('- '+d['app']+': `'+d['sheet']+'`; '+str(d['count'])+' symbols; `'+d['screenshot']+'`; vision pending.\n')
