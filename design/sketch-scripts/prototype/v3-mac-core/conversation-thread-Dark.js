var APP="Dark/Clean", ID="conversation", INDEX=2, PHASE="thread";
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

var w={main:named(s,'main')};
var m = w.main; m.stackLayout.alignItems = sketch.StackLayout.AlignItems.Center; m.stackLayout.padding = { top: 16, right: 0, bottom: 20, left: 0 }; m.stackLayout.gap = 16;
var thread = H.frame({ name: 'thread', parent: m, dir: 'col', gap: 28, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.Start, justify: sketch.StackLayout.JustifyContent.End }); thread.verticalSizing = sketch.FlexSizing.Fill;
H.userTurn(thread, app, 'Move the billing webhook handler into its own service so retries stop blocking checkout. Ledger only — never resend emails.', 'Today at 14:02');
H.reasoned(thread, app, 'Reasoned for 18 seconds');
H.assistantTurn(thread, app, { time: '14:04', headline: 'A smaller service, a safer replay.', paragraphs: ['Extracting it keeps checkout fast even during a Stripe retry storm — Tuesday\'s 40-second stall came from retries running inline in the API process.', '1. Enqueue verified events from a thin route\n2. Deduplicate on event.id in a webhook_events table\n3. Replay re-derives ledger state only; emails are never resent'], build: function (r) {
  H.codeCard(r, app, { path: 'services/billing-webhook/index.ts', lines: ['export async function handle(event: StripeEvent) {', '  if (await seen(event.id)) return;', '  await ledger.apply(event); // never side-effects', '}'] });
  H.runRow(r, app, { cmd: 'npm test', status: '216 tests', pending: 'Permission needed', link: 'conversation--approval' }); } });
H.order(thread);
H.composer(m, app, {});
H.order(m);named(s,'content-col').stackLayout.apply();s.stackLayout.apply();finish();