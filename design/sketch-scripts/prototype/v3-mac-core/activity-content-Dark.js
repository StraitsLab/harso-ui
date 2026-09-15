var APP="Dark/Clean", ID="activity", INDEX=7, PHASE="content";
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

var m=named(s,'main');
if(ID==='signin'){
 m.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;m.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.Center;
 var a=col(m,'authentication',360,24);a.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;
 H.sfg(a,'sparkles',{size:22,color:H.sw(APP,'accent')});tx(a,'Sign in to Weave',22);tx(a,'Your work, with a little more possibility.',14,'secondary');
 button(a,'Continue with Apple','new-conversation',false,320);button(a,'Continue with Google','new-conversation',false,320);tx(a,'or continue with email',12,'tertiary');
 var f=row(a,'email-field',320,40,10);H.sfg(f,'envelope',{color:H.sw(APP,'tertiary')});tx(f,'abhi@straitslab.com',14);H.order(f);button(a,'Continue','new-conversation',true,320);tx(a,'By continuing, you agree to the Terms of Service\nand Privacy Policy.',12,'tertiary',320);H.order(a);
}else if(ID==='new-conversation'){
 m.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;m.stackLayout.justifyContent=sketch.StackLayout.JustifyContent.Center;
 H.sfg(m,'sparkles',{size:22,color:H.sw(APP,'accent')});tx(m,'What can I help with?',22);var c=H.composer(m,APP,{w:620,placeholder:'Ask anything…'});named(c,'send').name='link:conversation';
 var pr=row(m,'link:projects',undefined,28);H.sfg(pr,'folder',{color:H.sw(APP,'secondary')});tx(pr,'Personal',13,'secondary');H.sfg(pr,'chevron_down',{size:11,color:H.sw(APP,'tertiary')});H.order(pr);tx(m,'Nothing is created until you send',12,'tertiary');
}else if(ID==='search'){
 m.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;m.stackLayout.gap=24;
 var body=col(m,'search-results',720,24);
 var field=H.frame({parent:body,name:'search-field',dir:'row',gap:12,pad:{top:0,right:16,bottom:0,left:16},w:520,h:40,radius:999,fill:H.sw(APP,'panel')});H.sfg(field,'magnifyingglass',{color:H.sw(APP,'secondary')});tx(field,'ledger',14);spacer(field);H.sfBtn(field,'link:new-conversation','xmark_circle',APP,{w:24,h:24,size:16,weight:5});H.order(field);
 var scopes=row(body,'scopes',720,32,8);['All','Conversations','Projects','Work'].forEach(function(t,i){button(scopes,t,'search',i===0);});spacer(scopes);tx(scopes,'7 results',12,'tertiary');H.order(scopes);
 [['Projects',[['folder','Ledger reliability','6 conversations · 4 artifacts','⌘1'],['folder','Finance & ledger','12 conversations · 8 artifacts','⌘2']]],['Conversations',[['bubble','Move the billing webhook handler','Personal · Ledger-only replay, no customer emails','⌘3'],['bubble','Reconcile August ledger entries','Weave Cloud · Matched 42 Stripe payouts','⌘4'],['bubble','Ledger idempotency decisions','Personal · Key every event by event.id','⌘5']]],['Work',[['terminal','Audit the checkout retry policy','Personal · Completed · 9.4k tokens','⌘6'],['terminal','Prepare the release','Weave Cloud · Ledger migration verification','⌘7']]]].forEach(function(g){var sec=col(body,'results-'+g[0],720,8);H.caps(sec,APP,g[0]);g[1].forEach(function(v){H.quietRow(sec,APP,{glyph:v[0],title:v[1],meta:v[2],trail:v[3],w:720,tw:570,link:'conversation'});});H.order(sec);});
 tx(body,"Reasoning isn't searched",12,'tertiary');H.order(body);
}else{
 m.stackLayout.alignItems=sketch.StackLayout.AlignItems.Center;var body=col(m,'activity-list',720,24);
 var filters=row(body,'filters',720,32);button(filters,'All work','activity',true);button(filters,'Needs you · 2','activity',false);spacer(filters);tx(filters,'Updated just now',12,'tertiary');H.order(filters);
 var today=col(body,'today',720,16);H.caps(today,APP,'Today');
 [['accent','Prepare the release','Weave Cloud · Running · Plan 1 of 3 · Approval needed','2 min ago'],['tertiary','Move the billing webhook handler','Personal · Completed · 3 files · 216 tests passed','14:18'],['attention-mark','Verify macOS signing','Weave Cloud · Failed · Signing identity expired','13:42'],['tertiary','Reconcile August invoices','Personal · Completed · 42 invoices matched','11:28'],['tertiary','Draft the Q3 investor update','Weave Cloud · Completed · investor-update.md','10:06']].forEach(function(v){H.quietRow(today,APP,{dot:H.hex(APP,v[0]),title:v[1],meta:v[2],trail:v[3],w:720,tw:550,link:'activity--work',strong:true});});H.order(today);
 var yesterday=col(body,'yesterday',720,16);H.caps(yesterday,APP,'Yesterday');[['Audit the checkout retry policy','Personal · Completed · 9.4k tokens'],['Summarize the release feedback','Weave Cloud · Completed · 7.2k tokens']].forEach(function(v){H.quietRow(yesterday,APP,{dot:H.hex(APP,'tertiary'),title:v[0],meta:v[1],w:720,tw:550,link:'activity--work'});});H.order(yesterday);H.order(body);
}
H.order(m);var cc=named(s,'content-col');cc.stackLayout.apply();s.stackLayout.apply();finish();
