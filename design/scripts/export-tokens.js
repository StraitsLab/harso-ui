const sketch = require('sketch');
// Sketch → code: read the document's swatches and emit the four theme.css token blocks. This is the reverse direction
// (Sketch is the spec); the output is compared to src/theme.css by design/scripts/tokens-diff.py.
var doc = sketch.getSelectedDocument();
var apps = { 'Light/Clean': {}, 'Light/Cozy': {}, 'Dark/Clean': {}, 'Dark/Cozy': {} };
doc.swatches.forEach(function (s) {
  var parts = s.name.split('/'); if (parts.length !== 3) return;
  var app = parts[0] + '/' + parts[1]; if (!apps[app]) return;
  apps[app][parts[2]] = String(s.color).slice(0, 7).toLowerCase();
});
console.log(JSON.stringify({ ok: true, apps: apps }));
