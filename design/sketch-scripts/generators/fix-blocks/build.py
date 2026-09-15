from pathlib import Path
import json,subprocess,os,sys
root=Path('/tmp/harso-sk/lanes/fix-blocks')
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
commands={'AgentLimitsCard':"limits(spec,560,FAMILY+'/'+APP+'/default');",'AgentProgress':"progress(spec,560,FAMILY+'/'+APP+'/active');",'AgentThinking':"thinking(spec,440,FAMILY+'/'+APP+'/wave');",'AuthCard':'auth(spec);','Calendar':"calendar(spec,1240,FAMILY+'/'+APP+'/month/events');",'DataTable':"table(spec,1120,FAMILY+'/'+APP+'/desktop/partial');mobile(spec,FAMILY+'/'+APP+'/phone/stacked');",'StatCards':"stats(spec,1120,FAMILY+'/'+APP+'/grid/default');",'TaskList':"tasks(spec,640,FAMILY+'/'+APP+'/expanded');",'WebSearch':'web(spec);','Questionnaire':'questionnaire(spec);'}
commands['HrManagementPhone']="mobile(spec,FAMILY+'/'+APP+'/directory','hr');"
ledger=json.loads((root/'ledger.json').read_text()) if (root/'ledger.json').exists() else []
for family in sys.argv[1:]:
 for app in apps:
  # Preserve original generator read as prerequisite; all share core.
  old=Path('/tmp/harso-sk/lanes/blocks')/(family+'.js')
  if old.exists(): old.read_text()
  code='var APP='+json.dumps(app)+';var FAMILY='+json.dumps(family)+';\n'+(root/'core.js').read_text()+(root/'components.js').read_text()
  if family not in commands:code+=(root/'templates.js').read_text()
  code+="\ntext(sh,FAMILY+' — '+APP,20,'ink',null,6);var spec=col(sh,'Specimens',null,24);\n"+commands.get(family,'templateFixed(spec,FAMILY);')
  code+="\nend(spec);end(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+FAMILY+'/'));H.relayout(sh);sh.frame.x=X;sh.frame.y=Y;H.out({ok:true,family:FAMILY,appearance:APP,sheet:String(sh.id),made:made,w:sh.frame.width,h:sh.frame.height,x:sh.frame.x,y:sh.frame.y});"
  path=root/(family+'-'+app.replace('/','-')+'.js');path.write_text(code)
  res=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(path)})],capture_output=True,text=True)
  print(res.stdout,flush=True)
  # sk.py emits JSON envelope; use sheet payload from console text
  import re
  found=re.search(r'\{"ok":true.*?"y":[^}]+\}',res.stdout)
  if not found:raise RuntimeError(res.stdout+res.stderr)
  d=json.loads(found.group());ledger=[x for x in ledger if not(x['family']==family and x['appearance']==app)];ledger.append(d);(root/'ledger.json').write_text(json.dumps(ledger,indent=2))
  tag='fix-blocks-'+family+'-'+app.replace('/','-');d['screenshot']='/tmp/harso-sk/shots/'+tag+'.png'
  res=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':d['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True);print(res.stdout,flush=True)
  (root/'ledger.json').write_text(json.dumps(ledger,indent=2))
