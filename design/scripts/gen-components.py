#!/usr/bin/env python3
"""Emit run_code scripts that build Base component symbols on a 'Components' page, Light/Clean + Dark/Clean.
Geometry is read from the kit CSS contract: 36px controls, radius 8, 14px/500 label, 6px 14px padding."""
import json
OUT = '/tmp/harso-sketch'
T = json.load(open(f'{OUT}/tokens.json'))['appearances']

def tok(app, k):
    v = T[app][k].strip()
    while v.startswith('var('):
        v = T[app][v[6:-1]].strip()
    return v

HELPERS = """const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var page = doc.pages.find(function (p) { return p.name === 'Components'; }) || (function () { var p = new sketch.Page({ name: 'Components', parent: doc }); return p; })();
function sw(name) { var s = doc.swatches.find(function (x) { return x.name === name; }); if (!s) throw new Error('no swatch ' + name); return s.referencingColor; }
function frame(o) { var f = new sketch.Group.Frame({ name: o.name, parent: o.parent, stackLayout: { direction: o.dir === 'col' ? sketch.StackLayout.Direction.Column : sketch.StackLayout.Direction.Row, gap: o.gap || 0, padding: o.pad === undefined ? 0 : o.pad, alignItems: o.align || sketch.StackLayout.AlignItems.Center, justifyContent: o.justify || sketch.StackLayout.JustifyContent.Start } }); f.style.fills = []; if (f.background) f.background.enabled = false; if (o.fill) f.style.fills = [{ fillType: sketch.Style.FillType.Color, color: o.fill, enabled: true }]; if (o.border) f.style.borders = [{ color: o.border, thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }]; if (o.radius !== undefined) f.style.corners.radii = [o.radius, o.radius, o.radius, o.radius]; if (o.w) { f.horizontalSizing = sketch.FlexSizing.Fixed; f.frame.width = o.w; } if (o.h) { f.verticalSizing = sketch.FlexSizing.Fixed; f.frame.height = o.h; } return f; }
function text(o) { var t = new sketch.Text({ name: o.name || 'label', text: o.text, parent: o.parent }); t.style.fontFamily = o.mono ? 'JetBrains Mono' : 'Inter'; t.style.fontSize = o.size || 14; t.style.fontWeight = o.weight || 5; t.style.textColor = o.color; if (o.w) { t.frame.width = o.w; t.fixedWidth = true; } return t; }
function rect(o) { var r = new sketch.ShapePath({ name: o.name || 'shape', parent: o.parent, shapeType: o.oval ? sketch.ShapePath.ShapeType.Oval : sketch.ShapePath.ShapeType.Rectangle, frame: { x: 0, y: 0, width: o.w, height: o.h } }); r.style.fills = o.fill ? [{ fillType: sketch.Style.FillType.Color, color: o.fill, enabled: true }] : []; r.style.borders = o.border ? [{ color: o.border, thickness: o.bw || 1, enabled: true, position: sketch.Style.BorderPosition.Inside }] : []; if (o.radius !== undefined) r.style.corners.radii = [o.radius, o.radius, o.radius, o.radius]; return r; }
function toSymbol(f) { var m = sketch.SymbolMaster.fromFrame(f); return m; }
function sheet(name, y) { var s = frame({ name: name, parent: page, dir: 'col', gap: 24, pad: 32, align: sketch.StackLayout.AlignItems.Start }); s.frame.x = 0; s.frame.y = y; return s; }
function row(parent, name, fill, border) { return frame({ name: name, parent: parent, dir: 'row', gap: 16, pad: 24, fill: fill, border: border, radius: 12, align: sketch.StackLayout.AlignItems.Center }); }
"""

def app_vars(app):
    A = app.split('/')[0] + '/' + app.split('/')[1]
    return {
        'app': A, 'ink': f"sw('{A}/ink')", 'inverse': f"sw('{A}/inverse')", 'hover': f"sw('{A}/hover')", 'surface': f"sw('{A}/surface')",
        'canvas': f"sw('{A}/canvas')", 'line': f"sw('{A}/line')", 'lineStrong': f"sw('{A}/line-strong')", 'accent': f"sw('{A}/accent')",
        'accentSoft': f"sw('{A}/accent-soft')", 'secondary': f"sw('{A}/secondary')", 'tertiary': f"sw('{A}/tertiary')", 'negative': f"sw('{A}/negative')",
        'positive': f"sw('{A}/positive')", 'positiveMark': f"sw('{A}/positive-mark')", 'attention': f"sw('{A}/attention')", 'attentionMark': f"sw('{A}/attention-mark')", 'negativeMark': f"sw('{A}/negative-mark')",
        'hoverHex': tok(app, 'hk-hover'), 'inkHex': tok(app, 'hk-ink'), 'canvasHex': tok(app, 'hk-canvas'), 'faint': f"sw('{A}/faint')",
    }

def buttons(v, y):
    # variants: primary, secondary, outline, ghost, danger; states: default, disabled
    variants = [
        ('primary', v['ink'], v['inverse'], 'null'),
        ('secondary', v['hover'], v['ink'], 'null'),
        ('outline', 'null', v['ink'], v['lineStrong']),
        ('ghost', 'null', v['secondary'], 'null'),
        ('danger', v['hover'], v['negative'], 'null'),
    ]
    js = [HELPERS, f"var sh = sheet('Buttons — {v['app']}', {y});", f"var r = row(sh, 'Button', {v['canvas']}, {v['line']});", "var made = [];"]
    for name, fill, color, border in variants:
        js.append(f"""(function () {{
  var b = frame({{ name: 'Button/{v['app']}/{name}/default', parent: r, dir: 'row', gap: 8, pad: 0, h: 36, radius: 8, fill: {fill}, border: {border}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
  b.stackLayout.padding = {{ top: 6, right: 14, bottom: 6, left: 14 }};
  text({{ parent: b, text: '{name[0].upper()+name[1:]} action', size: 14, weight: 6, color: {color} }});
  b.stackLayout.apply(); made.push(String(b.id));
}})();""")
    # disabled: tertiary text, transparent (primary: 32% ink)
    js.append(f"""(function () {{
  var b = frame({{ name: 'Button/{v['app']}/primary/disabled', parent: r, dir: 'row', gap: 8, pad: 0, h: 36, radius: 8, fill: '{v['inkHex']}52', align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
  b.stackLayout.padding = {{ top: 6, right: 14, bottom: 6, left: 14 }}; text({{ parent: b, text: 'Primary disabled', size: 14, weight: 6, color: {v['inverse']} }}); b.stackLayout.apply(); made.push(String(b.id));
  var g = frame({{ name: 'Button/{v['app']}/secondary/disabled', parent: r, dir: 'row', gap: 8, pad: 0, h: 36, radius: 8, fill: {v['hover']}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
  g.stackLayout.padding = {{ top: 6, right: 14, bottom: 6, left: 14 }}; text({{ parent: g, text: 'Secondary disabled', size: 14, weight: 6, color: {v['tertiary']} }}); g.stackLayout.apply(); made.push(String(g.id));
}})();""")
    js.append("r.stackLayout.apply(); sh.stackLayout.apply();")
    js.append("var kids = r.layers.slice(); kids.forEach(function (k, i) { k.index = kids.length - 1 - i; }); r.stackLayout.apply();")
    js.append("console.log(JSON.stringify({ ok: true, sheet: String(sh.id), made: made.length }));")
    return '\n'.join(js)

def inputs(v, y):
    js = [HELPERS, f"var sh = sheet('Inputs — {v['app']}', {y});", f"var r = row(sh, 'Input', {v['canvas']}, {v['line']});", "var made = [];"]
    states = [('default', v['lineStrong'], 'null', 'Search records', v['tertiary']), ('filled', v['lineStrong'], 'null', 'Quarterly review', v['ink']),
              ('focus', v['accent'], v['accentSoft'], 'Quarterly rev', v['ink']), ('invalid', v['negative'], 'null', 'not-an-email', v['ink']), ('disabled', v['lineStrong'], 'null', 'Unavailable', v['tertiary'])]
    for name, border, ring, val, col in states:
        fill = v['hover'] if name == 'disabled' else v['surface']
        js.append(f"""(function () {{
  var i = frame({{ name: 'Input/{v['app']}/{name}', parent: r, dir: 'row', gap: 8, pad: 0, w: 220, h: 36, radius: 8, fill: {fill}, border: {border}, align: sketch.StackLayout.AlignItems.Center }});
  i.stackLayout.padding = {{ top: 0, right: 12, bottom: 0, left: 12 }};
  {"i.style.shadows = [{ color: " + ring + ", blur: 0, spread: 3, x: 0, y: 0, enabled: true }];" if ring != 'null' else ''}
  text({{ parent: i, text: '{val}', size: 15, weight: 5, color: {col} }});
  i.stackLayout.apply(); made.push(String(i.id));
}})();""")
    js.append("r.stackLayout.apply(); var kids = r.layers.slice(); kids.forEach(function (k, i) { k.index = kids.length - 1 - i; }); r.stackLayout.apply(); sh.stackLayout.apply();")
    js.append("console.log(JSON.stringify({ ok: true, sheet: String(sh.id), made: made.length }));")
    return '\n'.join(js)

def marks(v, y):
    js = [HELPERS, f"var sh = sheet('Marks — {v['app']}', {y});", f"var r = row(sh, 'Badge + Chip + Choice', {v['canvas']}, {v['line']});", "var made = [];"]
    for name, col, mark in [('neutral', v['tertiary'], v['tertiary']), ('positive', v['positive'], v['positiveMark']), ('attention', v['attention'], v['attentionMark']), ('negative', v['negative'], v['negativeMark'])]:
        js.append(f"""(function () {{
  var b = frame({{ name: 'Badge/{v['app']}/{name}', parent: r, dir: 'row', gap: 6, pad: 0, align: sketch.StackLayout.AlignItems.Center }});
  rect({{ parent: b, name: 'mark', w: 6, h: 6, oval: true, fill: {mark} }});
  text({{ parent: b, text: '{name[0].upper()+name[1:]}', size: 12, weight: 6, color: {col} }});
  var kids = b.layers.slice(); kids.forEach(function (k, i) {{ k.index = kids.length - 1 - i; }}); b.stackLayout.apply(); made.push(String(b.id));
}})();""")
    js.append(f"""(function () {{
  var c = frame({{ name: 'Chip/{v['app']}/default', parent: r, dir: 'row', gap: 6, pad: 0, radius: 999, fill: {v['hover']}, align: sketch.StackLayout.AlignItems.Center }});
  c.stackLayout.padding = {{ top: 4, right: 8, bottom: 4, left: 8 }}; text({{ parent: c, text: 'Design', size: 12, weight: 6, color: {v['ink']} }}); c.stackLayout.apply(); made.push(String(c.id));
  var d = frame({{ name: 'Chip/{v['app']}/bold', parent: r, dir: 'row', gap: 6, pad: 0, radius: 999, fill: {v['ink']}, align: sketch.StackLayout.AlignItems.Center }});
  d.stackLayout.padding = {{ top: 4, right: 8, bottom: 4, left: 8 }}; text({{ parent: d, text: 'Design', size: 12, weight: 6, color: {v['canvas']} }}); d.stackLayout.apply(); made.push(String(d.id));
  // Checkbox off/on (18px, radius 4), Radio off/on (18px oval), Switch off/on (40x24, thumb 18)
  rect({{ parent: r, name: 'Checkbox/{v['app']}/off', w: 18, h: 18, radius: 4, fill: {v['surface']}, border: {v['lineStrong']} }});
  var on = frame({{ name: 'Checkbox/{v['app']}/on', parent: r, dir: 'row', pad: 0, w: 18, h: 18, radius: 4, fill: {v['ink']}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
  text({{ parent: on, text: '✓', size: 12, weight: 7, color: {v['inverse']} }}); on.stackLayout.apply();
  rect({{ parent: r, name: 'Radio/{v['app']}/off', w: 18, h: 18, oval: true, fill: {v['surface']}, border: {v['lineStrong']} }});
  rect({{ parent: r, name: 'Radio/{v['app']}/on', w: 18, h: 18, oval: true, fill: {v['surface']}, border: {v['ink']}, bw: 6 }});
  var so = frame({{ name: 'Switch/{v['app']}/off', parent: r, dir: 'row', pad: 3, w: 40, h: 24, radius: 12, fill: {v['lineStrong']}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Start }});
  rect({{ parent: so, name: 'thumb', w: 18, h: 18, oval: true, fill: {v['surface']} }}); so.stackLayout.apply();
  var sn = frame({{ name: 'Switch/{v['app']}/on', parent: r, dir: 'row', pad: 3, w: 40, h: 24, radius: 12, fill: {v['ink']}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.End }});
  rect({{ parent: sn, name: 'thumb', w: 18, h: 18, oval: true, fill: {v['canvas']} }}); sn.stackLayout.apply();
  made.push('choices');
}})();""")
    js.append("r.stackLayout.apply(); var kids = r.layers.slice(); kids.forEach(function (k, i) { k.index = kids.length - 1 - i; }); r.stackLayout.apply(); sh.stackLayout.apply();")
    js.append("console.log(JSON.stringify({ ok: true, sheet: String(sh.id), made: made.length }));")
    return '\n'.join(js)

def nav(v, y):
    js = [HELPERS, f"var sh = sheet('Navigation — {v['app']}', {y});", f"var r = row(sh, 'Tabs + Segmented + Avatar', {v['canvas']}, {v['line']});", "var made = [];"]
    js.append(f"""(function () {{
  var tabs = frame({{ name: 'Tabs/{v['app']}', parent: r, dir: 'row', gap: 24, pad: 4, align: sketch.StackLayout.AlignItems.Stretch }});
  ['Overview', 'Activity', 'Settings'].forEach(function (label, i) {{
    var t = frame({{ name: 'tab-' + label, parent: tabs, dir: 'col', gap: 0, pad: 0, h: 44, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
    text({{ parent: t, text: label, size: 14, weight: i === 0 ? 6 : 5, color: i === 0 ? {v['ink']} : {v['secondary']} }});
    if (i === 0) {{ var u = rect({{ parent: t, name: 'indicator', w: 60, h: 2, fill: {v['ink']} }}); u.frame.y = 42; }}
    t.stackLayout.apply();
  }});
  var kids = tabs.layers.slice(); kids.forEach(function (k, i) {{ k.index = kids.length - 1 - i; }}); tabs.stackLayout.apply(); made.push(String(tabs.id));
  var seg = frame({{ name: 'Segmented/{v['app']}', parent: r, dir: 'row', gap: 2, pad: 3, radius: 30, fill: {v['hover']}, align: sketch.StackLayout.AlignItems.Center }});
  ['Day', 'Week', 'Month'].forEach(function (label, i) {{
    var s = frame({{ name: 'seg-' + label, parent: seg, dir: 'row', pad: 0, h: 30, radius: 26, fill: i === 1 ? {v['surface']} : null, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
    s.stackLayout.padding = {{ top: 0, right: 14, bottom: 0, left: 14 }};
    if (i === 1) s.style.shadows = [{{ color: '#0000001a', blur: 2, spread: 0, x: 0, y: 1, enabled: true }}];
    text({{ parent: s, text: label, size: 13, weight: i === 1 ? 6 : 5, color: i === 1 ? {v['ink']} : {v['secondary']} }}); s.stackLayout.apply();
  }});
  var sk = seg.layers.slice(); sk.forEach(function (k, i) {{ k.index = sk.length - 1 - i; }}); seg.stackLayout.apply(); made.push(String(seg.id));
  var av = frame({{ name: 'Avatar/{v['app']}/initials', parent: r, dir: 'row', pad: 0, w: 32, h: 32, radius: 16, fill: {v['accentSoft']}, align: sketch.StackLayout.AlignItems.Center, justify: sketch.StackLayout.JustifyContent.Center }});
  text({{ parent: av, text: 'AB', size: 12, weight: 6, color: {v['accent']} }}); av.stackLayout.apply(); made.push(String(av.id));
  var card = frame({{ name: 'Card/{v['app']}', parent: r, dir: 'col', gap: 4, pad: 16, w: 240, radius: 12, fill: {v['surface']}, border: {v['line']}, align: sketch.StackLayout.AlignItems.Start }});
  text({{ parent: card, text: 'Monthly revenue', size: 13, weight: 5, color: {v['secondary']} }});
  text({{ parent: card, text: '$48,120', size: 24, weight: 6, color: {v['ink']} }});
  var ck = card.layers.slice(); ck.forEach(function (k, i) {{ k.index = ck.length - 1 - i; }}); card.stackLayout.apply(); made.push(String(card.id));
}})();""")
    js.append("r.stackLayout.apply(); var kids = r.layers.slice(); kids.forEach(function (k, i) { k.index = kids.length - 1 - i; }); r.stackLayout.apply(); sh.stackLayout.apply();")
    js.append("console.log(JSON.stringify({ ok: true, sheet: String(sh.id), made: made.length }));")
    return '\n'.join(js)

y = 0
for app in ['Light/Clean', 'Dark/Clean']:
    v = app_vars(app); tag = app.replace('/', '-').lower()
    for fn in [buttons, inputs, marks, nav]:
        open(f'{OUT}/c-{fn.__name__}-{tag}.js', 'w').write(fn(v, y)); y += 180
print('ok')
