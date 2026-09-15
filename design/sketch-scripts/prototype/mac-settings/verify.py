import pathlib,subprocess,json,os,re
P=pathlib.Path('/tmp/harso-sk/proto/lanes/mac-settings');env=os.environ.copy();env['SK_PRELUDE']='/tmp/harso-sk/proto/prelude.js';env['SK_MAX']='30000'
r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(P/'audit.js')})],env=env,text=True,capture_output=True);(P/'audit.log').write_text(r.stdout)
records=[]
for l in r.stdout.splitlines():
 l=l.strip().strip("'")
 if l.startswith('{'):records.append(json.loads(l))
assert len(records)==28,(len(records),r.stdout)
assert all(x['w']==1440 and x['h']==900 and x['y']==2120 for x in records)
(P/'frames.json').write_text(json.dumps(records,indent=2))
for x in records:
 tag='mac-settings-'+x['page'].split()[-1]+'-'+x['id'];env['SK_TAG']=tag
 z=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':x['frame']})],env=env,text=True,capture_output=True)
 print(tag,z.returncode,z.stdout.strip(),flush=True)
 if z.returncode:raise SystemExit(z.stderr)
from PIL import Image,ImageDraw
for app in ['Light','Dark']:
 rr=[x for x in records if x['page'].endswith(app)]
 rr.sort(key=lambda x:x['x'])
 for batch in range(4):
  items=rr[batch*4:(batch+1)*4]
  if not items:continue
  sheet=Image.new('RGB',(1440*2,940*((len(items)+1)//2)),'#dedede');d=ImageDraw.Draw(sheet)
  for i,x in enumerate(items):
   im=Image.open('/tmp/harso-sk/shots/mac-settings-'+app+'-'+x['id']+'.png').convert('RGB').resize((1440,900));xx=(i%2)*1440;yy=(i//2)*940;sheet.paste(im,(xx,yy+40));d.text((xx+20,yy+10),app+' / '+x['id'],fill='#111111')
  sheet.save(P/('contact-'+app+'-'+str(batch)+'.png'))
print('VERIFIED',len(records))
