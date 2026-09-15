import pathlib,subprocess,os,json,re,sys
p=pathlib.Path('/tmp/harso-sk/proto/lanes/v2-ios-manage'); src=(p/'generator.js').read_text(); ids=re.search(r"var ids=(\[.*?\]);",src).group(1); ids=json.loads(ids.replace("'",'"'))
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude2.js')
for app in sys.argv[1:]:
 for id in ids:
  done=[json.loads(x) for x in (p/'frames.jsonl').read_text().splitlines()] if (p/'frames.jsonl').exists() else []
  if any(r['id']==id and r['app']==app for r in done):continue
  script=p/(id+'.js');script.write_text('var APP='+json.dumps(app)+';var ID='+json.dumps(id)+';\n'+src)
  result=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(script)})],env=env,capture_output=True,text=True)
  print(result.stdout,flush=True)
  if result.returncode or 'Error:' in result.stdout: raise RuntimeError(result.stderr+result.stdout)
  record=json.loads(re.search(r'\{.*\}',result.stdout).group())
  with (p/'frames.jsonl').open('a') as f:f.write(json.dumps(record)+'\n')
