var originalFrame=H.frame;H.frame=function(o){var f=originalFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var APP = 'Light/Clean';
var FAMILY = 'Carousel';
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
var r=row('Four slides · first active · next slide peek');var b=sy(r,'peek/four',{dir:'col',gap:20,w:660,align:sketch.StackLayout.AlignItems.Start});var viewport=fr(b,'slide viewport',{w:660,h:236,gap:16,clip:true});
[['01 / Research','A clearer direction'],['02 / Research','Make room for what matters']].forEach((a,i)=>{var c=col(viewport,'slide',{w:560,h:236,pad:24,gap:12,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});tx(c,a[0],12,'tertiary');tx(c,a[1],20,'ink',512,6);tx(c,'A quiet place for the things worth keeping.',14,'secondary',512);if(i===0){tx(c,'Note',13,'secondary');var input=fr(c,'input',{w:512,h:36,pad:10,radius:8,fill:H.sw(APP,'canvas'),border:H.sw(APP,'control-line')});tx(input,'Draft insight',14);}else tx(c,'Explore result →',14,'accent');});
var nav=fr(b,'page control',{gap:16,w:660,justify:sketch.StackLayout.JustifyContent.Center});ic(nav,'<path d="m15 18-6-6 6-6"/>');var dots=fr(nav,'dots',{gap:8});[0,1,2,3].forEach(i=>H.rect({parent:dots,w:i===0?20:6,h:6,radius:3,fill:H.sw(APP,i===0?'ink':'faint')}));ic(nav,'chevronRight');
finish();
