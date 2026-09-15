// Lane-local final refinements: preserve all screen frame IDs.
var groups=sketch.find('Group',s);
if(ID==='signin'){
var card=groups.find(function(l){return l.name==='authentication';});
var brands=BRANDS;
['Apple','Google'].forEach(function(brand){var b=card.layers.find(function(l){return l.layers&&l.layers.some(function(t){return t.text==='Continue with '+brand;});});var old=b.layers.find(function(l){return l.name.indexOf('sf:')===0;});if(old)old.remove();var svg=brands[brand.toLowerCase()].replace('<svg ','<svg fill="'+H.hex(APP,'ink')+'" ');var icon=sketch.createLayerFromData(svg,'svg');icon.name='brand:'+brand;icon.parent=b;icon.frame.width=14;icon.frame.height=14;icon.index=b.layers.length-1;b.frame.height=32;b.stackLayout.apply();});
var win=groups.find(function(l){return l.name==='auth-window';});win.style.shadows=[{color:'#00000050',blur:36,x:0,y:16},{color:'#00000025',blur:3,x:0,y:1}];
}
if(ID.indexOf('activity')===0){var main=groups.find(function(l){return l.name==='main';});main.layers.filter(function(l){return l.type==='ShapePath'&&l.frame.height===1;}).forEach(function(l){l.frame.width-=48;l.horizontalSizing=sketch.FlexSizing.Fixed;});}
normalize(s);console.log(JSON.stringify({id:ID,app:APP,frame:s.id,refined:true}));
