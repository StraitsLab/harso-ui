from pathlib import Path
import subprocess,os,json,re,time
root=Path('/tmp/harso-sk/proto/lanes/mac-manage');seen=set()
while len(seen)<22:
 lines=(root/'build.log').read_text().splitlines()
 for line in lines:
  try:r=json.loads(line.strip("'"))
  except:continue
  if not isinstance(r,dict) or 'frame' not in r:continue
  key=r['app']+r['id']
  if key in seen:continue
  tag='manage-'+r['app'].split('/')[0]+'-'+r['id']
  p=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':Path('/tmp/harso-sk/doc.id').read_text().strip(),'layerID':r['frame']})],env={**os.environ,'SK_TAG':tag},capture_output=True,text=True)
  print(tag,p.stdout,flush=True)
  if p.returncode:raise RuntimeError(p.stderr)
  seen.add(key)
 if len(seen)<22:time.sleep(5)
print('Screenshots complete:',len(seen))
