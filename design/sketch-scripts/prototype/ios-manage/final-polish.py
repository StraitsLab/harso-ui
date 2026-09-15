from build import *
L=json.loads((ROOT/'ledger.json').read_text())
code='var entries='+json.dumps(L)+''';var result=[];entries.forEach(e=>{var s=sketch.find('#'+e.frame,doc)[0];function walk(l){if(l.type==='Text'&&l.parent.name==='copy'&&l.style.fontSize===12){l.text=' '+l.text.trim();}if(l.type==='SymbolInstance'&&l.name==='link:search'){l.overrides.filter(o=>o.property==='stringValue').forEach(o=>{if(String(o.value).indexOf('Search')<0)o.value=' ';});} (l.layers||[]).forEach(walk);}walk(s);var tab=s.layers.find(l=>l.name==='tab-bar');if(tab){s.stackLayout=null;tab.frame.x=0;tab.frame.y=746;var i=s.layers.find(l=>l.name==='gesture-indicator');if(!i)i=H.rect({parent:s,name:'gesture-indicator',w:134,h:5,radius:3,fill:H.sw(e.app,'ink')});i.frame.x=128;i.frame.y=832;i.index=s.layers.length-1;}
if(e.id==='projects--new'&&e.app==='Light/Clean'){var sh=s.layers.find(l=>l.name==='Sheet');var g=sh.layers.find(l=>l.name==='GroupBox');if(g){var r=g.layers[0];r.layers.filter(l=>l.type!=='Group'||l.name!=='copy').forEach(l=>l.remove());H.relayout(g);}}
result.push({id:e.id,app:e.app,tab:tab?tab.frame:null,indicator:s.layers.find(l=>l.name==='gesture-indicator')?.frame});});H.out(result);'''
run(code,'final-polish')
print('Polished',len(L))
