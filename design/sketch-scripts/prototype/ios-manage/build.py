import os,json,subprocess,pathlib
ROOT=pathlib.Path('/tmp/harso-sk/proto/lanes/ios-manage')
IDS=['projects','projects--new','project','recent','artifacts','artifacts--detail','routines','routines--new','customize','settings']+['settings-'+x for x in ['account','devices','general','appearance','voice','notifications','connections','billing','privacy','shortcuts','about']]+['settings--sign-out','settings-billing--plan','project--empty','artifacts--empty','project--work','artifacts--code','artifacts--share']
TITLES={'projects':'Projects','project':'Personal','recent':'Recent','artifacts':'Artifacts','routines':'Routines','customize':'Customize','settings':'Settings',**{'settings-'+k:v for k,v in [('account','Account'),('devices','Devices'),('general','General'),('appearance','Appearance'),('voice','Voice & Live'),('notifications','Notifications'),('connections','Connections'),('billing','Usage & Billing'),('privacy','Data & Privacy'),('shortcuts','Shortcuts'),('about','About')]}}
def run(code,name):
 p=ROOT/(name+'.js');p.write_text(code)
 env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude.js',SK_MAX='50000')
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],env=env,text=True,capture_output=True)
 (ROOT/(name+'.log')).write_text(r.stdout+r.stderr)
 if r.returncode:raise RuntimeError(name+': '+r.stdout+r.stderr)
 s=r.stdout.strip();return json.loads(s[1:-1] if s.startswith("'") else s)
if __name__=='__main__':
 ledger=json.loads((ROOT/'ledger.json').read_text()) if (ROOT/'ledger.json').exists() else []
 for app in ['Light/Clean','Dark/Clean']:
  for idx,id in enumerate(IDS):
   if any(x['app']==app and x['id']==id for x in ledger):continue
   config={'id':id,'app':app,'index':idx};base=id.split('--')[0];key=app.split('/')[0]+'-'+id
   cfg='var CONFIG='+json.dumps(config)+';\n'
   shell=cfg+"var o="+json.dumps({'page':'Proto iOS '+app.split('/')[0],'app':app,'id':id,'x':idx*510,'y':1004,'title':TITLES[base],'back':False if base in ['projects','recent','settings'] else True,'tab':base if base in ['projects','recent','settings'] else False,'gap':16})+";"
   if base in ['projects','routines']:shell+="o.trailing='plus';o.trailingLink='"+base+"--new';"
   if id in ['artifacts--detail','artifacts--code']:shell+="o.trailing='upload';o.trailingLink='artifacts--share';"
   shell+="var i=H.iosScreen(o);i.body.stackLayout.alignItems=sketch.StackLayout.AlignItems.Start;i.finish();var cap=H.text({parent:i.screen.parent,text:CONFIG.id,size:13,color:H.sw(CONFIG.app,'tertiary')});cap.frame.x=o.x;cap.frame.y=976;H.out({id:i.screen.id});"
   if (ROOT/(key+'-shell.log')).exists():
    raw=(ROOT/(key+'-shell.log')).read_text().strip();result=json.loads(raw[1:-1]);fid=result['id']
    run("var s=sketch.find('#"+fid+"',doc)[0];var b=s.layers.find(l=>l.name==='body');b.layers.slice().forEach(l=>l.remove());H.out({id:s.id});",key+'-clear-partial')
   else:
    result=run(shell,key+'-shell');fid=result['id']
   content=cfg+(ROOT/'components.js').read_text()+"\nvar s=sketch.find('#"+fid+"',doc)[0];var body=s.layers.find(l=>l.name==='body');render(body,BASE);H.order(body);H.relayout(s);s.frame.x=CONFIG.index*510;s.frame.y=1004;H.out({id:s.id,w:s.frame.width,h:s.frame.height});"
   run(content,key+'-body')
   ledger.append({'app':app,'id':id,'frame':fid})
   (ROOT/'ledger.json').write_text(json.dumps(ledger,indent=2))
   print(key,fid,flush=True)
