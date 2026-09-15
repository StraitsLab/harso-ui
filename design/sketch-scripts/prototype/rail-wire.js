// NO_PRELUDE
// collapse (sidebar_left button, named link:back by the helper default) → --rail twin; rail's toolbar link:back → expanded.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = [];
['Proto macOS Light', 'Proto macOS Dark'].forEach(function (pn) { var p = doc.pages.find(function (x) { return x.name === pn; });
  [['conversation', 'conversation--rail'], ['activity--work', 'activity--work--rail']].forEach(function (pair) {
    var s = p.layers.find(function (l) { return l.name.indexOf('Screen/') === 0 && l.name.split('/').pop() === pair[0]; }); var r = p.layers.find(function (l) { return l.name.indexOf('Screen/') === 0 && l.name.split('/').pop() === pair[1]; }); if (!s || !r) { out.push(pn + ' missing ' + pair); return; }
    var tl = sketch.find('Group', s).find(function (g) { return String(g.name) === 'titlebar'; }); if (tl) { var btn = tl.layers.find(function (k) { return /^link:/.test(String(k.name)); }); if (btn) { btn.name = 'link:' + pair[1]; out.push(pn + ' ' + pair[0] + ' collapse→rail'); } }
    var tb = sketch.find('Group', r).find(function (g) { return String(g.name) === 'toolbar'; }); if (tb) { var nav = sketch.find('Group', tb).find(function (g) { return String(g.name) === 'nav'; }); if (nav) { var b = nav.layers.find(function (k) { return String(k.name).replace(/ \d+$/, '') === 'link:back'; }); if (b) { b.name = 'link:' + pair[0]; out.push(pn + ' rail back→' + pair[0]); } } }
  }); });
console.log(JSON.stringify(out));
