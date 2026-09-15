#!/usr/bin/env python3
"""Emit run_code scripts for the Foundations sheet: one frame, one column stack per appearance of colour chips, plus a type ramp."""
import json
OUT='/tmp/harso-sketch'
sw=json.load(open(f'{OUT}/swatches.json'))
apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']

# s10: root frame with column stack
open(f'{OUT}/s10-foundations-frame.js','w').write("""const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var page = doc.pages.find(function (p) { return p.name === 'Foundations'; }) || doc.selectedPage;
var root = new sketch.Group.Frame({ name: 'Foundations / Tokens', parent: page, frame: { x: 0, y: 0, width: 1440, height: 200 },
  stackLayout: { direction: sketch.StackLayout.Direction.Column, gap: 32, padding: 48, alignItems: sketch.StackLayout.AlignItems.Start } });
root.horizontalSizing = sketch.FlexSizing.Fixed; root.frame.width = 1440;
var canvas = doc.swatches.find(function (s) { return s.name === 'Light/Clean/canvas'; });
root.style.fills = [{ fillType: sketch.Style.FillType.Color, color: canvas.referencingColor, enabled: true }];
var title = new sketch.Text({ name: 'Title', text: 'Harso Boundaryless — Foundations', parent: root });
title.sharedStyle = doc.sharedTextStyles.find(function (s) { return s.name === 'Type/heading 24'; });
title.style.textColor = doc.swatches.find(function (s) { return s.name === 'Light/Clean/ink'; }).referencingColor;
console.log(JSON.stringify({ ok: true, rootId: String(root.id) }));
""")

# s11..s14: one appearance row per script
for i, app in enumerate(apps):
    chips=[s for s in sw if s['name'].startswith(app+'/')]
    bg = next(s['color'] for s in chips if s['name'].endswith('/canvas'))
    ink = next(s['color'] for s in chips if s['name'].endswith('/ink'))
    sec = next(s['color'] for s in chips if s['name'].endswith('/secondary'))
    js=f"""const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var root = sketch.find('#' + ROOT_ID, doc)[0];
var section = new sketch.Group.Frame({{ name: '{app}', parent: root, stackLayout: {{ direction: sketch.StackLayout.Direction.Column, gap: 12, padding: 24, alignItems: sketch.StackLayout.AlignItems.Start }} }});
section.style.fills = [{{ fillType: sketch.Style.FillType.Color, color: '{bg}', enabled: true }}];
section.style.borders = [{{ color: '{next(s['color'] for s in chips if s['name'].endswith('/line'))}', thickness: 1, enabled: true }}];
var h = new sketch.Text({{ name: 'Heading', text: '{app}', parent: section }});
h.sharedStyle = doc.sharedTextStyles.find(function (s) {{ return s.name === 'Type/title 20'; }});
h.style.textColor = '{ink}';
var row = new sketch.Group.Frame({{ name: 'Chips', parent: section, stackLayout: {{ direction: sketch.StackLayout.Direction.Row, gap: 8, padding: 0, alignItems: sketch.StackLayout.AlignItems.Start }} }});
var chips = {json.dumps([{'n': c['name'].split('/')[-1], 'c': c['color']} for c in chips])};
chips.forEach(function (c) {{
  var cell = new sketch.Group.Frame({{ name: c.n, parent: row, stackLayout: {{ direction: sketch.StackLayout.Direction.Column, gap: 6, padding: 0, alignItems: sketch.StackLayout.AlignItems.Start }} }});
  var sq = new sketch.Shape({{ name: 'swatch', parent: cell, frame: {{ x: 0, y: 0, width: 56, height: 40 }} }});
  var swatch = doc.swatches.find(function (s) {{ return s.name === '{app}/' + c.n; }});
  sq.style.fills = [{{ fillType: sketch.Style.FillType.Color, color: swatch.referencingColor, enabled: true }}];
  sq.style.borders = [{{ color: '{ink}1f', thickness: 1, enabled: true }}];
  sq.points.forEach(function (p) {{ p.cornerRadius = 6; }});
  var t = new sketch.Text({{ name: 'name', text: c.n, parent: cell }});
  t.sharedStyle = doc.sharedTextStyles.find(function (s) {{ return s.name === 'Type/xs 12'; }});
  t.style.textColor = '{sec}';
}});
root.stackLayout.apply();
console.log(JSON.stringify({{ ok: true, sectionId: String(section.id), chips: chips.length }}));
"""
    open(f'{OUT}/s1{i+1}-app-{i}.js','w').write(js)

# s15: type ramp
ramp=[('xs 12','Twelve — labels, captions'),('sm 13','Thirteen — secondary, chips'),('base 14','Fourteen — body, controls'),('md 15','Fifteen — input, prose'),('user 16','Sixteen — user turns'),('title 20','Twenty — section titles'),('heading 24','Twenty-four — page headings'),('display 32','Thirty-two — display (opt-in)')]
open(f'{OUT}/s15-type.js','w').write(f"""const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var root = sketch.find('#' + ROOT_ID, doc)[0];
var section = new sketch.Group.Frame({{ name: 'Type scale', parent: root, stackLayout: {{ direction: sketch.StackLayout.Direction.Column, gap: 8, padding: 24, alignItems: sketch.StackLayout.AlignItems.Start }} }});
section.style.fills = [{{ fillType: sketch.Style.FillType.Color, color: '#ffffff', enabled: true }}];
section.style.borders = [{{ color: '#e6e8ec', thickness: 1, enabled: true }}];
var ramp = {json.dumps(ramp)};
ramp.forEach(function (r) {{
  var t = new sketch.Text({{ name: r[0], text: r[1], parent: section }});
  t.sharedStyle = doc.sharedTextStyles.find(function (s) {{ return s.name === 'Type/' + r[0]; }});
  t.style.textColor = '#1f2226';
}});
var mono = new sketch.Text({{ name: 'mono 13', text: 'mono 13 — npm install @harso/ui', parent: section }});
mono.sharedStyle = doc.sharedTextStyles.find(function (s) {{ return s.name === 'Type/mono 13'; }});
mono.style.textColor = '#1f2226';
root.stackLayout.apply();
console.log(JSON.stringify({{ ok: true, sectionId: String(section.id) }}));
""")
print('ok')
