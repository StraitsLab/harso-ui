import pathlib,subprocess,json,os,re
from PIL import Image,ImageDraw
p=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-ios-manage');doc=pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip()
rs=[json.loads(x.strip().strip("'")) for x in (p/'audit-live.txt').read_text().splitlines() if x.startswith("'{")];assert len(rs)==58
(p/'inventory.json').write_text(json.dumps(rs,indent=2))
for i,r in enumerate(rs):
 tag='manage-verified-'+str(i);dest=pathlib.Path('/tmp/harso-sk/shots/'+tag+'.png');r['shot']=str(dest)
 if True:
  try:q=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':doc,'layerID':r['id']})],env=dict(os.environ,SK_TAG=tag),capture_output=True,text=True,timeout=60)
  except subprocess.TimeoutExpired:
   print('TIMEOUT',r,flush=True);subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code','{"code_file":"/tmp/harso-sk/ping.js"}'],timeout=60);raise
  if q.returncode or not dest.exists():raise RuntimeError(q.stdout+q.stderr)
 print(i,r['name'],flush=True)
(p/'inventory.json').write_text(json.dumps(rs,indent=2))
for k in range(0,len(rs),4):
 batch=rs[k:k+4];sheet=Image.new('RGB',(390*len(batch),884),'#bbbbbb');d=ImageDraw.Draw(sheet)
 for j,r in enumerate(batch):
  im=Image.open(r['shot']).convert('RGB');im=im.resize((390,844));sheet.paste(im,(390*j,40));d.text((390*j+4,5),str(k+j)+' '+r['name'].replace('Screen/ios/',''),fill='black')
 sheet.save(p/('review-'+str(k//4)+'.png'))
print('EXPORTED',len(rs))
