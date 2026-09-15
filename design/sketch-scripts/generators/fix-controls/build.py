from pathlib import Path
import re,json
P=Path('/tmp/harso-sk/lanes/fix-controls'); S=Path('/tmp/harso-sk/lanes/controls')
fams=['Button','ButtonGroup','Input','InputOtp','LinkButton','Dropdown','FileUpload','ThemeToggle','SocialButton']
for fam in fams:
 c=(S/(fam+'.js')).read_text()
 c=c.replace("if(existing) throw new Error('Sheet already exists '+existing.id);", "if(!existing) throw new Error('Missing original sheet');var X=existing.frame.x;var OLDY=existing.frame.y;H.dropSheet('Controls',FAMILY+' — '+APP);")
 c=re.sub(r'var Y=previous.reduce[^\n]+', 'var Y=OLDY;',c)
 c=c.replace('x:APPS.indexOf(APP)*1600','x:X')
 c=c.replace("H.out({ok:true", "sh.frame.x=X;sh.frame.y=Y;H.out({ok:true")
 c=c.replace("if(state==='hover'&&variant==='secondary')fill='hover';", "if(state==='hover'&&variant==='secondary')fill='hover';")
 if fam=='Button':
  c=c.replace("'Saving changes'", "(label==='Remove'?'Removing…':label==='Continue'?'Continuing…':label==='Not now'?'Deferring…':'Exploring…')")
  c=c.replace("v==='secondary'?'clock':'arrowRight'", "v==='secondary'?'clock':v==='primary'?'arrowRight':'compass'")
  c=c.replace("return b;}\nfunction field", "if(primary&&state==='hover')b.style.fills=[{color:H.alpha(H.hex(APP,'ink'),0.86),fillType:sketch.Style.FillType.Color}];if(primary&&!iconOnly&&state!=='loading'){var txt=b.layers.find(l=>l.type==='Text');if(txt)txt.index=0;}return b;}\nfunction field")
  c="H.paths.compass='<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m16.2 7.8-2.4 6-6 2.4 2.4-6z\"/>';\n"+c
 if fam=='ButtonGroup':
  a=c.index("['pdf','markdown','html']");b=c.index('finishOrder(sh)',a)
  c=c[:a]+"""['pdf','markdown','disabled'].forEach(selected=>{var r=row('Export formats · '+selected);var s=sym(r,'formats/'+selected,'row',0,3,undefined,42,'panel','line',10);['PDF','Markdown','HTML'].forEach(x=>{var dis=x==='HTML'||selected==='disabled';var b=button(s,'segment',x,'ghost','default',false,false);if(dis)b.layers.find(l=>l.type==='Text').style.textColor=H.sw(APP,'tertiary');if(x.toLowerCase()===selected){b.style.fills=[{color:H.sw(APP,'surface'),fillType:sketch.Style.FillType.Color}];b.style.borders=[{color:H.sw(APP,'line'),thickness:1,position:sketch.Style.BorderPosition.Inside}];}});});var r=row('Icon pair · selected chat');var s=sym(r,'icons/default','row',0,3,undefined,42,'panel','line',10);var chat=button(s,'segment','','ghost','default',false,true,'chat');chat.style.fills=[{color:H.sw(APP,'surface'),fillType:sketch.Style.FillType.Color}];chat.style.borders=[{color:H.sw(APP,'line'),thickness:1,position:sketch.Style.BorderPosition.Inside}];button(s,'segment','','ghost','default',false,true,'file');
"""+c[b:]
  c="H.paths.chat='<path d=\"M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z\"/>';\n"+c
 if fam=='Input':
  c=c.replace("b.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;if(kind===", "b.stackLayout.alignItems=kind==='textarea'?sketch.StackLayout.AlignItems.Start:sketch.StackLayout.AlignItems.Center;if(kind==='textarea')b.stackLayout.padding={top:12,right:12,bottom:12,left:12};if(kind===")
  c=c.replace("var tx=state==='filled'?'Research studio'", "var tx=state==='filled'?(kind==='textarea'?'A shared space for our research.':kind==='search'?'Research notes':'Research studio')")
  c=c.replace("t(b,'⌘K','tertiary'", "t(b,'⌘K','secondary'")
  c=c.replace(":'A new beginning';", ":state==='invalid'?'Project name':'A new beginning';")
  start=c.index("var r=row('Trailing select")
  end=c.index('finishOrder(sh)',start)
  c=c[:start]+"['default','filled','focus','invalid','disabled'].forEach(st=>{var r=row('Trailing select · Textarea · Search · '+st);field(r,'Input/'+APP+'/trailing-select/'+st,'',st,'trailing');field(r,'Input/'+APP+'/textarea/'+st,'',st,'textarea');field(r,'Input/'+APP+'/search/'+st,'',st,'search');});\n"+c[end:]
 if fam=='InputOtp':
  c=c.replace("t(s,'Six characters. Paste or type; submit when ready.','tertiary',12)", "t(s,st==='invalid'?'Invalid code. Check all six characters and try again.':'Six characters. Paste or type; submit when ready.',st==='invalid'?'negative':'tertiary',12)")
  c=c.replace("for(var i=0;i<6;i++){", "for(var i=0;i<6;i++){if(i===3)fr(cells,'group gap','row',0,0,8,1);")
 if fam=='LinkButton':
  c=c.replace("var r=row('Inline links');['default'", "var r=row('Inline links · navigation and local action');['default'")
  c=c.replace("var s=sym(r,'text/'+st", "['Explore buttons','Local action · 0'].forEach((label,i)=>{var s=sym(r,(i?'local-action/':'text/')+st")
  c=c.replace("t(s,'Explore buttons'", "t(s,label")
  c=c.replace("w:106", "w:tx.frame.width")
  c=c.replace("st==='disabled'?'faint':'secondary'", "st==='disabled'?'faint':st==='hover'?'accent':'ink'")
  c=c.replace("thickness:2}];});", "thickness:2,position:sketch.Style.BorderPosition.Inside}];});});")
 if fam=='Dropdown':
  c=c.replace("if(st==='open')menu(s,['Balanced','Fast','Reasoning','Research'],0);", "if(st==='open')menu(s,['Balanced','Fast','Reasoning','Research'],0);var workspace=sym(r,'workspace/'+st,'col',8);var wb=button(workspace,'trigger','Research studio','secondary',st==='open'?'default':st,false,false,'users');if(st==='disabled')wb.layers.find(l=>l.type==='Text').text='Research studio';ic(wb,'chevronDown');")
  c="H.paths.users='<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>';\n"+c
 if fam=='FileUpload':
  c=c.replace("var hd=fr(s,'heading'", "s.style.borderOptions={dashPattern:[4,4]};var hd=fr(s,'heading'")
  c=c.replace("button(s,'choose'", "var picker=fr(s,'file picker','row',12);button(picker,'choose'")
  c=c.replace("else t(s,'No file chosen'", "else t(picker,'No file chosen'")
 if fam=='ThemeToggle':
  c=c.replace("});});\nfinishOrder", "});var compact=sym(r,'compact/'+sel,'row',8,0,undefined,36);var cb=button(compact,'toggle','','ghost','default',false,true,'contrast');t(compact,'Compact control','secondary',13);});\nfinishOrder")
  c="H.paths.contrast='<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3a9 9 0 0 0 0 18Z\" fill=\"currentColor\"/>';\n"+c
  c=c.replace("ic(p,key,role,size){return H.icon({parent:p,d:H.paths[key]", "ic(p,key,role,size){return H.icon({parent:p,d:H.paths[key].replace(/currentColor/g,H.hex(APP,role||'secondary'))")
 if fam=='SocialButton':
  start=c.index("['Google','GitHub','Apple'].forEach");end=c.index('finishOrder(sh)',start)
  c=c[:start]+"""['Google','GitHub','Apple'].forEach(provider=>{var r=row(provider);['default','hover','disabled','loading'].forEach(st=>{var black=provider==='GitHub'&&st!=='disabled';var role=st==='disabled'?'tertiary':black?'inverse':'ink';var b=fr(r,'SocialButton/'+APP+'/'+provider.toLowerCase()+'/'+st,'row',8,{top:0,right:14,bottom:0,left:14},undefined,36,black?'ink':st==='hover'?'hover':st==='disabled'?'panel':null,black?null:'control-line',8);b.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;var svg=SOCIAL[provider].replace(/currentColor/g,H.hex(APP,role));var mark=sketch.createLayerFromData(svg,'svg');mark.name='brand mark';mark.parent=b;mark.frame.width=16;mark.frame.height=16;t(b,st==='loading'?'Signing in with '+provider+'…':'Continue with '+provider,role);if(st==='loading')ic(b,'loader',role);});});
"""+c[end:]
 (P/(fam+'.js')).write_text(c)
print('Prepared',len(fams),'generators')
