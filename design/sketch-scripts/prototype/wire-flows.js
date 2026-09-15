// NO_PRELUDE
// Wire Sketch prototype flows: every layer named `link:<id>` inside `Screen/<platform>/<App>/<base>` targets
// `Screen/<platform>/<App>/<id>` on the same page; `link:back` → Flow.BackTarget. Overlays (`--`) use a fade, pushes slide.
const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var report = { pages: {}, unresolved: [] };
doc.pages.forEach(function (page) {
  if (page.name.indexOf('Proto ') !== 0) return;
  var screens = {}; page.layers.forEach(function (l) { var m = l.name.match(/^Screen\/(macos|ios)\/(Light|Dark)\/(Clean|Cozy)\/(.+)$/); if (m) screens[m[4]] = l; });
  var wired = 0, back = 0; var home = null;
  Object.keys(screens).forEach(function (id) {
    var scr = screens[id];
    sketch.find('*', scr).forEach(function (l) {
      var m = l.name.match(/^link:(.+)$/); if (!m) return; var target = m[1].replace(/ \d+$/, '');
      var isIosPage = page.name.indexOf('iOS') > 0; var alias = { 'settings-models': 'customize' }; if (isIosPage) alias['new-conversation'] = 'home'; if (alias[target]) target = alias[target];
      if (target !== 'back' && !screens[target] && target.indexOf('--') > 0 && screens[target.split('--')[0]]) target = target.split('--')[0];
      if (target === 'back') { l.flow = { target: sketch.Flow.BackTarget }; back += 1; return; }
      var t = screens[target];
      if (!t) { report.unresolved.push(page.name + ' · ' + id + ' → ' + target); return; }
      var overlay = target.indexOf('--') > 0 && target.indexOf(id) === 0;
      var isIos = page.name.indexOf('iOS') > 0;
      l.flow = { target: t, animationType: overlay ? sketch.Flow.AnimationType.none : (isIos ? sketch.Flow.AnimationType.slideFromRight : sketch.Flow.AnimationType.none) };
      wired += 1;
    });
    scr.flowStartPoint = false;
  });
  home = screens['signin'] || screens['new-conversation'] || screens['home'];
  if (home) home.flowStartPoint = true;
  report.pages[page.name] = { screens: Object.keys(screens).length, wired: wired, back: back, start: home ? home.name : null };
});
console.log(JSON.stringify(report));
