#!/usr/bin/env python3
"""Parse theme.css into token sets per appearance and emit Sketch run_code scripts."""
import re, json, os
CSS = open('/Volumes/MainData/Developer/products/harso-ui/src/theme.css').read()
OUT = '/tmp/harso-sketch'

def block(selector):
    m = re.search(re.escape(selector) + r'\s*\{(.*?)\n\}', CSS, re.S)
    return dict(re.findall(r'--(hk-[a-z0-9-]+):\s*([^;]+);', m.group(1)))

base = block('.harso-kit')
cozy = block('.harso-kit[data-palette="cozy"]')
dark = block('.harso-kit[data-mode="dark"]')
darkcozy = block('.harso-kit[data-mode="dark"][data-palette="cozy"]')
appearances = {
    'Light/Clean': dict(base),
    'Light/Cozy': {**base, **cozy},
    'Dark/Clean': {**base, **dark},
    'Dark/Cozy': {**base, **dark, **darkcozy},
}
COLOR_KEYS = ['hk-canvas','hk-canvas-deep','hk-panel','hk-surface','hk-hover','hk-ink','hk-secondary','hk-tertiary','hk-faint','hk-line','hk-line-strong','hk-accent','hk-accent-mark','hk-accent-soft','hk-positive','hk-positive-mark','hk-attention','hk-attention-mark','hk-negative','hk-negative-mark','hk-inverse']

def hexof(v, tokens):
    v = v.strip()
    if v.startswith('#'): return v
    m = re.match(r'var\(--(hk-[a-z-]+)\)', v)
    if m: return hexof(tokens[m.group(1)], tokens)
    raise ValueError(v)

swatches = []
for app, tokens in appearances.items():
    for k in COLOR_KEYS:
        swatches.append({'name': f"{app}/{k[3:]}", 'color': hexof(tokens[k], tokens)})
    # control-line: ink at 32% (light) / 40% (dark) — Sketch swatch supports alpha via 8-digit hex
    ink = hexof(tokens['hk-ink'], tokens); alpha = 0x52 if app.startswith('Light') else 0x66
    swatches.append({'name': f"{app}/control-line", 'color': ink + f"{alpha:02x}"})
json.dump(swatches, open(f'{OUT}/swatches.json','w'), indent=1)

type_scale = [('xs',12),('sm',13),('base',14),('md',15),('user',16),('title',20),('heading',24),('display',32)]
spacing = {k[3:]: v for k, v in base.items() if k.startswith('hk-space')}
print(len(swatches), 'swatches;', len(type_scale), 'type sizes;', spacing)

# Script: swatches (one logical action)
js = ["const sketch = require('sketch');", "var doc = sketch.getSelectedDocument();", "var made = 0;"]
js.append("var want = " + json.dumps(swatches) + ";")
js.append("want.forEach(function (w) { var ex = doc.swatches.find(function (s) { return s.name === w.name; }); if (ex) { ex.color = w.color; } else { doc.swatches.push({ name: w.name, color: w.color }); made += 1; } });")
js.append("console.log(JSON.stringify({ ok: true, made: made, total: doc.swatches.length }));")
open(f'{OUT}/s02-swatches.js','w').write('\n'.join(js))

# Script: text styles — Light/Clean ink + secondary, per size; font: system (Inter fallback)
styles = []
for name, size in type_scale:
    weight = 500 if size >= 20 else 400
    styles.append({'name': f"Type/{name} {size}", 'fontSize': size, 'lineHeight': round(size * (1.3 if size >= 20 else 1.5)), 'fontFamily': 'Inter', 'fontWeight': weight})
styles.append({'name': "Type/label 13 medium", 'fontSize': 13, 'lineHeight': 20, 'fontFamily': 'Inter', 'fontWeight': 500})
styles.append({'name': "Type/base 14 medium", 'fontSize': 14, 'lineHeight': 20, 'fontFamily': 'Inter', 'fontWeight': 500})
styles.append({'name': "Type/mono 13", 'fontSize': 13, 'lineHeight': 20, 'fontFamily': 'JetBrains Mono', 'fontWeight': 400})
js = ["const sketch = require('sketch');", "var doc = sketch.getSelectedDocument();", "var made = 0;",
      "var ink = doc.swatches.find(function (s) { return s.name === 'Light/Clean/ink'; });",
      "var want = " + json.dumps(styles) + ";",
      "want.forEach(function (w) { var ex = doc.sharedTextStyles.find(function (s) { return s.name === w.name; }); if (ex) return; doc.sharedTextStyles.push({ name: w.name, style: { fontFamily: w.fontFamily, fontSize: w.fontSize, fontWeight: w.fontWeight, lineHeight: w.lineHeight, textColor: ink ? ink.referencingColor : '#1f2226' } }); made += 1; });",
      "console.log(JSON.stringify({ ok: true, made: made, total: doc.sharedTextStyles.length }));"]
open(f'{OUT}/s03-textstyles.js','w').write('\n'.join(js))
json.dump({'appearances': appearances, 'type_scale': type_scale, 'spacing': spacing}, open(f'{OUT}/tokens.json','w'), indent=1)
print('scripts written')
