// NO_PRELUDE
// Scrims must always DARKEN: black at 40% (light) / 60% (dark). Find every overlay scrim (full-screen rect with alpha fill) on Proto pages and retint.
const sketch = require('sketch'); var doc = sketch.getSelectedDocument(); var n = 0, seen = [];
doc.pages.forEach(function (page) { if (page.name.indexOf('Proto ') !== 0) return; var dark = page.name.indexOf('Dark') > 0;
  page.layers.forEach(function (scr) { if (scr.name.indexOf('Screen/') !== 0) return;
    sketch.find('*', scr).forEach(function (l) { if (!l.style || !l.style.fills || !l.style.fills.length) return;
      var full = Math.abs(l.frame.width - scr.frame.width) < 2 && Math.abs(l.frame.height - scr.frame.height) < 2;
      var named = /scrim/i.test(l.name);
      var f = l.style.fills[0]; var c = String(f.color || ''); var alpha = c.length === 9 ? parseInt(c.slice(7), 16) : 255;
      if ((named || (full && alpha < 200 && alpha > 20)) && l.type !== 'Group') { l.style.fills = [{ fillType: sketch.Style.FillType.Color, color: dark ? '#00000099' : '#00000066', enabled: true }]; n += 1; if (seen.length < 5) seen.push(page.name + ' ' + scr.name.split('/').pop() + ' ' + l.name + ' ' + c); }
    }); });
});
console.log(JSON.stringify({ retinted: n, sample: seen }));
