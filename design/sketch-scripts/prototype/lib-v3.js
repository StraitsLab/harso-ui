// Boundaryless v3 chrome — the APPROVED direction (docs/direction/conversation-target-*.png, 2026-09-15).
// Rules: borderless (tonal steps only, no rules), two shaded surfaces per screen (code/artifact + composer), quiet rows
// with 5px dots instead of cards, 56px icon-only rail or 240px source list with faint active tint and no badges, one
// type scale (11 caps / 13 chrome+meta / 14 body / 15 title), radius system (8 rows · 12 cards · 16 composer · pill chips),
// 16px hairline rings, 1.5px monoline SF glyphs (weight 5), one blue + one amber.
// Overrides the v2 helpers of the same names (this file is concatenated AFTER lib-native.js).
H.T = { caps: 11, meta: 12, chrome: 13, body: 14, title: 15, display: 22 };
H.R = { row: 8, card: 12, composer: 16, pill: 999 };
H.sfg = function (parent, name, o) { o = o || {}; o.weight = o.weight || 5; o.size = o.size || 16; return H.sf(parent, name, o); }; // monoline glyph
H.caps = function (parent, app, text, o) { o = o || {}; var t = H.sft({ parent: parent, text: String(text).toUpperCase(), size: H.T.caps, weight: 7, color: H.sw(app, 'tertiary'), w: o.w }); t.style.kerning = 0.6; return t; };
H.dot = function (parent, color, size) { return H.rect({ parent: parent, name: 'dot', w: size || 5, h: size || 5, oval: true, fill: color }); };
H.ring = function (parent, app, pct, size) { size = size || 16; var g = new sketch.Group({ name: 'ring', parent: parent }); var track = new sketch.ShapePath({ name: 'track', parent: g, shapeType: sketch.ShapePath.ShapeType.Oval, frame: { x: 0, y: 0, width: size, height: size } }); track.style.fills = []; track.style.borders = [{ color: H.sw(app, 'line-strong'), thickness: 1.5, enabled: true, position: sketch.Style.BorderPosition.Center }];
  var arc = new sketch.ShapePath({ name: 'arc', parent: g, shapeType: sketch.ShapePath.ShapeType.Oval, frame: { x: 0, y: 0, width: size, height: size } }); arc.style.fills = []; arc.style.borders = [{ color: H.sw(app, 'accent'), thickness: 1.5, enabled: true, position: sketch.Style.BorderPosition.Center }]; try { arc.style.borderOptions = { dashPattern: [Math.round(Math.PI * size * (pct || 0.2)), Math.round(Math.PI * size)], lineEnd: sketch.Style.LineEnd.Round }; } catch (e) {} arc.transform.rotation = -90; g.adjustToFit(); g.frame.width = size; g.frame.height = size; return g; };

// ---------- macOS window v3: 240 source list (or 56 rail) + 52 toolbar (no rule) + optional 320 inspector, all tonal.
H.macWindow = function (screen, app, o) {
  o = o || {}; var W = screen.frame.width, Hh = screen.frame.height; var dark = app.indexOf('Dark') === 0; var rail = !!o.rail; var sbw = rail ? 56 : 240;
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 0, pad: 0, w: sbw, h: Hh, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tl = H.frame({ name: 'titlebar', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 10, bottom: 0, left: rail ? 12 : 20 }, w: sbw, h: 52 });
  [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function (c, i) { H.rect({ parent: tl, name: 'traffic-' + i, w: 12, h: 12, oval: true, fill: c[0], border: c[1] }); });
  if (!rail) { var spT = H.frame({ name: 'spacer', parent: tl, pad: 0, h: 1 }); spT.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(tl, 'link:' + (o.collapseLink || 'back'), 'sidebar_left', app, { size: 16, weight: 5, color: H.sw(app, 'secondary') }); }
  H.order(tl);
  var active = o.active;
  var list = H.frame({ name: 'list', parent: sb, dir: 'col', gap: rail ? 8 : 1, pad: rail ? { top: 8, right: 10, bottom: 8, left: 10 } : { top: 6, right: 12, bottom: 8, left: 12 }, w: sbw, align: sketch.StackLayout.AlignItems.Start });
  function row(id, glyph, label, opt) { opt = opt || {}; var sel = opt.sel;
    if (rail) { var b = H.frame({ name: 'link:' + id, parent: list, pad: 0, w: 36, h: 36, radius: H.R.row, fill: sel ? H.sw(app, 'hover') : null, justify: sketch.StackLayout.JustifyContent.Center }); H.sfg(b, glyph, { size: 17, color: H.sw(app, sel ? 'ink' : 'secondary') }); b.stackLayout.apply(); if (opt.count) { b.stackLayout = null; var bd = H.frame({ name: 'badge', parent: b, pad: { top: 0, right: 4, bottom: 0, left: 4 }, h: 14, radius: 7, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: bd, text: String(opt.count), size: 9, weight: 7, color: '#ffffff' }); bd.stackLayout.apply(); bd.frame.x = 22; bd.frame.y = 2; } return b; }
    var r = H.frame({ name: 'link:' + id, parent: list, dir: 'row', gap: 10, pad: { top: 0, right: 10, bottom: 0, left: 10 + (opt.indent || 0) }, w: sbw - 24, h: 32, radius: H.R.row, fill: sel ? H.alpha(H.hex(app, 'ink'), dark ? 0.08 : 0.05) : null });
    if (opt.disclosure) H.sfg(r, opt.open ? 'chevron_down' : 'chevron_right', { size: 10, weight: 7, color: H.sw(app, 'tertiary'), w: 12 });
    if (glyph) H.sfg(r, glyph, { size: 16, color: H.sw(app, sel ? 'ink' : 'secondary'), w: 20 });
    H.sft({ parent: r, text: label, size: H.T.chrome, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary'), w: 160 });
    if (opt.count) { var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.dot(r, H.hex(app, 'accent'), 5); }
    H.order(r); return r; }
  function header(label) { if (rail) { var g = H.frame({ name: 'gap', parent: list, pad: 0, w: 36, h: 8 }); return; } var h = H.frame({ name: 'section', parent: list, dir: 'row', pad: { top: 18, right: 10, bottom: 6, left: 10 }, w: sbw - 24, h: 38 }); H.caps(h, app, label); h.stackLayout.apply(); }
  row('new-conversation', 'square_pencil', 'New conversation', { sel: active === 'new-conversation' });
  row('search', 'magnifyingglass', 'Search', { sel: active === 'search' });
  header('Weave');
  row('activity', 'bell', 'Activity', { sel: active === 'activity', count: o.activityCount === undefined ? 3 : o.activityCount });
  row('artifacts', 'doc_on_doc', 'Artifacts', { sel: active === 'artifacts' });
  row('routines', 'clock', 'Routines', { sel: active === 'routines' });
  row('customize', 'wand', 'Customize', { sel: active === 'customize' });
  header('Projects');
  row('projects', 'folder', 'All projects', { sel: active === 'projects', disclosure: !rail, open: true });
  if (!rail) { row('project', 'folder', 'Personal', { sel: active === 'project', indent: 12 }); row('project', 'folder', 'Weave Cloud', { indent: 12 }); }
  if (!rail) { header('Recent'); (o.recent || [['conversation', 'Move the billing webhook handler'], ['conversation', 'Draft the Q3 investor update'], ['conversation', 'Why is the Mac build larger?']]).forEach(function (rc, i) { row(rc[0], null, rc[1], { sel: active === 'conversation' && i === 0 }); }); }
  H.order(list);
  var fillS = H.frame({ name: 'fill', parent: sb, pad: 0, w: sbw }); fillS.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: rail ? { top: 0, right: 14, bottom: 24, left: 14 } : { top: 8, right: 16, bottom: 16, left: 16 }, w: sbw, h: rail ? 60 : 56 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 28, h: 28, radius: 14, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: av, text: 'AB', size: 11, weight: 7, color: '#ffffff' }); av.stackLayout.apply();
  if (!rail) { var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 1, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: info, text: 'Abhi Bansal', size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); H.sft({ parent: info, text: 'Pro · Straits Lab', size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info); }
  if (!rail) { var spF = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); spF.horizontalSizing = sketch.FlexSizing.Fill; H.sfg(foot, 'gear', { size: 15, color: H.sw(app, 'tertiary') }); }
  H.order(foot); H.order(sb);
  var contentW = W - sbw - (o.inspector ? 320 : 0);
  var col = H.frame({ name: 'content-col', parent: screen, dir: 'col', gap: 0, pad: 0, w: contentW, h: Hh, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tb = H.frame({ name: 'toolbar', parent: col, dir: 'row', gap: 6, pad: { top: 0, right: 16, bottom: 0, left: 12 }, w: contentW, h: 52 });
  if (rail) [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function () {}); // traffic lights live in the rail
  var nav = H.frame({ name: 'nav', parent: tb, dir: 'row', gap: 0, pad: 0 }); H.sfBtn(nav, 'link:back', 'chevron_left', app, { w: 28, h: 28, size: 14, weight: 6, color: H.sw(app, 'secondary') }); H.sfBtn(nav, 'forward', 'chevron_right', app, { w: 28, h: 28, size: 14, weight: 6, color: H.sw(app, 'line-strong') }); H.order(nav);
  var titleWrap = H.frame({ name: 'title', parent: tb, dir: 'row', gap: 8, pad: { top: 0, right: 0, bottom: 0, left: 6 } });
  if (o.title) H.sft({ parent: titleWrap, text: o.title, size: H.T.title, weight: 6, color: H.sw(app, 'ink') }); if (o.subtitle) H.sft({ parent: titleWrap, text: o.subtitle, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(titleWrap);
  var spTb = H.frame({ name: 'spacer', parent: tb, pad: 0, h: 1 }); spTb.horizontalSizing = sketch.FlexSizing.Fill;
  (o.tools || []).forEach(function (t) { if (t[2]) { var b = H.frame({ name: t[0], parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 12, bottom: 0, left: 10 }, h: 28, radius: H.R.pill, fill: t[3] ? H.sw(app, 'ink') : H.sw(app, 'hover') }); H.sfg(b, t[1], { size: 13, weight: 6, color: t[3] ? H.sw(app, 'surface') : H.sw(app, 'ink') }); H.sft({ parent: b, text: t[2], size: H.T.chrome, weight: 6, color: t[3] ? H.sw(app, 'surface') : H.sw(app, 'ink') }); H.order(b); } else H.sfBtn(tb, t[0], t[1], app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') }); });
  if (o.search !== false) H.sfBtn(tb, 'link:search', 'magnifyingglass', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  if (o.inspectorToggle) H.sfBtn(tb, 'link:' + o.inspectorToggle, 'sidebar_right', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  H.order(tb);
  var main = H.frame({ name: 'main', parent: col, dir: 'col', gap: o.gap === undefined ? 24 : o.gap, pad: o.pad === undefined ? { top: 20, right: 40, bottom: 24, left: 40 } : o.pad, w: contentW, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); main.verticalSizing = sketch.FlexSizing.Fill;
  H.order(col);
  var insp = null;
  if (o.inspector) { insp = H.frame({ name: 'inspector', parent: screen, dir: 'col', gap: 0, pad: 0, w: 320, h: Hh, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
    var ih = H.frame({ name: 'inspector-header', parent: insp, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 24 }, w: 320, h: 52 }); H.sft({ parent: ih, text: o.inspector === true ? 'Context' : o.inspector, size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); var spI = H.frame({ name: 'spacer', parent: ih, pad: 0, h: 1 }); spI.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(ih, 'link:' + (o.inspectorClose || 'back'), 'sidebar_right', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') }); H.order(ih); }
  H.order(screen);
  return { window: screen, sidebar: sb, main: main, toolbar: tb, inspector: insp, finish: function () { H.order(main); if (insp) H.order(insp); col.stackLayout.apply(); screen.stackLayout.apply(); return screen; } };
};
// Inspector body helpers: section (caps label + 40px air), quiet row (glyph or dot · title · meta), file row.
H.inspBody = function (insp, app) { var ib = H.frame({ name: 'inspector-body', parent: insp, dir: 'col', gap: 0, pad: { top: 4, right: 24, bottom: 24, left: 24 }, w: 320, align: sketch.StackLayout.AlignItems.Start }); return ib; };
H.inspSection = function (ib, app, label, first) { var h = H.frame({ name: 'section', parent: ib, pad: { top: first ? 8 : 28, right: 0, bottom: 10, left: 0 }, w: 272 }); H.caps(h, app, label); h.stackLayout.apply(); return h; };
H.quietRow = function (parent, app, o) { var r = H.frame({ name: o.link ? 'link:' + o.link : 'row', parent: parent, dir: 'row', gap: 10, pad: { top: 6, right: 0, bottom: 6, left: 0 }, w: o.w || 272, align: sketch.StackLayout.AlignItems.Start });
  if (o.dot) { var dw = H.frame({ name: 'dot-wrap', parent: r, pad: { top: 6, right: 0, bottom: 0, left: 0 }, w: 12 }); H.dot(dw, o.dot, 5); dw.stackLayout.apply(); } else if (o.glyph) H.sfg(r, o.glyph, { size: 14, color: H.sw(app, 'tertiary'), w: 16 });
  var tw = H.frame({ name: 'text', parent: r, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); tw.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: tw, text: o.title, size: H.T.chrome, weight: o.strong ? 6 : 5, color: H.sw(app, 'ink'), mono: !!o.mono, w: o.tw || 200 }); if (o.meta) H.text({ parent: tw, text: o.meta, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary'), w: o.tw || 200 }); H.order(tw);
  if (o.trail) H.text({ parent: r, text: o.trail, size: H.T.meta, weight: 6, color: o.trailColor || H.sw(app, 'tertiary'), mono: true });
  if (o.chevron) H.sfg(r, 'chevron_right', { size: 11, weight: 7, color: H.sw(app, 'tertiary') });
  H.order(r); return r; };
// The two allowed surfaces.
H.codeCard = function (parent, app, o) { var c = H.frame({ name: 'code', parent: parent, dir: 'col', gap: 0, pad: 0, w: o.w || 720, radius: H.R.card, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var hd = H.frame({ name: 'code-header', parent: c, dir: 'row', gap: 8, pad: { top: 10, right: 14, bottom: 6, left: 16 }, w: o.w || 720 }); H.sfg(hd, 'doc', { size: 12, color: H.sw(app, 'tertiary') }); H.text({ parent: hd, text: o.path, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary'), mono: true }); var sp = H.frame({ name: 'spacer', parent: hd, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.sfg(hd, 'doc_on_doc', { size: 12, color: H.sw(app, 'tertiary') }); H.order(hd);
  var body = H.frame({ name: 'code-body', parent: c, dir: 'col', gap: 4, pad: { top: 6, right: 16, bottom: 16, left: 16 }, w: o.w || 720, align: sketch.StackLayout.AlignItems.Start }); (o.lines || []).forEach(function (l) { H.text({ parent: body, text: l, size: 12.5, weight: 5, color: H.sw(app, 'ink'), mono: true, w: (o.w || 720) - 32, align: sketch.Text.Alignment.left }); }); H.order(body); H.order(c); return c; };
H.composer = function (parent, app, o) { o = o || {}; var w = o.w || 720; var c = H.frame({ name: 'composer', parent: parent, dir: 'row', gap: 8, pad: { top: 8, right: 8, bottom: 8, left: 10 }, w: w, h: 56, radius: 28, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000066' : '#0000001a', blur: 24, spread: 0, x: 0, y: 6 } });
  H.sfBtn(c, 'attach', 'plus', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  if (o.model !== false) { var m = H.frame({ name: 'link:conversation--model', parent: c, dir: 'row', gap: 6, pad: { top: 0, right: 10, bottom: 0, left: 8 }, h: 28, radius: H.R.pill, fill: H.sw(app, 'panel') }); H.sfg(m, 'cube', { size: 12, color: H.sw(app, 'secondary') }); H.sft({ parent: m, text: o.model || 'Claude Fable 5.1', size: H.T.meta, weight: 6, color: H.sw(app, 'ink') }); H.sfg(m, 'chevron_down', { size: 9, weight: 7, color: H.sw(app, 'tertiary') }); H.order(m); }
  var ph = H.text({ parent: c, text: o.placeholder || 'Reply…', size: H.T.body, weight: 5, color: H.sw(app, 'tertiary') }); ph.horizontalSizing = sketch.FlexSizing.Fill;
  H.sfBtn(c, 'link:' + (o.voiceLink || 'conversation--voice'), 'mic', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  H.sfBtn(c, 'send', 'arrow_up', app, { w: 36, h: 36, radius: 18, size: 15, weight: 8, fill: H.sw(app, 'ink'), color: H.sw(app, 'surface') });
  H.order(c); return c; };
// Thread pieces
H.userTurn = function (thread, app, text, time) { var r = H.frame({ name: 'user', parent: thread, dir: 'col', gap: 6, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.End }); var b = H.frame({ name: 'bubble', parent: r, pad: { top: 10, right: 16, bottom: 10, left: 16 }, radius: 16, fill: H.sw(app, 'accent-soft') }); H.text({ parent: b, text: text, size: H.T.body, weight: 5, color: H.sw(app, 'ink'), w: 440 }); b.stackLayout.apply(); if (time) H.text({ parent: r, text: time, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(r); return r; };
H.reasoned = function (thread, app, label) { var r = H.frame({ name: 'link:conversation--reasoning', parent: thread, dir: 'row', gap: 6, pad: 0, h: 20 }); H.sfg(r, 'sparkles', { size: 12, color: H.hex(app, 'accent') }); H.sft({ parent: r, text: label, size: H.T.chrome, weight: 5, color: H.sw(app, 'secondary') }); H.sfg(r, 'chevron_right', { size: 9, weight: 7, color: H.sw(app, 'tertiary') }); H.order(r); return r; };
H.assistantTurn = function (thread, app, o) { var r = H.frame({ name: 'assistant', parent: thread, dir: 'col', gap: 12, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.Start }); var hd = H.frame({ name: 'who', parent: r, dir: 'row', gap: 8, pad: 0 }); H.sfg(hd, 'sparkles', { size: 14, color: H.hex(app, 'accent') }); H.sft({ parent: hd, text: 'Weave', size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); if (o.time) H.sft({ parent: hd, text: o.time, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(hd);
  if (o.headline) H.text({ parent: r, text: o.headline, size: H.T.display, weight: 6, color: H.sw(app, 'ink'), w: 720 });
  (o.paragraphs || []).forEach(function (p) { var t = H.text({ parent: r, text: p, size: H.T.body, weight: 5, color: H.sw(app, 'ink'), w: 720 }); t.style.lineHeight = 22; });
  if (o.build) o.build(r);
  var acts = H.frame({ name: 'actions', parent: r, dir: 'row', gap: 4, pad: { top: 4, right: 0, bottom: 0, left: 0 } }); ['doc_on_doc', 'hand_thumbsup', 'hand_thumbsdown', 'arrow_clockwise'].forEach(function (g, i) { H.sfBtn(acts, ['copy', 'helpful', 'not-helpful', 'regenerate'][i], g, app, { w: 24, h: 24, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); }); H.order(acts);
  H.order(r); return r; };
H.runRow = function (parent, app, o) { var r = H.frame({ name: o.link ? 'link:' + o.link : 'run', parent: parent, dir: 'row', gap: 10, pad: { top: 8, right: 0, bottom: 8, left: 0 }, w: o.w || 720 }); H.sfg(r, 'terminal', { size: 14, color: H.sw(app, 'secondary') }); H.text({ parent: r, text: o.cmd, size: H.T.chrome, weight: 6, color: H.sw(app, 'ink'), mono: true }); H.text({ parent: r, text: o.status, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; if (o.pending) { H.dot(r, H.hex(app, 'attention-mark'), 5); H.text({ parent: r, text: o.pending, size: H.T.meta, weight: 6, color: H.sw(app, 'attention') }); } H.sfg(r, 'chevron_right', { size: 11, weight: 7, color: H.sw(app, 'tertiary') }); H.order(r); return r; };

// ---------- iOS v3: same rules (no group borders — groups are panel-tinted 12px; separators are hairlines inset; rows 52).
H.iosGroup = function (parent, app, rows, o) { o = o || {}; var wrap = H.frame({ name: o.name || 'group', parent: parent, dir: 'col', gap: 0, pad: 0, w: 358, align: sketch.StackLayout.AlignItems.Start });
  if (o.header) { var hh = H.frame({ name: 'header', parent: wrap, pad: { top: 0, right: 16, bottom: 8, left: 16 }, w: 358 }); H.caps(hh, app, o.header); hh.stackLayout.apply(); }
  var g = H.frame({ name: 'rows', parent: wrap, dir: 'col', gap: 0, pad: 0, w: 358, radius: H.R.card, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  rows.forEach(function (r, i) { var row = H.frame({ name: r.link ? 'link:' + r.link : 'row', parent: g, dir: 'row', gap: 12, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 358, h: r.h || 52 });
    if (r.glyph) H.sfg(row, r.glyph, { size: 18, color: r.tint || H.sw(app, 'secondary'), w: 24 });
    var tw = H.frame({ name: 'text', parent: row, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: tw, text: r.title, size: 17, weight: 5, color: H.sw(app, r.destructive ? 'negative' : 'ink') }); if (r.sub) H.sft({ parent: tw, text: r.sub, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(tw);
    var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
    if (r.detail) H.sft({ parent: row, text: r.detail, size: 17, weight: 5, color: H.sw(app, 'tertiary') });
    if (r.dot) H.dot(row, r.dot, 6);
    if (r.toggle !== undefined) { var tg = H.frame({ name: 'toggle', parent: row, pad: 2, w: 51, h: 31, radius: 16, fill: r.toggle ? H.sw(app, 'ink') : H.alpha(H.hex(app, 'ink'), 0.16), justify: r.toggle ? sketch.StackLayout.JustifyContent.End : sketch.StackLayout.JustifyContent.Start }); H.rect({ parent: tg, name: 'knob', w: 27, h: 27, oval: true, fill: H.hex(app, 'surface') }); tg.stackLayout.apply(); }
    if (r.chevron !== false && r.link && r.toggle === undefined) H.sfg(row, 'chevron_right', { size: 13, weight: 7, color: H.sw(app, 'tertiary') });
    H.order(row);
    if (i < rows.length - 1) { var sepW = H.frame({ name: 'sep', parent: g, dir: 'row', pad: { top: 0, right: 0, bottom: 0, left: r.glyph ? 52 : 16 }, w: 358, h: 1 }); var sl = H.rect({ parent: sepW, name: 'line', w: 300, h: 1, fill: H.sw(app, 'line') }); sl.horizontalSizing = sketch.FlexSizing.Fill; sepW.stackLayout.apply(); } });
  H.order(g); if (o.footer) { var ff = H.frame({ name: 'footer', parent: wrap, pad: { top: 8, right: 16, bottom: 0, left: 16 }, w: 358 }); H.sft({ parent: ff, text: o.footer, size: 13, weight: 5, color: H.sw(app, 'tertiary'), w: 326 }); ff.stackLayout.apply(); }
  H.order(wrap); return wrap; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 22, bottom: 8, left: 22 }, w: 390, h: 96, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 346, h: 62, radius: 31, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000080' : '#00000022', blur: 30, spread: 0, x: 0, y: 10 } });
  [['home', 'Home', 'house'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'gear']].forEach(function (t) { var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 3, pad: 0, w: 67.6, h: 54, radius: 27, fill: sel ? H.sw(app, 'hover') : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center }); H.sfg(tab, t[2], { size: 18, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary') }); H.sft({ parent: tab, text: t[1], size: 10, weight: 6, color: H.sw(app, sel ? 'ink' : 'secondary') }); H.order(tab); });
  H.order(bar); var hi = H.frame({ name: 'home-indicator', parent: wrap, dir: 'row', pad: { top: 21, right: 0, bottom: 0, left: 0 }, w: 346, h: 26, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(app, 'ink') }); hi.stackLayout.apply(); H.order(wrap); return wrap; };
H.iosComposer = function (parent, app, o) { o = o || {}; var c = H.frame({ name: 'composer', parent: parent, dir: 'row', gap: 6, pad: { top: 6, right: 6, bottom: 6, left: 8 }, w: 358, h: 52, radius: 26, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000066' : '#0000001a', blur: 20, spread: 0, x: 0, y: 6 } }); H.sfBtn(c, 'attach', 'plus', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') }); var ph = H.sft({ parent: c, text: o.placeholder || 'Message Weave', size: 16, weight: 5, color: H.sw(app, 'tertiary') }); ph.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(c, 'link:' + (o.voiceLink || 'conversation--voice'), 'mic', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') }); H.sfBtn(c, 'send', 'arrow_up', app, { w: 36, h: 36, radius: 18, size: 15, weight: 8, fill: H.sw(app, 'ink'), color: H.sw(app, 'surface') }); H.order(c); return c; };
