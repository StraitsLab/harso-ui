var APP="Light/Clean", ID="conversation--rail", INDEX=9, PHASE="inspector";
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

var w={inspector:named(s,'inspector')};
var ib = H.inspBody(w.inspector, app);
H.inspSection(ib, app, 'Context', true);
H.quietRow(ib, app, { glyph: 'folder', title: 'Personal', meta: '~/Developer/products/weave-cloud', mono: false });
H.quietRow(ib, app, { glyph: 'doc', title: 'Ledger only. Never resend emails. Ask before running workspace commands.', tw: 236 });
H.inspSection(ib, app, 'Changed files');
[['services/billing-webhook/index.ts', '+184'], ['api/routes/billing.ts', '−92'], ['db/migrations/0142_webhook_events.sql', '+31']].forEach(function (f) { H.quietRow(ib, app, { glyph: 'doc', title: f[0], mono: true, meta: (f[1][0] === '+' ? f[1] + ' lines added' : f[1] + ' lines removed'), tw: 236 }); });
H.inspSection(ib, app, 'Approvals');
H.quietRow(ib, app, { dot: H.hex(app, 'attention-mark'), title: 'Review npm test', meta: 'Waiting for you · 2 minutes', strong: true, chevron: true, link: 'conversation--approval' });
H.inspSection(ib, app, 'Context window');
var cw = H.frame({ name: 'usage', parent: ib, dir: 'row', gap: 10, pad: { top: 4, right: 0, bottom: 4, left: 0 }, w: 272 }); H.ring(cw, app, 0.21, 16); var cwt = H.frame({ name: 'text', parent: cw, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.text({ parent: cwt, text: '41.2k of 200k tokens', size: 13, weight: 5, color: H.sw(app, 'ink') }); H.text({ parent: cwt, text: '21% used · plenty of room', size: 12, weight: 5, color: H.sw(app, 'tertiary') }); H.order(cwt); H.order(cw);
H.inspSection(ib, app, 'Session');
H.quietRow(ib, app, { glyph: 'cube', title: 'Claude Fable 5.1', meta: 'Started 14:02 · 16 minutes · 3 files · 2 new tests' });
H.order(ib);H.order(w.inspector);s.stackLayout.apply();finish();