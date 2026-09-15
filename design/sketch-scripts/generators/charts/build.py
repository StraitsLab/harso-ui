import pathlib,json,subprocess,os,sys,re
D=pathlib.Path('/tmp/harso-sk/lanes/charts'); APPS=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']
F=[('ActivityRingsCard','activity','Your activity','2026-09-07',['Move','Exercise','Running']),('AreaChartCard','area','Traffic composition','Total 18,350 · Monthly',['Organic','Referral','Paid']),('BarListCard','barlist','Bar List Card','Illustrative host values',['Stage 1','Stage 2','Stage 3']),('ComboChartCard','combo','Sessions and conversion','12,500 sessions · Conversion 3.5%',['Sessions','Conversion']),('ContributionsCard','contributions','Contributions','Activity across 20 weeks',['Less','More']),('EarningsChartCard','earnings','Earnings Chart Card','Illustrative host values',['Current','Previous']),('FunnelChartCard','funnel','Funnel Chart Card','Conversion by stage',['Conversion']),('HeatmapChartCard','heatmap','Activity patterns','Hourly activity · 7 days',['Less','More']),('LineChartCard','line','Revenue observations','Monthly · Synthetic fixtures',['Current','Previous']),('MostActiveDaysCard','days','Most Active Days Card','Illustrative dated activity',['Activity']),('OrdersChartCard','orders','Orders Chart Card','Current 0.75 · Previous 0.375',['Current','Previous']),('RadarChartCard','radar','Radar observations','Performance across five dimensions',['Performance']),('RadialChartCard','radial','Radial observations','Progress toward your target',['Complete','In progress','Remaining']),('RevenueChartCard','revenue','Revenue Chart Card','Illustrative host values',['Current','Previous']),('SankeyChartCard','sankey','Where the money goes','$3,000 · Income allocation',['Home','Everyday','Savings']),('ScatterChartCard','scatter','Effort and outcomes','Synthetic sample · 6 observations',['Research','Delivery']),('SleepScoreCard','sleep','Sleep Score Card','Last night · 0–100',['Sleep quality']),('StageBarsCard','stages','Stage Bars Card','Project delivery · Four stages',['Completed','Active']),('StepsCard','steps','Steps Card','This week · Goal 10,000',['Steps','Goal'])]
T='''
var page=H.page('Charts'); var name=CFG[0]+' — '+APP;
if(page.layers.some(l=>l.name===name)) throw Error('Sheet already exists '+name);
var ai=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'].indexOf(APP);
var previous=page.layers.filter(l=>l.name.endsWith(' — '+APP));var yy=previous.reduce((v,l)=>Math.max(v,l.frame.y+l.frame.height+80),0);
var sh=H.sheet({name:name,parent:page,x:ai*1600,y:yy,fill:H.hex(APP,'canvas-deep')});
H.text({parent:sh,text:name,size:20,weight:6,color:H.sw(APP,'ink')});
var card=H.frame({name:CFG[0]+'/'+APP+'/default',parent:sh,dir:'col',gap:16,pad:20,w:440,radius:12,fill:H.sw(APP,'surface'),border:H.sw(APP,'line'),align:sketch.StackLayout.AlignItems.Start});
var hd=H.frame({name:'header',parent:card,dir:'col',gap:6,w:400,align:sketch.StackLayout.AlignItems.Start});
H.text({parent:hd,text:CFG[2],size:14,weight:6,color:H.sw(APP,'ink'),w:400});H.text({parent:hd,text:CFG[3],size:13,color:H.sw(APP,'secondary'),w:400});H.order(hd);
if(CFG[1]==='orders'||CFG[1]==='revenue'){var metric=H.frame({name:'metric',parent:card,dir:'row',gap:16,w:400});H.text({parent:metric,text:'0.75',size:24,weight:6,color:H.sw(APP,'ink')});H.text({parent:metric,text:CFG[1]==='orders'?'↑ +100%':'Change +12%',size:12,weight:6,color:H.sw(APP,'positive')});H.order(metric);}
var pl=sketch.createLayerFromData(plot(CFG[1]),'svg');pl.name='vector plot';pl.parent=card;pl.frame.width=400;pl.frame.height=212;
var ft=H.frame({name:'legend',parent:card,dir:'row',gap:8,w:400});CFG[4].forEach((v,i)=>{var chip=H.frame({name:'legend chip',parent:ft,dir:'row',gap:6,pad:{top:4,right:8,bottom:4,left:8},radius:999,fill:H.sw(APP,'hover')});H.rect({parent:chip,w:6,h:6,oval:true,fill:H.sw(APP,['accent','positive-mark','attention-mark'][i%3])});H.text({parent:chip,text:v,size:12,weight:6,color:H.sw(APP,'secondary')});H.order(chip);});H.order(ft);H.order(card);H.order(sh);H.relayout(sh);var made=H.symbolize(sh,new RegExp('^'+CFG[0]+'/'));H.out({family:CFG[0],app:APP,sheet:String(sh.id),made:made,h:sh.frame.height,y:sh.frame.y});
'''
def call(tool,args,tag=None):
 e=os.environ.copy()
 if tag:e['SK_TAG']=tag
 p=subprocess.run(['python3','/tmp/harso-sk/sk.py',tool,json.dumps(args)],capture_output=True,text=True,env=e)
 if p.returncode:raise RuntimeError(p.stdout+p.stderr)
 return p.stdout
for ix in map(int,sys.argv[1:]):
 cfg=F[ix]; path=D/(cfg[0]+'.js'); results=[]
 for app in APPS:
  path.write_text('var APP = '+json.dumps(app)+';\nvar CFG = '+json.dumps(cfg)+';\n'+(D/'plot.js').read_text()+T)
  out=call('run_code',{'code_file':str(path)});print(out,flush=True)
  m=re.search(r'\{.*\}',out);r=json.loads(m.group(0));tag='charts-'+cfg[0]+'-'+app.replace('/','-')
  shot=call('get_screenshot',{'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':r['sheet']},tag);print(shot,flush=True)
  r['screenshot']='/tmp/harso-sk/shots/'+tag+'.png';results.append(r)
  with (D/'results.jsonl').open('a') as f:f.write(json.dumps(r)+'\n')
 with (D/'REPORT.md').open('a') as f:
  f.write('\n## '+cfg[0]+'\n')
  for r in results:f.write('- '+r['app']+': sheet `'+r['sheet']+'`; '+str(len(r['made']))+' symbol; screenshot `'+r['screenshot']+'`.\n')
  f.write('- Build and screenshot captured. Visual gate pending.\n')
