import sys,pathlib,json,subprocess,os
from PIL import Image
P=pathlib.Path('/tmp/harso-sk/lanes/navigation');doc=pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip()
for fam in sys.argv[1:]:
 results=json.loads((P/(fam+'-results.json')).read_text())
 if os.environ.get('RESHOT'):
  for r in results:
   subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':r['sheet']})],env={**os.environ,'SK_TAG':pathlib.Path(r['screenshot']).stem},check=True)
 imgs=[Image.open(r['screenshot']).convert('RGB') for r in results]
 out=Image.new('RGB',(sum(im.width for im in imgs),max(im.height for im in imgs)),'#ddd');x=0
 for im in imgs:out.paste(im,(x,0));x+=im.width
 out.save(P/(fam+'-review.png'))
 print(fam,out.size)
