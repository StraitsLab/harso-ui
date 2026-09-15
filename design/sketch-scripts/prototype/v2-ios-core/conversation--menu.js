var APP = 'Light/Clean';
// Lane-local native components. Shared helpers are not mutated on disk.
var origFrame=H.frame; H.frame=function(o){var f=origFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var START=sketch.StackLayout.AlignItems.Start,CENTER=sketch.StackLayout.AlignItems.Center,END=sketch.StackLayout.JustifyContent.End;
function txt(p,t,size,role,w,weight,mono){return H.text({parent:p,text:t,size:size||16,weight:weight||5,color:H.sw(APP,role||'ink'),w:w,mono:mono});}
function sftext(p,t,size,role,w,weight){return H.sft({parent:p,text:t,size:size||17,weight:weight||5,color:H.sw(APP,role||'ink'),w:w});}
function col(p,name,w,gap,pad,fill){return H.frame({parent:p,name:name,dir:'col',w:w,gap:gap||0,pad:pad||0,fill:fill,align:START});}
function gap(p,h,fill){var s=H.frame({parent:p,name:'space',pad:0,w:1,h:h||1});if(fill)s.verticalSizing=sketch.FlexSizing.Fill;return s;}
function pill(p,label,link,kind,w){var f=H.frame({parent:p,name:'link:'+link,w:w||358,h:50,radius:25,pad:0,fill:H.sw(APP,kind==='ink'?'ink':kind==='primary'?'accent':'surface'),border:kind==='secondary'?H.sw(APP,'line-strong'):null,justify:sketch.StackLayout.JustifyContent.Center});H.sft({parent:f,text:label,size:17,weight:7,color:kind==='ink'?H.sw(APP,'canvas'):kind==='primary'?'#ffffff':H.sw(APP,'accent')});f.stackLayout.apply();return f;}
function chips(p,items){var row=H.frame({parent:p,name:'scopes',dir:'row',gap:8,w:358,pad:0});items.forEach(function(a,i){var c=H.frame({parent:row,name:'link:'+a[2],dir:'row',gap:6,pad:{top:0,right:12,bottom:0,left:12},h:34,radius:17,fill:H.sw(APP,i===0?'accent-soft':'surface')});if(a[1])H.sf(c,a[1],{size:14,color:H.sw(APP,i===0?'accent':'secondary')});sftext(c,a[0],14,i===0?'accent':'secondary',null,6);H.order(c);});H.order(row);}
function banner(p){var c=H.frame({parent:p,name:'link:conversation--approval',dir:'row',gap:10,pad:12,w:358,radius:12,fill:H.alpha(H.hex(APP,'attention'),0.13)});H.sf(c,'exclamation_triangle',{size:19,color:H.hex(APP,'attention')});var t=col(c,'copy',273,3);sftext(t,'Approval needed',15,'ink',273,7);sftext(t,'Run migration on staging',13,'secondary',273);H.order(t);H.sf(c,'chevron_right',{size:13,color:H.sw(APP,'tertiary')});H.order(c);}
function composer(p,home){var c=col(p,'composer',358,8,{top:12,right:12,bottom:10,left:14},H.sw(APP,'surface'));c.style.corners.radii=[22,22,22,22];c.style.borders=[{color:H.sw(APP,'line-strong'),thickness:1,position:sketch.Style.BorderPosition.Inside}];sftext(c,home?'What can I help with?':'Message Weave',17,'tertiary',330);var row=H.frame({parent:c,name:'controls',dir:'row',gap:4,pad:0,w:332,h:36});H.sfBtn(row,'link:conversation--menu','plus',APP,{size:18});var s=gap(row,1);s.horizontalSizing=sketch.FlexSizing.Fill;H.sfBtn(row,'link:conversation--voice','mic',APP,{size:18,color:H.sw(APP,'ink')});H.sfBtn(row,'link:conversation','arrow_up',APP,{size:17,radius:18,fill:H.sw(APP,'accent'),color:'#ffffff'});H.order(row);H.order(c);return c;}
function user(p,t){var row=H.frame({parent:p,name:'user-message',dir:'row',w:358,pad:0,justify:END});var c=col(row,'bubble',304,0,{top:12,right:14,bottom:12,left:14},H.sw(APP,'accent-soft'));c.style.corners.radii=[20,20,5,20];txt(c,t,16,'ink',276);H.order(c);row.stackLayout.apply();}
function ai(p,t){var row=H.frame({parent:p,name:'assistant-message',dir:'row',w:358,gap:10,pad:0,align:START});var mark=H.frame({parent:row,name:'weave-mark',w:24,h:26,pad:0,justify:sketch.StackLayout.JustifyContent.Center});H.sf(mark,'sparkles',{size:19,color:H.hex(APP,'accent')});mark.stackLayout.apply();txt(row,t,16,'ink',324);H.order(row);}
function tool(p){var row=H.frame({parent:p,name:'link:activity--work',dir:'row',w:358,gap:10,pad:12,radius:12,fill:H.sw(APP,'surface')});H.sf(row,'terminal',{size:18,color:H.hex(APP,'accent')});var t=col(row,'run-copy',285,3);txt(t,'npm test',14,'ink',285,6,true);sftext(t,'216 passed · 42 seconds',13,'secondary',285);H.order(t);H.order(row);}
function buildContent(r,id){var b=r.body;
if(id==='signin'){
 b.stackLayout.padding={top:88,right:24,bottom:24,left:24};b.stackLayout.gap=14;b.stackLayout.alignItems=CENTER;
 var mark=H.frame({parent:b,name:'weave-mark',w:80,h:80,pad:0,radius:24,fill:H.sw(APP,'accent-soft'),justify:sketch.StackLayout.JustifyContent.Center});H.sf(mark,'sparkles',{size:43,color:H.hex(APP,'accent')});mark.stackLayout.apply();
 var title=H.sft({parent:b,text:'Sign in to Weave',size:28,weight:8,color:H.sw(APP,'ink'),w:342,align:sketch.Text.Alignment.center});
 var sub=H.sft({parent:b,text:'Your ideas, with a little more possibility.',size:16,weight:5,color:H.sw(APP,'secondary'),w:342,align:sketch.Text.Alignment.center});gap(b,18);
 pill(b,'Continue with Apple','home','ink',342);pill(b,'Continue with Google','home','secondary',342);
 var or=H.sft({parent:b,text:'or use your email',size:13,color:H.sw(APP,'tertiary'),w:342,align:sketch.Text.Alignment.center});
 var field=H.frame({parent:b,name:'email-field',dir:'row',w:342,h:52,pad:{top:0,right:16,bottom:0,left:16},radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});sftext(field,'Email address',17,'tertiary');field.stackLayout.apply();pill(b,'Continue','home','primary',342);gap(b,1,true);
 H.sft({parent:b,text:'By continuing, you agree to our Terms of Service\nand Privacy Policy.',size:12,color:H.sw(APP,'tertiary'),w:342,align:sketch.Text.Alignment.center});
}else if(id==='home'){
 sftext(b,'Good morning, Abhi',20,'ink',358,6);sftext(b,'A little momentum for your day.',15,'secondary',358);
 chips(b,[['Personal','folder','project'],['Write','pencil','conversation'],['Build','terminal','conversation']]);
 H.iosGroup(b,APP,[{link:'conversation',title:'Move the billing webhook',sub:'Personal · 2 min ago',h:64},{link:'conversation',title:'Q3 investor update',sub:'Straits Lab · Yesterday',h:64},{link:'conversation',title:'Mac build size audit',sub:'Weave Cloud · Yesterday',h:64}],{header:'Recent conversations'});
 gap(b,1,true);composer(b,true);
}else if(id.indexOf('conversation')===0){
 sftext(b,'TODAY  9:36 AM',12,'tertiary',358);user(b,'Move the billing webhook into its own service. Retries are blocking checkout.');
 ai(b,'The handler runs inline today. I’ll queue events and deduplicate by event.id.\n\nShould replays resend emails, or only rebuild the ledger?');
 user(b,'Ledger only. Never resend emails.');ai(b,'Done. Three files changed and two regression tests added.');tool(b);gap(b,1,true);banner(b);composer(b,false);
}else if(id==='search'){
 chips(b,[['All',null,'search'],['Conversations',null,'search'],['Artifacts',null,'artifacts'],['Projects',null,'projects']]);
 H.iosGroup(b,APP,[{link:'conversation',glyph:'bubble',title:'Billing webhook',sub:'Move retries out of checkout',h:68},{link:'conversation',glyph:'bubble',title:'Q3 investor update',sub:'Draft · Straits Lab',h:68},{link:'conversation',glyph:'bubble',title:'Mac build size audit',sub:'Weave Cloud · Yesterday',h:68}],{header:'Recent conversations'});
 H.iosGroup(b,APP,[{link:'artifacts',glyph:'doc',tint:'#ff9f0a',title:'Q3 investor update.md',sub:'Edited yesterday',h:64},{link:'artifacts',glyph:'doc',tint:'#ff9f0a',title:'Webhook migration plan',sub:'Personal · 3 min ago',h:64}],{header:'Recently opened'});
 H.iosGroup(b,APP,[{link:'project',glyph:'folder',title:'Personal',detail:'12'},{link:'project',glyph:'folder',title:'Weave Cloud',detail:'48'}],{header:'Projects'});
}else if(id==='activity'){
 sftext(b,'One decision is waiting for you.',16,'secondary',358);
 workGroup(b,'Needs your attention',[['#ff9f0a','Billing webhook migration','Personal · Approval needed · 2 min']]);
 workGroup(b,'Running',[['#0a84ff','Mac build size audit','Weave Cloud · Running · 4 min'],['#0a84ff','Reconcile August receipts','Personal · Running · 7 min']]);
 workGroup(b,'Completed today',[['#30b96a','Q3 investor update','Straits Lab · Done · 9:12 AM'],['#30b96a','Weekly product digest','Weave Cloud · Done · 8:45 AM'],['#30b96a','Refresh onboarding copy','Weave Cloud · Done · 8:30 AM']]);
}else if(id==='activity--work'){
 sftext(b,'Billing webhook migration',24,'ink',358,8);txt(b,'Move retries off the checkout request path without replaying customer emails.',16,'secondary',358);sftext(b,'Personal · Attempt 1 · Started 9:36 AM',13,'tertiary',358);
 H.iosGroup(b,APP,[{glyph:'checkmark',tint:'#30b96a',title:'Trace checkout handler',chevron:false},{glyph:'checkmark',tint:'#30b96a',title:'Extract service & add tests',chevron:false},{glyph:'pause',tint:'#ff9f0a',title:'Run staging migration',chevron:false}],{header:'Steps · 2 of 3 complete'});
 var files=col(b,'changed-files',358,0);sftext(files,'CHANGED FILES',13,'tertiary',358);gap(files,8);
 [['services/billing-webhook/','index.ts','+184 −0'],['api/routes/billing.ts','','+8 −92'],['db/migrations/','0142_webhook_events.sql','+31 −0']].forEach(function(a){var row=H.frame({parent:files,name:'link:artifacts',dir:'row',gap:10,w:358,h:52,pad:10,radius:8,fill:H.sw(APP,'surface')});H.sf(row,'doc',{size:17,color:H.sw(APP,'secondary')});var tc=col(row,'file-path',244,0);txt(tc,a[0]+(a[1]?'\n'+a[1]:''),11,'ink',244,5,true);H.order(tc);txt(row,a[2],10,'positive',54,6,true);H.order(row);});H.order(files);banner(b);
 var actions=H.frame({parent:b,name:'actions',dir:'row',gap:10,w:358,pad:0});pill(actions,'Steer','conversation','secondary',111);pill(actions,'Cancel','conversation--delete','secondary',111);pill(actions,'Respond','conversation--approval','primary',116);H.order(actions);
}
}
function workGroup(b,header,items){var rows=items.map(a=>({link:'activity--work',title:a[1],sub:a[2],h:64}));var g=H.iosGroup(b,APP,rows,{header:header});var rs=g.layers.find(l=>l.name==='rows');rs.layers.filter(l=>l.name==='sep').forEach(function(sep){sep.stackLayout.padding={top:0,right:0,bottom:0,left:33};sep.stackLayout.apply();});rs.layers.filter(l=>/^link:/.test(l.name)).reverse().forEach(function(r,i){var t=r.layers.find(l=>l.name==='text');t.frame.x+=14;var dot=H.rect({parent:r,name:'status-dot',w:7,h:7,oval:true,fill:items[i][0]});dot.index=r.layers.length-1;r.stackLayout.gap=10;r.stackLayout.apply();});}
function overlay(r,id){
 if(id==='conversation--approval'){
 var sh=H.iosSheet(r.screen,APP,{title:'Allow Command?',h:380});sh.body.stackLayout.gap=10;sh.body.stackLayout.padding={top:8,right:16,bottom:28,left:16};
 var command=col(sh.body,'command',358,5,12,H.sw(APP,'surface'));command.style.corners.radii=[12,12,12,12];txt(command,'npm run db:migrate -- --staging',13,'ink',334,6,true);txt(command,'~/Developer/products/weave-cloud',11,'secondary',334,5,true);H.order(command);
 var g=H.iosGroup(sh.body,APP,[{link:'conversation--approval',title:'Always allow in Personal',toggle:false}],{});
 pill(sh.body,'Allow once','conversation','primary');pill(sh.body,'Deny','back','secondary');sh.finish();
 }else if(id==='conversation--delete'){H.iosAlert(r.screen,APP,{title:'Delete Conversation?',body:'“Billing webhook” and its work log will be deleted. Saved artifacts are kept. This can’t be undone.',buttons:[['back','Cancel','bold'],['home','Delete','danger']]});
 }else if(id==='conversation--menu'){
 H.macScrim(r.screen,APP);var menu=col(r.screen,'menu',250,0,0,H.sw(APP,'surface'));menu.style.corners.radii=[16,16,16,16];menu.style.shadows=[{color:'#00000030',blur:30,x:0,y:8}];
 [['Rename','pencil','conversation'],['Share','square_and_arrow_up','conversation'],['Move to project','folder','projects'],['Export','square_and_arrow_up','artifacts'],['Delete','trash','conversation--delete']].forEach(function(a,i){if(i===4)H.rect({parent:menu,name:'separator',w:250,h:8,fill:H.sw(APP,'canvas')});var row=H.frame({parent:menu,name:'link:'+a[2],dir:'row',gap:12,pad:{top:0,right:16,bottom:0,left:16},w:250,h:48});sftext(row,a[0],17,i===4?'negative':'ink',183);H.sf(row,a[1],{size:18,color:H.sw(APP,i===4?'negative':'ink')});H.order(row);if(i<3)H.rect({parent:menu,name:'separator',w:250,h:1,fill:H.sw(APP,'line')});});H.order(menu);menu.frame.x=124;menu.frame.y=100;menu.moveToFront();var scr=r.screen.layers.find(l=>l.name==='scrim');scr.name='link:back';
 }
}
function build(id,index){var page='Proto iOS '+APP.split('/')[0];var opts={page:page,app:APP,id:id,x:index*510,y:0,gap:16,tab:false};if(id==='home'){opts.title='Weave';opts.large=true;opts.tab='home';opts.trailing=[['search','magnifyingglass'],['conversation','square_pencil']];}else if(id.indexOf('conversation')===0){opts.title='Billing webhook';opts.back='Personal';opts.trailing=[['conversation--menu','ellipsis']];opts.gap=16;}else if(id==='activity'){opts.title='Activity';opts.large=true;opts.tab='activity';opts.trailing=[['search','magnifyingglass']];}else if(id==='activity--work'){opts.title='Work';opts.back='Activity';opts.gap=14;}else if(id==='search'){opts.title='';opts.gap=20;}
 var r=H.iosScreen(opts);buildContent(r,id);r.finish();
 if(id==='search'){var top=r.screen.layers.find(l=>l.name==='top');var nav=top.layers.find(l=>l.name==='nav-bar');var bar=nav.layers.find(l=>l.name==='bar');bar.layers.slice().forEach(l=>l.remove());bar.stackLayout.padding={top:0,right:16,bottom:0,left:16};bar.stackLayout.gap=12;var f=H.frame({parent:bar,name:'search-field',dir:'row',gap:8,pad:10,w:286,h:36,radius:12,fill:H.sw(APP,'surface')});H.sf(f,'magnifyingglass',{size:17,color:H.sw(APP,'tertiary')});sftext(f,'Search',17,'tertiary');H.order(f);var cancel=sftext(bar,'Cancel',17,'accent');cancel.name='link:back';H.order(bar);}
 overlay(r,id);r.screen.frame.x=index*510;r.screen.frame.y=0;
 function clean(l){if(/^link:/.test(l.name))l.name=l.name.replace(/ \d+$/,'');(l.layers||[]).forEach(clean);}clean(r.screen);
 console.log(JSON.stringify({id:id,app:APP,frame:String(r.screen.id),w:r.screen.frame.width,h:r.screen.frame.height}));return r.screen;
}

var p=H.page('Proto iOS Light');p.layers.slice().forEach(function(l){if(l.name==='Screen/ios/'+APP+'/conversation--menu'||(/^caption\//.test(l.name)&&l.name.endsWith('/conversation--menu')))l.remove();});build('conversation--menu',4);