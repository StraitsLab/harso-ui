from pathlib import Path
import json,sys
from PIL import Image
p=Path('/tmp/harso-sk/lanes/fix-ai-chat');rows=json.loads((p/'ledger.json').read_text())
for fam in sys.argv[1:]:
 r=[r for r in rows if r['family']==fam];imgs=[Image.open(r['shot']) for r in r];w=max(i.width for i in imgs);h=max(i.height for i in imgs);out=Image.new('RGB',(w*2,h*2),'#cccccc')
 for j,i in enumerate(imgs):out.paste(i,(j%2*w,j//2*h))
 out.save(p/(fam+'-review.png'));print(fam,w*2,h*2)
