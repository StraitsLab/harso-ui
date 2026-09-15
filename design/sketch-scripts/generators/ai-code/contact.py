from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
p=Path('/tmp/harso-sk/lanes/ai-code');data=json.loads((p/'ledger.json').read_text())
for fam in sys.argv[1:]:
 ds=[d for d in data if d['family']==fam]
 if len(ds)!=4 or not all(Path(d['screenshot']).exists() for d in ds):continue
 ims=[Image.open(d['screenshot']).convert('RGB') for d in ds]; w=max(im.width for im in ims);h=max(im.height for im in ims)
 out=Image.new('RGB',(w*2,h*2),'#ddd')
 for i,im in enumerate(ims):out.paste(im,((i%2)*w,(i//2)*h))
 out.save(p/(fam+'-review.png'));print(fam,str(out.size))
