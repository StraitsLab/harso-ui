var APP = 'Dark/Cozy';
var FAMILY = 'Table';
var APPS=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'];
var page=H.page('Display');
if(page.layers.some(l=>l.name===FAMILY+' — '+APP)) throw new Error('Sheet already exists');
var yy=page.layers.filter(l=>l.frame.x===1600*APPS.indexOf(APP)).reduce((v,l)=>Math.max(v,l.frame.y+l.frame.height+80),0);
var sh=H.sheet({name:FAMILY+' — '+APP,parent:page,x:1600*APPS.indexOf(APP),y:yy,fill:H.sw(APP,'canvas-deep')});
function tx(p,t,s,r,w,weight){return H.text({parent:p,text:t,size:s||14,color:H.sw(APP,r||'ink'),w:w,weight:weight||5});}
function ic(p,n,s,r){return H.icon({parent:p,d:H.paths[n]||n,size:s||16,color:H.hex(APP,r||'secondary')});}
function fr(p,n,o){return H.frame(Object.assign({parent:p,name:n,gap:8},o||{}));}
function sy(p,v,o){return fr(p,FAMILY+'/'+APP+'/'+v,o);}
function row(label){var c=fr(sh,label,{dir:'col',gap:12,align:sketch.StackLayout.AlignItems.Start});tx(c,label,12,'tertiary',null,6);return H.row(c,'Specimens',APP,{w:1000,gap:24});}
function col(p,n,o){return fr(p,n,Object.assign({dir:'col',align:sketch.StackLayout.AlignItems.Start},o||{}));}
function pill(p,t,primary){var b=fr(p,'action',{pad:{top:6,right:14,bottom:6,left:14},h:36,radius:999,fill:H.sw(APP,primary?'ink':'hover')});tx(b,t,14,primary?'inverse':'ink',null,6);return b;}
function dot(p,size,role){return H.rect({parent:p,w:size,h:size,oval:true,fill:H.sw(APP,role||'accent-mark')});}
function line(p,w){return H.rect({parent:p,w:w,h:1,fill:H.sw(APP,'line')});}
function finish(){function ord(p){(p.layers||[]).slice().forEach(k=>{if(k.layers)ord(k);});if(p.stackLayout)H.order(p);}ord(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+FAMILY+'/'));H.relayout(sh);H.out({family:FAMILY,app:APP,sheet:String(sh.id),made:made,h:Math.round(sh.frame.height),w:Math.round(sh.frame.width),x:sh.frame.x,y:sh.frame.y});}
tx(sh,FAMILY+' — '+APP,20,'ink',null,6);

var r=row('Sortable · hover · selected');var b=sy(r,'default',{dir:'col',gap:0,pad:8,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});
[['Work','Sources','Status'],['Launch research','12','Complete'],['Market signals','8','Working'],['Source review','24','Needs input'],['Decision log','4','Draft']].forEach((a,i)=>{var q=fr(b,i===0?'header':'row',{gap:16,pad:{top:0,right:16,bottom:0,left:16},h:44,w:700,radius:6,fill:i===2?H.sw(APP,'hover'):i===3?H.sw(APP,'accent-soft'):null});var check=H.rect({parent:q,w:14,h:14,radius:3,border:H.sw(APP,'control-line'),fill:i===3?H.sw(APP,'ink'):null});var title=fr(q,'work',{w:300,gap:8});tx(title,a[0],13,i===0?'secondary':'ink',null,i===0?6:5);if(i===0)ic(title,'chevronDown',14);H.text({parent:q,text:a[1],size:13,color:H.sw(APP,i===0?'secondary':'ink'),w:90,align:sketch.Text.Alignment.right});tx(q,a[2],13,i===1?'positive':i===3?'attention':'secondary',170);if(i<4){var sep=fr(b,'separator',{pad:{top:0,right:16,bottom:0,left:46}});line(sep,638);}});

finish();
