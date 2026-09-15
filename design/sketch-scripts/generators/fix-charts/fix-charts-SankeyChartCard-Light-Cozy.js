var APP="Light/Cozy";var CFG=["SankeyChartCard", "sankey", "Where the money goes", "Synthetic USD flow \u00b7 Follow a node or a connection", ["Home", "Everyday", "Savings"]];
// Reference-faithful chart geometry. All marks and legend keys share C role colours.
var C={}; ['accent','secondary','tertiary','line','ink','surface','hover','inverse'].forEach(k=>C[k]=H.hex(APP,k));
function plot(kind){
var s=[],W=960,HH=210,a=C.accent,b=C.secondary,c=C.tertiary,g=C.line;
function text(x,y,v,anchor,col,size){s.push('<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'start')+'" font-family="Inter" font-size="'+(size||12)+'" fill="'+(col||C.secondary)+'">'+v+'</text>');}
function rect(x,y,w,h,col,op,r){if(w<=0||h<=0)return;s.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(r===undefined?3:r)+'" fill="'+col+'" opacity="'+(op===undefined?1:op)+'"/>');}
function path(d,col,width,fill,extra){s.push('<path d="'+d+'" stroke="'+(col||'none')+'" stroke-width="'+(width===undefined?2:width)+'" fill="'+(fill||'none')+'" stroke-linejoin="round" '+(extra||'')+'/>');}
function circle(x,y,r,col,width,extra){s.push('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+width+'" '+(extra||'')+'/>');}
function axis(labels,ticks,title,right){if(title)text(0,14,title);if(right)text(960,14,'Conversion','end');[0,1,2].forEach(i=>{var yy=172-i*70;path('M64 '+yy+'H896',g,1);text(51,yy+4,ticks[i],'end');if(right)text(910,yy+4,right[i]);});labels.forEach((v,i)=>text(72+i*816/(labels.length-1),194,v,'middle'));}
function arc(cx,cy,r,start,end,col,ww){var p=(ang)=>[cx+r*Math.cos(ang),cy+r*Math.sin(ang)];var p1=p(start),p2=p(end);path('M'+p1.join(' ')+' A'+r+' '+r+' 0 '+(end-start>Math.PI?1:0)+' 1 '+p2.join(' '),col,ww);}
if(['barlist','stages'].includes(kind)){
text(960,14,'Max 0.5','end');['Stage 1','Stage 2','Stage 3'].forEach((v,i)=>{var y=39+i*59;text(0,y,v,'start',C.ink);text(960,y,[0,.25,.5][i],'end',C.ink);rect(0,y+12,960,10,g);rect(0,y+12,i*480,10,a);});}
if(kind==='contributions') {W=400;HH=80;['Mon','Tue'].forEach((v,i)=>{text(0,20+i*40,v);rect(48,11+i*40,310,10,g);rect(48,11+i*40,155*(i+1),10,a);text(400,20+i*40,[4,8][i],'end',C.ink);});}
if(['earnings','steps','orders'].includes(kind)){
axis(['Stage 1','Stage 2','Stage 3'],['0','0.25','0.5']);HH=230;
[0,.25,.5].forEach((v,i)=>{var x=160+i*320,h=v*280;if(kind==='orders'){rect(x-46,172-h,42,h,a);rect(x+4,172-h/2,42,h/2,b);}else rect(x-32,172-h,64,h,a);text(x,213,kind==='orders'?['0 / 0','0.25 / 0.125','0.5 / 0.25'][i]:String(v),'middle',C.ink);});
// Category centers and marks align exactly, including zero-value category.
s=s.map(v=>v.replace('x="72" y="194"','x="160" y="194"').replace('x="888" y="194"','x="800" y="194"'));}
if(kind==='funnel'){
HH=220;text(960,14,'Max 0.5','end');
path('M480 36 C480 60 276 75 276 105 C276 142 70 156 70 183 L70 205 L890 205 L890 183 C890 156 684 142 684 105 C684 75 480 60 480 36Z','none',0,a);
[['Stage 1','0',36],['Stage 2','0.25',108],['Stage 3','0.5',204]].forEach(v=>{text(0,v[2],v[0],'start',C.ink);text(960,v[2],v[1],'end',C.ink);});}
if(['line','area','combo','revenue'].includes(kind)){
var rev=kind==='revenue',max=kind==='area'?6100:4100;
axis(rev?['Stage 1','Stage 2','Stage 3']:['January','February','March','April'],rev?['0','0.25','0.5']:['0',kind==='area'?'3,050':'2,050',kind==='area'?'6,100':'4,100'],kind==='combo'?'Sessions':'Value',kind==='combo'?['0%','2.4%','4.8%']:null);
function curve(values,mx){var pts=values.map((v,i)=>[72+i*816/(values.length-1),172-v/mx*140]);var d='M'+pts[0].join(' ');for(var j=1;j<pts.length;j++){var mid=(pts[j-1][0]+pts[j][0])/2;d+=' C'+mid+' '+pts[j-1][1]+' '+mid+' '+pts[j][1]+' '+pts[j].join(' ');}return d;}
var organic=[2400,3200,2800,4100],ref=[700,1000,1000,1300],paid=[350,500,300,700];
if(kind==='area'){
var cumul=[organic,organic.map((v,i)=>v+ref[i]),organic.map((v,i)=>v+ref[i]+paid[i])];
// Paint cumulative areas top-first; lower areas occlude them into true stacked bands.
[2,1,0].forEach(i=>{var dd=curve(cumul[i],6100);path(dd+' L888 172 L72 172Z','none',0,[a,b,c][i],'fill-opacity="'+[.22,.28,.20][i]+'"');});
// Fully opaque tonal bands prevent colours bleeding through lower series.
var base=H.hex(APP,'surface');function mix(hex,opacity){return '#'+[1,3,5].map(k=>Math.round(parseInt(base.slice(k,k+2),16)*(1-opacity)+parseInt(hex.slice(k,k+2),16)*opacity).toString(16).padStart(2,'0')).join('');}
[2,1,0].forEach(i=>path(curve(cumul[i],6100)+' L888 172 L72 172Z','none',0,mix([a,b,c][i],.25)));
[0,1,2].forEach(i=>path(curve(cumul[i],6100),[a,b,c][i],2));
}else if(kind==='combo'){
organic.forEach((v,i)=>rect(54+i*272,172-v/4100*140,36,v/4100*140,b,.6));path(curve([2.6,3.5,3.1,4.8],4.8),a,3);
}else {var dd=curve(rev?[0,.25,.5]:organic,rev?.5:4100);path(dd+' L888 172 L72 172Z','none',0,a,'fill-opacity="0.12"');path(dd,a,3);if(rev)path(curve([0,.125,.25],.5),b,2,'none','stroke-dasharray="5 5"');}
}
if(kind==='heatmap'){
HH=240;text(0,16,'Series');['08:00','10:00','12:00','14:00','16:00','18:00'].forEach((v,i)=>text(205+i*136,16,v,'middle'));
['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach((v,r)=>{text(0,46+r*32,v);for(var co=0;co<6;co++){var val=(r+1)*(co+1);rect(145+co*136,25+r*32,124,26,a,.06+val/30*.30);text(207+co*136,43+r*32,val,'middle',C.ink);}});
s.push('<defs><linearGradient id="scale"><stop stop-color="'+a+'" stop-opacity=".06"/><stop offset="1" stop-color="'+a+'" stop-opacity=".36"/></linearGradient></defs>');text(0,224,'0');rect(22,213,180,12,'url(#scale)');text(215,224,'30');text(255,224,'—  No data');}
if(kind==='activity'||kind==='days'){
HH=145;var zero=kind==='days';var xx=220,cy=72;
(zero?[57]:[59,42,25]).forEach((r,i)=>{circle(xx,cy,r,g,11);var frac=zero?0:[.8,.8,1][i];if(frac===1)circle(xx,cy,r,[a,b,c][i],11);else if(frac>0)arc(xx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*frac,[a,b,c][i],11);});
text(500,15,zero?'1 activity metric':'3 activity metrics');(zero?['Stage 1']:['Move','Exercise','Running']).forEach((v,i)=>{var y=40+i*39;rect(500,y-9,6,6,[a,b,c][i],1,3);text(516,y,v,'start',C.ink);text(770,y,zero?'0 / 1':['480 / 600 kcal','24 / 30 min','5 / 5 km'][i]);text(960,y+17,zero?'Goal · 0%':['Goal · 80%','Goal · 80%','Goal · 100%'][i],'end');path('M516 '+(y+23)+'H960',g,1);});}
if(kind==='radial'){
HH=220;[95,74,53,32].forEach((r,i)=>{circle(480,106,r,g,13);var p=[0,.0025,.75,1][i],col=[a,b,c,a][i];if(p===1)circle(480,106,r,col,13);else if(p>0)arc(480,106,r,-Math.PI/2,-Math.PI/2+Math.PI*2*p,col,13);});}
if(kind==='radar'){
HH=230;function points(vals){return vals.map((v,i)=>{var ang=-Math.PI/2+i*Math.PI/2;return [480+Math.cos(ang)*80*v,105+Math.sin(ang)*80*v];});}function poly(v,col,fill){path('M'+points(v).map(p=>p.join(' ')).join('L')+'Z',col,1,fill);}
[.333,.667,1].forEach(v=>poly([v,v,v,v],g));points([1,1,1,1]).forEach(p=>path('M480 105L'+p.join(' '),g,1));poly([0,.0025,.75,1],a,a+'22');['Speed','Quality','Care','Reach'].forEach((v,i)=>{var p=points([1.24,1.6,1.24,1.5])[i];text(p[0],p[1]+4,v,'middle');});text(480,229,'Guides    33.3    66.7    100','middle');}
if(kind==='sleep'){
HH=185;arc(480,167,130,Math.PI,Math.PI*2,g,24);arc(480,167,130,Math.PI+Math.PI/4,Math.PI+Math.PI/4+Math.PI/12,b,24);arc(480,167,130,Math.PI+Math.PI*2/3,Math.PI+Math.PI*2/3+Math.PI/6,c,24);}
if(kind==='scatter'){
HH=240;text(0,14,'Outcome');[[-8,'-8.0'],[0,'0'],[23.5,'23.5'],[55,'55.0']].forEach(v=>{var y=184-(v[0]+8)/63*150;path('M65 '+y+'H900',g,1,'none',v[0]===0?'stroke-dasharray="4 4"':'');text(52,y+4,v[1],'end');});[12,46,80].forEach((v,i)=>text(72+i*408,205,v,'middle'));text(480,231,'Effort','middle');
[[[12,10,8],[30,25,12],[52,45,16]],[[45,-7,10],[68,35,18],[80,55,12]]].forEach((ser,i)=>ser.forEach(p=>{s.push('<circle cx="'+(72+(p[0]-12)/68*816)+'" cy="'+(184-(p[1]+8)/63*150)+'" r="'+p[2]+'" fill="'+[a,b][i]+'" opacity=".8"/>');}));}
if(kind==='sankey'){
HH=135;var col=b;
// Continuous proportional 3000-unit flow, shared endpoints with node bars.
[[110,15,140,480,25,150],[110,110,30,480,125,150]].forEach(v=>{});
function band(x1,y1,x2,y2,h){path('M'+x1+' '+y1+' C'+(x1+120)+' '+y1+' '+(x2-120)+' '+y2+' '+x2+' '+y2+' L'+x2+' '+(y2+h)+' C'+(x2-120)+' '+(y2+h)+' '+(x1+120)+' '+(y1+h)+' '+x1+' '+(y1+h)+'Z','none',0,col,'fill-opacity=".20"');}
band(120,5,468,15,72);band(120,99,468,87,18);band(482,15,830,0,36);band(482,51,830,48,24);band(482,75,830,85,30);
[[106,5,14,72],[106,99,14,18],[468,15,14,90],[830,0,14,36],[830,48,14,24],[830,85,14,30]].forEach(v=>rect(v[0],v[1],v[2],v[3],col,1,0));text(0,42,'Salary');text(0,112,'Freelance');text(490,64,'Budget');text(860,22,'Home');text(860,66,'Everyday');text(860,105,'Savings');}
return {svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+HH+'" viewBox="0 0 '+W+' '+HH+'">'+s.join('')+'</svg>',h:HH};
}

var page=H.page('Charts'),name=CFG[0]+' — '+APP,old=page.layers.find(l=>l.name===name);if(!old)throw Error('Missing target');var xx=old.frame.x,yy=old.frame.y;H.dropSheet('Charts',name);
var sh=H.sheet({name:name,parent:page,x:xx,y:yy,fill:H.hex(APP,'canvas-deep')});sh.stackLayout.alignItems=sketch.StackLayout.AlignItems.Start;
H.text({parent:sh,text:name,size:20,weight:6,color:H.sw(APP,'ink')});
function frame(parent,name,dir,w,gap){var f=H.frame({parent:parent,name:name,dir:dir,w:w,gap:gap||0});f.stackLayout.alignItems=sketch.StackLayout.AlignItems.Start;return f;}
function txt(parent,text,size,role,w,weight){return H.text({parent:parent,text:text,size:size||12,color:H.sw(APP,role||'secondary'),w:w,weight:weight||5});}
function select(parent,labels,selected){var f=H.frame({parent:parent,name:labels.length===1?'period selector':'segmented control',dir:'row',pad:3,gap:2,radius:8,fill:H.sw(APP,'hover'),border:H.sw(APP,'line'),h:30});labels.forEach((v,i)=>{var q=H.frame({parent:f,name:'option '+v,dir:'row',pad:{top:3,right:10,bottom:3,left:10},h:24,radius:6,fill:i===selected?H.sw(APP,'surface'):null,gap:8});txt(q,v,12,'ink',null,6);if(labels.length===1)H.icon({parent:q,d:H.paths.chevronDown,size:12,color:C.secondary});H.order(q);});H.order(f);return f;}
var card=H.frame({name:CFG[0]+'/'+APP+'/default',parent:sh,dir:'col',gap:12,pad:20,w:1000,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});card.stackLayout.alignItems=sketch.StackLayout.AlignItems.Start;
var hd=frame(card,'header','row',960,16),titles=frame(hd,'titles','col',680,4);txt(titles,CFG[2],14,'ink',680,6);if(CFG[3])txt(titles,CFG[3],12,'secondary',680);H.order(titles);
var controls=frame(hd,'controls','row',264,6);controls.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.End;
if(CFG[1]==='line')select(controls,['Weekly','Monthly','Yearly'],1);else if(CFG[1]==='revenue')select(controls,['Week','Month'],0);else if(!['activity','days','contributions'].includes(CFG[1])){select(controls,[['area','combo'].includes(CFG[1])?'Monthly':CFG[1]==='heatmap'?'Current period':['sankey','scatter'].includes(CFG[1])?'This month':'Week'],0);if(['radial','radar'].includes(CFG[1]))select(controls,[CFG[1]==='radar'?'filled':'rings'],0);}H.order(controls);if(['activity','days','contributions'].includes(CFG[1])){controls.remove();}H.order(hd);
var kind=CFG[1];if(['activity','days'].includes(kind))card.stackLayout.gap=6;
if(['orders','revenue'].includes(kind))txt(card,'Current: 0.75 · Previous: 0.375 · Change: +100%',12,'secondary',960);
else if(kind==='area')txt(card,'Total: 18,350',24,'ink',960,6);
else if(kind==='line')txt(card,'Revenue observations · total: 12,500',14,'ink',960,6);
else if(kind==='combo')txt(card,'Sessions · total: 12,500 · Conversion · average: 3.5%',14,'ink',960,6);
else if(kind==='heatmap')txt(card,'Total: 315 · Compared periods supplied by the host',12,'secondary',960);
else if(kind==='sankey')txt(card,'Source total: $3,000 · Sink total: $3,000',12,'secondary',960);
else if(kind==='scatter')txt(card,'6 observations · Focus or touch a point to inspect',12,'secondary',960);
else if(!['activity','days','contributions'].includes(kind))txt(card,'Focus or touch a value to inspect',12,'secondary',960);
function calendar(parent,selected){var cal=frame(parent,'calendar','col',960,4),nav=frame(cal,'month navigation','row',960,12);txt(nav,'September 2026',13,'ink',864,6);['<path d="m15 18-6-6 6-6"/>',H.paths.chevronRight].forEach(d=>{var btn=H.frame({parent:nav,name:'month button',dir:'row',w:32,h:24,radius:6,fill:H.sw(APP,'hover'),justify:sketch.StackLayout.JustifyContent.Center});H.icon({parent:btn,d:d,size:14,color:C.secondary});H.order(btn);});H.order(nav);var days=frame(cal,'weekdays','row',960,0);['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(v=>{var t=txt(days,v,12,'secondary',137);t.style.alignment='center';});H.order(days);for(var r=0;r<5;r++){var row=frame(cal,'week','row',960,0);for(var c=0;c<7;c++){var n=r*7+c-1,cell=H.frame({parent:row,name:'day '+n,dir:'row',w:137,h:20,justify:sketch.StackLayout.JustifyContent.Center});if(n>=1&&n<=30){var pill=H.frame({parent:cell,name:n===selected?'selected date':'date',dir:'row',w:26,h:20,radius:10,fill:n===selected?H.sw(APP,'ink'):null,justify:sketch.StackLayout.JustifyContent.Center});txt(pill,String(n),12,n===selected?'inverse':'ink');H.order(pill);}H.order(cell);}H.order(row);}H.order(cal);}
if(kind==='days'){calendar(card,1);txt(card,'2026-09-01 activity',13,'ink',960,6);}
var pp=plot(kind),pl=sketch.createLayerFromData(pp.svg,'svg');pl.name='vector plot';pl.parent=card;pl.frame.width=960;pl.frame.height=pp.h;
if(kind==='activity'){txt(card,'Activity days',13,'ink',960,6);calendar(card,7);}
function legend(entries,vertical){var f=frame(card,'series values','row',960,16);if(vertical)f.stackLayout.direction=sketch.StackLayout.Direction.Column;entries.forEach(e=>{var row=frame(f,'series','row',vertical?960:Math.floor((960-(entries.length-1)*16)/entries.length),8);H.rect({parent:row,w:6,h:6,oval:true,fill:H.sw(APP,e[1])});txt(row,e[0],12,'secondary',vertical?930:Math.floor((960-(entries.length-1)*16)/entries.length)-14);H.order(row);});H.order(f);}
if(kind==='area')legend([['Organic · total: 12,500','accent'],['Referral · total: 4,000','secondary'],['Paid · total: 1,850','tertiary']]);
if(kind==='combo')legend([['Sessions · total: 12,500','secondary'],['Conversion · average: 3.5%','accent']]);
if(['orders','revenue'].includes(kind))legend([['Current','accent'],['Previous','secondary']]);
if(kind==='scatter')legend([['Research · 3 points · Mean Outcome: 26.7','accent'],['Delivery · 3 points · Mean Outcome: 27.7','secondary']]);
if(kind==='sleep')legend([['Stage 1: 0 / 1','accent'],['Stage 2: 0.25 / 1','secondary'],['Stage 3: 0.5 / 1','tertiary']],true);
if(['radial','radar'].includes(kind)){H.rect({parent:card,w:960,h:1,fill:H.sw(APP,'line')});var tiles=frame(card,'metric tiles','row',960,16);['Speed','Quality','Care','Reach'].forEach((n,i)=>{var tile=frame(tiles,'metric','col',228,4);var row=frame(tile,'name','row',228,6);if(kind==='radial')H.rect({parent:row,w:6,h:6,oval:true,fill:H.sw(APP,['accent','secondary','tertiary','accent'][i])});txt(row,(kind==='radial'?'Ring '+(i+1)+' · ':'')+n,12,'secondary');H.order(row);txt(tile,['0','0.25','75','100'][i]+(kind==='radial'?'%':''),20,'ink',228,6);H.order(tile);});H.order(tiles);}
if(kind==='sankey'){var lists=frame(card,'node and link breakdown','row',960,24);var node=frame(lists,'nodes','col',510,6),links=frame(lists,'links','col',426,6);txt(node,'Nodes',12,'ink',510,6);txt(links,'Links',12,'ink',426,6);['Salary · In: $0 · Out: $2,400','Freelance · In: $0 · Out: $600','Budget · In: $3,000 · Out: $3,000','Home · In: $1,200 · Out: $0 · 40% of sinks','Everyday · In: $800 · Out: $0 · 26.7% of sinks','Savings · In: $1,000 · Out: $0 · 33.3% of sinks'].forEach(v=>txt(node,v+' ↗',12,'secondary',510));['Salary → Budget: $2,400','Freelance → Budget: $600','Budget → Home: $1,200','Budget → Everyday: $800','Budget → Savings: $1,000'].forEach(v=>txt(links,v+' ↗',12,'secondary',426));H.order(node);H.order(links);H.order(lists);}
if(kind==='contributions'){card.frame.width=440;hd.frame.width=400;titles.frame.width=400;titles.layers.forEach(l=>{l.frame.width=400;});pl.frame.width=400;pl.frame.height=80;}
H.order(card);H.order(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+CFG[0]+'/'));sh.frame.x=xx;sh.frame.y=yy;H.out({family:CFG[0],app:APP,sheet:sh.id,made:made,x:sh.frame.x,y:sh.frame.y,h:sh.frame.height});
