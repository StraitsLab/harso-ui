from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json,sys,subprocess,os
P=Path('/tmp/harso-sk/lanes/display'); rows=[json.loads(s) for s in (P/'results.jsonl').read_text().splitlines()]
for fam in sys.argv[1:]:
 rr=[x for x in rows if x['family']==fam]
 if len(rr)!=4: continue
 if fam=='Avatar':
  for r in rr: subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['sheet']})],env=dict(os.environ,SK_TAG='display-'+fam+'-'+r['app'].replace('/','-')),check=True)
 ims=[Image.open(r['screenshot']).convert('RGB') for r in rr]; w=max(i.width for i in ims);h=max(i.height for i in ims)
 out=Image.new('RGB',(2*w,2*h),'#777777')
 for n,i in enumerate(ims):out.paste(i,((n%2)*w,(n//2)*h))
 out.save(P/(fam+'-review.png')); print(fam,out.size)
