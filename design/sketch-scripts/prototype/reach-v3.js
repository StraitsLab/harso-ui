// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = [];
var scratch = doc.pages.find(function (p) { return p.name === 'Proto scratch'; }); scratch.layers.slice().forEach(function (l) { l.remove(); }); out.push('scratch cleared');
function all(pn) { var p = doc.pages.find(function (x) { return x.name === pn; }); return p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0; }); }
function scr(pn, id) { return all(pn).find(function (l) { return l.name.split('/').pop() === id; }); }
function links(s) { return sketch.find('Group', s).filter(function (g) { return /^link:/.test(String(g.name)); }); }
['Proto macOS Light', 'Proto macOS Dark'].forEach(function (pn) {
  all(pn).forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (t.text === 'RECENT' && t.parent && /^section/.test(String(t.parent.name))) { t.parent.name = 'link:recent'; } }); });
  ['projects', 'artifacts'].forEach(function (id) { var s = scr(pn, id); if (!s) return; var sf = links(s).filter(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:search'; })[0]; if (sf) { sf.name = 'link:' + id + '--empty'; out.push(pn + ' ' + id + ' search→empty'); } });
  ['projects--empty', 'artifacts--empty'].forEach(function (id) { var s = scr(pn, id); if (!s) return; links(s).forEach(function (g) { if (String(g.name).replace(/ \d+$/, '') === 'link:search') g.name = 'link:back'; }); });
});
['Proto iOS Light', 'Proto iOS Dark'].forEach(function (pn) {
  var home = scr(pn, 'home'); if (home) sketch.find('Text', home).forEach(function (t) { var g = t.parent; if (!g || !g.frame || g.frame.height > 60) return; if (t.text === 'Write') { g.name = 'link:customize'; out.push(pn + ' Write→customize'); } if (t.text === 'Build') { g.name = 'link:routines'; out.push(pn + ' Build→routines'); } });
  var cu = scr(pn, 'customize'); if (cu) { var rows = links(cu).filter(function (g) { return g.frame.height >= 44 && g.frame.height <= 60; }); if (rows[0]) { rows[0].name = 'link:customize--profile'; out.push(pn + ' customize→profile'); } }
  var rt = scr(pn, 'routines'); if (rt && !links(rt).some(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:routines--new'; })) { var plus = links(rt).filter(function (g) { return g.frame.width === 44 && g.frame.height === 44; })[0]; if (plus) { plus.name = 'link:routines--new'; out.push(pn + ' routines plus→new'); } }
  var pnew = scr(pn, 'projects--new'); if (pnew) links(pnew).forEach(function (g) { if (String(g.name).replace(/ \d+$/, '') === 'link:project') { g.name = 'link:project--empty'; out.push(pn + ' new→project--empty'); } });
  var art = scr(pn, 'artifacts'); if (art) { var chips = links(art).filter(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:artifacts' && g.frame.height <= 34; }); if (chips.length) { chips[chips.length - 1].name = 'link:artifacts--empty'; out.push(pn + ' artifacts chip→empty'); } else { var sf = links(art).filter(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:search'; })[0]; if (sf) { sf.name = 'link:artifacts--empty'; out.push(pn + ' artifacts search→empty'); } } }
});
console.log(JSON.stringify(out));
