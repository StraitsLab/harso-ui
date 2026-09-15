import json, pathlib, subprocess, os, sys,re
P=pathlib.Path('/tmp/harso-sk/lanes/navigation'); bodies=json.loads((P/'bodies.json').read_text());apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'];doc=pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip()
for fam in sys.argv[1:]:
 results=[]
 for app in apps:
  script="var APP = '"+app+"';\nvar FAMILY = '"+fam+"';\n"+(P/'common.js').read_text()+bodies[fam]+"\ndone(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+FAMILY+'/'));H.out({sheet:String(sh.id),name:sh.name,w:sh.frame.width,h:sh.frame.height,made:made});"
  (P/(fam+'.js')).write_text(script)
  cp=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(P/(fam+'.js'))})],capture_output=True,text=True)
  print(fam,app,cp.stdout,cp.stderr,flush=True)
  if cp.returncode:sys.exit(cp.returncode)
  obj=json.loads(cp.stdout.strip().strip("'"));obj['appearance']=app;tag='nav-'+fam+'-'+app.replace('/','-');obj['screenshot']='/tmp/harso-sk/shots/'+tag+'.png'
  cp=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':obj['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
  print(cp.stdout,flush=True)
  if cp.returncode:sys.exit(cp.returncode)
  results.append(obj);(P/(fam+'-results.json')).write_text(json.dumps(results,indent=2))
 with (P/'REPORT.md').open('a') as f:
  f.write('\n## '+fam+'\n')
  for x in results:f.write('- '+x['appearance']+': `'+x['sheet']+'`; '+str(len(x['made']))+' new symbols; `'+x['screenshot']+'`\n')
  f.write('- Visual review: pending.\n')
