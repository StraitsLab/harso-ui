// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = [];
function screens(pn, id) { var p = doc.pages.find(function (x) { return x.name === pn; }); return p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0 && l.name.split('/').pop() === id; }); }
['Proto macOS Light', 'Proto macOS Dark'].forEach(function (pn) {
  screens(pn, 'project').forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (/^0 conversations · 0 artifacts/.test(t.text)) { t.text = t.text.replace(/^0 conversations · 0 artifacts/, '12 conversations · 7 artifacts'); out.push(pn + ' project counts'); } }); });
  screens(pn, 'artifacts').forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (/^6 of 48 artifacts/.test(t.text)) { t.text = t.text.replace(/^6 of 48/, '9 of 48'); out.push(pn + ' artifacts count'); } }); });
});
['Proto iOS Light', 'Proto iOS Dark'].forEach(function (pn) {
  screens(pn, 'project').forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (t.text === 'Back' && t.parent && String(t.parent.name).replace(/ \d+$/, '') === 'link:back') { t.text = 'Projects'; out.push(pn + ' project back label'); } }); });
  screens(pn, 'settings-general').forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (t.text === 'Open links in browser') { t.text = 'Confirm before closing a session'; out.push(pn + ' general dup row'); } }); });
});
console.log(JSON.stringify(out));
