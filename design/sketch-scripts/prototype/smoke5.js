var page = H.page('Proto scratch'); page.layers.forEach(function (l) { l.remove(); });
var app = 'Light/Clean';
function build(rail, x) {
var s = H.screen({ page: page, platform: 'macos', app: app, id: rail ? 'v3-conversation-rail' : 'v3-conversation', w: 1440, h: 900, x: x, y: 0 });
var w = H.macWindow(s, app, { rail: rail, active: 'conversation', title: 'Move the billing webhook handler', subtitle: 'Personal · 14 turns', tools: [['link:conversation--menu', 'ellipsis'], ['share', 'square_and_arrow_up']], inspector: 'Context', inspectorToggle: 'conversation' });
var m = w.main; m.stackLayout.alignItems = sketch.StackLayout.AlignItems.Center; m.stackLayout.padding = { top: 16, right: 0, bottom: 20, left: 0 }; m.stackLayout.gap = 16;
var thread = H.frame({ name: 'thread', parent: m, dir: 'col', gap: 28, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.Start, justify: sketch.StackLayout.JustifyContent.End }); thread.verticalSizing = sketch.FlexSizing.Fill;
H.userTurn(thread, app, 'Move the billing webhook handler into its own service so retries stop blocking checkout. Ledger only — never resend emails.', 'Today at 14:02');
H.reasoned(thread, app, 'Reasoned for 18 seconds');
H.assistantTurn(thread, app, { time: '14:04', headline: 'A smaller service, a safer replay.', paragraphs: ['Extracting it keeps checkout fast even during a Stripe retry storm — Tuesday\'s 40-second stall came from retries running inline in the API process.', '1. Enqueue verified events from a thin route\n2. Deduplicate on event.id in a webhook_events table\n3. Replay re-derives ledger state only; emails are never resent'], build: function (r) {
  H.codeCard(r, app, { path: 'services/billing-webhook/index.ts', lines: ['export async function handle(event: StripeEvent) {', '  if (await seen(event.id)) return;', '  await ledger.apply(event); // never side-effects', '}'] });
  H.runRow(r, app, { cmd: 'npm test', status: '216 tests', pending: 'Permission needed', link: 'conversation--approval' }); } });
H.order(thread);
H.composer(m, app, {});
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
H.order(ib); w.finish(); return s; }
var a = build(false, 0), b = build(true, 1560);
console.log(JSON.stringify({ a: String(a.id), b: String(b.id) }));
