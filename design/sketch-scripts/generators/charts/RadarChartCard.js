var APP = "Dark/Cozy";
var CFG = ["RadarChartCard", "radar", "Radar observations", "Performance across five dimensions", ["Performance"]];
var C={}; ['accent','accent-mark','positive-mark','attention-mark','line','tertiary','ink','secondary','surface','hover'].forEach(k=>C[k]=H.hex(APP,k));
function plot(kind){
var s=[];var a=C.accent,b=C['positive-mark'],c=C['attention-mark'],g=C.line,t=C.tertiary;
function rect(x,y,w,h,f,op){s.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3" fill="'+f+'" opacity="'+(op===undefined?1:op)+'"/>');}
function text(x,y,v,anchor,col,size){s.push('<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'start')+'" font-family="Inter" font-size="'+(size||12)+'" fill="'+(col||t)+'">'+v+'</text>');}
function path(d,col,width,fill,extra){s.push('<path d="'+d+'" stroke="'+col+'" stroke-width="'+(width||2)+'" fill="'+(fill||'none')+'" stroke-linecap="round" stroke-linejoin="round" '+(extra||'')+'/>');}
function circle(x,y,r,col,fill,extra){s.push('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" stroke="'+col+'" fill="'+(fill||'none')+'" '+(extra||'')+'/>');}
function axes(labels,max){[0,1,2,3].forEach(i=>{var y=180-i*48;path('M36 '+y+'H386',g,1);text(27,y+4,String(Math.round((max||6000)*i/3)),'end');});labels.forEach((l,i)=>text(48+i*326/(labels.length-1),204,l,'middle'));}
var vals=[70,94,83,114,89,134,150];
if(['area','line','revenue','combo'].includes(kind)){
axes(['Jan','Feb','Mar','Apr'],kind==='revenue'?1:6000);
var d='M48 126 C90 126 114 85 153 99 S220 143 263 112 S331 52 374 32';
if(kind==='area'||kind==='revenue'){s.push('<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'" stop-opacity="0.3"/><stop offset="1" stop-color="'+a+'" stop-opacity="0"/></linearGradient></defs>');path(d+' L374 180 L48 180Z','none',0,'url(#fade)');}
if(kind==='combo'){[75,100,85,145].forEach((v,i)=>rect(40+i*108,180-v,26,v,C['accent-mark'],.35));}
if(kind==='line'||kind==='revenue'){path('M48 153 C103 144 130 157 153 139 S230 152 263 135 S334 119 374 105',b,2,'none','stroke-dasharray="5 5"');}
path(d,a,3);
if(kind==='line'){path('M263 32V180',g,1,'none','stroke-dasharray="3 4"');circle(263,112,5,C.surface,a,'stroke-width="2"');rect(184,10,136,45,C.hover);text(195,29,'March · Revenue','start',C.ink);text(195,46,'2,800  /  1,900','start',C.secondary);}
}
if(['earnings','orders','days','steps'].includes(kind)){
axes(kind==='earnings'||kind==='orders'?['Stage 1','Stage 2','Stage 3']:['M','T','W','T','F','S','S'],kind==='steps'?12000:100);
var v=kind==='earnings'||kind==='orders'?[0,70,140]:vals;
v.forEach((h,i)=>{var x=43+i*(326/(v.length-1));if(kind==='orders'){rect(x-8,180-h/2,13,h/2,b,.6);rect(x+7,180-h,13,h,a);}else if(kind==='earnings'){rect(x-7,180-h,26,h*.65,a);rect(x-7,180-h*.35,26,h*.35,b);}else rect(x-9,180-h,20,h,i===5?b:a);});
if(kind==='steps'){path('M36 60H386',c,1.5,'none','stroke-dasharray="5 4"');text(383,53,'Goal 10,000','end',C.secondary);}
}
if(kind==='barlist'){
['Stage 1','Stage 2','Stage 3'].forEach((n,i)=>{var y=28+i*60;text(0,y,n,'start',C.ink);text(398,y,['0','0.25','0.5'][i],'end',C.ink);rect(0,y+12,400,12,g);if(i)rect(0,y+12,i*200,12,a);});}
if(kind==='funnel'){
['Visit','Explore','Sign up','Activate','Convert'].forEach((n,i)=>{var w=[270,222,173,124,80][i],y=6+i*40;text(0,y+18,n,'start',C.secondary);rect(82,y,w,25,a,1-i*.12);text(395,y+18,[100,82,64,46,30][i]+'%','end',C.ink);});}
if(kind==='heatmap'||kind==='contributions'){
var cols=kind==='heatmap'?24:20,sz=kind==='heatmap'?12:14,gap=3,start=38;
['M','T','W','T','F','S','S'].forEach((day,r)=>{text(18,38+r*22,day,'middle');for(var co=0;co<cols;co++){rect(start+co*(sz+gap),26+r*22,sz,18,a,.08+((co*7+r*3)%11)/12);}});
(kind==='heatmap'?['00','06','12','18','23']:['May','Jun','Jul','Aug','Sep']).forEach((l,i)=>text(start+i*85,14,l));text(38,205,kind==='heatmap'?'Hour of day':'20 weeks of contributions');}
if(kind==='activity'||kind==='radial'){
var cx=kind==='activity'?96:200,cy=103;
if(kind==='activity'){[78,57,36].forEach((r,i)=>{circle(cx,cy,r,g,'none','stroke-width="14"');circle(cx,cy,r,[a,b,c][i],'none','stroke-width="14" stroke-dasharray="'+(2*Math.PI*r*[.8,.8,.99][i])+' '+(2*Math.PI*r)+'" transform="rotate(-90 '+cx+' '+cy+')"');});
['Move','Exercise','Running'].forEach((n,i)=>{text(205,38+i*60,n,'start',C.ink,14);text(205,59+i*60,['480 / 600 kcal','24 / 30 min','5 / 5 km'][i],'start',C.secondary);text(205,76+i*60,['Goal · 80%','Goal · 80%','Goal · 100%'][i]);});}
else{circle(cx,cy,77,g,'none','stroke-width="22"');[a,b,c].forEach((col,i)=>circle(cx,cy,77,col,'none','stroke-width="22" stroke-dasharray="'+([235,135,100][i])+' 484" stroke-dashoffset="'+(-[0,242,382][i])+'" transform="rotate(-90 200 103)"'));text(200,106,'82%','middle',C.ink,24);text(200,128,'Total progress','middle');}}
if(kind==='sleep'){
path('M70 162 A130 130 0 0 1 330 162',g,22);path('M70 162 A130 130 0 0 1 310 93',a,22);text(200,127,'82','middle',C.ink,24);text(200,150,'Sleep score','middle');text(62,195,'0');text(328,195,'100');}
if(kind==='radar'){
var cx=200,cy=106,rr=75;function pts(scale,values){return [0,1,2,3,4].map(i=>{var ang=-Math.PI/2+i*Math.PI*2/5,r=rr*scale*(values?values[i]:1);return [cx+Math.cos(ang)*r,cy+Math.sin(ang)*r];});}
[.33,.66,1].forEach(k=>path('M'+pts(k).map(p=>p.join(' ')).join(' L')+'Z',g,1));pts(1).forEach(p=>path('M200 106L'+p.join(' '),g,1));path('M'+pts(1,[.8,.95,.68,.74,.9]).map(p=>p.join(' ')).join(' L')+'Z',a,2,a+'26');['Speed','Quality','Care','Reach','Focus'].forEach((n,i)=>{var p=pts(1.27)[i];text(p[0],p[1]+4,n,'middle');});}
if(kind==='scatter'){
axes(['12','46','80'],60);[[[58,140,7],[115,158,10],[248,90,13]],[[213,167,10],[311,45,14],[363,85,8]]].forEach((ser,i)=>ser.forEach(p=>circle(p[0],p[1],p[2],i?b:a,i?b:a,'opacity="0.8"')));}
if(kind==='sankey'){
[[46,45,192,78,32,a],[46,143,192,117,18,b],[208,62,352,33,25,a],[208,95,352,100,21,b],[208,131,352,164,23,c],[46,167,192,148,8,c]].forEach(v=>path('M'+v[0]+' '+v[1]+' C115 '+v[1]+' 125 '+v[3]+' '+v[2]+' '+v[3],v[5],v[4],'none','opacity="0.35"'));
[[36,24,13,148,a],[190,42,18,120,a],[351,17,13,34,a],[351,80,13,37,b],[351,143,13,45,c]].forEach(v=>rect.apply(null,v));text(0,12,'Sources');text(171,25,'Budget');text(319,207,'Destinations');text(0,193,'$3,000','start',C.ink);}
if(kind==='stages'){
var names=['Discover','Define','Build','Review'],ww=[112,84,126,66],xx=0;names.forEach((n,i)=>{rect(xx,69,ww[i],40,[a,b,C['accent-mark'],c][i]);text(xx+ww[i]/2,134,n,'middle');text(xx+ww[i]/2,154,[28,21,31,20][i]+'%','middle');xx+=ww[i]+4;});text(0,32,'Project delivery','start',C.ink,14);text(399,32,'4 stages','end');}
return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="212" viewBox="0 0 400 212">'+s.join('')+'</svg>';
}

var page=H.page('Charts'); var name=CFG[0]+' — '+APP;
if(page.layers.some(l=>l.name===name)) throw Error('Sheet already exists '+name);
var ai=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'].indexOf(APP);
var previous=page.layers.filter(l=>l.name.endsWith(' — '+APP));var yy=previous.reduce((v,l)=>Math.max(v,l.frame.y+l.frame.height+80),0);
var sh=H.sheet({name:name,parent:page,x:ai*1600,y:yy,fill:H.hex(APP,'canvas-deep')});
H.text({parent:sh,text:name,size:20,weight:6,color:H.sw(APP,'ink')});
var card=H.frame({name:CFG[0]+'/'+APP+'/default',parent:sh,dir:'col',gap:16,pad:20,w:440,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});
var hd=H.frame({name:'header',parent:card,dir:'col',gap:6,w:400,align:sketch.StackLayout.AlignItems.Start});
H.text({parent:hd,text:CFG[2],size:14,weight:6,color:H.sw(APP,'ink'),w:400});H.text({parent:hd,text:CFG[3],size:13,color:H.sw(APP,'secondary'),w:400});H.order(hd);
if(CFG[1]==='orders'||CFG[1]==='revenue'){var metric=H.frame({name:'metric',parent:card,dir:'row',gap:16,w:400});H.text({parent:metric,text:'0.75',size:24,weight:6,color:H.sw(APP,'ink')});H.text({parent:metric,text:CFG[1]==='orders'?'↑ +100%':'Change +12%',size:12,weight:6,color:H.sw(APP,'positive')});H.order(metric);}
var pl=sketch.createLayerFromData(plot(CFG[1]),'svg');pl.name='vector plot';pl.parent=card;pl.frame.width=400;pl.frame.height=212;
var ft=H.frame({name:'legend',parent:card,dir:'row',gap:8,w:400});CFG[4].forEach((v,i)=>{var chip=H.frame({name:'legend chip',parent:ft,dir:'row',gap:6,pad:{top:4,right:8,bottom:4,left:8},radius:999,fill:H.sw(APP,'hover')});H.rect({parent:chip,w:6,h:6,oval:true,fill:H.sw(APP,['accent','positive-mark','attention-mark'][i%3])});H.text({parent:chip,text:v,size:12,weight:6,color:H.sw(APP,'secondary')});H.order(chip);});H.order(ft);H.order(card);H.order(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+CFG[0]+'/'));H.out({family:CFG[0],app:APP,sheet:String(sh.id),made:made,h:sh.frame.height,y:sh.frame.y});
