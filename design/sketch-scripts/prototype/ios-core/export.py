import os,json,ast,pathlib,subprocess
r=pathlib.Path('/tmp/harso-sk/proto/lanes/ios-core');os.environ['SK_PRELUDE']='/tmp/harso-sk/proto/prelude.js';os.environ['SK_MAX']='50000'
o=subprocess.check_output(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(r/'verify.js')})],text=True)
records=[]
for l in o.splitlines():
 if l.startswith("'"):records.append(json.loads(ast.literal_eval(l)))
assert len(records)==18,len(records)
(r/'frames.json').write_text(json.dumps(records,indent=2))
for x in records:
 id=x['name'].split('/')[-1];app=x['page'].split()[-1];tag='ios-core-'+app.lower()+'-'+id;os.environ['SK_TAG']=tag
 out=subprocess.check_output(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':pathlib.Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':x['id']})],text=True);print(out,flush=True)
from PIL import Image,ImageOps,ImageDraw
for app in ['Light','Dark']:
 for group,ids in enumerate([['signin','home','conversation'],['conversation--approval','conversation--menu','conversation--delete'],['search','activity','activity--work']]):
  canvas=Image.new('RGB',(1170,884),'#dddddd');draw=ImageDraw.Draw(canvas)
  for idx,id in enumerate(ids):
   im=Image.open('/tmp/harso-sk/shots/ios-core-'+app.lower()+'-'+id+'.png').convert('RGB');im.thumbnail((390,844));canvas.paste(im,(idx*390,40));draw.text((idx*390+8,12),app+' '+id,fill='black')
  canvas.save(str(r/(app+'-review-'+str(group)+'.png')))
