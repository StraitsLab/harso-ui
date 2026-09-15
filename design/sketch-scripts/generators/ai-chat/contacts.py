from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
P=Path('/tmp/harso-sk/lanes/ai-chat'); rs=json.loads((P/'ledger.json').read_text())
for fam in sys.argv[1:]:
 rows=[r for r in rs if r['family']==fam and 'shot' in r]
 if len(rows)!=4:continue
 ims=[Image.open(r['shot']).convert('RGB') for r in rows]; w=max(i.width for i in ims);h=max(i.height for i in ims)
 out=Image.new('RGB',(w*2,h*2),'#777777')
 for idx,i in enumerate(ims):out.paste(i,((idx%2)*w,(idx//2)*h))
 out.save(P/(fam+'-review.png'));print(P/(fam+'-review.png'))
