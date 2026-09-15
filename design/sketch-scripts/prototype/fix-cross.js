// NO_PRELUDE
// Cross-cutting v2 fixes on all Proto pages:
//  A) any column stack whose children are ONLY Text (a title/subtitle stack) → alignItems Start (kills "internally centred" rows)
//  B) iOS overlay screens (sheet/alert/action sheet) → home indicator drawn above the sheet at (128,831) 134×5
//  C) iOS approval sheet grabber → 36×5 (HIG-SPEC measured 36×5 on iOS 27 kit sheets; keep consistent everywhere): normalise ALL grabbers to 36×5 centred
//  D) macOS Share vs Export glyph: Export rows use square_and_arrow_up_on_square (0x100207 verified)
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var out = { colFix: 0, homeInd: 0, grabber: 0, exportGlyph: 0 };
function screens(pn) { var p = doc.pages.find(function (x) { return x.name === pn; }); return p ? p.layers.filter(function (l) { return l.name.indexOf('Screen/') === 0; }) : []; }
var pages = ['Proto macOS Light', 'Proto macOS Dark', 'Proto iOS Light', 'Proto iOS Dark'];
pages.forEach(function (pn) { screens(pn).forEach(function (s) {
  sketch.find('Group', s).forEach(function (g) { if (!g.stackLayout || g.stackLayout.direction !== sketch.StackLayout.Direction.Column) return; var kids = g.layers; if (!kids.length || kids.length > 3) return; if (kids.every(function (k) { return k.type === 'Text'; })) { if (g.stackLayout.alignItems !== sketch.StackLayout.AlignItems.Start) { g.stackLayout.alignItems = sketch.StackLayout.AlignItems.Start; out.colFix++; } } });
  if (pn.indexOf('iOS') > 0) {
    var hasSheet = sketch.find('Group', s).some(function (g) { return /^(sheet|alert|action-sheet|menu)$/.test(String(g.name)) || String(g.name) === 'scrim'; }) || sketch.find('ShapePath', s).some(function (r) { return String(r.name) === 'scrim'; });
    if (hasSheet) { var existing = sketch.find('*', s).filter(function (l) { return String(l.name) === 'home-indicator-overlay'; }); if (!existing.length) { s.stackLayout = null; var dark = pn.indexOf('Dark') > 0; var hi = new sketch.ShapePath({ name: 'home-indicator-overlay', parent: s, shapeType: sketch.ShapePath.ShapeType.Rectangle, frame: { x: 128, y: 831, width: 134, height: 5 } }); hi.style.fills = [{ fillType: sketch.Style.FillType.Color, color: dark ? '#ffffff' : '#000000', enabled: true }]; hi.style.corners.radii = [3, 3, 3, 3]; hi.moveToFront(); out.homeInd++; } }
    sketch.find('ShapePath', s).forEach(function (r) { if (String(r.name) === 'grabber') { if (Math.round(r.frame.width) !== 36) { var cx = r.frame.x + r.frame.width / 2; r.frame.width = 36; r.frame.height = 5; r.frame.x = cx - 18; out.grabber++; } } });
  } else {
    sketch.find('Text', s).forEach(function (t) { if (t.text === 'Export' && t.parent) { var glyph = t.parent.layers.find(function (k) { return k.type === 'Text' && k.style.fontFamily === 'SF Pro' && k !== t && k.text.length === 2; }); if (glyph && glyph.text !== String.fromCodePoint(0x100207)) { glyph.text = String.fromCodePoint(0x100207); out.exportGlyph++; } } });
  }
}); });
console.log(JSON.stringify(out));
