// NO_PRELUDE
// Walk a click path by flow targets and emit the visited screen ids + frame ids so the lead can screenshot the journey.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument();
var PAGE = 'PAGE_NAME'; var PATH = PATH_LIST; // sequence of link ids to click starting from the start screen
var page = doc.pages.find(function (p) { return p.name === PAGE; });
var screens = {}; var byId = {}; page.layers.forEach(function (l) { var m = l.name.match(/^Screen\/[^/]+\/[^/]+\/[^/]+\/(.+)$/); if (m) { screens[m[1]] = l; byId[String(l.id)] = m[1]; } });
var cur = Object.keys(screens).find(function (id) { return screens[id].flowStartPoint; }); var visited = [[cur, String(screens[cur].id)]]; var stack = [];
PATH.forEach(function (link) {
  var scr = screens[cur]; var l = sketch.find('*', scr).find(function (x) { return x.name === 'link:' + link && x.flow; });
  if (!l) { visited.push(['MISSING link:' + link + ' on ' + cur, '']); return; }
  if (l.flow.isBackAction && l.flow.isBackAction()) { cur = stack.pop() || cur; } else { stack.push(cur); cur = byId[String(l.flow.targetId)]; }
  visited.push([cur, String(screens[cur].id)]);
});
console.log(JSON.stringify(visited));
