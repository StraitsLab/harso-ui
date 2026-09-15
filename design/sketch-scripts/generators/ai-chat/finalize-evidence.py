import json,subprocess,re,os
from pathlib import Path
from PIL import Image
P=Path('/tmp/harso-sk/lanes/ai-chat')
rs=json.loads((P/'shell-ledger.json').read_text())
for r in rs:
 if r['width']==390:continue
 tag='ai-Shell-'+r['app'].replace('/','-')+'-'+str(r['width'])
 o=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['sheet']})],capture_output=True,text=True,env=dict(os.environ,SK_TAG=tag));print(o.stdout,flush=True)
 if o.returncode:raise RuntimeError(o.stdout)
for w in [1440,1024]:
 ims=[Image.open(r['shot']).convert('RGB') for r in rs if r['width']==w];out=Image.new('RGB',(w*2,1800),'#888888')
 for n,i in enumerate(ims):out.paste(i,((n%2)*w,(n//2)*900))
 out.save(P/('Shell-'+str(w)+'-review.png'))
r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(P/'audit.js')})],capture_output=True,text=True,env=dict(os.environ,SK_MAX='1000000'));data=json.loads(re.search(r'\{.*\}',r.stdout).group());(P/'audit.json').write_text(json.dumps(data,indent=2));print('sheets',len(data['rows']),'symbols',sum(len(x['symbols']) for x in data['rows']),'overflow',sum(len(x['overflow']) for x in data['rows']))
def lum(h):
 a=[int(h[i:i+2],16)/255 for i in [1,3,5]];a=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a];return sum(x*y for x,y in zip(a,[.2126,.7152,.0722]))
for c in data['colors']:
 print(c['app'],{r:round((max(lum(c[r]),lum(c['surface']))+.05)/(min(lum(c[r]),lum(c['surface']))+.05),2) for r in ['secondary','tertiary','negative']})
