// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = [];
doc.pages.forEach(function (p) { if (p.name.indexOf('Proto ') !== 0) return; p.layers.forEach(function (l) { var m = l.name.match(/^Screen\/(macos|ios)\/(Light|Dark)\/Clean\/(.+)$/); if (m) out.push([p.name, m[1], m[2], m[3], String(l.id)]); }); });
console.log(JSON.stringify(out));