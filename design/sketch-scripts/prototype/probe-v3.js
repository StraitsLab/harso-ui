// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = {};
['Proto macOS Light', 'Proto iOS Light'].forEach(function (pn) { var p = doc.pages.find(function (x) { return x.name === pn; }); var ids = p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0; }).map(function (l) { return l.name.split('/').pop(); }); out[pn] = ids.sort(); });
var p = doc.pages.find(function (x) { return x.name === 'Proto macOS Light' }); var c = p.layers.find(function (l) { return /\/conversation$/.test(l.name); }); out.convLinks = sketch.find('Group', c).filter(function (g) { return /^link:/.test(String(g.name)); }).map(function (g) { return String(g.name); }).filter(function (v, i, a) { return a.indexOf(v) === i; });
console.log(JSON.stringify(out));
