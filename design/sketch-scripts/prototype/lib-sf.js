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
