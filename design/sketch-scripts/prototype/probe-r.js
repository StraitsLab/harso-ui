// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = {};
function scr(pn, id) { var p = doc.pages.find(function (x) { return x.name === pn; }); return p.layers.find(function (l) { return l.name.indexOf('Screen/') === 0 && l.name.split('/').pop() === id; }); }
var s = scr('Proto macOS Light', 'projects'); out.macSidebarSections = sketch.find('Text', s).filter(function (t) { return t.parent && String(t.parent.name).indexOf('section') === 0 || String(t.parent.name).indexOf('link:recent') === 0; }).map(function (t) { return [t.text, String(t.parent.name)]; });
['artifacts', 'project', 'routines'].forEach(function (id) { var x = scr('Proto iOS Light', id); out[id] = sketch.find('Group', x).filter(function (g) { return /^link:/.test(String(g.name)); }).map(function (g) { return [String(g.name), Math.round(g.frame.width), Math.round(g.frame.height)]; }).slice(0, 14); });
console.log(JSON.stringify(out));
