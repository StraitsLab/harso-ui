var APP="Light/Clean", ID="conversation--approval", INDEX=3, PHASE="overlay";
var app=APP;
var pageName='Proto macOS '+APP.split('/')[0];
if(!doc.pages.some(function(p){return p.name===pageName;}))throw Error('Missing existing page');
var page=H.page(pageName);
var s=page.layers.find(function(l){return l.name==='Screen/macos/'+APP+'/'+ID;});
function walk(l,fn){fn(l);(l.layers||[]).forEach(function(c){walk(c,fn);});}
function named(root,n){var out;walk(root,function(l){if(l.name===n&&!out)out=l;});return out;}
function tx(p,t,size,role,width){return H.text({parent:p,text:t,size:size||14,weight:5,color:H.sw(APP,role||'ink'),w:width});}
function col(p,n,width,gap){var c=H.frame({parent:p,name:n,dir:'col',gap:gap===undefined?24:gap,pad:0,w:width,align:sketch.StackLayout.AlignItems.Start});c.stackLayout.alignItems=sketch.StackLayout.AlignItems.Start;return c;}
function row(p,n,width,height,gap){return H.frame({parent:p,name:n,dir:'row',gap:gap===undefined?8:gap,pad:0,w:width,h:height});}
function spacer(p){var z=H.frame({parent:p,name:'spacer',pad:0,h:1});z.horizontalSizing=sketch.FlexSizing.Fill;return z;}
function button(p,label,target,primary,width){var b=H.frame({parent:p,name:'link:'+target,dir:'row',gap:8,pad:{top:0,right:16,bottom:0,left:16},w:width,h:32,radius:999,fill:primary?H.sw(APP,'ink'):null,justify:sketch.StackLayout.JustifyContent.Center});H.sft({parent:b,text:label,size:13,weight:6,color:H.sw(APP,primary?'surface':'ink')});H.order(b);return b;}
function finish(){walk(s,function(l){if(l.name.indexOf('link:')===0)l.name=l.name.replace(/ \d+$/,'');});s.frame.x=INDEX*1560;s.frame.y=0;console.log(JSON.stringify({id:ID,app:APP,frame:String(s.id),phase:PHASE}));}

if(ID==='conversation--menu'){
 s.stackLayout=null;var trigger=named(s,'link:conversation--menu');var x=trigger.frame.x,y=trigger.frame.y,p=trigger.parent;while(p&&p.id!==s.id){x+=p.frame.x;y+=p.frame.y;p=p.parent;}
 var menu=H.frame({parent:s,name:'conversation-menu',dir:'col',gap:0,pad:6,w:244,radius:12,fill:H.sw(APP,'surface'),shadow:{color:'#00000025',blur:24,x:0,y:8},align:sketch.StackLayout.AlignItems.Start});
 [['pencil','Rename','conversation--rename'],['doc_on_doc','Duplicate','conversation'],['folder','Move to project','projects'],['square_and_arrow_up','Export','conversation'],['trash','Delete','conversation--delete']].forEach(function(v){var r=H.frame({parent:menu,name:'link:'+v[2],dir:'row',gap:10,pad:{top:0,right:10,bottom:0,left:10},w:232,h:28,radius:8});H.sfg(r,v[0],{size:16,color:H.sw(APP,v[0]==='trash'?'negative':'secondary')});H.sft({parent:r,text:v[1],size:13,weight:5,color:H.sw(APP,v[0]==='trash'?'negative':'ink')});H.order(r);});H.order(menu);menu.frame.x=x+28-244;menu.frame.y=y+34;menu.moveToFront();
}else{
 H.macScrim(s,APP);var approval=ID==='conversation--approval';var alert=H.macAlert(s,APP,{w:420,glyph:approval?'terminal':'trash',title:approval?'Run npm test in the project workspace':'Delete this conversation?',body:approval?'Weave will run npm test in ~/Developer/products/weave-cloud. This permission applies to workspace commands.':'This deletes “Move the billing webhook handler” and its message history. Project files will not be deleted.',buttons:approval?[['back','Deny','secondary'],['conversation','Always','secondary'],['conversation','Allow once','primary']]:[['back','Cancel','secondary'],['new-conversation','Delete','danger']]});
 walk(alert,function(l){if(l.style)l.style.borders=[];if(l.type==='Text'&&l.style.fontSize===11)l.style.fontSize=12;if(l.style&&l.style.corners&&l.name.indexOf('link:')===0)l.style.corners.radii=[8,8,8,8];});
 var icon=named(alert,'icon');icon.style.fills=[];icon.frame.width=32;icon.frame.height=32;var glyph=icon.layers[0];glyph.style.fontSize=22;glyph.style.fontWeight=5;glyph.style.textColor=H.sw(APP,approval?'accent':'secondary');icon.stackLayout.apply();
 var btns=named(alert,'buttons');btns.layers.forEach(function(b){b.style.shadows=[];var t=b.layers[0];var primary=t.text==='Allow once'||t.text==='Delete';b.style.fills=primary?[{color:H.sw(APP,'ink')}]:[];t.style.textColor=H.sw(APP,primary?'surface':t.text==='Delete'?'negative':'ink');});alert.stackLayout.apply();alert.frame.y=(900-alert.frame.height)/2-40;
}
finish();
