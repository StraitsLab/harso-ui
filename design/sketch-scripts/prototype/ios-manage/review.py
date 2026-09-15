from PIL import Image,ImageDraw
import json,pathlib
R=pathlib.Path('/tmp/harso-sk/proto/lanes/ios-manage');L=json.loads((R/'ledger.json').read_text())
for app in ['Light','Dark']:
 es=[x for x in L if x['app'].startswith(app)]
 for batch in range(0,len(es),7):
  subset=es[batch:batch+7];im=Image.new('RGB',(390*len(subset),884),'#dddddd');d=ImageDraw.Draw(im)
  for j,e in enumerate(subset):
   p=pathlib.Path('/tmp/harso-sk/shots')/('ios-manage-'+app+'-'+e['id']+'.png')
   assert p.exists(),p
   im.paste(Image.open(p),(390*j,40));d.text((390*j+8,12),e['id'],fill='black')
  im.save(R/(f'review-{app}-{batch//7}.png'))
print('Contact sheets ready')
