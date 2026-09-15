from build import *
ledger=json.loads((ROOT/'ledger.json').read_text())
assert len(ledger)==len(IDS)*2,(len(ledger),len(IDS))
overlays=['projects--new','routines--new','settings--sign-out','settings-billing--plan','artifacts--share']
for entry in ledger:
 id,app,fid=entry['id'],entry['app'],entry['frame'];key=app.split('/')[0]+'-'+id
 if id in overlays and not (ROOT/(key+'-overlay.log')).exists():
  code='var CONFIG='+json.dumps(entry)+';\n'+(ROOT/'components.js').read_text()+"\nvar s=sketch.find('#"+fid+"',doc)[0];\n"+(ROOT/'overlay.js').read_text()
  run(code,key+'-overlay')
print('Overlays complete',flush=True)
# readback and constrained, local refinements to this lane only
code='var records='+json.dumps(ledger)+''';var result=[];
records.forEach(function(e){var s=sketch.find('#'+e.frame,doc)[0];var links=[];function walk(l){
 if(l.name.indexOf('link:')===0)links.push(l.name);
 if(l.name==='link:back'&&l.parent&&(l.parent.name==='Sheet'||l.parent.name==='ActionSheet')){l.style.fills=[{color:H.sw(e.app,'surface'),fillType:sketch.Style.FillType.Color}];l.layers.filter(x=>x.type==='Text').forEach(x=>x.style.textColor=H.sw(e.app,'accent'));}
 if(l.name==='copy'){l.stackLayout.gap=5;l.stackLayout.padding={top:2,right:0,bottom:2,left:1};l.layers.filter(x=>x.type==='Text').forEach(x=>{x.frame.width=Math.min(x.frame.width,l.frame.width-2);});}
 if(l.type==='SymbolInstance'&&l.symbolId===doc.getSymbols().find(m=>m.name==='EmptyState/'+e.app+'/default').symbolId){l.overrides.filter(o=>o.property==='stringValue').forEach(o=>{if(String(o.value).indexOf('Deliverables')===0)o.value='Deliverables from your work will land here\\nonce they exist. Your conversations\\naren’t affected.';});l.frame.height=260;}
 if(l.type==='SymbolInstance'&&l.name==='link:search'){l.overrides.filter(o=>o.property==='stringValue'&&String(o.value).indexOf('⌘')>=0).forEach(o=>o.value='');}
 if(l.name==='link:back'&&l.frame.height<44){l.frame.height=44;l.verticalSizing=sketch.FlexSizing.Fixed;}
 if(l.parent&&l.parent.name==='trailing'&&l.name.indexOf('link:')===0){l.frame.width=44;l.frame.height=44;}
 if(l.type==='Text'&&l.text==='MIGRATION NOTES'){l.frame.width=318;}
 (l.layers||[]).forEach(walk);
}walk(s);H.relayout(s);if(!s.layers.find(l=>l.name==='gesture-indicator')&&s.layers.find(l=>l.name==='tab-bar')){var indicator=H.rect({name:'gesture-indicator',w:134,h:5,radius:3,fill:H.sw(e.app,'ink')});s.stackLayout=null;indicator.parent=s;indicator.frame.x=128;indicator.frame.y=832;}
 s.frame.width=390;s.frame.height=844;s.frame.x=records.filter(x=>x.app===e.app).findIndex(x=>x.id===e.id)*510;s.frame.y=1004;
 var body=s.layers.find(l=>l.name==='body');result.push({app:e.app,id:e.id,frame:s.id,w:s.frame.width,h:s.frame.height,x:s.frame.x,y:s.frame.y,links:links,bodyH:body.frame.height,children:body.layers.map(l=>({name:l.name,y:l.frame.y,h:l.frame.height,w:l.frame.width}))});
});H.out(result);'''
res=run(code,'verify');(ROOT/'verified.json').write_text(json.dumps(res,indent=2))
for e in ledger:
 tag='ios-manage-'+e['app'].split('/')[0]+'-'+e['id']
 env=dict(os.environ,SK_TAG=tag)
 r=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':e['frame']})],env=env,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 print(tag,flush=True)
print('Exported',len(ledger),flush=True)
