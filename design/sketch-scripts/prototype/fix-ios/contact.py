import pathlib,json
from PIL import Image,ImageDraw
p=pathlib.Path('/tmp/harso-sk/proto/lanes/fix-ios');entries=json.loads((p/'entries.json').read_text())
for j in range(0,len(entries),4):
 batch=entries[j:j+4]; files=[pathlib.Path('/tmp/harso-sk/shots')/('fix-ios-'+e['page'].split()[-1]+'-'+e['id']+'.png') for e in batch]
 if not all(f.exists() for f in files):continue
 im=Image.new('RGB',(390*len(batch),876),'#d4d4d4');d=ImageDraw.Draw(im)
 for k,(e,f) in enumerate(zip(batch,files)):
  img=Image.open(f);assert img.size==(390,844),(f,img.size)
  im.paste(img,(390*k,32));d.text((390*k+8,8),e['page'].split()[-1]+'/'+e['id'],fill='black')
 im.save(p/f'contact-{j//4:02}.png')
 print(j//4,', '.join(e['page'].split()[-1]+'/'+e['id'] for e in batch))
