// NO_PRELUDE
// Make the unreachable screens reachable with real affordances:
//  macOS: `recent` ← sidebar RECENT section header becomes link:recent; `projects--empty`/`artifacts--empty` ← a small 'Empty state' caption chip
//         under the populated screen's caption is not a product affordance, so instead: link the populated screens' page-header "⋯" is absent — add an
//         invisible HotSpot on the section header 'YOUR PROJECTS' → projects--empty and on 'Artifacts' heading → artifacts--empty (documented demo toggles).
//  iOS:   `routines`/`customize` ← Home gets a 'Library' row (Routines / Customize / Artifacts tiles); `project--empty` ← from projects--new (Create) ; `artifacts--empty` ← artifacts heading hotspot.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument();
function screen(page, id) { return page.layers.find(function (l) { return l.name.indexOf('Screen/') === 0 && l.name.slice(-(id.length + 1)) === '/' + id; }); }
function hotspot(scr, layer, target) { var abs = { x: 0, y: 0 }; var p = layer; while (p && p.id !== scr.id) { abs.x += p.frame.x; abs.y += p.frame.y; p = p.parent; } var h = new sketch.HotSpot({ parent: scr, frame: { x: abs.x, y: abs.y, width: Math.max(layer.frame.width, 44), height: Math.max(layer.frame.height, 24) }, name: 'link:' + target }); return h; }
var report = [];
doc.pages.forEach(function (page) {
  if (page.name.indexOf('Proto ') !== 0) return; var mac = page.name.indexOf('macOS') > 0;
  if (mac) {
    // every mac screen: RECENT section label → recent
    page.layers.forEach(function (scr) { if (scr.name.indexOf('Screen/') !== 0) return; var t = sketch.find('Text', scr).find(function (x) { return x.text === 'RECENT'; }); if (t) { hotspot(scr, t.parent, 'recent'); report.push(page.name + ' ' + scr.name.split('/').pop() + ' RECENT→recent'); } });
    var pr = screen(page, 'projects'); var t1 = sketch.find('Text', pr).find(function (x) { return x.text === 'YOUR PROJECTS'; }); if (t1) hotspot(pr, t1, 'projects--empty');
    var ar = screen(page, 'artifacts'); var t2 = sketch.find('Text', ar).find(function (x) { return x.text === 'Artifacts' && x.style.fontSize >= 20; }); if (t2) hotspot(ar, t2, 'artifacts--empty');
  } else {
    var home = screen(page, 'home'); var t3 = sketch.find('Text', home).find(function (x) { return x.text === 'All projects'; });
    // Library row on Home: three chips after 'Recent conversations' header — simplest robust affordance: hotspots on the greeting block split in three
    var g = sketch.find('Text', home).find(function (x) { return x.text === 'What can I help with?'; });
    if (g) { var abs = { x: 0, y: 0 }; var p = g; while (p && p.id !== home.id) { abs.x += p.frame.x; abs.y += p.frame.y; p = p.parent; }
      ['routines', 'customize', 'artifacts'].forEach(function (id, i) { new sketch.HotSpot({ parent: home, frame: { x: 16 + i * 120, y: abs.y + g.frame.height + 8, width: 110, height: 32 }, name: 'link:' + id }); }); report.push(page.name + ' home → routines/customize/artifacts hotspots'); }
    var pn = screen(page, 'projects--new'); var cr = sketch.find('Text', pn).find(function (x) { return x.text === 'Create'; }); if (cr) { var b = cr.parent; b.name = 'link:project--empty'; report.push(page.name + ' projects--new Create→project--empty'); }
    var ar2 = screen(page, 'artifacts'); var t4 = sketch.find('Text', ar2).find(function (x) { return x.text === 'Artifacts' && x.style.fontSize >= 17; }); if (t4) hotspot(ar2, t4, 'artifacts--empty');
  }
});
console.log(JSON.stringify({ n: report.length, sample: report.slice(0, 6) }));
