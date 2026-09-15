from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
root=Path('/tmp/harso-sk/lanes/ai-voice-workflow')
fs=['audio-player','mic-selector','persona','speech-input','transcription','voice-selector','canvas','node','edge','connection','controls','panel','toolbar','image','open-in-chat']
for i in range(0,len(fs),6):
 out=Image.new('RGB',(1440,1800),'#ddd')
 for j,f in enumerate(fs[i:i+6]):
  im=ImageOps.contain(Image.open('/tmp/harso-e/shots3/vercel-'+f+'--desktop-light.png'),(700,560))
  out.paste(im,((j%2)*720,(j//2)*600+30))
  ImageDraw.Draw(out).text(((j%2)*720+10,(j//2)*600+10),f,fill='black')
 out.save(root/('references-'+str(i//6)+'.png'))
