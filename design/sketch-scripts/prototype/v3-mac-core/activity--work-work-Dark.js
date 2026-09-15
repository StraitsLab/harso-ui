var APP="Dark/Clean", ID="activity--work", INDEX=8, PHASE="work";
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

var ib=H.inspBody(named(s,'inspector'),APP);
H.inspSection(ib,APP,'Objective',true);H.quietRow(ib,APP,{glyph:'folder',title:'Prepare the release',meta:'Weave Cloud · v0.18.3',strong:true});H.quietRow(ib,APP,{title:'Verify the ledger migration, run the test suite, and draft release notes.',tw:272});
H.inspSection(ib,APP,'Attempt');H.quietRow(ib,APP,{dot:H.hex(APP,'accent'),title:'Running · Attempt 1',meta:'Started 14:16 · 2 minutes · 18.4k tokens'});
H.inspSection(ib,APP,'Plan');[['tertiary','1. Review changed files','Completed · 7 files reviewed'],['attention-mark','2. Run npm test','Waiting for your approval'],['tertiary','3. Draft release notes','Queued after verification']].forEach(function(v){H.quietRow(ib,APP,{dot:H.hex(APP,v[0]),title:v[1],meta:v[2],tw:240});});
H.inspSection(ib,APP,'Needs you');H.quietRow(ib,APP,{dot:H.hex(APP,'attention-mark'),title:'Allow workspace command',meta:'npm test · Project workspace',link:'conversation--approval',chevron:true});
var actions=col(ib,'work-actions',272,8);button(actions,'Respond','conversation--approval',true,272);var sec=row(actions,'secondary-actions',272,32);button(sec,'Steer','conversation',false,132);button(sec,'Cancel','activity',false,132);H.order(sec);H.order(actions);H.order(ib);H.order(named(s,'inspector'));s.stackLayout.apply();finish();
