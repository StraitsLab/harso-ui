var originalFrame=H.frame;H.frame=function(o){var f=originalFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var APP = "Light/Clean";
var FAMILY = 'Avatar';
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
function av(p,n,s,image,status){var a=sy(p,n,{w:s+4,h:s+4});a.stackLayout=null;a.clipsContent=false;H.rect({parent:a,x:2,y:2,w:s,h:s,radius:999,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});var t=image?ic(a,'user',s===24?14:20):tx(a,s===24?'JL':s===32?'S':'AM',s===24?12:14,'ink',null,6);t.frame.x=2+(s-t.frame.width)/2;t.frame.y=2+(s-t.frame.height)/2;if(status){H.rect({parent:a,name:'online',x:s-4,y:s-4,w:8,h:8,oval:true,fill:H.sw(APP,'positive-mark'),border:H.sw(APP,'canvas'),bw:2});}return a;}
[24,32,40].forEach(s=>{var r=row(s+'px · initials, placeholder, online');av(r,s+'/initials',s,false,false);av(r,s+'/image-placeholder',s,true,false);av(r,s+'/status',s,false,true);});
var r=row('Avatar group');var g=sy(r,'group/default',{gap:0});['AM','S','JL','+2'].forEach(t=>{var a=fr(g,'avatar',{w:32,h:32,radius:999,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),justify:sketch.StackLayout.JustifyContent.Center});tx(a,t,12,'ink',null,6);});
finish();
