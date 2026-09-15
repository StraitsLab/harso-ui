from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json
B=Path('/tmp/harso-sk/lanes/fix-charts'); rows=[json.loads(l) for l in (B/'results.jsonl').read_text().splitlines()]
for family in sorted(set(x['family'] for x in rows)):
 rs={r['app']:r for r in rows if r['family']==family}
 ims=[]
 for app in ['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy']:
  if app not in rs:break
  p=Path('/tmp/harso-sk/shots')/(rs[app]['tag']+'.png')
  if not p.exists():break
  im=Image.open(p).convert('RGB'); im.thumbnail((1064,700));ims.append(im)
 if len(ims)!=4:continue
 w=max(i.width for i in ims);h=max(i.height for i in ims);out=Image.new('RGB',(w*2,h*2),'#888888')
 for n,im in enumerate(ims):out.paste(im,(n%2*w,n//2*h))
 out.save(B/(family+'-review.png'));print(family,out.size)
