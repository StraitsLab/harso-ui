from PIL import Image,ImageOps,ImageDraw
import json,sys,pathlib
D=pathlib.Path('/tmp/harso-sk/lanes/blocks'); data=json.loads((D/'ledger.json').read_text());start=int(sys.argv[1]);end=int(sys.argv[2]);ds=data[start:end]; W=int(sys.argv[3]) if len(sys.argv)>3 else 640; H=int(sys.argv[4]) if len(sys.argv)>4 else 800
out=Image.new('RGB',(4*W,((len(ds)+3)//4)*H),'#888888'); d=ImageDraw.Draw(out)
for i,r in enumerate(ds):
 im=ImageOps.contain(Image.open(r['screenshot']),(W-8,H-30));out.paste(im,((i%4)*W,(i//4)*H+25));d.text(((i%4)*W+8,(i//4)*H+4),r['family']+' '+r['appearance'],fill='white')
out.save(str(D/('check-'+str(start)+'-'+str(end)+'.png')))
