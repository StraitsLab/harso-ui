// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument();
['Proto macOS Light','Proto macOS Dark','Proto iOS Light','Proto iOS Dark'].forEach(function (n) { if (!doc.pages.find(function (p) { return p.name === n; })) new sketch.Page({ name: n, parent: doc }); });
var sc = doc.pages.find(function (p) { return p.name === 'Scratch'; }); if (sc) sc.remove();
console.log(JSON.stringify({ pages: doc.pages.map(function (p) { return p.name; }) }));
