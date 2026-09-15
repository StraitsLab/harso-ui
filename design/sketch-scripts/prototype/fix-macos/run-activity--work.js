// Lane-local repair generators. Preserve screen IDs, positions and existing navigation.
var APP;
function all(l){var a=[l];(l.layers||[]).forEach(k=>a=a.concat(all(k)));return a;}
function named(l,n){return all(l).find(k=>k.name===n);}
function texts(l){return all(l).filter(k=>k.type==='Text');}
function replace(l,a,b){texts(l).filter(t=>t.text===a).forEach(t=>t.text=b);}
function clear(l){l.layers.slice().forEach(k=>k.remove());}
function col(p,n,w,g,pad,fill,h){var f=H.frame({parent:p,name:n,dir:'col',w:w,h:h,gap:g===undefined?16:g,pad:pad||0,fill:fill?H.sw(APP,fill):null});f.stackLayout.alignItems=0;return f;}
function row(p,n,w,g,pad,fill,h){return H.frame({parent:p,name:n,dir:'row',w:w,h:h,gap:g===undefined?8:g,pad:pad||0,fill:fill?H.sw(APP,fill):null});}
function tx(p,t,size,role,w,weight){return H.text({parent:p,text:t,size:size||14,color:H.sw(APP,role||'ink'),w:w,weight:weight||5});}
function space(p,vert){var f=H.frame({parent:p,name:'flex-space',w:1,h:1});f[vert?'verticalSizing':'horizontalSizing']=sketch.FlexSizing.Fill;return f;}
function btn(p,t,id,kind,w,h){var b=row(p,'link:'+id,w,8,{left:12,right:12,top:0,bottom:0},kind==='primary'?'ink':'surface',h||36);b.style.corners.radii=[8,8,8,8];b.style.borders=[{color:H.sw(APP,'line'),thickness:1,position:sketch.Style.BorderPosition.Inside}];b.stackLayout.justifyContent=1;tx(b,t,13,kind==='primary'?'inverse':kind==='danger'?'negative':'ink',undefined,6);H.order(b);return b;}
function ib(p,icon,id){var b=row(p,'link:'+id,32,0,0,null,32);b.stackLayout.justifyContent=1;H.icon({parent:b,d:H.paths[icon],size:18,color:H.hex(APP,'secondary')});H.order(b);return b;}
function card(p,n,w,g,pad){var c=col(p,n,w,g===undefined?16:g,pad===undefined?20:pad,'surface');c.style.corners.radii=[12,12,12,12];c.style.borders=[{color:H.sw(APP,'line'),thickness:1,position:sketch.Style.BorderPosition.Inside}];return c;}
function mono(p,t,w){return H.text({parent:p,text:t,size:12,mono:true,color:H.sw(APP,'secondary'),w:w});}
function utility(s){all(s).filter(l=>l.name==='link:search'&&l.type==='Group').forEach(b=>{b.style.fills=[{color:H.sw(APP,'surface'),enabled:true}];b.style.borders=[{color:H.sw(APP,'line'),thickness:1,position:sketch.Style.BorderPosition.Inside}];texts(b).forEach(t=>t.style.textColor=H.sw(APP,'ink'));});var f=named(s,'sidebar');var foot=f&&named(f,'link:settings');if(foot){foot.stackLayout.gap=6;foot.stackLayout.apply();}}
function normalized(s){all(s).forEach(l=>{if(/^link:.* \d+$/.test(l.name))l.name=l.name.replace(/ \d+$/,'');});}
function final(s){utility(s);H.relayout(s);normalized(s);H.out({screen:s.name,id:s.id,frame:s.frame,links:all(s).filter(l=>l.name.startsWith('link:')).map(l=>l.name)});}
function edit(id,fn){['Light','Dark'].forEach(a=>{APP=a+'/Clean';var s=H.page('Proto macOS '+a).layers.find(l=>l.name==='Screen/macos/'+APP+'/'+id);if(!s)throw Error('Missing '+id);var x=s.frame.x,y=s.frame.y;fn(s);final(s);s.frame.x=x;s.frame.y=y;});}

var TARGET="activity--work";
edit(TARGET,function(s){var feed=named(s,'activity-feed');replace(feed,'Release checks · Verify the candidate · 1 / 3','Release checks · Verify candidate · 1 / 3 · Workspace sprite · Personal');replace(feed,'Personal · All 4 steps completed · 24 min ago','Documentation · Completed · Workspace sprite · Personal · 24 min ago');replace(feed,'Personal · Connection timed out · 1 hour ago','Integration checks · Timed out · Workspace sprite · Personal · 1 hour ago');texts(feed).filter(t=>t.text==='Pending approval').forEach(t=>{t.text='Approval pending';t.style.textColor=H.sw(APP,'secondary');t.parent.style.fills=[];t.parent.style.borders=[];});if(TARGET==='activity--work'){var ins=named(s,'work-inspector');replace(ins,'Workspace sprite\nStarted 3 minutes ago','Workspace sprite · Personal\nRelease checks · Verify candidate\nStarted 3 minutes ago');replace(ins,'Cancel','Cancel run');ins.layers.filter(l=>l.name==='flex-space').forEach(l=>l.remove());ins.stackLayout.gap=16;}});