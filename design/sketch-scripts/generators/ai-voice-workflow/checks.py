from PIL import Image,ImageDraw,ImageOps
from pathlib import Path
import json,sys
root=Path('/tmp/harso-sk/lanes/ai-voice-workflow')
data=json.loads((root/'ledger.json').read_text())
for fam in sys.argv[1:]:
 ds=[d for d in data if d['family']==fam]
 ims=[Image.open(d['shot']) for d in ds]
 w=max(im.width for im in ims);h=max(im.height for im in ims)
 out=Image.new('RGB',(w*2,(h+24)*2),'#999')
 for i,im in enumerate(ims):
  x=(i%2)*w;y=(i//2)*(h+24)
  out.paste(im,(x,y+24));ImageDraw.Draw(out).text((x+8,y+5),ds[i]['app'],fill='black')
 out.save(root/('check-'+fam+'.png'))
 print(fam,out.size)
