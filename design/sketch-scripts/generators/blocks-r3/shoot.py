from pathlib import Path
import json,subprocess,os
from PIL import Image,ImageOps,ImageDraw
p=Path('/tmp/harso-sk/lanes/blocks-r3');d=json.loads((p/'ledger.json').read_text())
for x in d:
 tag='blocks-r3-'+x['family']+'-'+x['appearance'].replace('/','-')
 subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':x['sheet']})],env={**os.environ,'SK_TAG':tag},check=True)
for family in sorted(set(x['family'] for x in d)):
 xs=[x for x in d if x['family']==family];ims=[]
 for x in xs:
  im=Image.open(x['screenshot']).convert('RGB');im.thumbnail((672,1200));ims.append(im)
 canvas=Image.new('RGB',(sum(i.width for i in ims),max(i.height for i in ims)), '#888888');xx=0
 for im in ims:canvas.paste(im,(xx,0));xx+=im.width
 canvas.save(p/(family+'-four.png'))
print('DONE',len(d))
