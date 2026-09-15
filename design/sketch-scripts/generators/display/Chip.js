var APP = 'Dark/Cozy';
var FAMILY = 'Chip';
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

['default','bold','caption','dismissible','leading-icon'].forEach(v=>{var r=row(v);var b=sy(r,v+'/default',{gap:6,pad:{top:4,right:8,bottom:4,left:8},radius:999,fill:v==='caption'?null:H.sw(APP,v==='bold'?'ink':'hover')});if(v==='leading-icon')ic(b,'sparkles',14);tx(b,'Working',12,v==='bold'?'inverse':'ink',null,6);if(v==='dismissible')ic(b,'x',14);});

finish();
