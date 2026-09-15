var APP="Dark/Clean";var ID="activity";
// Lane-local helpers; shared prelude is never modified.
var oldFrame=H.frame; H.frame=function(o){var f=oldFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var C=function(r){return H.sw(APP,r||'ink');};
function tx(p,t,size,role,w,mono){return H.text({parent:p,text:t,size:size||14,weight:5,color:C(role),w:w,mono:!!mono});}
function col(p,n,w,g,pad){return H.frame({parent:p,name:n,dir:'col',w:w,gap:g===undefined?12:g,pad:pad||0,align:sketch.StackLayout.AlignItems.Start});}
function row(p,n,w,h,g){return H.frame({parent:p,name:n,dir:'row',w:w,h:h,gap:g===undefined?8:g,pad:0});}
function sp(p){var z=H.frame({parent:p,name:'spacer',h:1,pad:0});z.horizontalSizing=sketch.FlexSizing.Fill;return z;}
function sect(p,t,w){var r=H.frame({parent:p,name:'section',w:w,h:32,pad:{top:12,right:0,bottom:4,left:0}});H.sft({parent:r,text:t.toUpperCase(),size:11,weight:8,color:C('tertiary')});H.order(r);}
function button(p,label,target,prim,glyph,w){var b=H.frame({parent:p,name:'link:'+target,dir:'row',gap:7,pad:{top:0,right:12,bottom:0,left:12},h:30,w:w,radius:7,fill:C(prim?'accent':'surface'),border:prim?null:C('line-strong'),justify:sketch.StackLayout.JustifyContent.Center});if(glyph)H.sf(b,glyph,{size:13,color:prim?'#ffffff':C('secondary')});H.sft({parent:b,text:label,size:13,weight:7,color:prim?'#ffffff':C('ink')});H.order(b);return b;}
function composer(p,width,empty){var c=col(p,'composer',width,12,14);c.style.fills=[{color:C('surface')}];c.style.borders=[{color:C('line-strong'),thickness:1,position:sketch.Style.BorderPosition.Inside}];c.style.corners.radii=[14,14,14,14];tx(c,empty?'Ask anything, or describe a task…':'Reply…',14,'tertiary',width-28);var r=row(c,'composer-actions',width-28,28,6);H.sfBtn(r,'link:conversation--attach','plus',APP,{w:28,h:28});button(r,'Claude Fable 5.1','conversation--model',false,'cube');sp(r);H.sfBtn(r,'link:conversation--voice','mic',APP,{w:28,h:28});H.sfBtn(r,'link:conversation','arrow_up',APP,{w:28,h:28,radius:14,color:'#ffffff',fill:C('accent')});H.order(r);H.order(c);}
function file(p,path,detail){var r=row(p,'link:artifact',288,42,8);H.sf(r,'doc',{size:14,color:C('secondary'),w:18});var q=col(r,'file-label',232,2);tx(q,path,12,'ink',232,true);tx(q,detail,11,'tertiary',232);H.order(q);H.order(r);}
function normalize(s){function visit(l){if(l.name.indexOf('link:')===0)l.name=l.name.replace(/ \d+$/,'');(l.layers||[]).forEach(visit);}visit(s);}
var pageName='Proto macOS '+APP.split('/')[0];
var name='Screen/macos/'+APP+'/'+ID;
var s=H.page(pageName).layers.find(function(l){return l.name===name;});
var page=H.page(pageName);page.layers.slice().forEach(function(l){if(l.name===name || (l.name.indexOf('caption/')===0&&l.name.endsWith('/'+ID)))l.remove();});
var ids=['signin','new-conversation','conversation','conversation--approval','conversation--menu','conversation--delete','search','activity','activity--work'];
s=H.screen({page:pageName,platform:'macos',app:APP,id:ID,w:1440,h:900,x:ids.indexOf(ID)*1560,y:0});
if(ID==='signin'){s.stackLayout=null;var tl=row(s,'traffic-lights',76,52,8);tl.frame.x=20;[['#ff5f57','#e0443e'],['#febc2e','#dea123'],['#28c840','#1aab29']].forEach(function(c){H.rect({parent:tl,w:12,h:12,oval:true,fill:c[0],border:c[1]});});H.order(tl);}
else {var conv=ID.indexOf('conversation')===0;var act=ID.indexOf('activity')===0;var wi=H.macWindow(s,APP,{active:conv?'conversation':act?'activity':ID,title:conv?'Move the billing webhook handler':act?'Activity':ID==='search'?'Search':'New conversation',subtitle:conv?'Personal · 14 turns':act?'All projects · Today':undefined,search:!conv&&ID!=='search',tools:conv?[['link:conversation--menu','ellipsis'],['link:conversation--share','square_and_arrow_up']]:[],inspector:conv?'Context':ID==='activity--work'?'Work':false,inspectorToggle:conv?'conversation':act?'activity--work':undefined,inspectorClose:act?'activity':'conversation'});wi.finish();}
console.log(JSON.stringify({id:ID,app:APP,frame:s.id,phase:'shell'}));