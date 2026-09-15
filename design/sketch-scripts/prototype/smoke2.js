var app = 'Dark/Clean';
var i = H.iosScreen({ page: 'Scratch', app: app, id: 'smoke2', x: 2000, title: 'Activity', back: true, trailing: 'search', tab: 'activity' });
H.text({ parent: i.body, text: 'Hello', size: 16, weight: 5, color: H.sw(app, 'ink') });
var s = i.finish();
H.out({ ios: String(s.id), h: s.frame.height });
