const sketch = require('sketch');
var doc = sketch.getSelectedDocument();
// Rebuild the shared text styles with numeric weights (Sketch 1..12 scale) — the first pass stored fontWeight 400/500 which Sketch ignored.
var want = [
  ['Type/xs 12', 12, 5], ['Type/sm 13', 13, 5], ['Type/base 14', 14, 5], ['Type/md 15', 15, 5], ['Type/user 16', 16, 5],
  ['Type/title 20', 20, 6], ['Type/heading 24', 24, 6], ['Type/display 32', 32, 6],
  ['Type/label 13 medium', 13, 6], ['Type/base 14 medium', 14, 6], ['Type/mono 13', 13, 5]
];
var fixed = 0;
want.forEach(function (w) {
  var st = doc.sharedTextStyles.find(function (s) { return s.name === w[0]; });
  if (!st) return;
  st.style.fontFamily = w[0].indexOf('mono') >= 0 ? 'JetBrains Mono' : 'Inter';
  st.style.fontSize = w[1];
  st.style.fontWeight = w[2];
  st.style.textColor = '#1f2226';
  fixed += 1;
});
var check = doc.sharedTextStyles.find(function (s) { return s.name === 'Type/display 32'; });
console.log(JSON.stringify({ ok: true, fixed: fixed, display: { size: check.style.fontSize, family: check.style.fontFamily, weight: check.style.fontWeight } }));
