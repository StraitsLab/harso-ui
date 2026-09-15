var originalFrame=H.frame;H.frame=function(o){var f=originalFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var APP = "Dark/Clean";
var FAMILY = 'Table';
var APPS=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'], apps=APPS;
var page=H.page('Display');
var prior=page.layers.find(l=>l.name===FAMILY+' — '+APP);if(!prior)throw Error('Missing original '+FAMILY+' '+APP);
var oldX=prior.frame.x,oldY=prior.frame.y;H.dropSheet('Display',FAMILY+' — '+APP);var existing=null;
var sh=H.sheet({name:FAMILY+' — '+APP,parent:page,x:oldX,y:oldY,fill:H.sw(APP,'canvas-deep')});
function tx(p,t,s,r,w,weight){return H.text({parent:p,text:t,size:s||14,color:H.sw(APP,r||'ink'),w:w,weight:weight||5});}
function ic(p,n,s,r){return H.icon({parent:p,d:H.paths[n]||n,size:s||16,color:H.hex(APP,r||'secondary')});}
function fr(p,n,o){return H.frame(Object.assign({parent:p,name:n,gap:8},o||{}));}
function sy(p,v,o){return fr(p,FAMILY+'/'+APP+'/'+v,o);}
function row(label){var c=fr(sh,label,{dir:'col',gap:12,align:sketch.StackLayout.AlignItems.Start});tx(c,label,12,'tertiary',null,6);return H.row(c,'Specimens',APP,{w:1000,gap:24});}
function col(p,n,o){return fr(p,n,Object.assign({dir:'col',align:sketch.StackLayout.AlignItems.Start},o||{}));}
function pill(p,t,primary){var b=fr(p,'action',{pad:{top:6,right:14,bottom:6,left:14},h:36,radius:999,fill:H.sw(APP,primary?'ink':'hover')});tx(b,t,14,primary?'inverse':'ink',null,6);return b;}
function dot(p,size,role){return H.rect({parent:p,w:size,h:size,oval:true,fill:H.sw(APP,role||'accent-mark')});}
function line(p,w){return H.rect({parent:p,w:w,h:1,fill:H.sw(APP,'line')});}
function finish(){function ord(p){(p.layers||[]).slice().forEach(k=>{if(k.layers)ord(k);});if(p.stackLayout)H.order(p);}ord(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+FAMILY+'/'));H.relayout(sh);sh.frame.x=oldX;sh.frame.y=oldY;H.out({family:FAMILY,app:APP,sheet:String(sh.id),made:made,h:Math.round(sh.frame.height),w:Math.round(sh.frame.width),x:sh.frame.x,y:sh.frame.y});}
tx(sh,FAMILY+' — '+APP,20,'ink',null,6);
var r=row('A small evidence set');var b=sy(r,'basic/default',{dir:'col',gap:0,w:700,align:sketch.StackLayout.AlignItems.Start});[['Source','Disposition'],['Firsthand observations','Keep'],['Unverified assumptions','Revisit']].forEach((a,i)=>{var q=fr(b,'row',{h:44,gap:24,pad:12});tx(q,a[0],13,i===0?'secondary':'ink',400,i===0?6:5);tx(q,a[1],13,i===0?'secondary':'ink',200,i===0?6:5);if(i<2)line(b,700);});
var r=row('Work records · sortable · hover · selected');var b=sy(r,'default',{dir:'col',gap:12,w:780,pad:16,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});tx(b,'Search records',13,'secondary');var search=fr(b,'search',{w:360,h:36,pad:10,radius:8,fill:H.sw(APP,'canvas'),border:H.sw(APP,'control-line')});ic(search,'search');tx(search,'Find work records...',13,'tertiary');var table=col(b,'table',{gap:0});[['Work','Sources','Status'],['Audience interviews','3','Review'],['Launch positioning','10','Ready'],['Product comparisons','0','Ready'],['A focused first week','7','Review']].forEach((a,i)=>{var q=fr(table,'row',{gap:16,pad:{top:0,right:12,bottom:0,left:12},h:44,w:748,radius:6,fill:i===2?H.sw(APP,'hover'):i===3?H.sw(APP,'accent-soft'):null});var check=fr(q,'checkbox',{w:16,h:16,radius:3,border:H.sw(APP,'control-line'),fill:i===3?H.sw(APP,'ink'):null,justify:sketch.StackLayout.JustifyContent.Center});if(i===3)ic(check,'check',12,'inverse');var title=fr(q,'work',{w:292,gap:8});tx(title,a[0],13,i===0?'secondary':'ink',null,i===0?6:5);if(i===0)ic(title,'chevronsUpDown',14);var sources=fr(q,'sources',{w:108,gap:8});tx(sources,a[1],13,i===0?'secondary':'ink');if(i===0)ic(sources,'chevronsUpDown',14);var status=fr(q,'status',{w:150,gap:6});if(i)dot(status,6,a[2]==='Ready'?'positive-mark':'attention-mark');tx(status,a[2],13,i===0?'secondary':a[2]==='Ready'?'positive':'attention');if(i===0)tx(q,'Action',13,'secondary',60,6);else{var action=fr(q,'view',{w:60,h:28,justify:sketch.StackLayout.JustifyContent.Center});ic(action,'eye');}if(i<4)line(table,748);});
finish();
