var originalFrame=H.frame;H.frame=function(o){var f=originalFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var APP = "Light/Cozy";
var FAMILY = 'Tooltip';
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
['top','bottom'].forEach(v=>{var r=row(v+' arrow');var b=sy(r,v+'/default',{w:190,h:40});b.stackLayout=null;var body=fr(b,'hint',{pad:{top:8,right:12,bottom:8,left:12},radius:999,fill:H.sw(APP,'ink')});tx(body,'Copy a link to this sample',13,'inverse');H.relayout(body);var w=body.frame.width,h=body.frame.height;b.frame.width=w;b.frame.height=h+6;body.frame.x=0;body.frame.y=v==='top'?6:0;
var d=v==='top'?'M0 6 L6 0 L12 6 Z':'M0 0 L6 6 L12 0 Z';var svg='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6"><path d="'+d+'" fill="'+H.hex(APP,'ink')+'"/></svg>';var tip=sketch.createLayerFromData(svg,'svg');tip.name='attached half diamond';tip.parent=b;tip.frame.x=(w-12)/2;tip.frame.y=v==='top'?0:h;});
finish();
