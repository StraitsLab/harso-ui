// Native chrome v2 — measured from Apple's macOS 27 / iOS 27 kits (see HIG-SPEC.md). Boundaryless tokens for colour,
// SF Pro + real SF Symbols for chrome. Replaces H.macSidebar/H.macMain/H.iosNavBar/H.iosTabBar/H.iosScreen.
// Chrome text helper: SF Pro at HIG sizes.
H.sft = function (o) { var t = H.text(o); t.style.fontFamily = 'SF Pro'; return t; };
H.sfBtn = function (parent, name, glyph, app, o) { o = o || {}; var b = H.frame({ name: name, parent: parent, pad: 0, w: o.w || 36, h: o.h || 36, radius: o.radius === undefined ? 8 : o.radius, fill: o.fill || null, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(b, glyph, { size: o.size || 15, weight: o.weight || 7, color: o.color || H.sw(app, 'secondary') }); b.stackLayout.apply(); return b; };

// ---------------- macOS 27 window: 256 source list (vibrancy) + 52px unified toolbar over the content column + optional 320 inspector.
// Returns { window, sidebar, main(content col below toolbar), toolbar, inspector }.
H.macWindow = function (screen, app, o) {
  o = o || {}; var W = screen.frame.width, Hh = screen.frame.height; var dark = app.indexOf('Dark') === 0;
  // ---- Source list
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 0, pad: 0, w: 256, h: Hh, fill: H.alpha(H.hex(app, 'panel'), 0.92), align: sketch.StackLayout.AlignItems.Start, clip: true });
  sb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var tl = H.frame({ name: 'titlebar', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 20 }, w: 256, h: 52 });
  [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function (c, i) { var d = H.rect({ parent: tl, name: 'traffic-' + i, w: 12, h: 12, oval: true, fill: c[0], border: c[1] }); });
  var spT = H.frame({ name: 'spacer', parent: tl, pad: 0, h: 1 }); spT.horizontalSizing = sketch.FlexSizing.Fill;
  H.sfBtn(tl, 'toggle-sidebar', 'sidebar_left', app, { size: 15 }); H.order(tl);
  var list = H.frame({ name: 'list', parent: sb, dir: 'col', gap: 2, pad: { top: 4, right: 14, bottom: 8, left: 14 }, w: 256, align: sketch.StackLayout.AlignItems.Start });
  function row(id, glyph, label, opt) { opt = opt || {}; var sel = opt.sel; var r = H.frame({ name: 'link:' + id, parent: list, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 8 + (opt.indent || 0) }, w: 228, h: 32, radius: 6, fill: sel ? H.alpha(H.hex(app, 'ink'), dark ? 0.16 : 0.09) : null });
    if (opt.disclosure) H.sf(r, opt.open ? 'chevron_down' : 'chevron_right', { size: 10, weight: 8, color: H.sw(app, 'tertiary'), w: 12 });
    if (glyph) H.sf(r, glyph, { size: 15, weight: 6, color: opt.tint ? H.hex(app, 'accent') : H.sw(app, sel ? 'ink' : 'secondary'), w: 20 });
    H.sft({ parent: r, text: label, size: 13, weight: sel ? 7 : 5, color: H.sw(app, 'ink'), w: opt.count ? 140 : 180 });
    if (opt.count) { var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.sft({ parent: r, text: String(opt.count), size: 12, weight: 5, color: H.sw(app, 'tertiary') }); }
    H.order(r); return r; }
  function header(label) { var h = H.frame({ name: 'section', parent: list, dir: 'row', pad: { top: 14, right: 8, bottom: 4, left: 8 }, w: 228, h: 36 }); H.sft({ parent: h, text: label, size: 11, weight: 8, color: H.sw(app, 'tertiary') }); h.stackLayout.apply(); }
  var active = o.active;
  row('new-conversation', 'square_pencil', 'New conversation', { tint: true, sel: active === 'new-conversation' });
  row('search', 'magnifyingglass', 'Search', { sel: active === 'search' });
  header('Weave');
  row('activity', 'bell', 'Activity', { sel: active === 'activity', count: o.activityCount === undefined ? 3 : o.activityCount });
  row('artifacts', 'doc_on_doc', 'Artifacts', { sel: active === 'artifacts' });
  row('routines', 'clock', 'Routines', { sel: active === 'routines' });
  row('customize', 'wand', 'Customize', { sel: active === 'customize' });
  header('Projects');
  row('projects', 'folder', 'All projects', { sel: active === 'projects', disclosure: true, open: true });
  row('project', 'folder', 'Personal', { sel: active === 'project', indent: 12 });
  row('project', 'folder', 'Weave Cloud', { indent: 12 });
  header('Recent');
  (o.recent || [['conversation', 'Move the billing webhook handler'], ['conversation', 'Draft the Q3 investor update'], ['conversation', 'Why is the Mac build 40 MB bigger']]).forEach(function (rc, i) { row(rc[0], 'bubble', rc[1], { sel: active === 'conversation' && i === 0 }); });
  H.order(list);
  var fillS = H.frame({ name: 'fill', parent: sb, pad: 0, w: 256 }); fillS.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: { top: 8, right: 14, bottom: 12, left: 14 }, w: 256, h: 56 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 28, h: 28, radius: 14, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: av, text: 'AB', size: 11, weight: 8, color: '#ffffff' }); av.stackLayout.apply();
  var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 1, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: info, text: 'Abhi Bansal', size: 13, weight: 7, color: H.sw(app, 'ink') }); H.sft({ parent: info, text: 'Pro · Straits Lab', size: 11, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info);
  var sp2 = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); sp2.horizontalSizing = sketch.FlexSizing.Fill;
  H.sf(foot, 'gear', { size: 15, weight: 6, color: H.sw(app, 'tertiary') }); H.order(foot);
  H.order(sb);
  // ---- Content column
  var contentW = W - 256 - (o.inspector ? 320 : 0);
  var col = H.frame({ name: 'content-col', parent: screen, dir: 'col', gap: 0, pad: 0, w: contentW, h: Hh, fill: H.sw(app, 'canvas'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tb = H.frame({ name: 'toolbar', parent: col, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 8 }, w: contentW, h: 52, fill: H.alpha(H.hex(app, 'canvas'), 0.9) });
  tb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var nav = H.frame({ name: 'nav', parent: tb, dir: 'row', gap: 0, pad: 0, w: 73, h: 36, radius: 8, fill: H.alpha(H.hex(app, 'ink'), 0.06) });
  H.sfBtn(nav, 'link:back', 'chevron_left', app, { w: 36, h: 36, size: 14, weight: 8, color: H.sw(app, 'ink') }); H.rect({ parent: nav, name: 'sep', w: 1, h: 20, fill: H.sw(app, 'line-strong') }); H.sfBtn(nav, 'forward', 'chevron_right', app, { w: 36, h: 36, size: 14, weight: 8, color: H.sw(app, 'tertiary') }); H.order(nav);
  var titleWrap = H.frame({ name: 'title', parent: tb, dir: 'col', gap: 1, pad: { top: 0, right: 0, bottom: 0, left: 8 }, align: sketch.StackLayout.AlignItems.Start });
  if (o.title) H.sft({ parent: titleWrap, text: o.title, size: 15, weight: 8, color: H.sw(app, 'ink') }); if (o.subtitle) H.sft({ parent: titleWrap, text: o.subtitle, size: 12, weight: 5, color: H.sw(app, 'tertiary') }); H.order(titleWrap);
  var spTb = H.frame({ name: 'spacer', parent: tb, pad: 0, h: 1 }); spTb.horizontalSizing = sketch.FlexSizing.Fill;
  (o.tools || []).forEach(function (t) { // [name, glyph, label?, primary?]
    if (t[2]) { var b = H.frame({ name: t[0], parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 12, bottom: 0, left: 10 }, h: 30, radius: 7, fill: t[3] ? H.sw(app, 'accent') : H.sw(app, 'surface'), border: t[3] ? null : H.sw(app, 'line-strong') }); H.sf(b, t[1], { size: 13, weight: 7, color: t[3] ? '#ffffff' : H.sw(app, 'ink') }); H.sft({ parent: b, text: t[2], size: 13, weight: 7, color: t[3] ? '#ffffff' : H.sw(app, 'ink') }); H.order(b); }
    else H.sfBtn(tb, t[0], t[1], app, { size: 15, weight: 7, color: H.sw(app, 'ink') }); });
  if (o.search !== false) { var sf = H.frame({ name: 'link:search', parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 180, h: 30, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line') }); H.sf(sf, 'magnifyingglass', { size: 13, weight: 7, color: H.sw(app, 'tertiary') }); H.sft({ parent: sf, text: 'Search', size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(sf); }
  if (o.inspectorToggle) H.sfBtn(tb, 'link:' + o.inspectorToggle, 'sidebar_right', app, { size: 15, weight: 7, color: H.sw(app, 'ink') });
  H.order(tb);
  var main = H.frame({ name: 'main', parent: col, dir: 'col', gap: o.gap === undefined ? 20 : o.gap, pad: o.pad === undefined ? 28 : o.pad, w: contentW, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); main.verticalSizing = sketch.FlexSizing.Fill;
  H.order(col);
  var insp = null;
  if (o.inspector) { insp = H.frame({ name: 'inspector', parent: screen, dir: 'col', gap: 0, pad: 0, w: 320, h: Hh, fill: H.alpha(H.hex(app, 'panel'), 0.92), align: sketch.StackLayout.AlignItems.Start, clip: true }); insp.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
    var ih = H.frame({ name: 'inspector-header', parent: insp, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 16 }, w: 320, h: 52 }); H.sft({ parent: ih, text: o.inspector === true ? 'Inspector' : o.inspector, size: 13, weight: 8, color: H.sw(app, 'ink') }); var spI = H.frame({ name: 'spacer', parent: ih, pad: 0, h: 1 }); spI.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(ih, 'link:' + (o.inspectorClose || 'back'), 'sidebar_right', app, { size: 15, weight: 7, color: H.sw(app, 'ink') }); H.order(ih); }
  H.order(screen);
  return { window: screen, sidebar: sb, main: main, toolbar: tb, inspector: insp, finish: function () { H.order(main); if (insp) H.order(insp); col.stackLayout.apply(); screen.stackLayout.apply(); return screen; } };
};
// macOS alert (260×170 measured) and sheet chrome; overlay scrim is BLACK at 40% (light) / 60% (dark).
H.macScrim = function (screen, app) { screen.stackLayout = null; var s = H.rect({ parent: screen, name: 'scrim', w: screen.frame.width, h: screen.frame.height, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' }); s.moveToFront(); return s; };
H.macAlert = function (screen, app, o) { screen.stackLayout = null; var W = screen.frame.width, Hh = screen.frame.height; var a = H.frame({ name: 'alert', parent: screen, dir: 'col', gap: 0, pad: { top: 20, right: 22, bottom: 20, left: 22 }, w: o.w || 300, radius: 12, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Center, shadow: { color: '#00000040', blur: 40, spread: 0, x: 0, y: 16 } }); a.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var ic = H.frame({ name: 'icon', parent: a, pad: 0, w: 64, h: 64, radius: 16, fill: H.alpha(H.hex(app, (o.tone === 'danger' || o.tone === 'negative') ? 'negative' : 'accent'), 0.14), justify: sketch.StackLayout.JustifyContent.Center }); H.sf(ic, o.glyph || 'sparkles', { size: 30, weight: 7, color: H.hex(app, (o.tone === 'danger' || o.tone === 'negative') ? 'negative' : 'accent') }); ic.stackLayout.apply();
  var gap1 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 14 });
  H.sft({ parent: a, text: o.title, size: 13, weight: 8, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: (o.w || 300) - 44 });
  var gap2 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 6 });
  H.sft({ parent: a, text: o.body, size: 11, weight: 5, color: H.sw(app, 'secondary'), align: sketch.Text.Alignment.center, w: (o.w || 300) - 44 });
  if (o.extra) o.extra(a);
  var gap3 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 18 });
  var btns = H.frame({ name: 'buttons', parent: a, dir: 'row', gap: 8, pad: 0, w: (o.w || 300) - 44 });
  (o.buttons || []).forEach(function (b) { // [link, label, kind: primary|danger|secondary]
    var prim = b[2] === 'primary' || (b[2] === 'danger' || b[2] === 'negative'); var bt = H.frame({ name: 'link:' + b[0], parent: btns, dir: 'row', pad: 0, h: 28, radius: 7, fill: (b[2] === 'danger' || b[2] === 'negative') ? H.sw(app, 'negative') : prim ? H.sw(app, 'accent') : H.sw(app, 'surface'), border: prim ? null : H.sw(app, 'line-strong'), justify: sketch.StackLayout.JustifyContent.Center, shadow: prim ? null : { color: '#00000014', blur: 1, spread: 0, x: 0, y: 1 } }); bt.horizontalSizing = sketch.FlexSizing.Fill; H.sft({ parent: bt, text: b[1], size: 13, weight: 7, color: prim ? '#ffffff' : H.sw(app, 'ink') }); bt.stackLayout.apply(); });
  H.order(btns); H.order(a); a.frame.x = Math.round((W - a.frame.width) / 2); a.frame.y = Math.round((Hh - a.frame.height) / 2 - 40); a.moveToFront(); return a; };

// ---------------- iOS 27 chrome (390×844): status bar 54, nav 44 (or large title 96), inset-grouped lists, floating 346×62 tab bar.
H.iosStatusBar = function (parent, app) { var s = H.frame({ name: 'status-bar', parent: parent, dir: 'row', pad: { top: 14, right: 26, bottom: 0, left: 32 }, w: 390, h: 54 }); H.sft({ parent: s, text: '9:41', size: 17, weight: 7, color: H.sw(app, 'ink') }); var sp = H.frame({ name: 'spacer', parent: s, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
  var st = H.frame({ name: 'status', parent: s, dir: 'row', gap: 6, pad: 0 }); [[0, 4], [0, 6], [0, 8], [0, 10]].forEach(function (b, i) { H.rect({ parent: st, name: 'bar', w: 3, h: b[1], radius: 1, fill: H.sw(app, i < 3 ? 'ink' : 'tertiary') }); }); H.sf(st, 'wifi', { size: 14, weight: 7, color: H.sw(app, 'ink') }); var bat = H.frame({ name: 'battery', parent: st, pad: 2, w: 27, h: 13, radius: 4, border: H.alpha(H.hex(app, 'ink'), 0.4) }); H.rect({ parent: bat, name: 'lvl', w: 18, h: 9, radius: 2, fill: H.sw(app, 'ink') }); bat.stackLayout.apply(); H.order(st); H.order(s); return s; };
H.iosNavBar = function (parent, app, title, o) { o = o || {}; var large = o.large;
  var n = H.frame({ name: 'nav-bar', parent: parent, dir: 'col', gap: 0, pad: 0, w: 390, align: sketch.StackLayout.AlignItems.Start });
  var bar = H.frame({ name: 'bar', parent: n, dir: 'row', gap: 0, pad: { top: 0, right: 8, bottom: 0, left: 8 }, w: 390, h: 44 });
  var lead = H.frame({ name: 'leading', parent: bar, dir: 'row', gap: 0, pad: 0, w: 110, h: 44 });
  if (o.back) { var b = H.frame({ name: 'link:back', parent: lead, dir: 'row', gap: 4, pad: { top: 0, right: 8, bottom: 0, left: 0 }, h: 44 }); H.sf(b, 'chevron_left', { size: 17, weight: 8, color: H.sw(app, 'accent') }); H.sft({ parent: b, text: o.back === true ? 'Back' : o.back, size: 17, weight: 5, color: H.sw(app, 'accent') }); H.order(b); }
  else if (o.leading) { var lb = H.frame({ name: 'link:' + (o.leadingLink || o.leading), parent: lead, pad: 0, w: 44, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(lb, o.leading, { size: 17, weight: 7, color: H.sw(app, 'accent') }); lb.stackLayout.apply(); }
  lead.stackLayout.apply();
  H.sft({ parent: bar, text: large ? '' : title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 154 });
  var trail = H.frame({ name: 'trailing', parent: bar, dir: 'row', gap: 0, pad: 0, w: 110, h: 44, justify: sketch.StackLayout.JustifyContent.End });
  (o.trailing || []).forEach(function (t) { // [link, glyph] or [link, glyph, 'Label']
    if (t[2]) { var tt = H.frame({ name: 'link:' + t[0], parent: trail, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: tt, text: t[2], size: 17, weight: t[3] ? 7 : 5, color: H.sw(app, 'accent') }); tt.stackLayout.apply(); }
    else { var tb = H.frame({ name: 'link:' + t[0], parent: trail, pad: 0, w: 44, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(tb, t[1], { size: 17, weight: 7, color: H.sw(app, 'accent') }); tb.stackLayout.apply(); } });
  trail.stackLayout.apply(); H.order(bar);
  if (large) { var lt = H.frame({ name: 'large-title', parent: n, dir: 'row', pad: { top: 0, right: 16, bottom: 8, left: 16 }, w: 390, h: 52 }); H.sft({ parent: lt, text: title, size: 34, weight: 8, color: H.sw(app, 'ink') }); lt.stackLayout.apply(); }
  H.order(n); return n; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 22, bottom: 8, left: 22 }, w: 390, h: 96, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 346, h: 62, radius: 31, fill: H.alpha(H.hex(app, 'surface'), 0.92), border: H.alpha(H.hex(app, 'ink'), 0.08), shadow: { color: '#00000029', blur: 30, spread: 0, x: 0, y: 10 } });
  [['home', 'Home', 'house'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'gear']].forEach(function (t) {
    var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 3, pad: 0, w: 67.6, h: 54, radius: 27, fill: sel ? H.alpha(H.hex(app, 'ink'), 0.1) : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center });
    H.sf(tab, t[2], { size: 18, weight: 8, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.sft({ parent: tab, text: t[1], size: 10, weight: 7, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.order(tab);
  });
  H.order(bar); var hi = H.frame({ name: 'home-indicator', parent: wrap, dir: 'row', pad: { top: 21, right: 0, bottom: 0, left: 0 }, w: 346, h: 26, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(app, 'ink') }); hi.stackLayout.apply(); H.order(wrap); return wrap;
};
H.iosScreen = function (o) { var s = H.screen({ page: o.page, platform: 'ios', app: o.app, id: o.id, w: 390, h: 844, x: o.x, y: o.y }); s.stackLayout.direction = sketch.StackLayout.Direction.Column;
  var top = H.frame({ name: 'top', parent: s, dir: 'col', pad: 0, w: 390, fill: o.plain ? null : H.alpha(H.hex(o.app, 'canvas'), 0.96) }); H.iosStatusBar(top, o.app); if (o.title !== undefined) H.iosNavBar(top, o.app, o.title, o); H.order(top);
  var body = H.frame({ name: 'body', parent: s, dir: 'col', gap: o.gap === undefined ? 16 : o.gap, pad: o.pad === undefined ? 16 : o.pad, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  var tab = null; if (o.tab !== false) tab = H.iosTabBar(s, o.app, o.tab || 'home'); else { var hi = H.frame({ name: 'home-indicator', parent: s, dir: 'row', pad: { top: 0, right: 0, bottom: 8, left: 0 }, w: 390, h: 34, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.End }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(o.app, 'ink') }); hi.stackLayout.apply(); }
  return { screen: s, body: body, finish: function () { H.order(body); H.order(s); return s; } }; };
// Inset-grouped list (52px rows, 17pt, chevron 17/bold, 16px margins, indented separators). rows: [{link, glyph, tint, title, detail, chevron, toggle}]
H.iosGroup = function (parent, app, rows, o) { o = o || {}; var wrap = H.frame({ name: o.name || 'group', parent: parent, dir: 'col', gap: 0, pad: 0, w: 358, align: sketch.StackLayout.AlignItems.Start });
  if (o.header) { var hh = H.frame({ name: 'header', parent: wrap, pad: { top: 0, right: 16, bottom: 6, left: 16 }, w: 358 }); H.sft({ parent: hh, text: o.header.toUpperCase(), size: 13, weight: 5, color: H.sw(app, 'tertiary') }); hh.stackLayout.apply(); }
  var g = H.frame({ name: 'rows', parent: wrap, dir: 'col', gap: 0, pad: 0, w: 358, radius: 12, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  rows.forEach(function (r, i) { var row = H.frame({ name: r.link ? 'link:' + r.link : 'row', parent: g, dir: 'row', gap: 12, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 358, h: r.h || 52 });
    if (r.glyph) { var ic = H.frame({ name: 'icon', parent: row, pad: 0, w: 30, h: 30, radius: 7, fill: r.tint || H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sf(ic, r.glyph, { size: 16, weight: 7, color: '#ffffff' }); ic.stackLayout.apply(); }
    var tw = H.frame({ name: 'text', parent: row, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: tw, text: r.title, size: 17, weight: 5, color: H.sw(app, r.destructive ? 'negative' : 'ink') }); if (r.sub) H.sft({ parent: tw, text: r.sub, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(tw);
    var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
    if (r.detail) H.sft({ parent: row, text: r.detail, size: 17, weight: 5, color: H.sw(app, 'tertiary') });
    if (r.toggle !== undefined) { var tg = H.frame({ name: 'toggle', parent: row, pad: 2, w: 51, h: 31, radius: 16, fill: r.toggle ? H.sw(app, 'positive') : H.alpha(H.hex(app, 'ink'), 0.16), justify: r.toggle ? sketch.StackLayout.JustifyContent.End : sketch.StackLayout.JustifyContent.Start }); H.rect({ parent: tg, name: 'knob', w: 27, h: 27, oval: true, fill: '#ffffff' }); tg.stackLayout.apply(); }
    if (r.chevron !== false && r.link && r.toggle === undefined) H.sf(row, 'chevron_right', { size: 14, weight: 8, color: H.sw(app, 'tertiary') });
    H.order(row);
    if (i < rows.length - 1) { var sepW = H.frame({ name: 'sep', parent: g, dir: 'row', pad: { top: 0, right: 0, bottom: 0, left: r.glyph ? 58 : 16 }, w: 358, h: 1 }); var sl = H.rect({ parent: sepW, name: 'line', w: 300, h: 1, fill: H.sw(app, 'line') }); sl.horizontalSizing = sketch.FlexSizing.Fill; sepW.stackLayout.apply(); } });
  H.order(g); if (o.footer) { var ff = H.frame({ name: 'footer', parent: wrap, pad: { top: 6, right: 16, bottom: 0, left: 16 }, w: 358 }); H.sft({ parent: ff, text: o.footer, size: 13, weight: 5, color: H.sw(app, 'tertiary'), w: 326 }); ff.stackLayout.apply(); }
  H.order(wrap); return wrap; };
// iOS sheet over a scrim: grabber 60×4 + 70px toolbar with 44px symbol buttons + 17/bold title. Returns the sheet body frame.
H.iosSheet = function (screen, app, o) { screen.stackLayout = null; var scrim = H.rect({ parent: screen, name: 'scrim', w: 390, h: 844, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' });
  var sh = H.frame({ name: 'sheet', parent: screen, dir: 'col', gap: 0, pad: 0, w: 390, h: o.h || 560, radius: 24, fill: H.sw(app, 'canvas'), align: sketch.StackLayout.AlignItems.Center, clip: true });
  var gw = H.frame({ name: 'grabber-wrap', parent: sh, pad: { top: 5, right: 0, bottom: 0, left: 0 }, w: 390, h: 14, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: gw, name: 'grabber', w: 36, h: 5, radius: 3, fill: H.alpha(H.hex(app, 'ink'), 0.3) }); gw.stackLayout.apply();
  var tb = H.frame({ name: 'sheet-toolbar', parent: sh, dir: 'row', pad: { top: 0, right: 8, bottom: 0, left: 8 }, w: 390, h: 56 });
  var l = H.frame({ name: 'leading', parent: tb, dir: 'row', pad: 0, w: 100, h: 44 }); if (o.cancel !== false) { var cb = H.frame({ name: 'link:' + (o.cancelLink || 'back'), parent: l, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: cb, text: o.cancelLabel || 'Cancel', size: 17, weight: 5, color: H.sw(app, 'accent') }); cb.stackLayout.apply(); } l.stackLayout.apply();
  H.sft({ parent: tb, text: o.title || '', size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 174 });
  var r = H.frame({ name: 'trailing', parent: tb, dir: 'row', pad: 0, w: 100, h: 44, justify: sketch.StackLayout.JustifyContent.End }); if (o.done) { var db = H.frame({ name: 'link:' + (o.doneLink || 'back'), parent: r, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: db, text: o.done, size: 17, weight: 7, color: H.sw(app, 'accent') }); db.stackLayout.apply(); } r.stackLayout.apply(); H.order(tb);
  var body = H.frame({ name: 'sheet-body', parent: sh, dir: 'col', gap: 16, pad: 16, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  H.order(sh); sh.frame.x = 0; sh.frame.y = 844 - sh.frame.height; scrim.moveToFront(); sh.moveToFront();
  return { sheet: sh, body: body, finish: function () { H.order(body); sh.stackLayout.apply(); sh.frame.y = 844 - sh.frame.height; scrim.moveToFront(); sh.moveToFront(); } }; };
// iOS alert 270 wide (HIG): title 17/bold, message 13, stacked/side-by-side 44px buttons with separators.
H.iosAlert = function (screen, app, o) { screen.stackLayout = null; var scrim = H.rect({ parent: screen, name: 'scrim', w: 390, h: 844, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' });
  var a = H.frame({ name: 'alert', parent: screen, dir: 'col', gap: 0, pad: 0, w: 270, radius: 14, fill: H.alpha(H.hex(app, 'surface'), 0.97), align: sketch.StackLayout.AlignItems.Center, clip: true });
  var tx = H.frame({ name: 'text', parent: a, dir: 'col', gap: 4, pad: { top: 19, right: 16, bottom: 19, left: 16 }, w: 270, align: sketch.StackLayout.AlignItems.Center }); H.sft({ parent: tx, text: o.title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 238 }); H.sft({ parent: tx, text: o.body, size: 13, weight: 5, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 238 }); H.order(tx);
  var sep = H.rect({ parent: a, name: 'sep', w: 270, h: 1, fill: H.sw(app, 'line-strong') });
  var stacked = (o.buttons || []).length > 2; var btns = H.frame({ name: 'buttons', parent: a, dir: stacked ? 'col' : 'row', gap: 0, pad: 0, w: 270, align: sketch.StackLayout.AlignItems.Start });
  (o.buttons || []).forEach(function (b, i) { if (i > 0) H.rect({ parent: btns, name: 'sep', w: stacked ? 270 : 1, h: stacked ? 1 : 44, fill: H.sw(app, 'line-strong') }); var bt = H.frame({ name: 'link:' + b[0], parent: btns, pad: 0, w: stacked ? 270 : (270 - 1) / 2, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: bt, text: b[1], size: 17, weight: b[2] === 'bold' ? 7 : 5, color: H.sw(app, (b[2] === 'danger' || b[2] === 'negative') ? 'negative' : 'accent') }); bt.stackLayout.apply(); });
  H.order(btns); H.order(a); a.frame.x = 60; a.frame.y = Math.round((844 - a.frame.height) / 2); scrim.moveToFront(); a.moveToFront(); return a; };
