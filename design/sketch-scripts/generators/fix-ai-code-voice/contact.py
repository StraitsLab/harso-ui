from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import sys
root=Path('/tmp/harso-sk/lanes/fix-ai-code-voice')
for fam in sys.argv[1:]:
 ims=[Image.open('/tmp/harso-sk/shots/fix-acv-'+fam+'-'+app+'.png').convert('RGB') for app in ['Light-Clean','Light-Cozy','Dark-Clean','Dark-Cozy']]
 w=max(i.width for i in ims);h=max(i.height for i in ims)
 canvas=Image.new('RGB',(w*2,h*2),(130,130,130))
 for k,i in enumerate(ims):canvas.paste(i,((k%2)*w,(k//2)*h))
 canvas.save(root/(fam+'-review.png'));print(fam,canvas.size)
