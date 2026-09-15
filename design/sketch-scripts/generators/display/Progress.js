var APP = 'Dark/Cozy';
var FAMILY = 'Progress';
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

var r=row('Linear determinate · 50%');var b=sy(r,'linear/50',{gap:0,w:320,h:4,radius:2,clip:true});H.rect({parent:b,w:160,h:4,fill:H.sw(APP,'accent-mark')});H.rect({parent:b,w:160,h:4,fill:H.sw(APP,'line')});
r=row('Indeterminate · 16 / 20 / 32');[16,20,32].forEach(s=>{var b=sy(r,'spinner/'+s,{w:s,h:s});ic(b,'loader',s,'accent');});
r=row('Circular determinate · 25 / 50 / 75%');[25,50,75].forEach(v=>{var b=sy(r,'circular/'+v,{w:20,h:20});var end=v===25?'20 12':v===50?'12 20':'4 12';var path='<circle cx="12" cy="12" r="8" stroke="'+H.hex(APP,'line')+'"/><path d="M12 4 A8 8 0 '+(v===75?'1':'0')+' 1 '+end+'"/>';ic(b,path,20,'accent');});

finish();
