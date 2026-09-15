from PIL import Image,ImageDraw
from pathlib import Path
import sys
P=Path('/tmp/harso-sk/lanes/fix-controls')
for fam in sys.argv[1:]:
 apps=['Light/Clean','Light/Cozy','Dark/Clean','Dark/Cozy'];ims=[Image.open('/tmp/harso-sk/shots/fix-controls-'+fam+'-'+a.replace('/','-')+'.png').convert('RGB') for a in apps];w=max(i.width for i in ims);h=max(i.height for i in ims);out=Image.new('RGB',(w*2,(h+28)*2),'#888888');d=ImageDraw.Draw(out)
 for n,im in enumerate(ims):x=n%2*w;y=n//2*(h+28);out.paste(im,(x,y+28));d.text((x+8,y+7),apps[n],fill='white')
 out.save(P/('check-'+fam+'.png'));print(fam,out.size)
