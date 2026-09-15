// Harso Sketch prelude — auto-prepended to every run_code by sk.py (unless the script contains "// NO_PRELUDE").
// Provides H.* helpers so lane scripts stay short and consistent. All colours come from document swatches.
const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var H = {};
H.doc = doc;
H.page = function (name) { if (name && typeof name === 'object' && name.type === 'Page') return name; return doc.pages.find(function (p) { return p.name === name; }) || new sketch.Page({ name: name, parent: doc }); };
H.sw = function (app, role) { var s = doc.swatches.find(function (x) { return x.name === app + '/' + role; }); if (!s) throw new Error('no swatch ' + app + '/' + role); return s.referencingColor; };
H.hex = function (app, role) { var s = doc.swatches.find(function (x) { return x.name === app + '/' + role; }); if (!s) throw new Error('no swatch ' + app + '/' + role); return String(s.color).slice(0, 7); };
H.alpha = function (hex7, a) { return hex7.slice(0, 7) + ('0' + Math.round(a * 255).toString(16)).slice(-2); };
// frame: stack container. o = {name,parent,dir:'row'|'col',gap,pad(number|{top,right,bottom,left}),align,justify,fill,border,radius,w,h,wraps,shadow}
H.frame = function (o) {
  var f = new sketch.Group.Frame({ name: o.name, parent: o.parent, stackLayout: {
    direction: o.dir === 'col' ? sketch.StackLayout.Direction.Column : sketch.StackLayout.Direction.Row,
    gap: o.gap || 0, padding: o.pad === undefined ? 0 : o.pad,
    alignItems: o.align || sketch.StackLayout.AlignItems.Center,
    justifyContent: o.justify || sketch.StackLayout.JustifyContent.Start } });
  f.style.fills = []; if (f.background) f.background.enabled = false;
  if (o.fill) f.style.fills = [{ fillType: sketch.Style.FillType.Color, color: o.fill, enabled: true }];
  if (o.border) f.style.borders = [{ color: o.border, thickness: o.bw || 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  if (o.radius !== undefined) f.style.corners.radii = [o.radius, o.radius, o.radius, o.radius];
  if (o.shadow) f.style.shadows = [o.shadow];
  if (o.w) { f.horizontalSizing = sketch.FlexSizing.Fixed; f.frame.width = o.w; }
  if (o.h) { f.verticalSizing = sketch.FlexSizing.Fixed; f.frame.height = o.h; }
  if (o.wraps) { f.stackLayout.wraps = true; f.stackLayout.crossAxisGap = o.crossGap || o.gap || 0; }
  if (o.clip) f.clipsContent = true;
  return f;
};
// text: o = {parent,text,size,weight(1..12; 5 regular, 6 medium, 7 semibold),color,w,mono,name,align}
H.text = function (o) {
  var t = new sketch.Text({ name: o.name || 'label', text: o.text, parent: o.parent });
  t.style.fontFamily = o.mono ? 'JetBrains Mono' : 'Inter'; t.style.fontSize = o.size || 14; t.style.fontWeight = o.weight || 5; t.style.textColor = o.color;
  if (o.align) t.style.alignment = o.align;
  if (o.w) { t.frame.width = o.w; t.fixedWidth = true; }
  return t;
};
// rect/oval shape: o = {parent,name,w,h,fill,border,bw,radius,oval}
H.rect = function (o) {
  var r = new sketch.ShapePath({ name: o.name || 'shape', parent: o.parent, shapeType: o.oval ? sketch.ShapePath.ShapeType.Oval : sketch.ShapePath.ShapeType.Rectangle, frame: { x: o.x || 0, y: o.y || 0, width: o.w, height: o.h } });
  r.style.fills = o.fill ? [{ fillType: sketch.Style.FillType.Color, color: o.fill, enabled: true }] : [];
  r.style.borders = o.border ? [{ color: o.border, thickness: o.bw || 1, enabled: true, position: sketch.Style.BorderPosition.Inside }] : [];
  if (o.radius !== undefined) r.style.corners.radii = [o.radius, o.radius, o.radius, o.radius];
  return r;
};
// svg glyph (16px default) — pass path data; stroke-only icons in the Lucide style the kit uses.
H.icon = function (o) {
  var sz = o.size || 16; var col = o.color || '#000000';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="' + col + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + o.d + '</svg>';
  var l = sketch.createLayerFromData(svg, 'svg'); l.name = o.name || 'icon'; l.parent = o.parent; l.frame.width = sz; l.frame.height = sz; return l;
};
// Sketch stacks render index 0 LAST — call after building children in reading order.
H.order = function (frame) { var kids = frame.layers.slice(); kids.forEach(function (k, i) { k.index = kids.length - 1 - i; }); if (frame.stackLayout) frame.stackLayout.apply(); return frame; };
// Recursively apply stack layouts bottom-up.
H.relayout = function (frame) { (frame.layers || []).forEach(function (k) { if (k.layers) H.relayout(k); }); if (frame.stackLayout) frame.stackLayout.apply(); };
// A sheet: column of rows on a page canvas, fixed y. Returns frame.
H.sheet = function (o) { var s = H.frame({ name: o.name, parent: o.parent, dir: 'col', gap: 24, pad: 32, align: sketch.StackLayout.AlignItems.Start, fill: o.fill }); s.frame.x = o.x || 0; s.frame.y = o.y || 0; return s; };
// A specimen row inside a sheet: tinted canvas card with the appearance's colours.
H.row = function (parent, name, app, o) { o = o || {}; return H.frame({ name: name, parent: parent, dir: o.dir || 'row', gap: o.gap || 16, pad: o.pad || 24, fill: H.sw(app, 'canvas'), border: H.sw(app, 'line'), radius: 12, align: o.align || sketch.StackLayout.AlignItems.Center, w: o.w, wraps: o.wraps }); };
// Promote every named frame matching rx under root to a Symbol master (in place).
H.symbolize = function (root, rx) { var made = []; sketch.find('Group', root).forEach(function (l) { if (rx.test(l.name) && l.type === 'Group') { try { sketch.SymbolMaster.fromFrame(l); made.push(l.name); } catch (e) { made.push('ERR ' + l.name + ' ' + String(e).slice(0, 80)); } } }); return made; };
H.out = function (o) { console.log(JSON.stringify(o)); };
// Lucide path fragments used across lanes
H.paths = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', chevronDown: '<path d="m6 9 6 6 6-6"/>', chevronRight: '<path d="m9 18 6-6-6-6"/>', chevronUp: '<path d="m18 15-6-6-6 6"/>',
  chevronsUpDown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>', search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>', copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>', circleX: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>', folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>', code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>', sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>', send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>', play: '<polygon points="6 3 20 12 6 21 6 3"/>', pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>', thumbsUp: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>', arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>', image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>', filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>', bolt: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>', lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  square: '<rect width="18" height="18" x="3" y="3" rx="2"/>', circle: '<circle cx="12" cy="12" r="10"/>', star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  gitCommit: '<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>', box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>', panelLeft: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>', maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  volume: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>', headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>', loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>', quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>', shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'
};
// Remove an existing sheet (and the symbol masters inside it) so a family can be rebuilt without name collisions.
H.dropSheet = function (pageName, sheetName) { var p = H.page(pageName); var removed = 0; p.layers.slice().forEach(function (l) { if (l.name === sheetName) { sketch.find('SymbolMaster', l).forEach(function (m) { m.remove(); }); l.remove(); removed += 1; } }); return removed; };
// Prototype helpers (appended to the kit prelude for the screen lanes).
// Naming: screens are Frames `Screen/<platform>/<App>/<id>`; anything clickable is named `link:<id>` (or `link:back`).
// The lead wires flows after all lanes finish: link:<id> → Screen/<platform>/<App>/<id> on the same platform/appearance.
H.screen = function (o) { var page = H.page(o.page); var f = H.frame({ name: 'Screen/' + o.platform + '/' + o.app + '/' + o.id, parent: page, dir: 'row', gap: 0, pad: 0, w: o.w, h: o.h, fill: H.sw(o.app, 'canvas'), align: sketch.StackLayout.AlignItems.Start, clip: true }); f.frame.x = o.x || 0; f.frame.y = o.y || 0; return f; };
H.link = function (layer, id) { layer.name = 'link:' + id; return layer; };
// Instantiate a kit symbol by exact master name (from the Controls/Display/... pages).
H.inst = function (name, parent) { var m = doc.getSymbols().find(function (s) { return s.name === name; }); if (!m) throw new Error('no symbol ' + name); var i = m.createNewInstance(); i.parent = parent; return i; };
H.hasSymbol = function (name) { return !!doc.getSymbols().find(function (s) { return s.name === name; }); };

// ---- macOS app chrome: 240px sidebar identical on every desktop screen (matches the shipped Weave desktop shell).
H.macSidebar = function (screen, app, active, o) {
  o = o || {};
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 4, pad: 16, w: 240, h: screen.frame.height, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start });
  sb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var brand = H.frame({ name: 'brand', parent: sb, dir: 'row', gap: 8, pad: { top: 4, right: 0, bottom: 12, left: 0 }, h: 40 });
  H.icon({ parent: brand, d: H.paths.sparkles, size: 20, color: H.hex(app, 'accent') }); H.text({ parent: brand, text: 'Weave', size: 16, weight: 7, color: H.sw(app, 'ink') }); H.order(brand);
  var actions = H.frame({ name: 'actions', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 0, bottom: 12, left: 0 }, w: 208 });
  var nb = H.frame({ name: 'link:new-conversation', parent: actions, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 12 }, w: 160, h: 36, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line-strong') });
  H.icon({ parent: nb, d: H.paths.plus, size: 14, color: H.hex(app, 'ink') }); H.text({ parent: nb, text: 'New conversation', size: 13, weight: 5, color: H.sw(app, 'ink') }); H.order(nb);
  var sbtn = H.frame({ name: 'link:search', parent: actions, dir: 'row', pad: 0, w: 36, h: 36, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line-strong'), justify: sketch.StackLayout.JustifyContent.Center });
  H.icon({ parent: sbtn, d: H.paths.search, size: 16, color: H.hex(app, 'ink') }); sbtn.stackLayout.apply(); H.order(actions);
  [['activity', 'Activity', 'bell', '1'], ['artifacts', 'Artifacts', 'layers', null], ['routines', 'Routines', 'clock', null], ['customize', 'Customize', 'settings', null], ['projects', 'Projects', 'folder', null]].forEach(function (it) {
    var sel = it[0] === active;
    var row = H.frame({ name: 'link:' + it[0], parent: sb, dir: 'row', gap: 10, pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 32, radius: 8, fill: sel ? H.sw(app, 'hover') : null });
    H.icon({ parent: row, d: H.paths[it[2]], size: 16, color: H.hex(app, sel ? 'ink' : 'secondary') }); H.text({ parent: row, text: it[1], size: 13, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary') });
    if (it[3]) { var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: row, text: it[3], size: 11, weight: 7, color: H.sw(app, 'accent') }); }
    H.order(row);
  });
  function section(label) { var h = H.frame({ name: 'section', parent: sb, dir: 'row', pad: { top: 16, right: 10, bottom: 4, left: 10 }, w: 208 }); H.text({ parent: h, text: label, size: 11, weight: 6, color: H.sw(app, 'tertiary') }); h.stackLayout.apply(); }
  section('PINNED PROJECTS');
  var pr = H.frame({ name: 'link:project', parent: sb, dir: 'row', pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 34, radius: 8, fill: active === 'project' ? H.sw(app, 'hover') : null }); H.text({ parent: pr, text: 'Personal', size: 13, weight: 5, color: H.sw(app, 'ink') }); pr.stackLayout.apply();
  section('RECENT');
  var rc = H.frame({ name: 'link:conversation', parent: sb, dir: 'row', pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 208, h: 34, radius: 8, fill: active === 'conversation' ? H.sw(app, 'hover') : null }); H.text({ parent: rc, text: 'Move the billing webhook handler…', size: 13, weight: 5, color: H.sw(app, 'ink'), w: 188 }); rc.stackLayout.apply();
  var fill = H.frame({ name: 'fill', parent: sb, pad: 0, w: 208 }); fill.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: { top: 8, right: 4, bottom: 0, left: 4 }, w: 208, h: 48 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 32, h: 32, radius: 16, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.text({ parent: av, text: 'FO', size: 11, weight: 7, color: '#ffffff' }); av.stackLayout.apply();
  var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.text({ parent: info, text: 'founder@example.com', size: 12, weight: 6, color: H.sw(app, 'ink') }); H.text({ parent: info, text: 'Setup incomplete', size: 11, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info);
  var sp2 = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); sp2.horizontalSizing = sketch.FlexSizing.Fill;
  H.icon({ parent: foot, d: H.paths.settings, size: 16, color: H.hex(app, 'secondary') }); H.order(foot);
  H.order(sb); return sb;
};
// Main column to the right of the sidebar (1200 wide on a 1440 screen). Returns the content frame (col stack, hug).
H.macMain = function (screen, app, o) { o = o || {}; var m = H.frame({ name: 'main', parent: screen, dir: 'col', gap: o.gap === undefined ? 24 : o.gap, pad: o.pad === undefined ? 32 : o.pad, w: screen.frame.width - 240, h: screen.frame.height, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); return m; };

// ---- iOS chrome: status bar (54) + optional nav bar (44) at top; floating TabBar (from the kit) + home indicator (34) at bottom.
H.iosStatusBar = function (parent, app) { var s = H.frame({ name: 'status-bar', parent: parent, dir: 'row', pad: { top: 14, right: 28, bottom: 0, left: 28 }, w: 390, h: 54 }); H.text({ parent: s, text: '9:41', size: 15, weight: 7, color: H.sw(app, 'ink') }); var sp = H.frame({ name: 'spacer', parent: s, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: s, text: '●●●  ▲  ▮', size: 12, weight: 6, color: H.sw(app, 'ink') }); H.order(s); return s; };
H.iosNavBar = function (parent, app, title, o) { o = o || {}; var n = H.frame({ name: 'nav-bar', parent: parent, dir: 'row', gap: 0, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 390, h: 44 });
  var lead = H.frame({ name: 'leading', parent: n, dir: 'row', gap: 4, pad: 0, w: 90, h: 44, justify: sketch.StackLayout.JustifyContent.Start });
  if (o.back) { var b = H.frame({ name: 'link:back', parent: lead, dir: 'row', gap: 2, pad: 0, h: 36 }); var ch = H.icon({ parent: b, d: '<path d="m15 18-6-6 6-6"/>', size: 20, color: H.hex(app, 'accent') }); H.text({ parent: b, text: o.back === true ? 'Back' : o.back, size: 15, weight: 5, color: H.sw(app, 'accent') }); H.order(b); }
  lead.stackLayout.apply();
  var t = H.text({ parent: n, text: title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 178 });
  var trail = H.frame({ name: 'trailing', parent: n, dir: 'row', pad: 0, w: 90, h: 44, justify: sketch.StackLayout.JustifyContent.End });
  if (o.trailing) { var tb = H.frame({ name: 'link:' + (o.trailingLink || o.trailing), parent: trail, pad: 0, w: 36, h: 36, radius: 18, justify: sketch.StackLayout.JustifyContent.Center }); H.icon({ parent: tb, d: H.paths[o.trailing], size: 20, color: H.hex(app, 'accent') }); tb.stackLayout.apply(); }
  trail.stackLayout.apply(); H.order(n); return n; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 16, bottom: 34, left: 16 }, w: 390, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 358, h: 64, radius: 32, fill: H.sw(app, 'surface'), border: H.sw(app, 'line'), shadow: { color: '#0000001f', blur: 24, spread: 0, x: 0, y: 8 } });
  [['home', 'Home', 'home'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'settings']].forEach(function (t) {
    var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 4, pad: 0, w: 70, h: 56, radius: 28, fill: sel ? H.sw(app, 'accent-soft') : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center });
    H.icon({ parent: tab, d: H.paths[t[2]], size: 20, color: H.hex(app, sel ? 'accent' : 'secondary') }); H.text({ parent: tab, text: t[1], size: 11, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.order(tab);
  });
  H.order(bar); wrap.stackLayout.apply(); return wrap;
};
H.iosScreen = function (o) { var s = H.screen({ page: o.page, platform: 'ios', app: o.app, id: o.id, w: 390, h: 844, x: o.x, y: o.y }); s.stackLayout.direction = sketch.StackLayout.Direction.Column;
  var top = H.frame({ name: 'top', parent: s, dir: 'col', pad: 0, w: 390 }); H.iosStatusBar(top, o.app); if (o.title !== undefined) H.iosNavBar(top, o.app, o.title, o); H.order(top);
  var body = H.frame({ name: 'body', parent: s, dir: 'col', gap: o.gap === undefined ? 16 : o.gap, pad: o.pad === undefined ? 16 : o.pad, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  var tab = null; if (o.tab !== false) tab = H.iosTabBar(s, o.app, o.tab || 'home'); else { var hi = H.frame({ name: 'home-indicator', parent: s, dir: 'row', pad: 0, w: 390, h: 34, justify: sketch.StackLayout.JustifyContent.Center }); var bar = H.rect({ parent: hi, name: 'indicator', w: 134, h: 5, radius: 3, fill: H.sw(o.app, 'ink') }); hi.stackLayout.apply(); }
  // Call finish() after filling body: fixes stack order (index 0 renders last) and relayouts.
  return { screen: s, body: body, finish: function () { body.stackLayout.apply(); H.order(s); return s; } }; };
// SF Symbols verified by rendering in SF Pro and reading back with vision (two glyph sheets on the Apple reference page).
// Use with H.sf(parent, 'name', {size, weight, color}) — renders a real SF Pro glyph, the same technique Apple's own kits use.
H.SF = {
  magnifyingglass: 0x1002AB, xmark: 0x100184, chevron_down: 0x100188, chevron_right: 0x10018A, chevron_left: 0x100189, chevron_up: 0x100187,
  folder: 0x100215, arrow_up: 0x100128, line3: 0x100307, plus: 0x10017C, minus: 0x10017D, gear: 0x10035F, ellipsis: 0x100360, bell: 0x1002D9,
  calendar: 0x100249, clock: 0x10042B, doc_on_doc: 0x100241, trash: 0x100211, square_pencil: 0x10020E, plus_square_on_square: 0x100244,
  mic: 0x1002B1, play: 0x100284, checkmark: 0x100185, sparkles: 0x1001BF, person: 0x100269, house: 0x10039E, exclamation_triangle: 0x1001FE,
  info_circle: 0x100174, heart: 0x1002B5, wifi: 0x100647, star: 0x1002C2, questionmark_circle: 0x10005C, xmark_circle: 0x10017E,
  pencil: 0x10020A, doc: 0x100237, bolt: 0x1002E8, hourglass: 0x100281, list_number: 0x10029A, paperplane: 0x100180,
  square_and_arrow_up: 0x100202, hand_thumbsup: 0x100280, arrow_counterclockwise: 0x100148, lock: 0x1003A0, envelope: 0x100355, link: 0x100263,
  speaker: 0x1002A0, pause: 0x100286, backward: 0x100289, list_bullet: 0x1002F2, scope: 0x100377, arrow_left: 0x10012A, arrow_clockwise: 0x100149,
  chevron_left_right: 0x10065A, checklist_shield: 0x1002FA, arrow_right_circle: 0x100253, arrowshape_turn_left: 0x100254, book: 0x10025A,
  bubble: 0x100327, wand: 0x100372, command: 0x100194, mic_slash: 0x1002B3, tray: 0x100223, tray_circle: 0x100230, checkmark_seal: 0x1001FB,
  cube: 0x100418, arrow_uturn: 0x100585, textcursor: 0x10016B,
  terminal: 0x100a7c, sidebar_left: 0x1003de, sidebar_right: 0x1003df, rectangle_split: 0x1003e0, square_grid_2x2: 0x1001f7, keyboard: 0x1001f3, rectangle_3_group: 0x1001f4, tablecells: 0x1003e2, person_crop_square: 0x1003cf, checkmark_square: 0x1003cb, xmark_square: 0x1003cd, rectangle_badge_plus: 0x1003d1, command_circle: 0x100a7f, paperplane_fill: 0x100a86, progress_indicator: 0x1001f1, rectangle_stack: 0x1003ed, chart_bar: 0x10043e, chart_pie: 0x100440, chart_line: 0x100441, play_fill: 0x100284, hand_thumbsdown: 0x100281, gearshape_2: 0x100b2d, megaphone: 0x100b32, list_bullet_indent: 0x100a22, signature: 0x100439, photo_on_rectangle: 0x1003eb, rectangle_on_rectangle: 0x1003e7, tag: 0x1002e4, bolt_fill: 0x1002e6, slider_horizontal_3: 0x100306, line3_circle: 0x100308, checkmark_circle: 0x100062, checkmark_circle_fill: 0x100063, sun: 0x1001ae, arrow_down: 0x100129, arrow_right: 0x10012b, arrow_up_arrow_down: 0x10012c, arrow_left_arrow_right: 0x10012d, paperclip: 0x100262, bookmark: 0x10025f, moon_stars: 0x1001c0, cloud: 0x1001c2, delete_backward: 0x100198, info_circle_fill: 0x100175, at: 0x100177, display: 0x1003b2, text_align_left: 0x100300
};
H.sf = function (parent, name, o) { o = o || {}; var cp = H.SF[name]; if (!cp) throw new Error('no SF ' + name); var t = new sketch.Text({ name: o.name || ('sf:' + name), text: String.fromCodePoint(cp), parent: parent }); t.style.fontFamily = 'SF Pro'; t.style.fontSize = o.size || 15; t.style.fontWeight = o.weight || 6; t.style.textColor = o.color; t.style.alignment = sketch.Text.Alignment.center; if (o.w) { t.frame.width = o.w; t.fixedWidth = true; } return t; };
// Native chrome v2 — measured from Apple's macOS 27 / iOS 27 kits (see HIG-SPEC.md). Boundaryless tokens for colour,
// SF Pro + real SF Symbols for chrome. Replaces H.macSidebar/H.macMain/H.iosNavBar/H.iosTabBar/H.iosScreen.
// Chrome text helper: SF Pro at HIG sizes.
H.sft = function (o) { var t = H.text(o); t.style.fontFamily = 'SF Pro'; return t; };
H.sfBtn = function (parent, name, glyph, app, o) { o = o || {}; var b = H.frame({ name: name, parent: parent, pad: 0, w: o.w || 36, h: o.h || 36, radius: o.radius === undefined ? 8 : o.radius, fill: o.fill || null, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(b, glyph, { size: o.size || 15, weight: o.weight || 7, color: o.color || H.sw(app, 'secondary') }); b.stackLayout.apply(); return b; };

// ---------------- macOS 27 window: 256 source list (vibrancy) + 52px unified toolbar over the content column + optional 320 inspector.
// Returns { window, sidebar, main(content col below toolbar), toolbar, inspector }.
H.macWindow = function (screen, app, o) {
  o = o || {}; var W = screen.frame.width, Hh = screen.frame.height; var dark = app.indexOf('Dark') === 0;
  // ---- Source list
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 0, pad: 0, w: 256, h: Hh, fill: H.alpha(H.hex(app, 'panel'), 0.92), align: sketch.StackLayout.AlignItems.Start, clip: true });
  sb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var tl = H.frame({ name: 'titlebar', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 20 }, w: 256, h: 52 });
  [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function (c, i) { var d = H.rect({ parent: tl, name: 'traffic-' + i, w: 12, h: 12, oval: true, fill: c[0], border: c[1] }); });
  var spT = H.frame({ name: 'spacer', parent: tl, pad: 0, h: 1 }); spT.horizontalSizing = sketch.FlexSizing.Fill;
  H.sfBtn(tl, 'toggle-sidebar', 'sidebar_left', app, { size: 15 }); H.order(tl);
  var list = H.frame({ name: 'list', parent: sb, dir: 'col', gap: 2, pad: { top: 4, right: 14, bottom: 8, left: 14 }, w: 256, align: sketch.StackLayout.AlignItems.Start });
  function row(id, glyph, label, opt) { opt = opt || {}; var sel = opt.sel; var r = H.frame({ name: 'link:' + id, parent: list, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 8 + (opt.indent || 0) }, w: 228, h: 32, radius: 6, fill: sel ? H.alpha(H.hex(app, 'ink'), dark ? 0.16 : 0.09) : null });
    if (opt.disclosure) H.sf(r, opt.open ? 'chevron_down' : 'chevron_right', { size: 10, weight: 8, color: H.sw(app, 'tertiary'), w: 12 });
    if (glyph) H.sf(r, glyph, { size: 15, weight: 6, color: opt.tint ? H.hex(app, 'accent') : H.sw(app, sel ? 'ink' : 'secondary'), w: 20 });
    H.sft({ parent: r, text: label, size: 13, weight: sel ? 7 : 5, color: H.sw(app, 'ink'), w: opt.count ? 140 : 180 });
    if (opt.count) { var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.sft({ parent: r, text: String(opt.count), size: 12, weight: 5, color: H.sw(app, 'tertiary') }); }
    H.order(r); return r; }
  function header(label) { var h = H.frame({ name: 'section', parent: list, dir: 'row', pad: { top: 14, right: 8, bottom: 4, left: 8 }, w: 228, h: 36 }); H.sft({ parent: h, text: label, size: 11, weight: 8, color: H.sw(app, 'tertiary') }); h.stackLayout.apply(); }
  var active = o.active;
  row('new-conversation', 'square_pencil', 'New conversation', { tint: true, sel: active === 'new-conversation' });
  row('search', 'magnifyingglass', 'Search', { sel: active === 'search' });
  header('Weave');
  row('activity', 'bell', 'Activity', { sel: active === 'activity', count: o.activityCount === undefined ? 3 : o.activityCount });
  row('artifacts', 'doc_on_doc', 'Artifacts', { sel: active === 'artifacts' });
  row('routines', 'clock', 'Routines', { sel: active === 'routines' });
  row('customize', 'wand', 'Customize', { sel: active === 'customize' });
  header('Projects');
  row('projects', 'folder', 'All projects', { sel: active === 'projects', disclosure: true, open: true });
  row('project', 'folder', 'Personal', { sel: active === 'project', indent: 12 });
  row('project', 'folder', 'Weave Cloud', { indent: 12 });
  header('Recent');
  (o.recent || [['conversation', 'Move the billing webhook handler'], ['conversation', 'Draft the Q3 investor update'], ['conversation', 'Why is the Mac build 40 MB bigger']]).forEach(function (rc, i) { row(rc[0], 'bubble', rc[1], { sel: active === 'conversation' && i === 0 }); });
  H.order(list);
  var fillS = H.frame({ name: 'fill', parent: sb, pad: 0, w: 256 }); fillS.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: { top: 8, right: 14, bottom: 12, left: 14 }, w: 256, h: 56 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 28, h: 28, radius: 14, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: av, text: 'AB', size: 11, weight: 8, color: '#ffffff' }); av.stackLayout.apply();
  var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 1, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: info, text: 'Abhi Bansal', size: 13, weight: 7, color: H.sw(app, 'ink') }); H.sft({ parent: info, text: 'Pro · Straits Lab', size: 11, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info);
  var sp2 = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); sp2.horizontalSizing = sketch.FlexSizing.Fill;
  H.sf(foot, 'gear', { size: 15, weight: 6, color: H.sw(app, 'tertiary') }); H.order(foot);
  H.order(sb);
  // ---- Content column
  var contentW = W - 256 - (o.inspector ? 320 : 0);
  var col = H.frame({ name: 'content-col', parent: screen, dir: 'col', gap: 0, pad: 0, w: contentW, h: Hh, fill: H.sw(app, 'canvas'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tb = H.frame({ name: 'toolbar', parent: col, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 8 }, w: contentW, h: 52, fill: H.alpha(H.hex(app, 'canvas'), 0.9) });
  tb.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var nav = H.frame({ name: 'nav', parent: tb, dir: 'row', gap: 0, pad: 0, w: 73, h: 36, radius: 8, fill: H.alpha(H.hex(app, 'ink'), 0.06) });
  H.sfBtn(nav, 'link:back', 'chevron_left', app, { w: 36, h: 36, size: 14, weight: 8, color: H.sw(app, 'ink') }); H.rect({ parent: nav, name: 'sep', w: 1, h: 20, fill: H.sw(app, 'line-strong') }); H.sfBtn(nav, 'forward', 'chevron_right', app, { w: 36, h: 36, size: 14, weight: 8, color: H.sw(app, 'tertiary') }); H.order(nav);
  var titleWrap = H.frame({ name: 'title', parent: tb, dir: 'col', gap: 1, pad: { top: 0, right: 0, bottom: 0, left: 8 }, align: sketch.StackLayout.AlignItems.Start });
  if (o.title) H.sft({ parent: titleWrap, text: o.title, size: 15, weight: 8, color: H.sw(app, 'ink') }); if (o.subtitle) H.sft({ parent: titleWrap, text: o.subtitle, size: 12, weight: 5, color: H.sw(app, 'tertiary') }); H.order(titleWrap);
  var spTb = H.frame({ name: 'spacer', parent: tb, pad: 0, h: 1 }); spTb.horizontalSizing = sketch.FlexSizing.Fill;
  (o.tools || []).forEach(function (t) { // [name, glyph, label?, primary?]
    if (t[2]) { var b = H.frame({ name: t[0], parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 12, bottom: 0, left: 10 }, h: 30, radius: 7, fill: t[3] ? H.sw(app, 'accent') : H.sw(app, 'surface'), border: t[3] ? null : H.sw(app, 'line-strong') }); H.sf(b, t[1], { size: 13, weight: 7, color: t[3] ? '#ffffff' : H.sw(app, 'ink') }); H.sft({ parent: b, text: t[2], size: 13, weight: 7, color: t[3] ? '#ffffff' : H.sw(app, 'ink') }); H.order(b); }
    else H.sfBtn(tb, t[0], t[1], app, { size: 15, weight: 7, color: H.sw(app, 'ink') }); });
  if (o.search !== false) { var sf = H.frame({ name: 'link:search', parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 10, bottom: 0, left: 10 }, w: 180, h: 30, radius: 8, fill: H.sw(app, 'surface'), border: H.sw(app, 'line') }); H.sf(sf, 'magnifyingglass', { size: 13, weight: 7, color: H.sw(app, 'tertiary') }); H.sft({ parent: sf, text: 'Search', size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(sf); }
  if (o.inspectorToggle) H.sfBtn(tb, 'link:' + o.inspectorToggle, 'sidebar_right', app, { size: 15, weight: 7, color: H.sw(app, 'ink') });
  H.order(tb);
  var main = H.frame({ name: 'main', parent: col, dir: 'col', gap: o.gap === undefined ? 20 : o.gap, pad: o.pad === undefined ? 28 : o.pad, w: contentW, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); main.verticalSizing = sketch.FlexSizing.Fill;
  H.order(col);
  var insp = null;
  if (o.inspector) { insp = H.frame({ name: 'inspector', parent: screen, dir: 'col', gap: 0, pad: 0, w: 320, h: Hh, fill: H.alpha(H.hex(app, 'panel'), 0.92), align: sketch.StackLayout.AlignItems.Start, clip: true }); insp.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
    var ih = H.frame({ name: 'inspector-header', parent: insp, dir: 'row', gap: 8, pad: { top: 0, right: 8, bottom: 0, left: 16 }, w: 320, h: 52 }); H.sft({ parent: ih, text: o.inspector === true ? 'Inspector' : o.inspector, size: 13, weight: 8, color: H.sw(app, 'ink') }); var spI = H.frame({ name: 'spacer', parent: ih, pad: 0, h: 1 }); spI.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(ih, 'link:' + (o.inspectorClose || 'back'), 'sidebar_right', app, { size: 15, weight: 7, color: H.sw(app, 'ink') }); H.order(ih); }
  H.order(screen);
  return { window: screen, sidebar: sb, main: main, toolbar: tb, inspector: insp, finish: function () { H.order(main); if (insp) H.order(insp); col.stackLayout.apply(); screen.stackLayout.apply(); return screen; } };
};
// macOS alert (260×170 measured) and sheet chrome; overlay scrim is BLACK at 40% (light) / 60% (dark).
H.macScrim = function (screen, app) { screen.stackLayout = null; var s = H.rect({ parent: screen, name: 'scrim', w: screen.frame.width, h: screen.frame.height, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' }); s.moveToFront(); return s; };
H.macAlert = function (screen, app, o) { screen.stackLayout = null; var W = screen.frame.width, Hh = screen.frame.height; var a = H.frame({ name: 'alert', parent: screen, dir: 'col', gap: 0, pad: { top: 20, right: 22, bottom: 20, left: 22 }, w: o.w || 300, radius: 12, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Center, shadow: { color: '#00000040', blur: 40, spread: 0, x: 0, y: 16 } }); a.style.borders = [{ color: H.sw(app, 'line'), thickness: 1, enabled: true, position: sketch.Style.BorderPosition.Inside }];
  var ic = H.frame({ name: 'icon', parent: a, pad: 0, w: 64, h: 64, radius: 16, fill: H.alpha(H.hex(app, (o.tone === 'danger' || o.tone === 'negative') ? 'negative' : 'accent'), 0.14), justify: sketch.StackLayout.JustifyContent.Center }); H.sf(ic, o.glyph || 'sparkles', { size: 30, weight: 7, color: H.hex(app, (o.tone === 'danger' || o.tone === 'negative') ? 'negative' : 'accent') }); ic.stackLayout.apply();
  var gap1 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 14 });
  H.sft({ parent: a, text: o.title, size: 13, weight: 8, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: (o.w || 300) - 44 });
  var gap2 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 6 });
  H.sft({ parent: a, text: o.body, size: 11, weight: 5, color: H.sw(app, 'secondary'), align: sketch.Text.Alignment.center, w: (o.w || 300) - 44 });
  if (o.extra) o.extra(a);
  var gap3 = H.frame({ name: 'gap', parent: a, pad: 0, w: 1, h: 18 });
  var btns = H.frame({ name: 'buttons', parent: a, dir: 'row', gap: 8, pad: 0, w: (o.w || 300) - 44 });
  (o.buttons || []).forEach(function (b) { // [link, label, kind: primary|danger|secondary]
    var prim = b[2] === 'primary' || (b[2] === 'danger' || b[2] === 'negative'); var bt = H.frame({ name: 'link:' + b[0], parent: btns, dir: 'row', pad: 0, h: 28, radius: 7, fill: (b[2] === 'danger' || b[2] === 'negative') ? H.sw(app, 'negative') : prim ? H.sw(app, 'accent') : H.sw(app, 'surface'), border: prim ? null : H.sw(app, 'line-strong'), justify: sketch.StackLayout.JustifyContent.Center, shadow: prim ? null : { color: '#00000014', blur: 1, spread: 0, x: 0, y: 1 } }); bt.horizontalSizing = sketch.FlexSizing.Fill; H.sft({ parent: bt, text: b[1], size: 13, weight: 7, color: prim ? '#ffffff' : H.sw(app, 'ink') }); bt.stackLayout.apply(); });
  H.order(btns); H.order(a); a.frame.x = Math.round((W - a.frame.width) / 2); a.frame.y = Math.round((Hh - a.frame.height) / 2 - 40); a.moveToFront(); return a; };

// ---------------- iOS 27 chrome (390×844): status bar 54, nav 44 (or large title 96), inset-grouped lists, floating 346×62 tab bar.
H.iosStatusBar = function (parent, app) { var s = H.frame({ name: 'status-bar', parent: parent, dir: 'row', pad: { top: 14, right: 26, bottom: 0, left: 32 }, w: 390, h: 54 }); H.sft({ parent: s, text: '9:41', size: 17, weight: 7, color: H.sw(app, 'ink') }); var sp = H.frame({ name: 'spacer', parent: s, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
  var st = H.frame({ name: 'status', parent: s, dir: 'row', gap: 6, pad: 0 }); [[0, 4], [0, 6], [0, 8], [0, 10]].forEach(function (b, i) { H.rect({ parent: st, name: 'bar', w: 3, h: b[1], radius: 1, fill: H.sw(app, i < 3 ? 'ink' : 'tertiary') }); }); H.sf(st, 'wifi', { size: 14, weight: 7, color: H.sw(app, 'ink') }); var bat = H.frame({ name: 'battery', parent: st, pad: 2, w: 27, h: 13, radius: 4, border: H.alpha(H.hex(app, 'ink'), 0.4) }); H.rect({ parent: bat, name: 'lvl', w: 18, h: 9, radius: 2, fill: H.sw(app, 'ink') }); bat.stackLayout.apply(); H.order(st); H.order(s); return s; };
H.iosNavBar = function (parent, app, title, o) { o = o || {}; var large = o.large;
  var n = H.frame({ name: 'nav-bar', parent: parent, dir: 'col', gap: 0, pad: 0, w: 390, align: sketch.StackLayout.AlignItems.Start });
  var bar = H.frame({ name: 'bar', parent: n, dir: 'row', gap: 0, pad: { top: 0, right: 8, bottom: 0, left: 8 }, w: 390, h: 44 });
  var lead = H.frame({ name: 'leading', parent: bar, dir: 'row', gap: 0, pad: 0, w: 110, h: 44 });
  if (o.back) { var b = H.frame({ name: 'link:back', parent: lead, dir: 'row', gap: 4, pad: { top: 0, right: 8, bottom: 0, left: 0 }, h: 44 }); H.sf(b, 'chevron_left', { size: 17, weight: 8, color: H.sw(app, 'accent') }); H.sft({ parent: b, text: o.back === true ? 'Back' : o.back, size: 17, weight: 5, color: H.sw(app, 'accent') }); H.order(b); }
  else if (o.leading) { var lb = H.frame({ name: 'link:' + (o.leadingLink || o.leading), parent: lead, pad: 0, w: 44, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(lb, o.leading, { size: 17, weight: 7, color: H.sw(app, 'accent') }); lb.stackLayout.apply(); }
  lead.stackLayout.apply();
  H.sft({ parent: bar, text: large ? '' : title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 154 });
  var trail = H.frame({ name: 'trailing', parent: bar, dir: 'row', gap: 0, pad: 0, w: 110, h: 44, justify: sketch.StackLayout.JustifyContent.End });
  (o.trailing || []).forEach(function (t) { // [link, glyph] or [link, glyph, 'Label']
    if (t[2]) { var tt = H.frame({ name: 'link:' + t[0], parent: trail, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: tt, text: t[2], size: 17, weight: t[3] ? 7 : 5, color: H.sw(app, 'accent') }); tt.stackLayout.apply(); }
    else { var tb = H.frame({ name: 'link:' + t[0], parent: trail, pad: 0, w: 44, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sf(tb, t[1], { size: 17, weight: 7, color: H.sw(app, 'accent') }); tb.stackLayout.apply(); } });
  trail.stackLayout.apply(); H.order(bar);
  if (large) { var lt = H.frame({ name: 'large-title', parent: n, dir: 'row', pad: { top: 0, right: 16, bottom: 8, left: 16 }, w: 390, h: 52 }); H.sft({ parent: lt, text: title, size: 34, weight: 8, color: H.sw(app, 'ink') }); lt.stackLayout.apply(); }
  H.order(n); return n; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 22, bottom: 8, left: 22 }, w: 390, h: 96, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 346, h: 62, radius: 31, fill: H.alpha(H.hex(app, 'surface'), 0.92), border: H.alpha(H.hex(app, 'ink'), 0.08), shadow: { color: '#00000029', blur: 30, spread: 0, x: 0, y: 10 } });
  [['home', 'Home', 'house'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'gear']].forEach(function (t) {
    var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 3, pad: 0, w: 67.6, h: 54, radius: 27, fill: sel ? H.alpha(H.hex(app, 'ink'), 0.1) : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center });
    H.sf(tab, t[2], { size: 18, weight: 8, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.sft({ parent: tab, text: t[1], size: 10, weight: 7, color: H.sw(app, sel ? 'accent' : 'secondary') }); H.order(tab);
  });
  H.order(bar); var hi = H.frame({ name: 'home-indicator', parent: wrap, dir: 'row', pad: { top: 21, right: 0, bottom: 0, left: 0 }, w: 346, h: 26, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(app, 'ink') }); hi.stackLayout.apply(); H.order(wrap); return wrap;
};
H.iosScreen = function (o) { var s = H.screen({ page: o.page, platform: 'ios', app: o.app, id: o.id, w: 390, h: 844, x: o.x, y: o.y }); s.stackLayout.direction = sketch.StackLayout.Direction.Column;
  var top = H.frame({ name: 'top', parent: s, dir: 'col', pad: 0, w: 390, fill: o.plain ? null : H.alpha(H.hex(o.app, 'canvas'), 0.96) }); H.iosStatusBar(top, o.app); if (o.title !== undefined) H.iosNavBar(top, o.app, o.title, o); H.order(top);
  var body = H.frame({ name: 'body', parent: s, dir: 'col', gap: o.gap === undefined ? 16 : o.gap, pad: o.pad === undefined ? 16 : o.pad, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  var tab = null; if (o.tab !== false) tab = H.iosTabBar(s, o.app, o.tab || 'home'); else { var hi = H.frame({ name: 'home-indicator', parent: s, dir: 'row', pad: { top: 0, right: 0, bottom: 8, left: 0 }, w: 390, h: 34, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.End }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(o.app, 'ink') }); hi.stackLayout.apply(); }
  return { screen: s, body: body, finish: function () { H.order(body); H.order(s); return s; } }; };
// Inset-grouped list (52px rows, 17pt, chevron 17/bold, 16px margins, indented separators). rows: [{link, glyph, tint, title, detail, chevron, toggle}]
H.iosGroup = function (parent, app, rows, o) { o = o || {}; var wrap = H.frame({ name: o.name || 'group', parent: parent, dir: 'col', gap: 0, pad: 0, w: 358, align: sketch.StackLayout.AlignItems.Start });
  if (o.header) { var hh = H.frame({ name: 'header', parent: wrap, pad: { top: 0, right: 16, bottom: 6, left: 16 }, w: 358 }); H.sft({ parent: hh, text: o.header.toUpperCase(), size: 13, weight: 5, color: H.sw(app, 'tertiary') }); hh.stackLayout.apply(); }
  var g = H.frame({ name: 'rows', parent: wrap, dir: 'col', gap: 0, pad: 0, w: 358, radius: 12, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  rows.forEach(function (r, i) { var row = H.frame({ name: r.link ? 'link:' + r.link : 'row', parent: g, dir: 'row', gap: 12, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 358, h: r.h || 52 });
    if (r.glyph) { var ic = H.frame({ name: 'icon', parent: row, pad: 0, w: 30, h: 30, radius: 7, fill: r.tint || H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sf(ic, r.glyph, { size: 16, weight: 7, color: '#ffffff' }); ic.stackLayout.apply(); }
    var tw = H.frame({ name: 'text', parent: row, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: tw, text: r.title, size: 17, weight: 5, color: H.sw(app, r.destructive ? 'negative' : 'ink') }); if (r.sub) H.sft({ parent: tw, text: r.sub, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(tw);
    var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
    if (r.detail) H.sft({ parent: row, text: r.detail, size: 17, weight: 5, color: H.sw(app, 'tertiary') });
    if (r.toggle !== undefined) { var tg = H.frame({ name: 'toggle', parent: row, pad: 2, w: 51, h: 31, radius: 16, fill: r.toggle ? H.sw(app, 'positive') : H.alpha(H.hex(app, 'ink'), 0.16), justify: r.toggle ? sketch.StackLayout.JustifyContent.End : sketch.StackLayout.JustifyContent.Start }); H.rect({ parent: tg, name: 'knob', w: 27, h: 27, oval: true, fill: '#ffffff' }); tg.stackLayout.apply(); }
    if (r.chevron !== false && r.link && r.toggle === undefined) H.sf(row, 'chevron_right', { size: 14, weight: 8, color: H.sw(app, 'tertiary') });
    H.order(row);
    if (i < rows.length - 1) { var sepW = H.frame({ name: 'sep', parent: g, dir: 'row', pad: { top: 0, right: 0, bottom: 0, left: r.glyph ? 58 : 16 }, w: 358, h: 1 }); var sl = H.rect({ parent: sepW, name: 'line', w: 300, h: 1, fill: H.sw(app, 'line') }); sl.horizontalSizing = sketch.FlexSizing.Fill; sepW.stackLayout.apply(); } });
  H.order(g); if (o.footer) { var ff = H.frame({ name: 'footer', parent: wrap, pad: { top: 6, right: 16, bottom: 0, left: 16 }, w: 358 }); H.sft({ parent: ff, text: o.footer, size: 13, weight: 5, color: H.sw(app, 'tertiary'), w: 326 }); ff.stackLayout.apply(); }
  H.order(wrap); return wrap; };
// iOS sheet over a scrim: grabber 60×4 + 70px toolbar with 44px symbol buttons + 17/bold title. Returns the sheet body frame.
H.iosSheet = function (screen, app, o) { screen.stackLayout = null; var scrim = H.rect({ parent: screen, name: 'scrim', w: 390, h: 844, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' });
  var sh = H.frame({ name: 'sheet', parent: screen, dir: 'col', gap: 0, pad: 0, w: 390, h: o.h || 560, radius: 24, fill: H.sw(app, 'canvas'), align: sketch.StackLayout.AlignItems.Center, clip: true });
  var gw = H.frame({ name: 'grabber-wrap', parent: sh, pad: { top: 5, right: 0, bottom: 0, left: 0 }, w: 390, h: 14, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: gw, name: 'grabber', w: 36, h: 5, radius: 3, fill: H.alpha(H.hex(app, 'ink'), 0.3) }); gw.stackLayout.apply();
  var tb = H.frame({ name: 'sheet-toolbar', parent: sh, dir: 'row', pad: { top: 0, right: 8, bottom: 0, left: 8 }, w: 390, h: 56 });
  var l = H.frame({ name: 'leading', parent: tb, dir: 'row', pad: 0, w: 100, h: 44 }); if (o.cancel !== false) { var cb = H.frame({ name: 'link:' + (o.cancelLink || 'back'), parent: l, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: cb, text: o.cancelLabel || 'Cancel', size: 17, weight: 5, color: H.sw(app, 'accent') }); cb.stackLayout.apply(); } l.stackLayout.apply();
  H.sft({ parent: tb, text: o.title || '', size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 174 });
  var r = H.frame({ name: 'trailing', parent: tb, dir: 'row', pad: 0, w: 100, h: 44, justify: sketch.StackLayout.JustifyContent.End }); if (o.done) { var db = H.frame({ name: 'link:' + (o.doneLink || 'back'), parent: r, pad: { top: 0, right: 8, bottom: 0, left: 8 }, h: 44 }); H.sft({ parent: db, text: o.done, size: 17, weight: 7, color: H.sw(app, 'accent') }); db.stackLayout.apply(); } r.stackLayout.apply(); H.order(tb);
  var body = H.frame({ name: 'sheet-body', parent: sh, dir: 'col', gap: 16, pad: 16, w: 390, align: sketch.StackLayout.AlignItems.Start, clip: true }); body.verticalSizing = sketch.FlexSizing.Fill;
  H.order(sh); sh.frame.x = 0; sh.frame.y = 844 - sh.frame.height; scrim.moveToFront(); sh.moveToFront();
  return { sheet: sh, body: body, finish: function () { H.order(body); sh.stackLayout.apply(); sh.frame.y = 844 - sh.frame.height; scrim.moveToFront(); sh.moveToFront(); } }; };
// iOS alert 270 wide (HIG): title 17/bold, message 13, stacked/side-by-side 44px buttons with separators.
H.iosAlert = function (screen, app, o) { screen.stackLayout = null; var scrim = H.rect({ parent: screen, name: 'scrim', w: 390, h: 844, fill: app.indexOf('Dark') === 0 ? '#00000099' : '#00000066' });
  var a = H.frame({ name: 'alert', parent: screen, dir: 'col', gap: 0, pad: 0, w: 270, radius: 14, fill: H.alpha(H.hex(app, 'surface'), 0.97), align: sketch.StackLayout.AlignItems.Center, clip: true });
  var tx = H.frame({ name: 'text', parent: a, dir: 'col', gap: 4, pad: { top: 19, right: 16, bottom: 19, left: 16 }, w: 270, align: sketch.StackLayout.AlignItems.Center }); H.sft({ parent: tx, text: o.title, size: 17, weight: 7, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 238 }); H.sft({ parent: tx, text: o.body, size: 13, weight: 5, color: H.sw(app, 'ink'), align: sketch.Text.Alignment.center, w: 238 }); H.order(tx);
  var sep = H.rect({ parent: a, name: 'sep', w: 270, h: 1, fill: H.sw(app, 'line-strong') });
  var stacked = (o.buttons || []).length > 2; var btns = H.frame({ name: 'buttons', parent: a, dir: stacked ? 'col' : 'row', gap: 0, pad: 0, w: 270, align: sketch.StackLayout.AlignItems.Start });
  (o.buttons || []).forEach(function (b, i) { if (i > 0) H.rect({ parent: btns, name: 'sep', w: stacked ? 270 : 1, h: stacked ? 1 : 44, fill: H.sw(app, 'line-strong') }); var bt = H.frame({ name: 'link:' + b[0], parent: btns, pad: 0, w: stacked ? 270 : (270 - 1) / 2, h: 44, justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: bt, text: b[1], size: 17, weight: b[2] === 'bold' ? 7 : 5, color: H.sw(app, (b[2] === 'danger' || b[2] === 'negative') ? 'negative' : 'accent') }); bt.stackLayout.apply(); });
  H.order(btns); H.order(a); a.frame.x = 60; a.frame.y = Math.round((844 - a.frame.height) / 2); scrim.moveToFront(); a.moveToFront(); return a; };
// Boundaryless v3 chrome — the APPROVED direction (docs/direction/conversation-target-*.png, 2026-09-15).
// Rules: borderless (tonal steps only, no rules), two shaded surfaces per screen (code/artifact + composer), quiet rows
// with 5px dots instead of cards, 56px icon-only rail or 240px source list with faint active tint and no badges, one
// type scale (11 caps / 13 chrome+meta / 14 body / 15 title), radius system (8 rows · 12 cards · 16 composer · pill chips),
// 16px hairline rings, 1.5px monoline SF glyphs (weight 5), one blue + one amber.
// Overrides the v2 helpers of the same names (this file is concatenated AFTER lib-native.js).
H.T = { caps: 11, meta: 12, chrome: 13, body: 14, title: 15, display: 22 };
H.R = { row: 8, card: 12, composer: 16, pill: 999 };
H.sfg = function (parent, name, o) { o = o || {}; o.weight = o.weight || 5; o.size = o.size || 16; return H.sf(parent, name, o); }; // monoline glyph
H.caps = function (parent, app, text, o) { o = o || {}; var t = H.sft({ parent: parent, text: String(text).toUpperCase(), size: H.T.caps, weight: 7, color: H.sw(app, 'tertiary'), w: o.w }); t.style.kerning = 0.6; return t; };
H.dot = function (parent, color, size) { return H.rect({ parent: parent, name: 'dot', w: size || 5, h: size || 5, oval: true, fill: color }); };
H.ring = function (parent, app, pct, size) { size = size || 16; var g = new sketch.Group({ name: 'ring', parent: parent }); var track = new sketch.ShapePath({ name: 'track', parent: g, shapeType: sketch.ShapePath.ShapeType.Oval, frame: { x: 0, y: 0, width: size, height: size } }); track.style.fills = []; track.style.borders = [{ color: H.sw(app, 'line-strong'), thickness: 1.5, enabled: true, position: sketch.Style.BorderPosition.Center }];
  var arc = new sketch.ShapePath({ name: 'arc', parent: g, shapeType: sketch.ShapePath.ShapeType.Oval, frame: { x: 0, y: 0, width: size, height: size } }); arc.style.fills = []; arc.style.borders = [{ color: H.sw(app, 'accent'), thickness: 1.5, enabled: true, position: sketch.Style.BorderPosition.Center }]; try { arc.style.borderOptions = { dashPattern: [Math.round(Math.PI * size * (pct || 0.2)), Math.round(Math.PI * size)], lineEnd: sketch.Style.LineEnd.Round }; } catch (e) {} arc.transform.rotation = -90; g.adjustToFit(); g.frame.width = size; g.frame.height = size; return g; };

// ---------- macOS window v3: 240 source list (or 56 rail) + 52 toolbar (no rule) + optional 320 inspector, all tonal.
H.macWindow = function (screen, app, o) {
  o = o || {}; var W = screen.frame.width, Hh = screen.frame.height; var dark = app.indexOf('Dark') === 0; var rail = !!o.rail; var sbw = rail ? 56 : 240;
  var sb = H.frame({ name: 'sidebar', parent: screen, dir: 'col', gap: 0, pad: 0, w: sbw, h: Hh, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tl = H.frame({ name: 'titlebar', parent: sb, dir: 'row', gap: 8, pad: { top: 0, right: 10, bottom: 0, left: rail ? 12 : 20 }, w: sbw, h: 52 });
  [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function (c, i) { H.rect({ parent: tl, name: 'traffic-' + i, w: 12, h: 12, oval: true, fill: c[0], border: c[1] }); });
  if (!rail) { var spT = H.frame({ name: 'spacer', parent: tl, pad: 0, h: 1 }); spT.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(tl, 'link:' + (o.collapseLink || 'back'), 'sidebar_left', app, { size: 16, weight: 5, color: H.sw(app, 'secondary') }); }
  H.order(tl);
  var active = o.active;
  var list = H.frame({ name: 'list', parent: sb, dir: 'col', gap: rail ? 8 : 1, pad: rail ? { top: 8, right: 10, bottom: 8, left: 10 } : { top: 6, right: 12, bottom: 8, left: 12 }, w: sbw, align: sketch.StackLayout.AlignItems.Start });
  function row(id, glyph, label, opt) { opt = opt || {}; var sel = opt.sel;
    if (rail) { var b = H.frame({ name: 'link:' + id, parent: list, pad: 0, w: 36, h: 36, radius: H.R.row, fill: sel ? H.sw(app, 'hover') : null, justify: sketch.StackLayout.JustifyContent.Center }); H.sfg(b, glyph, { size: 17, color: H.sw(app, sel ? 'ink' : 'secondary') }); b.stackLayout.apply(); if (opt.count) { b.stackLayout = null; var bd = H.frame({ name: 'badge', parent: b, pad: { top: 0, right: 4, bottom: 0, left: 4 }, h: 14, radius: 7, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: bd, text: String(opt.count), size: 9, weight: 7, color: '#ffffff' }); bd.stackLayout.apply(); bd.frame.x = 22; bd.frame.y = 2; } return b; }
    var r = H.frame({ name: 'link:' + id, parent: list, dir: 'row', gap: 10, pad: { top: 0, right: 10, bottom: 0, left: 10 + (opt.indent || 0) }, w: sbw - 24, h: 32, radius: H.R.row, fill: sel ? H.alpha(H.hex(app, 'ink'), dark ? 0.08 : 0.05) : null });
    if (opt.disclosure) H.sfg(r, opt.open ? 'chevron_down' : 'chevron_right', { size: 10, weight: 7, color: H.sw(app, 'tertiary'), w: 12 });
    if (glyph) H.sfg(r, glyph, { size: 16, color: H.sw(app, sel ? 'ink' : 'secondary'), w: 20 });
    H.sft({ parent: r, text: label, size: H.T.chrome, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary'), w: 160 });
    if (opt.count) { var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.dot(r, H.hex(app, 'accent'), 5); }
    H.order(r); return r; }
  function header(label) { if (rail) { var g = H.frame({ name: 'gap', parent: list, pad: 0, w: 36, h: 8 }); return; } var h = H.frame({ name: 'section', parent: list, dir: 'row', pad: { top: 18, right: 10, bottom: 6, left: 10 }, w: sbw - 24, h: 38 }); H.caps(h, app, label); h.stackLayout.apply(); }
  row('new-conversation', 'square_pencil', 'New conversation', { sel: active === 'new-conversation' });
  row('search', 'magnifyingglass', 'Search', { sel: active === 'search' });
  header('Weave');
  row('activity', 'bell', 'Activity', { sel: active === 'activity', count: o.activityCount === undefined ? 3 : o.activityCount });
  row('artifacts', 'doc_on_doc', 'Artifacts', { sel: active === 'artifacts' });
  row('routines', 'clock', 'Routines', { sel: active === 'routines' });
  row('customize', 'wand', 'Customize', { sel: active === 'customize' });
  header('Projects');
  row('projects', 'folder', 'All projects', { sel: active === 'projects', disclosure: !rail, open: true });
  if (!rail) { row('project', 'folder', 'Personal', { sel: active === 'project', indent: 12 }); row('project', 'folder', 'Weave Cloud', { indent: 12 }); }
  if (!rail) { header('Recent'); (o.recent || [['conversation', 'Move the billing webhook handler'], ['conversation', 'Draft the Q3 investor update'], ['conversation', 'Why is the Mac build larger?']]).forEach(function (rc, i) { row(rc[0], null, rc[1], { sel: active === 'conversation' && i === 0 }); }); }
  H.order(list);
  var fillS = H.frame({ name: 'fill', parent: sb, pad: 0, w: sbw }); fillS.verticalSizing = sketch.FlexSizing.Fill;
  var foot = H.frame({ name: 'link:settings', parent: sb, dir: 'row', gap: 10, pad: rail ? { top: 0, right: 14, bottom: 24, left: 14 } : { top: 8, right: 16, bottom: 16, left: 16 }, w: sbw, h: rail ? 60 : 56 });
  var av = H.frame({ name: 'avatar', parent: foot, pad: 0, w: 28, h: 28, radius: 14, fill: H.sw(app, 'accent'), justify: sketch.StackLayout.JustifyContent.Center }); H.sft({ parent: av, text: 'AB', size: 11, weight: 7, color: '#ffffff' }); av.stackLayout.apply();
  if (!rail) { var info = H.frame({ name: 'info', parent: foot, dir: 'col', gap: 1, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: info, text: 'Abhi Bansal', size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); H.sft({ parent: info, text: 'Pro · Straits Lab', size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(info); }
  if (!rail) { var spF = H.frame({ name: 'spacer', parent: foot, pad: 0, h: 1 }); spF.horizontalSizing = sketch.FlexSizing.Fill; H.sfg(foot, 'gear', { size: 15, color: H.sw(app, 'tertiary') }); }
  H.order(foot); H.order(sb);
  var contentW = W - sbw - (o.inspector ? 320 : 0);
  var col = H.frame({ name: 'content-col', parent: screen, dir: 'col', gap: 0, pad: 0, w: contentW, h: Hh, fill: H.sw(app, 'surface'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var tb = H.frame({ name: 'toolbar', parent: col, dir: 'row', gap: 6, pad: { top: 0, right: 16, bottom: 0, left: 12 }, w: contentW, h: 52 });
  if (rail) [['#ff5f57', '#e0443e'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(function () {}); // traffic lights live in the rail
  var nav = H.frame({ name: 'nav', parent: tb, dir: 'row', gap: 0, pad: 0 }); H.sfBtn(nav, 'link:back', 'chevron_left', app, { w: 28, h: 28, size: 14, weight: 6, color: H.sw(app, 'secondary') }); H.sfBtn(nav, 'forward', 'chevron_right', app, { w: 28, h: 28, size: 14, weight: 6, color: H.sw(app, 'line-strong') }); H.order(nav);
  var titleWrap = H.frame({ name: 'title', parent: tb, dir: 'row', gap: 8, pad: { top: 0, right: 0, bottom: 0, left: 6 } });
  if (o.title) H.sft({ parent: titleWrap, text: o.title, size: H.T.title, weight: 6, color: H.sw(app, 'ink') }); if (o.subtitle) H.sft({ parent: titleWrap, text: o.subtitle, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(titleWrap);
  var spTb = H.frame({ name: 'spacer', parent: tb, pad: 0, h: 1 }); spTb.horizontalSizing = sketch.FlexSizing.Fill;
  (o.tools || []).forEach(function (t) { if (t[2]) { var b = H.frame({ name: t[0], parent: tb, dir: 'row', gap: 6, pad: { top: 0, right: 12, bottom: 0, left: 10 }, h: 28, radius: H.R.pill, fill: t[3] ? H.sw(app, 'ink') : H.sw(app, 'hover') }); H.sfg(b, t[1], { size: 13, weight: 6, color: t[3] ? H.sw(app, 'surface') : H.sw(app, 'ink') }); H.sft({ parent: b, text: t[2], size: H.T.chrome, weight: 6, color: t[3] ? H.sw(app, 'surface') : H.sw(app, 'ink') }); H.order(b); } else H.sfBtn(tb, t[0], t[1], app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') }); });
  if (o.search !== false) H.sfBtn(tb, 'link:search', 'magnifyingglass', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  if (o.inspectorToggle) H.sfBtn(tb, 'link:' + o.inspectorToggle, 'sidebar_right', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  H.order(tb);
  var main = H.frame({ name: 'main', parent: col, dir: 'col', gap: o.gap === undefined ? 24 : o.gap, pad: o.pad === undefined ? { top: 20, right: 40, bottom: 24, left: 40 } : o.pad, w: contentW, align: o.align || sketch.StackLayout.AlignItems.Start, justify: o.justify, clip: true }); main.verticalSizing = sketch.FlexSizing.Fill;
  H.order(col);
  var insp = null;
  if (o.inspector) { insp = H.frame({ name: 'inspector', parent: screen, dir: 'col', gap: 0, pad: 0, w: 320, h: Hh, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
    var ih = H.frame({ name: 'inspector-header', parent: insp, dir: 'row', gap: 8, pad: { top: 0, right: 12, bottom: 0, left: 24 }, w: 320, h: 52 }); H.sft({ parent: ih, text: o.inspector === true ? 'Context' : o.inspector, size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); var spI = H.frame({ name: 'spacer', parent: ih, pad: 0, h: 1 }); spI.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(ih, 'link:' + (o.inspectorClose || 'back'), 'sidebar_right', app, { w: 28, h: 28, size: 16, weight: 5, color: H.sw(app, 'secondary') }); H.order(ih); }
  H.order(screen);
  return { window: screen, sidebar: sb, main: main, toolbar: tb, inspector: insp, finish: function () { H.order(main); if (insp) H.order(insp); col.stackLayout.apply(); screen.stackLayout.apply(); return screen; } };
};
// Inspector body helpers: section (caps label + 40px air), quiet row (glyph or dot · title · meta), file row.
H.inspBody = function (insp, app) { var ib = H.frame({ name: 'inspector-body', parent: insp, dir: 'col', gap: 0, pad: { top: 4, right: 24, bottom: 24, left: 24 }, w: 320, align: sketch.StackLayout.AlignItems.Start }); return ib; };
H.inspSection = function (ib, app, label, first) { var h = H.frame({ name: 'section', parent: ib, pad: { top: first ? 8 : 28, right: 0, bottom: 10, left: 0 }, w: 272 }); H.caps(h, app, label); h.stackLayout.apply(); return h; };
H.quietRow = function (parent, app, o) { var r = H.frame({ name: o.link ? 'link:' + o.link : 'row', parent: parent, dir: 'row', gap: 10, pad: { top: 6, right: 0, bottom: 6, left: 0 }, w: o.w || 272, align: sketch.StackLayout.AlignItems.Start });
  if (o.dot) { var dw = H.frame({ name: 'dot-wrap', parent: r, pad: { top: 6, right: 0, bottom: 0, left: 0 }, w: 12 }); H.dot(dw, o.dot, 5); dw.stackLayout.apply(); } else if (o.glyph) H.sfg(r, o.glyph, { size: 14, color: H.sw(app, 'tertiary'), w: 16 });
  var tw = H.frame({ name: 'text', parent: r, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); tw.horizontalSizing = sketch.FlexSizing.Fill; H.text({ parent: tw, text: o.title, size: H.T.chrome, weight: o.strong ? 6 : 5, color: H.sw(app, 'ink'), mono: !!o.mono, w: o.tw || 200 }); if (o.meta) H.text({ parent: tw, text: o.meta, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary'), w: o.tw || 200 }); H.order(tw);
  if (o.trail) H.text({ parent: r, text: o.trail, size: H.T.meta, weight: 6, color: o.trailColor || H.sw(app, 'tertiary'), mono: true });
  if (o.chevron) H.sfg(r, 'chevron_right', { size: 11, weight: 7, color: H.sw(app, 'tertiary') });
  H.order(r); return r; };
// The two allowed surfaces.
H.codeCard = function (parent, app, o) { var c = H.frame({ name: 'code', parent: parent, dir: 'col', gap: 0, pad: 0, w: o.w || 720, radius: H.R.card, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  var hd = H.frame({ name: 'code-header', parent: c, dir: 'row', gap: 8, pad: { top: 10, right: 14, bottom: 6, left: 16 }, w: o.w || 720 }); H.sfg(hd, 'doc', { size: 12, color: H.sw(app, 'tertiary') }); H.text({ parent: hd, text: o.path, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary'), mono: true }); var sp = H.frame({ name: 'spacer', parent: hd, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; H.sfg(hd, 'doc_on_doc', { size: 12, color: H.sw(app, 'tertiary') }); H.order(hd);
  var body = H.frame({ name: 'code-body', parent: c, dir: 'col', gap: 4, pad: { top: 6, right: 16, bottom: 16, left: 16 }, w: o.w || 720, align: sketch.StackLayout.AlignItems.Start }); (o.lines || []).forEach(function (l) { H.text({ parent: body, text: l, size: 12.5, weight: 5, color: H.sw(app, 'ink'), mono: true, w: (o.w || 720) - 32, align: sketch.Text.Alignment.left }); }); H.order(body); H.order(c); return c; };
H.composer = function (parent, app, o) { o = o || {}; var w = o.w || 720; var c = H.frame({ name: 'composer', parent: parent, dir: 'row', gap: 8, pad: { top: 8, right: 8, bottom: 8, left: 10 }, w: w, h: 56, radius: 28, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000066' : '#0000001a', blur: 24, spread: 0, x: 0, y: 6 } });
  H.sfBtn(c, 'attach', 'plus', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  if (o.model !== false) { var m = H.frame({ name: 'link:conversation--model', parent: c, dir: 'row', gap: 6, pad: { top: 0, right: 10, bottom: 0, left: 8 }, h: 28, radius: H.R.pill, fill: H.sw(app, 'panel') }); H.sfg(m, 'cube', { size: 12, color: H.sw(app, 'secondary') }); H.sft({ parent: m, text: o.model || 'Claude Fable 5.1', size: H.T.meta, weight: 6, color: H.sw(app, 'ink') }); H.sfg(m, 'chevron_down', { size: 9, weight: 7, color: H.sw(app, 'tertiary') }); H.order(m); }
  var ph = H.text({ parent: c, text: o.placeholder || 'Reply…', size: H.T.body, weight: 5, color: H.sw(app, 'tertiary') }); ph.horizontalSizing = sketch.FlexSizing.Fill;
  H.sfBtn(c, 'link:' + (o.voiceLink || 'conversation--voice'), 'mic', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') });
  H.sfBtn(c, 'send', 'arrow_up', app, { w: 36, h: 36, radius: 18, size: 15, weight: 8, fill: H.sw(app, 'ink'), color: H.sw(app, 'surface') });
  H.order(c); return c; };
// Thread pieces
H.userTurn = function (thread, app, text, time) { var r = H.frame({ name: 'user', parent: thread, dir: 'col', gap: 6, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.End }); var b = H.frame({ name: 'bubble', parent: r, pad: { top: 10, right: 16, bottom: 10, left: 16 }, radius: 16, fill: H.sw(app, 'accent-soft') }); H.text({ parent: b, text: text, size: H.T.body, weight: 5, color: H.sw(app, 'ink'), w: 440 }); b.stackLayout.apply(); if (time) H.text({ parent: r, text: time, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(r); return r; };
H.reasoned = function (thread, app, label) { var r = H.frame({ name: 'link:conversation--reasoning', parent: thread, dir: 'row', gap: 6, pad: 0, h: 20 }); H.sfg(r, 'sparkles', { size: 12, color: H.hex(app, 'accent') }); H.sft({ parent: r, text: label, size: H.T.chrome, weight: 5, color: H.sw(app, 'secondary') }); H.sfg(r, 'chevron_right', { size: 9, weight: 7, color: H.sw(app, 'tertiary') }); H.order(r); return r; };
H.assistantTurn = function (thread, app, o) { var r = H.frame({ name: 'assistant', parent: thread, dir: 'col', gap: 12, pad: 0, w: 720, align: sketch.StackLayout.AlignItems.Start }); var hd = H.frame({ name: 'who', parent: r, dir: 'row', gap: 8, pad: 0 }); H.sfg(hd, 'sparkles', { size: 14, color: H.hex(app, 'accent') }); H.sft({ parent: hd, text: 'Weave', size: H.T.chrome, weight: 6, color: H.sw(app, 'ink') }); if (o.time) H.sft({ parent: hd, text: o.time, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); H.order(hd);
  if (o.headline) H.text({ parent: r, text: o.headline, size: H.T.display, weight: 6, color: H.sw(app, 'ink'), w: 720 });
  (o.paragraphs || []).forEach(function (p) { var t = H.text({ parent: r, text: p, size: H.T.body, weight: 5, color: H.sw(app, 'ink'), w: 720 }); t.style.lineHeight = 22; });
  if (o.build) o.build(r);
  var acts = H.frame({ name: 'actions', parent: r, dir: 'row', gap: 4, pad: { top: 4, right: 0, bottom: 0, left: 0 } }); ['doc_on_doc', 'hand_thumbsup', 'hand_thumbsdown', 'arrow_clockwise'].forEach(function (g, i) { H.sfBtn(acts, ['copy', 'helpful', 'not-helpful', 'regenerate'][i], g, app, { w: 24, h: 24, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); }); H.order(acts);
  H.order(r); return r; };
H.runRow = function (parent, app, o) { var r = H.frame({ name: o.link ? 'link:' + o.link : 'run', parent: parent, dir: 'row', gap: 10, pad: { top: 8, right: 0, bottom: 8, left: 0 }, w: o.w || 720 }); H.sfg(r, 'terminal', { size: 14, color: H.sw(app, 'secondary') }); H.text({ parent: r, text: o.cmd, size: H.T.chrome, weight: 6, color: H.sw(app, 'ink'), mono: true }); H.text({ parent: r, text: o.status, size: H.T.meta, weight: 5, color: H.sw(app, 'tertiary') }); var sp = H.frame({ name: 'spacer', parent: r, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill; if (o.pending) { H.dot(r, H.hex(app, 'attention-mark'), 5); H.text({ parent: r, text: o.pending, size: H.T.meta, weight: 6, color: H.sw(app, 'attention') }); } H.sfg(r, 'chevron_right', { size: 11, weight: 7, color: H.sw(app, 'tertiary') }); H.order(r); return r; };

// ---------- iOS v3: same rules (no group borders — groups are panel-tinted 12px; separators are hairlines inset; rows 52).
H.iosGroup = function (parent, app, rows, o) { o = o || {}; var wrap = H.frame({ name: o.name || 'group', parent: parent, dir: 'col', gap: 0, pad: 0, w: 358, align: sketch.StackLayout.AlignItems.Start });
  if (o.header) { var hh = H.frame({ name: 'header', parent: wrap, pad: { top: 0, right: 16, bottom: 8, left: 16 }, w: 358 }); H.caps(hh, app, o.header); hh.stackLayout.apply(); }
  var g = H.frame({ name: 'rows', parent: wrap, dir: 'col', gap: 0, pad: 0, w: 358, radius: H.R.card, fill: H.sw(app, 'panel'), align: sketch.StackLayout.AlignItems.Start, clip: true });
  rows.forEach(function (r, i) { var row = H.frame({ name: r.link ? 'link:' + r.link : 'row', parent: g, dir: 'row', gap: 12, pad: { top: 0, right: 16, bottom: 0, left: 16 }, w: 358, h: r.h || 52 });
    if (r.glyph) H.sfg(row, r.glyph, { size: 18, color: r.tint || H.sw(app, 'secondary'), w: 24 });
    var tw = H.frame({ name: 'text', parent: row, dir: 'col', gap: 2, pad: 0, align: sketch.StackLayout.AlignItems.Start }); H.sft({ parent: tw, text: r.title, size: 17, weight: 5, color: H.sw(app, r.destructive ? 'negative' : 'ink') }); if (r.sub) H.sft({ parent: tw, text: r.sub, size: 13, weight: 5, color: H.sw(app, 'tertiary') }); H.order(tw);
    var sp = H.frame({ name: 'spacer', parent: row, pad: 0, h: 1 }); sp.horizontalSizing = sketch.FlexSizing.Fill;
    if (r.detail) H.sft({ parent: row, text: r.detail, size: 17, weight: 5, color: H.sw(app, 'tertiary') });
    if (r.dot) H.dot(row, r.dot, 6);
    if (r.toggle !== undefined) { var tg = H.frame({ name: 'toggle', parent: row, pad: 2, w: 51, h: 31, radius: 16, fill: r.toggle ? H.sw(app, 'ink') : H.alpha(H.hex(app, 'ink'), 0.16), justify: r.toggle ? sketch.StackLayout.JustifyContent.End : sketch.StackLayout.JustifyContent.Start }); H.rect({ parent: tg, name: 'knob', w: 27, h: 27, oval: true, fill: H.hex(app, 'surface') }); tg.stackLayout.apply(); }
    if (r.chevron !== false && r.link && r.toggle === undefined) H.sfg(row, 'chevron_right', { size: 13, weight: 7, color: H.sw(app, 'tertiary') });
    H.order(row);
    if (i < rows.length - 1) { var sepW = H.frame({ name: 'sep', parent: g, dir: 'row', pad: { top: 0, right: 0, bottom: 0, left: r.glyph ? 52 : 16 }, w: 358, h: 1 }); var sl = H.rect({ parent: sepW, name: 'line', w: 300, h: 1, fill: H.sw(app, 'line') }); sl.horizontalSizing = sketch.FlexSizing.Fill; sepW.stackLayout.apply(); } });
  H.order(g); if (o.footer) { var ff = H.frame({ name: 'footer', parent: wrap, pad: { top: 8, right: 16, bottom: 0, left: 16 }, w: 358 }); H.sft({ parent: ff, text: o.footer, size: 13, weight: 5, color: H.sw(app, 'tertiary'), w: 326 }); ff.stackLayout.apply(); }
  H.order(wrap); return wrap; };
H.iosTabBar = function (screen, app, active) {
  var wrap = H.frame({ name: 'tab-bar', parent: screen, dir: 'col', gap: 0, pad: { top: 0, right: 22, bottom: 8, left: 22 }, w: 390, h: 96, align: sketch.StackLayout.AlignItems.Center });
  var bar = H.frame({ name: 'bar', parent: wrap, dir: 'row', gap: 0, pad: 4, w: 346, h: 62, radius: 31, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000080' : '#00000022', blur: 30, spread: 0, x: 0, y: 10 } });
  [['home', 'Home', 'house'], ['activity', 'Activity', 'bell'], ['projects', 'Projects', 'folder'], ['recent', 'Recent', 'clock'], ['settings', 'Settings', 'gear']].forEach(function (t) { var sel = t[0] === active; var tab = H.frame({ name: 'link:' + t[0], parent: bar, dir: 'col', gap: 3, pad: 0, w: 67.6, h: 54, radius: 27, fill: sel ? H.sw(app, 'hover') : null, justify: sketch.StackLayout.JustifyContent.Center, align: sketch.StackLayout.AlignItems.Center }); H.sfg(tab, t[2], { size: 18, weight: sel ? 6 : 5, color: H.sw(app, sel ? 'ink' : 'secondary') }); H.sft({ parent: tab, text: t[1], size: 10, weight: 6, color: H.sw(app, sel ? 'ink' : 'secondary') }); H.order(tab); });
  H.order(bar); var hi = H.frame({ name: 'home-indicator', parent: wrap, dir: 'row', pad: { top: 21, right: 0, bottom: 0, left: 0 }, w: 346, h: 26, justify: sketch.StackLayout.JustifyContent.Center }); H.rect({ parent: hi, name: 'indicator', w: 139, h: 5, radius: 3, fill: H.sw(app, 'ink') }); hi.stackLayout.apply(); H.order(wrap); return wrap; };
H.iosComposer = function (parent, app, o) { o = o || {}; var c = H.frame({ name: 'composer', parent: parent, dir: 'row', gap: 6, pad: { top: 6, right: 6, bottom: 6, left: 8 }, w: 358, h: 52, radius: 26, fill: H.sw(app, 'surface'), shadow: { color: app.indexOf('Dark') === 0 ? '#00000066' : '#0000001a', blur: 20, spread: 0, x: 0, y: 6 } }); H.sfBtn(c, 'attach', 'plus', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') }); var ph = H.sft({ parent: c, text: o.placeholder || 'Message Weave', size: 16, weight: 5, color: H.sw(app, 'tertiary') }); ph.horizontalSizing = sketch.FlexSizing.Fill; H.sfBtn(c, 'link:' + (o.voiceLink || 'conversation--voice'), 'mic', app, { w: 32, h: 32, size: 16, weight: 5, color: H.sw(app, 'secondary') }); H.sfBtn(c, 'send', 'arrow_up', app, { w: 36, h: 36, radius: 18, size: 15, weight: 8, fill: H.sw(app, 'ink'), color: H.sw(app, 'surface') }); H.order(c); return c; };
