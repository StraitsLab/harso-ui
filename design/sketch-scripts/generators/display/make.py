from pathlib import Path
P=Path('/tmp/harso-sk/lanes/display')
B={}
B['Avatar']="""
function av(p,n,s,image,status){var a=sy(p,n,{w:s,h:s,radius:999,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),justify:sketch.StackLayout.JustifyContent.Center});if(image)ic(a,'user',s===24?14:20);else tx(a,s===24?'JL':s===32?'S':'AM',s===24?12:14,'ink',null,6);if(status){var d=dot(a,8,'positive-mark');d.stackLayoutItem={ignored:true};d.frame.x=s-8;d.frame.y=s-8;}return a;}
[24,32,40].forEach(s=>{var r=row(s+'px · initials, placeholder, online');av(r,s+'/initials',s,false,false);av(r,s+'/image-placeholder',s,true,false);av(r,s+'/status',s,false,true);});
var r=row('Avatar group');var g=sy(r,'group/default',{gap:0});['AM','S','JL','+2'].forEach(t=>{var a=fr(g,'avatar',{w:32,h:32,radius:999,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),justify:sketch.StackLayout.JustifyContent.Center});tx(a,t,12,'ink',null,6);});
"""
B['Badge']="""
var vals=[['neutral','secondary','Draft'],['positive','positive','Complete'],['attention','attention','Needs your input'],['negative','negative','Couldn’t finish'],['accent','accent','Working']];
['plain','dot'].forEach(v=>{var r=row(v);vals.forEach(a=>{var b=sy(r,a[0]+'/'+v,{gap:6});if(v==='dot')dot(b,6,a[0]==='neutral'?'tertiary':a[1]+'-mark');tx(b,a[2],12,a[1],null,6);});});
"""
B['Chip']="""
['default','bold','caption','dismissible','leading-icon'].forEach(v=>{var r=row(v);var b=sy(r,v+'/default',{gap:6,pad:{top:4,right:8,bottom:4,left:8},radius:999,fill:v==='caption'?null:H.sw(APP,v==='bold'?'ink':'hover')});if(v==='leading-icon')ic(b,'sparkles',14);tx(b,'Working',12,v==='bold'?'inverse':'ink',null,6);if(v==='dismissible')ic(b,'x',14);});
"""
B['Announcement']="""
[['info','accent','sparkles'],['attention','attention','alert'],['negative','negative','circleX']].forEach(a=>{var r=row(a[0]);var b=sy(r,a[0]+'/default',{gap:12,pad:16,radius:16,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});ic(b,a[2],20,a[1]);var c=col(b,'content',{gap:6});tx(c,'A little more room to think.',14,'ink',450,6);tx(c,'Your work, with fewer distractions.',13,'secondary',450);tx(b,'Take a look →',13,'accent',null,6);});
"""
B['Notification']="""
[['info','accent','info'],['positive','positive','circleCheck'],['attention','attention','alert'],['negative','negative','circleX']].forEach(a=>{var r=row(a[0]);[false,true].forEach(action=>{var b=sy(r,a[0]+'/'+(action?'action':'default'),{gap:12,pad:16,radius:16,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),shadow:{color:'#0000001f',blur:24,spread:0,x:0,y:8},align:sketch.StackLayout.AlignItems.Start});var glyph=fr(b,'app glyph',{w:32,h:32,justify:sketch.StackLayout.JustifyContent.Center,fill:H.sw(APP,'hover'),radius:8});ic(glyph,a[2],20,a[1]);var c=col(b,'content',{gap:6});tx(c,'Work unit updated',14,'ink',230,6);tx(c,'The latest result is ready.',13,'secondary',230);if(action)pill(c,'View result',true);ic(b,'x',16);});});
"""
B['Tooltip']="""
['top','bottom'].forEach(v=>{var r=row(v+' arrow');var b=sy(r,v+'/default',{dir:'col',gap:0});function arrow(){var z=H.rect({parent:b,w:8,h:8,fill:H.sw(APP,'ink')});z.transform.rotation=45;}if(v==='top')arrow();var body=fr(b,'hint',{pad:{top:8,right:12,bottom:8,left:12},radius:999,fill:H.sw(APP,'ink')});tx(body,'Copy a link to this sample',13,'inverse');if(v==='bottom')arrow();});
"""
B['Divider']="""
var r=row('Horizontal');var b=sy(r,'horizontal/default',{w:600,h:1});line(b,600);
r=row('With label');b=sy(r,'label/default',{gap:16});line(b,240);tx(b,'or continue with',12,'tertiary');line(b,240);
r=row('Vertical');b=sy(r,'vertical/default',{w:1,h:40});H.rect({parent:b,w:1,h:40,fill:H.sw(APP,'line')});
"""
B['Carousel']="""
var r=row('Card and page control');var b=sy(r,'default',{dir:'col',gap:20,pad:24,w:540,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});tx(b,'01 / Research',12,'tertiary');tx(b,'A clearer direction',20,'ink',null,6);tx(b,'A quiet place for the things worth keeping.',14,'secondary');var nav=fr(b,'page control',{gap:24,w:492,justify:sketch.StackLayout.JustifyContent.Center});['prev','dots','next'].forEach(v=>{if(v==='dots'){var d=fr(nav,'dots',{gap:8});[true,false,false].forEach(on=>dot(d,6,on?'ink':'faint'));}else{var q=fr(nav,v,{w:28,h:28,radius:8,fill:H.sw(APP,'hover'),justify:sketch.StackLayout.JustifyContent.Center});ic(q,v==='next'?'chevronRight':'<path d="m15 18-6-6 6-6"/>');}});
"""
B['Pagination']="""
var r=row('Current page · 2');var b=sy(r,'default',{gap:6});['‹','1','2','3','…','12','›'].forEach(t=>{var p=fr(b,'page',{w:32,h:32,radius:8,fill:H.sw(APP,t==='2'?'ink':'hover'),justify:sketch.StackLayout.JustifyContent.Center});tx(p,t,14,t==='2'?'inverse':'ink',null,6);});
"""
B['Breadcrumb']="""
var r=row('Three levels');var b=sy(r,'default',{gap:8});['Home','Projects','Weave'].forEach((t,i)=>{if(i)ic(b,'chevronRight',14,'tertiary');tx(b,t,14,i===2?'ink':'secondary',null,i===2?6:5);});
"""
B['Tabs']="""
['underline','icons','counts'].forEach(v=>{var r=row(v);var b=sy(r,v+'/default',{gap:0});['Overview','Activity','Files'].forEach((t,i)=>{var c=col(b,'tab',{gap:10});var q=fr(c,'label row',{h:32,pad:{top:0,right:16,bottom:0,left:16},gap:8});if(v==='icons')ic(q,['home','clock','file'][i],16,i===0?'ink':'secondary');tx(q,t,14,i===0?'ink':'secondary',null,6);if(v==='counts'){var n=fr(q,'count',{radius:999,pad:4,fill:H.sw(APP,'hover')});tx(n,['12','8','3'][i],12,'secondary');}H.rect({parent:c,w:v==='icons'?132:v==='counts'?152:110,h:2,fill:H.sw(APP,i===0?'ink':'line')});});});
"""
B['SegmentedControl']="""
['three','four','icons','disabled'].forEach(v=>{var r=row(v);var b=sy(r,v+'/default',{gap:4,pad:4,radius:8,fill:H.sw(APP,'hover')});(v==='four'?['Overview','Activity','Files','Settings']:['Overview','Activity','Files']).forEach((t,i)=>{var p=fr(b,'segment',{h:32,pad:{top:0,right:14,bottom:0,left:14},radius:6,fill:i===0?H.sw(APP,'surface'):null});if(v==='icons')ic(p,['home','clock','file'][i],16);tx(p,t,14,v==='disabled'?'tertiary':i===0?'ink':'secondary',null,6);});});
"""
B['Table']="""
var r=row('Sortable · hover · selected');var b=sy(r,'default',{dir:'col',gap:0,pad:8,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});
[['Work','Sources','Status'],['Launch research','12','Complete'],['Market signals','8','Working'],['Source review','24','Needs input'],['Decision log','4','Draft']].forEach((a,i)=>{var q=fr(b,i===0?'header':'row',{gap:16,pad:{top:0,right:16,bottom:0,left:16},h:44,w:700,radius:6,fill:i===2?H.sw(APP,'hover'):i===3?H.sw(APP,'accent-soft'):null});var check=H.rect({parent:q,w:14,h:14,radius:3,border:H.sw(APP,'control-line'),fill:i===3?H.sw(APP,'ink'):null});var title=fr(q,'work',{w:300,gap:8});tx(title,a[0],13,i===0?'secondary':'ink',null,i===0?6:5);if(i===0)ic(title,'chevronDown',14);H.text({parent:q,text:a[1],size:13,color:H.sw(APP,i===0?'secondary':'ink'),w:90,align:sketch.Text.Alignment.right});tx(q,a[2],13,i===1?'positive':i===3?'attention':'secondary',170);if(i<4){var sep=fr(b,'separator',{pad:{top:0,right:16,bottom:0,left:46}});line(sep,638);}});
"""
B['Typography']="""
var r=row('Compact scale for clear, everyday work');var b=sy(r,'specimen/default',{dir:'col',gap:20,align:sketch.StackLayout.AlignItems.Start});[['Heading · 24','A little more clarity.',24,'ink',6],['Title · 20','Make room for focused work',20,'ink',6],['Body · 15','Keep the conversation moving.',15,'ink',5],['Body · 14','Your workspace is up to date',14,'ink',5],['Secondary · 13','Bring references, decisions, and next steps together.',13,'secondary',5],['Caption · 12','Updated just now · Visible to your team',12,'tertiary',5],['Mono · 13','src/workspace.tsx',13,'secondary',5],['Link','Explore your workspace →',14,'accent',6]].forEach(a=>{var q=fr(b,'type row',{gap:24});tx(q,a[0],12,'tertiary',140);var t=tx(q,a[1],a[2],a[3],640,a[4]);if(a[0].startsWith('Mono'))t.style.fontFamily='JetBrains Mono';});
"""
B['Progress']="""
var r=row('Linear determinate · 50%');var b=sy(r,'linear/50',{gap:0,w:320,h:4,radius:2,clip:true});H.rect({parent:b,w:160,h:4,fill:H.sw(APP,'accent-mark')});H.rect({parent:b,w:160,h:4,fill:H.sw(APP,'line')});
r=row('Indeterminate · 16 / 20 / 32');[16,20,32].forEach(s=>{var b=sy(r,'spinner/'+s,{w:s,h:s});ic(b,'loader',s,'accent');});
r=row('Circular determinate · 25 / 50 / 75%');[25,50,75].forEach(v=>{var b=sy(r,'circular/'+v,{w:20,h:20});var end=v===25?'20 12':v===50?'12 20':'4 12';var path='<circle cx="12" cy="12" r="8" stroke="'+H.hex(APP,'line')+'"/><path d="M12 4 A8 8 0 '+(v===75?'1':'0')+' 1 '+end+'"/>';ic(b,path,20,'accent');});
"""
B['Disclosure']="""
['closed','open'].forEach(v=>{var r=row(v);var b=sy(r,'row/'+v,{h:36,w:320,gap:8});ic(b,v==='closed'?'chevronRight':'chevronDown',16);tx(b,'Advanced options',14,'ink',null,6);});
"""
B['EmptyState']="""
var r=row('Empty workspace');var b=sy(r,'default',{dir:'col',gap:12,pad:32,w:480,align:sketch.StackLayout.AlignItems.Center});ic(b,'folder',32,'tertiary');tx(b,'No projects yet',16,'ink',null,6);tx(b,'Create a project to bring your work together.',14,'secondary');pill(b,'Create project',true);
"""
for fam,body in B.items():
 (P/(fam+'.js')).write_text("var APP = 'Light/Clean';\nvar FAMILY = '"+fam+"';\n"+(P/'common.js').read_text()+body+'\nfinish();\n')
(P/'families.json').write_text(__import__('json').dumps(list(B)))
print('Generated',len(B),'family scripts')
