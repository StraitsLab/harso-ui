// Prototype helpers (appended to the kit prelude for the screen lanes).
// Naming: screens are Frames `Screen/<platform>/<App>/<id>`; anything clickable is named `link:<id>` (or `link:back`).
// The lead wires flows after all lanes finish: link:<id> → Screen/<platform>/<App>/<id> on the same platform/appearance.
H.screen = function (o) { var page = H.page(o.page); var f = H.frame({ name: 'Screen/' + o.platform + '/' + o.app + '/' + o.id, parent: page, dir: 'row', gap: 0, pad: 0, w: o.w, h: o.h, fill: H.sw(o.app, 'canvas'), align: sketch.StackLayout.AlignItems.Start, clip: true }); f.frame.x = o.x || 0; f.frame.y = o.y || 0; return f; };
H.link = function (layer, id) { layer.name = 'link:' + id; return layer; };
// Instantiate a kit symbol by exact master name (from the Controls/Display/... pages).
H.inst = function (name, parent) { var m = doc.getSymbols().find(function (s) { return s.name === name; }); if (!m) throw new Error('no symbol ' + name); var i = m.createNewInstance(); i.parent = parent; return i; };
H.hasSymbol = function (name) { return !!doc.getSymbols().find(function (s) { return s.name === name; }); };

// ---- macOS app chrome: 240px sidebar identical on every desktop screen (matches the shipped Weave desktop shell).
H.macSidebar = function (screen, app, active, o) {
  o = o || {};
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 4, pad: 16, w: 240, h: screen.frame.height, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start });
  sb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var brand = H.frame({ name: 'brand', parent: sb, dir: 'row', gap: 8, pad: { top: 4, right: 0, bottom: 12, left: 0 }, h: 40 });
  H.icon({ parent: brand, d: H.paths.sparkles, size: 20, color: H.hex(app, 'accent') }); H.text({ parent: brand, text: 'Weave', size: 16, weight: 7, color: H.sw(app, 'ink') }); H.order(brand);
  var actions = H.frame({ name: 'actions', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 0, bottom: 12, left: 0 }, w: 208 });
  var nb = H.frame({ name: 'link:new-conversation', parent: actions, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 12 }, w: 160, h: 36, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line-strong') });
  H.icon({ parent: nb, d: H.paths.plus, size: 14, color: H.hex(app, 'ink') }); H.text({ parent: nb, text: 'New conversation', size: 13, weight: 5, color: H.sw(app, 'ink') }); H.order(nb);
  var sbtn = H.frame({ name: 'link:search', parent: actions, dir: 'row', pad: 0, w: 36, h: 36, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line-strong'), justify: sketch.StackLayout.JustifyContent.Center });
  H.icon({ parent: sbtn, d: H.paths.search, size: 16, color: H.hex(app, 'ink') }); sbtn.stackLayout.apply(); H.order(actions);
  [['activity', 'Activity', 'bell', '1'], ['artifacts', 'Artifacts', 'layers', null], ['routines', 'Routines', 'clock', null], ['customize', 'Customize', 'settings', null], ['projects', 'Projects', 'folder', null]].forEach(function (it) {
    var sel = it[0] === active;
    var row = H.frame({ name: 'link:' + it[0], parent: sb, dir: 'row', gap: 10, pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 32, radius: 8, fill: sel ? H.sw(app, 'hover') : null });
    H.icon({ parent: row, d: H.paths[it[2]], size: 16, color: H.hex(app, sel ? 'ink' : 'secondary') }); H.text({ parent: row, text: it[1], size: 13, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary') });
    if (it[3]) { var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: row, text: it[3], size: 11, weight: 7, color: H.sw(app, 'accent') }); }
    H.order(row);
  });
  function section(label) { var h = H.frame({ name: 'section', parent: sb, dir: 'row', pad: { top: 16, right: 10, bottom: 4, left: 10 }, w: 208 }); H.text({ parent: h, text: label, size: 11, weight: 6, color: H.sw(app, 'tertiary') }); h.stackLayout.apply(); }
  section('PINNED PROJECTS');
  var pr = H.frame({ name: 'link:project', parent: sb, dir: 'row', pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 34, radius: 8, fill: active === 'project' ? H.sw(app, 'hover') : null }); H.text({ parent: pr, text: 'Personal', size: 13, weight: 5, color: H.sw(app, 'ink') }); pr.stackLayout.apply();
  section('RECENT');
  var rc = H.frame({ name: 'link:conversation', parent: sb, dir: 'row', pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 34, radius: 8, fill: active === 'conversation' ? H.sw(app, 'hover') : null }); H.text({ parent: rc, text: 'Move the billing webhook handler…', size: 13, weight: 5, color: H.sw(app, 'ink'), w: 188 }); rc.stackLayout.apply();
  var fill = H.frame({ name: 'fill', parent: sb, pad: 0, w: 208 }); fill.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: { top: 8, right: 4, bottom: 0, left: 4 }, w: 208, h: 48 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 32, h: 32, radius: 16, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.text({ parent: av, text: 'FO', size: 11, weight: 7, color: '#ffffff' }); av.stackLayout.apply();
  var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.text({ parent: info, text: 'founder@example.com', size: 12, weight: 6, color: H.sw(app, 'ink') }); H.text({ parent: info, text: 'Setup incomplete', size: 11, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info);
  var sp2 = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); sp2.horizontalSizing = sketch.FlexSizing.Fill;
  H.icon({ parent: foot, d: H.paths.settings, size: 16, color: H.hex(app, 'secondary') }); H.order(foot);
  H.order(sb); return sb;
};
// Main column to the right of the sidebar (1200 wide on a 1440 screen). Returns the content frame (col stack, hug).
H.macMain = function (screen, app, o) { o = o || {}; var m = H.frame({ name: 'main', parent: screen, dir: 'col', gap: o.gap === undefined ? 24 : o.gap, pad: o.pad === undefined ? 32 : o.pad, w: screen.frame.width - 240, h: screen.frame.height, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); return m; };

// ---- iOS chrome: status bar (54) + optional nav bar (44) at top; floating TabBar (from the kit) + home indicator (34) at bottom.
H.iosStatusBar = function (parent, app) { var s = H.frame({ name: 'status-bar', parent: parent, dir: 'row', pad: { top: 14, right: 28, bottom: 0, left: 28 }, w: 390, h: 54 }); H.text({ parent: s, text: '9:41', size: 15, weight: 7, color: H.sw(app, 'ink') }); var sp = H.frame({ name: 'spacer', parent: s, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: s, text: '●●●  ▲  ▮', size: 12, weight: 6, color: H.sw(app, 'ink') }); H.order(s); return s; };
H.iosNavBar = function (parent, app, title, o) { o = o || {}; var n = H.frame({ name: 'nav-bar', parent: parent, dir: 'row', gap: 0, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 390, h: 44 });
  var lead = H.frame({ name: 'leading', parent: n, dir: 'row', gap: 4, pad: 0, w: 90, h: 44, justify: sketch.StackLayout.JustifyContent.Start });
  if (o.back) { var b = H.frame({ name: 'link:back', parent: lead, dir: 'row', gap: 2, pad: 0, h: 36 }); var ch = H.icon({ parent: b, d: '<path d="m15 18-6-6 6-6"/>', size: 20, color: H.hex(app, 'accent') }); H.text({ parent: b, text: o.back === true ? 'Back' : o.back, size: 15, weight: 5, color: H.sw(app, 'accent') }); H.order(b); }
  lead.stackLayout.apply();
  var t = H.text({ parent: n, text: title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 178 });
  var trail = H.frame({ name: 'trailing', parent: n, dir: 'row', pad: 0, w: 90, h: 44, justify: sketch.StackLayout.JustifyContent.End });
  if (o.trailing) { var tb = H.frame({ name: 'link:' + (o.trailingLink || o.trailing), parent: trail, pad: 0, w: 36, h: 36, radius: 18, justify: sketch.StackLayout.JustifyContent.Center }); H.icon({ parent: tb, d: H.paths[o.trailing], size: 20, color: H.hex(app, 'accent') }); tb.stackLayout.apply(); }
  trail.stackLayout.apply(); H.order(n); return n; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 16, bottom: 34, left: 16 }, w: 390, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 358, h: 64, radius: 32, fill: H.sw(app, 'surface'), border: H.sw(app, 'line'), shadow: { color: '#0000001f', blur: 24, spread: 0, x: 0, y: 8 } });
  [['home', 'Home', 'home'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'settings']].forEach(function (t) {
    var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 4, pad: 0, w: 70, h: 56, radius: 28, fill: sel ? H.sw(app, 'accent-soft') : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center });
    H.icon({ parent: tab, d: H.paths[t[2]], size: 20, color: H.hex(app, sel ? 'accent' : 'secondary') }); H.text({ parent: tab, text: t[1], size: 11, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.order(tab);
  });
  H.order(bar); wrap.stackLayout.apply(); return wrap;
};
H.iosScreen = function (o) { var s = H.screen({ page: o.page, platform: 'ios', app: o.app, id: o.id, w: 390, h: 844, x: o.x, y: o.y }); s.stackLayout.direction = sketch.StackLayout.Direction.Column;
  var top = H.frame({ name: 'top', parent: s, dir: 'col', pad: 0, w: 390 }); H.iosStatusBar(top, o.app); if (o.title !== undefined) H.iosNavBar(top, o.app, o.title, o); H.order(top);
  var body = H.frame({ name: 'body', parent: s, dir: 'col', gap: o.gap === undefined ? 16 : o.gap, pad: o.pad === undefined ? 16 : o.pad, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  var tab = null; if (o.tab !== false) tab = H.iosTabBar(s, o.app, o.tab || 'home'); else { var hi = H.frame({ name: 'home-indicator', parent: s, dir: 'row', pad: 0, w: 390, h: 34, justify: sketch.StackLayout.JustifyContent.Center }); var bar = H.rect({ parent: hi, name: 'indicator', w: 134, h: 5, radius: 3, fill: H.sw(o.app, 'ink') }); hi.stackLayout.apply(); }
  // Call finish() after filling body: fixes stack order (index 0 renders last) and relayouts.
  return { screen: s, body: body, finish: function () { body.stackLayout.apply(); H.order(s); return s; } }; };
