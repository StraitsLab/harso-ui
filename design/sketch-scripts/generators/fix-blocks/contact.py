from PIL import Image,ImageDraw
from pathlib import Path
import sys
root=Path('/tmp/harso-sk/lanes/fix-blocks')
for fam in sys.argv[1:]:
 files=[Path('/tmp/harso-sk/shots')/('fix-blocks-'+fam+'-'+a+'.png') for a in ['Light-Clean','Light-Cozy','Dark-Clean','Dark-Cozy']]
 ims=[Image.open(f).convert('RGB') for f in files]
 scale=min(1,1000/max(i.width for i in ims));ims=[i.resize((int(i.width*scale),int(i.height*scale))) for i in ims]
 w=max(i.width for i in ims);h=max(i.height for i in ims);out=Image.new('RGB',(w*2,h*2),(210,210,210))
 for i,im in enumerate(ims):out.paste(im,((i%2)*w,(i//2)*h))
 out.save(root/(fam+'-check.png'))
 print(root/(fam+'-check.png'))
