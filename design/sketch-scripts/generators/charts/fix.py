import pathlib,json,subprocess,os,sys
D=pathlib.Path('/tmp/harso-sk/lanes/charts'); rows=[json.loads(x) for x in (D/'results.jsonl').read_text().splitlines()]
families=sys.argv[1:]
for r in rows:
 if r['family'] not in families:continue
 p=D/(r['family']+'.js');old=p.read_text();cfg=json.loads(old.split('var CFG = ')[1].split(';\n')[0]);p.write_text(old[:old.index('var C=')]+(D/'plot.js').read_text()+old[old.index('var page='):])
 code='var APP = '+json.dumps(r['app'])+';\n'+(D/'plot.js').read_text()+'''\nvar sh=sketch.find('#'''+r['sheet']+'''',doc)[0]; var card=sh.layers.find(l=>l.type==='SymbolMaster');var old=card.layers.find(l=>l.name==='vector plot');var idx=old.index;var l=sketch.createLayerFromData(plot('''+json.dumps(cfg[1])+'''),'svg');l.name='vector plot';l.parent=card;l.frame.width=400;l.frame.height=212;l.index=idx;old.remove();H.relayout(sh);H.out({sheet:String(sh.id),symbol:String(card.id),plot:String(l.id),children:card.layers.length});'''
 target=D/'fix-current.js';target.write_text(code)
 out=subprocess.run(['python3','/tmp/harso-sk/sk.py','run_code',json.dumps({'code_file':str(target)})],capture_output=True,text=True);print(out.stdout,flush=True)
 if out.returncode:raise Exception(out.stderr+out.stdout)
 env=os.environ.copy();env['SK_TAG']=pathlib.Path(r['screenshot']).stem
 out=subprocess.run(['python3','/tmp/harso-sk/sk.py','get_screenshot',json.dumps({'targetDocumentID':'40E7AE0D-B568-476B-9630-D3AB62280DBE','layerID':r['sheet']})],capture_output=True,text=True,env=env);print(out.stdout,flush=True)
 if out.returncode:raise Exception(out.stderr+out.stdout)
