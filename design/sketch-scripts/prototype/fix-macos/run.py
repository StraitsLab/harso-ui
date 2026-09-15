import os,sys,json,subprocess,pathlib
D=pathlib.Path('/tmp/harso-sk/proto/lanes/fix-macos')
env=dict(os.environ,SK_PRELUDE='/tmp/harso-sk/proto/prelude.js',SK_MAX='20000')
name=sys.argv[1]; target=sys.argv[2] if len(sys.argv)>2 else name
p=D/('run-'+target+'.js');p.write_text((D/'repair-lib.js').read_text()+'\nvar TARGET='+json.dumps(target)+';\n'+(D/('repair-'+name+'.js')).read_text())
r=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(p)})],env=env,text=True,capture_output=True)
(D/('result-'+target+'.log')).write_text(r.stdout+r.stderr)
print(r.stdout,r.stderr)
if r.returncode or 'Error:' in r.stdout:sys.exit(1)
