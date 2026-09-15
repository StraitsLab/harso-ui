from pathlib import Path
from PIL import Image,ImageDraw
import sys
P=Path('/tmp/harso-sk/lanes/controls')
for fam in sys.argv[1:]:
 ims=[]
 for app in ['Light-Clean','Light-Cozy','Dark-Clean','Dark-Cozy']:
  im=Image.open('/tmp/harso-sk/shots/controls-'+fam+'-'+app+'.png').convert('RGB');im.thumbnail((900,1800)); ims.append((app,im))
 w=max(im.width for _,im in ims);h=max(im.height for _,im in ims)+24
 out=Image.new('RGB',(w*2,h*2),'#888')
 for i,(app,im) in enumerate(ims):
  x=i%2*w;y=i//2*h;out.paste(im,(x,y+24));ImageDraw.Draw(out).text((x+5,y+5),fam+' '+app,fill='white')
 path=P/('check-'+fam+'.png');out.save(path);print(path)
