from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import sys
P=Path('/tmp/harso-sk/lanes/fix-display-nav')
for f in sys.argv[1:]:
 imgs=[]
 for app in ['Light-Clean','Dark-Clean','Light-Cozy','Dark-Cozy']:
  im=Image.open('/tmp/harso-sk/shots/fix-dn-'+f+'-'+app+'.png').convert('RGB');im.thumbnail((1100,1600));imgs.append(im)
 w=max(i.width for i in imgs);h=max(i.height for i in imgs);out=Image.new('RGB',(w*2,h*2),(125,125,125))
 for n,im in enumerate(imgs):out.paste(im,((n%2)*w,(n//2)*h))
 out.save(P/(f+'-review.png'));print(f,out.size)
