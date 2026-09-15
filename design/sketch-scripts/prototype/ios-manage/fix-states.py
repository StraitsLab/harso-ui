from build import *
L=json.loads((ROOT/'ledger.json').read_text())
code='var records='+json.dumps([x for x in L if x['id'] in ['project--work','project--empty']])+''';records.forEach(e=>{var s=sketch.find('#'+e.frame,doc)[0];var b=s.layers.find(l=>l.name==='body');if(e.id==='project--empty'){var c=b.layers.find(l=>l.name==='link:new-conversation'&&l.type!=='SymbolInstance');if(c)c.remove();}else{var seg=b.layers.find(l=>l.name==='segmented-control');seg.layers.forEach(l=>l.style.fills=l.name==='link:project--work'?[{fillType:sketch.Style.FillType.Color,color:H.sw(e.app,'surface')}]:[]);}H.relayout(s);});H.out({fixed:records.length});'''
print(run(code,'fix-states'))
