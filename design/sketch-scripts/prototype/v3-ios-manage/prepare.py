from pathlib import Path
p=Path('/tmp/harso-sk/proto/lanes/v3-ios-manage')
s=Path('/tmp/harso-sk/proto/lanes/v2-ios-manage/generator.js').read_text()
s=s.replace("page:page,app:APP", "page:'Proto iOS '+APP.split('/')[0],app:APP")
s=s.replace("large:root||(['artifacts','routines'].includes(base)&&!detail)","large:false")
s=s.replace("radius:9","radius:999").replace("radius:7","radius:999")
s=s.replace("fill:H.sw(APP,'accent'),justify", "fill:H.sw(APP,'ink'),justify")
s=s.replace("size:17,weight:7,color:'#ffffff'","size:14,weight:7,color:H.sw(APP,'surface')")
s=s.replace("size:44,color:H.sw(APP,'accent')", "size:18,color:H.sw(APP,'accent')")
s=s.replace("H.sft({parent:q,text:title,size:22", "H.sft({parent:q,text:title,size:15")
s=s.replace(" b.stackLayout.gap=12;", " b.stackLayout.gap=4;b.stackLayout.padding={top:0,right:16,bottom:0,left:16};")
a=s.index(" var prof=H.frame(");z=s.index("}else if(base==='projects')",a)
s=s[:a]+" group([{title:'Abhi Bansal',detail:'Pro · Straits Lab',glyph:'person',link:'settings-account',h:44}]);\n [settingsRows.slice(0,5),settingsRows.slice(5)].forEach(rows=>group(rows.map(a=>({link:'settings-'+a[0],glyph:a[1],title:a[3],h:44}))));group([{title:'Sign Out',link:'settings--sign-out',destructive:true,chevron:false,h:44}]);\n"+s[z:]
s=s.replace("detail:'●'","dot:H.hex(APP,'accent')")
s=s.replace("glyph:'checkmark_circle_fill'","glyph:'checkmark'")
s=s.replace("h:72","h:64").replace("h:68","h:60")
a=s.index("else if(detail){");z=s.index("\n else {seg(['All'",a)
s=s[:a]+"""else if(detail){seg(['Preview','Code'],['artifacts--detail','artifacts--code'],ID==='artifacts--code'?1:0);txt('Markdown · 4.2 KB · Today, 9:38 AM',12);if(ID!=='artifacts--code'){H.text({parent:b,text:'A safer billing rollout',size:22,weight:6,color:H.sw(APP,'ink'),w:358});txt('The handler is isolated. Signature validation and event deduplication keep retries off the checkout path.',14);group([{title:'Extract handler',detail:'Complete'},{title:'Validate signatures',detail:'Complete'},{title:'Regression tests',detail:'148 passed'},{title:'Deploy canary',detail:'Awaiting approval'}],{header:'Release checklist'});}H.codeCard(b,APP,{w:358,path:'webhook-rollout.md',lines:ID==='artifacts--code'?['# Billing webhook rollout','','- [x] Extract handler','- [x] Validate signatures','- [x] Run 148 regression tests','- [ ] Deploy canary','','POST /api/billing/webhook','Idempotency: event.id','Retries: exponential backoff']:['await ledger.apply(event, {','  idempotencyKey: event.id,','  sendEmails: false','});']});}
"""+s[z:]
s=s.replace("gap:8,pad:10,w:172,radius:12,fill:H.sw(APP,'surface')", "gap:8,pad:0,w:172")
s=s.replace("w:152,h:82,pad:0,radius:8,fill:H.alpha(a[3],.12)", "w:172,h:82,pad:0,radius:12,fill:H.sw(APP,'panel')")
s=s.replace("size:32,color:a[3]", "size:18,weight:5,color:H.sw(APP,'secondary')")
s=s.replace("size:11,weight:5,color:H.sw(APP,'tertiary'),w:152", "size:12,weight:5,color:H.sw(APP,'tertiary'),w:172")
s=s.replace("group(c[0].map(a=>({title:a[0],sub:a[1],h:60,link:cat==='billing'&&a[0]==='Plan'?'settings-billing--plan':undefined,glyph:a[0]==='Plan'?'star':undefined,tint:'#ed941d'}))", "group(c[0].filter(a=>cat!=='billing'||a[0]!=='Usage').map(a=>({title:a[0],detail:cat==='billing'&&a[0]==='Plan'?'Pro · S$32/month':a[1],h:52,link:cat==='billing'&&a[0]==='Plan'?'settings-billing--plan':'settings-'+cat})))" )
# Above replacement leaves an extra parenthesis before options; repair exact.
s=s.replace("'settings-'+cat}))),{header", "'settings-'+cat})),{header")
s=s.replace("var c=configs[cat];", "var c=configs[cat];if(cat==='billing'){var usage=H.frame({name:'usage',parent:b,dir:'row',gap:12,pad:0,w:358,h:44});H.ring(usage,APP,.0824,16);H.sft({parent:usage,text:'41.2k of 500k tokens · 8% used',size:13,weight:5,color:H.sw(APP,'secondary')});H.order(usage);}")
a=s.index("if(ID==='artifacts--share'){");z=s.index("\nif(ID==='settings--sign-out')",a)
s=s[:a]+"if(ID==='artifacts--share'){var sh=H.iosSheet(r.screen,APP,{title:'Share',cancelLabel:'Done',h:480});txt('Webhook rollout · Markdown · 4.2 KB',12,sh.body);group([['Messages','bubble'],['Mail','envelope'],['Notes','book'],['Files','folder'],['Copy','doc_on_doc']].map(a=>({title:a[0],glyph:a[1],link:'back',chevron:false})),{},sh.body);sh.finish();}"+s[z:]
s=s.replace("radius:14,fill:H.sw(APP,'surface')", "radius:999,fill:H.sw(APP,'panel')")
s=s.replace("gap:0,pad:0,w:358,radius:999", "gap:0,pad:0,w:358,radius:12")
s=s.replace("size:20,weight:7,color:H.sw(APP,'accent')", "size:14,weight:7,color:H.sw(APP,'ink')")
s=s.replace("size:20,weight:5,color:H.sw(APP,'negative')", "size:14,weight:5,color:H.sw(APP,'negative')")
# Lane-local wrappers normalize inherited native helpers to v3 scale without editing shared library.
pre="""var sftext=H.sft;H.sft=function(o){if(o.size===17||o.size===16)o.size=14;else if(o.size===20)o.size=15;else if(o.size===34)o.size=22;else if(o.size===10)o.size=11;return sftext(o);};
var baseGroup=H.iosGroup;H.iosGroup=function(parent,app,rows,o){rows.forEach(function(r){delete r.tint;});var g=baseGroup(parent,app,rows,o);function walk(l){if(l.name==='dot'){l.frame.width=5;l.frame.height=5;}if(l.layers)l.layers.forEach(walk);}walk(g);return g;};
"""
s=pre+s
p.joinpath('generator.js').write_text(s)
