var APP="Light/Clean";var ID="activity";var BRANDS={"apple": "<svg role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Apple</title><path d=\"M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701\"/></svg>", "google": "<svg role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>Google</title><path d=\"M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z\"/></svg>"};
// Lane-local helpers; shared prelude is never modified.
var oldFrame=H.frame; H.frame=function(o){var f=oldFrame(o);if(o.align!==undefined)f.stackLayout.alignItems=o.align;return f;};
var C=function(r){return H.sw(APP,r||'ink');};
function tx(p,t,size,role,w,mono){return H.text({parent:p,text:t,size:size||14,weight:5,color:C(role),w:w,mono:!!mono});}
function col(p,n,w,g,pad){return H.frame({parent:p,name:n,dir:'col',w:w,gap:g===undefined?12:g,pad:pad||0,align:sketch.StackLayout.AlignItems.Start});}
function row(p,n,w,h,g){return H.frame({parent:p,name:n,dir:'row',w:w,h:h,gap:g===undefined?8:g,pad:0});}
function sp(p){var z=H.frame({parent:p,name:'spacer',h:1,pad:0});z.horizontalSizing=sketch.FlexSizing.Fill;return z;}
function sect(p,t,w){var r=H.frame({parent:p,name:'section',w:w,h:32,pad:{top:12,right:0,bottom:4,left:0}});H.sft({parent:r,text:t.toUpperCase(),size:11,weight:8,color:C('tertiary')});H.order(r);}
function button(p,label,target,prim,glyph,w){var b=H.frame({parent:p,name:'link:'+target,dir:'row',gap:7,pad:{top:0,right:12,bottom:0,left:12},h:30,w:w,radius:7,fill:C(prim?'accent':'surface'),border:prim?null:C('line-strong'),justify:sketch.StackLayout.JustifyContent.Center});if(glyph)H.sf(b,glyph,{size:13,color:prim?'#ffffff':C('secondary')});H.sft({parent:b,text:label,size:13,weight:7,color:prim?'#ffffff':C('ink')});H.order(b);return b;}
function composer(p,width,empty){var c=col(p,'composer',width,12,14);c.style.fills=[{color:C('surface')}];c.style.borders=[{color:C('line-strong'),thickness:1,position:sketch.Style.BorderPosition.Inside}];c.style.corners.radii=[14,14,14,14];tx(c,empty?'Ask anything, or describe a task…':'Reply…',14,'tertiary',width-28);var r=row(c,'composer-actions',width-28,28,6);H.sfBtn(r,'link:conversation--attach','plus',APP,{w:28,h:28});button(r,'Claude Fable 5.1','conversation--model',false,'cube');sp(r);H.sfBtn(r,'link:conversation--voice','mic',APP,{w:28,h:28});H.sfBtn(r,'link:conversation','arrow_up',APP,{w:28,h:28,radius:14,color:'#ffffff',fill:C('accent')});H.order(r);H.order(c);}
function file(p,path,detail){var r=row(p,'link:artifact',288,42,8);H.sf(r,'doc',{size:14,color:C('secondary'),w:18});var q=col(r,'file-label',232,2);tx(q,path,12,'ink',232,true);tx(q,detail,11,'tertiary',232);H.order(q);H.order(r);}
function normalize(s){function visit(l){if(l.name.indexOf('link:')===0)l.name=l.name.replace(/ \d+$/,'');(l.layers||[]).forEach(visit);}visit(s);}
var pageName='Proto macOS '+APP.split('/')[0];
var name='Screen/macos/'+APP+'/'+ID;
var s=H.page(pageName).layers.find(function(l){return l.name===name;});
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
