from pathlib import Path
import re
root=Path('/tmp/harso-sk/lanes'); out=root/'fix-ai-code-voice'
families=['Agent','Artifact','Transcription','VoiceSelector','Canvas','Node','Panel','Image']
node="""function node(p,t,state,selected){
var f=absolute(p,'work unit',252,216);
H.rect({parent:f,name:'node perimeter',x:6,y:0,w:240,h:216,fill:H.sw(APP,'surface'),border:H.sw(APP,selected?'accent':'line'),bw:selected?2:1,radius:12});
var content=H.frame({parent:f,name:'node content',dir:'col',gap:12,pad:0,w:208,align:sketch.StackLayout.AlignItems.Start});
var h=row(content);icon(h,t==='Research'?'search':t==='Result'?'file':'box');title(h,t);H.rect({parent:h,w:7,h:7,oval:true,fill:H.sw(APP,state==='running'?'positive-mark':state==='error'?'negative-mark':'tertiary')});done(h);
txt(content,state==='error'?'Could not complete this step':t==='Research'?'Supplied work unit':t==='Result'?'Illustrative result':'Live node content',13,state==='error'?'negative':'secondary',208);line(content,208);
var a=H.frame({parent:content,name:'port labels',dir:'row',w:208,gap:0,h:28});txt(a,'Input',12,'secondary',104);var ot=txt(a,'Output',12,'secondary',104);ot.style.alignment=sketch.Text.Alignment.right;done(a);chip(content,state,state==='running'?'positive':state==='error'?'negative':'tertiary');done(content);content.frame.x=22;content.frame.y=16;
[6,246].forEach(function(x,i){var z=port(f,selected);z.name=i?'output port':'input port';z.frame.x=x-6;z.frame.y=102;});return f;
}"""
for family in families:
 src=root/('ai-code' if family in ['Agent','Artifact'] else 'ai-voice-workflow')/(family+'.js')
 s=src.read_text()
 if family in ['Agent','Artifact']:
  a=s.index('var previous='); b=s.index('var sh=',a)
 else:
  a=s.index('if(page.layers.some');b=s.index('var sh=',a)
 s=s[:a]+"var oldSheet=page.layers.find(function(l){return l.name===FAMILY+' — '+APP;});if(!oldSheet)throw new Error('Missing original sheet');var y=oldSheet.frame.y;H.dropSheet(page.name,FAMILY+' — '+APP);\n"+s[b:]
 if family not in ['Agent','Artifact']:
  s=s.replace("var page =", "var baseFrame=H.frame;H.frame=function(o){var f=baseFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};\nvar page =",1)
 if family=='Agent':
  s=s.replace('Most-selected model · Research assistant','Host-selected model · Research assistant').replace('{ "summary": "string", "sources": ["source-id"] }','{ "summary": "string", "sources": ["source-id"],\\n  "uncertainties": ["string"] }')
 if family=='Artifact':
  s=s.replace("var c,r,b;","H.paths.external='<path d=\"M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6\"/>';\nvar c,r,b;")
  s=s.replace("button(r,'','download');button(r,'','maximize')","button(r,'','download');button(r,'','external')")
 if family in ['Node','Canvas']:
  a=s.index('function node(');b=s.index('function absolute(',a);s=s[:a]+node+'\n'+s[b:]
 if family=='Canvas':
  s=s.replace('curve(c,296,195,392,315', 'curve(c,296,204,392,324').replace('curve(c,632,315,728,435','curve(c,632,324,728,444')
  s=s.replace('n.frame.x=a[2];','n.frame.x=a[2]-6;')
 if family=='Transcription':
  s=s.replace("txt(r,v[2],14,i===2?'tertiary':'ink',528);", "if(i===1){var phrase=row(r,4);txt(phrase,'Work is',14,'ink');var active=H.frame({parent:phrase,name:'current phrase',dir:'row',pad:{top:2,right:4,bottom:2,left:4},radius:4,fill:H.sw(APP,'accent-soft'),border:H.sw(APP,'accent')});txt(active,'progressing.',14,'accent');done(active);done(phrase);}else txt(r,v[2],14,i===2?'tertiary':'ink',528);")
 if family=='VoiceSelector':
  s=s.replace("gap:12,w:228,radius:12","gap:12,w:228,h:192,radius:12")
  s=s.replace("button(c,'Preview','play');", "var space=H.frame({parent:c,name:'action spacer',dir:'col',w:1,h:1});space.verticalSizing=sketch.FlexSizing.Fill;button(c,'Preview','play');")
 if family=='Image':
  s=s.replace("H.rect({parent:p,x:100,y:0,w:72,h:192,fill:H.sw(APP,'surface')});", "var shimmer=H.rect({parent:p,name:'shimmer highlight',x:100,y:0,w:72,h:192,fill:H.sw(APP,'surface')});shimmer.style.opacity=0.25;")
 (out/(family+'.js')).write_text(s)
print('Prepared',len(families),'generators')
