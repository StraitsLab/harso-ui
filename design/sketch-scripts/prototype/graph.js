// NO_PRELUDE
// Reachability check: BFS from the start screen over flow targets on each Proto page; list unreachable screens and dead-end screens.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument();
var out = {};
doc.pages.forEach(function (page) {
  if (page.name.indexOf('Proto ') !== 0) return;
  var screens = {}; var byId = {};
  page.layers.forEach(function (l) { var m = l.name.match(/^Screen\/[^/]+\/[^/]+\/[^/]+\/(.+)$/); if (m) { screens[m[1]] = l; byId[String(l.id)] = m[1]; } });
  var edges = {}; var start = null;
  Object.keys(screens).forEach(function (id) { var s = screens[id]; if (s.flowStartPoint) start = id; edges[id] = {}; sketch.find('*', s).forEach(function (l) { if (!l.flow) return; if (l.flow.isBackAction && l.flow.isBackAction()) { edges[id]['<back>'] = 1; return; } var t = byId[String(l.flow.targetId)]; if (t) edges[id][t] = 1; }); });
  var seen = {}; var q = [start]; seen[start] = 1;
  while (q.length) { var c = q.shift(); Object.keys(edges[c] || {}).forEach(function (t) { if (t !== '<back>' && !seen[t]) { seen[t] = 1; q.push(t); } }); }
  var unreachable = Object.keys(screens).filter(function (id) { return !seen[id]; });
  var deadEnd = Object.keys(screens).filter(function (id) { return Object.keys(edges[id] || {}).length === 0; });
  out[page.name] = { start: start, screens: Object.keys(screens).length, reachable: Object.keys(seen).length, unreachable: unreachable, deadEnd: deadEnd };
});
console.log(JSON.stringify(out));
