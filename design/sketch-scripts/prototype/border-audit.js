// NO_PRELUDE
// Find every enabled border on Proto pages that is NOT: traffic light ring, inset list hairline (1px-high rect), ring stroke, battery outline.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = {};
['Proto macOS Light', 'Proto iOS Light'].forEach(function (pn) { var p = doc.pages.find(function (x) { return x.name === pn; }); out[pn] = {};
  p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0; }).forEach(function (s) { var hits = [];
    sketch.find('*', s).forEach(function (l) { try { var b = l.style && l.style.borders ? l.style.borders.filter(function (x) { return x.enabled; }) : []; if (!b.length) return; var n = String(l.name); if (/^traffic-|^track$|^arc$|^battery$|^line$|^sep$/.test(n)) return; if (l.frame.height <= 1.5 || l.frame.width <= 1.5) return; hits.push(n.slice(0, 26) + ' ' + Math.round(l.frame.width) + 'x' + Math.round(l.frame.height)); } catch (e) {} });
    if (hits.length) out[pn][s.name.split('/').pop()] = hits.slice(0, 8); }); });
console.log(JSON.stringify(out));
