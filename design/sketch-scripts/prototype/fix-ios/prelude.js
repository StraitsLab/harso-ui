// Harso Sketch prelude — auto-prepended to every run_code by sk.py (unless the script contains "// NO_PRELUDE").
// Provides H.* helpers so lane scripts stay short and consistent. All colours come from document swatches.
const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
var H = {};
H.doc = doc;
H.page = function (name) { return doc.pages.find(function (p) { return p.name === name; }) || new sketch.Page({ name: name, parent: doc }); };
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

// Lane-local repair pass; preserves refined frames and every navigation target.
H.iosStatusBar=function(parent,app){var s=H.frame({name:'status-bar',parent:parent,dir:'row',pad:{top:14,right:28,bottom:0,left:28},w:390,h:54,gap:6});H.text({parent:s,text:'9:41',size:15,weight:7,color:H.sw(app,'ink')});var sp=H.frame({parent:s,name:'spacer',h:1});sp.horizontalSizing=sketch.FlexSizing.Fill;H.icon({parent:s,name:'cellular-signal',d:'<path d="M3 19v-3m5 3v-7m5 7V8m5 11V4"/>',size:18,color:H.hex(app,'ink')});H.icon({parent:s,name:'wifi',d:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1"/>',size:16,color:H.hex(app,'ink')});H.icon({parent:s,name:'battery',d:'<rect x="1" y="6" width="19" height="12" rx="3"/><path d="M23 10v4M5 10h11v4H5z"/>',size:24,color:H.hex(app,'ink')});H.order(s);return s;};
H.iosButtonStyle=function(f,app,danger){f.style.fills=[{color:H.sw(app,danger?'hover':'ink'),enabled:true}];(f.layers||[]).filter(l=>l.type==='Text').forEach(t=>t.style.textColor=H.sw(app,danger?'negative':'inverse'));};
H.fixIOS=function(s,APP,ID){
function all(l){var a=[l];(l.layers||[]).forEach(c=>a=a.concat(all(c)));return a;}
function texts(t){return all(s).filter(l=>l.type==='Text'&&l.text===t);}
function change(a,b){texts(a).forEach(l=>l.text=b);}
function disclosure(r){if(!r||!r.stackLayout)return;var icons=r.layers.filter(l=>l.name==='disclosure');if(icons.length)return;var i=H.icon({parent:r,name:'disclosure',d:H.paths.chevronRight,size:16,color:H.hex(APP,'tertiary')});i.index=0;r.stackLayout.apply();}
var x=s.frame.x,y=s.frame.y;var top=s.layers.find(l=>l.name==='top');if(top){var old=top.layers.find(l=>l.name==='status-bar');var idx=old.index;old.remove();H.iosStatusBar(top,APP).index=idx;H.relayout(top);}
all(s).filter(l=>l.type==='Text').forEach(t=>{var p=t.parent;if(!p||!p.style||!p.style.fills.length)return;var fill=String(p.style.fills[0].color).slice(0,7).toLowerCase();if((fill===H.hex(APP,'accent').toLowerCase()||fill===H.hex(APP,'negative').toLowerCase())&&p.name.indexOf('link:')===0)H.iosButtonStyle(p,APP,fill===H.hex(APP,'negative').toLowerCase());});
// Local SearchField replacement removes blank accessory and duplicate query override.
all(s).filter(l=>l.type==='SymbolInstance'&&l.symbolId&&l.master&&l.master.name.indexOf('SearchField/')===0).forEach(l=>{var p=l.parent,idx=l.index,w=l.frame.width;l.remove();var r=H.frame({parent:p,name:'link:search',dir:'row',gap:10,pad:12,w:w,h:44,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line')});H.icon({parent:r,d:H.paths.search,size:18,color:H.hex(APP,'secondary')});var t=H.text({parent:r,text:ID==='search'?'billing':'Search',size:15,color:H.sw(APP,ID==='search'?'ink':'tertiary')});t.horizontalSizing=sketch.FlexSizing.Fill;if(ID==='search'){var c=H.frame({parent:r,name:'link:search',w:24,h:24,justify:sketch.StackLayout.JustifyContent.Center});H.icon({parent:c,d:H.paths.x,size:16,color:H.hex(APP,'secondary')});H.order(c);}H.order(r);r.index=idx;});
all(s).filter(l=>l.type==='Text'&&l.text.indexOf('Running only')===0).forEach(l=>{l.text="Running only the billing webhook tests.\nI'll ask before executing anything.";l.frame.width=342;l.fixedWidth=true;});
change('Awaiting permission to run the test command.','Review approval ›');
change('Always allow','Always allow npm test in Personal');texts('Always allow npm test in Personal').forEach(l=>{l.style.fontSize=14;});
change('You’re up to date','End of recent activity');change('Attempt 1 · Running','Attempt 1 · Waiting for approval');change('IN PROGRESS','NEEDS YOUR INPUT');change('Respond','Review approval');
if(ID==='activity'||ID.indexOf('conversation')===0)change('● RUNNING','WAITING FOR APPROVAL');
if(ID.indexOf('project')===0&&ID.indexOf('projects')!==0)texts('Personal').filter(l=>l.style.fontSize>=24).forEach(l=>l.remove());
change('Every 1d · No project · Scheduled','Every day · No project · Scheduled');
['Language','Text size','Voice'].forEach(t=>texts(t).forEach(l=>{if(l.parent.name==='copy'){l.frame.width=155;disclosure(l.parent.parent);}}));
texts('Paused').forEach(l=>{var r=l.parent;var c=r.layers.find(v=>v.name==='copy');if(c)c.layers.filter(v=>v.type==='Text').forEach(v=>v.frame.width=180);disclosure(r);});
['Sign out','Copy link','Save to Files','Delete account','Export data'].forEach(t=>texts(t).forEach(l=>{if(l.parent.name==='copy'){var r=l.parent.parent;r.layers.filter(v=>v.name==='icon'&&v.frame.width===16).forEach(v=>v.remove());}}));
if(ID==='customize'){texts('✓').forEach(l=>l.remove());['General','Research'].forEach(t=>texts(t).forEach(l=>{var r=l.parent.parent;r.layers.filter(v=>v.name==='icon'&&v.frame.width===16).forEach(v=>v.remove());H.icon({parent:r,name:'profile-selection',d:t==='General'?H.paths.circleCheck:H.paths.circle,size:20,color:H.hex(APP,t==='General'?'accent':'tertiary')}).index=0;}));}
change('CONVERSATIONS',ID==='settings-general'?'DEVICE PREFERENCES':'CONVERSATIONS');
change('Remote session revocation requires the account service.','To sign out another device, select it and review its session.');
if(ID==='settings-devices'){['This iPhone','MacBook Pro'].forEach(t=>texts(t).forEach(l=>{var r=l.parent.parent;var i=r.layers.find(v=>v.name==='icon'&&v.frame.width===20);if(i){var idx=i.index;i.remove();H.icon({parent:r,name:'device-icon',size:20,color:H.hex(APP,'accent'),d:t==='This iPhone'?'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>':'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-3 4h22l-3-4"/>'}).index=idx;}}));}
if(ID==='settings-privacy'){texts('Share diagnostic data').forEach(l=>{var r=l.parent;H.icon({parent:r,name:'diagnostics-icon',d:H.paths.shield,size:20,color:H.hex(APP,'accent')}).index=r.layers.length-1;r.stackLayout.gap=12;});}
change('iOS prototype','1.0.0 (1)');
texts('Available').forEach(l=>{l.text='32k / 200k';var c=l.parent.layers.find(v=>v.name==='copy');if(c)c.layers.filter(v=>v.type==='Text').forEach(v=>{if(v.text==='Usage this month')v.text='Tokens this month';if(v.text==='Account-wide usage')v.text='Requests: 41 / 500';v.frame.width=170;});});
texts('Only real deliverables land here — results without output stay with their task').forEach(l=>l.remove());
if(ID==='artifacts--code'){all(s).filter(l=>l.type==='Text'&&l.text.indexOf('export async')===0).forEach(l=>{l.text='<article>\n  <small>MIGRATION NOTES</small>\n  <h1>A safer billing pipeline</h1>\n  <p>One ledger client.\n  Idempotent retries.\n  Clear ownership.</p>\n  <p>✓ Webhook handler migrated</p>\n  <ol>\n    <li>Validate event signature</li>\n    <li>Apply ledger transaction</li>\n    <li>Acknowledge delivery</li>\n  </ol>\n</article>';l.style.fontSize=11;});}
if(ID==='settings-billing--plan'){change('Monthly','Monthly · US$300');change('Annual','Annual · US$3,000');texts('Monthly · US$300').concat(texts('Annual · US$3,000')).forEach(l=>l.style.fontSize=12);change('Review pricing and payment details at checkout.','US$300 billed monthly. Renews monthly until canceled. Annual: US$3,000 per year.');texts('US$300 billed monthly. Renews monthly until canceled. Annual: US$3,000 per year.').forEach(l=>{l.fixedWidth=true;l.frame.width=342;});}
if(ID==='routines--new'){texts('Summarize my priorities for today').forEach(l=>{l.text='Summarize my priorities for today.\nHighlight deadlines and next steps.';var r=l.parent;r.frame.height=88;r.verticalSizing=sketch.FlexSizing.Fixed;l.frame.width=326;l.fixedWidth=true;});texts('Every day at 9:00 AM').forEach(l=>{l.frame.width=290;disclosure(l.parent);});}
// ActionSheet cancellation is its own surface with an 8pt separation.
if(ID==='conversation--menu'){var p=s.layers.find(l=>l.name.indexOf('ActionSheet/')===0);if(p){var c=p.layers.find(l=>all(l).some(t=>t.text==='Cancel'));if(c){c.parent=s;c.frame.x=24;c.frame.y=752;c.style.fills=[{color:H.sw(APP,'surface'),enabled:true}];H.relayout(p);p.frame.y=744-p.frame.height;}}}
H.relayout(s);
s.layers.filter(l=>l.name==='Sheet').forEach(p=>{p.frame.y=810-p.frame.height;});
if(ID==='conversation--approval'){var p=s.layers.find(l=>l.name.indexOf('Sheet/')===0);if(p){p.frame.height=430;p.frame.y=380;}}
// Pinned native home indicator above scrim, never a layout child.
s.stackLayout=null;s.layers.filter(l=>l.name==='gesture-indicator'||l.name==='home-indicator-native').forEach(l=>l.remove());H.rect({parent:s,name:'home-indicator-native',x:128,y:824,w:134,h:5,radius:3,fill:H.sw(APP,'ink')});
all(s).filter(l=>l.name.indexOf('link:')===0).forEach(l=>l.name=l.name.replace(/ \d+$/,''));s.frame.x=x;s.frame.y=y;s.frame.width=390;s.frame.height=844;
H.out({id:ID,app:APP,frame:s.id,x:x,y:y,w:s.frame.width,h:s.frame.height,links:Array.from(new Set(all(s).filter(l=>l.name.indexOf('link:')===0).map(l=>l.name)))});
};
