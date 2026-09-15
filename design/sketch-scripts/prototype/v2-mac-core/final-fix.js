var texts=sketch.find('Text',s);
texts.filter(function(t){return t.text==='All projects'&&t.parent.name==='link:projects';}).forEach(function(t){t.frame.width=164;});
if(ID==='signin'){
texts.filter(function(t){return t.text.indexOf('By continuing,')===0;}).forEach(function(t){t.style.alignment=sketch.Text.Alignment.center;t.style.fontFamily='SF Pro';});
}
console.log(JSON.stringify({id:ID,app:APP,frame:s.id,fixed:true}));
