import pathlib,json,subprocess,os,sys
D=pathlib.Path('/tmp/harso-sk/proto/lanes/v3-mac-core')
ids=['signin','new-conversation','conversation','conversation--approval','conversation--menu','conversation--delete','search','activity','activity--work','conversation--rail','activity--work--rail']
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude3.js')
def call(tool,args,tag=None):
 e=dict(env)
 if tag:e['SK_TAG']=tag
 try:r=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],env=e,text=True,capture_output=True,timeout=60)
 except subprocess.TimeoutExpired:
  subprocess.run(['node','/tmp/harso-sk/ping.js'],timeout=60);raise
 if r.returncode or 'Error:' in r.stdout:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
common=(D/'common.js').read_text()
smoke=pathlib.Path('/tmp/harso-sk/proto/smoke5.js').read_text().splitlines()
def execute(app,id,phase,body):
 h=f'var APP={json.dumps(app)}, ID={json.dumps(id)}, INDEX={ids.index(id)}, PHASE={json.dumps(phase)};\n'
 p=D/f'{id}-{phase}-{app.split("/")[0]}.js';p.write_text(h+common+'\n'+body)
 out=call('run_code',{'code_file':str(p)})
 with (D/'frames.jsonl').open('a') as f:f.write(out.strip()+'\n')
 print(out.strip(),flush=True)
 return out
shell="""page.layers.filter(function(l){return l.name==='Screen/macos/'+APP+'/'+ID || l.name==='caption/macos/'+APP+'/'+ID;}).forEach(function(l){l.remove();});
s=H.screen({page:pageName,platform:'macos',app:APP,id:ID,w:1440,h:900,x:INDEX*1560,y:0});
var rail=ID.indexOf('--rail')>=0;
"""
for app in sys.argv[1:2] or ['Light/Clean','Dark/Clean']:
 for id in ids:
  if len(sys.argv)>2 and id not in sys.argv[2:]:continue
  if id.startswith('conversation'):
   execute(app,id,'shell',shell+smoke[4].replace("inspector: 'Context'","collapseLink:'conversation--rail', inspector: 'Context'")+"\nw.finish();finish();")
   execute(app,id,'thread',"var w={main:named(s,'main')};\n"+'\n'.join(smoke[5:14])+"\nH.order(m);named(s,'content-col').stackLayout.apply();s.stackLayout.apply();finish();")
   execute(app,id,'inspector',"var w={inspector:named(s,'inspector')};\n"+'\n'.join(smoke[14:26])+"\nH.order(ib);H.order(w.inspector);s.stackLayout.apply();finish();")
   if id in ['conversation--approval','conversation--menu','conversation--delete']:execute(app,id,'overlay',(D/'overlay.js').read_text())
  else:
   title={'signin':'Welcome to Weave','new-conversation':'New conversation','search':'Search'}.get(id,'Activity')
   opts={'rail':id.endswith('--rail'),'active':id if not id.startswith('activity') else 'activity','title':title,'search':False,'inspector':'Work' if id.startswith('activity--work') else False,'collapseLink':'activity--work--rail' if id.startswith('activity--work') else 'back','inspectorClose':'activity'}
   execute(app,id,'shell',shell+'var w=H.macWindow(s,APP,'+json.dumps(opts)+');'+("named(w.sidebar,'list').remove();named(w.sidebar,'link:settings').remove();" if id=='signin' else '')+'w.finish();finish();')
   execute(app,id,'content',(D/'content.js').read_text())
   if id.startswith('activity--work'):execute(app,id,'work',(D/'work.js').read_text())
  out=call('get_screenshot',{'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':json.loads((D/'frames.jsonl').read_text().splitlines()[-1].strip("'"))['frame']},'v3-core-'+app.split('/')[0]+'-'+id)
  print(out,flush=True)
