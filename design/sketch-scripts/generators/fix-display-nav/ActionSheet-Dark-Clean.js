var originalFrame=H.frame;H.frame=function(o){var f=originalFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var APP = "Dark/Clean";
var FAMILY = 'ActionSheet';
var APPS=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'], apps=APPS;
var page=H.page('Navigation');
var prior=page.layers.find(l=>l.name===FAMILY+' — '+APP);if(!prior)throw Error('Missing original '+FAMILY+' '+APP);
var oldX=prior.frame.x,oldY=prior.frame.y;H.dropSheet('Navigation',FAMILY+' — '+APP);var existing=null;
var sh=H.sheet({name:FAMILY+' — '+APP,parent:page,x:oldX,y:oldY,fill:H.sw(APP,'canvas-deep')});
function tx(p,t,size,role,w,weight){return H.text({parent:p,text:t,size:size||14,color:H.sw(APP,role||'ink'),w:w,weight:weight||5});}
function fr(p,name,dir,w,h,pad,gap,fill,radius){return H.frame({parent:p,name:name||'layout',dir:dir||'col',w:w,h:h,pad:pad===undefined?0:pad,gap:gap||0,fill:fill?H.sw(APP,fill):null,radius:radius,align:dir==='row'?sketch.StackLayout.AlignItems.Center:sketch.StackLayout.AlignItems.Start});}
function ic(p,key,size,role){return H.icon({parent:p,d:H.paths[key],size:size||16,color:H.hex(APP,role||'secondary')});}
function done(p){H.order(p);return p;}
function spacer(p,h){return fr(p,'space','row',1,h||8);}
function flex(p){var f=fr(p,'space','row',1,1);f.horizontalSizing=sketch.FlexSizing.Fill;return f;}
function btn(p,t,primary,w,danger){var b=fr(p,'button','row',w,36,{left:14,right:14,top:6,bottom:6},8,primary?(danger?'negative':'ink'):'hover',primary?999:8);b.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.Center;tx(b,t,14,primary?'inverse':'ink',undefined,6);return done(b);}
function iconbtn(p,key,sz){var b=fr(p,'icon button','row',sz||36,sz||36,0,0,'hover',8);b.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.Center;ic(b,key,sz===18?18:16);return done(b);}
function key(p,t){var k=fr(p,'keycap','row',undefined,20,{left:5,right:5,top:1,bottom:1},0,'panel',4);k.style.borders=[{color:H.sw(APP,'line'),thickness:1}];H.text({parent:k,text:t,size:12,mono:true,color:H.sw(APP,'secondary')});return done(k);}
function card(p,name,w,pad,radius){var c=fr(p,name,'col',w,undefined,pad===undefined?16:pad,8,'surface',radius||16);c.style.borders=[{color:H.sw(APP,'line'),thickness:1}];return c;}
function sym(p,variant,w,pad,radius){return card(p,FAMILY+'/'+APP+'/'+variant,w,pad,radius);}
function specimen(label){var block=fr(sh,'specimen','col',undefined,undefined,0,12);tx(block,label,12,'tertiary',undefined,6);var r=H.row(block,'preview',APP,{align:sketch.StackLayout.AlignItems.Start,pad:24,gap:24});return {b:block,r:r};}
function end(s){done(s.r);done(s.b);}
function line(p,w,inset){var r=fr(p,'separator','row',undefined,9,{left:inset||0,right:0,top:4,bottom:4});H.rect({parent:r,w:w-(inset||0),h:1,fill:H.sw(APP,'line')});return done(r);}
function row(p,label,icon,w,sel,shortcut,level,role){var r=fr(p,'row','row',w,32,{left:10+(level||0)*16,right:10,top:0,bottom:0},8,sel?'hover':null,6);if(icon)ic(r,icon,16,role);tx(r,label,14,role||'ink');flex(r);if(shortcut)tx(r,shortcut,12,'tertiary');return done(r);}
function field(p,text,w,popup){var r=fr(p,'field','row',w,32,{left:10,right:10,top:0,bottom:0},8,'canvas',8);r.style.borders=[{color:H.sw(APP,'control-line'),thickness:1}];tx(r,text,13);flex(r);if(popup)ic(r,'chevronsUpDown',14);return done(r);}
if(!existing)tx(sh,FAMILY+' — '+APP,20,'ink',undefined,6);
var s=specimen('Grouped actions');var c=fr(s.r,'ActionSheet/'+APP+'/default','col',390,undefined,8,8);var actions=card(c,'actions',374,8,16);tx(actions,'Project actions',12,'tertiary',358);['Share project','Duplicate','Move to project','Delete project'].forEach((t,i)=>{var r=fr(actions,'action','row',358,44,8,8);ic(r,['upload','copy','folder','trash'][i],16,i===3?'negative':'secondary');tx(r,t,14,i===3?'negative':'ink');done(r);if(i<3)line(actions,358,32);});done(actions);var cancel=fr(c,'cancel','row',374,44,8,0,'surface',16);cancel.style.borders=[{color:H.sw(APP,'line'),thickness:1}];cancel.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.Center;tx(cancel,'Cancel',14,'ink',undefined,6);done(cancel);done(c);end(s);
done(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+FAMILY+'/'));sh.frame.x=oldX;sh.frame.y=oldY;H.out({sheet:String(sh.id),name:sh.name,w:sh.frame.width,h:sh.frame.height,made:made});