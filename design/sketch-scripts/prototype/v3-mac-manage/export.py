import json,pathlib,subprocess,os,shutil
from PIL import Image,ImageDraw
P=pathlib.Path('/tmp/harso-sk/proto/lanes/v3-mac-manage');rs=json.loads((P/'frames.json').read_text())
for r in rs:
 tag='v3-mac-manage-verified-'+r['app'].split('/')[0]+'-'+r['id']
 o=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['frame']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True,timeout=60)
 if o.returncode:raise RuntimeError(o.stdout+o.stderr)
 dest=P/(tag+'.png');shutil.copy('/tmp/harso-sk/shots/'+tag+'.png',dest)
 assert Image.open(dest).size==(1440,900),(tag,Image.open(dest).size)
 print(tag,flush=True)
for app in ['Light','Dark']:
 subset=[r for r in rs if r['app'].startswith(app)]
 im=Image.new('RGB',(1440,((len(subset)+1)//2)*480),'#dddddd');d=ImageDraw.Draw(im)
 for i,r in enumerate(subset):
  src=Image.open(P/('v3-mac-manage-verified-'+app+'-'+r['id']+'.png'));src.thumbnail((720,450));x=i%2*720;y=i//2*480;im.paste(src,(x,y+26));d.text((x+12,y+6),r['id'],fill='black')
 im.save(P/(app+'-contact.png'))
