// NO_PRELUDE
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = [];
function all(pn) { var p = doc.pages.find(function (x) { return x.name === pn; }); return p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0; }); }
function scr(pn, id) { return all(pn).find(function (l) { return l.name.split('/').pop() === id; }); }
['Proto macOS Light', 'Proto macOS Dark'].forEach(function (pn) { all(pn).forEach(function (s) { sketch.find('Text', s).forEach(function (t) { if (t.text === 'Recent' && t.parent && /^section/.test(String(t.parent.name))) { t.parent.name = 'link:recent'; out.push(pn + ':' + s.name.split('/').pop() + ' Recent→link'); } }); }); });
['Proto iOS Light', 'Proto iOS Dark'].forEach(function (pn) {
  // artifacts: the 3 filter chips (117×28) — third chip → artifacts--empty (a filter with no results)
  var a = scr(pn, 'artifacts'); var chips = sketch.find('Group', a).filter(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:artifacts' && g.frame.height === 28; }); if (chips.length) { chips[chips.length - 1].name = 'link:artifacts--empty'; out.push(pn + ' artifacts chip→empty'); }
  // project: first conversation row stays; make the LAST row... no. project--empty ← project 'Work' segmented? project--work exists. Use the project's 5th conversation row? Fake. Instead: project--empty is reached from projects--new create? projects--new Create → project--empty (a freshly created project is empty) — honest.
  var pn2 = scr(pn, 'projects--new'); if (pn2) { var create = sketch.find('Group', pn2).filter(function (g) { return String(g.name).replace(/ \d+$/, '') === 'link:project'; }); create.forEach(function (c) { c.name = 'link:project--empty'; }); if (create.length) out.push(pn + ' projects--new Create→project--empty'); }
});
console.log(JSON.stringify(out));
