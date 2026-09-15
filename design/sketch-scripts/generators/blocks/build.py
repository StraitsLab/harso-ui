import pathlib,subprocess,json,os,sys,re
D=pathlib.Path('/tmp/harso-sk/lanes/blocks')
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
families=['AgentLimitsCard','AgentProgress','AgentThinking','AuthCard','Calendar','DataTable','StatCards','TaskList','WebSearch','Questionnaire','FinanceDashboard','HomeDashboard','HrManagement','MarketingDashboard','MedicalProfile']
slugs=['']*10+['finance-dashboard','home-dashboard','hr-management','marketing-dashboard','medical-profile']
ledger=D/'ledger.json'; data=json.loads(ledger.read_text()) if ledger.exists() else []
for family in sys.argv[1:] or families:
 idx=families.index(family)
 for app in apps:
  if any(r['family']==family and r['appearance']==app for r in data): continue
  script=D/(family+'.js'); script.write_text("var APP = '"+app+"';\nvar FAMILY = '"+family+"';\nvar SLUG = '"+slugs[idx]+"';\n"+(D/'core.js').read_text())
  r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],capture_output=True,text=True)
  print(r.stdout,flush=True)
  if r.returncode: raise RuntimeError(r.stderr+r.stdout)
  m=re.search(r'\{.*\}',r.stdout); rec=json.loads(m.group())
  if any(x.startswith('ERR') for x in rec['made']): raise RuntimeError(rec)
  tag='blocks-'+family+'-'+app.replace('/','-'); shot='/tmp/harso-sk/shots/'+tag+'.png'
  sr=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':rec['sheet']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
  print(sr.stdout,flush=True)
  rec['screenshot']=shot if sr.returncode==0 and pathlib.Path(shot).exists() else 'FAILED '+sr.stdout
  data.append(rec);ledger.write_text(json.dumps(data,indent=2))
  with (D/'REPORT.md').open('a') as f:f.write('\n- '+family+' · '+app+': sheet `'+rec['sheet']+'`; '+str(len(rec['made']))+' symbols; '+str(rec['w'])+'×'+str(rec['h'])+'; screenshot `'+rec['screenshot']+'`. Vision: pending.\n')
 print('FAMILY BUILT '+family,flush=True)
