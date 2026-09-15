// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var p = doc.pages.find(function (x) { return x.name === 'Proto scratch'; }); p.layers.filter(function (l) { return /smoke-(settings|delete|sheet)/.test(l.name); }).forEach(function (l) { l.remove(); }); console.log('ok');
